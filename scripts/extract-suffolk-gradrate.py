#!/usr/bin/env python3
"""
Extracts Suffolk County school-level graduation outcome data from NYSED
GRAD_RATE_AND_OUTCOMES databases (5 years: 2020-21 through 2024-25) into a
slim CSV at scripts/data/enrollment/suffolk-grad-rate.csv.

Filters: county_code=58, aggregation_type=School, subgroup_name=All Students,
membership_code=11 (4-year cohort, August final outcome — the most complete
graduation rate for each cohort, recomputed in August after summer school).

Requires mdb-tools (brew install mdbtools).
"""

import csv
import subprocess
import sys
from pathlib import Path

GRAD_DIR = Path('/Users/brendanstanton/code/education/Grad Rate')
OUT_PATH = Path(__file__).parent / 'data' / 'enrollment' / 'suffolk-grad-rate.csv'

# (folder, mdb-filename, table-name, nysed_year_int)
# nysed_year_int matches the YEAR convention in school_year_stats (2021 = 2020-21).
SOURCES = [
    ('2020-21 Grad Rate DB',        'GRAD_RATE_AND_OUTCOMES_2021.mdb', 'GRAD_RATE_AND_OUTCOMES v8_2021', 2021),
    ('2021-22 Grad Rate DB',        'GRAD_RATE_AND_OUTCOMES_2022.mdb', 'GRAD_RATE_AND_OUTCOMES_2022',     2022),
    ('2022-23 Graduation Rate DB',  'GRAD_RATE_AND_OUTCOMES_2023.mdb', 'GRAD_RATE_AND_OUTCOMES_2023',     2023),
    ('2023-24 Grad Rate',           '2024_GRADUATION_RATE.mdb',         'GRAD_RATE_AND_OUTCOMES_2024',     2024),
    ('2024-25 Graduation Rate DB',  '2025 High School Graduation Rate Researcher File.mdb', 'GRAD_RATE_AND_OUTCOMES_2025', 2025),
]

NUM_COLS = [
    'enroll_cnt', 'grad_cnt', 'grad_pct',
    'reg_cnt', 'reg_pct',
    'reg_adv_cnt', 'reg_adv_pct',
    'local_cnt', 'local_pct',
    'non_diploma_credential_cnt', 'non_diploma_credential_pct',
    'still_enr_cnt', 'still_enr_pct',
    'dropout_cnt', 'dropout_pct',
]

def parse_num(v):
    if v is None: return ''
    s = str(v).strip().replace('%', '')
    if s in ('', '-', 's', 'N/A', 'NA'): return ''
    try: return str(float(s)) if '.' in s else str(int(s))
    except ValueError: return ''

def main():
    rows_out = []
    seen = set()
    for folder, fname, table, nysed_year in SOURCES:
        mdb = GRAD_DIR / folder / fname
        if not mdb.exists():
            print(f'  skip (missing): {mdb}', file=sys.stderr)
            continue
        print(f'reading {mdb.name}', file=sys.stderr)
        out = subprocess.run(['mdb-export', str(mdb), table], capture_output=True, text=True, check=True)
        for row in csv.DictReader(out.stdout.splitlines()):
            d = {k.lower(): v for k, v in row.items()}
            if d.get('county_code') != '58': continue
            if d.get('aggregation_type') != 'School': continue
            if d.get('subgroup_name') != 'All Students': continue
            # membership_code 11 = 4-year outcome August (final)
            # Fall back to 9 (4-year June) if 11 missing for older files
            mc = d.get('membership_code')
            if mc != '11' and mc != '9': continue
            ec = d.get('aggregation_code', '')
            if not ec: continue
            key = (ec, nysed_year)
            # Prefer membership_code=11 over 9 if both present for same school+year
            if key in seen:
                if mc != '11': continue
                # Remove existing 9 row if 11 supersedes
                rows_out[:] = [r for r in rows_out if not (r['entity_cd'] == ec and r['year'] == nysed_year)]
            seen.add(key)
            entry = {
                'entity_cd':   ec,
                'entity_name': d.get('aggregation_name', '').strip(),
                'year':        nysed_year,
                'membership':  mc,
            }
            for c in NUM_COLS:
                entry[c] = parse_num(d.get(c))
            rows_out.append(entry)

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    rows_out.sort(key=lambda r: (r['year'], r['entity_name']))
    with open(OUT_PATH, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=['entity_cd','entity_name','year','membership'] + NUM_COLS)
        w.writeheader()
        w.writerows(rows_out)

    years = sorted({r['year'] for r in rows_out})
    print(f'\nWrote {len(rows_out)} rows to {OUT_PATH}', file=sys.stderr)
    print(f'Years covered: {years}', file=sys.stderr)

if __name__ == '__main__':
    main()
