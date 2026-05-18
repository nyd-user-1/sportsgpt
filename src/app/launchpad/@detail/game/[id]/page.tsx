import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { sql } from '@/lib/db'
import { TEAM_PHOTOS, SCHOOL_LOGOS } from '@/lib/team-images'

export const dynamic = 'force-dynamic'

function cleanName(name: string) {
  return name.replace(/\s+Varsity\s+Football$/i, '')
}

function fmtDate(raw: unknown) {
  if (!raw) return null
  const d = new Date(new Date(raw as string).toISOString().slice(0, 10) + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function navUrl(id: number, team: string | null) {
  return `/launchpad/game/${id}${team ? `?team=${team}` : ''}`
}

export default async function GameDetailSlot({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { id } = await params
  const sp = await searchParams
  const gameId = Number(id)
  if (!gameId) notFound()

  const teamParam = sp.team ?? null

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

  const season    = Number(g.season)
  const gameNum   = g.game_number != null ? Number(g.game_number) : null

  // Prev / next within same season (team-filtered if team param set)
  const [prevRows, nextRows] = await Promise.all([
    teamParam
      ? sql`SELECT id FROM games WHERE season = ${season} AND game_number < ${gameNum}
              AND (home_team_slug = ${teamParam} OR away_team_slug = ${teamParam})
            ORDER BY game_number DESC LIMIT 1`
      : sql`SELECT id FROM games WHERE season = ${season} AND game_number < ${gameNum}
            ORDER BY game_number DESC, id DESC LIMIT 1`,
    teamParam
      ? sql`SELECT id FROM games WHERE season = ${season} AND game_number > ${gameNum}
              AND (home_team_slug = ${teamParam} OR away_team_slug = ${teamParam})
            ORDER BY game_number ASC LIMIT 1`
      : sql`SELECT id FROM games WHERE season = ${season} AND game_number > ${gameNum}
            ORDER BY game_number ASC, id ASC LIMIT 1`,
  ])

  const prevId = prevRows[0]?.id ? Number(prevRows[0].id) : null
  const nextId = nextRows[0]?.id ? Number(nextRows[0].id) : null

  const homeSlug   = g.home_team_slug as string
  const awaySlug   = g.away_team_slug as string
  const homeSchool = (g.home_school as string) ?? homeSlug.replace(/-varsity-football$/, '')
  const awaySchool = (g.away_school as string) ?? awaySlug.replace(/-varsity-football$/, '')
  const homeName   = cleanName(g.home_name as string)
  const awayName   = cleanName(g.away_name as string)
  const homeScore  = g.home_score != null ? Number(g.home_score) : null
  const awayScore  = g.away_score != null ? Number(g.away_score) : null
  const scored     = homeScore != null && awayScore != null

  const homePhoto  = TEAM_PHOTOS[homeSchool]?.[0]
  const awayPhoto  = TEAM_PHOTOS[awaySchool]?.[0]
  const homeLogo   = SCHOOL_LOGOS[homeSchool]
  const awayLogo   = SCHOOL_LOGOS[awaySchool]

  const arrowCls = 'absolute top-1/2 -translate-y-1/2 z-20 h-8 w-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/55 text-white transition-colors'

  return (
    <div className="group/card h-full relative overflow-hidden">

      {/* Split photo background */}
      <div className="absolute inset-0 flex">
        <div className="relative flex-1">
          {homePhoto ? (
            <>
              <Image src={homePhoto} alt={homeName} fill className="object-cover" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-black/60" />
            </>
          ) : (
            <div className="h-full bg-gradient-to-br from-[#023882] to-[#0a52c7]" />
          )}
        </div>
        <div className="relative flex-1">
          {awayPhoto ? (
            <>
              <Image src={awayPhoto} alt={awayName} fill className="object-cover" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-l from-black/10 to-black/60" />
            </>
          ) : (
            <div className="h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e]" />
          )}
        </div>
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40 z-[1]" />

      {/* Full-image link to game page — sits above dark overlay, below interactive elements */}
      <Link href={`/game/${gameId}`} className="absolute inset-0 z-[5]" aria-label={`View game: ${homeName} vs ${awayName}`} />

      {/* Prev arrow */}
      {prevId && (
        <Link href={navUrl(prevId, teamParam)} scroll={false} className={`${arrowCls} left-2`}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}

      {/* Next arrow */}
      {nextId && (
        <Link href={navUrl(nextId, teamParam)} scroll={false} className={`${arrowCls} right-2`}>
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}

      {/* Top bar — week badge left, date right */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between">
        {gameNum != null && (
          <span className="text-xs font-semibold text-black bg-white rounded-full px-2.5 py-0.5">Week {gameNum}</span>
        )}
        {fmtDate(g.game_date) && (
          <span className="text-xs font-medium text-white/60">{fmtDate(g.game_date)}</span>
        )}
      </div>

      {/* Score badge — centered */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <Link href={`/game/${gameId}`} className="bg-black/65 backdrop-blur-md rounded-2xl px-6 py-5 text-center border border-white/10 min-w-[380px] hover:border-white/30 hover:shadow-[0_0_24px_rgba(255,255,255,0.1)] transition-all duration-200 cursor-pointer">
          {scored ? (
            <p className="text-8xl font-black text-white tabular-nums leading-none">
              <span>{homeScore}</span>
              <span className="mx-3">–</span>
              <span>{awayScore}</span>
            </p>
          ) : (
            <p className="text-sm text-white/40">vs</p>
          )}
        </Link>
      </div>

      {/* Home team overlay — bottom left, revealed on hover */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100 transition-opacity duration-300">
        <Link href={`/team/${homeSlug}`} className="shrink-0">
          {homeLogo ? (
            <Image src={homeLogo} alt={homeName} width={32} height={32}
              className="rounded-full bg-white/90 p-0.5 object-contain hover:ring-2 hover:ring-white/60 transition-all" unoptimized />
          ) : (
            <div className="h-8 w-8 rounded-full bg-white/20 border border-white/30" />
          )}
        </Link>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-white/50">Home</p>
          <p className="text-xs font-bold text-white leading-snug">{homeName}</p>
        </div>
      </div>

      {/* Away team overlay — bottom right, revealed on hover */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 flex-row-reverse opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100 transition-opacity duration-300">
        <Link href={`/team/${awaySlug}`} className="shrink-0">
          {awayLogo ? (
            <Image src={awayLogo} alt={awayName} width={32} height={32}
              className="rounded-full bg-white/90 p-0.5 object-contain hover:ring-2 hover:ring-white/60 transition-all" unoptimized />
          ) : (
            <div className="h-8 w-8 rounded-full bg-white/20 border border-white/30" />
          )}
        </Link>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wider text-white/50">Away</p>
          <p className="text-xs font-bold text-white leading-snug">{awayName}</p>
        </div>
      </div>

    </div>
  )
}
