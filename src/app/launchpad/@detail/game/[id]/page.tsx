import Image from 'next/image'
import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { SCHOOL_LOGOS } from '@/lib/team-images'

export const dynamic = 'force-dynamic'

function cleanName(name: string) {
  return name.replace(/\s+Varsity\s+Football$/i, '')
}

function fmtDate(raw: unknown) {
  if (!raw) return null
  const d = new Date(new Date(raw as string).toISOString().slice(0, 10) + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function TeamLogo({ slug, size = 72 }: { slug: string; size?: number }) {
  const schoolSlug = slug.replace(/-varsity-football$/, '')
  const logo = SCHOOL_LOGOS[schoolSlug]
  return logo ? (
    <Image src={logo} alt="" width={size} height={size}
      className="rounded-full bg-white/10 border-2 border-white/20 object-contain p-1" unoptimized />
  ) : (
    <div className="rounded-full bg-white/10 border-2 border-white/20 flex items-center justify-center"
      style={{ width: size, height: size }}>
      <span className="text-white/40 text-xs font-bold uppercase">
        {cleanName(slug.replace(/-varsity-football$/, '')).slice(0, 2)}
      </span>
    </div>
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

  const homeSlug  = g.home_team_slug as string
  const awaySlug  = g.away_team_slug as string
  const homeName  = cleanName(g.home_name as string)
  const awayName  = cleanName(g.away_name as string)
  const homeScore = g.home_score != null ? Number(g.home_score) : null
  const awayScore = g.away_score != null ? Number(g.away_score) : null
  const scored    = homeScore != null && awayScore != null
  const homeWon   = scored && homeScore! > awayScore!
  const awayWon   = scored && awayScore! > homeScore!
  const dateStr   = fmtDate(g.game_date)

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-[#0f172a] to-[#1e293b]">

      {/* Game number top-right */}
      <div className="flex justify-end px-4 pt-3">
        <span className="text-xs text-white/40 font-medium">
          {g.game_number != null ? `Game ${g.game_number as number}` : ''}
        </span>
      </div>

      {/* Main content — fills remaining space */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">

        {/* Score — the focus */}
        <div className="flex items-center gap-4">
          <span className={scored && !homeWon ? 'text-6xl font-black text-white/30 tabular-nums' : 'text-6xl font-black text-white tabular-nums'}>
            {homeScore ?? '—'}
          </span>
          <span className="text-3xl font-light text-white/30">–</span>
          <span className={scored && !awayWon ? 'text-6xl font-black text-white/30 tabular-nums' : 'text-6xl font-black text-white tabular-nums'}>
            {awayScore ?? '—'}
          </span>
        </div>

        {scored && (
          <span className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Final</span>
        )}

        {/* Teams */}
        <div className="w-full flex items-start justify-between gap-4">
          {/* Home */}
          <div className="flex flex-col items-center gap-2 text-center min-w-0">
            <TeamLogo slug={homeSlug} size={56} />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">Home</p>
              <p className="text-sm font-bold text-white leading-snug">
                {homeName}
                {scored && (
                  <span className={homeWon ? ' text-green-400' : ' text-red-400'}> {homeWon ? 'W' : 'L'}</span>
                )}
              </p>
            </div>
          </div>

          {/* Date + season info */}
          {dateStr && (
            <div className="flex flex-col items-center text-center min-w-0 mt-2">
              <p className="text-[11px] text-white/50 leading-snug">{dateStr}</p>
              <p className="text-[11px] text-white/30 mt-0.5">Season {g.season as number}</p>
            </div>
          )}

          {/* Away */}
          <div className="flex flex-col items-center gap-2 text-center min-w-0">
            <TeamLogo slug={awaySlug} size={56} />
            <div>
              <p className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">Away</p>
              <p className="text-sm font-bold text-white leading-snug">
                {awayName}
                {scored && (
                  <span className={awayWon ? ' text-green-400' : ' text-red-400'}> {awayWon ? 'W' : 'L'}</span>
                )}
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}
