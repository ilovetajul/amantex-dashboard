import { useState, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Area,
} from "recharts";
import {
  CheckCircle, XCircle, AlertTriangle, Activity,
  Moon, Sun, Package, Percent, Printer, Scissors,
  RefreshCw, FileSpreadsheet, Download,
} from "lucide-react";

// ── COLOURS ──────────────────────────────────────────────────────
const C = ["#3b82f6","#8b5cf6","#ec4899","#f97316","#10b981","#f43f5e","#06b6d4","#a855f7"];
const fmt = n => n == null ? "—" : n >= 1000 ? (n / 1000).toFixed(1) + "K" : Number(n).toLocaleString();
const norm = s => s?.toString().trim().toLowerCase().replace(/\s+/g, "");

const findCol = (headers, candidates) => {
  const nh = headers.map(norm);
  for (const c of candidates) {
    const i = nh.indexOf(norm(c));
    if (i !== -1) return headers[i];
  }
  return null;
};

const parseSheet = rows => {
  if (!rows?.length) return [];
  const headers = Object.keys(rows[0]);
  const datCol = findCol(headers, ["date","Date","DATE","day","Day","তারিখ"]);
  const chkCol = findCol(headers, ["totalcheck","total check","Total Check","check qty","checkqty","Check Qty","TOTAL CHECK","total_check"]);
  const pasCol = findCol(headers, ["qcpass","qc pass","QC Pass","pass","Pass","PASS","QC PASS","qc_pass"]);
  const rejCol = findCol(headers, ["reject","Reject","REJECT","rejectqty","reject qty","Reject Qty","reject_qty"]);
  const defCol = findCol(headers, ["defect","Defect","DEFECT","defectqty","defect qty","Defect Qty","total defect","total_defect"]);
  return rows
    .filter(r => r[datCol])
    .map(r => ({
      date:       r[datCol]?.toString().trim(),
      totalCheck: Number(r[chkCol]) || 0,
      qcPass:     Number(r[pasCol]) || 0,
      reject:     Number(r[rejCol]) || 0,
      defect:     Number(r[defCol]) || 0,
    }))
    .filter(r => r.totalCheck > 0);
};

// ── TOOLTIP ──────────────────────────────────────────────────────
const CTip = ({ active, payload, label, dark }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: dark ? "rgba(15,23,42,0.97)" : "rgba(255,255,255,0.97)",
      border: "1px solid rgba(99,102,241,0.3)", borderRadius: 12,
      padding: "10px 14px", backdropFilter: "blur(12px)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.18)"
    }}>
      <p style={{ color: dark ? "#94a3b8" : "#64748b", fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 700, margin: "2px 0" }}>
          <span style={{ color: dark ? "#e2e8f0" : "#1e293b" }}>{p.name}: </span>
          {Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

// ── SPARKLINE ────────────────────────────────────────────────────
const Spark = ({ data, color, k }) => (
  <ResponsiveContainer width="100%" height={32}>
    <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
      <Line type="monotone" dataKey={k} stroke={color} strokeWidth={2} dot={false} />
    </LineChart>
  </ResponsiveContainer>
);

// ── GAUGE ────────────────────────────────────────────────────────
const Gauge = ({ value, dark }) => {
  const good = value < 0.5;
  const fill = good ? "#10b981" : "#f43f5e";
  const pv   = Math.min(value / 1.0, 1);
  const gd   = [
    { v: pv * 100,       fill },
    { v: (1 - pv) * 100, fill: dark ? "rgba(51,65,85,0.5)" : "rgba(226,232,240,0.7)" },
  ];
  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie data={gd} cx="50%" cy="85%" startAngle={180} endAngle={0}
            innerRadius={55} outerRadius={82} dataKey="v" stroke="none" paddingAngle={2}>
            {gd.map((e, i) => <Cell key={i} fill={e.fill} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{ position: "absolute", bottom: 4, textAlign: "center" }}>
        <span style={{ fontFamily: "DM Mono,monospace", fontSize: 26, fontWeight: 900, color: fill }}>
          {value.toFixed(2)}%
        </span>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
          marginTop: 3, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
          background: good ? "rgba(16,185,129,0.15)" : "rgba(244,63,94,0.15)", color: fill
        }}>
          {good ? <CheckCircle size={10} /> : <XCircle size={10} />}
          {good ? "Excellent Quality" : "Needs Attention"}
        </div>
      </div>
    </div>
  );
};

