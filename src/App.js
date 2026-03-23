import { useState, useEffect, useRef } from "react";

const C = {
  navy:"#1A3C5E", accent:"#2A7FBF", light:"#EBF4FB",
  gold:"#C8962A", goldL:"#FDF6E3",
  green:"#276749", greenL:"#F0FFF4",
  red:"#C53030", redL:"#FFF5F5",
  border:"#C8D8E8", bg:"#F0F5FA", white:"#FFFFFF", muted:"#667788",
};

const FIRM0 = { name:"Plus Accounting", afm:"000000000", doy:"ΔΟΥ ...", address:"...", phone:"210 0000000", email:"info@plusaccounting.gr" };
const CLIENTS0 = [
  { id:"c1", name:"Νίκος Παπαδόπουλος", afm:"123456789", doy:"ΔΟΥ Αθηνών Α΄", address:"Λεωφ. Αθηνών 10, Αθήνα", email:"nikos@example.gr", phone:"6900000001", type:"individual" },
  { id:"c2", name:"ΑΛΦΑ ΜΟΝΟΠΡΟΣΩΠΗ ΕΠΕ", afm:"987654321", doy:"ΔΟΥ Πειραιά", address:"Σταδίου 25, Πειραιάς", email:"info@alfa.gr", phone:"2100000002", type:"business" },
];
const PKGS0 = [
  { id:"p1", code:"LOG-001", name:"Βασικό Πακέτο Λογιστικής", desc:"Μηνιαία τήρηση βιβλίων, ΦΠΑ, μισθοδοσία έως 3 εργαζόμενοι", price:150, vat:24 },
  { id:"p2", code:"LOG-002", name:"Πλήρες Πακέτο Επιχείρησης", desc:"Πλήρης λογιστική υποστήριξη, φορολογικές δηλώσεις, ισολογισμός", price:350, vat:24 },
  { id:"p3", code:"ΦΟΡ-001", name:"Φορολογική Δήλωση Φυσικού Προσώπου", desc:"Σύνταξη & υποβολή Ε1, Ε2, Ε3", price:80, vat:24 },
  { id:"p4", code:"ΜΥΦ-001", name:"Παρακολούθηση ΜΥΦ/VIES", desc:"Μηνιαία υποβολή συγκεντρωτικών καταστάσεων", price:60, vat:24 },
];

/* ── localStorage ── */
const lsGet=(k,fb)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;}};
const lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};

