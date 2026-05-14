import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight, ArrowRight } from 'lucide-react'
import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { TEAM_PHOTOS, SCHOOL_LOGOS } from '@/lib/team-images'

export const dynamic = 'force-dynamic'

function cleanName(name: string) {
  return name.replace(/\s+Varsity\s+Football$/i, '')
}

function fmtDate(raw: unknown) {
  if (!raw) return null
  const d = new Date(new Date(raw as string).toISOString().slice(0, 10) + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function Logo({ slug }: { slug: string }) {
  const schoolSlug = slug.replace(/-varsity-football$/, '')
  const logo = SCHOOL_LOGOS[schoolSlug]
  return logo ? (
    <Image src={logo} alt="" width={40} height={40}
      className="rounded-full bg-white/90 border border-white/30 object-contain" unoptimized />
  ) : (
    <div className="h-10 w-10 rounded-full bg-white/20 border border-white/20" />
  )
}

export default async function GameDetailSlot({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const gameId = Number(id)
  if (!gameId) notFound()

  const rows = await sql`
    SELECT g.*,
      ht.name  AS home_name,  ht.division  AS home_div,  ht.school_slug AS home_school,
      at2.name AS away_name, at2.division AS away_div, at2.school_slug AS away_school
    FROM games g
    JOIN teams ht  ON ht.slug  = g.home_team_slug
    JOIN teams at2 ON at2.slug = g.away_team_slug
    WHERE g.id = ${gameId}
  `
  const g = rows[0]
  if (!g) notFound()

  const homeSlug   = g.home_team_slug as string
  const awaySlug   = g.away_team_slug as string
  const homeSchool = (g.home_school as string) ?? homeSlug.replace(/-varsity-football$/, '')
  const awaySchool = (g.away_school as string) ?? awaySlug.replace(/-varsity-football$/, '')
  const homeName   = cleanName(g.home_name as string)
  const awayName   = cleanName(g.away_name as string)
  const homeScore  = g.home_score != null ? Number(g.home_score) : null
  const awayScore  = g.away_score != null ? Number(g.away_score) : null
  const homeWon    = homeScore != null && awayScore != null && homeScore > awayScore
  const awayWon    = homeScore != null && awayScore != null && awayScore > homeScore

  const homePhoto  = TEAM_PHOTOS[homeSchool]
  const awayPhoto  = TEAM_PHOTOS[awaySchool]
  const dateStr    = fmtDate(g.game_date)

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Split photo header */}
      <div className="relative flex-1 min-h-0 flex">
        {/* Home side */}
        <div className="relative flex-1 overflow-hidden">
          {homePhoto ? (
            <>
              <Image src={homePhoto} alt={homeName} fill className="object-cover" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-black/60" />
            </>
          ) : (
            <div className="h-full bg-gradient-to-br from-[#023882] to-[#0a52c7]" />
          )}
          <div className="absolute inset-0 flex flex-col items-start justify-end p-3 gap-1">
            <Logo slug={homeSlug} />
            <p className="text-xs font-bold text-white leading-tight">{homeName}</p>
            <span className="text-[10px] text-white/60 uppercase tracking-wide">Home</span>
          </div>
        </div>

        {/* Score badge */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-black/70 backdrop-blur-md rounded-xl px-3 py-2 text-center border border-white/10 shadow-lg">
            {homeScore != null && awayScore != null ? (
              <>
                <p className="text-xl font-black text-white tabular-nums leading-none">
                  <span className={homeWon ? 'text-white' : 'text-white/50'}>{homeScore}</span>
                  <span className="text-white/30 mx-1">–</span>
                  <span className={awayWon ? 'text-white' : 'text-white/50'}>{awayScore}</span>
                </p>
                <p className="text-[10px] text-white/50 mt-1 uppercase tracking-wide">Final</p>
              </>
            ) : (
              <p className="text-xs text-white/50">vs</p>
            )}
          </div>
        </div>

        {/* Away side */}
        <div className="relative flex-1 overflow-hidden">
          {awayPhoto ? (
            <>
              <Image src={awayPhoto} alt={awayName} fill className="object-cover" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-l from-black/20 to-black/60" />
            </>
          ) : (
            <div className="h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e]" />
          )}
          <div className="absolute inset-0 flex flex-col items-end justify-end p-3 gap-1">
            <Logo slug={awaySlug} />
            <p className="text-xs font-bold text-white leading-tight text-right">{awayName}</p>
            <span className="text-[10px] text-white/60 uppercase tracking-wide">Away</span>
          </div>
        </div>
      </div>

      {/* Footer info */}
      <div className="shrink-0 px-4 py-3 border-t border-[var(--border)] bg-[var(--surface)] flex items-center justify-between gap-3">
        <div className="min-w-0">
          {dateStr && <p className="text-xs text-[var(--muted)]">{dateStr}</p>}
          <p className="text-xs font-medium text-[var(--txt)] mt-0.5">
            {g.game_number != null ? `Game ${g.game_number} · ` : ''}Season {g.season as number}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/team/${homeSlug}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors">
            {homeName.split(' ')[0]} <ArrowUpRight className="h-3 w-3" />
          </Link>
          <ArrowRight className="h-3.5 w-3.5 text-[var(--muted)]" />
          <Link href={`/team/${awaySlug}`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-xs font-medium text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors">
            {awayName.split(' ')[0]} <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

    </div>
  )
}
