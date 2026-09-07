/* ============================================================
   DONNÉES — chargement des fichiers data/*.json
   ------------------------------------------------------------
   Les textes éditoriaux et les données réseau ne vivent JAMAIS
   dans le code. Ce fichier est le seul point de contact.
   ============================================================ */

let LIGNES, JOURS, CRENEAUX_M, CRENEAUX_S, VARIANTES, PERIMETRES,
    RELANCES, ARRETS, CORPUS, TARIFS, TRAFIC, GLOSES;

async function chargerDonnees(){
  const lire = async f => {
    const r = await fetch("data/" + f, {cache:"no-store"});
    if(!r.ok) throw new Error("Impossible de lire data/" + f + " (" + r.status + ")");
    return r.json();
  };

  const [corpus, onb, reseau, tarifs] = await Promise.all([
    lire("corpus.json"), lire("onboarding.json"),
    lire("reseau.json"), lire("tarifs.json")
  ]);

  CORPUS     = corpus;
  VARIANTES  = onb.variantes;
  PERIMETRES = onb.perimetres;
  JOURS      = onb.jours;
  CRENEAUX_M = onb.creneauxMatin;
  CRENEAUX_S = onb.creneauxSoir;
  RELANCES   = onb.relances;
  LIGNES     = reseau.lignes;
  ARRETS     = reseau.arrets;
  TARIFS     = tarifs;
  TRAFIC     = tarifs.trafic;
  GLOSES     = tarifs.gloses;

  return {corpus, onb, reseau, tarifs};
}

/* Valeurs par défaut du tableau de bord, injectées dans le formulaire */
function appliquerHypotheses(){
  const h = TARIFS.hypotheses;
  const set = (id, v) => { const el = document.querySelector(id); if(el) el.value = v; };
  set("#hAb", h.abonnes);
  set("#hPe", h.perturbationsParAn);
  set("#hTp", h.prixTemplate);
  set("#hSv", h.prixService);
  set("#hNp", h.tauxNonPertinent);
}