/* ── Helpers ── */
function nextNo(hist,type){const pre=type==="prosfora"?"ΠΡΟ":"ΣΥΜ",yr=new Date().getFullYear();return`${pre}-${yr}-${String(hist.filter(d=>d.type===type&&d.docNo?.startsWith(`${pre}-${yr}`)).length+1).padStart(3,"0")}`;}
function calcTotals(lines){const net=lines.reduce((s,l)=>s+(parseFloat(l.customPrice||l.pkg?.price||0))*(parseFloat(l.qty)||1),0);const vatAmt=lines.reduce((s,l)=>{const ln=(parseFloat(l.customPrice||l.pkg?.price||0))*(parseFloat(l.qty)||1);return s++(ln*(l.pkg?.vat??24)/100).toFixed(2);},0);return{netPrice:net.toFixed(2),vatAmount:vatAmt.toFixed(2),totalPrice:(net+vatAmt).toFixed(2)};}
function fmtD(ds){try{return new Date(ds).toLocaleDateString("el-GR");}catch{return ds||"";}}
function xe(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function uid(){return Math.random().toString(36).slice(2,9);}

/* ── Build document HTML ── */
function buildDocHtml(d,logo){
  const{docType,docNo,docDate,firm,client,lines,payMethod,validDays,startDate,duration,notes}=d;
  const isP=docType==="prosfora";
  const totals=calcTotals(lines);
  const logoHtml=logo?`<img src="${logo.url}" style="height:48px;object-fit:contain;display:block;margin-bottom:6px;">`:"";
  const infoBox=rows=>`<table style="width:100%;border-collapse:collapse;margin-bottom:12px;">${rows.map(([l,v])=>`<tr><td style="padding:5px 10px;font-size:10pt;background:#EBF4FB;font-weight:700;color:#1A3C5E;width:34%;border:1px solid #2A7FBF;vertical-align:top;">${xe(l)}</td><td style="padding:5px 10px;font-size:10pt;background:#EBF4FB;color:#333;border:1px solid #2A7FBF;vertical-align:top;">${xe(v||"—")}</td></tr>`).join("")}</table>`;
  const svcTable=`<table style="width:100%;border-collapse:collapse;margin-bottom:10px;"><thead><tr style="background:#1A3C5E;color:white;"><td style="padding:6px 10px;font-size:9.5pt;font-weight:700;width:11%;">Κωδικός</td><td style="padding:6px 10px;font-size:9.5pt;font-weight:700;">Υπηρεσία / Περιγραφή</td><td style="padding:6px 10px;font-size:9.5pt;font-weight:700;text-align:center;width:7%;">Ποσ.</td><td style="padding:6px 10px;font-size:9.5pt;font-weight:700;text-align:right;width:12%;">Τιμή Net</td><td style="padding:6px 10px;font-size:9.5pt;font-weight:700;text-align:right;width:9%;">ΦΠΑ%</td><td style="padding:6px 10px;font-size:9.5pt;font-weight:700;text-align:right;width:13%;">Σύνολο</td></tr></thead><tbody>${lines.map((l,i)=>{const up=parseFloat(l.customPrice||l.pkg?.price||0),qty=parseFloat(l.qty)||1,vr=l.pkg?.vat??24,ln=+(up*qty).toFixed(2),lv=+(ln*vr/100).toFixed(2),lt=+(ln+lv).toFixed(2),bg=i%2===0?"#FFFFFF":"#F7FAFD";return`<tr style="background:${bg};"><td style="padding:5px 10px;font-size:9.5pt;color:#555;border-bottom:1px solid #E0EBF5;">${xe(l.pkg?.code||"")}</td><td style="padding:5px 10px;font-size:9.5pt;border-bottom:1px solid #E0EBF5;"><strong>${xe(l.pkg?.name||"")}</strong>${l.lineDesc||l.pkg?.desc?`<br><span style="color:#666;font-size:8.5pt;">${xe(l.lineDesc||l.pkg?.desc||"")}</span>`:""}</td><td style="padding:5px 10px;font-size:9.5pt;text-align:center;border-bottom:1px solid #E0EBF5;">${qty}</td><td style="padding:5px 10px;font-size:9.5pt;text-align:right;border-bottom:1px solid #E0EBF5;">${up.toFixed(2)} €</td><td style="padding:5px 10px;font-size:9.5pt;text-align:right;border-bottom:1px solid #E0EBF5;">${vr}%</td><td style="padding:5px 10px;font-size:9.5pt;text-align:right;border-bottom:1px solid #E0EBF5;">${lt.toFixed(2)} €</td></tr>`;}).join("")}</tbody><tfoot><tr><td colspan="5" style="padding:5px 10px;font-size:9.5pt;text-align:right;border-top:1px solid #C8D8E8;">Καθαρή αξία (Net):</td><td style="padding:5px 10px;font-size:9.5pt;text-align:right;border-top:1px solid #C8D8E8;">${totals.netPrice} €</td></tr><tr><td colspan="5" style="padding:5px 10px;font-size:9.5pt;text-align:right;">ΦΠΑ / VAT:</td><td style="padding:5px 10px;font-size:9.5pt;text-align:right;">${totals.vatAmount} €</td></tr><tr style="background:#EBF4FB;"><td colspan="5" style="padding:6px 10px;font-size:10pt;font-weight:700;color:#1A3C5E;text-align:right;border-top:2px solid #2A7FBF;"><strong>ΣΥΝΟΛΟ / TOTAL:</strong></td><td style="padding:6px 10px;font-size:10pt;font-weight:700;color:#1A3C5E;text-align:right;border-top:2px solid #2A7FBF;"><strong>${totals.totalPrice} €</strong></td></tr></tfoot></table>`;
  const sec=t=>`<h3 style="font-size:10pt;font-weight:700;color:#2A7FBF;text-transform:uppercase;margin:16px 0 7px;border-bottom:1px solid #C8D8E8;padding-bottom:3px;">${t}</h3>`;
  const pp=(t,x="")=>`<p style="font-size:10.5pt;line-height:1.65;margin:0 0 6px;${x}">${xe(t)}</p>`;
  const sigT=(l,r)=>`<table style="width:100%;border-collapse:collapse;margin-top:48px;"><tr><td style="width:50%;text-align:center;padding:0 20px;"><p style="font-size:10pt;font-weight:700;color:#1A3C5E;margin:0 0 52px;">${xe(l)}</p><div style="border-bottom:1px solid #999;"></div><p style="font-size:8.5pt;color:#888;font-style:italic;margin:4px 0 0;">Υπογραφή &amp; Σφραγίδα</p></td><td style="width:50%;text-align:center;padding:0 20px;">${r?`<p style="font-size:10pt;font-weight:700;color:#1A3C5E;margin:0 0 52px;">${xe(r)}</p><div style="border-bottom:1px solid #999;"></div><p style="font-size:8.5pt;color:#888;font-style:italic;margin:4px 0 0;">Υπογραφή &amp; Σφραγίδα</p>`:""}</td></tr></table>`;
  const body=isP?`
    ${sec("ΣΤΟΙΧΕΙΑ ΠΕΛΑΤΗ / CLIENT")}
    ${infoBox([["Επωνυμία",client.name],["ΑΦΜ",client.afm],["ΔΟΥ",client.doy],["Διεύθυνση",client.address],...(client.email?[["Email",client.email]]:[]),...(client.phone?[["Τηλέφωνο",client.phone]]:[]) ])}
    ${pp(`Αγαπητέ/ή κύριε/α ${client.name},`,"margin-top:14px;")}
    ${pp("Σας υποβάλλουμε την παρούσα προσφορά για την παροχή λογιστικών υπηρεσιών:")}
    ${sec("ΑΝΑΛΥΣΗ ΥΠΗΡΕΣΙΩΝ / SERVICES")}${svcTable}
    ${pp(`Τρόπος Πληρωμής / Payment: ${payMethod}`)}
    ${pp(`Ισχύς Προσφοράς / Validity: ${validDays} ημέρες από ${fmtD(docDate)}`)}
    ${notes?sec("ΠΑΡΑΤΗΡΗΣΕΙΣ / NOTES")+pp(notes):""}
    <div style="margin-top:28px;">${pp("Παραμένουμε στη διάθεσή σας για οποιαδήποτε διευκρίνιση.","font-style:italic;color:#555;")}${pp("Με εκτίμηση,","margin-top:8px;")}</div>
    ${sigT(firm.name,"")}
  `:`
    ${pp(`Στην Αθήνα, σήμερα ${fmtD(docDate)}, μεταξύ των:`)}
    ${infoBox([["Α) Ανάδοχος",`${firm.name}  |  ΑΦΜ: ${firm.afm}  |  ${firm.doy}`],["Διεύθυνση Αναδόχου",firm.address],["Β) Εντολέας",`${client.name}  |  ΑΦΜ: ${client.afm}  |  ${client.doy}`],["Διεύθυνση Εντολέα",client.address]])}
    ${pp("συμφωνήθηκαν και έγιναν αμοιβαία αποδεκτά τα εξής:","font-style:italic;color:#555;")}
    ${sec("ΑΡΘΡΟ 1 — ΑΝΤΙΚΕΙΜΕΝΟ ΣΥΜΒΑΣΗΣ")}${svcTable}
    ${sec("ΑΡΘΡΟ 2 — ΑΜΟΙΒΗ / REMUNERATION")}${pp(`Τρόπος πληρωμής / Payment: ${payMethod}`)}
    ${sec("ΑΡΘΡΟ 3 — ΔΙΑΡΚΕΙΑ / DURATION")}${pp(`Έναρξη / Start: ${fmtD(startDate)}`)}${pp(`Διάρκεια / Duration: ${duration}`)}
    ${pp("Η σύμβαση παρατείνεται αυτόματα εκτός εάν καταγγελθεί εγγράφως με 30 ημέρες προειδοποίηση.")}
    ${sec("ΑΡΘΡΟ 4 — ΥΠΟΧΡΕΩΣΕΙΣ ΜΕΡΩΝ")}
    ${pp("Ο Εντολέας υποχρεούται να χορηγεί έγκαιρα τα απαραίτητα παραστατικά και στοιχεία.")}
    ${pp("Ο Ανάδοχος υποχρεούται να τηρεί εχεμύθεια ως προς τα οικονομικά στοιχεία του Εντολέα.")}
    ${notes?sec("ΑΡΘΡΟ 5 — ΛΟΙΠΕΣ ΣΥΜΦΩΝΙΕΣ")+pp(notes):""}
    ${pp("Το παρόν συντάχθηκε σε δύο (2) αντίτυπα και κάθε συμβαλλόμενος έλαβε από ένα (1) πρωτότυπο.","font-style:italic;color:#555;margin-top:20px;")}
    ${sigT("Ο ΑΝΑΔΟΧΟΣ","Ο ΕΝΤΟΛΕΑΣ")}
  `;
  return`<!DOCTYPE html><html lang="el"><head><meta charset="UTF-8"><title>${xe(docNo)}</title>
<style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Calibri','Arial',sans-serif;font-size:11pt;color:#222;background:white;padding:18mm;}@page{size:A4;margin:18mm;}@media print{body{padding:0;}.no-print{display:none!important;}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}}.toolbar{position:fixed;top:0;left:0;right:0;background:#1A3C5E;color:white;padding:12px 20px;display:flex;align-items:center;justify-content:space-between;z-index:100;font-family:Arial,sans-serif;}.btn-print{background:#C8962A;color:white;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;}.btn-close{background:rgba(255,255,255,.15);color:white;border:1px solid rgba(255,255,255,.3);padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;margin-right:8px;}.doc-wrap{max-width:170mm;margin:60px auto 20px;}@media print{.toolbar{display:none;}.doc-wrap{margin:0;max-width:100%;}}</style>
</head><body>
<div class="toolbar no-print"><h2>📄 ${xe(docNo)}</h2><div><button class="btn-close" onclick="window.close()">✕ Κλείσιμο</button><button class="btn-print" onclick="window.print()">🖨 Αποθήκευση ως PDF</button></div></div>
<div class="doc-wrap">
  <div style="border-bottom:3px solid #1A3C5E;padding-bottom:10px;margin-bottom:16px;">${logoHtml}<div style="font-size:15pt;font-weight:700;color:#1A3C5E;letter-spacing:1px;margin-bottom:3px;">${xe(firm.name.toUpperCase())}</div><div style="font-size:9pt;color:#555;line-height:1.6;">ΑΦΜ: ${xe(firm.afm)} &nbsp;|&nbsp; ${xe(firm.doy)} &nbsp;|&nbsp; ${xe(firm.address)}<br>Τηλ: ${xe(firm.phone)} &nbsp;|&nbsp; Email: ${xe(firm.email)}</div></div>
  <div style="font-size:16pt;font-weight:700;color:#1A3C5E;margin-bottom:10px;">${isP?"ΠΡΟΣΦΟΡΑ ΥΠΗΡΕΣΙΩΝ":"ΙΔΙΩΤΙΚΟ ΣΥΜΦΩΝΗΤΙΚΟ ΠΑΡΟΧΗΣ ΥΠΗΡΕΣΙΩΝ"}</div>
  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;"><tr><td style="padding:5px 10px;background:#EBF4FB;font-weight:700;color:#1A3C5E;width:34%;border:1px solid #2A7FBF;font-size:10pt;">Αρ. Εγγράφου</td><td style="padding:5px 10px;background:#EBF4FB;border:1px solid #2A7FBF;font-size:10pt;">${xe(docNo)}</td></tr><tr><td style="padding:5px 10px;background:#EBF4FB;font-weight:700;color:#1A3C5E;border:1px solid #2A7FBF;font-size:10pt;">Ημερομηνία / Date</td><td style="padding:5px 10px;background:#EBF4FB;border:1px solid #2A7FBF;font-size:10pt;">${fmtD(docDate)}</td></tr></table>
  ${body}
  <div style="margin-top:24px;padding-top:8px;border-top:1px solid #CCC;font-size:8.5pt;color:#888;text-align:center;">${xe(firm.name)} &nbsp;|&nbsp; ${xe(firm.email)} &nbsp;|&nbsp; ${xe(firm.phone)}</div>
</div></body></html>`;
}

/* ── UI Atoms ── */
const inp={width:"100%",padding:"8px 11px",border:`1px solid ${C.border}`,borderRadius:6,fontSize:14,color:"#111",background:"#FAFCFF",boxSizing:"border-box",fontFamily:"inherit"};
const sel={...inp,cursor:"pointer"};
function Lbl({t,req,children}){return(<div style={{marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:C.navy,textTransform:"uppercase",letterSpacing:.6,marginBottom:4}}>{t}{req&&<span style={{color:C.red}}> *</span>}</div>{children}</div>);}
function Card({children,style={}}){return <div style={{background:C.white,borderRadius:10,padding:20,boxShadow:"0 2px 12px rgba(26,60,94,.10)",...style}}>{children}</div>;}
function Btn({onClick,disabled,variant="primary",size="md",children,style={}}){
  const sz={sm:"5px 10px",md:"9px 20px",lg:"11px 26px"},fs={sm:12,md:13,lg:14};
  const vs={primary:{background:C.navy,color:"#fff",border:"none"},ghost:{background:C.light,color:C.accent,border:`1px solid ${C.accent}`},gold:{background:C.goldL,color:C.gold,border:`1px solid ${C.gold}`},danger:{background:C.redL,color:C.red,border:"1px solid #FC8181"},blue:{background:C.accent,color:"#fff",border:"none"},success:{background:C.greenL,color:C.green,border:"1px solid #68D391"}};
  return <button onClick={onClick} disabled={disabled} style={{...vs[variant],padding:sz[size],fontSize:fs[size],borderRadius:7,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",fontWeight:600,opacity:disabled?.5:1,...style}}>{children}</button>;
}
function Tag({color="blue",children}){const m={blue:{bg:C.light,fg:C.accent,br:C.accent},gold:{bg:C.goldL,fg:C.gold,br:C.gold},green:{bg:C.greenL,fg:C.green,br:"#68D391"}};const s=m[color];return <span style={{background:s.bg,color:s.fg,border:`1px solid ${s.br}`,borderRadius:20,padding:"2px 10px",fontSize:11,fontWeight:700}}>{children}</span>;}
function Modal({title,onClose,children,wide=false}){return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.47)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}><div style={{background:C.white,borderRadius:12,width:"100%",maxWidth:wide?900:640,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 72px rgba(0,0,0,.3)"}}><div style={{padding:"18px 24px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.white}}><h3 style={{margin:0,color:C.navy,fontSize:16}}>{title}</h3><button onClick={onClose} style={{background:"none",border:"none",fontSize:24,cursor:"pointer",color:"#aaa"}}>×</button></div><div style={{padding:24}}>{children}</div></div></div>);}
function ST({children}){return <div style={{fontSize:11,fontWeight:700,color:C.navy,textTransform:"uppercase",letterSpacing:.6,marginBottom:12}}>{children}</div>;}

