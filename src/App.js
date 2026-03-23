import { useState, useEffect, useRef } from "react";

/* ─── Palette ────────────────────────────────────────────────────────────── */
const C = {
  navy:"#1A3C5E", accent:"#2A7FBF", light:"#EBF4FB",
  gold:"#C8962A", goldL:"#FDF6E3",
  green:"#276749", greenL:"#F0FFF4",
  red:"#C53030", redL:"#FFF5F5",
  border:"#C8D8E8", bg:"#F0F5FA", white:"#FFFFFF", muted:"#667788",
};

/* ─── Defaults ───────────────────────────────────────────────────────────── */
const FIRM0 = { name:"Plus Accounting", afm:"000000000", doy:"ΔΟΥ ...", address:"...", phone:"210 0000000", email:"info@plusaccounting.gr" };
const CLIENTS0 = [
  { id:"c1", name:"Νίκος Παπαδόπουλος", afm:"123456789", doy:"ΔΟΥ Αθηνών Α΄", address:"Λεωφ. Αθηνών 10, Αθήνα", email:"nikos@example.gr", phone:"6900000001", type:"individual" },
  { id:"c2", name:"ΑΛΦΑ ΜΟΝΟΠΡΟΣΩΠΗ ΕΠΕ", afm:"987654321", doy:"ΔΟΥ Πειραιά", address:"Σταδίου 25, Πειραιάς", email:"info@alfa.gr", phone:"2100000002", type:"business" },
];
const PKGS0 = [
  { id:"p1", name:"Βασικό Πακέτο Λογιστικής", desc:"Μηνιαία τήρηση βιβλίων, ΦΠΑ, μισθοδοσία έως 3 εργαζόμενοι", price:150, vat:24 },
  { id:"p2", name:"Πλήρες Πακέτο Επιχείρησης", desc:"Πλήρης λογιστική υποστήριξη, φορολογικές δηλώσεις, ισολογισμός", price:350, vat:24 },
  { id:"p3", name:"Φορολογική Δήλωση Φυσικού Προσώπου", desc:"Σύνταξη & υποβολή Ε1, Ε2, Ε3", price:80, vat:24 },
  { id:"p4", name:"Παρακολούθηση ΜΥΦ/VIES", desc:"Μηνιαία υποβολή συγκεντρωτικών καταστάσεων", price:60, vat:24 },
];

