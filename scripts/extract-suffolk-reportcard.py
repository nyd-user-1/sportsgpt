#!/usr/bin/env python3
"""
Extracts NYSED Report Card HS metrics for Suffolk County schools across
4 years (2021-22 → 2024-25) into scripts/data/enrollment/suffolk-report-card.csv.

Metrics pulled:
  attendance_level     — ACC HS Attendance.LEVEL (1-4) — 2024-25 only
  chronic_abs_rate     — ACC HS Chronic Absenteeism.ABSENT_RATE (%) — all years
  cccr_index           — ACC HS CCCR.INDEX — 2024-25 only
  cccr_level           — ACC HS CCCR.LEVEL (1-4) — 2024-25 only
  perf_ela_idx         — ACC HS Core and Weighted Performance.CORE_INDEX, SUBJECT=ELA
  perf_math_idx        — ACC HS Core and Weighted Performance.CORE_INDEX, SUBJECT=MATH
  perf_sci_idx         — ACC HS Core and Weighted Performance.CORE_INDEX, SUBJECT=SCIENCE
  exp_per_pupil        — Expenditures per Pupil.PER_FED_STATE_LOCAL_EXP ($)
  inexp_teach_pct      — Inexperienced Teachers and Principals.PER_TEACH_INEXP (%)
  out_of_cert_pct      — Teachers Teaching Out of Certification.PER_OUT_CERT (%)
  grad_4yr_rate        — ACC HS Graduation Rate.GRAD_RATE, COHORT=4-Year
  grad_5yr_rate        — ACC HS Graduation Rate.GRAD_RATE, COHORT=5-Year
  grad_6yr_rate        — ACC HS Graduation Rate.GRAD_RATE, COHORT=6-Year

The 4/5/6-Year cohort rates are a self-consistent set from the Report Card
source (kept separate from the page's existing August-final grad_pct, which
uses a different methodology). They are keyed by the grad table's own YEAR
field (the cohort's graduation year), not the file's reporting tag.

Also emits a second CSV — suffolk-regents.csv — from Annual Regents Exams:
one row per (entity, year, raw subject) with tested, proficiency, and the
level-1..5 distribution. Subject-name normalization happens at ingest time.

Filtered to Suffolk schools whose BEDS code is in our 52-school slug map
(plus the 4-building coop members so we capture every relevant row).

Requires mdb-tools.
"""

import csv
import subprocess
import sys
from pathlib import Path

RC_DIR    = Path('/Users/brendanstanton/code/education/Report Card')
OUT_PATH  = Path(__file__).parent / 'data' / 'enrollment' / 'suffolk-report-card.csv'
REG_PATH  = Path(__file__).parent / 'data' / 'enrollment' / 'suffolk-regents.csv'

# (folder, mdb-filename, nysed_year)
SOURCES = [
    ('2021-22 Report Card',     'SRC2022_GroupIV.mdb',  2022),
    ('2022-23 Report Card',     'SRC2023_Group5.mdb',   2023),
    ('2023-24 Report Card',     'SRC2024_Group5.mdb',   2024),
    ('2024-25 Report Card DB',  'SRC2025_Group3.mdb',   2025),
]

# Every BEDS code we care about (52 main HS buildings + coop members)
TARGET_BEDS = set([
    '580106030005','580101030002','580501030006','580505020004','580235060006',
    '580512030018','580512030026','580233020001','580211060016','580513030006',
    '580410030017','580203020008','580507060006','580105030005','580107030007',
    '580301020002','580909020001','580305020004','580503030006','580912060001',
    '580232030002','580401020003','581010020001','581012020001','581005020003',
    '580405060010','580405060016','580905020001','580406060007','580506030007',
    '580403030013','580502020001','580805060004','580104030010','580212060005',
    '580208020003','580207020003','580211060010','580103030008','580404030009',
    '580224030008','580206020003','580602040008','580209020002','580205060020',
    '580205060019','580504030004','580601040005','580801060014','580801060022',
    '580906030003','580201060005','580201060009','580201060010','580102030008',
    '580509030012','580902020001','580413030011','580109020003',
])

