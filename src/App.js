import { useState, useEffect, useRef } from "react";

/* ─── Colours ────────────────────────────────────────────────────────────── */
const NAVY   = "#1A3C5E";
const ACCENT = "#2A7FBF";
const LIGHT  = "#EBF4FB";
const GOLD   = "#C8962A";
const GOLDL  = "#FDF6E3";
const GREEN  = "#276749";
const GREENL = "#F0FFF4";
const RED    = "#C53030";
const REDL   = "#FFF5F5";
const BORDER = "#C8D8E8";
const BG     = "#F0F5FA";
const MUTED  = "#667788";

/* ─── Seed data ──────────────────────────────────────────────────────────── */
const FIRM0 = {
  name:"Plus Accounting", afm:"000000000", doy:"ΔΟΥ ...",
  address:"...", phone:"210 0000000", email:"info@plusaccounting.gr",
};

const CLIENTS0 = [
  { id:"c1", name:"Νίκος Παπαδόπουλος", afm:"123456789", doy:"ΔΟΥ Αθηνών Α΄",
    address:"Λεωφ. Αθηνών 10, Αθήνα", email:"nikos@example.gr", phone:"6900000001", type:"individual" },
  { id:"c2", name:"ΑΛΦΑ ΜΟΝΟΠΡΟΣΩΠΗ ΕΠΕ", afm:"987654321", doy:"ΔΟΥ Πειραιά",
    address:"Σταδίου 25, Πειραιάς", email:"info@alfa.gr", phone:"2100000002", type:"business" },
];

const PKGS0 = [
  { id:"p1", code:"LOG-001", name:"Βασικό Πακέτο Λογιστικής",
    desc:"Μηνιαία τήρηση βιβλίων, ΦΠΑ, μισθοδοσία έως 3 εργαζόμενοι", price:150, vat:24 },
  { id:"p2", code:"LOG-002", name:"Πλήρες Πακέτο Επιχείρησης",
    desc:"Πλήρης λογιστική υποστήριξη, φορολογικές δηλώσεις, ισολογισμός", price:350, vat:24 },
  { id:"p3", code:"ΦΟΡ-001", name:"Φορολογική Δήλωση Φυσικού Προσώπου",
    desc:"Σύνταξη & υποβολή Ε1, Ε2, Ε3", price:80, vat:24 },
  { id:"p4", code:"ΦΟΡ-002", name:"Παρακολούθηση ΜΥΦ/VIES",
    desc:"Μηνιαία υποβολή συγκεντρωτικών καταστάσεων", price:60, vat:24 },
];

/* ─── Default contract articles template ─────────────────────────────────── */
// type: "dynamic" = auto-filled from form data, "static" = free text
const ARTICLES0 = [
  {
    id: "a1", order: 1, type: "dynamic",
    title: "ΑΡΘΡΟ 1 — ΑΝΤΙΚΕΙΜΕΝΟ ΣΥΜΒΑΣΗΣ",
    content: "",
    hint: "Συμπληρώνεται αυτόματα από τις επιλεγμένες υπηρεσίες",
  },
  {
    id: "a2", order: 2, type: "dynamic",
    title: "ΑΡΘΡΟ 2 — ΑΜΟΙΒΗ / REMUNERATION",
    content: "",
    hint: "Συμπληρώνεται αυτόματα από την τιμή και τον τρόπο πληρωμής",
  },
  {
    id: "a3", order: 3, type: "dynamic",
    title: "ΑΡΘΡΟ 3 — ΔΙΑΡΚΕΙΑ / DURATION",
    content: "",
    hint: "Συμπληρώνεται αυτόματα από τις ημερομηνίες",
  },
  {
    id: "a4", order: 4, type: "static",
    title: "ΑΡΘΡΟ 4 — ΥΠΟΧΡΕΩΣΕΙΣ ΜΕΡΩΝ",
    content: "Ο Εντολέας υποχρεούται να χορηγεί έγκαιρα τα απαραίτητα παραστατικά και στοιχεία που απαιτούνται για την εκτέλεση των εργασιών.\n\nΟ Ανάδοχος υποχρεούται να τηρεί εχεμύθεια ως προς τα οικονομικά στοιχεία και δεδομένα του Εντολέα.",
    hint: "",
  },
  {
    id: "a5", order: 5, type: "static",
    title: "ΑΡΘΡΟ 5 — ΛΥΣΗ ΣΥΜΒΑΣΗΣ",
    content: "Η σύμβαση δύναται να καταγγελθεί από οποιοδήποτε μέρος με έγγραφη ειδοποίηση τριάντα (30) ημερών. Σε περίπτωση καταγγελίας, ο Εντολέας υποχρεούται να εξοφλήσει τις οφειλόμενες αμοιβές μέχρι την ημερομηνία λύσης της σύμβασης.",
    hint: "",
  },
  {
    id: "a6", order: 6, type: "static",
    title: "ΑΡΘΡΟ 6 — ΕΦΑΡΜΟΣΤΕΟ ΔΙΚΑΙΟ",
    content: "Η παρούσα σύμβαση διέπεται από το Ελληνικό Δίκαιο. Για κάθε διαφορά που τυχόν ανακύψει από την παρούσα σύμβαση, αρμόδια ορίζονται τα Δικαστήρια της Αθήνας.",
    hint: "",
  },
  {
    id: "a-close", order: 99, type: "closing",
    title: "ΚΛΕΙΣΙΜΟ",
    content: "Το παρόν συντάχθηκε σε δύο (2) αντίτυπα και κάθε συμβαλλόμενος έλαβε από ένα (1) πρωτότυπο.",
    hint: "Εμφανίζεται πριν τις υπογραφές",
  },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const newLine  = () => ({ id:"l"+Date.now()+Math.random(), pkgId:"", customPrice:"", customDesc:"" });
const lsGet    = (k,fb) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):fb; } catch { return fb; } };
const lsSet    = (k,v)  => { try { localStorage.setItem(k,JSON.stringify(v)); } catch {} };
const xe       = (s)    => String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
const fmtD     = (ds)   => { try { return new Date(ds).toLocaleDateString("el-GR"); } catch { return ds||""; } };

function nextNo(hist, type) {
  const pre = type === "prosfora" ? "ΠΡΟ" : "ΣΥΜ";
  const yr  = new Date().getFullYear();
  const n   = hist.filter(d => d.type===type && d.docNo?.startsWith(pre+"-"+yr)).length + 1;
  return pre + "-" + yr + "-" + String(n).padStart(3,"0");
}

function calcLine(line, packages) {
  const pkg = packages.find(p => p.id === line.pkgId);
  if (!pkg) return null;
  const net  = parseFloat(line.customPrice || pkg.price) || 0;
  const vatR = pkg.vat ?? 24;
  const vat  = +(net * vatR / 100).toFixed(2);
  return {
    pkg,
    net:   net.toFixed(2),
    vat:   vat.toFixed(2),
    total: (net + vat).toFixed(2),
    vatR,
    desc:  line.customDesc || pkg.desc,
  };
}

function calcTotals(lines, packages) {
  const calced  = lines.map(l => calcLine(l, packages)).filter(Boolean);
  const tNet    = calced.reduce((s,l) => s + parseFloat(l.net),   0);
  const tVat    = calced.reduce((s,l) => s + parseFloat(l.vat),   0);
  const tGross  = calced.reduce((s,l) => s + parseFloat(l.total), 0);
  return {
    calced,
    totalNet:   tNet.toFixed(2),
    totalVat:   tVat.toFixed(2),
    totalGross: tGross.toFixed(2),
  };
}

