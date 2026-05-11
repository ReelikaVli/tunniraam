import { useState, useRef } from "react";

const SYSTEM_PROMPT = `Sa oled refleksiooni assistent. Analüüsi õpetaja tunni kirjeldust tunniraami põhjal. Vasta AINULT JSON-na, ilma markdown-märgenditeta.

Tunniraami plokid:
1. Häälestus ja fookus
2. Aktiivne õppimine ja teadmiste loomine
3. Õppimise mõtestamine ja toetamine
4. Kokkuvõte ja edasi liikumine
5. Õppimist toetav rütm ja keskkond

Tagasta täpselt see JSON struktuur (eesti keeles, lühikesed vastused):
{"sections":[{"id":1,"tugevused":"...","tahelepanu":"...","idee":"..."},{"id":2,"tugevused":"...","tahelepanu":"...","idee":"..."},{"id":3,"tugevused":"...","tahelepanu":"...","idee":"..."},{"id":4,"tugevused":"...","tahelepanu":"...","idee":"..."},{"id":5,"tugevused":"...","tahelepanu":"...","idee":"..."}],"kokkuvote":{"tugevus":"...","kognitiivne_risk":"...","kaasamine_risk":"...","jarmine_samm":"..."}}

Täida iga "..." reaalse lühikese vastusega eesti keeles. Ole konkreetne ja toetav. Ära moraliseeri.`;

const SECTIONS = [
  { title: "Häälestus ja fookus", color: "#f89521", text: "#fff", bg: "#fff9f0", border: "#f8b96e" },
  { title: "Aktiivne õppimine ja teadmiste loomine", color: "#8ec641", text: "#1A3C08", bg: "#f4fae8", border: "#a2d464" },
  { title: "Õppimise mõtestamine ja toetamine", color: "#3b6530", text: "#fff", bg: "#f0f5ec", border: "#64a055" },
  { title: "Kokkuvõte ja edasi liikumine", color: "#c07820", text: "#fff", bg: "#fff8ee", border: "#e4aa5f" },
  { title: "Õppimist toetav rütm ja keskkond", color: "#5a8a35", text: "#fff", bg: "#f2f7ed", border: "#76b252" },
];

function Row({ icon, label, text, color }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
      <span style={{ color, fontSize: 14, minWidth: 18, marginTop: 2, flexShrink: 0 }}>{icon}</span>
      <div style={{ lineHeight: 1.6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 6 }}>{label}</span>
        <span style={{ fontSize: 14, color: "#2d2d2b" }}>{text}</span>
      </div>
    </div>
  );
}