def mdb_export(mdb, table):
    try:
        out = subprocess.run(['mdb-export', str(mdb), table], capture_output=True, text=True, check=True)
        return list(csv.DictReader(out.stdout.splitlines()))
    except subprocess.CalledProcessError:
        return []

def parse_num(v):
    if v is None: return ''
    s = str(v).strip().replace('%','').replace('$','').replace(',','')
    if s in ('','-','s','N/A','NA'): return ''
    try: return str(float(s)) if '.' in s else str(int(s))
    except ValueError: return ''

def all_students(row):
    sg = row.get('SUBGROUP_NAME','')
    return sg == 'All Students' or sg == ''

def main():
    # key: (entity_cd, year) -> {col: val}
    data = {}
    # key: (entity_cd, year, subject_raw) -> regents row (raw, normalized at ingest)
    regents = {}

    def ensure(ec, year):
        k = (ec, year)
        if k not in data:
            data[k] = {
                'entity_cd': ec, 'year': year,
                'attendance_level': '', 'chronic_abs_rate': '',
                'cccr_index': '', 'cccr_level': '',
                'perf_ela_idx': '', 'perf_math_idx': '', 'perf_sci_idx': '',
                'exp_per_pupil': '', 'inexp_teach_pct': '', 'out_of_cert_pct': '',
                'grad_4yr_rate': '', 'grad_5yr_rate': '', 'grad_6yr_rate': '',
            }
        return data[k]

    for folder, fname, year in SOURCES:
        mdb = RC_DIR / folder / fname
        if not mdb.exists():
            print(f'  skip (missing): {mdb}', file=sys.stderr)
            continue
        print(f'reading {mdb.name} (year {year})', file=sys.stderr)

        # Attendance (2024-25 only)
        for row in mdb_export(mdb, 'ACC HS Attendance'):
            ec = row.get('ENTITY_CD','')
            if ec not in TARGET_BEDS or not all_students(row): continue
            ensure(ec, year)['attendance_level'] = parse_num(row.get('LEVEL'))

        # Chronic absenteeism
        for row in mdb_export(mdb, 'ACC HS Chronic Absenteeism'):
            ec = row.get('ENTITY_CD','')
            if ec not in TARGET_BEDS or not all_students(row): continue
            ensure(ec, year)['chronic_abs_rate'] = parse_num(row.get('ABSENT_RATE'))

        # CCCR (2024-25 only)
        for row in mdb_export(mdb, 'ACC HS CCCR'):
            ec = row.get('ENTITY_CD','')
            if ec not in TARGET_BEDS or not all_students(row): continue
            ensure(ec, year)['cccr_index'] = parse_num(row.get('INDEX'))
            ensure(ec, year)['cccr_level'] = parse_num(row.get('LEVEL'))

        # Performance by subject (ELA / MATH / SCIENCE)
        for row in mdb_export(mdb, 'ACC HS Core and Weighted Performance'):
            ec = row.get('ENTITY_CD','')
            if ec not in TARGET_BEDS or not all_students(row): continue
            subj = row.get('SUBJECT','').upper()
            core = parse_num(row.get('CORE_INDEX'))
            if subj == 'ELA':     ensure(ec, year)['perf_ela_idx']  = core
            elif subj == 'MATH':  ensure(ec, year)['perf_math_idx'] = core
            elif subj == 'SCIENCE': ensure(ec, year)['perf_sci_idx'] = core

        # Expenditures per Pupil
        for row in mdb_export(mdb, 'Expenditures per Pupil'):
            ec = row.get('ENTITY_CD','')
            if ec not in TARGET_BEDS: continue
            ensure(ec, year)['exp_per_pupil'] = parse_num(row.get('PER_FED_STATE_LOCAL_EXP'))

        # Inexperienced Teachers
        for row in mdb_export(mdb, 'Inexperienced Teachers and Principals'):
            ec = row.get('ENTITY_CD','')
            if ec not in TARGET_BEDS: continue
            ensure(ec, year)['inexp_teach_pct'] = parse_num(row.get('PER_TEACH_INEXP'))

        # Out-of-cert
        for row in mdb_export(mdb, 'Teachers Teaching Out of Certification'):
            ec = row.get('ENTITY_CD','')
            if ec not in TARGET_BEDS: continue
            ensure(ec, year)['out_of_cert_pct'] = parse_num(row.get('PER_OUT_CERT'))

        # Graduation cohort rates (4/5/6-Year) — keyed by the row's own YEAR
        # (cohort graduation year), not the file tag. Files overlap, so the
        # same (entity, YEAR) appears in two files with identical values.
        COHORT_COL = {'4-Year': 'grad_4yr_rate', '5-Year': 'grad_5yr_rate', '6-Year': 'grad_6yr_rate'}
        for row in mdb_export(mdb, 'ACC HS Graduation Rate'):
            ec = row.get('ENTITY_CD','')
            if ec not in TARGET_BEDS or not all_students(row): continue
            col = COHORT_COL.get(row.get('COHORT',''))
            if not col: continue
            try: gyear = int(row.get('YEAR'))
            except (TypeError, ValueError): continue
            rate = parse_num(row.get('GRAD_RATE'))
            if rate != '': ensure(ec, gyear)[col] = rate

        # Regents exams by subject — raw subject kept; normalized at ingest.
        for row in mdb_export(mdb, 'Annual Regents Exams'):
            ec = row.get('ENTITY_CD','')
            if ec not in TARGET_BEDS or not all_students(row): continue
            subj = (row.get('SUBJECT') or '').strip()
            try: ryear = int(row.get('YEAR'))
            except (TypeError, ValueError): continue
            if not subj: continue
            regents[(ec, ryear, subj)] = {
                'entity_cd': ec, 'year': ryear, 'subject': subj,
                'tested':      parse_num(row.get('TESTED')),
                'num_prof':    parse_num(row.get('NUM_PROF')),
                'per_prof':    parse_num(row.get('PER_PROF')),
                'per_level1':  parse_num(row.get('PER_LEVEL1')),
                'per_level2':  parse_num(row.get('PER_LEVEL2')),
                'per_level3':  parse_num(row.get('PER_LEVEL3')),
                'per_level4':  parse_num(row.get('PER_LEVEL4')),
                'per_level5':  parse_num(row.get('PER_LEVEL5')),
            }

    rows_out = sorted(data.values(), key=lambda r: (r['year'], r['entity_cd']))
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    fields = ['entity_cd','year','attendance_level','chronic_abs_rate',
              'cccr_index','cccr_level',
              'perf_ela_idx','perf_math_idx','perf_sci_idx',
              'exp_per_pupil','inexp_teach_pct','out_of_cert_pct',
              'grad_4yr_rate','grad_5yr_rate','grad_6yr_rate']
    with open(OUT_PATH, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows_out)

    years = sorted({r['year'] for r in rows_out})
    print(f'\nWrote {len(rows_out)} rows to {OUT_PATH}', file=sys.stderr)
    print(f'Years covered: {years}', file=sys.stderr)

    # Second CSV: Regents results (raw subjects, normalized at ingest)
    reg_rows = sorted(regents.values(), key=lambda r: (r['year'], r['entity_cd'], r['subject']))
    reg_fields = ['entity_cd','year','subject','tested','num_prof','per_prof',
                  'per_level1','per_level2','per_level3','per_level4','per_level5']
    with open(REG_PATH, 'w', newline='') as f:
        w = csv.DictWriter(f, fieldnames=reg_fields)
        w.writeheader()
        w.writerows(reg_rows)
    print(f'Wrote {len(reg_rows)} Regents rows to {REG_PATH}', file=sys.stderr)

if __name__ == '__main__':
    main()
