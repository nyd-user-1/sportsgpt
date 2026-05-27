import { sql } from '@/lib/db'
import { SchoolMagazineShell } from './Shell'

export const dynamic = 'force-dynamic'

export type SchoolIndexRow = {
  slug: string
  name: string
  division: string
  section: string | null
  address: string | null
  enrollment: number | null
  grad_pct: number | null
  avg_sat: number | null
  ap_pct: number | null
  coll_pct: number | null
  // From school_year_stats (latest year) — used as default
  k12: number | null
  num_white: number | null
  num_black: number | null
  num_hisp: number | null
  num_asian: number | null
  num_multi: number | null
  num_am_ind: number | null
  num_ell: number | null
  num_swd: number | null
  num_ecdis: number | null
  num_homeless: number | null
  needs_index: string | null
  needs_index_desc: string | null
  // For trend — earliest year
  enrollment_first: number | null
  first_year: number | null
  latest_year: number | null
}

export type YearStatRow = {
  school_slug: string
  year: number
  g9_12: number | null
  k12: number | null
  num_white: number | null
  num_black: number | null
  num_hisp: number | null
  num_asian: number | null
  num_multi: number | null
  num_am_ind: number | null
  num_ell: number | null
  num_swd: number | null
  num_ecdis: number | null
  num_homeless: number | null
  needs_index: string | null
  needs_index_desc: string | null
  grad_pct: number | null
  ap_pct: number | null
}

const parsePct = (s: unknown): number | null => {
  if (s == null) return null
  const n = parseFloat(String(s).replace('%', '').trim())
  return Number.isFinite(n) ? n : null
}

const toNum = (v: unknown): number | null =>
  v != null ? Number(v) : null

export default async function SchoolPage() {
  const [schoolRows, statsRows] = await Promise.all([
    sql`
      WITH latest AS (
        SELECT school_slug, MAX(year) AS y FROM school_year_stats GROUP BY school_slug
      ),
      earliest AS (
        SELECT school_slug, MIN(year) AS y FROM school_year_stats GROUP BY school_slug
      )
      SELECT
        sch.slug, sch.name, sch.division, sch.section, sch.address,
        sch.enrollment, sch.graduation_rate, sch.avg_sat,
        sch.ap_pass_rate, sch.college_acceptance_rate,
        sys.k12,
        sys.num_white, sys.num_black, sys.num_hisp, sys.num_asian,
        sys.num_multi, sys.num_am_ind,
        sys.num_ell, sys.num_swd, sys.num_ecdis, sys.num_homeless,
        sys.needs_index, sys.needs_index_desc,
        sys_first.g9_12 AS enrollment_first,
        earliest.y AS first_year,
        latest.y   AS latest_year
      FROM schools sch
      LEFT JOIN latest                ON latest.school_slug = sch.slug
      LEFT JOIN school_year_stats sys ON sys.school_slug = sch.slug AND sys.year = latest.y
      LEFT JOIN earliest              ON earliest.school_slug = sch.slug
      LEFT JOIN school_year_stats sys_first ON sys_first.school_slug = sch.slug AND sys_first.year = earliest.y
      ORDER BY sch.name`,
    sql`
      SELECT school_slug, year, g9_12, k12,
        num_white, num_black, num_hisp, num_asian, num_multi, num_am_ind,
        num_ell, num_swd, num_ecdis, num_homeless,
        needs_index, needs_index_desc,
        grad_pct, ap_pct
      FROM school_year_stats
      ORDER BY school_slug, year`,
  ])

  const schools: SchoolIndexRow[] = schoolRows.map(r => ({
    slug:       r.slug    as string,
    name:       r.name    as string,
    division:   r.division as string,
    section:    (r.section as string | null) ?? null,
    address:    (r.address as string | null) ?? null,
    enrollment: toNum(r.enrollment),
    grad_pct:   parsePct(r.graduation_rate),
    avg_sat:    toNum(r.avg_sat),
    ap_pct:     parsePct(r.ap_pass_rate),
    coll_pct:   parsePct(r.college_acceptance_rate),
    k12:          toNum(r.k12),
    num_white:    toNum(r.num_white),
    num_black:    toNum(r.num_black),
    num_hisp:     toNum(r.num_hisp),
    num_asian:    toNum(r.num_asian),
    num_multi:    toNum(r.num_multi),
    num_am_ind:   toNum(r.num_am_ind),
    num_ell:      toNum(r.num_ell),
    num_swd:      toNum(r.num_swd),
    num_ecdis:    toNum(r.num_ecdis),
    num_homeless: toNum(r.num_homeless),
    needs_index:      (r.needs_index      as string | null) ?? null,
    needs_index_desc: (r.needs_index_desc as string | null) ?? null,
    enrollment_first: toNum(r.enrollment_first),
    first_year:       toNum(r.first_year),
    latest_year:      toNum(r.latest_year),
  }))

  const yearStats: YearStatRow[] = statsRows.map(r => ({
    school_slug:    r.school_slug as string,
    year:           Number(r.year),
    g9_12:          toNum(r.g9_12),
    k12:            toNum(r.k12),
    num_white:      toNum(r.num_white),
    num_black:      toNum(r.num_black),
    num_hisp:       toNum(r.num_hisp),
    num_asian:      toNum(r.num_asian),
    num_multi:      toNum(r.num_multi),
    num_am_ind:     toNum(r.num_am_ind),
    num_ell:        toNum(r.num_ell),
    num_swd:        toNum(r.num_swd),
    num_ecdis:      toNum(r.num_ecdis),
    num_homeless:   toNum(r.num_homeless),
    needs_index:    (r.needs_index      as string | null) ?? null,
    needs_index_desc: (r.needs_index_desc as string | null) ?? null,
    grad_pct:       toNum(r.grad_pct),
    ap_pct:         toNum(r.ap_pct),
  }))

  return <SchoolMagazineShell schools={schools} yearStats={yearStats} />
}
