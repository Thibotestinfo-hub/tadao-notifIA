#!/usr/bin/env python3
"""Construit un index réseau TADAO complet à partir du NeTEx, sauvegardé en JSON."""
import re, glob, os, json, math
from collections import defaultdict
import xml.etree.ElementTree as ET
from parse_netex import parse_stops, parse_daytypes, parse_line, D

def hms(t):
    if not t: return None
    p = t.split(':')
    return int(p[0]) * 3600 + int(p[1]) * 60 + int(p[2] if len(p) > 2 else 0)

def hhmm(s):
    if s is None: return None
    s = s % 86400
    return f"{s//3600:02d}h{(s%3600)//60:02d}"

def dist_m(a, b):
    R = 6371000
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dp = p2 - p1
    dl = math.radians(b[1] - a[1])
    x = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2 * R * math.asin(math.sqrt(x))

def main():
    stops = parse_stops()
    daytypes = parse_daytypes()

    courses = []          # toutes les courses avec horaires
    lignes = {}
    files = sorted(glob.glob(os.path.join(D, 'line_*.xml')),
                   key=lambda x: int(re.findall(r'\d+', os.path.basename(x))[0]))
    for f in files:
        d = parse_line(f, stops)
        code = d['ligne']['code']
        lignes[code] = {'code': code, 'couleur': d['ligne']['couleur']}
        # spjp -> quay
        spjp2quay = {}
        for jpid, jp in d['jps'].items():
            for s in jp['seq']:
                spjp2quay[s['spjp']] = s['quay']
        for c in d['courses']:
            jp = d['jps'].get(c['jp'])
            if not jp: continue
            route = d['routes'].get(jp['route'], {})
            seq = []
            for p in c['pts']:
                q = spjp2quay.get(p['spjp'])
                if not q: continue
                seq.append({'q': q, 'arr': hms(p['arr']), 'dep': hms(p['dep'])})
            if len(seq) < 2: continue
            jours = set()
            for dtr in c['daytypes']:
                jours |= set(daytypes.get(dtr, {}).get('jours', []))
            courses.append({
                'ligne': code,
                'dest': route.get('nom'),
                'sens': route.get('sens'),
                'jours': sorted(jours),
                'seq': seq,
            })

    # index arrêt -> courses
    par_arret = defaultdict(list)
    for i, c in enumerate(courses):
        for k, s in enumerate(c['seq']):
            par_arret[s['q']].append((i, k))

    # regroupement des quais par nom+ville (un "arrêt logique")
    logique = defaultdict(list)
    for qid, s in stops.items():
        if s['lat'] is None: continue
        logique[(s['ville'], s['nom'])].append(qid)

    print(f"Courses      : {len(courses)}")
    print(f"Quais servis : {len(par_arret)} / {len(stops)}")
    print(f"Arrêts logiques : {len(logique)}")

    json.dump({'stops': stops, 'courses': courses, 'lignes': lignes},
              open('/home/claude/reseau.json', 'w'), ensure_ascii=False)
    print("-> /home/claude/reseau.json")

if __name__ == '__main__':
    main()
