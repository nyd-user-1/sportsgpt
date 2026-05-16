'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { CURRENT_SEASON } from '@/lib/app-config'
import Image from 'next/image'

export type GameRow = {
  id: number
  game_date: string | null
  season: number
  home_team_slug: string
  away_team_slug: string
  home_score: number | null
  away_score: number | null
  game_number: number | null
  home_name: string
  away_name: string
  home_div: string
  away_div: string
}

const SEASONS = [CURRENT_SEASON, CURRENT_SEASON - 1, CURRENT_SEASON - 2].map(String)

// Map "Division I" → "I", etc.
const SEARCH_DIV_MAP: Record<string, string> = {
  'Division I': 'I', 'Division II': 'II', 'Division III': 'III', 'Division IV': 'IV',
}

function fmtDate(raw: string | null) {
  if (!raw) return '—'
  const d = new Date(raw + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function LogoOrDiv({ slug, div, size = 40 }: { slug: string; div: string; size?: number }) {
  const schoolSlug = slug.replace(/-varsity-football$/, '')
  const logo = SCHOOL_LOGOS[schoolSlug]
  const cls = `shrink-0 rounded-full object-contain bg-white border border-[var(--border)]`
  return logo ? (
    <Image src={logo} alt="" width={size} height={size} className={cls} unoptimized />
  ) : (
    <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-[var(--inp-bg)] border border-[var(--border)] text-xs font-bold text-[var(--muted)]"
      style={{ width: size, height: size, fontSize: size * 0.28 }}>
      {div}
    </span>
  )
}

export function ProviderSection({ games }: { games: GameRow[] }) {
  const [seasonIdx, setSeasonIdx] = useState(0)
  const router        = useRouter()
  const pathname      = usePathname()
  const searchParams  = useSearchParams()
  const divParam      = searchParams.get('div')
  const activeDivision = divParam ? SEARCH_DIV_MAP[divParam] : null
  const activeSeason  = Number(SEASONS[seasonIdx])

  // Extract selected team slug from URL: /launchpad/[team-slug] (not /launchpad/game/[id])
  const parts = pathname.split('/').filter(Boolean)
  const selectedTeam = (parts.length === 2 && parts[0] === 'launchpad' && parts[1] !== 'game')
    ? parts[1]
    : null

  const filtered = games.filter(g => {
    if (g.season !== activeSeason) return false
    // Team selected → show only that team's games
    if (selectedTeam) {
      return g.home_team_slug === selectedTeam || g.away_team_slug === selectedTeam
    }
    // Division filter from outer tabs
    if (activeDivision) {
      return g.home_div === activeDivision || g.away_div === activeDivision
    }
    return true
  })

  return (
    <div>
      {/* Season tabs */}
      <div className="sticky top-0 z-10 bg-[var(--bg)] -mx-4 px-4 flex items-center gap-1 border-b border-[var(--border)] mb-4">
        {SEASONS.map((s, i) => (
          <button key={s} onClick={() => setSeasonIdx(i)}
            className={cn(
              'px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap',
              seasonIdx === i
                ? 'border-[#033882] text-[var(--txt)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--txt)]'
            )}>
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--muted)] py-8 text-center">
          No games found for {activeSeason}{activeDivision ? ` · Division ${activeDivision}` : ''}.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
          {filtered.map(g => {
            const homeWon = g.home_score != null && g.away_score != null && g.home_score > g.away_score
            const awayWon = g.home_score != null && g.away_score != null && g.away_score > g.home_score
            const scored  = g.home_score != null && g.away_score != null
            return (
              <div key={g.id}
                onClick={() => router.push(`/launchpad/game/${g.id}`, { scroll: false })}
                className="rounded-2xl bg-[var(--surface)] shadow-sm p-5 flex flex-col justify-between min-h-[280px] hover:shadow-md transition-all cursor-pointer">

                {/* Date + game# */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--muted)]">{fmtDate(g.game_date)}</span>
                  {g.game_number != null && (
                    <span className="text-[11px] text-[var(--muted)]">Game {g.game_number}</span>
                  )}
                </div>

                {/* Score — huge, centered */}
                <div className="flex items-center justify-center gap-4">
                  <span className={cn('text-5xl font-black tabular-nums leading-none', !homeWon && scored ? 'opacity-25' : 'text-[var(--txt)]')}>
                    {g.home_score ?? '—'}
                  </span>
                  <span className="text-3xl font-light text-[var(--muted)]">–</span>
                  <span className={cn('text-5xl font-black tabular-nums leading-none', !awayWon && scored ? 'opacity-25' : 'text-[var(--txt)]')}>
                    {g.away_score ?? '—'}
                  </span>
                </div>

                {/* Teams row */}
                <div className="flex items-center justify-between gap-2">
                  {/* Home */}
                  <div className="flex items-center gap-2.5 min-w-0"
                    onClick={e => { e.stopPropagation(); router.push(`/team/${g.home_team_slug}`) }}>
                    <LogoOrDiv slug={g.home_team_slug} div={g.home_div} size={40} />
                    <div className="min-w-0">
                      <p className="text-[10px] text-[var(--muted)] uppercase tracking-wide leading-none mb-0.5">Home</p>
                      <p className="text-sm font-semibold text-[var(--txt)] truncate leading-snug">
                        {g.home_name}
                        {scored && (
                          <span className={cn('ml-1 font-bold text-xs', homeWon ? 'text-green-600' : 'text-red-500')}>
                            {homeWon ? 'W' : 'L'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Away — logo on right */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-row-reverse"
                    onClick={e => { e.stopPropagation(); router.push(`/team/${g.away_team_slug}`) }}>
                    <LogoOrDiv slug={g.away_team_slug} div={g.away_div} size={40} />
                    <div className="min-w-0 text-right">
                      <p className="text-[10px] text-[var(--muted)] uppercase tracking-wide leading-none mb-0.5">Away</p>
                      <p className="text-sm font-semibold text-[var(--txt)] truncate leading-snug">
                        {scored && (
                          <span className={cn('mr-1 font-bold text-xs', awayWon ? 'text-green-600' : 'text-red-500')}>
                            {awayWon ? 'W' : 'L'}
                          </span>
                        )}
                        {g.away_name}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