/* ─── PDF HTML builder ───────────────────────────────────────────────────── */
function buildDocHtml(d, logo) {
  const {
    docType, docNo, docDate, firm, client,
    lines, packages, payMethod, validDays,
    startDate, duration, notes,
  } = d;

  const isP = docType === "prosfora";
  const { calced, totalNet, totalVat, totalGross } = calcTotals(lines, packages);

  const logoHtml = logo
    ? '<img src="' + logo.url + '" style="height:48px;object-fit:contain;display:block;margin-bottom:6px;">'
    : "";

  /* info box */
  function infoBox(rows) {
    const trs = rows.map(function(row) {
      const label = row[0];
      const value = row[1];
      return (
        "<tr>" +
        "<td style='padding:5px 10px;font-size:10pt;background:#EBF4FB;font-weight:700;" +
          "color:#1A3C5E;width:34%;border:1px solid #2A7FBF;vertical-align:top;'>" + xe(label) + "</td>" +
        "<td style='padding:5px 10px;font-size:10pt;background:#EBF4FB;color:#333;" +
          "border:1px solid #2A7FBF;vertical-align:top;'>" + xe(value || "—") + "</td>" +
        "</tr>"
      );
    }).join("");
    return "<table style='width:100%;border-collapse:collapse;margin-bottom:12px;'>" + trs + "</table>";
  }

  /* services table */
  const svcRows = calced.map(function(l, i) {
    const bg = i % 2 === 0 ? "#FAFCFF" : "#EBF4FB";
    return (
      "<tr style='background:" + bg + ";'>" +
      "<td style='padding:5px 10px;font-size:9.5pt;border-bottom:1px solid #D0E0EF;" +
        "color:#2A7FBF;font-weight:600;'>" + xe(l.pkg.code || "") + "</td>" +
      "<td style='padding:5px 10px;font-size:9.5pt;border-bottom:1px solid #D0E0EF;" +
        "font-weight:600;'>" + xe(l.pkg.name) + "</td>" +
      "<td style='padding:5px 10px;font-size:9pt;border-bottom:1px solid #D0E0EF;" +
        "color:#555;'>" + xe(l.desc) + "</td>" +
      "<td style='padding:5px 10px;font-size:9.5pt;border-bottom:1px solid #D0E0EF;" +
        "text-align:right;'>" + xe(l.net) + "</td>" +
      "<td style='padding:5px 10px;font-size:9.5pt;border-bottom:1px solid #D0E0EF;" +
        "text-align:right;'>" + l.vatR + "%</td>" +
      "<td style='padding:5px 10px;font-size:9.5pt;border-bottom:1px solid #D0E0EF;" +
        "text-align:right;font-weight:600;'>" + xe(l.total) + "</td>" +
      "</tr>"
    );
  }).join("");

  const svcTable = (
    "<table style='width:100%;border-collapse:collapse;margin-bottom:12px;'>" +
    "<thead><tr style='background:#1A3C5E;color:white;'>" +
    "<td style='padding:6px 10px;font-size:9.5pt;font-weight:700;width:12%;'>Κωδικός</td>" +
    "<td style='padding:6px 10px;font-size:9.5pt;font-weight:700;width:33%;'>Υπηρεσία</td>" +
    "<td style='padding:6px 10px;font-size:9.5pt;font-weight:700;'>Περιγραφή</td>" +
    "<td style='padding:6px 10px;font-size:9.5pt;font-weight:700;text-align:right;width:12%;'>Net €</td>" +
    "<td style='padding:6px 10px;font-size:9.5pt;font-weight:700;text-align:right;width:10%;'>ΦΠΑ%</td>" +
    "<td style='padding:6px 10px;font-size:9.5pt;font-weight:700;text-align:right;width:13%;'>Σύνολο €</td>" +
    "</tr></thead>" +
    "<tbody>" + svcRows + "</tbody>" +
    "<tfoot><tr style='background:#1A3C5E;color:white;'>" +
    "<td colspan='3' style='padding:6px 10px;font-size:10.5pt;font-weight:700;'>ΣΥΝΟΛΟ / TOTAL</td>" +
    "<td style='padding:6px 10px;font-size:9.5pt;text-align:right;'>Net: " + xe(totalNet) + " €</td>" +
    "<td style='padding:6px 10px;font-size:9.5pt;text-align:right;'>ΦΠΑ: " + xe(totalVat) + " €</td>" +
    "<td style='padding:6px 10px;font-size:10.5pt;font-weight:700;text-align:right;'>" + xe(totalGross) + " €</td>" +
    "</tr></tfoot></table>"
  );

  function sec(t) {
    return "<h3 style='font-size:10pt;font-weight:700;color:#2A7FBF;text-transform:uppercase;" +
      "margin:16px 0 7px;border-bottom:1px solid #C8D8E8;padding-bottom:3px;'>" + t + "</h3>";
  }
  function pp(t, extra) {
    return "<p style='font-size:10.5pt;line-height:1.65;margin:0 0 6px;" + (extra||"") + "'>" + xe(t) + "</p>";
  }
  function sigTable(l, r) {
    return (
      "<table style='width:100%;border-collapse:collapse;margin-top:48px;'><tr>" +
      "<td style='width:50%;text-align:center;padding:0 20px;'>" +
      "<p style='font-size:10pt;font-weight:700;color:#1A3C5E;margin:0 0 52px;'>" + xe(l) + "</p>" +
      "<div style='border-bottom:1px solid #999;'></div>" +
      "<p style='font-size:8.5pt;color:#888;font-style:italic;margin:4px 0 0;'>Υπογραφή &amp; Σφραγίδα</p>" +
      "</td>" +
      "<td style='width:50%;text-align:center;padding:0 20px;'>" +
      (r
        ? "<p style='font-size:10pt;font-weight:700;color:#1A3C5E;margin:0 0 52px;'>" + xe(r) + "</p>" +
          "<div style='border-bottom:1px solid #999;'></div>" +
          "<p style='font-size:8.5pt;color:#888;font-style:italic;margin:4px 0 0;'>Υπογραφή &amp; Σφραγίδα</p>"
        : "") +
      "</td></tr></table>"
    );
  }

  let clientInfoRows = [
    ["Επωνυμία",   client.name],
    ["ΑΦΜ",        client.afm],
    ["ΔΟΥ",        client.doy],
    ["Διεύθυνση",  client.address],
  ];
  if (client.email) clientInfoRows.push(["Email",    client.email]);
  if (client.phone) clientInfoRows.push(["Τηλέφωνο", client.phone]);

  let body = "";

  if (isP) {
    body =
      sec("ΣΤΟΙΧΕΙΑ ΠΕΛΑΤΗ / CLIENT") +
      infoBox(clientInfoRows) +
      pp("Αγαπητέ/ή κύριε/α " + client.name + ",", "margin-top:14px;") +
      pp("Σας υποβάλλουμε την παρούσα προσφορά για την παροχή λογιστικών υπηρεσιών:") +
      sec("ΑΝΑΛΥΣΗ ΥΠΗΡΕΣΙΩΝ / SERVICES") +
      svcTable +
      pp("Τρόπος Πληρωμής / Payment: " + payMethod) +
      pp("Ισχύς Προσφοράς / Validity: " + validDays + " ημέρες από " + fmtD(docDate)) +
      (notes ? sec("ΠΑΡΑΤΗΡΗΣΕΙΣ / NOTES") + pp(notes) : "") +
      "<div style='margin-top:28px;'>" +
      pp("Παραμένουμε στη διάθεσή σας για οποιαδήποτε διευκρίνιση.", "font-style:italic;color:#555;") +
      pp("Με εκτίμηση,", "margin-top:8px;") +
      "</div>" +
      sigTable(firm.name, "");
  } else {
    const partyARows = [
      ["Α) Ανάδοχος",        firm.name + "  |  ΑΦΜ: " + firm.afm + "  |  " + firm.doy],
      ["Διεύθυνση Αναδόχου", firm.address],
      ["Β) Εντολέας",        client.name + "  |  ΑΦΜ: " + client.afm + "  |  " + client.doy],
      ["Διεύθυνση Εντολέα",  client.address],
    ];

    const allArts   = d.articles || ARTICLES0;
    const arts      = allArts.filter(a => a.id !== "a-close").sort((a,b) => a.order - b.order);
    const closingArt = allArts.find(a => a.id === "a-close");

    let articlesHtml = "";
    arts.forEach(function(art) {
      articlesHtml += sec(art.title);
      if (art.type === "dynamic") {
        if (art.id === "a1") {
          articlesHtml += svcTable;
        } else if (art.id === "a2") {
          articlesHtml += pp("Τρόπος πληρωμής / Payment: " + payMethod);
        } else if (art.id === "a3") {
          articlesHtml += pp("Έναρξη / Start: " + fmtD(startDate));
          articlesHtml += pp("Διάρκεια / Duration: " + duration);
          articlesHtml += pp("Η σύμβαση παρατείνεται αυτόματα εκτός εάν καταγγελθεί εγγράφως με 30 ημέρες προειδοποίηση.");
        }
      } else {
        (art.content || "").split("\n").filter(t => t.trim()).forEach(function(line) {
          articlesHtml += pp(line);
        });
      }
    });

    if (notes) {
      articlesHtml += sec("ΠΑΡΑΤΗΡΗΣΕΙΣ / ADDITIONAL NOTES") + pp(notes);
    }

    const closingText = closingArt ? closingArt.content
      : "Το παρόν συντάχθηκε σε δύο (2) αντίτυπα και κάθε συμβαλλόμενος έλαβε από ένα (1) πρωτότυπο.";

    body =
      pp("Στην Αθήνα, σήμερα " + fmtD(docDate) + ", μεταξύ των:") +
      infoBox(partyARows) +
      pp("συμφωνήθηκαν και έγιναν αμοιβαία αποδεκτά τα εξής:", "font-style:italic;color:#555;") +
      articlesHtml +
      pp(closingText, "font-style:italic;color:#555;margin-top:20px;") +
      sigTable("Ο ΑΝΑΔΟΧΟΣ", "Ο ΕΝΤΟΛΕΑΣ");
  }

  const css = [
    "*{box-sizing:border-box;margin:0;padding:0;}",
    "body{font-family:'Calibri','Arial',sans-serif;font-size:11pt;color:#222;background:white;padding:18mm;}",
    "@page{size:A4;margin:18mm;}",
    "@media print{",
    "  body{padding:0;}",
    "  .toolbar{display:none!important;}",
    "  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}",
    "}",
    ".toolbar{position:fixed;top:0;left:0;right:0;background:#1A3C5E;color:white;",
    "  padding:12px 20px;display:flex;align-items:center;justify-content:space-between;",
    "  z-index:100;font-family:Arial,sans-serif;}",
    ".btn-print{background:#C8962A;color:white;border:none;padding:8px 20px;",
    "  border-radius:6px;cursor:pointer;font-size:14px;font-weight:600;}",
    ".btn-print:hover{background:#a87820;}",
    ".btn-close{background:rgba(255,255,255,.15);color:white;border:1px solid rgba(255,255,255,.3);",
    "  padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;}",
    ".doc-wrap{max-width:170mm;margin:60px auto 20px;}",
    "@media print{.doc-wrap{margin:0;max-width:100%;}}",
  ].join("\n");

  return (
    "<!DOCTYPE html><html lang='el'><head><meta charset='UTF-8'>" +
    "<title>" + xe(docNo) + "</title>" +
    "<style>" + css + "</style></head><body>" +
    "<div class='toolbar'>" +
    "<h2 style='font-size:14px;font-weight:600;margin:0;'>📄 " + xe(docNo) + "</h2>" +
    "<div style='display:flex;gap:10px;'>" +
    "<button class='btn-close' onclick='window.close()'>✕ Κλείσιμο</button>" +
    "<button class='btn-print' onclick='window.print()'>🖨 Αποθήκευση ως PDF</button>" +
    "</div></div>" +
    "<div class='doc-wrap'>" +
    "<div style='border-bottom:3px solid #1A3C5E;padding-bottom:10px;margin-bottom:16px;'>" +
    logoHtml +
    "<div style='font-size:15pt;font-weight:700;color:#1A3C5E;letter-spacing:1px;margin-bottom:3px;'>" +
    xe(firm.name.toUpperCase()) + "</div>" +
    "<div style='font-size:9pt;color:#555;line-height:1.6;'>" +
    "ΑΦΜ: " + xe(firm.afm) + " &nbsp;|&nbsp; " + xe(firm.doy) + " &nbsp;|&nbsp; " + xe(firm.address) + "<br>" +
    "Τηλ: " + xe(firm.phone) + " &nbsp;|&nbsp; Email: " + xe(firm.email) +
    "</div></div>" +
    "<div style='font-size:16pt;font-weight:700;color:#1A3C5E;margin-bottom:10px;'>" +
    (isP ? "ΠΡΟΣΦΟΡΑ ΥΠΗΡΕΣΙΩΝ" : "ΙΔΙΩΤΙΚΟ ΣΥΜΦΩΝΗΤΙΚΟ ΠΑΡΟΧΗΣ ΥΠΗΡΕΣΙΩΝ") +
    "</div>" +
    "<table style='width:100%;border-collapse:collapse;margin-bottom:16px;'>" +
    "<tr><td style='padding:5px 10px;background:#EBF4FB;font-weight:700;color:#1A3C5E;" +
      "width:34%;border:1px solid #2A7FBF;font-size:10pt;'>Αρ. Εγγράφου</td>" +
      "<td style='padding:5px 10px;background:#EBF4FB;border:1px solid #2A7FBF;font-size:10pt;'>" +
      xe(docNo) + "</td></tr>" +
    "<tr><td style='padding:5px 10px;background:#EBF4FB;font-weight:700;color:#1A3C5E;" +
      "border:1px solid #2A7FBF;font-size:10pt;'>Ημερομηνία / Date</td>" +
      "<td style='padding:5px 10px;background:#EBF4FB;border:1px solid #2A7FBF;font-size:10pt;'>" +
      fmtD(docDate) + "</td></tr>" +
    "</table>" +
    body +
    "<div style='margin-top:24px;padding-top:8px;border-top:1px solid #CCC;" +
      "font-size:8.5pt;color:#888;text-align:center;'>" +
    xe(firm.name) + " &nbsp;|&nbsp; " + xe(firm.email) + " &nbsp;|&nbsp; " + xe(firm.phone) +
    "</div></div></body></html>"
  );
}

