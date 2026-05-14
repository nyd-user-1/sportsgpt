'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SCHOOL_LOGOS } from '@/lib/team-images'
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

const SEASONS = ['2024', '2023', '2022']

// Map "Division I" → "I", etc.
const SEARCH_DIV_MAP: Record<string, string> = {
  'Division I': 'I', 'Division II': 'II', 'Division III': 'III', 'Division IV': 'IV',
}

function fmtDate(raw: string | null) {
  if (!raw) return '—'
  const d = new Date(raw + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function LogoOrDiv({ slug, div }: { slug: string; div: string }) {
  const schoolSlug = slug.replace(/-varsity-football$/, '')
  const logo = SCHOOL_LOGOS[schoolSlug]
  return logo ? (
    <Image src={logo} alt="" width={20} height={20}
      className="rounded-full bg-white border border-white/20 object-contain shrink-0" unoptimized />
  ) : (
    <span className="shrink-0 inline-flex items-center justify-center h-5 w-5 rounded-full bg-white/20 text-[9px] font-bold text-white">
      {div}
    </span>
  )
}

export function ProviderSection({ games }: { games: GameRow[] }) {
  const [seasonIdx, setSeasonIdx] = useState(0)
  const router        = useRouter()
  const searchParams  = useSearchParams()
  const divParam      = searchParams.get('div')
  const activeDivision = divParam ? SEARCH_DIV_MAP[divParam] : null
  const activeSeason  = Number(SEASONS[seasonIdx])

  const filtered = games.filter(g => {
    if (g.season !== activeSeason) return false
    if (!activeDivision) return true
    return g.home_div === activeDivision || g.away_div === activeDivision
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-6">
          {filtered.map(g => {
            const homeWon = g.home_score != null && g.away_score != null && g.home_score > g.away_score
            const awayWon = g.home_score != null && g.away_score != null && g.away_score > g.home_score
            return (
              <div key={g.id}
                onClick={() => router.push(`/launchpad/game/${g.id}`, { scroll: false })}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:shadow-sm hover:border-[var(--muted)] transition-all cursor-pointer flex flex-col">
                {/* Date + game# header */}
                <div className="px-3 pt-2.5 pb-1.5 flex items-center justify-between border-b border-[var(--border)]">
                  <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">{fmtDate(g.game_date)}</span>
                  {g.game_number != null && (
                    <span className="text-[10px] text-[var(--muted)]">Game {g.game_number}</span>
                  )}
                </div>

                {/* Home team */}
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--inp-bg)] transition-colors"
                  onClick={e => { e.stopPropagation(); router.push(`/team/${g.home_team_slug}`) }}>
                  <LogoOrDiv slug={g.home_team_slug} div={g.home_div} />
                  <span className={cn('text-xs font-medium truncate flex-1', homeWon ? 'font-bold text-[var(--txt)]' : 'text-[var(--txt2)]')}>
                    {g.home_name}
                  </span>
                  <span className={cn('text-xs font-bold shrink-0 tabular-nums', homeWon ? 'text-[var(--txt)]' : 'text-[var(--muted)]')}>
                    {g.home_score ?? '—'}
                  </span>
                </div>

                {/* Away team */}
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--inp-bg)] transition-colors"
                  onClick={e => { e.stopPropagation(); router.push(`/team/${g.away_team_slug}`) }}>
                  <LogoOrDiv slug={g.away_team_slug} div={g.away_div} />
                  <span className={cn('text-xs font-medium truncate flex-1', awayWon ? 'font-bold text-[var(--txt)]' : 'text-[var(--txt2)]')}>
                    {g.away_name}
                  </span>
                  <span className={cn('text-xs font-bold shrink-0 tabular-nums', awayWon ? 'text-[var(--txt)]' : 'text-[var(--muted)]')}>
                    {g.away_score ?? '—'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
