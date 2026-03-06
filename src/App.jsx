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

const C = ["#3b82f6","#8b5cf6","#ec4899","#f97316","#10b981","#f43f5e","#06b6d4","#a855f7"];
const fmt = n => n==null?"—":n>=1000?(n/1000).toFixed(1)+"K":Number(n).toLocaleString();
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const formatDate = val => {
  if (!val) return null;
  if (val instanceof Date) return `${String(val.getDate()).padStart(2,'0')}-${MONTHS[val.getMonth()]}`;
  if (typeof val==='string' && val.includes('.')) {
    const p=val.split('.');
    if(p.length===3) return `${p[0]}-${MONTHS[parseInt(p[1])-1]}`;
    return val.trim();
  }
  if (typeof val==='number') {
    const d=new Date((val-25569)*86400*1000);
    return `${String(d.getDate()).padStart(2,'0')}-${MONTHS[d.getMonth()]}`;
  }
  return val?.toString().trim()||null;
};

// Row 0-2=header, Row 3=col names, Row 4=sub-header, Row 5+=data, Last=G-Total
const parseAmantexSheet = ws => {
  const rows = XLSX.utils.sheet_to_json(ws, {header:1, defval:null});
  const result = [];
  for (let i=5; i<rows.length; i++) {
    const row=rows[i];
    if (!row||row[0]==null) continue;
    const str=row[0]?.toString().toLowerCase()||'';
    if (str.includes('total')||str.includes('grand')||str.includes('g-total')) continue;
    const date=formatDate(row[0]);
    if (!date) continue;
    const check=Number(row[1])||0;
    if (check===0) continue;
    const pass  =Number(row[2])||0;
    const reject=Number(row[3])||0;
    const rejPct=Number(row[4])||0;
    const defect=Number(row[5])||0;
    const defPct=Number(row[6])||0;
    result.push({date,totalCheck:check,qcPass:pass,reject,defect,rejPct:rejPct*100,defPct:defPct*100});
  }
  return result;
};