/* ─── UI atoms ───────────────────────────────────────────────────────────── */
const inpStyle = {
  width:"100%", padding:"8px 11px", border:"1px solid " + BORDER,
  borderRadius:6, fontSize:14, color:"#111", background:"#FAFCFF",
  boxSizing:"border-box", fontFamily:"inherit",
};
const selStyle = { ...inpStyle, cursor:"pointer" };

function Lbl({ t, req, children }) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ fontSize:11, fontWeight:700, color:NAVY, textTransform:"uppercase",
        letterSpacing:.6, marginBottom:4 }}>
        {t}{req && <span style={{ color:RED }}> *</span>}
      </div>
      {children}
    </div>
  );
}

function Card({ children, style={} }) {
  return (
    <div style={{ background:"#fff", borderRadius:10, padding:20,
      boxShadow:"0 2px 12px rgba(26,60,94,.10)", ...style }}>
      {children}
    </div>
  );
}

function Btn({ onClick, disabled, variant="primary", size="md", children, style={} }) {
  const pads  = { sm:"5px 10px", md:"9px 20px", lg:"11px 26px" };
  const sizes = { sm:12, md:13, lg:14 };
  const vars  = {
    primary: { background:NAVY,   color:"#fff", border:"none" },
    ghost:   { background:LIGHT,  color:ACCENT, border:"1px solid " + ACCENT },
    gold:    { background:GOLDL,  color:GOLD,   border:"1px solid " + GOLD },
    danger:  { background:REDL,   color:RED,    border:"1px solid #FC8181" },
    blue:    { background:ACCENT, color:"#fff", border:"none" },
    success: { background:GREENL, color:GREEN,  border:"1px solid #68D391" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...vars[variant], padding:pads[size], fontSize:sizes[size],
      borderRadius:7, cursor:disabled?"not-allowed":"pointer",
      fontFamily:"inherit", fontWeight:600, opacity:disabled ? .5 : 1, ...style,
    }}>
      {children}
    </button>
  );
}

function Tag({ color="blue", children }) {
  const map = {
    blue:  { bg:LIGHT,  fg:ACCENT, br:ACCENT },
    gold:  { bg:GOLDL,  fg:GOLD,   br:GOLD },
    green: { bg:GREENL, fg:GREEN,  br:"#68D391" },
  };
  const s = map[color];
  return (
    <span style={{ background:s.bg, color:s.fg, border:"1px solid "+s.br,
      borderRadius:20, padding:"2px 10px", fontSize:11, fontWeight:700 }}>
      {children}
    </span>
  );
}

function Modal({ title, onClose, children, wide=false }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.47)", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
      <div style={{ background:"#fff", borderRadius:12, width:"100%",
        maxWidth:wide ? 820 : 620, maxHeight:"92vh", overflowY:"auto",
        boxShadow:"0 24px 72px rgba(0,0,0,.3)" }}>
        <div style={{ padding:"18px 24px", borderBottom:"1px solid "+BORDER,
          display:"flex", justifyContent:"space-between", alignItems:"center",
          position:"sticky", top:0, background:"#fff" }}>
          <h3 style={{ margin:0, color:NAVY, fontSize:16 }}>{title}</h3>
          <button onClick={onClose} style={{ background:"none", border:"none",
            fontSize:24, cursor:"pointer", color:"#aaa" }}>×</button>
        </div>
        <div style={{ padding:24 }}>{children}</div>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize:11, fontWeight:700, color:NAVY, textTransform:"uppercase",
      letterSpacing:.6, marginBottom:12 }}>
      {children}
    </div>
  );
}


/* ─── Password stored in env or hardcoded fallback ──────────────────────── */
// To change password: set REACT_APP_PASSWORD in Vercel environment variables
const APP_PASSWORD = process.env.REACT_APP_PASSWORD || "plusaccounting2024";
const AUTH_KEY = "pa_session_auth";

