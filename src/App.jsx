import { useState, useRef } from "react";
import { SYSTEM_PROMPT } from "./prompt.js";

const SECTIONS = [
  { short: "Häälestus", title: "Häälestus ja fookus", color: "#f89521", text: "#fff", bg: "#fff9f0", border: "#f8b96e" },
  { short: "Aktiivne õppimine", title: "Aktiivne õppimine ja teadmiste loomine", color: "#8ec641", text: "#1A3C08", bg: "#f4fae8", border: "#a2d464" },
  { short: "Mõtestamine", title: "Õppimise mõtestamine ja toetamine", color: "#3b6530", text: "#fff", bg: "#f0f5ec", border: "#64a055" },
  { short: "Kokkuvõte", title: "Kokkuvõte ja edasi liikumine", color: "#c07820", text: "#fff", bg: "#fff8ee", border: "#e4aa5f" },
  { short: "Rütm ja keskkond", title: "Õppimist toetav rütm ja keskkond", color: "#5a8a35", text: "#fff", bg: "#f2f7ed", border: "#76b252" },
];

// IKAP-i tasemed, kuvamise järjekord I, K, A, P. Pruun skaala, et mitte segi minna plokkide koolivärvidega.
const IKAP_ORDER = ["I", "K", "A", "P"];
const IKAP = {
  I: { nimi: "Interaktiivne", seletus: "arutavad ja täiendavad üksteist", bg: "#5b3a29", fg: "#ffffff", dot: "#ffffff30", ring: "#5b3a29" },
  K: { nimi: "Konstruktiivne", seletus: "loovad oma sõnadega", bg: "#9a6b45", fg: "#ffffff", dot: "#ffffff30", ring: "#9a6b45" },
  A: { nimi: "Aktiivne", seletus: "teevad midagi, valivad infot", bg: "#d8c29a", fg: "#4a3414", dot: "#ffffff80", ring: "#d8c29a" },
  P: { nimi: "Passiivne", seletus: "kuulavad, vaatavad, loevad", bg: "#efe9dc", fg: "#6b5f48", dot: "#ffffffaa", ring: "#d8cfba" },
};

function normalizeIkap(ikap) {
  return ((ikap && ikap.tegevused) || [])
    .map(t => ({
      nimi: String(t.nimi || "").trim(),
      tase: String(t.tase || "").trim().toUpperCase().charAt(0),
      plokk: parseInt(t.plokk, 10) || 0,
      pohjus: String(t.pohjus || "").trim(),
    }))
    .filter(t => t.nimi && IKAP[t.tase]);
}

function IkapBubble({ tase, size = 24 }) {
  return (
    <span style={{ background: IKAP[tase].bg, color: IKAP[tase].fg, width: size, height: size, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(size * 0.5), fontWeight: 700, fontFamily: "sans-serif", flexShrink: 0, border: `1px solid ${IKAP[tase].ring}`, boxSizing: "border-box" }}>{tase}</span>
  );
}

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

