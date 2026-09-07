# CLAUDE.md — Assistant mobilité dynamique

Contexte de projet pour toute session Claude Code sur ce dépôt. **À lire avant toute modification.**

---

## 1. De quoi il s'agit

Dispositif d'information voyageur proactive pour le réseau **TADAO** (secteur de Lens, exploitant Transdev). Deux blocs fonctionnels :

- **Notification** — le voyageur est prévenu d'une perturbation sur ses lignes, sans avoir rien à consulter.
- **Interaction** — un assistant conversationnel lui propose une alternative en quelques échanges.

Canaux : SMS et WhatsApp. **Volontairement pas d'application.**

**Cible** : les *commuters* à trajet domicile-travail routinier, peu utilisateurs d'apps de trip-planning, qui subissent donc le plus les perturbations. Segment critique : les emplois **postés**, avec horaires impératifs.

**Logique inversée assumée** : « tout va bien tant qu'on ne m'informe pas », au lieu d'aller vérifier sur une app.

**Ce dépôt n'est pas le produit.** C'est le **banc de test** qui sert à éprouver les partis-pris auprès de voyageurs réels, en focus group, afin de rédiger un cahier des charges pour un prestataire. Rien ici n'a vocation à partir en production.

---

## 2. Le pivot du projet

> L'avantage sur un trip-planner n'est ni le canal, ni l'IA : **c'est que le système sait déjà où va la personne.**

Une conversation est structurellement plus lente qu'un formulaire — le test de l'app tierce Ally l'a démontré : qualifier une adresse en conversation prend plus de temps que la taper. Le dispositif ne gagne que si le contexte est pré-établi à l'inscription et **confirmé d'un tap**, jamais redemandé.

Toute proposition qui reviendrait à faire re-saisir origine et destination à chaque perturbation contredit le projet.

---

## 3. Architecture — la règle qui ne se négocie pas

**Le LLM ne calcule jamais un itinéraire.** Il a exactement trois tâches :

1. traduire une contrainte en langage naturel en paramètres moteur (« je ne veux pas marcher » → `marche_max_m=200`) ;
2. appeler le calculateur ;
3. reformuler le résultat selon la charte éditoriale.

**Corollaire** : tout ce qui peut être déterministe sort de la zone générative — template d'alerte, onboarding, horaires, sélection des destinataires. La surface générative doit rester la plus étroite possible. C'est ce qui rend le dispositif spécifiable, auditable et opposable à un prestataire.

Un cahier des charges ne spécifie pas des phrases en sortie de LLM. Il spécifie des **invariants vérifiables** (§4) et un **jeu de tests d'acceptation**.

---

## 4. Charte éditoriale — invariants

Issus du Focus Group II (Lens, 15/06/2026). **Acquis : ne pas les remettre en test.** Ils s'appliquent à toutes les variantes.

| # | Règle |
|---|---|
| 1 | Toute proposition de trajet affiche une **heure d'arrivée à destination**. Sans exception. |
| 2 | L'assistant se **déclare automatique dès le premier message**, pas au troisième. |
| 3 | Tout message porteur d'info trafic porte une **mention de fraîcheur** (« mis à jour à 4h46 »). |
| 4 | Une ligne n'est **jamais citée sans sa direction**, avec sa couleur réseau si le canal le permet. |
| 5 | Un horaire de passage est **toujours accompagné du suivant**. |
| 6 | **Aucun renvoi vers l'application TADAO**, jamais. |
| 7 | Renvoi carto tierce **uniquement pour le guidage piéton**, après autorisation donnée à l'inscription. |
| 8 | **Questions fermées** à réponse courte, jamais de question ouverte. |
| 9 | **Sobriété** : un message = une idée. Le réflexe d'exhaustivité du LLM est l'ennemi principal. |
| 10 | Pour un abonné, la destination est **présumée connue** : on confirme, on ne demande pas. |

### Segmentation fonctionnelle
- **Prévenance J-1** → la notification se suffit. Le voyageur a le temps de se débrouiller ; l'interaction est superflue voire intrusive.
- **Perturbation impromptue** → notification + interaction.
- **Reprise du trafic** → message court, contrepartie indispensable du contrat de silence.

### Onboarding
- Le **Flow collecte**, la conversation **accueille, promet et restitue**.
- On collecte les **arrêts** (montée/descente) : amorti en ~6 semaines face au coût des requalifications.
- Le **retour est le trajet inverse par défaut**, avec une case de dérogation.
- **Créneau du soir distinct** de celui du matin.
- **Pas de tableau horaire par jour** : l'onboarding collecte la règle, pas les exceptions. Le créneau large absorbe la variance.
- **Pas de création de compte** : le numéro de téléphone suffit.

