/* ============================================================
   CONSOLE — rendu et interactions (onboarding + séquences)
   Dépend de : js/donnees.js, js/onboarding.js
   ============================================================ */

const $ = s=>document.querySelector(s);
const esc = s=>s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

/* ==================== ONGLETS ==================== */
function mode(m){
  const onb = m==="onb";
  $("#ongOnb").setAttribute("aria-selected", onb);
  $("#ongSeq").setAttribute("aria-selected", !onb);
  $("#vueOnb").classList.toggle("cache", !onb);
  $("#vueSeq").classList.toggle("cache", onb);
}
$("#ongOnb").onclick = ()=>mode("onb");
$("#ongSeq").onclick = ()=>mode("seq");

/* ==================== ONBOARDING ==================== */
let variante = "V2";
let perimetre = "D2";
let passations = [];
let profilCollecte = null;
let tick = null;

var rendreListeVar = function(){
  $("#listeVar").innerHTML = Object.values(VARIANTES).map(v=>
    `<button class="seq" data-v="${v.id}" aria-pressed="${v.id===variante}">
      <span class="code">${v.id}</span><span class="nom">${v.nom}</span></button>`).join("");
  $("#listePer").innerHTML = Object.values(PERIMETRES).map(p=>
    `<button class="seq" data-p="${p.id}" aria-pressed="${p.id===perimetre}">
      <span class="code">${p.id}</span><span class="nom">${p.nom}</span></button>`).join("");
  $("#noteVar").innerHTML = VARIANTES[variante].resume +
    '<br><br><strong>Périmètre ' + perimetre + '</strong> — ' + PERIMETRES[perimetre].resume;
};