function IkapCard({ tegevused, markus }) {
  const counts = { I: 0, K: 0, A: 0, P: 0 };
  tegevused.forEach(t => { counts[t.tase] += 1; });
  const total = tegevused.length;
  const th = { textAlign: "left", fontSize: 11, fontWeight: 700, color: "#8a7d66", textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 8px 6px 0", fontFamily: "sans-serif" };

  return (
    <div style={{ marginBottom: 14, borderRadius: 10, overflow: "hidden", border: "1px solid #d8cfba" }}>
      <div style={{ background: "#5b3a29", color: "white", padding: "9px 16px", fontSize: 13, fontWeight: 600, fontFamily: "sans-serif" }}>
        IKAP: kuidas õpilased tunnis tegutsevad
      </div>
      <div style={{ padding: "14px 16px 8px", background: "#fbf8f1" }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8, marginBottom: 14 }}>
          {IKAP_ORDER.map(k => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <IkapBubble tase={k} />
              <span style={{ lineHeight: 1.3, fontFamily: "sans-serif" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#2d2d2b", display: "block" }}>{IKAP[k].nimi}</span>
                <span style={{ fontSize: 11, color: "#8a7d66" }}>{IKAP[k].seletus}</span>
              </span>
            </div>
          ))}
        </div>

        {total > 0 ? (
          <>
            <div style={{ display: "flex", height: 26, borderRadius: 13, overflow: "hidden", marginBottom: 14, border: "1px solid #d8cfba" }}>
              {IKAP_ORDER.filter(k => counts[k] > 0).map(k => (
                <div key={k} style={{ flex: counts[k], background: IKAP[k].bg, color: IKAP[k].fg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, fontFamily: "sans-serif" }}>
                  {k} {counts[k]}
                </div>
              ))}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12, fontFamily: "sans-serif" }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: 36 }}>Tase</th>
                  <th style={th}>Tegevus</th>
                  <th style={{ ...th, width: 120 }}>Tunniraami plokk</th>
                </tr>
              </thead>
              <tbody>
                {tegevused.map((t, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #e8e1d0" }}>
                    <td style={{ padding: "8px 8px 8px 0", verticalAlign: "top" }}><IkapBubble tase={t.tase} size={22} /></td>
                    <td style={{ padding: "8px 8px 8px 0", verticalAlign: "top", lineHeight: 1.45 }}>
                      <span style={{ fontSize: 13, color: "#2d2d2b", display: "block" }}>{t.nimi}</span>
                      {t.pohjus && <span style={{ fontSize: 12, color: "#8a7d66" }}>{t.pohjus}</span>}
                    </td>
                    <td style={{ padding: "8px 0", verticalAlign: "top", fontSize: 12, color: "#6b5f48", lineHeight: 1.4 }}>
                      {SECTIONS[t.plokk - 1] ? `${t.plokk}. ${SECTIONS[t.plokk - 1].short}` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p style={{ margin: "0 0 12px", fontSize: 13, color: "#888", fontFamily: "sans-serif" }}>
            Kirjeldusest ei õnnestunud õpilaste tegevusi eristada.
          </p>
        )}

        {markus && <Row icon="◎" label="Märkus" text={markus} color="#5b3a29" />}
      </div>
    </div>
  );
}

export default function App() {
  const [text, setText] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showIkap, setShowIkap] = useState(false);
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
    setShowIkap(false);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          max_tokens: 4000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Tunni kirjeldus: ${text}` }],
        }),
      });

      const responseText = await res.text();
      if (res.status === 429) {
        setError(
          responseText.includes("rate_day")
            ? "Päevalimiit on täis. Proovi homme uuesti."
            : "Päringuid on praegu palju. Oota umbes minut ja proovi uuesti."
        );
        setLoading(false);
        return;
      }
      if (!res.ok) {
        setError(`Analüüs ei õnnestunud (viga ${res.status}). Proovi mõne hetke pärast uuesti.`);
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
      setError(`Päring ebaõnnestus: ${e.message}. Proovi uuesti.`);
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
          pagebreak: { mode: ["avoid-all", "css"] },
        })
        .from(resultsRef.current)
        .save();
    } catch (e) {
      setError(`PDF viga: ${e.message}`);
    }
    setSaving(false);
  };

  const ikapList = normalizeIkap(results && results.ikap);

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", fontFamily: "Georgia, serif", color: "#2d2d2b", padding: "2rem 1.25rem 3rem" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#3b6530" }}>Tunniraami peegel</h1>
          <span style={{ fontSize: 12, color: "#bbb", fontFamily: "sans-serif" }}>Nissi kool</span>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: "#666", lineHeight: 1.6, fontFamily: "sans-serif" }}>
          Kirjelda planeeritavat või toimunud tundi. Rakendus aitab märgata tugevusi, puuduvaid osi ja järgmisi samme. Mida konkreetsemalt kirjeldad, mida õpilased teevad, seda täpsem on analüüs.
        </p>
      </div>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Näiteks: Planeerin 6. klassi loodusõpetuse tunni fotosünteesist. Alustan küsimusega, mida õpilased juba teavad. Seejärel näitan videot ja õpilased arutavad paarides, miks taimed vajavad valgust…"
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
          <button onClick={() => setShowIkap(v => !v)} style={{
            padding: "10px 20px", background: showIkap ? "#5b3a29" : "white", color: showIkap ? "white" : "#5b3a29",
            border: "1.5px solid #5b3a29", borderRadius: 8, fontSize: 14,
            cursor: "pointer", fontWeight: 500, fontFamily: "sans-serif",
          }}>
            {showIkap ? "Peida IKAP tasemed" : "Näita IKAP tasemeid"}
          </button>
        )}

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

          {showIkap && results.ikap && <IkapCard tegevused={ikapList} markus={results.ikap.markus} />}

          <div style={{ display: "grid", gap: 14 }}>
            {results.sections?.map((sec, i) => {
              const s = SECTIONS[i] || SECTIONS[0];
              const inBlock = ikapList.filter(t => t.plokk === i + 1);
              return (
                <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: `1px solid ${s.border}` }}>
                  <div style={{ background: s.color, color: s.text, padding: "9px 16px", fontSize: 13, fontWeight: 600, fontFamily: "sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ background: "rgba(255,255,255,0.25)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    {s.title}
                  </div>
                  <div style={{ padding: "14px 16px 6px", background: s.bg }}>
                    {showIkap && (
                      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#8a7d66", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "sans-serif", marginRight: 2 }}>IKAP</span>
                        {inBlock.length > 0 ? inBlock.map((t, j) => (
                          <span key={j} style={{ background: "white", border: `1px solid ${IKAP[t.tase].ring}`, borderRadius: 20, padding: "2px 10px 2px 3px", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontFamily: "sans-serif", color: "#2d2d2b" }}>
                            <IkapBubble tase={t.tase} size={20} />{t.nimi}
                          </span>
                        )) : (
                          <span style={{ fontSize: 12, color: "#a39880", fontFamily: "sans-serif" }}>tegevusi pole kirjeldatud</span>
                        )}
                      </div>
                    )}
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
            Tunniraami peegel ei hinda õpetajat. Tagasiside põhineb kirjeldatu analüüsil ja on mõeldud arutelu alustamiseks.
          </p>
        </div>
      )}
    </div>
  );
}