// ── UPLOAD SCREEN ────────────────────────────────────────────────
const UploadScreen = ({ onFile, dark }) => {
  const [drag, setDrag] = useState(false);
  const handle = e => {
    e.preventDefault();
    const f = e.dataTransfer?.files[0] || e.target.files[0];
    if (f) onFile(f);
  };
  const bgPage = dark ? "#030712" : "#f1f5f9";
  const bgCard = dark ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.82)";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: bgPage, padding: 24 }}>
      <div style={{ maxWidth: 540, width: "100%", textAlign: "center" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(99,102,241,0.4)" }}>
            <span style={{ color: "#fff", fontWeight: 900, fontSize: 22 }}>A</span>
          </div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 800, fontSize: 20, color: dark ? "#e2e8f0" : "#0f172a" }}>Amantex Limited</div>
            <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>Quality Analytics System</div>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { setDrag(false); handle(e); }}
          onClick={() => document.getElementById("xl-inp").click()}
          style={{
            border: `2px dashed ${drag ? "#6366f1" : dark ? "rgba(99,102,241,0.4)" : "rgba(99,102,241,0.3)"}`,
            borderRadius: 20, padding: "44px 28px",
            background: drag ? (dark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.06)") : (dark ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.8)"),
            backdropFilter: "blur(20px)", cursor: "pointer", transition: "all 0.2s",
            boxShadow: dark ? "0 4px 32px rgba(0,0,0,0.4)" : "0 4px 32px rgba(99,102,241,0.08)",
          }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <FileSpreadsheet size={30} color="#6366f1" />
          </div>
          <p style={{ fontWeight: 800, fontSize: 18, color: dark ? "#e2e8f0" : "#0f172a", marginBottom: 6 }}>
            Excel ফাইল আপলোড করুন
          </p>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
            ড্র্যাগ করুন অথবা ক্লিক করুন
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {[".xlsx", ".xls", ".csv"].map(e => (
              <span key={e} style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>{e}</span>
            ))}
          </div>
        </div>
        <input id="xl-inp" type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handle} />

        {/* Instructions */}
        <div style={{ marginTop: 20, padding: "16px 20px", background: bgCard, borderRadius: 14, border: "1px solid rgba(99,102,241,0.18)", backdropFilter: "blur(12px)", textAlign: "left" }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>📋 Excel শিটের নিয়ম</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            {[
              { sheet: "Embroidery", icon: "🧵" },
              { sheet: "Printing",   icon: "🖨️" },
            ].map(({ sheet, icon }) => (
              <div key={sheet} style={{ background: dark ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.06)", borderRadius: 10, padding: "8px 12px", border: "1px solid rgba(99,102,241,0.15)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: dark ? "#e2e8f0" : "#1e293b", marginBottom: 4 }}>{icon} Sheet: <span style={{ color: "#6366f1" }}>{sheet}</span></div>
                <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.6 }}>
                  Date<br />Total Check<br />QC Pass<br />Reject<br />Defect
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>
            💡 কলামের নাম ইংরেজিতে লিখুন। শিটের নামে "Embroidery" বা "Printing" থাকতে হবে।
          </p>
        </div>
      </div>
    </div>
  );
};

// ── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark]     = useState(true);
  const [dept, setDept]     = useState("embroidery");
  const [sheets, setSheets] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError]   = useState("");

  const bg = dark
    ? { page: "#030712", card: "rgba(15,23,42,0.72)", border: "rgba(99,102,241,0.18)", text: "#e2e8f0", sub: "#64748b" }
    : { page: "#f1f5f9", card: "rgba(255,255,255,0.78)", border: "rgba(99,102,241,0.18)", text: "#0f172a", sub: "#64748b" };

  const card = {
    background: bg.card, border: `1px solid ${bg.border}`, borderRadius: 20,
    backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
    boxShadow: dark
      ? "0 4px 32px rgba(0,0,0,0.4),inset 0 1px 0 rgba(255,255,255,0.04)"
      : "0 4px 32px rgba(99,102,241,0.08),inset 0 1px 0 rgba(255,255,255,0.8)",
  };
  const grid = { stroke: dark ? "rgba(71,85,105,0.4)" : "rgba(203,213,225,0.6)", strokeDasharray: "4 4" };
  const tick = { fill: dark ? "#64748b" : "#94a3b8", fontSize: 11 };

  // Parse Excel
  const handleFile = useCallback(file => {
    setError("");
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const names = wb.SheetNames;

        const findSheet = keys => {
          for (const k of keys) {
            const idx = names.findIndex(s => s.toLowerCase().includes(k));
            if (idx !== -1) return parseSheet(XLSX.utils.sheet_to_json(wb.Sheets[names[idx]]));
          }
          return [];
        };

        let emb  = findSheet(["embroid", "emb", "সূচিকাজ"]);
        let prnt = findSheet(["print", "প্রিন্ট"]);

        // Fallback: use first two sheets
        if (!emb.length && !prnt.length) {
          const all = names
            .map(n => ({ name: n, data: parseSheet(XLSX.utils.sheet_to_json(wb.Sheets[n])) }))
            .filter(s => s.data.length);
          if (!all.length) { setError("ডেটা পাওয়া যায়নি। কলামের নাম চেক করুন।"); return; }
          emb  = all[0]?.data || [];
          prnt = all[1]?.data || all[0]?.data || [];
        }

        setSheets({ embroidery: emb, printing: prnt.length ? prnt : emb });
        setFileName(file.name);
      } catch (err) {
        setError("ফাইল পড়তে সমস্যা হয়েছে: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const data = sheets?.[dept] ?? [];

  const totals = useMemo(() => {
    if (!data.length) return { check: 0, pass: 0, rej: 0, def: 0, rejPct: 0, defPct: 0 };
    const t = data.reduce((a, d) => ({
      check: a.check + d.totalCheck,
      pass:  a.pass  + d.qcPass,
      rej:   a.rej   + d.reject,
      def:   a.def   + d.defect,
    }), { check: 0, pass: 0, rej: 0, def: 0 });
    return { ...t, rejPct: t.check ? (t.rej / t.check) * 100 : 0, defPct: t.check ? (t.def / t.check) * 100 : 0 };
  }, [data]);

  const kpis = [
    { title: "Total Check",  val: fmt(totals.check),              icon: Package,       color: "#3b82f6", k: "totalCheck" },
    { title: "QC Pass",      val: fmt(totals.pass),               icon: CheckCircle,   color: "#10b981", k: "qcPass"     },
    { title: "Reject Qty",   val: fmt(totals.rej),                icon: XCircle,       color: "#f43f5e", k: "reject"     },
    { title: "Reject Rate",  val: totals.rejPct.toFixed(2) + "%", icon: Percent,       color: "#f97316", k: "reject"     },
    { title: "Total Defect", val: fmt(totals.def),                icon: AlertTriangle, color: "#8b5cf6", k: "defect"     },
    { title: "Defect Rate",  val: totals.defPct.toFixed(2) + "%", icon: Activity,      color: "#ec4899", k: "defect"     },
  ];

  // Export CSV
  const exportCSV = () => {
    if (!data.length) return;
    const csv = ["Date,Total Check,QC Pass,Reject,Defect",
      ...data.map(r => `${r.date},${r.totalCheck},${r.qcPass},${r.reject},${r.defect}`)
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), { href: url, download: `${dept}-report.csv` });
    a.click(); URL.revokeObjectURL(url);
  };

  if (!sheets) return <UploadScreen onFile={handleFile} dark={dark} />;

  const interval = Math.max(0, Math.floor(data.length / 8) - 1);

  return (
    <div style={{ minHeight: "100vh", background: bg.page, color: bg.text, transition: "all 0.3s", fontFamily: "'DM Sans','Segoe UI',system-ui,sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Ambient orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "-15%", left: "-8%", width: 600, height: 600, background: "radial-gradient(circle,rgba(99,102,241,0.14) 0%,transparent 70%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "-10%", right: "-5%", width: 500, height: 500, background: "radial-gradient(circle,rgba(236,72,153,0.09) 0%,transparent 70%)", borderRadius: "50%" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1400, margin: "0 auto", padding: "18px 14px 36px" }}>

        {/* HEADER */}
        <div style={{ ...card, padding: "14px 20px", marginBottom: 16, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 11, flex: 1, minWidth: 160 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(99,102,241,0.35)", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 17 }}>A</span>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em" }}>Amantex Limited</div>
              <div style={{ fontSize: 10, color: bg.sub, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{fileName || "Quality Analytics"}</div>
            </div>
          </div>

          {/* Dept Toggle */}
          <div style={{ display: "flex", gap: 3, background: dark ? "rgba(30,41,59,0.8)" : "rgba(241,245,249,0.9)", padding: 3, borderRadius: 11, border: `1px solid ${bg.border}` }}>
            {["embroidery", "printing"].map(d => (
              <button key={d} onClick={() => setDept(d)} style={{
                padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600, transition: "all 0.2s",
                background: dept === d ? (dark ? "rgba(99,102,241,0.9)" : "#6366f1") : "transparent",
                color: dept === d ? "#fff" : bg.sub,
                display: "flex", alignItems: "center", gap: 5,
              }}>
                {d === "embroidery" ? <Scissors size={11} /> : <Printer size={11} />}
                {d.charAt(0).toUpperCase() + d.slice(1)}
                <span style={{ fontSize: 9, opacity: 0.7 }}>({sheets[d]?.length ?? 0} days)</span>
              </button>
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: 9, border: "1px solid rgba(16,185,129,0.3)", cursor: "pointer", fontSize: 12, fontWeight: 600, background: "rgba(16,185,129,0.12)", color: "#10b981" }}>
              <Download size={12} /> Export CSV
            </button>
            <button onClick={() => setSheets(null)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: 9, border: "1px solid rgba(99,102,241,0.3)", cursor: "pointer", fontSize: 12, fontWeight: 600, background: "rgba(99,102,241,0.12)", color: "#818cf8" }}>
              <RefreshCw size={12} /> নতুন ফাইল
            </button>
            <button onClick={() => setDark(!dark)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: 9, border: `1px solid ${bg.border}`, cursor: "pointer", fontSize: 12, fontWeight: 600, background: dark ? "rgba(251,191,36,0.1)" : "rgba(99,102,241,0.1)", color: dark ? "#fbbf24" : "#6366f1" }}>
              {dark ? <Sun size={12} /> : <Moon size={12} />} {dark ? "Light" : "Dark"}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ ...card, padding: "12px 18px", marginBottom: 14, background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.3)", color: "#f43f5e", fontSize: 13, fontWeight: 600 }}>
            ⚠️ {error}
          </div>
        )}

        {data.length === 0 ? (
          <div style={{ ...card, padding: 40, textAlign: "center", color: bg.sub }}>
            <p style={{ fontSize: 15, fontWeight: 600 }}>"{dept}" শিটে কোনো ডেটা নেই।</p>
            <p style={{ fontSize: 12, marginTop: 6 }}>অন্য ডিপার্টমেন্ট চেক করুন অথবা নতুন ফাইল আপলোড করুন।</p>
          </div>
        ) : (
          <>
            {/* KPI CARDS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12, marginBottom: 16 }}>
              {kpis.map(({ title, val, icon: Icon, color, k }) => (
                <div key={title} style={{ ...card, padding: "16px 16px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: -24, right: -24, width: 80, height: 80, background: `radial-gradient(circle,${color}22 0%,transparent 70%)`, borderRadius: "50%" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: bg.sub, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0, lineHeight: 1.3 }}>{title}</p>
                    <div style={{ background: `${color}18`, borderRadius: 8, padding: 6, border: `1px solid ${color}25`, flexShrink: 0 }}>
                      <Icon size={14} color={color} />
                    </div>
                  </div>
                  <div style={{ fontFamily: "DM Mono,monospace", fontSize: 24, fontWeight: 700, color: bg.text, letterSpacing: "-0.02em", lineHeight: 1, marginBottom: 3 }}>{val}</div>
                  <div style={{ height: 26, margin: "3px 0" }}>
                    <Spark data={data.slice(-12)} color={color} k={k} />
                  </div>
                </div>
              ))}
            </div>

            {/* DAILY CHART + GAUGE */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 270px", gap: 13, marginBottom: 16 }}>
              <div style={{ ...card, padding: "18px 20px" }}>
                <h2 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800 }}>Daily Production Overview</h2>
                <p style={{ margin: "0 0 14px", fontSize: 11, color: bg.sub }}>Check · Pass · Reject — প্রতিদিনের তথ্য</p>
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                      <defs>
                        <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid {...grid} vertical={false} />
                      <XAxis dataKey="date" tick={tick} axisLine={false} tickLine={false} interval={interval} />
                      <YAxis tick={tick} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                      <Tooltip content={<CTip dark={dark} />} />
                      <Area type="monotone" dataKey="totalCheck" name="Total Check" stroke="#3b82f6" strokeWidth={2} fill="url(#gC)" dot={false} />
                      <Area type="monotone" dataKey="qcPass" name="QC Pass" stroke="#10b981" strokeWidth={2} fill="url(#gP)" dot={false} />
                      <Line type="monotone" dataKey="reject" name="Reject" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3, fill: "#f43f5e" }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Gauge */}
              <div style={{ ...card, padding: "18px 16px", display: "flex", flexDirection: "column" }}>
                <h2 style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 800 }}>Monthly Performance</h2>
                <p style={{ margin: "0 0 4px", fontSize: 10, color: bg.sub }}>Reject Rate vs ≤ 0.50%</p>
                <Gauge value={totals.rejPct} dark={dark} />
                <div style={{ borderTop: `1px solid ${bg.border}`, paddingTop: 10, marginTop: 4 }}>
                  {[
                    ["Industry Target", "≤ 0.50%", "#f97316"],
                    ["Actual Rate", totals.rejPct.toFixed(2) + "%", totals.rejPct < 0.5 ? "#10b981" : "#f43f5e"],
                    ["Total Days", data.length + " days", "#6366f1"],
                  ].map(([l, v, c]) => (
                    <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: bg.sub }}>{l}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: c, fontFamily: "DM Mono,monospace" }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ height: 5, background: dark ? "rgba(51,65,85,0.5)" : "rgba(226,232,240,0.8)", borderRadius: 10, overflow: "hidden", marginTop: 2 }}>
                    <div style={{ height: "100%", width: `${Math.min((totals.rejPct / 1.0) * 100, 100)}%`, background: totals.rejPct < 0.5 ? "linear-gradient(90deg,#10b981,#34d399)" : "linear-gradient(90deg,#f43f5e,#fb7185)", borderRadius: 10, transition: "width 0.8s ease" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* DEFECT BAR + PIE */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13, marginBottom: 16 }}>

              <div style={{ ...card, padding: "18px 20px" }}>
                <h2 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800 }}>Daily Defect Qty</h2>
                <p style={{ margin: "0 0 12px", fontSize: 11, color: bg.sub }}>প্রতিদিনের ত্রুটির সংখ্যা</p>
                <div style={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                      <CartesianGrid {...grid} vertical={false} />
                      <XAxis dataKey="date" tick={tick} axisLine={false} tickLine={false} interval={interval} />
                      <YAxis tick={tick} axisLine={false} tickLine={false} />
                      <Tooltip content={<CTip dark={dark} />} />
                      <Bar dataKey="defect" name="Defect" radius={[4, 4, 0, 0]} barSize={14}>
                        {data.map((_, i) => <Cell key={i} fill={C[i % C.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ ...card, padding: "18px 20px" }}>
                <h2 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800 }}>Pass vs Reject Ratio</h2>
                <p style={{ margin: "0 0 12px", fontSize: 11, color: bg.sub }}>পাস ও রিজেক্টের অনুপাত</p>
                <div style={{ display: "flex", height: 250, alignItems: "center" }}>
                  <div style={{ flex: 1, height: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[{ name: "QC Pass", value: totals.pass }, { name: "Rejected", value: totals.rej }, { name: "Defect", value: totals.def }]}
                          cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                          paddingAngle={4} dataKey="value"
                          stroke={dark ? "rgba(3,7,18,0.6)" : "rgba(255,255,255,0.8)"} strokeWidth={2}>
                          {["#10b981", "#f43f5e", "#f97316"].map((c, i) => <Cell key={i} fill={c} />)}
                        </Pie>
                        <Tooltip content={<CTip dark={dark} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ width: 115 }}>
                    {[["QC Pass", fmt(totals.pass), "#10b981"], ["Rejected", fmt(totals.rej), "#f43f5e"], ["Defect", fmt(totals.def), "#f97316"]].map(([l, v, c]) => (
                      <div key={l} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: c, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 10, color: bg.sub }}>{l}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: bg.text, fontFamily: "DM Mono,monospace" }}>{v}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* TOP 5 TABLE */}
            <div style={{ ...card, padding: "18px 20px", marginBottom: 16 }}>
              <h2 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 800 }}>🔴 Top 5 — সবচেয়ে বেশি Reject দিন</h2>
              <p style={{ margin: "0 0 14px", fontSize: 11, color: bg.sub }}>সর্বোচ্চ রিজেক্ট অনুযায়ী সাজানো</p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["তারিখ", "Total Check", "QC Pass", "Reject", "Reject %", "Defect"].map(h => (
                        <th key={h} style={{ textAlign: "left", padding: "8px 12px", borderBottom: `1px solid ${bg.border}`, color: bg.sub, fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...data].sort((a, b) => b.reject - a.reject).slice(0, 5).map((r, i) => {
                      const rp = r.totalCheck ? ((r.reject / r.totalCheck) * 100).toFixed(2) : "0.00";
                      return (
                        <tr key={i} style={{ borderBottom: `1px solid ${bg.border}30` }}>
                          <td style={{ padding: "10px 12px", fontWeight: 700, color: bg.text }}>{r.date}</td>
                          <td style={{ padding: "10px 12px", fontFamily: "DM Mono,monospace", color: bg.text }}>{r.totalCheck.toLocaleString()}</td>
                          <td style={{ padding: "10px 12px", color: "#10b981", fontFamily: "DM Mono,monospace" }}>{r.qcPass.toLocaleString()}</td>
                          <td style={{ padding: "10px 12px", color: "#f43f5e", fontWeight: 700, fontFamily: "DM Mono,monospace" }}>{r.reject.toLocaleString()}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{ background: Number(rp) > 0.5 ? "rgba(244,63,94,0.15)" : "rgba(16,185,129,0.12)", color: Number(rp) > 0.5 ? "#f43f5e" : "#10b981", padding: "2px 10px", borderRadius: 20, fontWeight: 700, fontSize: 11 }}>{rp}%</span>
                          </td>
                          <td style={{ padding: "10px 12px", color: "#f97316", fontFamily: "DM Mono,monospace" }}>{r.defect.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FOOTER */}
            <div style={{ ...card, padding: "11px 20px", display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
                {[
                  ["ফাইল",       fileName || "—",                                          "#6366f1"],
                  ["Department", dept.charAt(0).toUpperCase() + dept.slice(1),              "#8b5cf6"],
                  ["মোট দিন",    data.length + " days",                                    "#3b82f6"],
                  ["Grade",      totals.rejPct < 0.5 ? "A+ ✓" : "B",  totals.rejPct < 0.5 ? "#10b981" : "#f97316"],
                ].map(([l, v, c]) => (
                  <div key={l}>
                    <div style={{ fontSize: 10, color: bg.sub, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{l}</div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: c, fontFamily: "DM Mono,monospace" }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, color: bg.sub }}>
                Amantex QA System v2.1 · {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