export default function App() {
  const [text, setText] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const resultsRef = useRef(null);

  const analyze = async () => {
    if (!text.trim() || text.trim().length < 40) {
      setError("Kirjelda tundi vähemalt paari lausega.");
      return;
    }
    setError("");
    setLoading(true);
    setResults(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Tunni kirjeldus: ${text}` }],
        }),
      });

      const responseText = await res.text();
      if (!res.ok) {
        setError(`Viga (${res.status}): ${responseText.slice(0, 200)}`);
        setLoading(false);
        return;
      }

      const data = JSON.parse(responseText);
      const raw = data.content?.find(b => b.type === "text")?.text || "";
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        setError("Vastus ei sisaldanud oodatud formaati. Proovi uuesti.");
        setLoading(false);
        return;
      }
      setResults(JSON.parse(jsonMatch[0]));
    } catch (e) {
      setError(`Päring ebaõnnestus: ${e.message}`);
    }
    setLoading(false);
  };

  const savePDF = async () => {
    if (!resultsRef.current) return;
    setSaving(true);
    try {
      if (!window.html2pdf) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
          s.onload = resolve;
          s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      await window.html2pdf()
        .set({
          margin: [12, 12, 12, 12],
          filename: `tunniraami-analyys-${new Date().toISOString().slice(0, 10)}.pdf`,
          image: { type: "jpeg", quality: 0.97 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(resultsRef.current)
        .save();
    } catch (e) {
      setError(`PDF viga: ${e.message}`);
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", fontFamily: "Georgia, serif", color: "#2d2d2b", padding: "2rem 1.25rem 3rem" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#3b6530" }}>Tunniraami peegel</h1>
          <span style={{ fontSize: 12, color: "#bbb", fontFamily: "sans-serif" }}>Nissi kool</span>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "#666", lineHeight: 1.6, fontFamily: "sans-serif" }}>
          Kirjelda planeeritavat või toimunud tundi. Rakendus aitab märgata tugevusi, puuduvaid osi ja järgmisi samme.
        </p>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Näiteks: Planeerin 6. klassi loodusõpetuse tunni fotosünteesist. Alustan küsimusega, mida õpilased juba teavad…"
        style={{
          width: "100%", minHeight: 150, padding: "14px 16px", fontSize: 14,
          fontFamily: "sans-serif", borderRadius: 10, border: "1.5px solid #d4d0c8",
          resize: "vertical", boxSizing: "border-box", lineHeight: 1.65,
          color: "#2d2d2b", background: "#fafaf7", outline: "none",
        }}
      />

      {error && (
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "#b03020", fontFamily: "sans-serif" }}>{error}</p>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={analyze} disabled={loading} style={{
          padding: "10px 26px", background: loading ? "#9aac94" : "#3b6530",
          color: "white", border: "none", borderRadius: 8, fontSize: 14,
          cursor: loading ? "not-allowed" : "pointer", fontWeight: 500, fontFamily: "sans-serif",
        }}>
          {loading ? "Analüüsin…" : "Analüüsi tundi"}
        </button>

        {results && (
          <button onClick={savePDF} disabled={saving} style={{
            padding: "10px 20px", background: "white", color: "#3b6530",
            border: "1.5px solid #3b6530", borderRadius: 8, fontSize: 14,
            cursor: saving ? "not-allowed" : "pointer", fontWeight: 500, fontFamily: "sans-serif",
          }}>
            {saving ? "Salvestab…" : "↓ Salvesta PDF"}
          </button>
        )}
      </div>

      {loading && (
        <p style={{ fontSize: 13, color: "#888", marginTop: 16, fontFamily: "sans-serif" }}>
          Loen kirjeldust ja koostan tagasisidet…
        </p>
      )}

      {results && (
        <div ref={resultsRef} style={{ marginTop: 36 }}>
          <div style={{ marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid #e0ddd5" }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "#3b6530" }}>Tunniraami peegel</p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#aaa", fontFamily: "sans-serif" }}>
              Nissi kool · {new Date().toLocaleDateString("et-EE")}
            </p>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {results.sections?.map((sec, i) => {
              const s = SECTIONS[i] || SECTIONS[0];
              return (
                <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${s.border}` }}>
                  <div style={{ background: s.color, color: s.text, padding: "9px 16px", fontSize: 13, fontWeight: 600, fontFamily: "sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    {s.title}
                  </div>
                  <div style={{ padding: "14px 16px 6px", background: s.bg }}>
                    <Row icon="✓" label="Toimib" text={sec.tugevused} color="#3b6530" />
                    <Row icon="↗" label="Tähelepanu" text={sec.tahelepanu} color="#8A4800" />
                    <Row icon="→" label="Idee" text={sec.idee} color="#1A3C70" />
                  </div>
                </div>
              );
            })}
          </div>

          {results.kokkuvote && (
            <div style={{ marginTop: 16, borderRadius: 10, overflow: "hidden", border: "2px solid #3b6530" }}>
              <div style={{ background: "#3b6530", color: "white", padding: "10px 16px", fontSize: 13, fontWeight: 600, fontFamily: "sans-serif" }}>
                Kokkuvõte
              </div>
              <div style={{ padding: "14px 16px 6px", background: "#f0f5ec" }}>
                <Row icon="★" label="Tugevus" text={results.kokkuvote.tugevus} color="#3b6530" />
                <Row icon="⚡" label="Kognitiivne risk" text={results.kokkuvote.kognitiivne_risk} color="#8A4800" />
                <Row icon="◎" label="Kaasamise risk" text={results.kokkuvote.kaasamine_risk} color="#8A4800" />
                <Row icon="▶" label="Järgmine samm" text={results.kokkuvote.jarmine_samm} color="#1A3C70" />
              </div>
            </div>
          )}

          <p style={{ marginTop: 16, fontSize: 11, color: "#ccc", fontFamily: "sans-serif", lineHeight: 1.5 }}>
            Tunniraami peegel ei hinda õpetajat. Tagasiside põhineb kirjeldatu analüüsil.
          </p>
        </div>
      )}
    </div>
  );
}
