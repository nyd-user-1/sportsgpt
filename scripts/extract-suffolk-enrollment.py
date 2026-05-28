#!/usr/bin/env python3
"""
Extracts Suffolk County (county_cd=58) building-level data from NYSED
ENROLL{year}.mdb databases into slim CSVs under scripts/data/enrollment/:

  suffolk-9-12.csv         — grade 9-12 enrollment by (entity, year)
  suffolk-demographics.csv — K-12 race/sex/ELL/SWD/ECDIS/homeless counts by (entity, year)
                             plus K-12 total, plus district N/RC tier
  suffolk-districts.csv    — district-aggregate PK-12 enrollment by (district_cd, year)
                             — full elementary/middle/HS rollup per district

Both tables share the same (entity_cd, year) key so they can be joined.
Only Suffolk County (county_cd=58), building-level entities (digits 9-12 != '0000')
with grade 9-12 enrollment > 0 are kept.

Requires mdb-tools (brew install mdbtools).
Re-run when a new yearly .mdb is added.
"""

import csv
import subprocess
import sys
from pathlib import Path

ENROLL_DIR = Path('/Users/brendanstanton/code/education/Enrollment')
OUT_DIR    = Path(__file__).parent / 'data' / 'enrollment'

# Locate each year's .mdb. The newest file holds multiple years; older files hold one.
SOURCES = [
    ('2021-22 Enrollment DB', 'ENROLL2022_20221114.mdb'),
    ('2022-23 Enrollment DB', 'ENROLL2023_20231207.mdb'),
    ('2023-24 Enrollment DB', 'ENROLL2024_20241105..mdb'),
    ('2024-25 Enrollment DB', 'ENROLL2025_20251217.mdb'),
]

def mdb_export(mdb, table):
    out = subprocess.run(
        ['mdb-export', str(mdb), table],
        capture_output=True, text=True, check=True,
    )
    return list(csv.DictReader(out.stdout.splitlines()))

def to_int(v):
    if v in (None, ''): return 0
    try: return int(float(v))
    except ValueError: return 0

# Demographic column name → output column name. NUM_Multi is mixed-case in the source.
DEM_COLS = {
    'NUM_FEMALE':   'num_female',
    'NUM_MALE':     'num_male',
    'NUM_AM_IND':   'num_am_ind',
    'NUM_BLACK':    'num_black',
    'NUM_ASIAN':    'num_asian',
    'NUM_HISP':     'num_hisp',
    'NUM_WHITE':    'num_white',
    'NUM_Multi':    'num_multi',
    'NUM_ELL':      'num_ell',
    'NUM_SWD':      'num_swd',
    'NUM_ECDIS':    'num_ecdis',
    'NUM_HOMELESS': 'num_homeless',
}

