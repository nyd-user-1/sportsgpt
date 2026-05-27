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
}

const parsePct = (s: unknown): number | null => {
  if (s == null) return null
  const n = parseFloat(String(s).replace('%', '').trim())
  return Number.isFinite(n) ? n : null
}

export default async function SchoolPage() {
  const rows = await sql`
    SELECT slug, name, division, section, address,
      enrollment, graduation_rate, avg_sat,
      ap_pass_rate, college_acceptance_rate
    FROM schools
    ORDER BY name`

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
  }))

  return <SchoolMagazineShell schools={schools} />
}
