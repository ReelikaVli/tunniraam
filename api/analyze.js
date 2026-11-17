export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const primary = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const models = [primary, "openai/gpt-oss-20b", "qwen/qwen3.8-27b"].filter((m, i, a) => a.indexOf(m) === i);

  try {
    let response;
    let data;
    let sawRate = false;
    let allDay = true;
    for (const model of models) {
      response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: req.body.system },
            { role: "user", content: req.body.messages[0].content },
          ],
          max_tokens: 4000,
          temperature: 0,
          seed: 7,
        }),
      });
      data = await response.json();
      if (response.ok) break;
      if (response.status === 429) {
        sawRate = true;
        const msg = String(data?.error?.message || "");
        if (!/per day|\(TPD\)|\(RPD\)/i.test(msg)) allDay = false;
        continue;
      }
      if (response.status === 404) {
        allDay = false;
        continue;
      }
      break;
    }

    if (!response.ok) {
      if (sawRate) {
        return res.status(429).json({ error: { message: allDay ? "rate_day" : "rate_minute" } });
      }
      return res.status(response.status).json(data);
    }
    const text = data.choices?.[0]?.message?.content || "";
    res.status(200).json({ content: [{ type: "text", text }] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