/* ── Lines Editor ── */
function LinesEditor({lines,setLines,packages}){
  function addLine(){setLines(l=>[...l,{id:uid(),pkgId:"",pkg:null,qty:"1",customPrice:"",lineDesc:""}]);}
  function removeLine(id){setLines(l=>l.filter(x=>x.id!==id));}
  function updateLine(id,field,val){setLines(l=>l.map(x=>{if(x.id!==id)return x;if(field==="pkgId"){const pkg=packages.find(p=>p.id===val)||null;return{...x,pkgId:val,pkg,customPrice:"",lineDesc:""};}return{...x,[field]:val};}));}
  const validLines=lines.filter(l=>l.pkg);
  const totals=validLines.length>0?calcTotals(validLines):null;
  return(<div>
    {lines.map((line,i)=>{
      const up=parseFloat(line.customPrice||line.pkg?.price||0),qty=parseFloat(line.qty)||1,vr=line.pkg?.vat??24,lt=+(up*qty*(1+vr/100)).toFixed(2);
      return(<div key={line.id} style={{border:`1px solid ${C.border}`,borderRadius:8,padding:14,marginBottom:10,background:i%2===0?"#FAFCFF":C.light}}>
        <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10}}>
          <div style={{background:C.navy,color:"#fff",borderRadius:"50%",width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</div>
          <select style={{...sel,flex:2}} value={line.pkgId} onChange={e=>updateLine(line.id,"pkgId",e.target.value)}>
            <option value="">— Επιλέξτε υπηρεσία —</option>
            {packages.map(p=><option key={p.id} value={p.id}>[{p.code||"—"}] {p.name} ({p.price}€)</option>)}
          </select>
          {lines.length>1&&<button onClick={()=>removeLine(line.id)} style={{background:"none",border:"none",color:"#FC8181",cursor:"pointer",fontSize:18,flexShrink:0,padding:"0 4px"}}>✕</button>}
        </div>
        {line.pkg&&(<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:8}}>
            <Lbl t="Ποσότητα"><input style={inp} type="number" min="1" value={line.qty} onChange={e=>updateLine(line.id,"qty",e.target.value)}/></Lbl>
            <Lbl t={`Τιμή Net (default: ${line.pkg.price}€)`}><input style={inp} type="number" value={line.customPrice} onChange={e=>updateLine(line.id,"customPrice",e.target.value)} placeholder={String(line.pkg.price)}/></Lbl>
            <Lbl t="Σύνολο με ΦΠΑ"><div style={{...inp,background:C.greenL,color:C.green,fontWeight:700,display:"flex",alignItems:"center"}}>{lt.toFixed(2)} €</div></Lbl>
          </div>
          <Lbl t="Περιγραφή στο έγγραφο (κενό = default)">
            <textarea style={{...inp,minHeight:48,resize:"vertical",fontSize:13}} value={line.lineDesc} onChange={e=>updateLine(line.id,"lineDesc",e.target.value)} placeholder={line.pkg.desc}/>
          </Lbl>
        </>)}
      </div>);
    })}
    <button onClick={addLine} style={{width:"100%",padding:"9px",border:`2px dashed ${C.accent}`,borderRadius:8,background:"none",color:C.accent,cursor:"pointer",fontSize:13,fontWeight:600}}>+ Προσθήκη Υπηρεσίας</button>
    {totals&&(<div style={{marginTop:14,background:C.greenL,border:"1px solid #68D391",borderRadius:8,padding:"12px 16px",fontSize:13}}>
      <div style={{color:C.muted,fontSize:11,marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>Σύνολο Προσφοράς</div>
      {[["Καθαρή αξία (Net)",totals.netPrice+" €"],["ΦΠΑ / VAT",totals.vatAmount+" €"]].map(([l,v])=>(<div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}><span style={{color:"#444"}}>{l}</span><span>{v}</span></div>))}
      <div style={{display:"flex",justifyContent:"space-between",fontWeight:700,color:C.green,borderTop:"1px solid #68D391",paddingTop:6,marginTop:4}}><span>ΣΥΝΟΛΟ / TOTAL</span><span>{totals.totalPrice} €</span></div>
    </div>)}
  </div>);
}