/* ─── localStorage helpers ───────────────────────────────────────────────── */
const lsGet = (k, fb) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch { return fb; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function nextNo(hist, type) {
  const pre = type==="prosfora" ? "ΠΡΟ" : "ΣΥΜ", yr = new Date().getFullYear();
  return `${pre}-${yr}-${String(hist.filter(d=>d.type===type&&d.docNo?.startsWith(`${pre}-${yr}`)).length+1).padStart(3,"0")}`;
}
function calcP(net, vatR) {
  const n = parseFloat(net)||0, v = +(n*vatR/100).toFixed(2);
  return { netPrice:n.toFixed(2), vatAmount:v.toFixed(2), totalPrice:(n+v).toFixed(2) };
}
function fmtD(ds) { try { return new Date(ds).toLocaleDateString("el-GR"); } catch { return ds||""; } }
function xe(s) { return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

/* ─── Build printable document HTML ─────────────────────────────────────── */
function buildDocHtml(d, logo) {
  const {docType,docNo,docDate,firm,client,pkg,netPrice,vatAmount,totalPrice,vatRate,payMethod,validDays,startDate,duration,notes} = d;
  const isP = docType === "prosfora";

  const logoHtml = logo ? `<img src="${logo.url}" style="height:48px;object-fit:contain;display:block;margin-bottom:6px;">` : "";

  const infoBox = rows => `<table style="width:100%;border-collapse:collapse;margin-bottom:12px;">${
    rows.map(([l,v]) => `<tr>
      <td style="padding:5px 10px;font-size:10pt;background:#EBF4FB;font-weight:700;color:#1A3C5E;width:34%;border:1px solid #2A7FBF;vertical-align:top;">${xe(l)}</td>
      <td style="padding:5px 10px;font-size:10pt;background:#EBF4FB;color:#333;border:1px solid #2A7FBF;vertical-align:top;">${xe(v||"—")}</td>
    </tr>`).join("")
  }</table>`;

  const priceTable = `<table style="width:100%;border-collapse:collapse;margin-bottom:10px;">
    <tr><td style="padding:5px 10px;font-size:10pt;border-bottom:1px solid #E0EBF5;">Καθαρή αξία (Net)</td><td style="padding:5px 10px;text-align:right;border-bottom:1px solid #E0EBF5;">${xe(netPrice)} €</td></tr>
    <tr><td style="padding:5px 10px;font-size:10pt;border-bottom:1px solid #E0EBF5;">ΦΠΑ / VAT ${vatRate}%</td><td style="padding:5px 10px;text-align:right;border-bottom:1px solid #E0EBF5;">${xe(vatAmount)} €</td></tr>
    <tr style="background:#EBF4FB;">
      <td style="padding:5px 10px;font-size:10pt;font-weight:700;color:#1A3C5E;border-top:2px solid #2A7FBF;"><strong>ΣΥΝΟΛΟ / TOTAL</strong></td>
      <td style="padding:5px 10px;font-weight:700;color:#1A3C5E;text-align:right;border-top:2px solid #2A7FBF;"><strong>${xe(totalPrice)} €</strong></td>
    </tr>
  </table>`;

  const sec = t => `<h3 style="font-size:10pt;font-weight:700;color:#2A7FBF;text-transform:uppercase;margin:16px 0 7px;border-bottom:1px solid #C8D8E8;padding-bottom:3px;">${t}</h3>`;
  const p = (t, extra="") => `<p style="font-size:10.5pt;line-height:1.65;margin:0 0 6px;${extra}">${xe(t)}</p>`;

  const sigTable = (l, r) => `
    <table style="width:100%;border-collapse:collapse;margin-top:48px;">
      <tr>
        <td style="width:50%;text-align:center;padding:0 20px;">
          <p style="font-size:10pt;font-weight:700;color:#1A3C5E;margin:0 0 52px;">${xe(l)}</p>
          <div style="border-bottom:1px solid #999;"></div>
          <p style="font-size:8.5pt;color:#888;font-style:italic;margin:4px 0 0;">Υπογραφή &amp; Σφραγίδα</p>
        </td>
        <td style="width:50%;text-align:center;padding:0 20px;">
          ${r ? `<p style="font-size:10pt;font-weight:700;color:#1A3C5E;margin:0 0 52px;">${xe(r)}</p><div style="border-bottom:1px solid #999;"></div><p style="font-size:8.5pt;color:#888;font-style:italic;margin:4px 0 0;">Υπογραφή &amp; Σφραγίδα</p>` : ""}
        </td>
      </tr>
    </table>`;

  const body = isP ? `
    ${sec("ΣΤΟΙΧΕΙΑ ΠΕΛΑΤΗ / CLIENT")}
    ${infoBox([["Επωνυμία",client.name],["ΑΦΜ",client.afm],["ΔΟΥ",client.doy],["Διεύθυνση",client.address],...(client.email?[["Email",client.email]]:[]),...(client.phone?[["Τηλέφωνο",client.phone]]:[]) ])}
    ${p(`Αγαπητέ/ή κύριε/α ${client.name},`,"margin-top:14px;")}
    ${p("Σας υποβάλλουμε την παρούσα προσφορά για την παροχή λογιστικών υπηρεσιών:")}
    ${sec("ΑΝΤΙΚΕΙΜΕΝΟ / SUBJECT")}
    ${infoBox([["Υπηρεσία",pkg.name],["Περιγραφή",pkg.desc]])}
    ${sec("ΑΝΑΛΥΣΗ ΚΟΣΤΟΥΣ / COST BREAKDOWN")}
    ${priceTable}
    ${p(`Τρόπος Πληρωμής / Payment: ${payMethod}`)}
    ${p(`Ισχύς Προσφοράς / Validity: ${validDays} ημέρες από ${fmtD(docDate)}`)}
    ${notes ? sec("ΠΑΡΑΤΗΡΗΣΕΙΣ / NOTES") + p(notes) : ""}
    <div style="margin-top:28px;">
      ${p("Παραμένουμε στη διάθεσή σας για οποιαδήποτε διευκρίνιση.","font-style:italic;color:#555;")}
      ${p("Με εκτίμηση,","margin-top:8px;")}
    </div>
    ${sigTable(firm.name, "")}
  ` : `
    ${p(`Στην Αθήνα, σήμερα ${fmtD(docDate)}, μεταξύ των:`)}
    ${infoBox([["Α) Ανάδοχος",`${firm.name}  |  ΑΦΜ: ${firm.afm}  |  ${firm.doy}`],["Διεύθυνση Αναδόχου",firm.address],["Β) Εντολέας",`${client.name}  |  ΑΦΜ: ${client.afm}  |  ${client.doy}`],["Διεύθυνση Εντολέα",client.address]])}
    ${p("συμφωνήθηκαν και έγιναν αμοιβαία αποδεκτά τα εξής:","font-style:italic;color:#555;")}
    ${sec("ΑΡΘΡΟ 1 — ΑΝΤΙΚΕΙΜΕΝΟ ΣΥΜΒΑΣΗΣ")}
    ${infoBox([["Υπηρεσία",pkg.name],["Περιγραφή",pkg.desc]])}
    ${sec("ΑΡΘΡΟ 2 — ΑΜΟΙΒΗ / REMUNERATION")}
    ${priceTable}
    ${p(`Τρόπος πληρωμής / Payment: ${payMethod}`)}
    ${sec("ΑΡΘΡΟ 3 — ΔΙΑΡΚΕΙΑ / DURATION")}
    ${p(`Έναρξη / Start: ${fmtD(startDate)}`)}
    ${p(`Διάρκεια / Duration: ${duration}`)}
    ${p("Η σύμβαση παρατείνεται αυτόματα εκτός εάν καταγγελθεί εγγράφως με 30 ημέρες προειδοποίηση.")}
    ${sec("ΑΡΘΡΟ 4 — ΥΠΟΧΡΕΩΣΕΙΣ ΜΕΡΩΝ")}
    ${p("Ο Εντολέας υποχρεούται να χορηγεί έγκαιρα τα απαραίτητα παραστατικά και στοιχεία.")}
    ${p("Ο Ανάδοχος υποχρεούται να τηρεί εχεμύθεια ως προς τα οικονομικά στοιχεία του Εντολέα.")}
    ${notes ? sec("ΑΡΘΡΟ 5 — ΛΟΙΠΕΣ ΣΥΜΦΩΝΙΕΣ") + p(notes) : ""}
    ${p("Το παρόν συντάχθηκε σε δύο (2) αντίτυπα και κάθε συμβαλλόμενος έλαβε από ένα (1) πρωτότυπο.","font-style:italic;color:#555;margin-top:20px;")}
    ${sigTable("Ο ΑΝΑΔΟΧΟΣ","Ο ΕΝΤΟΛΕΑΣ")}
  `;

  return `<!DOCTYPE html><html lang="el"><head><meta charset="UTF-8">
<title>${xe(docNo)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Calibri','Arial',sans-serif;font-size:11pt;color:#222;background:white;padding:18mm;}
  @page{size:A4;margin:18mm;}
  @media print{
    body{padding:0;}
    .no-print{display:none!important;}
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
  }
  .toolbar{position:fixed;top:0;left:0;right:0;background:#1A3C5E;color:white;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;z-index:100;font-family:Arial,sans-serif;}
  .toolbar h2{font-size:14px;font-weight:600;margin:0;}
  .btn-print{background:#C8962A;color:white;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;}
  .btn-print:hover{background:#a87820;}
  .btn-close{background:rgba(255,255,255,.15);color:white;border:1px solid rgba(255,255,255,.3);padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;}
  .doc-wrap{max-width:170mm;margin:60px auto 20px;}
  @media print{.toolbar{display:none;}.doc-wrap{margin:0;max-width:100%;}}
</style>
</head><body>
<div class="toolbar no-print">
  <h2>📄 ${xe(docNo)}</h2>
  <div style="display:flex;gap:10px;">
    <button class="btn-close" onclick="window.close()">✕ Κλείσιμο</button>
    <button class="btn-print" onclick="window.print()">🖨 Αποθήκευση ως PDF</button>
  </div>
</div>
<div class="doc-wrap">
  <!-- HEADER -->
  <div style="border-bottom:3px solid #1A3C5E;padding-bottom:10px;margin-bottom:16px;">
    ${logoHtml}
    <div style="font-size:15pt;font-weight:700;color:#1A3C5E;letter-spacing:1px;margin-bottom:3px;">${xe(firm.name.toUpperCase())}</div>
    <div style="font-size:9pt;color:#555;line-height:1.6;">
      ΑΦΜ: ${xe(firm.afm)} &nbsp;|&nbsp; ${xe(firm.doy)} &nbsp;|&nbsp; ${xe(firm.address)}<br>
      Τηλ: ${xe(firm.phone)} &nbsp;|&nbsp; Email: ${xe(firm.email)}
    </div>
  </div>
  <div style="font-size:16pt;font-weight:700;color:#1A3C5E;margin-bottom:10px;">${isP?"ΠΡΟΣΦΟΡΑ ΥΠΗΡΕΣΙΩΝ":"ΙΔΙΩΤΙΚΟ ΣΥΜΦΩΝΗΤΙΚΟ ΠΑΡΟΧΗΣ ΥΠΗΡΕΣΙΩΝ"}</div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
    <tr><td style="padding:5px 10px;background:#EBF4FB;font-weight:700;color:#1A3C5E;width:34%;border:1px solid #2A7FBF;font-size:10pt;">Αρ. Εγγράφου</td><td style="padding:5px 10px;background:#EBF4FB;border:1px solid #2A7FBF;font-size:10pt;">${xe(docNo)}</td></tr>
    <tr><td style="padding:5px 10px;background:#EBF4FB;font-weight:700;color:#1A3C5E;border:1px solid #2A7FBF;font-size:10pt;">Ημερομηνία / Date</td><td style="padding:5px 10px;background:#EBF4FB;border:1px solid #2A7FBF;font-size:10pt;">${fmtD(docDate)}</td></tr>
  </table>
  ${body}
  <div style="margin-top:24px;padding-top:8px;border-top:1px solid #CCC;font-size:8.5pt;color:#888;text-align:center;">
    ${xe(firm.name)} &nbsp;|&nbsp; ${xe(firm.email)} &nbsp;|&nbsp; ${xe(firm.phone)}
  </div>
</div>
</body></html>`;
}

/* ─── UI Atoms ───────────────────────────────────────────────────────────── */
const inp = {width:"100%",padding:"8px 11px",border:`1px solid ${C.border}`,borderRadius:6,fontSize:14,color:"#111",background:"#FAFCFF",boxSizing:"border-box",fontFamily:"inherit"};
const sel = {...inp,cursor:"pointer"};
function Lbl({t,req,children}){return(<div style={{marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:C.navy,textTransform:"uppercase",letterSpacing:.6,marginBottom:4}}>{t}{req&&<span style={{color:C.red}}> *</span>}</div>{children}</div>);}
function Card({children,style={}}){return <div style={{background:C.white,borderRadius:10,padding:20,boxShadow:"0 2px 12px rgba(26,60,94,.10)",...style}}>{children}</div>;}
function Btn({onClick,disabled,variant="primary",size="md",children,style={}}){
  const sz={sm:"5px 10px",md:"9px 20px",lg:"11px 26px"},fs={sm:12,md:13,lg:14};
  const vs={primary:{background:C.navy,color:"#fff",border:"none"},ghost:{background:C.light,color:C.accent,border:`1px solid ${C.accent}`},gold:{background:C.goldL,color:C.gold,border:`1px solid ${C.gold}`},danger:{background:C.redL,color:C.red,border:"1px solid #FC8181"},blue:{background:C.accent,color:"#fff",border:"none"},success:{background:C.greenL,color:C.green,border:"1px solid #68D391"}};
  return <button onClick={onClick} disabled={disabled} style={{...vs[variant],padding:sz[size],fontSize:fs[size],borderRadius:7,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",fontWeight:600,opacity:disabled?.5:1,...style}}>{children}</button>;
}
function Tag({color="blue",children}){
  const m={blue:{bg:C.light,fg:C.accent,br:C.accent},gold:{bg:C.goldL,fg:C.gold,br:C.gold},green:{bg:C.greenL,fg:C.green,br:"#68D391"}};
  const s=m[color];return <span style={{background:s.bg,color:s.fg,border:`1px solid ${s.br}`,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700}}>{children}</span>;
}
function Modal({title,onClose,children,wide=false}){return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.47)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}><div style={{background:C.white,borderRadius:12,width:"100%",maxWidth:wide?820:620,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 72px rgba(0,0,0,.3)"}}><div style={{padding:"18px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.white}}><h3 style={{margin:0,color:C.navy,fontSize:16}}>{title}</h3><button onClick={onClose} style={{background:"none",border:"none",fontSize:24,cursor:"pointer",color:"#aaa"}}>×</button></div><div style={{padding:24}}>{children}</div></div></div>);}
function ST({children}){return <div style={{fontSize:11,fontWeight:700,color:C.navy,textTransform:"uppercase",letterSpacing:.6,marginBottom:12}}>{children}</div>;}

/* ─── Main App ───────────────────────────────────────────────────────────── */
export default function App() {
  const [tab,setTab]=useState("new");
  const [firm,setFirm]=useState(()=>lsGet("pa_firm",FIRM0));
  const [logo,setLogo]=useState(()=>lsGet("pa_logo",null));
  const [clients,setClients]=useState(()=>lsGet("pa_clients",CLIENTS0));
  const [packages,setPackages]=useState(()=>lsGet("pa_packages",PKGS0));
  const [history,setHistory]=useState(()=>lsGet("pa_history",[]));

  const [docType,setDocType]=useState("prosfora");
  const [clientId,setClientId]=useState("");
  const [pkgId,setPkgId]=useState("");
  const [price,setPrice]=useState("");
  const [payMethod,setPayMethod]=useState("μηνιαίως");
  const [validDays,setValidDays]=useState("30");
  const [startDate,setStartDate]=useState(new Date().toISOString().slice(0,10));
  const [duration,setDuration]=useState("12 μήνες");
  const [notes,setNotes]=useState("");
  const [docDate,setDocDate]=useState(new Date().toISOString().slice(0,10));

  const [showCM,setShowCM]=useState(false);
  const [showPM,setShowPM]=useState(false);
  const [showFM,setShowFM]=useState(false);
  const [editDoc,setEditDoc]=useState(null);
  const [status,setStatus]=useState({msg:"",type:""});
  const [hFilt,setHFilt]=useState("all");
  const [hQ,setHQ]=useState("");
  const [cf,setCf]=useState({name:"",afm:"",doy:"",address:"",email:"",phone:"",type:"business"});
  const [pf,setPf]=useState({name:"",desc:"",price:"",vat:"24"});
  const [ff,setFf]=useState(FIRM0);
  const logoRef=useRef();

  // Persist to localStorage on every change
  useEffect(()=>lsSet("pa_firm",firm),[firm]);
  useEffect(()=>lsSet("pa_clients",clients),[clients]);
  useEffect(()=>lsSet("pa_packages",packages),[packages]);
  useEffect(()=>lsSet("pa_history",history),[history]);
  useEffect(()=>{ if(logo) lsSet("pa_logo",logo); },[logo]);

  const client=clients.find(c=>c.id===clientId);
  const pkg=packages.find(p=>p.id===pkgId);
  const netP=price||(pkg?.price??0);
  const vatRate=pkg?.vat??24;
  const prices=calcP(netP,vatRate);
  const canGen=!!(client&&pkg&&netP);

  function msg(m,t="info"){setStatus({msg:m,type:t});if(t!=="err")setTimeout(()=>setStatus({msg:"",type:""}),4000);}

  function handleLogoUpload(e){
    const file=e.target.files?.[0];if(!file)return;
    const reader=new FileReader();
    reader.onload=ev=>{const[meta,b64]=ev.target.result.split(",");setLogo({base64:b64,mime:meta.match(/:(.*?);/)?.[1]||"image/png",url:ev.target.result});};
    reader.readAsDataURL(file);
  }

  function buildPayload(docNo,histDoc=null){
    if(histDoc){
      const c=clients.find(x=>x.id===histDoc.clientId)||{name:histDoc.clientName,afm:"",doy:"",address:"",email:"",phone:""};
      const p=packages.find(x=>x.id===histDoc.pkgId)||{name:histDoc.pkgName,desc:""};
      const pr=calcP(histDoc.price,24);
      return{docType:histDoc.type,docNo:histDoc.docNo,docDate:histDoc.date,firm,client:c,pkg:p,...pr,vatRate:24,payMethod:histDoc.payMethod||"μηνιαίως",validDays:histDoc.validDays||"30",startDate:histDoc.startDate||histDoc.date,duration:histDoc.duration||"12 μήνες",notes:histDoc.notes||""};
    }
    return{docType,docNo,docDate,firm,client,pkg,...prices,vatRate,payMethod,validDays,startDate,duration,notes};
  }

  function openPdf(histDoc=null){
    const docNo=histDoc?histDoc.docNo:nextNo(history,docType);
    const html=buildDocHtml(buildPayload(docNo,histDoc),logo);
    const win=window.open("","_blank");
    win.document.write(html);
    win.document.close();
  }

  function handleSave(){
    if(!canGen)return;
    const docNo=editDoc?editDoc.docNo:nextNo(history,docType);
    const entry={id:editDoc?editDoc.id:"doc"+Date.now(),type:docType,docNo,clientName:client.name,clientId,pkgName:pkg.name,pkgId,price:prices.netPrice,payMethod,validDays,startDate,duration,notes,date:docDate,createdAt:editDoc?editDoc.createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    if(editDoc){setHistory(h=>h.map(d=>d.id===editDoc.id?entry:d));setEditDoc(null);}
    else{setHistory(h=>[entry,...h]);}
    msg("✓ Αποθηκεύτηκε!","ok");
    setTab("history");
  }

  function handleSaveAndPdf(){
    if(!canGen)return;
    const docNo=editDoc?editDoc.docNo:nextNo(history,docType);
    const entry={id:editDoc?editDoc.id:"doc"+Date.now(),type:docType,docNo,clientName:client.name,clientId,pkgName:pkg.name,pkgId,price:prices.netPrice,payMethod,validDays,startDate,duration,notes,date:docDate,createdAt:editDoc?editDoc.createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    if(editDoc){setHistory(h=>h.map(d=>d.id===editDoc.id?entry:d));setEditDoc(null);}
    else{setHistory(h=>[entry,...h]);}
    openPdf();
  }

  function loadEdit(doc){setEditDoc(doc);setDocType(doc.type);setClientId(doc.clientId);setPkgId(doc.pkgId);setPrice(doc.price);setPayMethod(doc.payMethod||"μηνιαίως");setValidDays(doc.validDays||"30");setStartDate(doc.startDate||doc.date);setDuration(doc.duration||"12 μήνες");setNotes(doc.notes||"");setDocDate(doc.date);setTab("new");}
  function addClient(){if(!cf.name||!cf.afm)return;const nc={...cf,id:"c"+Date.now()};setClients(p=>[...p,nc]);setClientId(nc.id);setCf({name:"",afm:"",doy:"",address:"",email:"",phone:"",type:"business"});setShowCM(false);}
  function addPkg(){if(!pf.name)return;const np={...pf,price:parseFloat(pf.price)||0,vat:parseInt(pf.vat)||24,id:"p"+Date.now()};setPackages(p=>[...p,np]);setPkgId(np.id);setPf({name:"",desc:"",price:"",vat:"24"});setShowPM(false);}

  const filtH=history.filter(d=>{if(hFilt!=="all"&&d.type!==hFilt)return false;const q=hQ.toLowerCase();return!q||d.clientName?.toLowerCase().includes(q)||d.docNo?.toLowerCase().includes(q);});
  const stC={ok:{bg:C.greenL,fg:C.green,br:"#68D391"},err:{bg:C.redL,fg:C.red,br:C.red},info:{bg:C.light,fg:C.accent,br:C.accent}};

  return(
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Palatino Linotype','Book Antiqua',Georgia,serif"}}>
      <div style={{background:C.navy}}>
        <div style={{maxWidth:1020,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:58,padding:"0 20px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {logo?<img src={logo.url} alt="logo" style={{height:34,objectFit:"contain"}}/>:<div style={{width:34,height:34,background:C.gold,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:17,color:"#fff"}}>P</div>}
            <div><div style={{fontWeight:700,fontSize:15,color:"#fff",letterSpacing:1.2}}>PLUS ACCOUNTING</div><div style={{fontSize:10,color:"rgba(255,255,255,.6)",letterSpacing:2.5,textTransform:"uppercase"}}>Document Generator</div></div>
          </div>
          <nav style={{display:"flex",gap:4}}>
            {[["new","✎ Νέο Έγγραφο"],["history",`📁 Ιστορικό (${history.length})`],["data","⚙ Δεδομένα"]].map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?"rgba(255,255,255,.15)":"none",border:tab===t?"1px solid rgba(255,255,255,.3)":"1px solid transparent",color:"#fff",padding:"6px 14px",borderRadius:6,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>{l}</button>
            ))}
          </nav>
        </div>
      </div>

      {status.msg&&(()=>{const s=stC[status.type]||stC.info;return(<div style={{background:s.bg,color:s.fg,borderBottom:`1px solid ${s.br}`,padding:"10px 20px",fontSize:13,textAlign:"center"}}>{status.msg}</div>);})()}

      <div style={{maxWidth:1020,margin:"0 auto",padding:"22px 16px"}}>
        {tab==="new"&&(<div>
          {editDoc&&(<div style={{background:C.goldL,border:`1px solid ${C.gold}`,borderRadius:8,padding:"10px 16px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:13,color:"#7A5C0A"}}>✎ Αναθεώρηση: <strong>{editDoc.docNo}</strong> — {editDoc.clientName}</span><button onClick={()=>setEditDoc(null)} style={{background:"none",border:"none",color:"#bbb",cursor:"pointer",fontSize:20}}>×</button></div>)}
          <Card style={{marginBottom:16}}><ST>Τύπος Εγγράφου</ST><div style={{display:"flex",gap:12}}>{[["prosfora","📄 Προσφορά Υπηρεσιών"],["symfonito","📜 Ιδιωτικό Συμφωνητικό"]].map(([v,l])=>(<button key={v} onClick={()=>setDocType(v)} style={{flex:1,padding:"12px",border:`2px solid ${docType===v?C.accent:C.border}`,background:docType===v?C.light:"#FAFCFF",borderRadius:8,cursor:"pointer",fontWeight:docType===v?700:400,color:docType===v?C.navy:"#666",fontSize:14,fontFamily:"inherit"}}>{l}</button>))}</div></Card>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <Card>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><ST>Πελάτης</ST><Btn size="sm" variant="ghost" onClick={()=>setShowCM(true)}>+ Νέος</Btn></div>
                <Lbl t="Επιλογή" req><select style={sel} value={clientId} onChange={e=>setClientId(e.target.value)}><option value="">— Επιλέξτε πελάτη —</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Lbl>
                {client&&(<div style={{background:C.light,borderRadius:6,padding:"10px 12px",fontSize:12,color:"#2c4a6a",lineHeight:1.75}}><div><strong>ΑΦΜ:</strong> {client.afm} · {client.doy}</div><div><strong>Διεύθ.:</strong> {client.address}</div>{client.email&&<div><strong>Email:</strong> {client.email}</div>}{client.phone&&<div><strong>Τηλ:</strong> {client.phone}</div>}<div style={{marginTop:5}}><Tag color="blue">{client.type==="business"?"Επιχείρηση":"Φυσικό Πρόσωπο"}</Tag></div></div>)}
              </Card>
              <Card>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><ST>Υπηρεσία / Πακέτο</ST><Btn size="sm" variant="ghost" onClick={()=>setShowPM(true)}>+ Νέο</Btn></div>
                <Lbl t="Επιλογή" req><select style={sel} value={pkgId} onChange={e=>{setPkgId(e.target.value);setPrice("");}}><option value="">— Επιλέξτε υπηρεσία —</option>{packages.map(p=><option key={p.id} value={p.id}>{p.name} ({p.price}€ + ΦΠΑ)</option>)}</select></Lbl>
                {pkg&&<div style={{background:C.light,borderRadius:6,padding:"9px 12px",fontSize:12,color:"#2c4a6a"}}>{pkg.desc}</div>}
              </Card>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              <Card>
                <ST>Οικονομικοί Όροι</ST>
                <Lbl t="Καθαρή Τιμή — Net (€)"><input style={inp} type="number" value={price} onChange={e=>setPrice(e.target.value)} placeholder={pkg?`Τιμή πακέτου: ${pkg.price}€`:"0.00"}/></Lbl>
                <Lbl t="Τρόπος Πληρωμής / Payment"><select style={sel} value={payMethod} onChange={e=>setPayMethod(e.target.value)}>{["μηνιαίως","τριμηνιαίως","εξαμηνιαίως","ετησίως","εφάπαξ"].map(o=><option key={o}>{o}</option>)}</select></Lbl>
                {netP?(<div style={{background:C.greenL,border:"1px solid #68D391",borderRadius:7,padding:"12px 14px",fontSize:13}}>
                  <div style={{color:C.muted,fontSize:11,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Ανάλυση</div>
                  {[["Καθαρή αξία (Net)",prices.netPrice+" €"],[`ΦΠΑ / VAT ${vatRate}%`,prices.vatAmount+" €"]].map(([l,v])=>(<div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{color:"#444"}}>{l}</span><span>{v}</span></div>))}
                  <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,color:C.green,borderTop:"1px solid #68D391",paddingTop:6,marginTop:4}}><span>ΣΥΝΟΛΟ / TOTAL</span><span>{prices.totalPrice} €</span></div>
                </div>):null}
              </Card>
              <Card>
                <ST>{docType==="prosfora"?"Στοιχεία Προσφοράς":"Στοιχεία Σύμβασης"}</ST>
                <Lbl t="Ημερομηνία"><input style={inp} type="date" value={docDate} onChange={e=>setDocDate(e.target.value)}/></Lbl>
                {docType==="prosfora"?(<Lbl t="Ισχύς (ημέρες)"><input style={inp} type="number" value={validDays} onChange={e=>setValidDays(e.target.value)}/></Lbl>):(<><Lbl t="Ημερομηνία Έναρξης"><input style={inp} type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}/></Lbl><Lbl t="Διάρκεια"><select style={sel} value={duration} onChange={e=>setDuration(e.target.value)}>{["6 μήνες","12 μήνες","24 μήνες","Αορίστου χρόνου"].map(d=><option key={d}>{d}</option>)}</select></Lbl></>)}
                <Lbl t="Παρατηρήσεις"><textarea style={{...inp,minHeight:64,resize:"vertical"}} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Προαιρετικά…"/></Lbl>
              </Card>
            </div>
            <div style={{gridColumn:"1/-1",display:"flex",justifyContent:"flex-end",gap:10,paddingTop:4}}>
              {!canGen&&<span style={{fontSize:12,color:C.muted,alignSelf:"center"}}>Επιλέξτε πελάτη, υπηρεσία και τιμή.</span>}
              <Btn onClick={handleSave} disabled={!canGen} variant="ghost" size="lg">✓ Αποθήκευση</Btn>
              <Btn onClick={handleSaveAndPdf} disabled={!canGen} variant="primary" size="lg">✓ Αποθήκευση & PDF →</Btn>
            </div>
          </div>
        </div>)}

        {tab==="history"&&(<div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h2 style={{margin:0,color:C.navy,fontSize:18,fontWeight:700}}>Ιστορικό Εγγράφων</h2><Btn onClick={()=>{setEditDoc(null);setTab("new");}} variant="primary">+ Νέο Έγγραφο</Btn></div>
          <Card style={{marginBottom:14,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",padding:"14px 18px"}}>
            <input style={{...inp,maxWidth:260}} placeholder="🔍 Πελάτης ή αρ. εγγράφου…" value={hQ} onChange={e=>setHQ(e.target.value)}/>
            <div style={{display:"flex",gap:6}}>{[["all","Όλα"],["prosfora","Προσφορές"],["symfonito","Συμφωνητικά"]].map(([v,l])=>(<button key={v} onClick={()=>setHFilt(v)} style={{padding:"6px 14px",border:`1px solid ${hFilt===v?C.accent:C.border}`,background:hFilt===v?C.light:"#FAFCFF",borderRadius:20,cursor:"pointer",fontSize:12,color:hFilt===v?C.accent:C.muted,fontFamily:"inherit"}}>{l}</button>))}</div>
            <span style={{fontSize:12,color:C.muted,marginLeft:"auto"}}>{filtH.length} έγγραφ{filtH.length!==1?"α":"ο"}</span>
          </Card>
          {filtH.length===0?(<Card style={{textAlign:"center",padding:50,color:C.muted}}><div style={{fontSize:44,marginBottom:14}}>📂</div>{history.length===0?"Δεν υπάρχουν αποθηκευμένα έγγραφα ακόμη.":"Δεν βρέθηκαν αποτελέσματα."}</Card>):(
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {filtH.map(doc=>(<Card key={doc.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px"}}>
                <div style={{fontSize:30}}>{doc.type==="prosfora"?"📄":"📜"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}><span style={{fontWeight:700,color:C.navy,fontSize:14}}>{doc.clientName}</span><Tag color={doc.type==="prosfora"?"blue":"gold"}>{doc.type==="prosfora"?"Προσφορά":"Συμφωνητικό"}</Tag>{doc.updatedAt!==doc.createdAt&&<Tag color="green">Αναθεωρήθηκε</Tag>}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:3}}>{doc.docNo&&<strong style={{marginRight:10}}>{doc.docNo}</strong>}{doc.pkgName} · <strong>{doc.price}€</strong> net · {fmtD(doc.date)}</div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <Btn size="sm" variant="gold" onClick={()=>loadEdit(doc)}>✎ Αναθεώρηση</Btn>
                  <Btn size="sm" variant="blue" onClick={()=>openPdf(doc)}>📄 PDF</Btn>
                  <Btn size="sm" variant="danger" onClick={()=>setHistory(h=>h.filter(d=>d.id!==doc.id))}>🗑</Btn>
                </div>
              </Card>))}
            </div>
          )}
        </div>)}

        {tab==="data"&&(<div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <ST>Στοιχεία Γραφείου</ST>
              <div style={{display:"flex",gap:8}}>
                <input ref={logoRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleLogoUpload}/>
                <Btn size="sm" variant="ghost" onClick={()=>logoRef.current?.click()}>🖼 {logo?"Αλλαγή":"Ανέβασμα"} Λογοτύπου</Btn>
                {logo&&<Btn size="sm" variant="danger" onClick={()=>setLogo(null)}>Αφαίρεση</Btn>}
                <Btn size="sm" variant="primary" onClick={()=>{setFf(firm);setShowFM(true);}}>✎ Επεξεργασία</Btn>
              </div>
            </div>
            {logo&&(<div style={{marginBottom:14,padding:"10px 14px",background:C.light,borderRadius:8,display:"flex",alignItems:"center",gap:12}}><img src={logo.url} alt="logo" style={{height:40,objectFit:"contain"}}/><span style={{fontSize:12,color:C.muted}}>Λογότυπο αποθηκευμένο</span></div>)}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>{[["Επωνυμία",firm.name],["ΑΦΜ",firm.afm],["ΔΟΥ",firm.doy],["Διεύθυνση",firm.address],["Τηλέφωνο",firm.phone],["Email",firm.email]].map(([l,v])=>(<div key={l} style={{background:C.light,borderRadius:6,padding:"8px 12px"}}><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:.5,marginBottom:2}}>{l}</div><div style={{color:C.navy,fontWeight:600,fontSize:13}}>{v||"—"}</div></div>))}</div>
          </Card>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h3 style={{margin:0,color:C.navy,fontSize:15}}>Πελατολόγιο ({clients.length})</h3><Btn size="sm" variant="primary" onClick={()=>setShowCM(true)}>+ Νέος</Btn></div>
              <div style={{maxHeight:380,overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>{clients.map(c=>(<div key={c.id} style={{border:`1px solid ${C.border}`,borderRadius:7,padding:"10px 12px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:C.navy}}>{c.name}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>ΑΦΜ: {c.afm} · {c.doy}</div><div style={{fontSize:11,color:C.muted}}>{c.address}</div></div><button onClick={()=>setClients(p=>p.filter(x=>x.id!==c.id))} style={{background:"none",border:"none",color:"#FC8181",cursor:"pointer",fontSize:14,marginLeft:8}}>✕</button></div><div style={{marginTop:6}}><Tag color="blue">{c.type==="business"?"Επιχείρηση":"Φυσικό Πρόσωπο"}</Tag></div></div>))}</div>
            </Card>
            <Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h3 style={{margin:0,color:C.navy,fontSize:15}}>Πακέτα Υπηρεσιών ({packages.length})</h3><Btn size="sm" variant="primary" onClick={()=>setShowPM(true)}>+ Νέο</Btn></div>
              <div style={{maxHeight:380,overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>{packages.map(p=>(<div key={p.id} style={{border:`1px solid ${C.border}`,borderRadius:7,padding:"10px 12px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:C.navy}}>{p.name}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>{p.desc}</div></div><button onClick={()=>setPackages(p2=>p2.filter(x=>x.id!==p.id))} style={{background:"none",border:"none",color:"#FC8181",cursor:"pointer",fontSize:14,marginLeft:8}}>✕</button></div><div style={{marginTop:6}}><Tag color="green">{p.price}€ + ΦΠΑ {p.vat}%</Tag></div></div>))}</div>
            </Card>
          </div>
        </div>)}
      </div>

      {showCM&&(<Modal title="Νέος Πελάτης" onClose={()=>setShowCM(false)}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Lbl t="Επωνυμία / Ονοματεπώνυμο" req><input style={inp} value={cf.name} onChange={e=>setCf({...cf,name:e.target.value})}/></Lbl><Lbl t="ΑΦΜ" req><input style={inp} value={cf.afm} onChange={e=>setCf({...cf,afm:e.target.value})}/></Lbl><Lbl t="ΔΟΥ"><input style={inp} value={cf.doy} onChange={e=>setCf({...cf,doy:e.target.value})} placeholder="π.χ. ΔΟΥ Αθηνών Α΄"/></Lbl><Lbl t="Τύπος"><select style={sel} value={cf.type} onChange={e=>setCf({...cf,type:e.target.value})}><option value="business">Επιχείρηση</option><option value="individual">Φυσικό Πρόσωπο</option></select></Lbl><div style={{gridColumn:"1/-1"}}><Lbl t="Διεύθυνση"><input style={inp} value={cf.address} onChange={e=>setCf({...cf,address:e.target.value})}/></Lbl></div><Lbl t="Email"><input style={inp} type="email" value={cf.email} onChange={e=>setCf({...cf,email:e.target.value})}/></Lbl><Lbl t="Τηλέφωνο"><input style={inp} value={cf.phone} onChange={e=>setCf({...cf,phone:e.target.value})}/></Lbl></div><div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:18}}><Btn variant="ghost" onClick={()=>setShowCM(false)}>Ακύρωση</Btn><Btn variant="primary" onClick={addClient} disabled={!cf.name||!cf.afm}>Προσθήκη</Btn></div></Modal>)}
      {showPM&&(<Modal title="Νέο Πακέτο Υπηρεσιών" onClose={()=>setShowPM(false)}><Lbl t="Τίτλος" req><input style={inp} value={pf.name} onChange={e=>setPf({...pf,name:e.target.value})}/></Lbl><Lbl t="Περιγραφή"><textarea style={{...inp,minHeight:72,resize:"vertical"}} value={pf.desc} onChange={e=>setPf({...pf,desc:e.target.value})}/></Lbl><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Lbl t="Τιμή Net (€)"><input style={inp} type="number" value={pf.price} onChange={e=>setPf({...pf,price:e.target.value})}/></Lbl><Lbl t="ΦΠΑ / VAT (%)"><input style={inp} type="number" value={pf.vat} onChange={e=>setPf({...pf,vat:e.target.value})}/></Lbl></div><div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:18}}><Btn variant="ghost" onClick={()=>setShowPM(false)}>Ακύρωση</Btn><Btn variant="primary" onClick={addPkg} disabled={!pf.name}>Προσθήκη</Btn></div></Modal>)}
      {showFM&&(<Modal title="Στοιχεία Γραφείου" onClose={()=>setShowFM(false)}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Lbl t="Επωνυμία"><input style={inp} value={ff.name} onChange={e=>setFf({...ff,name:e.target.value})}/></Lbl><Lbl t="ΑΦΜ"><input style={inp} value={ff.afm} onChange={e=>setFf({...ff,afm:e.target.value})}/></Lbl><Lbl t="ΔΟΥ"><input style={inp} value={ff.doy} onChange={e=>setFf({...ff,doy:e.target.value})}/></Lbl><Lbl t="Τηλέφωνο"><input style={inp} value={ff.phone} onChange={e=>setFf({...ff,phone:e.target.value})}/></Lbl><div style={{gridColumn:"1/-1"}}><Lbl t="Διεύθυνση"><input style={inp} value={ff.address} onChange={e=>setFf({...ff,address:e.target.value})}/></Lbl></div><div style={{gridColumn:"1/-1"}}><Lbl t="Email"><input style={inp} value={ff.email} onChange={e=>setFf({...ff,email:e.target.value})}/></Lbl></div></div><div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:18}}><Btn variant="ghost" onClick={()=>setShowFM(false)}>Ακύρωση</Btn><Btn variant="primary" onClick={()=>{setFirm(ff);setShowFM(false);}}>Αποθήκευση</Btn></div></Modal>)}
    </div>
  );
}
