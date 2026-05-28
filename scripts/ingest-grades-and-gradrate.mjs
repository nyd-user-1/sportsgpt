/**
 * Ingests per-grade enrollment (PK-12) and detailed graduation rate columns
 * into school_year_stats. Run AFTER ingest-enrollment.mjs has populated the
 * baseline rows. Adds:
 *
 *   Per-grade enrollment from suffolk-9-12.csv:
 *     pk, pk_half, pk_full, k_half, k_full, g1..g8, uge, ugs
 *     (g9..g12 already populated; this fills the rest)
 *
 *   Detailed grad rate from suffolk-grad-rate.csv (5 years):
 *     enroll_cnt, grad_cnt, reg_pct, reg_adv_pct, local_pct,
 *     non_diploma_credential_pct, still_enr_pct, dropout_pct
 *
 * Usage:
 *   node --env-file=.env.local scripts/ingest-grades-and-gradrate.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname  = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR   = path.join(__dirname, 'data', 'enrollment')
const ENROLL_CSV = path.join(DATA_DIR, 'suffolk-9-12.csv')
const GRAD_CSV   = path.join(DATA_DIR, 'suffolk-grad-rate.csv')

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('Set DATABASE_URL'); process.exit(1) }

// slug → BEDS ENTITY_CD[] mapping (same as ingest-enrollment.mjs)
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
const numOrZero = v => (v == null || v === '' ? 0 : Number(v))

// ── Aggregate per-grade enrollment by (slug, year) ─────────────────────────
const GRADE_COLS = ['pk','pk_half','pk_full','k_half','k_full','g1','g2','g3','g4','g5','g6','g7','g8','g9','g10','g11','g12','uge','ugs']
const enrolRows = loadCsv(ENROLL_CSV)
const gradesByKey = new Map() // 'slug|year' -> { ...grade columns summed }
for (const r of enrolRows) {
  const slug = BEDS_TO_SLUG[r.entity_cd]
  if (!slug) continue
  const key = `${slug}|${r.year}`
  let v = gradesByKey.get(key)
  if (!v) {
    v = { slug, year: Number(r.year) }
    for (const c of GRADE_COLS) v[c] = 0
    gradesByKey.set(key, v)
  }
  for (const c of GRADE_COLS) v[c] += numOrZero(r[c])
}

// ── Grad rate by (slug, year) — pick the single main HS row, no summing ───
// For coop slugs, prefer the row where enroll_cnt is largest (the main HS).
const GRAD_COLS = ['enroll_cnt','grad_cnt','grad_pct','reg_pct','reg_adv_pct','local_pct','non_diploma_credential_pct','still_enr_pct','dropout_pct']
const gradRows = loadCsv(GRAD_CSV)
const gradByKey = new Map() // 'slug|year' -> winning row
for (const r of gradRows) {
  const slug = BEDS_TO_SLUG[r.entity_cd]
  if (!slug) continue
  const enrollCnt = numOrZero(r.enroll_cnt)
  if (enrollCnt === 0) continue  // skip suppressed/empty rows
  const key = `${slug}|${r.year}`
  const existing = gradByKey.get(key)
  if (!existing || enrollCnt > numOrZero(existing.enroll_cnt)) {
    gradByKey.set(key, r)
  }
}

console.log(`Per-grade enrollment rows: ${gradesByKey.size}`)
console.log(`Grad rate rows:            ${gradByKey.size}`)

// ── Connect + upsert ───────────────────────────────────────────────────────
const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: true })
try {
  console.log('\nWriting per-grade enrollment…')
  let updEnroll = 0
  for (const g of gradesByKey.values()) {
    const sets = GRADE_COLS.map((c, i) => `${c} = $${i + 3}`).join(', ')
    const values = [g.slug, g.year, ...GRADE_COLS.map(c => g[c])]
    const result = await pool.query(
      `UPDATE school_year_stats SET ${sets} WHERE school_slug = $1 AND year = $2`,
      values,
    )
    if (result.rowCount > 0) updEnroll++
  }
  console.log(`  ✓ updated ${updEnroll} (slug, year) rows`)

  console.log('\nWriting grad rate…')
  let updGrad = 0
  for (const [key, r] of gradByKey.entries()) {
    const [slug, yearStr] = key.split('|')
    const year = Number(yearStr)
    const sets = GRAD_COLS.map((c, i) => `${c} = $${i + 3}`).join(', ')
    const values = [slug, year, ...GRAD_COLS.map(c => num(r[c]))]
    const result = await pool.query(
      `UPDATE school_year_stats SET ${sets} WHERE school_slug = $1 AND year = $2`,
      values,
    )
    if (result.rowCount > 0) {
      updGrad++
    } else {
      // If row doesn't exist for that (slug, year) — insert a shell row
      await pool.query(
        `INSERT INTO school_year_stats (school_slug, year, ${GRAD_COLS.join(',')}) VALUES ($1, $2, ${GRAD_COLS.map((_, i) => `$${i + 3}`).join(',')})
         ON CONFLICT (school_slug, year) DO UPDATE SET ${GRAD_COLS.map(c => `${c} = EXCLUDED.${c}`).join(', ')}`,
        values,
      )
      updGrad++
    }
  }
  console.log(`  ✓ wrote ${updGrad} grad rate rows`)

  // Sample
  const sample = await pool.query(`
    SELECT school_slug, year, g9_12, k12, grad_pct, reg_adv_pct, dropout_pct
    FROM school_year_stats WHERE school_slug = 'bay-shore' ORDER BY year
  `)
  console.log('\nBay Shore sample:')
  for (const r of sample.rows) console.log(' ', r)
} finally {
  await pool.end()
}
