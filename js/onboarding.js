/* ============================================================
   ONBOARDING — état de passation et logique métier
   Constantes fournies par js/donnees.js (data/*.json).
   Aucun accès au DOM ici : ce fichier est testable isolément.
   ============================================================ */

/* ---------- état de passation ---------- */
let ONB = null;

function profilVide(){
  return { lignes:[], sens:null, jours:["lun","mar","mer","jeu","ven"],
           creneauM:null, creneauS:null, montee:null, descente:null,
           retourDifferent:false, monteeR:null, descenteR:null };
}

function onbInit(variante, perimetre){
  ONB = { variante, perimetre, profil:profilVide(),
    t0:null, tFin:null, interactions:0, msgBot:0, msgUser:0,
    corrections:0, relances:0, fil:[], termine:false, abandon:false, flowEnvoye:false };
}
function onbChrono(){ return ONB && ONB.t0 ? Math.round(((ONB.tFin || Date.now()) - ONB.t0)/1000) : 0; }
function onbTop(){ if(ONB && !ONB.t0) ONB.t0 = Date.now(); }
function pousse(qui, txt){
  ONB.fil.push({qui, txt});
  if(qui === "in") ONB.msgBot++; else ONB.msgUser++;
}

function arretsDispo(lignes){
  const s = new Set();
  lignes.forEach(l => (ARRETS[l] || []).forEach(a => s.add(a)));
  return [...s].sort();
}

/* ---------- V1 : extraction déterministe (volontairement sans LLM) ---------- */
function extrait(txt, p, perimetre){
  const t = txt.toLowerCase();

  (t.match(/\b\d{1,3}\b/g) || [])
    .filter(n => LIGNES.some(l => l.n === n))
    .forEach(n => { if(!p.lignes.includes(n)) p.lignes.push(n); });

  /* CORRECTIF : « les deux », « aller-retour », « matin et soir » */
  const lesDeux = /les deux|tous les deux|aller.?retour|matin et soir|soir et matin|^deux$/.test(t.trim());
  const matin = /matin|aller|le boulot|au travail|prise de poste/.test(t);
  const soir  = /soir|retour|rentr|apr[èe]s.?midi/.test(t);
  if(lesDeux || (matin && soir)) p.sens = "les-deux";
  else if(matin) p.sens = "matin";
  else if(soir)  p.sens = "soir";

  if(/semaine|lundi au vendredi|lun.*ven|jours ouvr/.test(t))
    p.jours = ["lun","mar","mer","jeu","ven"];
  if(/tous les jours|7j|week.?end/.test(t))
    p.jours = JOURS.map(j=>j.k);

  const h = t.match(/(\d{1,2})\s*[h:](\d{2})?/);
  if(h){
    const hh = parseInt(h[1],10) + (h[2] ? parseInt(h[2],10)/60 : 0);
    const matinal = hh < 12;
    const tbl = matinal ? CRENEAUX_M : CRENEAUX_S;
    const seuils = matinal ? [5.5,6.5,7.5,8.5,9.5] : [13,15,17,19,21];
    let i = seuils.findIndex(s => hh < s);
    p[matinal ? "creneauM" : "creneauS"] = tbl[i < 0 ? tbl.length-1 : i];
  }

  if(perimetre === "D2"){
    arretsDispo(p.lignes).forEach(a=>{
      const nom = a.split(" (")[0].toLowerCase();
      if(nom.length > 3 && t.includes(nom)){
        if(!p.montee) p.montee = a;
        else if(!p.descente && p.montee !== a) p.descente = a;
      }
    });
  }
  return p;
}

function manque(p, perimetre){
  const m = [];
  if(!p.lignes.length) m.push("lignes");
  if(!p.sens) m.push("sens");
  if(p.sens && p.sens !== "soir" && !p.creneauM) m.push("creneauM");
  if(p.sens === "soir" && !p.creneauS) m.push("creneauS");
  if(p.sens === "les-deux" && !p.creneauS) m.push("creneauS");
  if(perimetre === "D2"){
    if(!p.montee) m.push("montee");
    if(!p.descente) m.push("descente");
  }
  return m;
}

/* Les libellés de relance sont dans data/onboarding.json (clé "relances"). */


function libelleSens(s){
  return {matin:"Le matin", soir:"Le soir", "les-deux":"Matin et soir"}[s] || "—";
}