---

## 5. Structure du dépôt

```
index.html              coquille — aucune donnée, aucun texte éditorial
assets/styles.css       styles (console sombre, téléphone clair)
data/
  corpus.json           ← LES TEXTES. Séquences S0–S4 et blocs de variantes
  onboarding.json       ← variantes V1–V3, périmètres D1–D2, créneaux, relances
  reseau.json           lignes + couleurs officielles, arrêts par ligne (NeTEx)
  tarifs.json           hypothèses de coût, trafic par périmètre, gloses A/B/C
js/
  donnees.js            seul point de contact avec data/ — charge et expose
  onboarding.js         logique métier, AUCUN accès DOM (testable isolément)
  console.js            rendu et interactions
  tableau-bord.js       coût et sobriété
  app.js                point d'entrée
tools/
  build.py              → dist/console.html (fichier autonome pour les ateliers)
  parse_netex.py        lecture du NeTEx TADAO
  build_index.py        → reseau complet, 2 765 courses horodatées
  router.py             calculateur d'itinéraires avec contraintes
  corridors.py          sélection automatique de corridors de test
docs/                   corpus éditorial, corridor réel
```

### Lancer
```bash
python3 -m http.server 8000     # puis http://localhost:8000
python3 tools/build.py          # fichier autonome pour l'atelier
```

La console lit `data/*.json` par `fetch` : elle ne fonctionne **pas** en `file://`. Le fichier construit dans `dist/` sert aux ateliers, où il faut pouvoir ouvrir d'un double-clic sans serveur.

---

## 6. Conventions

**Le code en français.** Noms de variables, fonctions, commentaires. Le projet est relu par des non-développeurs.

**Aucun texte éditorial dans le code.** Toute phrase vue par un voyageur vit dans `data/corpus.json` ou `data/onboarding.json`. Si vous devez écrire une chaîne de caractères destinée à un utilisateur final dans un fichier `.js`, c'est le signe qu'elle est au mauvais endroit.

**Aucune donnée réseau en dur.** Lignes, couleurs, arrêts, horaires viennent du NeTEx via `tools/`. Ne jamais inventer un arrêt ou un horaire : les participants connaissent leur réseau, une donnée fausse fait décrocher sur le fond et détruit le signal sur la forme.

**Pas de `localStorage`.** L'état vit en mémoire.

**Pas de framework, pas de bundler.** Scripts classiques, globals partagés, chargés dans l'ordre déclaré par `index.html`. C'est délibéré : le projet doit rester lisible et modifiable par quelqu'un qui n'est pas développeur.

**Rendu générique.** Le téléphone imite les conventions d'une messagerie sans reproduire une interface identifiable. Ne pas ajouter de logo WhatsApp ni de couleur de marque exacte.

**Accessibilité.** `aria-pressed` sur les bascules, `prefers-reduced-motion` respecté, focus visible.

---

## 7. Le protocole de test — à ne pas casser

Ce qui est mesuré compte autant que ce qui est affiché.

- **Bras inter-sujets, jamais intra-sujets** sur l'onboarding et sur la variable B : l'effet d'apprentissage rend les mesures inexploitables si la même personne joue deux bras.
- **Comparaison en choix forcé au débriefing** pour les variables A et C, après le vécu.
- **Mesures comportementales** avant le déclaratif : temps de complétion, point d'abandon, nombre de relances et de corrections, taux de poursuite après l'invite.
- **Le livrable le plus précieux est le corpus des messages entrants** — ce que les voyageurs écrivent spontanément. C'est ce qui permettra à un prestataire de calibrer un agent.

### Les variables ouvertes

| Var. | Question | Modalités |
|---|---|---|
| **A** | Formulation de l'arrivée | A1 horaire absolu · A2 retard relatif · A3 réassurance quantifiée |
| **B** | Confirmation intermédiaire | B1 récapitulatif · B2 une ligne · B3 supprimée |
| **C** | Niveau de prudence | C1 affirmatif · C2 réserve explicite |
| **V** | Forme de l'onboarding | V1 conversationnelle · V2 Flow justifié · V3 Flow sec |
| **D** | Périmètre collecté | D1 minimal · D2 trajet complet (avec arrêts) |

Le parseur de V1 est **déterministe, pas un LLM**. C'est délibéré : il mesure le coût du format conversationnel, pas la finesse de compréhension d'un modèle. Ne pas le remplacer par un appel LLM sans en discuter — cela changerait la nature de la mesure.

---

