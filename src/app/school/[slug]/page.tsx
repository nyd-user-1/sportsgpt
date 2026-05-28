import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { SchoolDetailShell } from './Shell'

export const dynamic = 'force-dynamic'

export type SchoolDetail = {
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
  beds_cd: string | null
  short_description: string | null
}

export type SchoolYearStat = {
  year: number
  g9_12: number | null
  k12: number | null
  // Per-grade enrollment
  pk: number | null
  pk_half: number | null
  pk_full: number | null
  k_half: number | null
  k_full: number | null
  g1: number | null
  g2: number | null
  g3: number | null
  g4: number | null
  g5: number | null
  g6: number | null
  g7: number | null
  g8: number | null
  g9: number | null
  g10: number | null
  g11: number | null
  g12: number | null
  uge: number | null
  ugs: number | null
  // Demographics
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
  // Grad rate
  grad_pct: number | null
  ap_pct: number | null
  enroll_cnt: number | null
  grad_cnt: number | null
  reg_pct: number | null
  reg_adv_pct: number | null
  local_pct: number | null
  non_diploma_credential_pct: number | null
  still_enr_pct: number | null
  dropout_pct: number | null
}

export type TeamSeasonRow = {
  slug: string
  name: string
  season: number
  overall_wins: number | null
  overall_losses: number | null
  overall_ties: number | null
}

export type DivisionPeer = {
  slug: string
  name: string
  enrollment: number | null
  avg_sat: number | null
}

const parsePct = (s: unknown): number | null => {
  if (s == null) return null
  const n = parseFloat(String(s).replace('%', '').trim())
  return Number.isFinite(n) ? n : null
}
const toNum = (v: unknown): number | null => v != null ? Number(v) : null

export default async function SchoolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const schoolRows = await sql`SELECT * FROM schools WHERE slug = ${slug}`
  const school = schoolRows[0]
  if (!school) notFound()

  const [allSchools, yearStatsRows, teamSeasonRows, divPeerRows] = await Promise.all([
    sql`SELECT slug, name FROM schools ORDER BY name`,

    sql`SELECT year, g9_12, k12,
          pk, pk_half, pk_full, k_half, k_full,
          g1, g2, g3, g4, g5, g6, g7, g8, g9, g10, g11, g12, uge, ugs,
          num_white, num_black, num_hisp, num_asian, num_multi, num_am_ind,
          num_ell, num_swd, num_ecdis, num_homeless,
          needs_index, needs_index_desc, grad_pct, ap_pct,
          enroll_cnt, grad_cnt, reg_pct, reg_adv_pct, local_pct,
          non_diploma_credential_pct, still_enr_pct, dropout_pct
        FROM school_year_stats
        WHERE school_slug = ${slug}
        ORDER BY year DESC`,

    sql`SELECT t.slug, t.name, s.season,
          s.overall_wins, s.overall_losses, s.overall_ties
        FROM teams t
        JOIN team_season_stats s ON s.team_slug = t.slug
        WHERE t.school_slug = ${slug}
        ORDER BY s.season DESC`,

    sql`SELECT sch.slug, sch.name, sch.enrollment, sch.avg_sat
        FROM schools sch
        WHERE sch.division = ${school.division} AND sch.slug != ${slug}
        ORDER BY sch.name`,
  ])

  const namesSorted = allSchools as { slug: string; name: string }[]
  const idx = namesSorted.findIndex(s => s.slug === slug)
  const n = namesSorted.length
  const prevSlug = namesSorted[(idx - 1 + n) % n]?.slug ?? slug
  const nextSlug = namesSorted[(idx + 1) % n]?.slug ?? slug

  const detail: SchoolDetail = {
    slug:        school.slug as string,
    name:        school.name as string,
    division:    school.division as string,
    section:     (school.section as string | null) ?? null,
    address:     (school.address as string | null) ?? null,
    enrollment:  toNum(school.enrollment),
    grad_pct:    parsePct(school.graduation_rate),
    avg_sat:     toNum(school.avg_sat),
    ap_pct:      parsePct(school.ap_pass_rate),
    coll_pct:    parsePct(school.college_acceptance_rate),
    beds_cd:     (school.beds_cd as string | null) ?? null,
    short_description: (school.short_description as string | null) ?? null,
  }

  const yearStats: SchoolYearStat[] = yearStatsRows.map(r => ({
    year:           Number(r.year),
    g9_12:          toNum(r.g9_12),
    k12:            toNum(r.k12),
    pk:             toNum(r.pk),
    pk_half:        toNum(r.pk_half),
    pk_full:        toNum(r.pk_full),
    k_half:         toNum(r.k_half),
    k_full:         toNum(r.k_full),
    g1:             toNum(r.g1),
    g2:             toNum(r.g2),
    g3:             toNum(r.g3),
    g4:             toNum(r.g4),
    g5:             toNum(r.g5),
    g6:             toNum(r.g6),
    g7:             toNum(r.g7),
    g8:             toNum(r.g8),
    g9:             toNum(r.g9),
    g10:            toNum(r.g10),
    g11:            toNum(r.g11),
    g12:            toNum(r.g12),
    uge:            toNum(r.uge),
    ugs:            toNum(r.ugs),
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
    needs_index:    (r.needs_index as string | null) ?? null,
    needs_index_desc: (r.needs_index_desc as string | null) ?? null,
    grad_pct:       toNum(r.grad_pct),
    ap_pct:         toNum(r.ap_pct),
    enroll_cnt:     toNum(r.enroll_cnt),
    grad_cnt:       toNum(r.grad_cnt),
    reg_pct:        toNum(r.reg_pct),
    reg_adv_pct:    toNum(r.reg_adv_pct),
    local_pct:      toNum(r.local_pct),
    non_diploma_credential_pct: toNum(r.non_diploma_credential_pct),
    still_enr_pct:  toNum(r.still_enr_pct),
    dropout_pct:    toNum(r.dropout_pct),
  }))

  const teamSeasons: TeamSeasonRow[] = teamSeasonRows.map(r => ({
    slug:           r.slug as string,
    name:           r.name as string,
    season:         Number(r.season),
    overall_wins:   toNum(r.overall_wins),
    overall_losses: toNum(r.overall_losses),
    overall_ties:   toNum(r.overall_ties),
  }))

  const divPeers: DivisionPeer[] = divPeerRows.map(r => ({
    slug:       r.slug as string,
    name:       r.name as string,
    enrollment: toNum(r.enrollment),
    avg_sat:    toNum(r.avg_sat),
  }))

  return (
    <SchoolDetailShell
      school={detail}
      prevSlug={prevSlug}
      nextSlug={nextSlug}
      yearStats={yearStats}
      teamSeasons={teamSeasons}
      divPeers={divPeers}
    />
  )
}
