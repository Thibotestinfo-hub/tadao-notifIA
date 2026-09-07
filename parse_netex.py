#!/usr/bin/env python3
"""Parse l'export NeTEx TADAO -> structures Python exploitables."""
import re, glob, json, os
from collections import defaultdict
import xml.etree.ElementTree as ET

NS = {'n': 'http://www.netex.org.uk/netex'}
D = '/home/claude/netex'

def txt(el, tag):
    x = el.find('n:' + tag, NS)
    return x.text if x is not None else None

# ---------- ARRETS ----------
def parse_stops():
    stops = {}
    tree = ET.parse(os.path.join(D, 'stop.xml'))
    for q in tree.iter('{http://www.netex.org.uk/netex}Quay'):
        qid = q.get('id')
        cent = q.find('.//n:Centroid/n:Location', NS)
        addr = q.find('n:PostalAddress', NS)
        stops[qid] = {
            'id': qid,
            'nom': txt(q, 'Name'),
            'lat': float(txt(cent, 'Latitude')) if cent is not None else None,
            'lon': float(txt(cent, 'Longitude')) if cent is not None else None,
            'ville': txt(addr, 'Town') if addr is not None else None,
            'adresse': txt(addr, 'AddressLine1') if addr is not None else None,
        }
    return stops

# ---------- CALENDRIERS ----------
def parse_daytypes():
    dt = {}
    tree = ET.parse(os.path.join(D, 'resource.xml'))
    for d in tree.iter('{http://www.netex.org.uk/netex}DayType'):
        jours = [p.text for p in d.findall('.//n:DaysOfWeek', NS)]
        # DaysOfWeek peut contenir "Monday Tuesday ..." ou un seul
        flat = []
        for j in jours:
            flat += (j or '').split()
        dt[d.get('id')] = {'nom': txt(d, 'Name'), 'jours': flat}
    return dt

# ---------- LIGNES ----------
def parse_line(path, stops):
    tree = ET.parse(path)
    root = tree.getroot()

    ligne_el = root.find('.//n:Line', NS)
    ligne = {
        'id': ligne_el.get('id'),
        'code': txt(ligne_el, 'PublicCode') or txt(ligne_el, 'Name'),
        'couleur': None, 'mode': txt(ligne_el, 'TransportMode'),
    }
    pres = ligne_el.find('n:Presentation', NS)
    if pres is not None:
        ligne['couleur'] = txt(pres, 'Colour')

    # ScheduledStopPoint -> Quay
    ssp2quay = {}
    for psa in root.iter('{http://www.netex.org.uk/netex}PassengerStopAssignment'):
        s = psa.find('n:ScheduledStopPointRef', NS)
        q = psa.find('n:QuayRef', NS)
        if s is not None and q is not None:
            ssp2quay[s.get('ref')] = q.get('ref')

    # Routes : nom + direction
    routes = {}
    for r in root.iter('{http://www.netex.org.uk/netex}Route'):
        routes[r.get('id')] = {'nom': txt(r, 'Name'), 'sens': txt(r, 'DirectionType')}

    # JourneyPatterns : séquence d'arrêts
    jps = {}
    for jp in root.iter('{http://www.netex.org.uk/netex}ServiceJourneyPattern'):
        rref = jp.find('n:RouteRef', NS)
        seq = []
        for sp in jp.findall('.//n:StopPointInJourneyPattern', NS):
            sref = sp.find('n:ScheduledStopPointRef', NS)
            if sref is not None:
                seq.append(sp.get('id'))
        # ordre par attribut order
        pts = sorted(jp.findall('.//n:StopPointInJourneyPattern', NS),
                     key=lambda e: int(e.get('order') or 0))
        seq = []
        for p in pts:
            sref = p.find('n:ScheduledStopPointRef', NS)
            seq.append({'spjp': p.get('id'),
                        'quay': ssp2quay.get(sref.get('ref')) if sref is not None else None})
        dest = jp.find('n:DestinationDisplayRef', NS)
        jps[jp.get('id')] = {
            'route': rref.get('ref') if rref is not None else None,
            'seq': seq,
        }

    # DestinationDisplay
    dests = {}
    for dd in root.iter('{http://www.netex.org.uk/netex}DestinationDisplay'):
        dests[dd.get('id')] = txt(dd, 'FrontText')

    # ServiceJourneys : horaires
    courses = []
    for sj in root.iter('{http://www.netex.org.uk/netex}ServiceJourney'):
        jpref = sj.find('n:JourneyPatternRef', NS)
        dtrefs = [x.get('ref') for x in sj.findall('.//n:DayTypeRef', NS)]
        pts = []
        for tpt in sj.findall('.//n:TimetabledPassingTime', NS):
            ref = tpt.find('n:StopPointInJourneyPatternRef', NS)
            pts.append({
                'spjp': ref.get('ref') if ref is not None else None,
                'arr': txt(tpt, 'ArrivalTime'),
                'dep': txt(tpt, 'DepartureTime'),
            })
        courses.append({
            'id': sj.get('id'),
            'jp': jpref.get('ref') if jpref is not None else None,
            'daytypes': dtrefs,
            'pts': pts,
        })

    return {'ligne': ligne, 'routes': routes, 'jps': jps, 'dests': dests, 'courses': courses}

if __name__ == '__main__':
    stops = parse_stops()
    dt = parse_daytypes()
    print(f"Arrêts (quais) : {len(stops)}")
    print(f"DayTypes : {len(dt)}")
    villes = defaultdict(int)
    for s in stops.values():
        villes[s['ville']] += 1
    print("Top villes :", sorted(villes.items(), key=lambda x: -x[1])[:12])

    files = sorted(glob.glob(os.path.join(D, 'line_*.xml')),
                   key=lambda x: int(re.findall(r'\d+', os.path.basename(x))[0]))
    résumé = []
    for f in files:
        d = parse_line(f, stops)
        résumé.append((d['ligne']['code'], os.path.basename(f), len(d['courses']),
                       [r['nom'] for r in d['routes'].values()]))
    for code, f, nc, rnames in résumé:
        print(f"L{code:>4} | {f:14} | {nc:4} courses | {rnames}")