function LoginGate({ children }) {
  const [authed,   setAuthed]   = useState(() => sessionStorage.getItem(AUTH_KEY) === "1");
  const [input,    setInput]    = useState("");
  const [error,    setError]    = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);

  if (authed) return children;

  function handleLogin(e) {
    e.preventDefault();
    if (input === APP_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, "1");
      setAuthed(true);
    } else {
      setError(true);
      setInput("");
      setTimeout(() => setError(false), 2500);
    }
  }

  return (
    <div style={{
      minHeight:"100vh", background:"#F0F5FA",
      display:"flex", alignItems:"center", justifyContent:"center",
      fontFamily:"'Palatino Linotype','Book Antiqua',Georgia,serif",
    }}>
      <div style={{ background:"#fff", borderRadius:14, padding:"40px 44px",
        boxShadow:"0 8px 40px rgba(26,60,94,.18)", width:"100%", maxWidth:380,
        textAlign:"center" }}>

        {/* Logo */}
        <div style={{ width:54, height:54, background:"#C8962A", borderRadius:12,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:900, fontSize:26, color:"#fff", margin:"0 auto 16px" }}>P</div>

        <div style={{ fontWeight:700, fontSize:20, color:"#1A3C5E",
          letterSpacing:1, marginBottom:4 }}>PLUS ACCOUNTING</div>
        <div style={{ fontSize:12, color:"#667788", letterSpacing:2,
          textTransform:"uppercase", marginBottom:32 }}>Document Generator</div>

        <form onSubmit={handleLogin}>
          <div style={{ position:"relative", marginBottom:16 }}>
            <input
              type={showPwd ? "text" : "password"}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Κωδικός πρόσβασης"
              autoFocus
              style={{
                width:"100%", padding:"11px 44px 11px 16px",
                border:"2px solid " + (error ? "#FC8181" : "#C8D8E8"),
                borderRadius:8, fontSize:15, color:"#111",
                background: error ? "#FFF5F5" : "#FAFCFF",
                boxSizing:"border-box", fontFamily:"inherit",
                outline:"none", transition:"border .2s",
              }}
            />
            <button type="button" onClick={() => setShowPwd(v => !v)}
              style={{ position:"absolute", right:12, top:"50%",
                transform:"translateY(-50%)", background:"none", border:"none",
                cursor:"pointer", fontSize:16, color:"#999", padding:0 }}>
              {showPwd ? "🙈" : "👁"}
            </button>
          </div>

          {error && (
            <div style={{ color:"#C53030", fontSize:13, marginBottom:12,
              padding:"8px 12px", background:"#FFF5F5", borderRadius:6 }}>
              ⚠ Λάθος κωδικός. Δοκιμάστε ξανά.
            </div>
          )}

          <button type="submit" style={{
            width:"100%", padding:"12px", background:"#1A3C5E", color:"#fff",
            border:"none", borderRadius:8, fontSize:15, fontWeight:700,
            cursor:"pointer", fontFamily:"inherit",
          }}>
            Είσοδος →
          </button>
        </form>

        <div style={{ marginTop:20, fontSize:11, color:"#aaa" }}>
          Για αλλαγή κωδικού: Vercel → Settings → Environment Variables → REACT_APP_PASSWORD
        </div>
      </div>
    </div>
  );
}

