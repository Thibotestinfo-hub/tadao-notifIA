# Console d'animation — Assistant mobilité dynamique

Banc de test pour l'expérimentation « notification + interaction » sur le réseau TADAO.
Sert à faire vivre à des voyageurs, en focus group, une expérience de perturbation
au plus près du réel, et à en tirer un cahier des charges.

**Lire `CLAUDE.md` avant toute modification** : il contient les arbitrages déjà faits,
la charte éditoriale et les règles à ne pas casser.

## Lancer

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

La console lit `data/*.json` par `fetch` : elle ne fonctionne pas en `file://`.

## Fichier autonome pour l'atelier

```bash
python3 tools/build.py
# → dist/console.html — un seul fichier, ouvrable d'un double-clic
```

## Modifier les textes

Tout ce qu'un voyageur lit est dans `data/corpus.json` (séquences S0–S4) et
`data/onboarding.json` (variantes d'inscription). Aucun texte éditorial ne doit
vivre dans le code.

## Régénérer les données réseau

Depuis une archive NeTEx TADAO téléchargée sur transport.data.gouv.fr :

```bash
python3 tools/parse_netex.py     # inventaire
python3 tools/build_index.py     # → reseau.json (2 765 courses)
python3 tools/corridors.py       # sélection de corridors de test
```

`tools/router.py` calcule des itinéraires avec contraintes
(`marche_max_m`, `corresp_max`, `lignes_exclues`).