function chrono(){
  const s = onbChrono();
  $("#chrono").textContent = `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;
  $("#mTemps").textContent = s || "—";
}

function majMesures(){
  if(!ONB) return;
  $("#mInter").textContent = ONB.interactions;
  $("#mBot").textContent = ONB.msgBot;
  $("#mUser").textContent = ONB.msgUser;
  const p = ONB.profil;
  const li = (ok,t)=>`<div class="${ok?'ok':'ko'}">${ok?'●':'○'} ${t}</div>`;
  $("#suiviChamps").innerHTML =
    li(p.lignes.length, "Lignes" + (p.lignes.length ? " : " + p.lignes.join(", ") : "")) +
    li(p.sens, "Sens" + (p.sens ? " : " + libelleSens(p.sens) : "")) +
    li(p.jours.length, "Jours : " + p.jours.length + "/7") +
    li(p.creneauM || p.creneauS, "Créneau" + (p.creneauM ? " M : " + p.creneauM : "") + (p.creneauS ? " · S : " + p.creneauS : "")) +
    (ONB.perimetre === "D2" ? li(p.montee, "Montée" + (p.montee ? " : " + p.montee.split(" (")[0] : "")) +
      li(p.descente, "Descente" + (p.descente ? " : " + p.descente.split(" (")[0] : "")) +
      (p.retourDifferent ? '<div class="ok">● Retour différent déclaré</div>' : "") : "") +
    (ONB.relances ? `<div style="color:var(--rouge)">↺ ${ONB.relances} relance(s)</div>` : "") +
    (ONB.corrections ? `<div style="color:var(--rouge)">✎ ${ONB.corrections} correction(s)</div>` : "");
  chrono();
}

function rendreFilOnb(){
  const f = $("#filOnb");
  f.innerHTML = ONB.fil.map(m=>{
    if(m.qui === "flow") return flowHTML();
    return `<div class="bulle ${m.qui}">${esc(m.txt)}<button class="copier" data-txt="${esc(m.txt)}">Copier</button></div>`;
  }).join("");
  f.scrollTop = f.scrollHeight;
  const chat = VARIANTES[ONB.variante].type === "chat";
  $("#saisieOnb").style.display = chat ? "flex" : "none";
  $("#entree").disabled = ONB.termine || !ONB.t0;
  $("#envoyer").disabled = ONB.termine || !ONB.t0;
}

function flowHTML(){
  const v = VARIANTES[ONB.variante], p = ONB.profil, j = v.justif;
  const arrets = ONB.perimetre === "D2" ? arretsDispo(p.lignes) : [];
  if(ONB.flowEnvoye) return `<div class="bulle out">Formulaire complété ✓</div>`;
  const pq = t => j ? `<div class="pourquoi">${t}</div>` : "";
  const opts = (sel) => `<option value="">Choisir…</option>` +
    arrets.map(a=>`<option ${sel===a?"selected":""}>${esc(a)}</option>`).join("");
  const besoinS = p.sens === "soir" || p.sens === "les-deux";
  const besoinM = p.sens === "matin" || p.sens === "les-deux";

  return `<div class="flowcard" id="flowcard">
    <h3>Vos trajets habituels</h3>
    <div class="intro">Ces informations servent uniquement à vous alerter. Vous pouvez les modifier à tout moment.</div>

    <div class="champ">
      <div class="lab">Vos lignes</div>
      ${pq("Pour ne vous alerter que sur les lignes qui vous concernent.")}
      <div class="grilleL">${LIGNES.map(l=>
        `<button class="puce" data-l="${l.n}" style="background:#${l.c}" aria-pressed="${p.lignes.includes(l.n)}">${l.n}</button>`).join("")}</div>
    </div>

    <div class="champ">
      <div class="lab">Quand voyagez-vous ?</div>
      ${pq("Pour ne pas vous écrire à un moment où vous ne voyagez pas.")}
      <div class="chips">${[["matin","Le matin"],["soir","Le soir"],["les-deux","Matin et soir"]].map(([k,l])=>
        `<button class="chip" data-sens="${k}" aria-pressed="${p.sens===k}">${l}</button>`).join("")}</div>
    </div>

    <div class="champ">
      <div class="lab">Vos jours</div>
      ${pq("Pour rester silencieux les jours où vous ne prenez pas le bus.")}
      <div class="chips">${JOURS.map(d=>
        `<button class="chip" data-j="${d.k}" aria-pressed="${p.jours.includes(d.k)}">${d.l}</button>`).join("")}</div>
    </div>

    ${besoinM ? `<div class="champ">
      <div class="lab">Votre départ le matin</div>
      ${pq("Pour vous prévenir avant que vous ne partiez, pas après.")}
      <select data-cr="creneauM">${["<option value=''>Choisir…</option>"].concat(
        CRENEAUX_M.map(c=>`<option ${p.creneauM===c?"selected":""}>${c}</option>`)).join("")}</select>
    </div>` : ""}

    ${besoinS ? `<div class="champ">
      <div class="lab">Votre départ le soir</div>
      ${pq("Le retour n'a pas les mêmes horaires que l'aller.")}
      <select data-cr="creneauS">${["<option value=''>Choisir…</option>"].concat(
        CRENEAUX_S.map(c=>`<option ${p.creneauS===c?"selected":""}>${c}</option>`)).join("")}</select>
    </div>` : ""}

    ${ONB.perimetre === "D2" ? `
    <div class="champ">
      <div class="lab">Votre arrêt de montée</div>
      ${pq("Pour vous proposer une alternative depuis là où vous êtes, sans avoir à vous le redemander.")}
      <select data-ar="montee" ${arrets.length?"":"disabled"}>${arrets.length?opts(p.montee):"<option>Choisissez d'abord vos lignes</option>"}</select>
    </div>
    <div class="champ">
      <div class="lab">Votre arrêt de descente</div>
      ${pq("Pour calculer votre heure d'arrivée — l'information que vous avez placée en premier.")}
      <select data-ar="descente" ${arrets.length?"":"disabled"}>${arrets.length?opts(p.descente):"<option>Choisissez d'abord vos lignes</option>"}</select>
    </div>
    ${p.sens === "les-deux" ? `<div class="champ">
      <div class="chips"><button class="chip" data-retour="1" aria-pressed="${p.retourDifferent}">Mon retour n'est pas le trajet inverse</button></div>
      ${p.retourDifferent ? `
        <div style="margin-top:8px">
          <div class="lab" style="font-size:12.5px">Retour · montée</div>
          <select data-ar="monteeR">${opts(p.monteeR)}</select>
          <div class="lab" style="font-size:12.5px;margin-top:7px">Retour · descente</div>
          <select data-ar="descenteR">${opts(p.descenteR)}</select>
        </div>` : `<div class="pourquoi" style="margin-top:5px">Par défaut, votre retour est le trajet inverse.</div>`}
    </div>` : ""}` : ""}

    <button class="envoyer" id="envoyerFlow" ${manque(p, ONB.perimetre).length ? "disabled" : ""}>Valider</button>
  </div>`;
}

function lancerOnb(){
  onbInit(variante, perimetre);
  const v = VARIANTES[variante];
  pousse("in", v.accueil);
  if(v.type === "flow"){ ONB.fil.push({qui:"flow"}); }
  onbTop();
  if(tick) clearInterval(tick);
  tick = setInterval(()=>{ if(ONB && !ONB.termine) chrono(); }, 1000);
  rendreFilOnb(); majMesures();
  $("#ctxOnb").textContent = "passation en cours · " + v.nom;
}

function finirOnb(){
  ONB.termine = true; ONB.tFin = Date.now();
  if(tick) clearInterval(tick);
  const p = ONB.profil;
  let r = "Voilà ce que j'ai retenu :\n\n🚌 Lignes : " + p.lignes.join(", ") +
    "\n🕐 " + libelleSens(p.sens) +
    (p.creneauM ? "\n   ▸ départ matin : " + p.creneauM : "") +
    (p.creneauS ? "\n   ▸ départ soir : " + p.creneauS : "") +
    "\n📅 " + p.jours.length + " jour(s) par semaine";
  if(ONB.perimetre === "D2" && p.montee)
    r += "\n📍 " + p.montee.split(" (")[0] + " → " + (p.descente||"").split(" (")[0] +
         (p.sens === "les-deux" ? (p.retourDifferent ? "\n📍 Retour : " +
            (p.monteeR||"").split(" (")[0] + " → " + (p.descenteR||"").split(" (")[0]
            : "\n📍 Retour : trajet inverse") : "");
  r += "\n\nUne erreur ? Répondez MODIFIER.";
  pousse("in", r);
  pousse("in", "Deux commandes à retenir :\n\n⏸ PAUSE — je me tais pendant vos congés\n🛑 STOP — je ne vous écris plus du tout\n\nJe ne vous écrirai qu'en cas de perturbation. Bonne route 👋");
  profilCollecte = JSON.parse(JSON.stringify(p));
  profilCollecte._perimetre = ONB.perimetre;
  majProfilActif();
  rendreFilOnb(); majMesures();
  $("#ctxOnb").textContent = "passation terminée";
}

function majProfilActif(){
  const el = $("#profilActif");
  if(!profilCollecte){ el.textContent = "Aucun profil collecté. Les séquences utilisent le corridor par défaut."; return; }
  const p = profilCollecte;
  el.innerHTML = `<strong>Lignes ${p.lignes.join(", ")}</strong> · ${libelleSens(p.sens).toLowerCase()}` +
    (p.creneauM ? ` · ${p.creneauM}` : "") + ` · ${p.jours.length} j/sem.` +
    (p.montee ? `<br>${esc(p.montee.split(" (")[0])} → ${esc((p.descente||"").split(" (")[0])}` : "") +
    `<br><span style="color:var(--ambre)">Périmètre ${p._perimetre}</span> — ` +
    (p._perimetre === "D2"
      ? "l'assistant confirme d'un tap."
      : "l'assistant devra redemander origine et destination.");
}

/* --- V1 : traitement d'un message voyageur --- */
function repondreV1(txt){
  ONB.interactions++;
  pousse("out", txt);
  const avant = JSON.stringify(ONB.profil);
  extrait(txt, ONB.profil, ONB.perimetre);
  if(JSON.stringify(ONB.profil) === avant) ONB.corrections++;
  const m = manque(ONB.profil, ONB.perimetre);
  if(m.length === 0){ rendreFilOnb(); majMesures(); setTimeout(finirOnb, 320); return; }
  ONB.relances++;
  pousse("in", RELANCES[m[0]]);
  rendreFilOnb(); majMesures();
}

/* --- passations --- */
function enregistrer(){
  if(!ONB || !ONB.t0){ return; }
  const id = $("#ident").value.trim() || "P-" + (passations.length + 1);
  passations.push({
    id, bras: ONB.variante, perimetre: ONB.perimetre, secondes: onbChrono(),
    interactions: ONB.interactions, msgBot: ONB.msgBot, msgUser: ONB.msgUser,
    relances: ONB.relances, corrections: ONB.corrections,
    complet: ONB.termine, abandon: ONB.abandon,
    lignes: ONB.profil.lignes.join("|")
  });
  $("#ident").value = "";
  rendrePassations();
}

var rendrePassations = function(){
  const c = $("#tablePassations");
  if(!passations.length){ c.innerHTML = '<p class="vide">Aucune passation enregistrée.</p>'; return; }
  c.innerHTML = `<table class="passations">
    <tr><th>ID</th><th>Bras</th><th>Sec.</th><th>Msg.</th><th>État</th></tr>
    ${passations.map(p=>`<tr><td>${esc(p.id)}</td><td>${p.bras}·${p.perimetre}</td><td>${p.secondes}</td>
      <td>${p.msgBot + p.msgUser}</td>
      <td style="color:${p.abandon?'var(--rouge)':(p.complet?'var(--vert)':'var(--texte-faible)')}">
      ${p.abandon?"abandon":(p.complet?"complet":"partiel")}</td></tr>`).join("")}
  </table>`;
};

/* --- événements onboarding --- */
document.addEventListener("click", ev=>{
  const v = ev.target.closest("#listeVar .seq");
  if(v){ variante = v.dataset.v; rendreListeVar();
    if(ONB && !ONB.termine){ onbInit(variante, perimetre); rendreFilOnb(); majMesures();
      $("#ctxOnb").textContent = "chronomètre de passation"; $("#chrono").textContent = "0:00"; }
    return; }

  const pb = ev.target.closest("#listePer .seq");
  if(pb){ perimetre = pb.dataset.p; rendreListeVar();
    if(ONB && !ONB.termine){ onbInit(variante, perimetre); rendreFilOnb(); majMesures();
      $("#ctxOnb").textContent = "chronomètre de passation"; $("#chrono").textContent = "0:00"; }
    return; }

  const rt = ev.target.closest("[data-retour]");
  if(rt && ONB){ onbTop(); ONB.interactions++;
    ONB.profil.retourDifferent = !ONB.profil.retourDifferent;
    rendreFilOnb(); majMesures(); return; }

  const puce = ev.target.closest(".puce");
  if(puce && ONB){ onbTop(); ONB.interactions++;
    const n = puce.dataset.l, arr = ONB.profil.lignes, i = arr.indexOf(n);
    if(i >= 0){ arr.splice(i,1); ONB.corrections++; } else arr.push(n);
    rendreFilOnb(); majMesures(); return; }

  const cs = ev.target.closest("[data-sens]");
  if(cs && ONB){ onbTop(); ONB.interactions++;
    if(ONB.profil.sens) ONB.corrections++;
    ONB.profil.sens = cs.dataset.sens; rendreFilOnb(); majMesures(); return; }

  const cj = ev.target.closest("[data-j]");
  if(cj && ONB){ onbTop(); ONB.interactions++; ONB.corrections++;
    const k = cj.dataset.j, arr = ONB.profil.jours, i = arr.indexOf(k);
    if(i >= 0) arr.splice(i,1); else arr.push(k);
    rendreFilOnb(); majMesures(); return; }

  if(ev.target.id === "envoyerFlow" && ONB){
    ONB.interactions++; ONB.flowEnvoye = true; finirOnb(); return; }

  const cop = ev.target.closest(".copier");
  if(cop){ navigator.clipboard.writeText(cop.dataset.txt
      .replace(/&quot;/g,'"').replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&"));
    cop.textContent = "Copié"; setTimeout(()=>cop.textContent = "Copier", 1100);
    ev.stopPropagation(); return; }
});

document.addEventListener("change", ev=>{
  if(!ONB) return;
  const cr = ev.target.dataset ? ev.target.dataset.cr : null;
  const ar = ev.target.dataset ? ev.target.dataset.ar : null;
  const champ = cr || ar;
  if(!champ) return;
  onbTop(); ONB.interactions++;
  if(ONB.profil[champ]) ONB.corrections++;
  ONB.profil[champ] = ev.target.value || null;
  rendreFilOnb(); majMesures();
});

$("#lancerOnb").onclick = lancerOnb;
$("#resetOnb").onclick = ()=>{ onbInit(variante, perimetre); if(tick) clearInterval(tick);
  $("#chrono").textContent = "0:00"; $("#ctxOnb").textContent = "chronomètre de passation";
  rendreFilOnb(); majMesures(); };
$("#abandonOnb").onclick = ()=>{ if(!ONB || !ONB.t0) return;
  ONB.abandon = true; ONB.termine = true; ONB.tFin = Date.now();
  if(tick) clearInterval(tick);
  $("#ctxOnb").textContent = "abandon marqué"; rendreFilOnb(); majMesures(); };
$("#enregistrer").onclick = enregistrer;

$("#envoyer").onclick = ()=>{
  const t = $("#entree").value.trim();
  if(!t || !ONB || ONB.termine) return;
  $("#entree").value = ""; repondreV1(t);
};
$("#entree").addEventListener("keydown", e=>{ if(e.key === "Enter") $("#envoyer").click(); });

$("#exportOnb").onclick = ()=>{
  const head = "id,bras,perimetre,secondes,interactions,msg_assistant,msg_voyageur,relances,corrections,complet,abandon,lignes";
  const csv = [head].concat(passations.map(p=>
    [p.id,p.bras,p.perimetre,p.secondes,p.interactions,p.msgBot,p.msgUser,p.relances,p.corrections,
     p.complet?1:0,p.abandon?1:0,p.lignes].join(","))).join("\n");
  navigator.clipboard.writeText(csv);
  $("#exportOnb").textContent = "CSV copié";
  setTimeout(()=>$("#exportOnb").textContent = "Exporter en CSV", 1200);
};

/* ==================== SÉQUENCES ==================== */
let etat = {seq:2, A:"A3", B:"B3", C:"C1", canal:"wa", pas:0};
const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{20E3}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}]/gu;

function substitue(txt, seq){
  return txt.replace(/\{\{([A-C])\}\}/g,(_,k)=>(seq.blocs[k] && seq.blocs[k][etat[k]]) || "");
}
function versSms(txt){
  return txt.replace(/━+/g,"").replace(EMOJI,"")
    .split("\n").map(l=>l.replace(/[ \t]+/g," ").trim()).join("\n")
    .replace(/\n{3,}/g,"\n\n").trim();
}
const segments = n => n<=160 ? 1 : Math.ceil(n/153);

function etapesActives(){
  return CORPUS[etat.seq].etapes.filter(e=>
    !e.si || Object.entries(e.si).every(([k,v])=>v.includes(etat[k])));
}
function texteDe(e){
  if(etat.canal === "sms") return e.sms ? e.sms : versSms(substitue(e.txt, CORPUS[etat.seq]));
  return substitue(e.txt, CORPUS[etat.seq]);
}
function rendreListeSeq(){
  $("#listeSeq").innerHTML = CORPUS.map((s,i)=>
    `<button class="seq" data-i="${i}" aria-pressed="${i===etat.seq}">
      <span class="code">${s.id}</span><span class="nom">${s.nom}</span></button>`).join("");
}
function rendreHorloge(t){
  const h = $("#horloge");
  if(h.textContent === t) return;
  h.textContent = t; h.classList.remove("bat"); void h.offsetWidth; h.classList.add("bat");
}
function rendreSeq(){
  const seq = CORPUS[etat.seq], actives = etapesActives();
  etat.pas = Math.min(etat.pas, actives.length);
  document.querySelectorAll("#listeSeq .seq").forEach(b=>
    b.setAttribute("aria-pressed", +b.dataset.i === etat.seq));
  $("#noteSeq").innerHTML = seq.note;
  $("#contexte").textContent = seq.contexte;
  $("#etatTel").textContent = etat.canal === "sms" ? "SMS · 36xxx" : "assistant automatique";

  const fil = $("#fil");
  fil.className = "fil" + (etat.canal === "sms" ? " sms" : "");
  fil.innerHTML = actives.slice(0, etat.pas).map(e=>{
    const t = texteDe(e);
    return `<div class="bulle ${e.c}">${esc(t)}<button class="copier" data-txt="${esc(t)}">Copier</button><div class="tampon">${e.t.replace(":","h")}</div></div>`;
  }).join("");
  fil.scrollTop = fil.scrollHeight;

  rendreHorloge(etat.pas > 0 ? actives[etat.pas-1].t.replace(":","h") : "—");
  $("#compteur").textContent = `${etat.pas} / ${actives.length}`;
  $("#suivant").disabled = etat.pas >= actives.length;
  $("#suivant").textContent = etat.pas === 0 ? "Lancer" : "Message suivant";

  ["A","B","C"].forEach(k=>{
    $("#glose"+k).textContent = GLOSES[k][etat[k]];
    const utilisee = k === "B" ? seq.etapes.some(e=>e.si && e.si.B) : seq.blocs[k];
    document.querySelectorAll(`.choix[data-var="${k}"] button`).forEach(b=>{
      b.setAttribute("aria-pressed", b.dataset.val === etat[k]);
      b.style.opacity = utilisee ? 1 : .32;
      b.title = utilisee ? "" : "Sans effet sur cette séquence";
    });
  });
  rendreCout(actives);
}
function rendreCout(actives){
  const seq = CORPUS[etat.seq];
  let total = 0, seg = 0, emojis = 0, pertes = [];
  actives.forEach(e=>{
    const riche = substitue(e.txt, seq), brut = e.sms ? e.sms : versSms(riche);
    emojis += (riche.match(EMOJI) || []).length;
    total += brut.length; seg += segments(brut.length);
    if(e.perte) pertes.push(e.perte);
  });
  if(/━/.test(actives.map(e=>e.txt).join("")))
    pertes.push("Les séparateurs et la hiérarchie visuelle des options disparaissent.");
  $("#cout").innerHTML = `
    <div><span class="chiffre">${seg}</span> <span class="unite">SMS</span>
    &nbsp;·&nbsp; <span class="chiffre">${total}</span> <span class="unite">caractères</span></div>
    <ul><li>${emojis} pictogramme${emojis>1?"s":""} perdu${emojis>1?"s":""}</li>
    <li>Gras et indentation perdus</li>
    ${pertes.map(p=>`<li class="perte">${p}</li>`).join("")}</ul>`;
}

document.addEventListener("click", ev=>{
  const s = ev.target.closest("#listeSeq .seq");
  if(s){ etat.seq = +s.dataset.i; etat.pas = 0; rendreSeq(); return; }
  const vb = ev.target.closest(".choix[data-var] button");
  if(vb){ etat[vb.parentElement.dataset.var] = vb.dataset.val;
    etat.pas = Math.min(etat.pas, etapesActives().length); rendreSeq(); return; }
  const cb = ev.target.closest("#canal button");
  if(cb){ etat.canal = cb.dataset.canal;
    document.querySelectorAll("#canal button").forEach(b=>b.setAttribute("aria-pressed", b === cb));
    rendreSeq(); return; }
});
$("#suivant").onclick = ()=>{ if(etat.pas < etapesActives().length){ etat.pas++; rendreSeq(); } };
$("#rejouer").onclick = ()=>{ etat.pas = 0; rendreSeq(); };
$("#toutCopier").onclick = e=>{
  const txt = etapesActives().map(s=>`[${s.c === "in" ? "ASSISTANT" : "VOYAGEUR"} ${s.t}]\n${texteDe(s)}`).join("\n\n———\n\n");
  navigator.clipboard.writeText(txt);
  e.target.textContent = "Copié"; setTimeout(()=>e.target.textContent = "Tout copier", 1100);
};
document.addEventListener("keydown", ev=>{
  if($("#vueSeq").classList.contains("cache")) return;
  if(ev.target.tagName === "INPUT") return;
  if(ev.key === "ArrowRight" && etat.pas < etapesActives().length){ etat.pas++; rendreSeq(); }
  if(ev.key === "ArrowLeft" && etat.pas > 0){ etat.pas--; rendreSeq(); }
});