const CTip = ({active,payload,label,dark}) => {
  if (!active||!payload?.length) return null;
  return (
    <div style={{background:dark?"rgba(15,23,42,0.97)":"rgba(255,255,255,0.97)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:12,padding:"10px 14px",backdropFilter:"blur(12px)",boxShadow:"0 8px 32px rgba(0,0,0,0.2)",maxWidth:180}}>
      <p style={{color:dark?"#94a3b8":"#64748b",fontSize:10,fontWeight:600,marginBottom:5,textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</p>
      {payload.map((p,i)=>(
        <p key={i} style={{color:p.color,fontSize:12,fontWeight:700,margin:"2px 0"}}>
          <span style={{color:dark?"#e2e8f0":"#1e293b"}}>{p.name}: </span>
          {Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

const Spark = ({data,color,k}) => (
  <ResponsiveContainer width="100%" height={26}>
    <LineChart data={data} margin={{top:2,right:2,left:2,bottom:2}}>
      <Line type="monotone" dataKey={k} stroke={color} strokeWidth={2} dot={false}/>
    </LineChart>
  </ResponsiveContainer>
);

const Gauge = ({value,dark}) => {
  const good=value<0.5, fill=good?"#10b981":"#f43f5e";
  const pv=Math.min(value/1.0,1);
  const gd=[{v:pv*100,fill},{v:(1-pv)*100,fill:dark?"rgba(51,65,85,0.5)":"rgba(226,232,240,0.7)"}];
  return (
    <div style={{position:"relative",display:"flex",flexDirection:"column",alignItems:"center"}}>
      <ResponsiveContainer width="100%" height={140}>
        <PieChart>
          <Pie data={gd} cx="50%" cy="80%" startAngle={180} endAngle={0} innerRadius={48} outerRadius={70} dataKey="v" stroke="none" paddingAngle={2}>
            {gd.map((e,i)=><Cell key={i} fill={e.fill}/>)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div style={{position:"absolute",bottom:2,textAlign:"center"}}>
        <span style={{fontFamily:"monospace",fontSize:22,fontWeight:900,color:fill}}>{value.toFixed(2)}%</span>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:3,marginTop:2,fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,background:good?"rgba(16,185,129,0.15)":"rgba(244,63,94,0.15)",color:fill}}>
          {good?<CheckCircle size={9}/>:<XCircle size={9}/>}{good?"Excellent Quality":"Needs Attention"}
        </div>
      </div>
    </div>
  );
};

const UploadScreen = ({onFile,dark,onToggle}) => {
  const [drag,setDrag]=useState(false);
  const handle=e=>{e.preventDefault();const f=e.dataTransfer?.files[0]||e.target.files[0];if(f)onFile(f);};
  return (
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:dark?"#030712":"#f1f5f9",padding:20}}>
      <button onClick={onToggle} style={{position:"fixed",top:14,right:14,padding:"8px",borderRadius:10,border:"1px solid rgba(99,102,241,0.3)",cursor:"pointer",background:"rgba(99,102,241,0.1)",color:dark?"#fbbf24":"#6366f1",display:"flex",alignItems:"center"}}>
        {dark?<Sun size={14}/>:<Moon size={14}/>}
      </button>
      <div style={{maxWidth:440,width:"100%"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:24}}>
          <div style={{width:50,height:50,borderRadius:14,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(99,102,241,0.4)"}}>
            <span style={{color:"#fff",fontWeight:900,fontSize:22}}>A</span>
          </div>
          <div>
            <div style={{fontWeight:800,fontSize:19,color:dark?"#e2e8f0":"#0f172a"}}>Amantex Limited</div>
            <div style={{fontSize:10,color:"#64748b",letterSpacing:"0.05em",textTransform:"uppercase"}}>Quality Analytics System</div>
          </div>
        </div>
        <div onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{setDrag(false);handle(e)}} onClick={()=>document.getElementById("xl").click()}
          style={{border:`2px dashed ${drag?"#6366f1":dark?"rgba(99,102,241,0.4)":"rgba(99,102,241,0.3)"}`,borderRadius:20,padding:"36px 24px",background:dark?"rgba(15,23,42,0.6)":"rgba(255,255,255,0.85)",backdropFilter:"blur(20px)",cursor:"pointer",textAlign:"center",marginBottom:14}}>
          <div style={{width:56,height:56,borderRadius:15,background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.25)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px"}}>
            <FileSpreadsheet size={26} color="#6366f1"/>
          </div>
          <p style={{fontWeight:800,fontSize:17,color:dark?"#e2e8f0":"#0f172a",marginBottom:4}}>Excel ফাইল আপলোড করুন</p>
          <p style={{fontSize:12,color:"#64748b"}}>ক্লিক করুন বা ড্র্যাগ করুন (.xlsx)</p>
        </div>
        <input id="xl" type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={handle}/>
        <div style={{padding:"12px 16px",background:dark?"rgba(15,23,42,0.7)":"rgba(255,255,255,0.85)",borderRadius:12,border:"1px solid rgba(99,102,241,0.18)"}}>
          <p style={{fontSize:10,fontWeight:700,color:"#6366f1",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>✅ সাপোর্টেড শিট</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5}}>
            {["🧵 EMB-January26","🧵 EMB-February","🖨️ Printing January26","🖨️ Printing February26"].map(s=>(
              <div key={s} style={{background:dark?"rgba(99,102,241,0.08)":"rgba(99,102,241,0.05)",borderRadius:7,padding:"5px 8px",fontSize:10,color:dark?"#c7d2fe":"#4338ca",fontWeight:600}}>{s}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [dark,setDark]=useState(true);
  const [dept,setDept]=useState("embroidery");
  const [month,setMonth]=useState("all");
  const [sheets,setSheets]=useState(null);
  const [allSheets,setAll]=useState({});
  const [fileName,setFileName]=useState("");
  const [error,setError]=useState("");

  const bg=dark
    ?{page:"#030712",card:"rgba(15,23,42,0.75)",border:"rgba(99,102,241,0.2)",text:"#e2e8f0",sub:"#64748b"}
    :{page:"#f1f5f9",card:"rgba(255,255,255,0.82)",border:"rgba(99,102,241,0.18)",text:"#0f172a",sub:"#64748b"};
  const card={background:bg.card,border:`1px solid ${bg.border}`,borderRadius:18,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",boxShadow:dark?"0 4px 24px rgba(0,0,0,0.35)":"0 4px 24px rgba(99,102,241,0.07)"};
  const grid={stroke:dark?"rgba(71,85,105,0.35)":"rgba(203,213,225,0.5)",strokeDasharray:"3 3"};
  const tick={fill:dark?"#4b5563":"#9ca3af",fontSize:10};

  const handleFile=useCallback(file=>{
    setError("");
    const reader=new FileReader();
    reader.onload=e=>{
      try {
        const wb=XLSX.read(e.target.result,{type:"array",cellDates:true});
        const getLabel=n=>{
          const nl=n.toLowerCase();
          if(nl.includes("jan")) return "January";
          if(nl.includes("feb")) return "February";
          if(nl.includes("mar")) return "March";
          return n;
        };
        const embData={},printData={};
        wb.SheetNames.forEach(n=>{
          const nl=n.toLowerCase();
          const data=parseAmantexSheet(wb.Sheets[n]);
          if(!data.length) return;
          const label=getLabel(n);
          if(nl.includes("emb")) embData[label]=data;
          else if(nl.includes("print")) printData[label]=data;
        });
        if(!Object.keys(embData).length&&!Object.keys(printData).length){setError("ডেটা পাওয়া যায়নি!");return;}
        const all=obj=>Object.values(obj).flat();
        setAll({embroidery:embData,printing:printData});
        setSheets({embroidery:all(embData),printing:all(printData)});
        setMonth("all"); setFileName(file.name);
      } catch(err){setError("ফাইল পড়তে সমস্যা: "+err.message);}
    };
    reader.readAsArrayBuffer(file);
  },[]);

  const data=useMemo(()=>{
    if(!sheets) return [];
    if(month==="all") return sheets[dept]??[];
    return allSheets?.[dept]?.[month]??[];
  },[sheets,allSheets,dept,month]);

  const months=useMemo(()=>Object.keys(allSheets[dept]??{}),[allSheets,dept]);

  const T=useMemo(()=>{
    if(!data.length) return {check:0,pass:0,rej:0,def:0,rejPct:0,defPct:0};
    const t=data.reduce((a,d)=>({check:a.check+d.totalCheck,pass:a.pass+d.qcPass,rej:a.rej+d.reject,def:a.def+d.defect}),{check:0,pass:0,rej:0,def:0});
    return {...t,rejPct:t.check?(t.rej/t.check)*100:0,defPct:t.check?(t.def/t.check)*100:0};
  },[data]);

  const exportCSV=()=>{
    if(!data.length) return;
    const csv=["Date,Total Check,QC Pass,Reject,Reject%,Defect,Defect%",...data.map(r=>`${r.date},${r.totalCheck},${r.qcPass},${r.reject},${r.rejPct.toFixed(2)},${r.defect},${r.defPct.toFixed(2)}`)].join("\n");
    const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([csv],{type:"text/csv"})),download:`${dept}-${month}.csv`});
    a.click();
  };

  if(!sheets) return <UploadScreen onFile={handleFile} dark={dark} onToggle={()=>setDark(!dark)}/>;

  const intv=Math.max(0,Math.floor(data.length/6)-1);
  const kpis=[
    {title:"Total Check",val:fmt(T.check),icon:Package,color:"#3b82f6",k:"totalCheck"},
    {title:"QC Pass",val:fmt(T.pass),icon:CheckCircle,color:"#10b981",k:"qcPass"},
    {title:"Reject Qty",val:fmt(T.rej),icon:XCircle,color:"#f43f5e",k:"reject"},
    {title:"Reject Rate",val:T.rejPct.toFixed(2)+"%",icon:Percent,color:T.rejPct<0.5?"#10b981":"#f43f5e",k:"reject"},
    {title:"Total Defect",val:fmt(T.def),icon:AlertTriangle,color:"#8b5cf6",k:"defect"},
    {title:"Defect Rate",val:T.defPct.toFixed(2)+"%",icon:Activity,color:"#ec4899",k:"defect"},
  ];

  return (
    <div style={{minHeight:"100vh",background:bg.page,color:bg.text,fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-20%",left:"-10%",width:500,height:500,background:"radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)",borderRadius:"50%"}}/>
        <div style={{position:"absolute",bottom:"-15%",right:"-5%",width:400,height:400,background:"radial-gradient(circle,rgba(236,72,153,0.08) 0%,transparent 70%)",borderRadius:"50%"}}/>
      </div>

      <div style={{position:"relative",zIndex:1,maxWidth:860,margin:"0 auto",padding:"10px 10px 40px"}}>

        {/* HEADER */}
        <div style={{...card,padding:"12px 14px",marginBottom:10}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,#6366f1,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                <span style={{color:"#fff",fontWeight:900,fontSize:16}}>A</span>
              </div>
              <div>
                <div style={{fontWeight:800,fontSize:13}}>Amantex Limited</div>
                <div style={{fontSize:9,color:bg.sub,textTransform:"uppercase",letterSpacing:"0.05em"}}>Quality Analytics</div>
              </div>
            </div>
            <div style={{display:"flex",gap:5}}>
              <button onClick={exportCSV} style={{padding:"6px 9px",borderRadius:8,border:"1px solid rgba(16,185,129,0.3)",background:"rgba(16,185,129,0.1)",color:"#10b981",cursor:"pointer",display:"flex",alignItems:"center",gap:3,fontSize:10,fontWeight:600}}>
                <Download size={10}/> CSV
              </button>
              <button onClick={()=>setDark(!dark)} style={{padding:"6px 9px",borderRadius:8,border:`1px solid ${bg.border}`,background:dark?"rgba(251,191,36,0.1)":"rgba(99,102,241,0.1)",color:dark?"#fbbf24":"#6366f1",cursor:"pointer",display:"flex",alignItems:"center"}}>
                {dark?<Sun size={12}/>:<Moon size={12}/>}
              </button>
              <button onClick={()=>setSheets(null)} style={{padding:"6px 9px",borderRadius:8,border:"1px solid rgba(99,102,241,0.3)",background:"rgba(99,102,241,0.1)",color:"#818cf8",cursor:"pointer",display:"flex",alignItems:"center"}}>
                <RefreshCw size={12}/>
              </button>
            </div>
          </div>
          {/* Dept */}
          <div style={{display:"flex",gap:4,marginBottom:8}}>
            {["embroidery","printing"].map(d=>(
              <button key={d} onClick={()=>{setDept(d);setMonth("all");}} style={{flex:1,padding:"8px",borderRadius:10,border:"none",cursor:"pointer",fontSize:12,fontWeight:700,transition:"all 0.2s",background:dept===d?"linear-gradient(135deg,#6366f1,#8b5cf6)":"transparent",color:dept===d?"#fff":bg.sub,display:"flex",alignItems:"center",justifyContent:"center",gap:5}}>
                {d==="embroidery"?<Scissors size={12}/>:<Printer size={12}/>}
                {d==="embroidery"?"Embroidery 🧵":"Printing 🖨️"}
              </button>
            ))}
          </div>
          {/* Month */}
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {["all",...months].map(m=>(
              <button key={m} onClick={()=>setMonth(m)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${month===m?"#6366f1":dark?"rgba(99,102,241,0.2)":"rgba(99,102,241,0.15)"}`,cursor:"pointer",fontSize:11,fontWeight:600,background:month===m?"rgba(99,102,241,0.2)":"transparent",color:month===m?"#818cf8":bg.sub,whiteSpace:"nowrap"}}>
                {m==="all"?"📅 সব মাস":m}
              </button>
            ))}
          </div>
          <p style={{margin:"6px 0 0",fontSize:9,color:bg.sub}}>📁 {fileName}</p>
        </div>

        {error&&<div style={{...card,padding:"10px 14px",marginBottom:10,background:"rgba(244,63,94,0.12)",border:"1px solid rgba(244,63,94,0.3)",color:"#f43f5e",fontSize:12,fontWeight:600}}>⚠️ {error}</div>}

        {data.length===0?(
          <div style={{...card,padding:40,textAlign:"center",color:bg.sub}}><p style={{fontWeight:600}}>কোনো ডেটা নেই</p></div>
        ):(
          <>
            {/* KPI — 2 cols mobile */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
              {kpis.map(({title,val,icon:Icon,color,k})=>(
                <div key={title} style={{...card,padding:"11px 11px 9px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:-18,right:-18,width:65,height:65,background:`radial-gradient(circle,${color}20 0%,transparent 70%)`,borderRadius:"50%"}}/>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:3}}>
                    <p style={{fontSize:9,fontWeight:600,color:bg.sub,textTransform:"uppercase",letterSpacing:"0.05em",margin:0,lineHeight:1.2}}>{title}</p>
                    <div style={{background:`${color}18`,borderRadius:6,padding:4,border:`1px solid ${color}22`}}><Icon size={11} color={color}/></div>
                  </div>
                  <div style={{fontFamily:"monospace",fontSize:19,fontWeight:800,color:bg.text,lineHeight:1,marginBottom:2}}>{val}</div>
                  <div style={{height:22}}><Spark data={data.slice(-10)} color={color} k={k}/></div>
                </div>
              ))}
            </div>

            {/* Daily Chart */}
            <div style={{...card,padding:"14px 14px 16px",marginBottom:10}}>
              <h2 style={{margin:"0 0 2px",fontSize:13,fontWeight:800}}>Daily Production</h2>
              <p style={{margin:"0 0 10px",fontSize:10,color:bg.sub}}>Check · Pass · Reject — {month==="all"?"সব মাস":month}</p>
              <div style={{height:200}}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data} margin={{top:4,right:4,left:-12,bottom:4}}>
                    <defs>
                      <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                      <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="100%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
                    </defs>
                    <CartesianGrid {...grid} vertical={false}/>
                    <XAxis dataKey="date" tick={tick} axisLine={false} tickLine={false} interval={intv}/>
                    <YAxis tick={tick} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}K`:v} width={32}/>
                    <Tooltip content={<CTip dark={dark}/>}/>
                    <Area type="monotone" dataKey="totalCheck" name="Total Check" stroke="#3b82f6" strokeWidth={2} fill="url(#gC)" dot={false}/>
                    <Area type="monotone" dataKey="qcPass" name="QC Pass" stroke="#10b981" strokeWidth={2} fill="url(#gP)" dot={false}/>
                    <Line type="monotone" dataKey="reject" name="Reject" stroke="#f43f5e" strokeWidth={2} dot={{r:2,fill:"#f43f5e"}}/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gauge */}
            <div style={{...card,padding:"14px 14px 12px",marginBottom:10}}>
              <h2 style={{margin:"0 0 2px",fontSize:13,fontWeight:800}}>Performance Gauge</h2>
              <p style={{margin:"0 0 4px",fontSize:10,color:bg.sub}}>Reject Rate vs Industry Standard ≤ 0.50%</p>
              <Gauge value={T.rejPct} dark={dark}/>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginTop:8}}>
                {[["Target","≤ 0.50%","#f97316"],["Actual",T.rejPct.toFixed(2)+"%",T.rejPct<0.5?"#10b981":"#f43f5e"],["Days",data.length+"d","#6366f1"]].map(([l,v,c])=>(
                  <div key={l} style={{textAlign:"center",background:dark?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)",borderRadius:10,padding:"7px 4px"}}>
                    <div style={{fontSize:9,color:bg.sub,textTransform:"uppercase",letterSpacing:"0.05em"}}>{l}</div>
                    <div style={{fontSize:15,fontWeight:800,color:c,fontFamily:"monospace"}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Defect Bar */}
            <div style={{...card,padding:"14px 14px 16px",marginBottom:10}}>
              <h2 style={{margin:"0 0 2px",fontSize:13,fontWeight:800}}>Daily Defect Qty</h2>
              <p style={{margin:"0 0 10px",fontSize:10,color:bg.sub}}>প্রতিদিনের ত্রুটির সংখ্যা</p>
              <div style={{height:190}}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{top:4,right:4,left:-12,bottom:4}}>
                    <CartesianGrid {...grid} vertical={false}/>
                    <XAxis dataKey="date" tick={tick} axisLine={false} tickLine={false} interval={intv}/>
                    <YAxis tick={tick} axisLine={false} tickLine={false} width={32}/>
                    <Tooltip content={<CTip dark={dark}/>}/>
                    <Bar dataKey="defect" name="Defect" radius={[3,3,0,0]} barSize={9}>
                      {data.map((_,i)=><Cell key={i} fill={C[i%C.length]}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie */}
            <div style={{...card,padding:"14px 14px 12px",marginBottom:10}}>
              <h2 style={{margin:"0 0 2px",fontSize:13,fontWeight:800}}>Pass vs Reject vs Defect</h2>
              <p style={{margin:"0 0 8px",fontSize:10,color:bg.sub}}>মোট অনুপাত</p>
              <div style={{display:"flex",alignItems:"center"}}>
                <div style={{flex:1,height:190}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[{name:"QC Pass",value:T.pass},{name:"Rejected",value:T.rej},{name:"Defect",value:T.def}]}
                        cx="50%" cy="50%" innerRadius={48} outerRadius={80} paddingAngle={4} dataKey="value"
                        stroke={dark?"rgba(3,7,18,0.6)":"rgba(255,255,255,0.8)"} strokeWidth={2}>
                        {["#10b981","#f43f5e","#f97316"].map((c,i)=><Cell key={i} fill={c}/>)}
                      </Pie>
                      <Tooltip content={<CTip dark={dark}/>}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{width:105}}>
                  {[["QC Pass",fmt(T.pass),"#10b981"],["Rejected",fmt(T.rej),"#f43f5e"],["Defect",fmt(T.def),"#f97316"]].map(([l,v,c])=>(
                    <div key={l} style={{display:"flex",alignItems:"center",gap:6,marginBottom:14}}>
                      <div style={{width:9,height:9,borderRadius:2,background:c,flexShrink:0}}/>
                      <div>
                        <div style={{fontSize:10,color:bg.sub}}>{l}</div>
                        <div style={{fontSize:13,fontWeight:800,color:bg.text,fontFamily:"monospace"}}>{v}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top 5 Table */}
            <div style={{...card,padding:"14px 14px",marginBottom:10}}>
              <h2 style={{margin:"0 0 2px",fontSize:13,fontWeight:800}}>🔴 Top 5 Reject Days</h2>
              <p style={{margin:"0 0 10px",fontSize:10,color:bg.sub}}>সবচেয়ে বেশি রিজেক্ট হওয়া দিন</p>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                  <thead>
                    <tr>{["তারিখ","Check","Pass","Reject","Rate","Defect"].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"6px 8px",borderBottom:`1px solid ${bg.border}`,color:bg.sub,fontSize:9,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {[...data].sort((a,b)=>b.reject-a.reject).slice(0,5).map((r,i)=>{
                      const rp=r.totalCheck?((r.reject/r.totalCheck)*100).toFixed(2):"0.00";
                      return (
                        <tr key={i} style={{borderBottom:`1px solid ${bg.border}25`}}>
                          <td style={{padding:"8px",fontWeight:700,color:bg.text,whiteSpace:"nowrap"}}>{r.date}</td>
                          <td style={{padding:"8px",fontFamily:"monospace",color:bg.text}}>{fmt(r.totalCheck)}</td>
                          <td style={{padding:"8px",color:"#10b981",fontFamily:"monospace"}}>{fmt(r.qcPass)}</td>
                          <td style={{padding:"8px",color:"#f43f5e",fontWeight:700,fontFamily:"monospace"}}>{r.reject}</td>
                          <td style={{padding:"8px"}}>
                            <span style={{background:Number(rp)>0.5?"rgba(244,63,94,0.15)":"rgba(16,185,129,0.12)",color:Number(rp)>0.5?"#f43f5e":"#10b981",padding:"2px 7px",borderRadius:20,fontWeight:700,fontSize:10}}>{rp}%</span>
                          </td>
                          <td style={{padding:"8px",color:"#f97316",fontFamily:"monospace"}}>{r.defect}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div style={{...card,padding:"10px 14px",display:"flex",flexWrap:"wrap",gap:12,alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",gap:14,flexWrap:"wrap"}}>
                {[["Dept",dept==="embroidery"?"Embroidery":"Printing","#8b5cf6"],["Month",month==="all"?"All":month,"#3b82f6"],["Grade",T.rejPct<0.5?"A+ ✓":"B",T.rejPct<0.5?"#10b981":"#f97316"]].map(([l,v,c])=>(
                  <div key={l}>
                    <div style={{fontSize:9,color:bg.sub,textTransform:"uppercase",letterSpacing:"0.05em"}}>{l}</div>
                    <div style={{fontSize:13,fontWeight:800,color:c,fontFamily:"monospace"}}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{fontSize:9,color:bg.sub}}>Amantex QA v3.1</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
