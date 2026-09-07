/* ============================================================
   APP — point d'entrée
   Charge les données, puis démarre la console.
   ============================================================ */

async function demarrer(){
  try {
    await chargerDonnees();
  } catch(e){
    document.body.insertAdjacentHTML("afterbegin",
      `<div style="background:#5E3E36;color:#F3D9CF;padding:14px 18px;border-radius:3px;
        margin-bottom:16px;font-size:14px;line-height:1.5">
        <strong>Données non chargées.</strong> ${e.message}<br>
        Cette console lit <code>data/*.json</code> : elle doit être servie en HTTP,
        pas ouverte en <code>file://</code>.<br>
        Lancez <code>python3 -m http.server 8000</code> à la racine du projet,
        puis ouvrez <code>http://localhost:8000</code>.<br>
        Pour un atelier hors ligne, utilisez le fichier autonome produit par
        <code>python3 tools/build.py</code>.
      </div>`);
    return;
  }

  appliquerHypotheses();
  rendreListeVar();
  onbInit(variante, perimetre);
  rendreFilOnb();
  majMesures();
  rendreListeSeq();
  rendreSeq();
  rendreTdb();
}

document.addEventListener("DOMContentLoaded", demarrer);
