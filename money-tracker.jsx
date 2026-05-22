import { useState, useEffect } from "react";

const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

const CAT_COLORS = {
  طعام:"#f97316", مواصلات:"#3b82f6", تسوق:"#a855f7",
  صحة:"#22c55e", ترفيه:"#ec4899", تعليم:"#eab308",
  سكن:"#14b8a6", أخرى:"#94a3b8",
};
const CATEGORIES = Object.keys(CAT_COLORS);

const fmt = n => (n || 0).toLocaleString("ar-IQ");

const nowY = new Date().getFullYear();
const nowM = new Date().getMonth() + 1;

function loadState() {
  try { return JSON.parse(localStorage.getItem("mw2") || "null"); } catch { return null; }
}
function saveState(s) {
  try { localStorage.setItem("mw2", JSON.stringify(s)); } catch {}
}

const emptyExpense = () => ({ id: Date.now() + Math.random(), desc: "", amount: "", cat: "أخرى", day: new Date().getDate() });

export default function App() {
  const [state, setState] = useState(() => {
    const s = loadState();
    return s || { balance: 0, year: nowY, months: {} };
  });
  // state.months[YYYY][MM] = { income: number, expenses: [{id,desc,amount,cat,day}] }

  const [view, setView] = useState("months"); // "months" | "month"
  const [activeMonth, setActiveMonth] = useState(nowM);
  const [incomeInput, setIncomeInput] = useState("");
  const [flash, setFlash] = useState(null);

  useEffect(() => { saveState(state); }, [state]);

  const showFlash = (msg, type="success") => {
    setFlash({msg,type});
    setTimeout(() => setFlash(null), 2000);
  };

  const getMonth = (y, m) => {
    return state.months?.[y]?.[m] || { income: 0, expenses: [emptyExpense()] };
  };

  const setMonth = (y, m, data) => {
    setState(s => {
      const ns = { ...s, months: { ...s.months, [y]: { ...(s.months[y] || {}), [m]: data } } };
      return ns;
    });
  };

  const monthData = getMonth(state.year, activeMonth);

  // Live balance = total income - total expenses
  const allExpTotal = Object.values(state.months || {}).flatMap(yr =>
    Object.values(yr).flatMap(mo => (mo.expenses || []).map(e => parseFloat(e.amount) || 0))
  ).reduce((a, b) => a + b, 0);
  const allIncTotal = Object.values(state.months || {}).flatMap(yr =>
    Object.values(yr).map(mo => mo.income || 0)
  ).reduce((a, b) => a + b, 0);
  const liveBalance = state.balance + allIncTotal - allExpTotal;

  // Month totals
  const monthExpTotal = (monthData.expenses || []).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
  const monthIncome = monthData.income || 0;

  // Add income to month
  const handleAddIncome = () => {
    const v = parseFloat(incomeInput);
    if (!v || v <= 0) return showFlash("أدخل مبلغاً صحيحاً", "error");
    setMonth(state.year, activeMonth, { ...monthData, income: (monthData.income || 0) + v });
    setState(s => ({ ...s, balance: s.balance + v }));
    setIncomeInput("");
    showFlash(`تمت إضافة ${fmt(v)} د.ع`);
  };

  // Update expense row
  const updateExp = (id, field, val) => {
    const exps = (monthData.expenses || []).map(e => e.id === id ? { ...e, [field]: val } : e);
    setMonth(state.year, activeMonth, { ...monthData, expenses: exps });
  };

  // Add new row
  const addExpRow = () => {
    const exps = [...(monthData.expenses || []), emptyExpense()];
    setMonth(state.year, activeMonth, { ...monthData, expenses: exps });
  };

  // Delete row
  const deleteExpRow = (id) => {
    const exps = (monthData.expenses || []).filter(e => e.id !== id);
    setMonth(state.year, activeMonth, { ...monthData, expenses: exps.length ? exps : [emptyExpense()] });
  };

  // Per-month summary for the grid
  const getMonthSummary = (m) => {
    const md = state.months?.[state.year]?.[m];
    if (!md) return { income: 0, spent: 0 };
    const spent = (md.expenses || []).reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
    return { income: md.income || 0, spent };
  };

  const years = Array.from({ length: 6 }, (_, i) => nowY - 2 + i);

  return (
    <div style={{
      minHeight: "100vh", background: "#070b12", color: "#f1f5f9",
      fontFamily: "'Tajawal', sans-serif", direction: "rtl",
      display: "flex", flexDirection: "column", alignItems: "center",
      paddingBottom: 80,
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {flash && (
        <div style={{
          position:"fixed", top:16, left:"50%", transform:"translateX(-50%)",
          background: flash.type==="error" ? "#dc2626" : "#16a34a",
          color:"#fff", padding:"9px 22px", borderRadius:12,
          fontWeight:700, fontSize:14, zIndex:9999,
          boxShadow:"0 4px 20px rgba(0,0,0,0.5)",
          animation:"pop .18s ease", whiteSpace:"nowrap",
        }}>{flash.msg}</div>
      )}

      {/* HEADER */}
      <div style={{
        width:"100%", maxWidth:540,
        background:"linear-gradient(160deg,#0f172a,#1e1b4b)",
        borderBottom:"1px solid #1e293b",
        padding:"24px 20px 18px",
      }}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div>
            <p style={{margin:0, fontSize:11, color:"#6366f1", fontWeight:700, letterSpacing:2}}>محفظتي</p>
            <div style={{display:"flex", alignItems:"baseline", gap:6, marginTop:4}}>
              <span style={{fontSize:36, fontWeight:900}}>{fmt(liveBalance)}</span>
              <span style={{fontSize:15, color:"#818cf8"}}>د.ع</span>
            </div>
            <p style={{margin:"4px 0 0", fontSize:12, color:"#475569"}}>الرصيد المتبقي</p>
          </div>
          {/* Year selector */}
          <div>
            <p style={{margin:"0 0 4px", fontSize:11, color:"#475569", textAlign:"center"}}>السنة</p>
            <div style={{display:"flex", gap:4}}>
              {years.map(y => (
                <button key={y} onClick={() => setState(s=>({...s,year:y}))} style={{
                  padding:"5px 8px", borderRadius:8, border:"none", cursor:"pointer",
                  fontFamily:"inherit", fontSize:12, fontWeight:700,
                  background: state.year===y ? "#6366f1" : "#1e293b",
                  color: state.year===y ? "#fff" : "#64748b",
                }}>{y}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{width:"100%", maxWidth:540, padding:"16px 14px 0"}}>

        {/* ===== MONTHS GRID VIEW ===== */}
        {view === "months" && (
          <div>
            <p style={{margin:"0 0 12px", fontSize:12, color:"#475569", fontWeight:700}}>اختر الشهر لعرض أو إضافة المصاريف</p>
            <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10}}>
              {Array.from({length:12},(_,i)=>i+1).map(m => {
                const s = getMonthSummary(m);
                const hasData = s.income > 0 || s.spent > 0;
                const net = s.income - s.spent;
                const isNow = m === nowM && state.year === nowY;
                return (
                  <button key={m} onClick={() => { setActiveMonth(m); setView("month"); }} style={{
                    background: isNow ? "#1e1b4b" : "#0d1117",
                    border: `2px solid ${isNow ? "#6366f1" : hasData ? "#1e293b" : "#0d1117"}`,
                    borderRadius:14, padding:"12px 8px",
                    cursor:"pointer", fontFamily:"inherit",
                    display:"flex", flexDirection:"column", alignItems:"center", gap:4,
                    transition:"all .15s",
                  }}>
                    <span style={{
                      fontSize:26, fontWeight:900,
                      color: isNow ? "#818cf8" : hasData ? "#f1f5f9" : "#334155",
                    }}>{m}</span>
                    <span style={{fontSize:10, color:"#475569", fontWeight:600}}>{MONTHS_AR[m-1]}</span>
                    {hasData && (
                      <span style={{
                        fontSize:10, fontWeight:700, marginTop:2,
                        color: net >= 0 ? "#22c55e" : "#ef4444",
                      }}>
                        {net >= 0 ? "+" : ""}{fmt(net)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Global income across all months summary */}
            <div style={{
              marginTop:16, background:"#0d1117", border:"1px solid #1e293b",
              borderRadius:14, padding:"14px 16px",
              display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8,
            }}>
              {[
                {label:"إجمالي الإيرادات", val:allIncTotal, color:"#22c55e"},
                {label:"إجمالي المصاريف", val:allExpTotal, color:"#ef4444"},
                {label:"الصافي", val:allIncTotal-allExpTotal, color:allIncTotal-allExpTotal>=0?"#22c55e":"#ef4444"},
              ].map(s=>(
                <div key={s.label} style={{textAlign:"center"}}>
                  <p style={{margin:0, fontSize:10, color:"#475569", fontWeight:600}}>{s.label}</p>
                  <p style={{margin:"5px 0 0", fontSize:14, fontWeight:800, color:s.color}}>{fmt(s.val)}</p>
                  <p style={{margin:0, fontSize:9, color:"#334155"}}>د.ع</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== MONTH DETAIL VIEW ===== */}
        {view === "month" && (
          <div>
            {/* Back + title */}
            <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:16}}>
              <button onClick={() => setView("months")} style={{
                background:"#1e293b", border:"none", borderRadius:8,
                color:"#94a3b8", padding:"7px 12px", cursor:"pointer",
                fontFamily:"inherit", fontSize:13, fontWeight:700,
              }}>← رجوع</button>
              <div>
                <h2 style={{margin:0, fontSize:20, fontWeight:900}}>
                  {MONTHS_AR[activeMonth-1]} {state.year}
                </h2>
              </div>
            </div>

            {/* Month stats bar */}
            <div style={{
              background:"#0d1117", border:"1px solid #1e293b",
              borderRadius:14, padding:"12px 14px", marginBottom:14,
              display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6,
            }}>
              {[
                {label:"الإيرادات", val:monthIncome, color:"#22c55e"},
                {label:"المصاريف", val:monthExpTotal, color:"#ef4444"},
                {label:"الباقي", val:monthIncome-monthExpTotal, color:monthIncome-monthExpTotal>=0?"#22c55e":"#ef4444"},
              ].map(s=>(
                <div key={s.label} style={{textAlign:"center"}}>
                  <p style={{margin:0, fontSize:10, color:"#475569", fontWeight:600}}>{s.label}</p>
                  <p style={{margin:"5px 0 0", fontSize:16, fontWeight:900, color:s.color}}>{fmt(s.val)}</p>
                  <p style={{margin:0, fontSize:9, color:"#334155"}}>د.ع</p>
                </div>
              ))}
            </div>

            {/* Add income */}
            <div style={{
              background:"#0a1a0f", border:"1px solid #14532d",
              borderRadius:12, padding:"12px", marginBottom:14,
              display:"flex", gap:8, alignItems:"center",
            }}>
              <input
                type="number"
                placeholder="أضف إيراداً للشهر..."
                value={incomeInput}
                onChange={e=>setIncomeInput(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleAddIncome()}
                style={{
                  flex:1, padding:"9px 12px", borderRadius:9,
                  border:"1px solid #14532d", background:"#052e16",
                  color:"#f1f5f9", fontSize:14, outline:"none", fontFamily:"inherit",
                }}
              />
              <button onClick={handleAddIncome} style={{
                padding:"9px 16px", borderRadius:9,
                background:"#16a34a", color:"#fff",
                border:"none", fontWeight:700, fontSize:14,
                cursor:"pointer", fontFamily:"inherit", whiteSpace:"nowrap",
              }}>+ إضافة</button>
            </div>

            {/* EXPENSE ROWS */}
            <div style={{display:"flex", flexDirection:"column", gap:10}}>
              {(monthData.expenses || []).map((exp, idx) => {
                const running = (monthData.expenses || [])
                  .slice(0, idx + 1)
                  .reduce((s, e) => s + (parseFloat(e.amount) || 0), 0);
                const remaining = monthIncome - running;
                return (
                  <ExpRow
                    key={exp.id}
                    exp={exp}
                    idx={idx}
                    remaining={remaining}
                    monthIncome={monthIncome}
                    onChange={(field, val) => updateExp(exp.id, field, val)}
                    onDelete={() => deleteExpRow(exp.id)}
                  />
                );
              })}
            </div>

            <button onClick={addExpRow} style={{
              marginTop:12, width:"100%", padding:"11px",
              background:"none", border:"1.5px dashed #1e293b",
              color:"#475569", borderRadius:10, cursor:"pointer",
              fontFamily:"inherit", fontSize:14, fontWeight:700,
            }}>+ إضافة خانة صرف جديدة</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pop { from{opacity:0;transform:translateX(-50%) scale(.9)} to{opacity:1;transform:translateX(-50%) scale(1)} }
        input:focus,select:focus{border-color:#6366f1!important;outline:none}
        input::placeholder{color:#334155}
        select option{background:#0d1117;color:#f1f5f9}
        *{box-sizing:border-box}
        button:hover{opacity:.85}
      `}</style>
    </div>
  );
}

function ExpRow({ exp, idx, remaining, monthIncome, onChange, onDelete }) {
  const hasAmount = parseFloat(exp.amount) > 0;
  const pct = monthIncome > 0 && hasAmount ? Math.min((parseFloat(exp.amount) / monthIncome) * 100, 100) : 0;
  const remColor = remaining < 0 ? "#ef4444" : remaining < monthIncome * 0.1 ? "#f97316" : "#22c55e";

  return (
    <div style={{
      background:"#0d1117", border:"1px solid #1e293b",
      borderRadius:14, padding:"12px",
      borderRight: hasAmount ? `3px solid ${CAT_COLORS[exp.cat]||"#6366f1"}` : "3px solid #1e293b",
    }}>
      {/* Row number + delete */}
      <div style={{display:"flex", justifyContent:"space-between", marginBottom:8}}>
        <span style={{fontSize:11, color:"#334155", fontWeight:700}}>صرف #{idx+1}</span>
        <button onClick={onDelete} style={{
          background:"none", border:"none", color:"#334155",
          cursor:"pointer", fontSize:15, padding:0,
        }}>✕</button>
      </div>

      {/* desc + amount */}
      <div style={{display:"grid", gridTemplateColumns:"1.8fr 1fr", gap:8, marginBottom:8}}>
        <input
          type="text"
          placeholder="على ماذا صرفت؟"
          value={exp.desc}
          onChange={e=>onChange("desc",e.target.value)}
          style={{
            padding:"9px 11px", borderRadius:9,
            border:"1.5px solid #1e293b", background:"#070b12",
            color:"#f1f5f9", fontSize:14, fontFamily:"inherit",
          }}
        />
        <input
          type="number"
          placeholder="المبلغ"
          value={exp.amount}
          onChange={e=>onChange("amount",e.target.value)}
          style={{
            padding:"9px 11px", borderRadius:9,
            border:"1.5px solid #1e293b", background:"#070b12",
            color:"#f1f5f9", fontSize:14, fontFamily:"inherit",
          }}
        />
      </div>

      {/* cat + day */}
      <div style={{display:"grid", gridTemplateColumns:"2fr 1fr", gap:8, marginBottom: hasAmount ? 10 : 0}}>
        <select
          value={exp.cat}
          onChange={e=>onChange("cat",e.target.value)}
          style={{
            padding:"8px 10px", borderRadius:9,
            border:"1.5px solid #1e293b", background:"#070b12",
            color: CAT_COLORS[exp.cat]||"#94a3b8", fontSize:13,
            fontFamily:"inherit", cursor:"pointer",
          }}
        >
          {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="number"
          placeholder="اليوم"
          min="1" max="31"
          value={exp.day}
          onChange={e=>onChange("day",e.target.value)}
          style={{
            padding:"8px 10px", borderRadius:9,
            border:"1.5px solid #1e293b", background:"#070b12",
            color:"#94a3b8", fontSize:13, fontFamily:"inherit",
          }}
        />
      </div>

      {/* Remaining indicator */}
      {hasAmount && (
        <div>
          <div style={{background:"#1e293b", borderRadius:6, height:5, overflow:"hidden", marginBottom:5}}>
            <div style={{
              width:`${pct}%`, height:"100%",
              background: CAT_COLORS[exp.cat]||"#6366f1",
              borderRadius:6, transition:"width .3s",
            }}/>
          </div>
          <div style={{display:"flex", justifyContent:"space-between"}}>
            <span style={{fontSize:11, color:"#475569"}}>
              الصرف: <strong style={{color:"#f1f5f9"}}>{fmt(parseFloat(exp.amount)||0)} د.ع</strong>
            </span>
            <span style={{fontSize:11, color:remColor, fontWeight:700}}>
              الباقي: {fmt(remaining)} د.ع
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
