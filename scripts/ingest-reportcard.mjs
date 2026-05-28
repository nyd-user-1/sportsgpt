/**
 * Ingests NYSED Report Card HS metrics into school_year_stats.
 *
 * Adds 10 new columns: attendance_level, chronic_abs_rate, cccr_index,
 * cccr_level, perf_ela_idx, perf_math_idx, perf_sci_idx, exp_per_pupil,
 * inexp_teach_pct, out_of_cert_pct.
 *
 * For coop slugs that span multiple buildings/districts, picks the main HS
 * row (the building with the largest population — for our coop set, that's
 * the HS proper, not the freshman campus or JR HSs). Where a slug spans
 * multiple districts (greenport-southold-mattituck, east-hampton coop),
 * picks the largest enrollment row to represent.
 *
 * Usage: node --env-file=.env.local scripts/ingest-reportcard.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CSV_PATH  = path.join(__dirname, 'data', 'enrollment', 'suffolk-report-card.csv')
const REG_PATH  = path.join(__dirname, 'data', 'enrollment', 'suffolk-regents.csv')

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('Set DATABASE_URL'); process.exit(1) }

// slug → BEDS ENTITY_CD[]
const SLUG_TO_BEDS = {
  'amityville': ['580106030005'], 'babylon': ['580101030002'], 'bay-shore': ['580501030006'],
  'bayport-blue-point': ['580505020004'], 'bellport': ['580235060006'],
  'brentwood': ['580512030018', '580512030026'], 'center-moriches': ['580233020001'],
  'centereach': ['580211060016'], 'central-islip': ['580513030006'], 'commack': ['580410030017'],
  'comsewogue': ['580203020008'], 'connetquot': ['580507060006'], 'copiague': ['580105030005'],
  'deer-park': ['580107030007'], 'east-hampton-bridgehampton-pierson': ['580301020002','580909020001','580305020004'],
  'east-islip': ['580503030006'], 'eastport-south-manor': ['580912060001'], 'floyd': ['580232030002'],
  'glenn': ['580401020003'], 'greenport-southold-mattituck': ['581010020001','581012020001','581005020003'],
  'half-hollow-hills-east': ['580405060010'], 'half-hollow-hills-west': ['580405060016'],
  'hampton-bays': ['580905020001'], 'harborfields': ['580406060007'], 'hauppauge': ['580506030007'],
  'huntington': ['580403030013'], 'islip': ['580502020001'], 'kings-park': ['580805060004'],
  'lindenhurst': ['580104030010'], 'longwood': ['580212060005'], 'miller-place': ['580208020003'],
  'mt-sinai': ['580207020003'], 'newfield': ['580211060010'], 'north-babylon': ['580103030008'],
  'northport': ['580404030009'], 'patchogue-medford': ['580224030008'], 'port-jefferson': ['580206020003'],
  'riverhead': ['580602040008'], 'rocky-point': ['580209020002'], 'sachem-east': ['580205060020'],
  'sachem-north': ['580205060019'], 'sayville': ['580504030004'], 'shoreham-wading-river': ['580601040005'],
  'smithtown-east': ['580801060014'], 'smithtown-west': ['580801060022'], 'southampton': ['580906030003'],
  'ward-melville': ['580201060005','580201060009','580201060010'],
  'west-babylon': ['580102030008'], 'west-islip': ['580509030012'], 'westhampton': ['580902020001'],
  'whitman': ['580413030011'], 'wyandanch': ['580109020003'],
}

// For coop slugs: which BEDS code IS the main HS to pull report card from.
// Default: first code in the list. Override here if a different one should win.
const SLUG_PRIMARY_BEDS = Object.fromEntries(
  Object.entries(SLUG_TO_BEDS).map(([slug, cds]) => [slug, cds[0]]),
)

const BEDS_TO_SLUG = {}
for (const [slug, cds] of Object.entries(SLUG_TO_BEDS)) {
  for (const cd of cds) BEDS_TO_SLUG[cd] = slug
}

function loadCsv(p) {
  const text = fs.readFileSync(p, 'utf8').replace(/\r/g, '').trim()
  const [headerLine, ...lines] = text.split('\n')
  const cols = headerLine.split(',')
  return lines.map(line => {
    const cells = line.split(',')
    return Object.fromEntries(cols.map((c, i) => [c, cells[i]]))
  })
}
const num = v => (v == null || v === '' ? null : Number(v))

const RC_COLS = [
  'attendance_level','chronic_abs_rate','cccr_index','cccr_level',
  'perf_ela_idx','perf_math_idx','perf_sci_idx',
  'exp_per_pupil','inexp_teach_pct','out_of_cert_pct',
  'grad_4yr_rate','grad_5yr_rate','grad_6yr_rate',
]

// Raw NYSED Regents subject strings drift across years (Common Core / Next Gen
// / framework variants). Collapse to canonical names; SUBJECT_ORDER fixes the
// display order (and feeds the sort_order column on school_regents_results).
const SUBJECT_NORM = {
  'Regents Common Core English Language Art': 'English Language Arts',
  'Regents Comp English':                     'English Language Arts',
  'Regents Algebra I':                        'Algebra I',
  'Regents Common Core Algebra I':            'Algebra I',
  'Regents Common Core Algebra II':           'Algebra II',
  'Regents Algebra II':                       'Algebra II',
  'Regents Geometry':                         'Geometry',
  'Regents Common Core Geometry':             'Geometry',
  'Regents NF Global History':                'Global History',
  "Regents US History&Gov't":                 'US History & Government',
  "Regents US History&Gov't (Framework)":     'US History & Government',
  'Regents Living Environment':               'Living Environment',
  'Regents Life Science: Biology':            'Living Environment',
  'Regents Phy Set/Earth Sci':                'Earth Science',
  'Regents Earth and Space Sciences':         'Earth Science',
  'Regents Phy Set/Chemistry':                'Chemistry',
  'Regents Phy Set/Physics':                  'Physics',
}
const SUBJECT_ORDER = [
  'English Language Arts', 'Algebra I', 'Geometry', 'Algebra II',
  'Global History', 'US History & Government',
  'Living Environment', 'Earth Science', 'Chemistry', 'Physics',
]
const REG_NUM_COLS = ['tested','num_prof','per_prof','per_level1','per_level2','per_level3','per_level4','per_level5']

const rows = loadCsv(CSV_PATH)

// Build (slug, year) → row, preferring the slug's primary BEDS code
const byKey = new Map()
for (const r of rows) {
  const slug = BEDS_TO_SLUG[r.entity_cd]
  if (!slug) continue
  const key = `${slug}|${r.year}`
  const existing = byKey.get(key)
  const isPrimary = r.entity_cd === SLUG_PRIMARY_BEDS[slug]
  // Always prefer the primary BEDS row when present
  if (!existing || isPrimary) {
    byKey.set(key, { slug, year: Number(r.year), ...r })
  }
}

console.log(`Report Card rows to write: ${byKey.size}`)

// ── Regents: normalize subjects, keep the main HS building per slug, dedupe by
//    (slug, year, canonical subject) keeping the row with the larger tested count.
const regRows = loadCsv(REG_PATH)
const regByKey = new Map()   // `${slug}|${year}|${subject}` → row
const unmapped = new Set()
for (const r of regRows) {
  const slug = BEDS_TO_SLUG[r.entity_cd]
  if (!slug) continue
  if (r.entity_cd !== SLUG_PRIMARY_BEDS[slug]) continue   // main HS building only
  const subject = SUBJECT_NORM[r.subject]
  if (!subject) { unmapped.add(r.subject); continue }
  const tested = num(r.tested) ?? 0
  if (tested <= 0) continue   // no-data rows (tested=0) add only empty subject rows
  const key = `${slug}|${r.year}|${subject}`
  const existing = regByKey.get(key)
  if (!existing || tested > (existing._tested ?? 0)) {
    regByKey.set(key, {
      slug, year: Number(r.year), subject,
      sort_order: SUBJECT_ORDER.indexOf(subject),
      _tested: tested,
      ...Object.fromEntries(REG_NUM_COLS.map(c => [c, num(r[c])])),
    })
  }
}
if (unmapped.size) console.warn('⚠ Unmapped Regents subjects (skipped):', [...unmapped].join(' | '))
console.log(`Regents rows to write: ${regByKey.size}`)

const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: true })
try {
  // ALTER TABLE for new cols
  const numericCols = RC_COLS
  for (const c of numericCols) {
    await pool.query(`ALTER TABLE school_year_stats ADD COLUMN IF NOT EXISTS ${c} NUMERIC`)
  }
  console.log('Schema: added/verified', numericCols.length, 'report-card columns')

  let updated = 0, inserted = 0
  for (const [key, r] of byKey.entries()) {
    const slug = r.slug, year = r.year
    const sets = RC_COLS.map((c, i) => `${c} = $${i + 3}`).join(', ')
    const values = [slug, year, ...RC_COLS.map(c => num(r[c]))]
    const result = await pool.query(
      `UPDATE school_year_stats SET ${sets} WHERE school_slug = $1 AND year = $2`,
      values,
    )
    if (result.rowCount > 0) {
      updated++
    } else {
      // Insert shell row if no enrollment record exists for this year
      await pool.query(
        `INSERT INTO school_year_stats (school_slug, year, ${RC_COLS.join(',')})
         VALUES ($1, $2, ${RC_COLS.map((_, i) => `$${i + 3}`).join(',')})
         ON CONFLICT (school_slug, year) DO UPDATE SET ${RC_COLS.map(c => `${c} = EXCLUDED.${c}`).join(', ')}`,
        values,
      )
      inserted++
    }
  }
  console.log(`✓ updated ${updated} + inserted ${inserted} school_year_stats rows`)

  // ── Regents results (normalized, one row per school/year/subject) ──────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS school_regents_results (
      school_slug  TEXT    NOT NULL,
      year         INTEGER NOT NULL,
      subject      TEXT    NOT NULL,
      sort_order   SMALLINT,
      tested       NUMERIC,
      num_prof     NUMERIC,
      pct_prof     NUMERIC,
      pct_l1       NUMERIC,
      pct_l2       NUMERIC,
      pct_l3       NUMERIC,
      pct_l4       NUMERIC,
      pct_l5       NUMERIC,
      PRIMARY KEY (school_slug, year, subject)
    )`)
  let regWritten = 0
  for (const r of regByKey.values()) {
    await pool.query(
      `INSERT INTO school_regents_results
         (school_slug, year, subject, sort_order, tested, num_prof, pct_prof, pct_l1, pct_l2, pct_l3, pct_l4, pct_l5)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (school_slug, year, subject) DO UPDATE SET
         sort_order = EXCLUDED.sort_order, tested = EXCLUDED.tested, num_prof = EXCLUDED.num_prof,
         pct_prof = EXCLUDED.pct_prof, pct_l1 = EXCLUDED.pct_l1, pct_l2 = EXCLUDED.pct_l2,
         pct_l3 = EXCLUDED.pct_l3, pct_l4 = EXCLUDED.pct_l4, pct_l5 = EXCLUDED.pct_l5`,
      [r.slug, r.year, r.subject, r.sort_order, r.tested, r.num_prof, r.per_prof,
       r.per_level1, r.per_level2, r.per_level3, r.per_level4, r.per_level5],
    )
    regWritten++
  }
  console.log(`✓ wrote ${regWritten} school_regents_results rows`)

  const sample = await pool.query(`
    SELECT year, chronic_abs_rate, perf_ela_idx, perf_math_idx, exp_per_pupil,
           grad_4yr_rate, grad_5yr_rate, grad_6yr_rate
    FROM school_year_stats WHERE school_slug = 'bay-shore' ORDER BY year DESC
  `)
  console.log('\nBay Shore Report Card sample:')
  for (const r of sample.rows) console.log(' ', r)

  const regSample = await pool.query(`
    SELECT subject, tested, pct_prof FROM school_regents_results
    WHERE school_slug = 'bay-shore' AND year = 2025 ORDER BY sort_order
  `)
  console.log('\nBay Shore 2024-25 Regents sample:')
  for (const r of regSample.rows) console.log(' ', r)
} finally {
  await pool.end()
}
