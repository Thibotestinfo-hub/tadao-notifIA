#!/usr/bin/env python3
"""Produit dist/console.html : un fichier unique, autonome, sans dépendance réseau
autre que les polices Google.

Pourquoi : en atelier, la console doit s'ouvrir d'un double-clic sur le portable
d'un animateur, sans serveur local. Le développement se fait sur les fichiers
séparés ; le build sert uniquement à la passation.

    python3 tools/build.py
    → dist/console.html
"""
import json, pathlib, re, sys

RACINE = pathlib.Path(__file__).resolve().parent.parent
DIST = RACINE / "dist"

def lire(p):
    return (RACINE / p).read_text(encoding="utf-8")

def main():
    html = lire("index.html")
    css = lire("assets/styles.css")

    # données inlinées : chargerDonnees() est remplacé par une version synchrone
    data = {n: json.loads(lire(f"data/{n}.json"))
            for n in ("corpus", "onboarding", "reseau", "tarifs")}

    js_modules = "\n".join(lire(f"js/{m}.js")
                           for m in ("donnees", "onboarding", "console", "tableau-bord", "app"))

    # neutraliser le fetch : on injecte les données en dur
    injection = ("const DONNEES_INLINE = " + json.dumps(data, ensure_ascii=False) + ";\n")
    js_modules = js_modules.replace(
        'const r = await fetch("data/" + f, {cache:"no-store"});\n'
        '    if(!r.ok) throw new Error("Impossible de lire data/" + f + " (" + r.status + ")");\n'
        '    return r.json();',
        'return DONNEES_INLINE[f.replace(".json","")];')

    if "DONNEES_INLINE[f" not in js_modules:
        sys.exit("Le motif de fetch n'a pas été trouvé dans js/donnees.js — "
                 "adaptez tools/build.py si vous avez modifié le chargeur.")

    # remplacer les balises externes par le contenu inliné
    html = html.replace('<link rel="stylesheet" href="assets/styles.css">',
                        "<style>\n" + css + "\n</style>")
    html = re.sub(r'\n<script src="js/[^"]+"></script>', "", html)
    html = html.replace("</body>",
                        "<script>\n" + injection + js_modules + "\n</script>\n</body>")

    DIST.mkdir(exist_ok=True)
    sortie = DIST / "console.html"
    sortie.write_text(html, encoding="utf-8")
    print(f"→ {sortie.relative_to(RACINE)} ({sortie.stat().st_size // 1024} ko)")

if __name__ == "__main__":
    main()