/* ── Package Edit Modal ── */
function PkgEditModal({pkg,onSave,onClose}){
  const[f,setF]=useState({code:pkg.code||"",name:pkg.name||"",desc:pkg.desc||"",price:String(pkg.price||""),vat:String(pkg.vat||24)});
  return(<Modal title={`Επεξεργασία: ${pkg.name}`} onClose={onClose}>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Lbl t="Κωδικός"><input style={inp} value={f.code} onChange={e=>setF({...f,code:e.target.value})} placeholder="π.χ. LOG-001"/></Lbl>
      <Lbl t="Τιμή Net (€)"><input style={inp} type="number" value={f.price} onChange={e=>setF({...f,price:e.target.value})}/></Lbl>
      <div style={{gridColumn:"1/-1"}}><Lbl t="Τίτλος *"><input style={inp} value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></Lbl></div>
      <div style={{gridColumn:"1/-1"}}><Lbl t="Περιγραφή"><textarea style={{...inp,minHeight:80,resize:"vertical"}} value={f.desc} onChange={e=>setF({...f,desc:e.target.value})}/></Lbl></div>
      <Lbl t="ΦΠΑ / VAT (%)"><input style={inp} type="number" value={f.vat} onChange={e=>setF({...f,vat:e.target.value})}/></Lbl>
    </div>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:18}}><Btn variant="ghost" onClick={onClose}>Ακύρωση</Btn><Btn variant="primary" onClick={()=>onSave({...pkg,...f,price:parseFloat(f.price)||0,vat:parseInt(f.vat)||24})} disabled={!f.name}>Αποθήκευση</Btn></div>
  </Modal>);
}

