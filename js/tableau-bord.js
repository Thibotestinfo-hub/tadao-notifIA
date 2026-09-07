/* ==================== TABLEAU DE BORD COÛT & SOBRIÉTÉ ==================== */
/* Hypothèses de trafic par perturbation, selon le périmètre collecté.
   D1 : l'assistant doit requalifier origine + destination.
   D2 : il confirme d'un tap.
   Modifier les valeurs dans data/tarifs.json, pas ici. */
/* TRAFIC et tarifs de référence : voir data/tarifs.json */

function coutOnboarding(){
  /* mesuré si une passation existe, sinon valeurs de référence */
  const ref = TARIFS.onboardingReference;
  if(passations.length){
    const m = {};
    passations.forEach(p=>{
      m[p.bras] = m[p.bras] || {n:0, s:0};
      m[p.bras].n++; m[p.bras].s += p.msgBot;
    });
    const b = m[variante];
    if(b) return { template:1, service: Math.max(0, Math.round(b.s / b.n) - 1), mesure:true };
  }
  return Object.assign({mesure:false}, ref[variante]);
}

function euros(x){ return x.toLocaleString("fr-FR",{minimumFractionDigits:0, maximumFractionDigits:0}) + " €"; }
function nombre(x){ return Math.round(x).toLocaleString("fr-FR"); }

function rendreTdb(){
  const ab = +$("#hAb").value || 0, pe = +$("#hPe").value || 0;
  const tp = +$("#hTp").value || 0, sv = +$("#hSv").value || 0;
  const np = (+$("#hNp").value || 0) / 100;

  const onb = coutOnboarding();
  const coutOnb = ab * (onb.template * tp + onb.service * sv);

  const parAn = d => {
    const t = TRAFIC[d];
    const msgs = ab * pe * (t.template + t.service);
    return { msgs, cout: ab * pe * (t.template * tp + t.service * sv), octets: ab * pe * t.octets };
  };
  const a1 = parAn("D1"), a2 = parAn("D2");
  const actif = perimetre === "D1" ? a1 : a2;
  const gain = a1.cout - a2.cout;

  const gaspillage = actif.cout * np;
  const msgGaspilles = actif.msgs * np;

  $("#tdb").innerHTML = `
    <div class="sep-titre">Mise en service</div>
    <div class="ligne-res"><span>Onboarding ${variante}${onb.mesure ? " (mesuré)" : " (référence)"}</span>
      <span class="val">${euros(coutOnb)}</span></div>
    <div class="ligne-res"><span>${onb.template + onb.service} message(s) par abonné</span>
      <span class="val">${nombre(ab * (onb.template + onb.service))}</span></div>

    <div class="sep-titre">Exploitation annuelle · périmètre ${perimetre}</div>
    <div class="ligne-res fort"><span>Coût annuel</span><span class="val">${euros(actif.cout)}</span></div>
    <div class="ligne-res"><span>Messages / an</span><span class="val">${nombre(actif.msgs)}</span></div>
    <div class="ligne-res"><span>Par perturbation</span>
      <span class="val" style="font-size:13px;font-weight:400;color:var(--texte-faible)">${TRAFIC[perimetre].note}</span></div>
    <div class="ligne-res ${gain > 0 ? "gain" : ""}"><span>Écart D1 → D2</span>
      <span class="val">${gain >= 0 ? "−" : "+"} ${euros(Math.abs(gain))} / an</span></div>

    <div class="sep-titre">Sobriété</div>
    <div class="ligne-res"><span>Volume transmis / an</span>
      <span class="val">${nombre(actif.octets / 1e6)} Mo</span></div>
    <div class="ligne-res"><span>Terminaux sollicités / an</span><span class="val">${nombre(actif.msgs)}</span></div>
    <div class="ligne-res"><span>Messages sans valeur d'usage</span>
      <span class="val" style="color:var(--rouge)">${nombre(msgGaspilles)}</span></div>
    <div class="ligne-res"><span>Coût de la non-pertinence</span>
      <span class="val" style="color:var(--rouge)">${euros(gaspillage)}</span></div>`;
}

["hAb","hPe","hTp","hSv","hNp"].forEach(id=>{
  const el = $("#" + id);
  if(el) el.addEventListener("input", rendreTdb);
});

/* recalcul quand le contexte change */
const _rendreListeVar = rendreListeVar;
rendreListeVar = function(){ _rendreListeVar(); rendreTdb(); };
const _rendrePassations = rendrePassations;
rendrePassations = function(){ _rendrePassations(); rendreTdb(); };


