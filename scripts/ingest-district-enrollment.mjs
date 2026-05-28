/**
 * Overwrites the per-grade enrollment columns in school_year_stats with
 * district-aggregate values from suffolk-districts.csv. This gives the
 * school detail page meaningful PK-8 values (which the HS-building row
 * doesn't have, since elementary/middle students live in different buildings).
 *
 * For each (slug, year): sum district enrollments across every DISTINCT
 * district the slug spans. For coop slugs that span multiple districts
 * (greenport-southold-mattituck, east-hampton-bridgehampton-pierson), the
 * three districts' enrollments are summed. For single-district slugs
 * (including Ward Melville's 3 buildings — all in Three Village CSD —
 * and Brentwood's 2 buildings), one district aggregate is used.
 *
 * The `g9_12` column is NOT touched — it stays as the HS-building total
 * already computed by the original ingest. K-12 is overwritten to the
 * district total so PK + K + g1..g12 + ungraded ≈ K-12.
 *
 * Usage:
 *   node --env-file=.env.local scripts/ingest-district-enrollment.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CSV_PATH  = path.join(__dirname, 'data', 'enrollment', 'suffolk-districts.csv')

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('Set DATABASE_URL'); process.exit(1) }

// slug → BEDS ENTITY_CD[] (same as ingest-enrollment.mjs)
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

// slug → DISTINCT district_cd[] (first 8 chars of beds, dedupe)
const SLUG_TO_DISTRICTS = Object.fromEntries(
  Object.entries(SLUG_TO_BEDS).map(([slug, cds]) => [
    slug, [...new Set(cds.map(cd => cd.substring(0, 8)))],
  ])
)

function loadCsv(p) {
  const text = fs.readFileSync(p, 'utf8').replace(/\r/g, '').trim()
  const [headerLine, ...lines] = text.split('\n')
  const cols = headerLine.split(',')
  return lines.map(line => {
    const cells = line.split(',')
    return Object.fromEntries(cols.map((c, i) => [c, cells[i]]))
  })
}
const numOrZero = v => (v == null || v === '' ? 0 : Number(v))

const distRows = loadCsv(CSV_PATH)
// Index by (district_cd, year) for fast lookup
const distIndex = new Map() // 'distcd|year' -> row
for (const r of distRows) {
  distIndex.set(`${r.district_cd}|${r.year}`, r)
}

// Columns we'll sum across districts and write to school_year_stats.
// (g9-g12 intentionally excluded — we keep the HS-only counts there.)
const GRADE_COLS = ['pk','pk_half','pk_full','k_half','k_full','g1','g2','g3','g4','g5','g6','g7','g8','uge','ugs','k12']

// Build per-(slug, year) sums
const sums = new Map() // 'slug|year' -> { ...cols }
const allYears = [...new Set(distRows.map(r => Number(r.year)))].sort()

for (const [slug, dists] of Object.entries(SLUG_TO_DISTRICTS)) {
  for (const year of allYears) {
    const agg = {}
    for (const c of GRADE_COLS) agg[c] = 0
    let anyFound = false
    for (const dcd of dists) {
      const r = distIndex.get(`${dcd}|${year}`)
      if (!r) continue
      anyFound = true
      for (const c of GRADE_COLS) agg[c] += numOrZero(r[c])
    }
    if (!anyFound) continue
    sums.set(`${slug}|${year}`, agg)
  }
}

console.log(`Computed district sums for ${sums.size} (slug, year) pairs`)

// ── Connect + write ────────────────────────────────────────────────────────
const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: true })
try {
  let updated = 0
  for (const [key, agg] of sums.entries()) {
    const [slug, yearStr] = key.split('|')
    const year = Number(yearStr)
    const sets = GRADE_COLS.map((c, i) => `${c} = $${i + 3}`).join(', ')
    const values = [slug, year, ...GRADE_COLS.map(c => agg[c])]
    const result = await pool.query(
      `UPDATE school_year_stats SET ${sets} WHERE school_slug = $1 AND year = $2`,
      values,
    )
    if (result.rowCount > 0) updated++
  }
  console.log(`✓ updated ${updated} school_year_stats rows with district enrollment`)

  // Sample
  const r = await pool.query(`
    SELECT year, pk, k_half + k_full AS k, g1, g5, g8, g9, g12, k12, g9_12
    FROM school_year_stats WHERE school_slug = 'bay-shore' ORDER BY year
  `)
  console.log('\nBay Shore sample (district PK-8 + HS g9-g12):')
  for (const x of r.rows) console.log(' ', x)
} finally {
  await pool.end()
}
