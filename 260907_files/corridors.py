#!/usr/bin/env python3
"""Sélectionne des corridors domicile-travail qui font de bons scénarios de test :
une ligne directe habituelle, et au moins deux alternatives réelles si on la coupe."""
from router import *

# Pôles d'emploi / destinations plausibles en horaires postés
CIBLES = [
    ('Lens', 'Hôpital'), ('Lens', 'Gares'), ('Lens', 'Van Pelt'),
    ('Béthune', 'Cité Cheminots'), ('Beuvry', 'Hôpital'),
    ('Bruay-la-Buissière', 'Europe'), ('Hénin-Beaumont', 'Espace Lumière'),
    ('Noyelles-Godault', 'Europe'), ('Liévin', 'Site du 11/19'),
]
ORIGINES = [
    ('Liévin', 'Nauticaa'), ('Liévin', 'Université'), ('Avion', 'Lebas'),
    ('Angres', 'Caumont'), ('Grenay', 'Guadeloupe'), ('Carvin', 'Eglise'),
    ('Barlin', 'Mairie'), ('Houdain', 'Poste'), ('Vermelles', 'Marignane'),
    ('Wingles', 'Lycée Voltaire'), ('Hersin-Coupigny', 'Tirtaine'),
    ('Noeux-les-Mines', 'Gare'), ('Auchel', 'Anatole France'),
]

def quais(ville, nom):
    return [q for q in cherche(nom, ville)]

def evalue(o, c, t0=5*3600+15*60):
    dq, aq = quais(*o), quais(*c)
    if not dq or not aq: return None
    base = itineraires(dq, aq, t0, marche_max_m=900, corresp_max=1, n=2)
    if not base: return None
    principal = base[0]
    lignes = [s['ligne'] for s in principal['chemin'] if s['mode'] == 'bus']
    if len(lignes) != 1: return None          # on veut un direct comme trajet habituel
    ligne = lignes[0]
    alt = itineraires(dq, aq, t0, marche_max_m=1200, corresp_max=2,
                      lignes_exclues=(ligne,), n=3)
    if len(alt) < 2: return None
    retard = alt[0]['arrivee'] - principal['arrivee']
    if not (5*60 <= retard <= 45*60): return None   # écart exploitable
    return {'origine': o, 'cible': c, 'ligne': ligne,
            'principal': principal, 'alternatives': alt, 'retard': retard}

if __name__ == '__main__':
    trouves = []
    for o in ORIGINES:
        for c in CIBLES:
            if o[0] == c[0]: continue
            try:
                r = evalue(o, c)
            except Exception:
                continue
            if r: trouves.append(r)
    trouves.sort(key=lambda r: (len(r['alternatives']) * -1, r['retard']))
    print(f"{len(trouves)} corridors exploitables\n")
    for r in trouves[:8]:
        o, c = r['origine'], r['cible']
        print("=" * 66)
        print(f"{o[1]} ({o[0]})  →  {c[1]} ({c[0]})")
        print(f"Trajet habituel : ligne {r['ligne']} · arrivée {hhmm(r['principal']['arrivee'])}")
        print(affiche(r['principal']))
        print(f"--- si la ligne {r['ligne']} est coupée : {len(r['alternatives'])} alternatives"
              f" · premier retard +{r['retard']//60} mn")
        for a in r['alternatives']:
            print(affiche(a)); print()
