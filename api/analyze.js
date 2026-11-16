export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: req.body.system },
          { role: "user", content: req.body.messages[0].content },
        ],
        max_tokens: 6000,
        temperature: 0,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    const text = data.choices?.[0]?.message?.content || "";
    res.status(200).json({ content: [{ type: "text", text }] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
