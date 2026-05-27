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
  // From school_year_stats (latest year)
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
  // From school_year_stats (earliest year)
  enrollment_first: number | null
  first_year: number | null
  latest_year: number | null
}

const parsePct = (s: unknown): number | null => {
  if (s == null) return null
  const n = parseFloat(String(s).replace('%', '').trim())
  return Number.isFinite(n) ? n : null
}

export default async function SchoolPage() {
  // schools + latest school_year_stats + earliest enrollment (for trend)
  const rows = await sql`
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
    ORDER BY sch.name`

  const schools: SchoolIndexRow[] = rows.map(r => ({
    slug:       r.slug    as string,
    name:       r.name    as string,
    division:   r.division as string,
    section:    (r.section as string | null) ?? null,
    address:    (r.address as string | null) ?? null,
    enrollment: r.enrollment != null ? Number(r.enrollment) : null,
    grad_pct:   parsePct(r.graduation_rate),
    avg_sat:    r.avg_sat != null ? Number(r.avg_sat) : null,
    ap_pct:     parsePct(r.ap_pass_rate),
    coll_pct:   parsePct(r.college_acceptance_rate),
    k12:          r.k12          != null ? Number(r.k12) : null,
    num_white:    r.num_white    != null ? Number(r.num_white) : null,
    num_black:    r.num_black    != null ? Number(r.num_black) : null,
    num_hisp:     r.num_hisp     != null ? Number(r.num_hisp) : null,
    num_asian:    r.num_asian    != null ? Number(r.num_asian) : null,
    num_multi:    r.num_multi    != null ? Number(r.num_multi) : null,
    num_am_ind:   r.num_am_ind   != null ? Number(r.num_am_ind) : null,
    num_ell:      r.num_ell      != null ? Number(r.num_ell) : null,
    num_swd:      r.num_swd      != null ? Number(r.num_swd) : null,
    num_ecdis:    r.num_ecdis    != null ? Number(r.num_ecdis) : null,
    num_homeless: r.num_homeless != null ? Number(r.num_homeless) : null,
    needs_index:      (r.needs_index      as string | null) ?? null,
    needs_index_desc: (r.needs_index_desc as string | null) ?? null,
    enrollment_first: r.enrollment_first != null ? Number(r.enrollment_first) : null,
    first_year:       r.first_year != null ? Number(r.first_year) : null,
    latest_year:      r.latest_year != null ? Number(r.latest_year) : null,
  }))

  return <SchoolMagazineShell schools={schools} />
}
