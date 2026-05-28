import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { TEAM_PHOTOS, SCHOOL_LOGOS } from '@/lib/team-images'

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }
const MONO:  React.CSSProperties = { fontFamily: 'var(--font-mono), ui-monospace, monospace' }

function cleanName(name: string) {
  return name.replace(/\s+Varsity\s+Football$/i, '')
}

export async function GameDetailSlotContent({
  gameId,
  teamParam,
}: {
  gameId: number
  teamParam: string | null
}) {
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

  const gameNum = g.game_number != null ? Number(g.game_number) : null

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

  const href = `/game/${gameId}?h=${encodeURIComponent(homeName)}&v=${encodeURIComponent(awayName)}${teamParam ? `&team=${teamParam}` : ''}`

  return (
    <div className="group/card h-full relative overflow-hidden" style={{ borderRadius: 1 }}>

      {/* Split photo background — no zoom */}
      <div className="absolute inset-0 flex">
        <div className="relative flex-1 overflow-hidden">
          {homePhoto ? (
            <>
              <Image src={homePhoto} alt={homeName} fill className="object-cover object-top" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-black/55" />
            </>
          ) : (
            <div className="h-full bg-gradient-to-br from-[#023882] to-[#0a52c7]" />
          )}
        </div>
        <div className="relative flex-1 overflow-hidden">
          {awayPhoto ? (
            <>
              <Image src={awayPhoto} alt={awayName} fill className="object-cover object-top" unoptimized />
              <div className="absolute inset-0 bg-gradient-to-l from-black/10 to-black/55" />
            </>
          ) : (
            <div className="h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e]" />
          )}
        </div>
      </div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/35 z-[1]" />

      {/* Full-image link to game page */}
      <Link
        href={href}
        className="absolute inset-0 z-[5]"
        aria-label={`View game: ${homeName} vs ${awayName}`}
      />

      {/* Top corners — week badge + date */}
      {gameNum != null && (
        <div className="absolute top-4 left-4 z-10">
          <span
            className="text-[10px] uppercase tracking-[0.22em] px-2.5 py-1 border border-white/30 bg-black/45 backdrop-blur-sm text-white/95"
            style={{ ...SANS, borderRadius: 2 }}
          >
            Week {gameNum}
          </span>
        </div>
      )}
      {scored && (
        <div className="absolute top-4 right-4 z-10">
          <span
            className="text-[12px] tabular-nums px-2.5 py-1 border border-white/30 bg-black/45 backdrop-blur-sm text-white"
            style={{ ...SANS, borderRadius: 2 }}
          >
            {homeScore}–{awayScore}
          </span>
        </div>
      )}

      {/* Score badge — centered */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <Link
          href={href}
          className="pointer-events-auto bg-black/60 backdrop-blur-md text-center border border-white/15 px-7 py-5 min-w-0 sm:min-w-[360px] hover:border-white/30 transition-colors duration-200 cursor-pointer"
          style={{ borderRadius: 3 }}
        >
          {scored ? (
            <p
              className="text-7xl font-black text-white tabular-nums leading-none"
              style={MONO}
            >
              <span>{homeScore}</span>
              <span className="mx-3">–</span>
              <span>{awayScore}</span>
            </p>
          ) : (
            <p className="text-base text-white/40" style={{ ...SERIF, fontStyle: 'italic' }}>vs</p>
          )}
        </Link>
      </div>

      {/* Home team — bottom left, always visible */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2.5 pointer-events-none">
        <Link href={`/team/${homeSlug}`} className="shrink-0 pointer-events-auto">
          {homeLogo ? (
            <Image
              src={homeLogo}
              alt={homeName}
              width={32}
              height={32}
              className="rounded-full bg-white/95 p-0.5 object-contain hover:ring-2 hover:ring-white/60 transition-all"
              unoptimized
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-white/20 border border-white/30" />
          )}
        </Link>
        <div>
          <p
            className="text-[10px] uppercase tracking-[0.22em] text-white/55"
            style={SANS}
          >
            Home
          </p>
          <p
            className="text-white leading-snug"
            style={{ ...SERIF, fontSize: 13.5, fontWeight: 500, letterSpacing: '-0.005em' }}
          >
            {homeName}
          </p>
        </div>
      </div>

      {/* Away team — bottom right, always visible */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2.5 flex-row-reverse pointer-events-none">
        <Link href={`/team/${awaySlug}`} className="shrink-0 pointer-events-auto">
          {awayLogo ? (
            <Image
              src={awayLogo}
              alt={awayName}
              width={32}
              height={32}
              className="rounded-full bg-white/95 p-0.5 object-contain hover:ring-2 hover:ring-white/60 transition-all"
              unoptimized
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-white/20 border border-white/30" />
          )}
        </Link>
        <div className="text-right">
          <p
            className="text-[10px] uppercase tracking-[0.22em] text-white/55"
            style={SANS}
          >
            Away
          </p>
          <p
            className="text-white leading-snug"
            style={{ ...SERIF, fontSize: 13.5, fontWeight: 500, letterSpacing: '-0.005em' }}
          >
            {awayName}
          </p>
        </div>
      </div>

    </div>
  )
}