/* ── Main App ── */
export default function App(){
  const[tab,setTab]=useState("new");
  const[firm,setFirm]=useState(()=>lsGet("pa_firm",FIRM0));
  const[logo,setLogo]=useState(()=>lsGet("pa_logo",null));
  const[clients,setClients]=useState(()=>lsGet("pa_clients",CLIENTS0));
  const[packages,setPackages]=useState(()=>lsGet("pa_packages",PKGS0));
  const[history,setHistory]=useState(()=>lsGet("pa_history",[]));
  const[docType,setDocType]=useState("prosfora");
  const[clientId,setClientId]=useState("");
  const[lines,setLines]=useState([{id:uid(),pkgId:"",pkg:null,qty:"1",customPrice:"",lineDesc:""}]);
  const[payMethod,setPayMethod]=useState("μηνιαίως");
  const[validDays,setValidDays]=useState("30");
  const[startDate,setStartDate]=useState(new Date().toISOString().slice(0,10));
  const[duration,setDuration]=useState("12 μήνες");
  const[notes,setNotes]=useState("");
  const[docDate,setDocDate]=useState(new Date().toISOString().slice(0,10));
  const[showCM,setShowCM]=useState(false);
  const[showPM,setShowPM]=useState(false);
  const[editPkg,setEditPkg]=useState(null);
  const[showFM,setShowFM]=useState(false);
  const[editDoc,setEditDoc]=useState(null);
  const[status,setStatus]=useState({msg:"",type:""});
  const[hFilt,setHFilt]=useState("all");
  const[hQ,setHQ]=useState("");
  const[cf,setCf]=useState({name:"",afm:"",doy:"",address:"",email:"",phone:"",type:"business"});
  const[pf,setPf]=useState({code:"",name:"",desc:"",price:"",vat:"24"});
  const[ff,setFf]=useState(FIRM0);
  const logoRef=useRef();

  useEffect(()=>lsSet("pa_firm",firm),[firm]);
  useEffect(()=>lsSet("pa_clients",clients),[clients]);
  useEffect(()=>lsSet("pa_packages",packages),[packages]);
  useEffect(()=>lsSet("pa_history",history),[history]);
  useEffect(()=>{if(logo)lsSet("pa_logo",logo);},[logo]);

  const client=clients.find(c=>c.id===clientId);
  const validLines=lines.filter(l=>l.pkg);
  const canGen=!!(client&&validLines.length>0);
  function msg(m,t="info"){setStatus({msg:m,type:t});if(t!=="err")setTimeout(()=>setStatus({msg:"",type:""}),4000);}

  function handleLogoUpload(e){const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=ev=>{const[meta,b64]=ev.target.result.split(",");setLogo({base64:b64,mime:meta.match(/:(.*?);/)?.[1]||"image/png",url:ev.target.result});};reader.readAsDataURL(file);}

  function buildPayload(docNo,histDoc=null){
    if(histDoc){const c=clients.find(x=>x.id===histDoc.clientId)||{name:histDoc.clientName,afm:"",doy:"",address:"",email:"",phone:""};const hl=(histDoc.lines||[]).map(l=>({...l,pkg:packages.find(p=>p.id===l.pkgId)||l.pkg}));return{docType:histDoc.type,docNo:histDoc.docNo,docDate:histDoc.date,firm,client:c,lines:hl,payMethod:histDoc.payMethod||"μηνιαίως",validDays:histDoc.validDays||"30",startDate:histDoc.startDate||histDoc.date,duration:histDoc.duration||"12 μήνες",notes:histDoc.notes||""};}
    return{docType,docNo,docDate,firm,client,lines:validLines,payMethod,validDays,startDate,duration,notes};
  }

  function openPdf(histDoc=null){const docNo=histDoc?histDoc.docNo:nextNo(history,docType);const html=buildDocHtml(buildPayload(docNo,histDoc),logo);const win=window.open("","_blank");win.document.write(html);win.document.close();}

  function saveEntry(docNo){
    const entry={id:editDoc?editDoc.id:"doc"+Date.now(),type:docType,docNo,clientName:client.name,clientId,lines:validLines.map(l=>({id:l.id,pkgId:l.pkgId,pkg:l.pkg,qty:l.qty,customPrice:l.customPrice,lineDesc:l.lineDesc})),payMethod,validDays,startDate,duration,notes,date:docDate,createdAt:editDoc?editDoc.createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    if(editDoc){setHistory(h=>h.map(d=>d.id===editDoc.id?entry:d));setEditDoc(null);}else{setHistory(h=>[entry,...h]);}
    return entry;
  }
  function handleSave(){if(!canGen)return;const docNo=editDoc?editDoc.docNo:nextNo(history,docType);saveEntry(docNo);msg("✓ Αποθηκεύτηκε!","ok");setTab("history");}
  function handleSaveAndPdf(){if(!canGen)return;const docNo=editDoc?editDoc.docNo:nextNo(history,docType);saveEntry(docNo);const html=buildDocHtml(buildPayload(docNo),logo);const win=window.open("","_blank");win.document.write(html);win.document.close();}

  function resetForm(){setLines([{id:uid(),pkgId:"",pkg:null,qty:"1",customPrice:"",lineDesc:""}]);setEditDoc(null);}
  function loadEdit(doc){setEditDoc(doc);setDocType(doc.type);setClientId(doc.clientId);setLines((doc.lines||[]).map(l=>({...l,pkg:packages.find(p=>p.id===l.pkgId)||l.pkg})));setPayMethod(doc.payMethod||"μηνιαίως");setValidDays(doc.validDays||"30");setStartDate(doc.startDate||doc.date);setDuration(doc.duration||"12 μήνες");setNotes(doc.notes||"");setDocDate(doc.date);setTab("new");}
  function addClient(){if(!cf.name||!cf.afm)return;const nc={...cf,id:"c"+Date.now()};setClients(p=>[...p,nc]);setClientId(nc.id);setCf({name:"",afm:"",doy:"",address:"",email:"",phone:"",type:"business"});setShowCM(false);}
  function addPkg(){if(!pf.name)return;const np={...pf,price:parseFloat(pf.price)||0,vat:parseInt(pf.vat)||24,id:"p"+Date.now()};setPackages(p=>[...p,np]);setPf({code:"",name:"",desc:"",price:"",vat:"24"});setShowPM(false);}
  function savePkg(u){setPackages(ps=>ps.map(p=>p.id===u.id?u:p));setEditPkg(null);}

  const filtH=history.filter(d=>{if(hFilt!=="all"&&d.type!==hFilt)return false;const q=hQ.toLowerCase();return!q||d.clientName?.toLowerCase().includes(q)||d.docNo?.toLowerCase().includes(q);});
  const stC={ok:{bg:C.greenL,fg:C.green,br:"#68D391"},err:{bg:C.redL,fg:C.red,br:C.red},info:{bg:C.light,fg:C.accent,br:C.accent}};

  return(<div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Palatino Linotype','Book Antiqua',Georgia,serif"}}>
    {/* NAV */}
    <div style={{background:C.navy}}><div style={{maxWidth:1060,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",height:58,padding:"0 20px"}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        {logo?<img src={logo.url} alt="logo" style={{height:34,objectFit:"contain"}}/>:<div style={{width:34,height:34,background:C.gold,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:17,color:"#fff"}}>P</div>}
        <div><div style={{fontWeight:700,fontSize:15,color:"#fff",letterSpacing:1.2}}>PLUS ACCOUNTING</div><div style={{fontSize:10,color:"rgba(255,255,255,.6)",letterSpacing:2.5,textTransform:"uppercase"}}>Document Generator</div></div>
      </div>
      <nav style={{display:"flex",gap:4}}>{[["new","✎ Νέο Έγγραφο"],["history",`📁 Ιστορικό (${history.length})`],["data","⚙ Δεδομένα"]].map(([t,l])=>(<button key={t} onClick={()=>setTab(t)} style={{background:tab===t?"rgba(255,255,255,.15)":"none",border:tab===t?"1px solid rgba(255,255,255,.3)":"1px solid transparent",color:"#fff",padding:"6px 14px",borderRadius:6,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>{l}</button>))}</nav>
    </div></div>

    {status.msg&&(()=>{const s=stC[status.type]||stC.info;return(<div style={{background:s.bg,color:s.fg,borderBottom:`1px solid ${s.br}`,padding:"10px 20px",fontSize:13,textAlign:"center"}}>{status.msg}</div>);})()}

    <div style={{maxWidth:1060,margin:"0 auto",padding:"22px 16px"}}>

      {/* ══ NEW ══ */}
      {tab==="new"&&(<div>
        {editDoc&&(<div style={{background:C.goldL,border:`1px solid ${C.gold}`,borderRadius:8,padding:"10px 16px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:13,color:"#7A5C0A"}}>✎ Αναθεώρηση: <strong>{editDoc.docNo}</strong> — {editDoc.clientName}</span><button onClick={resetForm} style={{background:"none",border:"none",color:"#bbb",cursor:"pointer",fontSize:20}}>×</button></div>)}
        <Card style={{marginBottom:16}}><ST>Τύπος Εγγράφου</ST><div style={{display:"flex",gap:12}}>{[["prosfora","📄 Προσφορά Υπηρεσιών"],["symfonito","📜 Ιδιωτικό Συμφωνητικό"]].map(([v,l])=>(<button key={v} onClick={()=>setDocType(v)} style={{flex:1,padding:"12px",border:`2px solid ${docType===v?C.accent:C.border}`,background:docType===v?C.light:"#FAFCFF",borderRadius:8,cursor:"pointer",fontWeight:docType===v?700:400,color:docType===v?C.navy:"#666",fontSize:14,fontFamily:"inherit"}}>{l}</button>))}</div></Card>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><ST>Πελάτης</ST><Btn size="sm" variant="ghost" onClick={()=>setShowCM(true)}>+ Νέος</Btn></div>
            <Lbl t="Επιλογή" req><select style={sel} value={clientId} onChange={e=>setClientId(e.target.value)}><option value="">— Επιλέξτε πελάτη —</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></Lbl>
            {client&&(<div style={{background:C.light,borderRadius:6,padding:"10px 12px",fontSize:12,color:"#2c4a6a",lineHeight:1.75}}><div><strong>ΑΦΜ:</strong> {client.afm} · {client.doy}</div><div><strong>Διεύθ.:</strong> {client.address}</div>{client.email&&<div><strong>Email:</strong> {client.email}</div>}{client.phone&&<div><strong>Τηλ:</strong> {client.phone}</div>}<div style={{marginTop:5}}><Tag color="blue">{client.type==="business"?"Επιχείρηση":"Φυσικό Πρόσωπο"}</Tag></div></div>)}
          </Card>
          <Card>
            <ST>{docType==="prosfora"?"Στοιχεία Προσφοράς":"Στοιχεία Σύμβασης"}</ST>
            <Lbl t="Ημερομηνία"><input style={inp} type="date" value={docDate} onChange={e=>setDocDate(e.target.value)}/></Lbl>
            <Lbl t="Τρόπος Πληρωμής"><select style={sel} value={payMethod} onChange={e=>setPayMethod(e.target.value)}>{["μηνιαίως","τριμηνιαίως","εξαμηνιαίως","ετησίως","εφάπαξ"].map(o=><option key={o}>{o}</option>)}</select></Lbl>
            {docType==="prosfora"?(<Lbl t="Ισχύς (ημέρες)"><input style={inp} type="number" value={validDays} onChange={e=>setValidDays(e.target.value)}/></Lbl>):(<><Lbl t="Ημερομηνία Έναρξης"><input style={inp} type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}/></Lbl><Lbl t="Διάρκεια"><select style={sel} value={duration} onChange={e=>setDuration(e.target.value)}>{["6 μήνες","12 μήνες","24 μήνες","Αορίστου χρόνου"].map(d=><option key={d}>{d}</option>)}</select></Lbl></>)}
            <Lbl t="Παρατηρήσεις"><textarea style={{...inp,minHeight:60,resize:"vertical"}} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Προαιρετικά…"/></Lbl>
          </Card>
          <div style={{gridColumn:"1/-1"}}>
            <Card>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}><ST>Υπηρεσίες / Πακέτα</ST><span style={{fontSize:12,color:C.muted}}>{validLines.length} υπηρεσ{validLines.length===1?"ία":"ίες"} επιλεγμένες</span></div>
              <LinesEditor lines={lines} setLines={setLines} packages={packages}/>
            </Card>
          </div>
          <div style={{gridColumn:"1/-1",display:"flex",justifyContent:"flex-end",gap:10,paddingTop:4}}>
            {!canGen&&<span style={{fontSize:12,color:C.muted,alignSelf:"center"}}>Επιλέξτε πελάτη και τουλάχιστον μία υπηρεσία.</span>}
            <Btn onClick={handleSave} disabled={!canGen} variant="ghost" size="lg">✓ Αποθήκευση</Btn>
            <Btn onClick={handleSaveAndPdf} disabled={!canGen} variant="primary" size="lg">✓ Αποθήκευση & PDF →</Btn>
          </div>
        </div>
      </div>)}

      {/* ══ HISTORY ══ */}
      {tab==="history"&&(<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><h2 style={{margin:0,color:C.navy,fontSize:18,fontWeight:700}}>Ιστορικό Εγγράφων</h2><Btn onClick={()=>{resetForm();setTab("new");}} variant="primary">+ Νέο Έγγραφο</Btn></div>
        <Card style={{marginBottom:14,display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",padding:"14px 18px"}}>
          <input style={{...inp,maxWidth:260}} placeholder="🔍 Πελάτης ή αρ. εγγράφου…" value={hQ} onChange={e=>setHQ(e.target.value)}/>
          <div style={{display:"flex",gap:6}}>{[["all","Όλα"],["prosfora","Προσφορές"],["symfonito","Συμφωνητικά"]].map(([v,l])=>(<button key={v} onClick={()=>setHFilt(v)} style={{padding:"6px 14px",border:`1px solid ${hFilt===v?C.accent:C.border}`,background:hFilt===v?C.light:"#FAFCFF",borderRadius:20,cursor:"pointer",fontSize:12,color:hFilt===v?C.accent:C.muted,fontFamily:"inherit"}}>{l}</button>))}</div>
          <span style={{fontSize:12,color:C.muted,marginLeft:"auto"}}>{filtH.length} έγγραφ{filtH.length!==1?"α":"ο"}</span>
        </Card>
        {filtH.length===0?(<Card style={{textAlign:"center",padding:50,color:C.muted}}><div style={{fontSize:44,marginBottom:14}}>📂</div>{history.length===0?"Δεν υπάρχουν αποθηκευμένα έγγραφα ακόμη.":"Δεν βρέθηκαν αποτελέσματα."}</Card>):(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {filtH.map(doc=>{
              const dl=doc.lines||[];
              const dt=dl.length>0?calcTotals(dl.map(l=>({...l,pkg:l.pkg||packages.find(p=>p.id===l.pkgId)})).filter(l=>l.pkg)):null;
              return(<Card key={doc.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px"}}>
                <div style={{fontSize:30}}>{doc.type==="prosfora"?"📄":"📜"}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}><span style={{fontWeight:700,color:C.navy,fontSize:14}}>{doc.clientName}</span><Tag color={doc.type==="prosfora"?"blue":"gold"}>{doc.type==="prosfora"?"Προσφορά":"Συμφωνητικό"}</Tag>{doc.updatedAt!==doc.createdAt&&<Tag color="green">Αναθεωρήθηκε</Tag>}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:3}}>{doc.docNo&&<strong style={{marginRight:10}}>{doc.docNo}</strong>}{dl.length} υπηρεσ{dl.length===1?"ία":"ίες"}{dt&&<> · <strong>Σύνολο: {dt.totalPrice} €</strong></>}{" · "}{fmtD(doc.date)}</div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <Btn size="sm" variant="gold" onClick={()=>loadEdit(doc)}>✎ Αναθεώρηση</Btn>
                  <Btn size="sm" variant="blue" onClick={()=>openPdf(doc)}>📄 PDF</Btn>
                  <Btn size="sm" variant="danger" onClick={()=>setHistory(h=>h.filter(d=>d.id!==doc.id))}>🗑</Btn>
                </div>
              </Card>);
            })}
          </div>
        )}
      </div>)}

      {/* ══ DATA ══ */}
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
            <div style={{maxHeight:400,overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>{clients.map(c=>(<div key={c.id} style={{border:`1px solid ${C.border}`,borderRadius:7,padding:"10px 12px"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:C.navy}}>{c.name}</div><div style={{fontSize:11,color:C.muted,marginTop:2}}>ΑΦΜ: {c.afm} · {c.doy}</div><div style={{fontSize:11,color:C.muted}}>{c.address}</div></div><button onClick={()=>setClients(p=>p.filter(x=>x.id!==c.id))} style={{background:"none",border:"none",color:"#FC8181",cursor:"pointer",fontSize:14,marginLeft:8}}>✕</button></div><div style={{marginTop:6}}><Tag color="blue">{c.type==="business"?"Επιχείρηση":"Φυσικό Πρόσωπο"}</Tag></div></div>))}</div>
          </Card>
          <Card>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><h3 style={{margin:0,color:C.navy,fontSize:15}}>Πακέτα Υπηρεσιών ({packages.length})</h3><Btn size="sm" variant="primary" onClick={()=>setShowPM(true)}>+ Νέο</Btn></div>
            <div style={{maxHeight:400,overflowY:"auto",display:"flex",flexDirection:"column",gap:8}}>
              {packages.map(p=>(<div key={p.id} style={{border:`1px solid ${C.border}`,borderRadius:7,padding:"10px 12px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:2}}>
                      <span style={{fontWeight:700,fontSize:13,color:C.navy}}>{p.name}</span>
                      {p.code&&<span style={{fontSize:11,color:C.muted,background:"#F0F5FA",padding:"1px 7px",borderRadius:10,border:`1px solid ${C.border}`}}>{p.code}</span>}
                    </div>
                    <div style={{fontSize:11,color:C.muted}}>{p.desc}</div>
                  </div>
                  <div style={{display:"flex",gap:4,flexShrink:0,marginLeft:8}}>
                    <button onClick={()=>setEditPkg(p)} style={{background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:14,padding:"2px 4px"}} title="Επεξεργασία">✎</button>
                    <button onClick={()=>setPackages(p2=>p2.filter(x=>x.id!==p.id))} style={{background:"none",border:"none",color:"#FC8181",cursor:"pointer",fontSize:14,padding:"2px 4px"}} title="Διαγραφή">✕</button>
                  </div>
                </div>
                <div style={{marginTop:6}}><Tag color="green">{p.price}€ + ΦΠΑ {p.vat}%</Tag></div>
              </div>))}
            </div>
          </Card>
        </div>
      </div>)}
    </div>

    {/* MODALS */}
    {showCM&&(<Modal title="Νέος Πελάτης" onClose={()=>setShowCM(false)}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Lbl t="Επωνυμία / Ονοματεπώνυμο" req><input style={inp} value={cf.name} onChange={e=>setCf({...cf,name:e.target.value})}/></Lbl><Lbl t="ΑΦΜ" req><input style={inp} value={cf.afm} onChange={e=>setCf({...cf,afm:e.target.value})}/></Lbl><Lbl t="ΔΟΥ"><input style={inp} value={cf.doy} onChange={e=>setCf({...cf,doy:e.target.value})} placeholder="π.χ. ΔΟΥ Αθηνών Α΄"/></Lbl><Lbl t="Τύπος"><select style={sel} value={cf.type} onChange={e=>setCf({...cf,type:e.target.value})}><option value="business">Επιχείρηση</option><option value="individual">Φυσικό Πρόσωπο</option></select></Lbl><div style={{gridColumn:"1/-1"}}><Lbl t="Διεύθυνση"><input style={inp} value={cf.address} onChange={e=>setCf({...cf,address:e.target.value})}/></Lbl></div><Lbl t="Email"><input style={inp} type="email" value={cf.email} onChange={e=>setCf({...cf,email:e.target.value})}/></Lbl><Lbl t="Τηλέφωνο"><input style={inp} value={cf.phone} onChange={e=>setCf({...cf,phone:e.target.value})}/></Lbl></div><div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:18}}><Btn variant="ghost" onClick={()=>setShowCM(false)}>Ακύρωση</Btn><Btn variant="primary" onClick={addClient} disabled={!cf.name||!cf.afm}>Προσθήκη</Btn></div></Modal>)}
    {showPM&&(<Modal title="Νέο Πακέτο Υπηρεσιών" onClose={()=>setShowPM(false)}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Lbl t="Κωδικός"><input style={inp} value={pf.code} onChange={e=>setPf({...pf,code:e.target.value})} placeholder="π.χ. LOG-001"/></Lbl><Lbl t="Τιμή Net (€)"><input style={inp} type="number" value={pf.price} onChange={e=>setPf({...pf,price:e.target.value})}/></Lbl><div style={{gridColumn:"1/-1"}}><Lbl t="Τίτλος *"><input style={inp} value={pf.name} onChange={e=>setPf({...pf,name:e.target.value})}/></Lbl></div><div style={{gridColumn:"1/-1"}}><Lbl t="Περιγραφή"><textarea style={{...inp,minHeight:72,resize:"vertical"}} value={pf.desc} onChange={e=>setPf({...pf,desc:e.target.value})}/></Lbl></div><Lbl t="ΦΠΑ / VAT (%)"><input style={inp} type="number" value={pf.vat} onChange={e=>setPf({...pf,vat:e.target.value})}/></Lbl></div><div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:18}}><Btn variant="ghost" onClick={()=>setShowPM(false)}>Ακύρωση</Btn><Btn variant="primary" onClick={addPkg} disabled={!pf.name}>Προσθήκη</Btn></div></Modal>)}
    {editPkg&&<PkgEditModal pkg={editPkg} onSave={savePkg} onClose={()=>setEditPkg(null)}/>}
    {showFM&&(<Modal title="Στοιχεία Γραφείου" onClose={()=>setShowFM(false)}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}><Lbl t="Επωνυμία"><input style={inp} value={ff.name} onChange={e=>setFf({...ff,name:e.target.value})}/></Lbl><Lbl t="ΑΦΜ"><input style={inp} value={ff.afm} onChange={e=>setFf({...ff,afm:e.target.value})}/></Lbl><Lbl t="ΔΟΥ"><input style={inp} value={ff.doy} onChange={e=>setFf({...ff,doy:e.target.value})}/></Lbl><Lbl t="Τηλέφωνο"><input style={inp} value={ff.phone} onChange={e=>setFf({...ff,phone:e.target.value})}/></Lbl><div style={{gridColumn:"1/-1"}}><Lbl t="Διεύθυνση"><input style={inp} value={ff.address} onChange={e=>setFf({...ff,address:e.target.value})}/></Lbl></div><div style={{gridColumn:"1/-1"}}><Lbl t="Email"><input style={inp} value={ff.email} onChange={e=>setFf({...ff,email:e.target.value})}/></Lbl></div></div><div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:18}}><Btn variant="ghost" onClick={()=>setShowFM(false)}>Ακύρωση</Btn><Btn variant="primary" onClick={()=>{setFirm(ff);setShowFM(false);}}>Αποθήκευση</Btn></div></Modal>)}
  </div>);
}