def main():
    enrol_rows = []  # grade 9-12 (one row per entity-year)
    dem_rows   = []  # demographics + K-12 + N/RC tier (one row per entity-year)
    dist_rows  = []  # district-aggregate enrollment (one row per district-year)
    seen_enrol = set()
    seen_dem   = set()
    seen_dist  = set()

    for folder, fname in SOURCES:
        mdb = ENROLL_DIR / folder / fname
        if not mdb.exists():
            print(f'  skip (missing): {mdb}', file=sys.stderr)
            continue
        print(f'reading {mdb.name}', file=sys.stderr)

        # Suffolk entities + their district code + N/RC tier (per year)
        suffolk = {}    # entity_cd -> dict
        nrc_by_district = {}  # (district_cd, year) -> (needs_index, needs_index_desc)
        for row in mdb_export(mdb, 'BOCES and N/RC'):
            if row.get('COUNTY_CD') != '58': continue
            ec = row['ENTITY_CD']
            y  = row.get('YEAR', '')
            suffolk[ec] = {
                'district_name': row.get('DISTRICT_NAME', ''),
                'district_cd':   row.get('DISTRICT_CD', ''),
                'year':          y,
            }
            dcd = row.get('DISTRICT_CD', '')
            nrc = row.get('NEEDS_INDEX', '')
            nrc_desc = row.get('NEEDS_INDEX_DESCRIPTION', '')
            if dcd and y:
                nrc_by_district[(dcd, y)] = (nrc, nrc_desc)

        # Index BEDS rows by (entity, year) so we can look up K-12 per demographic row.
        beds_index = {}
        for row in mdb_export(mdb, 'BEDS Day Enrollment'):
            ec = row['ENTITY_CD']
            y  = row.get('YEAR', '')
            beds_index[(ec, y)] = row

        # BEDS Day Enrollment — filter Suffolk buildings with grade 9-12 > 0
        for row in mdb_export(mdb, 'BEDS Day Enrollment'):
            ec = row['ENTITY_CD']
            if ec not in suffolk: continue
            if ec[8:12] == '0000': continue  # district aggregate
            g9_12 = sum(to_int(row.get(str(g))) for g in (9, 10, 11, 12))
            if g9_12 == 0: continue
            year = row.get('YEAR', '')
            key = (ec, year)
            if key in seen_enrol: continue
            seen_enrol.add(key)
            enrol_rows.append({
                'entity_cd':     ec,
                'entity_name':   row['ENTITY_NAME'].strip(),
                'district_name': suffolk[ec]['district_name'],
                'year':          year,
                'pk':            to_int(row.get('PK')),
                'pk_half':       to_int(row.get('PKHALF')),
                'pk_full':       to_int(row.get('PKFULL')),
                'k_half':        to_int(row.get('KHALF')),
                'k_full':        to_int(row.get('KFULL')),
                'g1':            to_int(row.get('1')),
                'g2':            to_int(row.get('2')),
                'g3':            to_int(row.get('3')),
                'g4':            to_int(row.get('4')),
                'g5':            to_int(row.get('5')),
                'g6':            to_int(row.get('6')),
                'g7':            to_int(row.get('7')),
                'g8':            to_int(row.get('8')),
                'g9':            to_int(row.get('9')),
                'g10':           to_int(row.get('10')),
                'g11':           to_int(row.get('11')),
                'g12':           to_int(row.get('12')),
                'uge':           to_int(row.get('UGE')),
                'ugs':           to_int(row.get('UGS')),
                'k12':           to_int(row.get('K12')),
                'g9_12':         g9_12,
            })

        # District-aggregate enrollment (entity_cd ending 0000).
        # These rows roll up every building in the district — PK through 12
        # for the whole school system. Used to fill PK-8 on the school detail page.
        # County code 58 = Suffolk; district aggregates aren't always in the
        # BOCES roster (which is keyed by building), so we filter by county prefix.
        for row in mdb_export(mdb, 'BEDS Day Enrollment'):
            ec = row['ENTITY_CD']
            if ec[:2] != '58': continue       # Suffolk only
            if ec[8:12] != '0000': continue   # only district aggregates
            year = row.get('YEAR', '')
            key = (ec, year)
            if key in seen_dist: continue
            seen_dist.add(key)
            dist_rows.append({
                'district_cd':   ec[:8],
                'district_name': row.get('ENTITY_NAME', '').strip(),
                'year':          year,
                'pk':            to_int(row.get('PK')),
                'pk_half':       to_int(row.get('PKHALF')),
                'pk_full':       to_int(row.get('PKFULL')),
                'k_half':        to_int(row.get('KHALF')),
                'k_full':        to_int(row.get('KFULL')),
                'g1':            to_int(row.get('1')),
                'g2':            to_int(row.get('2')),
                'g3':            to_int(row.get('3')),
                'g4':            to_int(row.get('4')),
                'g5':            to_int(row.get('5')),
                'g6':            to_int(row.get('6')),
                'g7':            to_int(row.get('7')),
                'g8':            to_int(row.get('8')),
                'g9':            to_int(row.get('9')),
                'g10':           to_int(row.get('10')),
                'g11':           to_int(row.get('11')),
                'g12':           to_int(row.get('12')),
                'uge':           to_int(row.get('UGE')),
                'ugs':           to_int(row.get('UGS')),
                'k12':           to_int(row.get('K12')),
            })

        # Demographic Factors — same entity filter as above
        for row in mdb_export(mdb, 'Demographic Factors'):
            ec = row['ENTITY_CD']
            if ec not in suffolk: continue
            if ec[8:12] == '0000': continue
            year = row.get('YEAR', '')
            # Only keep buildings where we have BEDS grade 9-12 data for the same year
            beds = beds_index.get((ec, year))
            if not beds: continue
            g9_12 = sum(to_int(beds.get(str(g))) for g in (9, 10, 11, 12))
            if g9_12 == 0: continue
            key = (ec, year)
            if key in seen_dem: continue
            seen_dem.add(key)
            k12 = to_int(beds.get('K12'))
            dcd = suffolk[ec]['district_cd']
            nrc_code, nrc_desc = nrc_by_district.get((dcd, year), ('', ''))
            out = {
                'entity_cd':         ec,
                'entity_name':       row['ENTITY_NAME'].strip(),
                'year':              year,
                'k12':               k12,
                'needs_index':       nrc_code,
                'needs_index_desc':  nrc_desc,
            }
            for src, dst in DEM_COLS.items():
                out[dst] = to_int(row.get(src))
            dem_rows.append(out)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    enrol_rows.sort(key=lambda r: (r['year'], r['entity_name']))
    dem_rows.sort(key=lambda r: (r['year'], r['entity_name']))
    dist_rows.sort(key=lambda r: (r['year'], r['district_name']))

    with open(OUT_DIR / 'suffolk-districts.csv', 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(dist_rows[0].keys()))
        w.writeheader()
        w.writerows(dist_rows)

    with open(OUT_DIR / 'suffolk-9-12.csv', 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(enrol_rows[0].keys()))
        w.writeheader()
        w.writerows(enrol_rows)
    with open(OUT_DIR / 'suffolk-demographics.csv', 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=list(dem_rows[0].keys()))
        w.writeheader()
        w.writerows(dem_rows)

    years = sorted({r['year'] for r in enrol_rows})
    print(f'\nsuffolk-9-12.csv:        {len(enrol_rows)} rows', file=sys.stderr)
    print(f'suffolk-demographics.csv: {len(dem_rows)} rows', file=sys.stderr)
    print(f'suffolk-districts.csv:   {len(dist_rows)} rows', file=sys.stderr)
    print(f'years covered:           {years}', file=sys.stderr)

if __name__ == '__main__':
    main()
