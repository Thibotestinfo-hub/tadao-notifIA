# Corridor réel — extrait du NeTEx TADAO du 03/08/2026

Ce document remplace le décor inventé du corpus. **Tous les horaires, arrêts, directions et couleurs de lignes ci-dessous sont issus des données ouvertes de TADAO**, pas de mon invention.

---

## Ce que contient votre fichier

Ce n'est pas du GTFS mais du **NeTEx** (le format français, plus riche). Volumétrie après parsing :

| | |
|---|---|
| Lignes | 58 |
| Quais | 2 506 |
| Arrêts logiques | 1 369 |
| Courses horodatées | 2 765 |
| Villes principales | Bruay-la-Buissière (141 quais), Lens (138), Liévin (122), Hénin-Beaumont (115), Béthune (87) |

**Un point à corriger dans le corpus :** l'identifiant interne d'une ligne n'est pas son numéro commercial. La ligne 12 est dans `line_8.xml`, la 15 dans `line_9.xml`. Attention si vous manipulez les fichiers à la main.

---

## Le corridor retenu

**Agent hospitalier en poste du matin — Liévin → Centre hospitalier de Lens**

C'est le meilleur candidat trouvé : la cible est exactement votre segment (horaires postés, prise de poste impérative), et la coupure de la ligne habituelle ouvre un vrai arbitrage entre deux alternatives qui ne se dominent pas.

### Trajet habituel

Prise de poste **6h30**. Départ de l'arrêt **Nauticaa (Liévin)**, quai 3.

| | |
|---|---|
| **Ligne 13** (bleu `#0099ff`) | direction Lens — Van Pelt |
| Départ Nauticaa quai 3 | **5h46** (suivants : 6h16, 6h44) |
| Arrivée I.U.T (Lens) | **6h10** |
| Marche | 3 mn (197 m) jusqu'à Hôpital Ouest |
| **Arrivée** | **6h13** — 17 mn de marge |

La ligne 13 passe toutes les 30 minutes le matin. C'est un point important : **la perdre coûte cher**, ce qui rend la perturbation crédible.

### Perturbation simulée : ligne 13 interrompue

Deux alternatives réelles, calculées sur les horaires du lundi.

**Option 1 — vous êtes à l'heure**

| | |
|---|---|
| **Ligne 1** (rouge `#b61f21`) | direction Noyelles-Godault — Europe |
| Nauticaa quai 2 | **6h03** (suivants : 6h18, 6h33) |
| Arrivée Bollaert Delelis | 6h15 |
| Marche | 2 mn (140 m) jusqu'à Faculté Jean Perrin |
| **Ligne 3** (orange `#ea621c`) | direction Vendin-le-Vieil — Lens 2 |
| Départ 6h19 → **Hôpital** | **6h21** |

→ 1 correspondance, 140 m de marche, **9 mn de marge avant la prise de poste**

**Option 2 — moins de marche, mais vous êtes en retard**

| | |
|---|---|
| **Ligne 1** | direction Noyelles-Godault — Europe |
| Nauticaa quai 2 | **6h03** |
| Arrivée Parc Louvre-Lens quai 2 | 6h13 |
| Marche | 1 mn (58 m) jusqu'au quai 4 |
| **Ligne 41** (violet `#7e3275`) | direction Lens — Béhal-Jean Zay |
| Départ 6h26 → **Hôpital Ouest** | **6h39** |

→ 1 correspondance, 58 m de marche, **9 mn de retard**

**Pourquoi ce couple est bon pour le test.** Les deux options partent du même bus (ligne 1 de 6h03) et divergent à la correspondance. Le voyageur arbitre donc entre *marcher 140 m et arriver à l'heure* ou *marcher 58 m et arriver en retard*. C'est exactement l'arbitrage que le FG2 n'a pas tranché — et cette fois il porte sur des données vraies.

---

## Corridor de secours

**Liévin Nauticaa → Lens Van Pelt**, si vous voulez un second bras ou un corridor sans enjeu hospitalier.

- Habituel : ligne 13, Nauticaa quai 3 à **5h46** → Van Pelt **6h20**, direct, aucune marche
- Alternative A : ligne 1 à 6h03 → Pont de Douai 6h21, puis 3 mn de marche (243 m) → **6h25**, un seul bus
- Alternative B : ligne 1 à 6h03 → Parc Louvre-Lens 6h13, correspondance ligne 41 à 6h28 → **6h41**, 3 m de marche

Ici l'arbitrage est encore plus net : **+5 mn en marchant** contre **+21 mn sans marcher**. C'est le corridor idéal si vous voulez tester spécifiquement la contrainte « je ne veux pas marcher ».

---

## Le calculateur

Les quatre scripts joints reconstruisent tout depuis l'archive NeTEx.

| Fichier | Rôle |
|---|---|
| `parse_netex.py` | Lecture du NeTEx : arrêts, lignes, parcours, calendriers |
| `build_index.py` | Construit `reseau.json` — 2 765 courses horodatées |
| `router.py` | Calculateur d'itinéraires (RAPTOR simplifié) |
| `corridors.py` | Sélection automatique de corridors adaptés au test |

Le calculateur accepte les contraintes dont nous parlions :

```python
itineraires(depart, arrivee, t0,
            marche_max_m=200,        # « je ne veux pas marcher »
            corresp_max=1,           # « pas plus d'un changement »
            lignes_exclues=('13',),  # la ligne perturbée
            n=3)
```

C'est la démonstration concrète de l'architecture que je recommandais : **le moteur calcule, il ne dit jamais rien de faux.** Le rôle du LLM se limite à traduire « je ne veux pas marcher » en `marche_max_m=200`, puis à reformuler le résultat selon votre charte. Un cahier des charges peut spécifier ces trois tâches sans ambiguïté.

Une nuance honnête sur ce que j'ai construit : la marche est calculée à vol d'oiseau à 4,3 km/h, pas sur le réseau piéton réel. C'est suffisant pour écrire des alternatives crédibles, insuffisant pour un service en production — c'est là que Navitia ou OpenTripPlanner, qui intègrent OpenStreetMap, prennent le relais.

---

## Sur le GTFS-RT

Vous mentionnez que TADAO en publie un. C'est une bonne nouvelle pour le pilote, mais **ne le branchez pas pour le prochain focus group** : vos perturbations sont fictives et déclenchées à la main, un flux temps réel n'apporterait rien au test tout en ajoutant une dépendance. En revanche, notez-le dans le cahier des charges : l'existence du flux conditionne la faisabilité de la notification proactive réelle, et c'est un argument fort pour le passage à l'échelle.

---

## Ce qu'il reste à vérifier avec l'exploitant

Les données ouvertes ne disent pas tout. Trois points à faire confirmer par TADAO avant le test :

1. **La marche I.U.T → Hôpital Ouest** (197 m). À vol d'oiseau. Vérifier qu'il n'y a pas de coupure urbaine.
2. **Le quai 3 de Nauticaa** est celui de la ligne 13 en direction de Lens. Confirmer que c'est bien lisible sur place — vos participants s'y rendront peut-être.
3. **La correspondance Bollaert Delelis → Faculté Jean Perrin** (140 m, 4 mn entre les deux bus). C'est serré. Un exploitant saura dire si elle tient en pratique.