## 8. Contraintes externes à ne pas oublier

**WhatsApp.** Un message à l'initiative de l'entreprise hors fenêtre de conversation exige un **template pré-approuvé par Meta**. Chaque variante d'alerte = un template à soumettre. Les textes doivent être figés avant soumission. Depuis juillet 2025 la facturation est au message ; au 1er octobre 2026, les messages de service dans la fenêtre perdent leur gratuité.

**SMS France.** Charte AF2M en vigueur depuis le 1er mars 2026 : émetteur alphanumérique de 11 caractères maximum, strictement alphanumérique, déclaration obligatoire auprès des opérateurs. `TADAOALERT` tient, `TADAO Alerte` non.

**RCS.** C'est la cible produit : marque vérifiée et logo dans la messagerie native, sans application. Validation de l'agent en 1 à 4 semaines. À inscrire au cahier des charges, pas à brancher pour le test.

**iOS et push web.** Fonctionne uniquement pour une web app **installée sur l'écran d'accueil** ; un onglet Safari n'y a pas accès. Aucune autorisation Apple n'est requise, mais l'installation est une friction majeure qui contredit le principe « sans app ». Contrairement à ce qu'affirment plusieurs documentations périmées, **le web push fonctionne dans l'UE** : Apple a fait machine arrière le 1er mars 2024.

**RGPD.** Numéro + lignes + horaires + arrêts = profil de déplacement, donc quasi-localisation. Consentement explicite, finalité limitée, conservation courte, suppression effective. Le DPO doit voir le dossier — s'y prendre tôt.

---

## 9. Sobriété

Ne pas construire d'indicateur en grammes de CO2e par message : les facteurs qui circulent sont mal documentés et l'ADEME a retiré son évaluation par email en 2022. Un tableau de bord bâti dessus serait contestable.

Utiliser des **indicateurs proxy** liés aux choix de conception : messages par abonné et par perturbation, volume transmis, terminaux sollicités, et surtout **taux de notifications non pertinentes** — une alerte envoyée à quelqu'un que ça ne concerne pas, c'est un impact sans valeur d'usage.

Référentiel de rattachement : **RGESN 2024** (Arcep/Arcom/ADEME, loi REEN, 79 critères, outil d'autoévaluation gratuit).

> La sobriété du dispositif et sa qualité UX sont le même objectif. Un message de moins, c'est un coût de moins, un impact de moins, et un abonné qui ne se désabonne pas.

---

## 10. État et prochaines étapes

### Fait
Charte éditoriale · corpus des 5 séquences · corridor réel extrait du NeTEx · calculateur d'itinéraires · console à deux onglets avec instrumentation et export CSV · tableau de bord coût et sobriété.

### En attente de décision
- Existe-t-il un **canal d'inscription en SMS pur**, pour les voyageurs sans smartphone identifiés au FG2 ? Si oui, l'onboarding conversationnel redevient obligatoire pour eux.
- **Compte WhatsApp Business réel** ou pas — commande le calendrier (délai d'approbation des templates).
- Amendement des textes du corpus avec le binôme.
- Grille d'entretien du focus group.

### À faire valider par l'exploitant
Marche I.U.T → Hôpital Ouest (197 m, calculés à vol d'oiseau) · quai 3 de Nauticaa · correspondance de 4 minutes à Bollaert Delelis.

### Risque de validité n°1
**Les travailleurs postés étaient quasi absents du FG2** (6 employés/ouvriers sur 30 participants). Recruter par les employeurs, pas par appel volontaire — sinon on teste la solution sur l'exact opposé de la cible.

### Non traité
Message de non-pertinence (jamais écrit, alors que c'est le risque n°1 identifié par les participants) · dispositif de collecte du corpus entrant · bras PWA/push web · **le cahier des charges lui-même**, qui est la finalité de tout ce travail.

### Limite connue du calculateur
La marche est calculée à vol d'oiseau à 4,3 km/h, pas sur le réseau piéton. Suffisant pour écrire des alternatives crédibles, insuffisant en production — Navitia ou OpenTripPlanner prendront le relais.

---

## 11. Ce qu'il ne faut pas faire

- Inventer un arrêt, une ligne ou un horaire.
- Écrire un texte destiné au voyageur ailleurs que dans `data/`.
- Faire re-saisir origine et destination à chaque perturbation.
- Élargir la surface générative sans nécessité.
- Renvoyer vers l'application TADAO.
- Remplacer le parseur déterministe de V1 par un LLM sans en discuter.
- Construire un indicateur d'impact en gCO2e par message.
- Ajouter du framework, du bundler ou du `localStorage`.
