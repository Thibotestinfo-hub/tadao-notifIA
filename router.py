#!/usr/bin/env python3
"""Calculateur d'itinéraires TADAO : RAPTOR simplifié, avec contraintes paramétrables.

Démontre l'architecture recommandée : le moteur calcule, le LLM ne fait que
traduire la contrainte en paramètres puis reformuler le résultat.
"""
import json, math, heapq
from collections import defaultdict

R = json.load(open('/home/claude/reseau.json'))
STOPS, COURSES = R['stops'], R['courses']
VITESSE_MARCHE = 1.2  # m/s (~4,3 km/h)

def hhmm(s):
    if s is None: return None
    s = int(s) % 86400
    return f"{s//3600:02d}h{(s%3600)//60:02d}"

def dist_m(a, b):
    Rt = 6371000
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dp, dl = p2 - p1, math.radians(b[1] - a[1])
    x = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2 * Rt * math.asin(math.sqrt(x))

# ---------- index ----------
PAR_ARRET = defaultdict(list)
for i, c in enumerate(COURSES):
    for k, s in enumerate(c['seq']):
        PAR_ARRET[s['q']].append((i, k))

# correspondances piétonnes précalculées (rayon 500 m)
_GRID = defaultdict(list)
for qid, s in STOPS.items():
    if s['lat'] is None: continue
    _GRID[(round(s['lat'], 2), round(s['lon'], 2))].append(qid)

def voisins(qid, rayon=500):
    s = STOPS[qid]
    if s['lat'] is None: return []
    out = []
    for dla in (-0.01, 0, 0.01):
        for dlo in (-0.01, 0, 0.01):
            for o in _GRID.get((round(s['lat']+dla, 2), round(s['lon']+dlo, 2)), []):
                if o == qid: continue
                d = dist_m((s['lat'], s['lon']), (STOPS[o]['lat'], STOPS[o]['lon']))
                if d <= rayon:
                    out.append((o, d))
    return out

def cherche(qid_nom, ville=None):
    """Retrouve les quais par nom d'arrêt (et ville optionnelle)."""
    r = []
    for qid, s in STOPS.items():
        if qid_nom.lower() in (s['nom'] or '').lower():
            if ville is None or (s['ville'] or '').lower().startswith(ville.lower()):
                r.append(qid)
    return r

# ---------- moteur ----------
def itineraires(depart_quais, arrivee_quais, t0, jour='Monday',
                marche_max_m=800, corresp_max=1, lignes_exclues=(), n=3):
    """Renvoie jusqu'à n itinéraires, triés par heure d'arrivée.

    marche_max_m   : distance piétonne totale acceptée
    corresp_max    : nombre de changements autorisés
    lignes_exclues : codes de lignes à ne pas emprunter (ligne perturbée)
    """
    dep = set(depart_quais); arr = set(arrivee_quais)
    # état : (heure_arrivée, quai) -> meilleur chemin
    best = {}
    resultats = []
    # file : (heure, quai, nb_corresp, marche_cumulée, trajet)
    pile = []
    for q in dep:
        heapq.heappush(pile, (t0, q, 0, 0, []))
        best[(q, 0)] = t0
    # marche initiale possible
    for q in list(dep):
        for o, d in voisins(q, min(marche_max_m, 800)):
            t = t0 + int(d / VITESSE_MARCHE)
            if best.get((o, 0), 1e9) > t:
                best[(o, 0)] = t
                heapq.heappush(pile, (t, o, 0, int(d),
                                      [{'mode': 'marche', 'de': q, 'a': o, 'm': int(d),
                                        'min': round(d/VITESSE_MARCHE/60)}]))

    vus = 0
    while pile and vus < 400000:
        t, q, nc, marche, chemin = heapq.heappop(pile)
        vus += 1
        if q in arr:
            resultats.append({'arrivee': t, 'corresp': nc, 'marche_m': marche, 'chemin': chemin})
            if len(resultats) >= n * 6: break
            continue
        if nc > corresp_max: continue

        # embarquer sur une course
        for (ci, ki) in PAR_ARRET.get(q, []):
            c = COURSES[ci]
            if c['ligne'] in lignes_exclues: continue
            if jour and c['jours'] and jour not in c['jours']: continue
            s = c['seq'][ki]
            dpt = s['dep'] or s['arr']
            if dpt is None or dpt < t or dpt > t + 3600: continue
            for kj in range(ki + 1, len(c['seq'])):
                sj = c['seq'][kj]
                ta = sj['arr'] or sj['dep']
                if ta is None: continue
                cle = (sj['q'], nc + 1)
                if best.get(cle, 1e9) <= ta: continue
                best[cle] = ta
                seg = {'mode': 'bus', 'ligne': c['ligne'], 'dest': c['dest'],
                       'de': q, 'a': sj['q'], 'dep': dpt, 'arr': ta}
                heapq.heappush(pile, (ta, sj['q'], nc + 1, marche, chemin + [seg]))

        # marche de correspondance
        if chemin and chemin[-1]['mode'] == 'bus':
            for o, d in voisins(q, 600):
                if marche + d > marche_max_m: continue
                t2 = t + int(d / VITESSE_MARCHE) + 60
                cle = (o, nc)
                if best.get(cle, 1e9) <= t2: continue
                best[cle] = t2
                heapq.heappush(pile, (t2, o, nc, marche + int(d),
                                      chemin + [{'mode': 'marche', 'de': q, 'a': o,
                                                 'm': int(d), 'min': round(d/VITESSE_MARCHE/60)}]))

    resultats.sort(key=lambda r: (r['arrivee'], r['corresp'], r['marche_m']))
    # dédoublonnage par signature de lignes
    vu, out = set(), []
    for r in resultats:
        sig = tuple(s['ligne'] for s in r['chemin'] if s['mode'] == 'bus')
        # deux segments consécutifs sur la même ligne = même course scindée
        if any(sig[i] == sig[i+1] for i in range(len(sig)-1)): continue
        if sig in vu or not sig: continue
        vu.add(sig); out.append(r)
        if len(out) >= n: break
    return out

def affiche(r):
    l = [f"  Arrivée {hhmm(r['arrivee'])} · {r['corresp']} corresp. · {r['marche_m']} m de marche"]
    for s in r['chemin']:
        if s['mode'] == 'marche':
            l.append(f"    🚶 {s['min']} mn ({s['m']} m) : {STOPS[s['de']]['nom']} → {STOPS[s['a']]['nom']}")
        else:
            l.append(f"    🚌 L{s['ligne']} → {s['dest']}")
            l.append(f"       {STOPS[s['de']]['nom']} ({STOPS[s['de']]['ville']}) {hhmm(s['dep'])}"
                     f" → {STOPS[s['a']]['nom']} ({STOPS[s['a']]['ville']}) {hhmm(s['arr'])}")
    return "\n".join(l)