/* ─── Service lines component ────────────────────────────────────────────── */
function ServiceLines({ lines, setLines, packages }) {
  function updateLine(id, field, val) {
    setLines(ls => ls.map(l => l.id === id ? { ...l, [field]: val } : l));
  }
  function removeLine(id) {
    setLines(ls => ls.filter(l => l.id !== id));
  }

  const { totalNet, totalVat, totalGross } = calcTotals(lines, packages);
  const hasAny = lines.some(l => l.pkgId);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between",
        alignItems:"center", marginBottom:12 }}>
        <SectionTitle>Υπηρεσίες / Πακέτα</SectionTitle>
        <Btn size="sm" variant="ghost"
          onClick={() => setLines(ls => [...ls, newLine()])}>
          + Προσθήκη υπηρεσίας
        </Btn>
      </div>

      {lines.map((line, i) => {
        const pkg  = packages.find(p => p.id === line.pkgId);
        const net  = parseFloat(line.customPrice || pkg?.price || 0);
        const vatR = pkg?.vat ?? 24;
        const tot  = +(net * (1 + vatR / 100)).toFixed(2);

        return (
          <div key={line.id} style={{
            border:"1px solid " + (pkg ? BORDER : "#FC8181"),
            borderRadius:8, padding:14, marginBottom:10,
            background: pkg ? "#FAFCFF" : "#FFF8F8",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8,
              marginBottom: pkg ? 10 : 0 }}>
              <div style={{ width:22, height:22, background:NAVY, color:"#fff",
                borderRadius:"50%", display:"flex", alignItems:"center",
                justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0 }}>
                {i + 1}
              </div>
              <select style={{ ...selStyle, flex:1 }} value={line.pkgId}
                onChange={e => updateLine(line.id, "pkgId", e.target.value)}>
                <option value="">— Επιλέξτε υπηρεσία —</option>
                {packages.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.code ? "[" + p.code + "] " : ""}{p.name} ({p.price}€)
                  </option>
                ))}
              </select>
              {lines.length > 1 && (
                <button onClick={() => removeLine(line.id)} style={{
                  background:"none", border:"none", color:"#FC8181",
                  cursor:"pointer", fontSize:18, lineHeight:1, flexShrink:0,
                }}>✕</button>
              )}
            </div>

            {pkg && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr",
                gap:10, marginTop:4 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:NAVY,
                    textTransform:"uppercase", letterSpacing:.5, marginBottom:4 }}>
                    Τιμή Net (€) — κενό = τιμή πακέτου
                  </div>
                  <input style={inpStyle} type="number"
                    value={line.customPrice}
                    onChange={e => updateLine(line.id, "customPrice", e.target.value)}
                    placeholder={String(pkg.price)} />
                </div>
                <div style={{ display:"flex", alignItems:"flex-end" }}>
                  <div style={{ background:GREENL, border:"1px solid #68D391",
                    borderRadius:6, padding:"8px 12px", fontSize:12, width:"100%" }}>
                    <span style={{ color:MUTED }}>Net: </span>
                    <strong>{net.toFixed(2)}€</strong>
                    <span style={{ color:MUTED, margin:"0 4px" }}>+ ΦΠΑ {vatR}%:</span>
                    <strong>{(net * vatR / 100).toFixed(2)}€</strong>
                    <span style={{ margin:"0 4px", color:MUTED }}>=</span>
                    <strong style={{ color:GREEN }}>{tot}€</strong>
                  </div>
                </div>
                <div style={{ gridColumn:"1/-1" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:NAVY,
                    textTransform:"uppercase", letterSpacing:.5, marginBottom:4 }}>
                    Περιγραφή — κενό = τυπική περιγραφή
                  </div>
                  <textarea style={{ ...inpStyle, minHeight:50, resize:"vertical" }}
                    value={line.customDesc}
                    onChange={e => updateLine(line.id, "customDesc", e.target.value)}
                    placeholder={pkg.desc} />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {hasAny && (
        <div style={{ background:LIGHT, border:"1px solid "+ACCENT,
          borderRadius:7, padding:"12px 16px", marginTop:4 }}>
          <div style={{ fontSize:11, color:MUTED, marginBottom:6,
            textTransform:"uppercase", letterSpacing:.5 }}>
            Σύνολο εγγράφου
          </div>
          <div style={{ display:"flex", gap:20, fontSize:13 }}>
            <span>
              <span style={{ color:MUTED }}>Net: </span>
              <strong>{totalNet} €</strong>
            </span>
            <span>
              <span style={{ color:MUTED }}>ΦΠΑ: </span>
              <strong>{totalVat} €</strong>
            </span>
            <span style={{ marginLeft:"auto" }}>
              <span style={{ color:MUTED }}>ΣΥΝΟΛΟ: </span>
              <strong style={{ color:NAVY, fontSize:15 }}>{totalGross} €</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main App ───────────────────────────────────────────────────────────── */
export default function App() {
  const [tab,       setTab]       = useState("new");
  const [firm,      setFirm]      = useState(() => lsGet("pa_firm",     FIRM0));
  const [logo,      setLogo]      = useState(() => lsGet("pa_logo",     null));
  const [clients,   setClients]   = useState(() => lsGet("pa_clients",  CLIENTS0));
  const [packages,  setPackages]  = useState(() => lsGet("pa_packages", PKGS0));
  const [articles,  setArticles]  = useState(() => lsGet("pa_articles", ARTICLES0));
  const [history,   setHistory]   = useState(() => lsGet("pa_history",  []));

  const [docType,   setDocType]   = useState("prosfora");
  const [clientId,  setClientId]  = useState("");
  const [lines,     setLines]     = useState([newLine()]);
  const [payMethod, setPayMethod] = useState("μηνιαίως");
  const [validDays, setValidDays] = useState("30");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0,10));
  const [duration,  setDuration]  = useState("12 μήνες");
  const [notes,     setNotes]     = useState("");
  const [docDate,   setDocDate]   = useState(new Date().toISOString().slice(0,10));

  const [showCM,      setShowCM]      = useState(false);
  const [showPM,      setShowPM]      = useState(false);
  const [showFM,      setShowFM]      = useState(false);
  const [showAM,      setShowAM]      = useState(false);
  const [editingPkg,  setEditingPkg]  = useState(null);
  const [editDoc,     setEditDoc]     = useState(null);
  const [status,      setStatus]      = useState({ msg:"", type:"" });
  const [hFilt,       setHFilt]       = useState("all");
  const [hQ,          setHQ]          = useState("");

  const [cf, setCf] = useState({ name:"", afm:"", doy:"", address:"", email:"", phone:"", type:"business" });
  const [pf, setPf] = useState({ code:"", name:"", desc:"", price:"", vat:"24" });
  const [ff, setFf] = useState(FIRM0);
  const logoRef = useRef();

  useEffect(() => lsSet("pa_firm",     firm),     [firm]);
  useEffect(() => lsSet("pa_clients",  clients),  [clients]);
  useEffect(() => lsSet("pa_packages", packages), [packages]);
  useEffect(() => lsSet("pa_articles", articles), [articles]);
  useEffect(() => lsSet("pa_history",  history),  [history]);
  useEffect(() => { if (logo) lsSet("pa_logo", logo); }, [logo]);

  const client = clients.find(c => c.id === clientId);
  const canGen = !!(client && lines.some(l => l.pkgId));

  function showMsg(m, t="info") {
    setStatus({ msg:m, type:t });
    if (t !== "err") setTimeout(() => setStatus({ msg:"", type:"" }), 4000);
  }

  function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const [meta, b64] = ev.target.result.split(",");
      const mime = (meta.match(/:(.*?);/) || [])[1] || "image/png";
      setLogo({ base64:b64, mime, url:ev.target.result });
    };
    reader.readAsDataURL(file);
  }

  function buildPayload(docNo, histDoc=null) {
    if (histDoc) {
      const c = clients.find(x => x.id === histDoc.clientId) ||
        { name:histDoc.clientName, afm:"", doy:"", address:"", email:"", phone:"" };
      return {
        docType:   histDoc.type,
        docNo:     histDoc.docNo,
        docDate:   histDoc.date,
        firm,      client:c,
        lines:     histDoc.lines || [],
        packages,
        articles,
        payMethod: histDoc.payMethod  || "μηνιαίως",
        validDays: histDoc.validDays  || "30",
        startDate: histDoc.startDate  || histDoc.date,
        duration:  histDoc.duration   || "12 μήνες",
        notes:     histDoc.notes      || "",
      };
    }
    return { docType, docNo, docDate, firm, client, lines, packages, articles,
             payMethod, validDays, startDate, duration, notes };
  }

  function openPdf(histDoc=null) {
    const docNo = histDoc ? histDoc.docNo : nextNo(history, docType);
    const html  = buildDocHtml(buildPayload(docNo, histDoc), logo);
    const win   = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
  }

  function saveEntry(docNo) {
    const { totalGross } = calcTotals(lines, packages);
    const entry = {
      id:         editDoc ? editDoc.id : "doc" + Date.now(),
      type:       docType, docNo,
      clientName: client.name, clientId,
      lines, totalGross, payMethod, validDays,
      startDate, duration, notes,
      date:       docDate,
      createdAt:  editDoc ? editDoc.createdAt : new Date().toISOString(),
      updatedAt:  new Date().toISOString(),
    };
    if (editDoc) {
      setHistory(h => h.map(d => d.id === editDoc.id ? entry : d));
      setEditDoc(null);
    } else {
      setHistory(h => [entry, ...h]);
    }
    return entry;
  }

  function handleSave() {
    if (!canGen) return;
    saveEntry(editDoc ? editDoc.docNo : nextNo(history, docType));
    showMsg("✓ Αποθηκεύτηκε!", "ok");
    setTab("history");
  }

  function handleSaveAndPdf() {
    if (!canGen) return;
    const docNo = editDoc ? editDoc.docNo : nextNo(history, docType);
    saveEntry(docNo);
    openPdf();
  }

  function loadEdit(doc) {
    setEditDoc(doc);
    setDocType(doc.type);
    setClientId(doc.clientId);
    setLines(doc.lines && doc.lines.length > 0 ? doc.lines : [newLine()]);
    setPayMethod(doc.payMethod  || "μηνιαίως");
    setValidDays(doc.validDays  || "30");
    setStartDate(doc.startDate  || doc.date);
    setDuration( doc.duration   || "12 μήνες");
    setNotes(    doc.notes      || "");
    setDocDate(  doc.date);
    setTab("new");
  }

  function addClient() {
    if (!cf.name || !cf.afm) return;
    const nc = { ...cf, id:"c" + Date.now() };
    setClients(p => [...p, nc]);
    setClientId(nc.id);
    setCf({ name:"", afm:"", doy:"", address:"", email:"", phone:"", type:"business" });
    setShowCM(false);
  }

  function savePkg() {
    if (!pf.name) return;
    const data = { ...pf, price: parseFloat(pf.price)||0, vat: parseInt(pf.vat)||24 };
    if (editingPkg) {
      setPackages(ps => ps.map(p => p.id === editingPkg ? { ...p, ...data } : p));
      setEditingPkg(null);
    } else {
      setPackages(ps => [...ps, { ...data, id:"p" + Date.now() }]);
    }
    setPf({ code:"", name:"", desc:"", price:"", vat:"24" });
    setShowPM(false);
  }

  function startEditPkg(pkg) {
    setPf({ code:pkg.code||"", name:pkg.name, desc:pkg.desc,
            price:String(pkg.price), vat:String(pkg.vat) });
    setEditingPkg(pkg.id);
    setShowPM(true);
  }

  const filtH = history.filter(d => {
    if (hFilt !== "all" && d.type !== hFilt) return false;
    const q = hQ.toLowerCase();
    return !q || d.clientName?.toLowerCase().includes(q) || d.docNo?.toLowerCase().includes(q);
  });

  const stC = {
    ok:   { bg:GREENL, fg:GREEN,  br:"#68D391" },
    err:  { bg:REDL,   fg:RED,    br:RED },
    info: { bg:LIGHT,  fg:ACCENT, br:ACCENT },
  };

  /* ── render ── */
  return (
    <LoginGate>
    <div style={{ minHeight:"100vh", background:BG,
      fontFamily:"'Palatino Linotype','Book Antiqua',Georgia,serif" }}>

      {/* nav */}
      <div style={{ background:NAVY }}>
        <div style={{ maxWidth:1060, margin:"0 auto", display:"flex",
          alignItems:"center", justifyContent:"space-between",
          height:58, padding:"0 20px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            {logo
              ? <img src={logo.url} alt="logo" style={{ height:34, objectFit:"contain" }} />
              : <div style={{ width:34, height:34, background:GOLD, borderRadius:7,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontWeight:900, fontSize:17, color:"#fff" }}>P</div>
            }
            <div>
              <div style={{ fontWeight:700, fontSize:15, color:"#fff", letterSpacing:1.2 }}>
                PLUS ACCOUNTING
              </div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.6)",
                letterSpacing:2.5, textTransform:"uppercase" }}>
                Document Generator
              </div>
            </div>
          </div>
          <nav style={{ display:"flex", gap:4 }}>
            {[
              ["new",     "✎ Νέο Έγγραφο"],
              ["history", "📁 Ιστορικό (" + history.length + ")"],
              ["data",    "⚙ Δεδομένα"],
            ].map(([t,l]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: tab===t ? "rgba(255,255,255,.15)" : "none",
                border:     tab===t ? "1px solid rgba(255,255,255,.3)" : "1px solid transparent",
                color:"#fff", padding:"6px 14px", borderRadius:6,
                cursor:"pointer", fontSize:13, fontFamily:"inherit",
              }}>{l}</button>
            ))}
          </nav>
        </div>
      </div>

      {/* status bar */}
      {status.msg && (() => {
        const s = stC[status.type] || stC.info;
        return (
          <div style={{ background:s.bg, color:s.fg, borderBottom:"1px solid "+s.br,
            padding:"10px 20px", fontSize:13, textAlign:"center" }}>
            {status.msg}
          </div>
        );
      })()}

      <div style={{ maxWidth:1060, margin:"0 auto", padding:"22px 16px" }}>

        {/* ── NEW ── */}
        {tab === "new" && (
          <div>
            {editDoc && (
              <div style={{ background:GOLDL, border:"1px solid "+GOLD, borderRadius:8,
                padding:"10px 16px", marginBottom:16,
                display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, color:"#7A5C0A" }}>
                  ✎ Αναθεώρηση: <strong>{editDoc.docNo}</strong> — {editDoc.clientName}
                </span>
                <button onClick={() => { setEditDoc(null); setLines([newLine()]); }}
                  style={{ background:"none", border:"none", color:"#bbb",
                    cursor:"pointer", fontSize:20 }}>×</button>
              </div>
            )}

            <Card style={{ marginBottom:16 }}>
              <SectionTitle>Τύπος Εγγράφου</SectionTitle>
              <div style={{ display:"flex", gap:12 }}>
                {[
                  ["prosfora",  "📄 Προσφορά Υπηρεσιών"],
                  ["symfonito", "📜 Ιδιωτικό Συμφωνητικό"],
                ].map(([v,l]) => (
                  <button key={v} onClick={() => setDocType(v)} style={{
                    flex:1, padding:"12px",
                    border:"2px solid " + (docType===v ? ACCENT : BORDER),
                    background: docType===v ? LIGHT : "#FAFCFF",
                    borderRadius:8, cursor:"pointer",
                    fontWeight: docType===v ? 700 : 400,
                    color: docType===v ? NAVY : "#666",
                    fontSize:14, fontFamily:"inherit",
                  }}>{l}</button>
                ))}
              </div>
            </Card>

            <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", gap:16 }}>
              {/* left column */}
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <Card>
                  <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"center", marginBottom:12 }}>
                    <SectionTitle>Πελάτης</SectionTitle>
                    <Btn size="sm" variant="ghost" onClick={() => setShowCM(true)}>+ Νέος</Btn>
                  </div>
                  <Lbl t="Επιλογή" req>
                    <select style={selStyle} value={clientId}
                      onChange={e => setClientId(e.target.value)}>
                      <option value="">— Επιλέξτε πελάτη —</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </Lbl>
                  {client && (
                    <div style={{ background:LIGHT, borderRadius:6, padding:"10px 12px",
                      fontSize:12, color:"#2c4a6a", lineHeight:1.75 }}>
                      <div><strong>ΑΦΜ:</strong> {client.afm} · {client.doy}</div>
                      <div><strong>Διεύθ.:</strong> {client.address}</div>
                      {client.email && <div><strong>Email:</strong> {client.email}</div>}
                      {client.phone && <div><strong>Τηλ:</strong> {client.phone}</div>}
                      <div style={{ marginTop:5 }}>
                        <Tag color="blue">
                          {client.type === "business" ? "Επιχείρηση" : "Φυσικό Πρόσωπο"}
                        </Tag>
                      </div>
                    </div>
                  )}
                </Card>

                <Card>
                  <SectionTitle>
                    {docType === "prosfora" ? "Στοιχεία Προσφοράς" : "Στοιχεία Σύμβασης"}
                  </SectionTitle>
                  <Lbl t="Ημερομηνία">
                    <input style={inpStyle} type="date" value={docDate}
                      onChange={e => setDocDate(e.target.value)} />
                  </Lbl>
                  <Lbl t="Τρόπος Πληρωμής">
                    <select style={selStyle} value={payMethod}
                      onChange={e => setPayMethod(e.target.value)}>
                      {["μηνιαίως","τριμηνιαίως","εξαμηνιαίως","ετησίως","εφάπαξ"]
                        .map(o => <option key={o}>{o}</option>)}
                    </select>
                  </Lbl>
                  {docType === "prosfora" ? (
                    <Lbl t="Ισχύς (ημέρες)">
                      <input style={inpStyle} type="number" value={validDays}
                        onChange={e => setValidDays(e.target.value)} />
                    </Lbl>
                  ) : (
                    <>
                      <Lbl t="Ημερομηνία Έναρξης">
                        <input style={inpStyle} type="date" value={startDate}
                          onChange={e => setStartDate(e.target.value)} />
                      </Lbl>
                      <Lbl t="Διάρκεια">
                        <select style={selStyle} value={duration}
                          onChange={e => setDuration(e.target.value)}>
                          {["6 μήνες","12 μήνες","24 μήνες","Αορίστου χρόνου"]
                            .map(d => <option key={d}>{d}</option>)}
                        </select>
                      </Lbl>
                    </>
                  )}
                  <Lbl t="Παρατηρήσεις">
                    <textarea style={{ ...inpStyle, minHeight:60, resize:"vertical" }}
                      value={notes} onChange={e => setNotes(e.target.value)}
                      placeholder="Προαιρετικά…" />
                  </Lbl>
                </Card>
              </div>

              {/* right column */}
              <Card>
                <ServiceLines lines={lines} setLines={setLines} packages={packages} />
              </Card>
            </div>

            <div style={{ display:"flex", justifyContent:"flex-end",
              gap:10, paddingTop:16 }}>
              {!canGen && (
                <span style={{ fontSize:12, color:MUTED, alignSelf:"center" }}>
                  Επιλέξτε πελάτη και τουλάχιστον μία υπηρεσία.
                </span>
              )}
              <Btn onClick={handleSave} disabled={!canGen} variant="ghost" size="lg">
                ✓ Αποθήκευση
              </Btn>
              <Btn onClick={handleSaveAndPdf} disabled={!canGen} variant="primary" size="lg">
                ✓ Αποθήκευση & PDF →
              </Btn>
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab === "history" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"center", marginBottom:16 }}>
              <h2 style={{ margin:0, color:NAVY, fontSize:18, fontWeight:700 }}>
                Ιστορικό Εγγράφων
              </h2>
              <Btn onClick={() => { setEditDoc(null); setLines([newLine()]); setTab("new"); }}
                variant="primary">
                + Νέο Έγγραφο
              </Btn>
            </div>

            <Card style={{ marginBottom:14, display:"flex", gap:12,
              alignItems:"center", flexWrap:"wrap", padding:"14px 18px" }}>
              <input style={{ ...inpStyle, maxWidth:260 }}
                placeholder="🔍 Πελάτης ή αρ. εγγράφου…"
                value={hQ} onChange={e => setHQ(e.target.value)} />
              <div style={{ display:"flex", gap:6 }}>
                {[["all","Όλα"],["prosfora","Προσφορές"],["symfonito","Συμφωνητικά"]]
                  .map(([v,l]) => (
                    <button key={v} onClick={() => setHFilt(v)} style={{
                      padding:"6px 14px",
                      border:"1px solid " + (hFilt===v ? ACCENT : BORDER),
                      background: hFilt===v ? LIGHT : "#FAFCFF",
                      borderRadius:20, cursor:"pointer", fontSize:12,
                      color: hFilt===v ? ACCENT : MUTED, fontFamily:"inherit",
                    }}>{l}</button>
                  ))
                }
              </div>
              <span style={{ fontSize:12, color:MUTED, marginLeft:"auto" }}>
                {filtH.length} έγγραφ{filtH.length !== 1 ? "α" : "ο"}
              </span>
            </Card>

            {filtH.length === 0 ? (
              <Card style={{ textAlign:"center", padding:50, color:MUTED }}>
                <div style={{ fontSize:44, marginBottom:14 }}>📂</div>
                {history.length === 0
                  ? "Δεν υπάρχουν αποθηκευμένα έγγραφα ακόμη."
                  : "Δεν βρέθηκαν αποτελέσματα."}
              </Card>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {filtH.map(doc => (
                  <Card key={doc.id} style={{ display:"flex", alignItems:"center",
                    gap:14, padding:"14px 18px" }}>
                    <div style={{ fontSize:30 }}>
                      {doc.type === "prosfora" ? "📄" : "📜"}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center",
                        gap:8, flexWrap:"wrap" }}>
                        <span style={{ fontWeight:700, color:NAVY, fontSize:14 }}>
                          {doc.clientName}
                        </span>
                        <Tag color={doc.type === "prosfora" ? "blue" : "gold"}>
                          {doc.type === "prosfora" ? "Προσφορά" : "Συμφωνητικό"}
                        </Tag>
                        {doc.updatedAt !== doc.createdAt && (
                          <Tag color="green">Αναθεωρήθηκε</Tag>
                        )}
                      </div>
                      <div style={{ fontSize:12, color:MUTED, marginTop:3 }}>
                        {doc.docNo && <strong style={{ marginRight:10 }}>{doc.docNo}</strong>}
                        {doc.lines?.filter(l => l.pkgId).length > 0 && (
                          <span>
                            {doc.lines.filter(l => l.pkgId).length} υπηρεσί
                            {doc.lines.filter(l => l.pkgId).length === 1 ? "α" : "ες"} ·{" "}
                          </span>
                        )}
                        <strong>{doc.totalGross || "—"}€</strong>
                        {" · "}{fmtD(doc.date)}
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                      <Btn size="sm" variant="gold" onClick={() => loadEdit(doc)}>
                        ✎ Αναθεώρηση
                      </Btn>
                      <Btn size="sm" variant="blue" onClick={() => openPdf(doc)}>
                        📄 PDF
                      </Btn>
                      <Btn size="sm" variant="danger"
                        onClick={() => setHistory(h => h.filter(d => d.id !== doc.id))}>
                        🗑
                      </Btn>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DATA ── */}
        {tab === "data" && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <Card>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", marginBottom:14 }}>
                <SectionTitle>Στοιχεία Γραφείου</SectionTitle>
                <div style={{ display:"flex", gap:8 }}>
                  <input ref={logoRef} type="file" accept="image/*"
                    style={{ display:"none" }} onChange={handleLogoUpload} />
                  <Btn size="sm" variant="ghost"
                    onClick={() => logoRef.current?.click()}>
                    🖼 {logo ? "Αλλαγή" : "Ανέβασμα"} Λογοτύπου
                  </Btn>
                  {logo && (
                    <Btn size="sm" variant="danger" onClick={() => setLogo(null)}>
                      Αφαίρεση
                    </Btn>
                  )}
                  <Btn size="sm" variant="primary"
                    onClick={() => { setFf(firm); setShowFM(true); }}>
                    ✎ Επεξεργασία
                  </Btn>
                </div>
              </div>
              {logo && (
                <div style={{ marginBottom:14, padding:"10px 14px", background:LIGHT,
                  borderRadius:8, display:"flex", alignItems:"center", gap:12 }}>
                  <img src={logo.url} alt="logo" style={{ height:40, objectFit:"contain" }} />
                  <span style={{ fontSize:12, color:MUTED }}>Λογότυπο αποθηκευμένο</span>
                </div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                {[
                  ["Επωνυμία",  firm.name],
                  ["ΑΦΜ",       firm.afm],
                  ["ΔΟΥ",       firm.doy],
                  ["Διεύθυνση", firm.address],
                  ["Τηλέφωνο",  firm.phone],
                  ["Email",     firm.email],
                ].map(([l,v]) => (
                  <div key={l} style={{ background:LIGHT, borderRadius:6, padding:"8px 12px" }}>
                    <div style={{ fontSize:10, color:MUTED, textTransform:"uppercase",
                      letterSpacing:.5, marginBottom:2 }}>{l}</div>
                    <div style={{ color:NAVY, fontWeight:600, fontSize:13 }}>{v || "—"}</div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Articles template link */}
            <div style={{ background:GOLDL, border:"1px solid "+GOLD, borderRadius:10,
              padding:"16px 20px", display:"flex", justifyContent:"space-between",
              alignItems:"center" }}>
              <div>
                <div style={{ fontWeight:700, color:NAVY, marginBottom:4 }}>
                  📜 Πρότυπο Ιδιωτικού Συμφωνητικού
                </div>
                <div style={{ fontSize:12, color:MUTED }}>
                  Επεξεργασία άρθρων, σταθερού κειμένου και κλεισίματος
                </div>
              </div>
              <Btn variant="gold" onClick={() => setShowAM(true)}>✎ Επεξεργασία Άρθρων</Btn>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              {/* clients */}
              <Card>
                <div style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", marginBottom:12 }}>
                  <h3 style={{ margin:0, color:NAVY, fontSize:15 }}>
                    Πελατολόγιο ({clients.length})
                  </h3>
                  <Btn size="sm" variant="primary" onClick={() => setShowCM(true)}>+ Νέος</Btn>
                </div>
                <div style={{ maxHeight:380, overflowY:"auto",
                  display:"flex", flexDirection:"column", gap:8 }}>
                  {clients.map(c => (
                    <div key={c.id} style={{ border:"1px solid "+BORDER,
                      borderRadius:7, padding:"10px 12px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between",
                        alignItems:"flex-start" }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:13, color:NAVY }}>
                            {c.name}
                          </div>
                          <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>
                            ΑΦΜ: {c.afm} · {c.doy}
                          </div>
                          <div style={{ fontSize:11, color:MUTED }}>{c.address}</div>
                        </div>
                        <button onClick={() => setClients(p => p.filter(x => x.id !== c.id))}
                          style={{ background:"none", border:"none", color:"#FC8181",
                            cursor:"pointer", fontSize:14, marginLeft:8 }}>✕</button>
                      </div>
                      <div style={{ marginTop:6 }}>
                        <Tag color="blue">
                          {c.type === "business" ? "Επιχείρηση" : "Φυσικό Πρόσωπο"}
                        </Tag>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* packages */}
              <Card>
                <div style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", marginBottom:12 }}>
                  <h3 style={{ margin:0, color:NAVY, fontSize:15 }}>
                    Πακέτα Υπηρεσιών ({packages.length})
                  </h3>
                  <Btn size="sm" variant="primary" onClick={() => {
                    setEditingPkg(null);
                    setPf({ code:"", name:"", desc:"", price:"", vat:"24" });
                    setShowPM(true);
                  }}>+ Νέο</Btn>
                </div>
                <div style={{ maxHeight:380, overflowY:"auto",
                  display:"flex", flexDirection:"column", gap:8 }}>
                  {packages.map(p => (
                    <div key={p.id} style={{ border:"1px solid "+BORDER,
                      borderRadius:7, padding:"10px 12px" }}>
                      <div style={{ display:"flex", justifyContent:"space-between",
                        alignItems:"flex-start" }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center",
                            gap:6, marginBottom:2 }}>
                            {p.code && (
                              <span style={{ fontSize:10, fontWeight:700, color:ACCENT,
                                background:LIGHT, border:"1px solid "+ACCENT,
                                borderRadius:4, padding:"1px 6px" }}>
                                {p.code}
                              </span>
                            )}
                            <span style={{ fontWeight:700, fontSize:13, color:NAVY }}>
                              {p.name}
                            </span>
                          </div>
                          <div style={{ fontSize:11, color:MUTED }}>{p.desc}</div>
                        </div>
                        <div style={{ display:"flex", gap:4, flexShrink:0, marginLeft:8 }}>
                          <button onClick={() => startEditPkg(p)}
                            style={{ background:"none", border:"none", color:ACCENT,
                              cursor:"pointer", fontSize:14 }}>✎</button>
                          <button onClick={() => setPackages(p2 => p2.filter(x => x.id !== p.id))}
                            style={{ background:"none", border:"none", color:"#FC8181",
                              cursor:"pointer", fontSize:14 }}>✕</button>
                        </div>
                      </div>
                      <div style={{ marginTop:6 }}>
                        <Tag color="green">{p.price}€ + ΦΠΑ {p.vat}%</Tag>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {showCM && (
        <Modal title="Νέος Πελάτης" onClose={() => setShowCM(false)}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Lbl t="Επωνυμία / Ονοματεπώνυμο" req>
              <input style={inpStyle} value={cf.name}
                onChange={e => setCf({ ...cf, name:e.target.value })} />
            </Lbl>
            <Lbl t="ΑΦΜ" req>
              <input style={inpStyle} value={cf.afm}
                onChange={e => setCf({ ...cf, afm:e.target.value })} />
            </Lbl>
            <Lbl t="ΔΟΥ">
              <input style={inpStyle} value={cf.doy}
                onChange={e => setCf({ ...cf, doy:e.target.value })}
                placeholder="π.χ. ΔΟΥ Αθηνών Α΄" />
            </Lbl>
            <Lbl t="Τύπος">
              <select style={selStyle} value={cf.type}
                onChange={e => setCf({ ...cf, type:e.target.value })}>
                <option value="business">Επιχείρηση</option>
                <option value="individual">Φυσικό Πρόσωπο</option>
              </select>
            </Lbl>
            <div style={{ gridColumn:"1/-1" }}>
              <Lbl t="Διεύθυνση">
                <input style={inpStyle} value={cf.address}
                  onChange={e => setCf({ ...cf, address:e.target.value })} />
              </Lbl>
            </div>
            <Lbl t="Email">
              <input style={inpStyle} type="email" value={cf.email}
                onChange={e => setCf({ ...cf, email:e.target.value })} />
            </Lbl>
            <Lbl t="Τηλέφωνο">
              <input style={inpStyle} value={cf.phone}
                onChange={e => setCf({ ...cf, phone:e.target.value })} />
            </Lbl>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:18 }}>
            <Btn variant="ghost" onClick={() => setShowCM(false)}>Ακύρωση</Btn>
            <Btn variant="primary" onClick={addClient} disabled={!cf.name || !cf.afm}>
              Προσθήκη
            </Btn>
          </div>
        </Modal>
      )}

      {showPM && (
        <Modal
          title={editingPkg ? "Επεξεργασία Πακέτου" : "Νέο Πακέτο Υπηρεσιών"}
          onClose={() => { setShowPM(false); setEditingPkg(null); }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Lbl t="Κωδικός (π.χ. LOG-001)">
              <input style={inpStyle} value={pf.code}
                onChange={e => setPf({ ...pf, code:e.target.value })}
                placeholder="π.χ. LOG-001" />
            </Lbl>
            <Lbl t="ΦΠΑ / VAT (%)">
              <input style={inpStyle} type="number" value={pf.vat}
                onChange={e => setPf({ ...pf, vat:e.target.value })} />
            </Lbl>
            <div style={{ gridColumn:"1/-1" }}>
              <Lbl t="Τίτλος" req>
                <input style={inpStyle} value={pf.name}
                  onChange={e => setPf({ ...pf, name:e.target.value })} />
              </Lbl>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <Lbl t="Περιγραφή">
                <textarea style={{ ...inpStyle, minHeight:80, resize:"vertical" }}
                  value={pf.desc}
                  onChange={e => setPf({ ...pf, desc:e.target.value })} />
              </Lbl>
            </div>
            <Lbl t="Τιμή Net (€)">
              <input style={inpStyle} type="number" value={pf.price}
                onChange={e => setPf({ ...pf, price:e.target.value })} />
            </Lbl>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:18 }}>
            <Btn variant="ghost" onClick={() => { setShowPM(false); setEditingPkg(null); }}>
              Ακύρωση
            </Btn>
            <Btn variant="primary" onClick={savePkg} disabled={!pf.name}>
              {editingPkg ? "Αποθήκευση αλλαγών" : "Προσθήκη"}
            </Btn>
          </div>
        </Modal>
      )}

      {/* ── Articles Modal ── */}
      {showAM && (
        <Modal title="📜 Πρότυπο Ιδιωτικού Συμφωνητικού" onClose={() => setShowAM(false)} wide>
          <div style={{ marginBottom:16, padding:"10px 14px", background:LIGHT,
            borderRadius:8, fontSize:13, color:ACCENT }}>
            💡 Τα άρθρα με 🔒 συμπληρώνονται αυτόματα από τη φόρμα. Τα υπόλοιπα μπορείς να τα επεξεργαστείς ελεύθερα.
            Χρησιμοποίησε κενή γραμμή για νέα παράγραφο.
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:12, maxHeight:"60vh", overflowY:"auto", paddingRight:4 }}>
            {articles
              .filter(a => a.id !== "a-close")
              .sort((a,b) => a.order - b.order)
              .map((art, idx, arr) => (
              <div key={art.id} style={{ border:"1px solid "+BORDER, borderRadius:8, padding:14 }}>
                {/* Header row */}
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:art.type==="dynamic"?0:10 }}>
                  <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                    <button
                      disabled={idx===0}
                      onClick={() => {
                        const sorted = [...articles].filter(a=>a.id!=="a-close").sort((a,b)=>a.order-b.order);
                        const prev = sorted[idx-1];
                        setArticles(as => as.map(a => {
                          if (a.id===art.id) return {...a, order:prev.order};
                          if (a.id===prev.id) return {...a, order:art.order};
                          return a;
                        }));
                      }}
                      style={{ background:"none", border:"1px solid "+BORDER, borderRadius:3,
                        cursor:idx===0?"not-allowed":"pointer", fontSize:10, padding:"1px 5px",
                        opacity:idx===0?0.3:1, lineHeight:1 }}>▲</button>
                    <button
                      disabled={idx===arr.length-1}
                      onClick={() => {
                        const sorted = [...articles].filter(a=>a.id!=="a-close").sort((a,b)=>a.order-b.order);
                        const next = sorted[idx+1];
                        setArticles(as => as.map(a => {
                          if (a.id===art.id) return {...a, order:next.order};
                          if (a.id===next.id) return {...a, order:art.order};
                          return a;
                        }));
                      }}
                      style={{ background:"none", border:"1px solid "+BORDER, borderRadius:3,
                        cursor:idx===arr.length-1?"not-allowed":"pointer", fontSize:10,
                        padding:"1px 5px", opacity:idx===arr.length-1?0.3:1, lineHeight:1 }}>▼</button>
                  </div>

                  <div style={{ flex:1 }}>
                    {art.type === "dynamic"
                      ? <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <span style={{ fontSize:12, color:MUTED }}>🔒</span>
                          <input style={{ ...inpStyle, fontWeight:700, color:NAVY }}
                            value={art.title}
                            onChange={e => setArticles(as => as.map(a =>
                              a.id===art.id ? {...a, title:e.target.value} : a
                            ))} />
                        </div>
                      : <input style={{ ...inpStyle, fontWeight:700, color:NAVY }}
                          value={art.title}
                          onChange={e => setArticles(as => as.map(a =>
                            a.id===art.id ? {...a, title:e.target.value} : a
                          ))} />
                    }
                  </div>

                  {/* Delete button — only for non-dynamic articles */}
                  {art.type !== "dynamic" && (
                    <button onClick={() => setArticles(as => as.filter(a => a.id!==art.id))}
                      style={{ background:"none", border:"none", color:"#FC8181",
                        cursor:"pointer", fontSize:16, flexShrink:0 }}>✕</button>
                  )}
                </div>

                {/* Content */}
                {art.type === "dynamic" ? (
                  <div style={{ fontSize:12, color:MUTED, fontStyle:"italic", marginTop:6,
                    padding:"6px 10px", background:BG, borderRadius:5 }}>
                    🔒 {art.hint}
                  </div>
                ) : (
                  <textarea
                    style={{ ...inpStyle, minHeight:90, resize:"vertical", fontSize:13 }}
                    value={art.content}
                    onChange={e => setArticles(as => as.map(a =>
                      a.id===art.id ? {...a, content:e.target.value} : a
                    ))}
                    placeholder="Κείμενο άρθρου… (κενή γραμμή = νέα παράγραφος)" />
                )}
              </div>
            ))}

            {/* Closing article */}
            {articles.filter(a => a.id==="a-close").map(art => (
              <div key={art.id} style={{ border:"2px dashed "+BORDER, borderRadius:8, padding:14,
                background:"#FAFCFF" }}>
                <div style={{ fontSize:11, fontWeight:700, color:MUTED, textTransform:"uppercase",
                  letterSpacing:.5, marginBottom:8 }}>
                  ✍ ΚΛΕΙΣΙΜΟ — εμφανίζεται πριν τις υπογραφές
                </div>
                <textarea
                  style={{ ...inpStyle, minHeight:60, resize:"vertical", fontSize:13 }}
                  value={art.content}
                  onChange={e => setArticles(as => as.map(a =>
                    a.id==="a-close" ? {...a, content:e.target.value} : a
                  ))} />
              </div>
            ))}
          </div>

          {/* Add new article button */}
          <div style={{ marginTop:16, paddingTop:16, borderTop:"1px solid "+BORDER,
            display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <Btn variant="ghost" onClick={() => {
              const maxOrder = Math.max(...articles.filter(a=>a.id!=="a-close").map(a=>a.order), 0);
              setArticles(as => [...as, {
                id: "a"+Date.now(), order: maxOrder+1, type:"static",
                title: "ΝΕΑΡΘΡΟ " + (maxOrder+1) + " — ΤΙΤΛΟΣ",
                content: "", hint: "",
              }]);
            }}>
              + Προσθήκη νέου άρθρου
            </Btn>
            <div style={{ display:"flex", gap:10 }}>
              <Btn variant="danger" onClick={() => {
                if (window.confirm("Επαναφορά στις προεπιλογές;")) {
                  setArticles(ARTICLES0);
                }
              }}>↺ Επαναφορά</Btn>
              <Btn variant="primary" onClick={() => setShowAM(false)}>✓ Αποθήκευση & Κλείσιμο</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showFM && (
        <Modal title="Στοιχεία Γραφείου" onClose={() => setShowFM(false)}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Lbl t="Επωνυμία">
              <input style={inpStyle} value={ff.name}
                onChange={e => setFf({ ...ff, name:e.target.value })} />
            </Lbl>
            <Lbl t="ΑΦΜ">
              <input style={inpStyle} value={ff.afm}
                onChange={e => setFf({ ...ff, afm:e.target.value })} />
            </Lbl>
            <Lbl t="ΔΟΥ">
              <input style={inpStyle} value={ff.doy}
                onChange={e => setFf({ ...ff, doy:e.target.value })} />
            </Lbl>
            <Lbl t="Τηλέφωνο">
              <input style={inpStyle} value={ff.phone}
                onChange={e => setFf({ ...ff, phone:e.target.value })} />
            </Lbl>
            <div style={{ gridColumn:"1/-1" }}>
              <Lbl t="Διεύθυνση">
                <input style={inpStyle} value={ff.address}
                  onChange={e => setFf({ ...ff, address:e.target.value })} />
              </Lbl>
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <Lbl t="Email">
                <input style={inpStyle} value={ff.email}
                  onChange={e => setFf({ ...ff, email:e.target.value })} />
              </Lbl>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:18 }}>
            <Btn variant="ghost" onClick={() => setShowFM(false)}>Ακύρωση</Btn>
            <Btn variant="primary" onClick={() => { setFirm(ff); setShowFM(false); }}>
              Αποθήκευση
            </Btn>
          </div>
        </Modal>
      )}
    </div>
    </LoginGate>
  );
}
