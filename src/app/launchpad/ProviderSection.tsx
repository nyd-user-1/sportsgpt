'use client'

import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { cn, formatSeason } from '@/lib/utils'
import { RevealFx } from '@/components/RevealFx'
import { SCHOOL_LOGOS, TEAM_PHOTOS } from '@/lib/team-images'
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

const SEASONS = [CURRENT_SEASON, CURRENT_SEASON - 1, CURRENT_SEASON - 2, CURRENT_SEASON - 3, CURRENT_SEASON - 4].map(String)

// Map "Division I" → "I", etc.
const SEARCH_DIV_MAP: Record<string, string> = {
  'Division I': 'I', 'Division II': 'II', 'Division III': 'III', 'Division IV': 'IV',
}

function fmtDate(raw: string | null) {
  if (!raw) return '—'
  const d = new Date(raw + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
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

const slideVariants = {
  enter:  (dir: number) => ({ x: dir >= 0 ? '100%' : '-100%' }),
  center: { x: 0 },
  exit:   (dir: number) => ({ x: dir >= 0 ? '-100%' : '100%' }),
}

export function ProviderSection({ games }: { games: GameRow[] }) {
  const [seasonIdx, setSeasonIdx] = useState(0)
  const [direction, setDirection] = useState(1)
  const scrollRef = useRef<HTMLDivElement>(null)

  const searchParamsForSeason = useSearchParams()
  useEffect(() => {
    const s = searchParamsForSeason.get('season')
    if (!s) return
    const idx = SEASONS.indexOf(s)
    if (idx !== -1 && idx !== seasonIdx) {
      setDirection(idx > seasonIdx ? 1 : -1)
      setSeasonIdx(idx)
    }
  }, [searchParamsForSeason.get('season')])

  function handleSeason(i: number) {
    setDirection(i > seasonIdx ? 1 : -1)
    setSeasonIdx(i)
  }
  const router        = useRouter()
  const pathname      = usePathname()
  const searchParams  = useSearchParams()
  const divParam      = searchParams.get('div')
  const activeDivision = divParam ? SEARCH_DIV_MAP[divParam] : null
  const activeSeason  = Number(SEASONS[seasonIdx])

  const parts = pathname.split('/').filter(Boolean)
  const teamFromPath = (parts.length === 2 && parts[0] === 'launchpad' && parts[1] !== 'game')
    ? parts[1]
    : null
  const teamFromParam = searchParams.get('team')
  const selectedTeam = teamFromPath ?? teamFromParam ?? null
  const selectedGameId = (parts.length === 3 && parts[0] === 'launchpad' && parts[1] === 'game')
    ? Number(parts[2])
    : (parts.length === 2 && parts[0] === 'game')
    ? Number(parts[1])
    : null

  useEffect(() => {
    if (!selectedGameId) return
    requestAnimationFrame(() => {
      const el = scrollRef.current?.querySelector(`[data-game-id="${selectedGameId}"]`)
      el?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
    })
  }, [selectedGameId])

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
    <RevealFx delay={0.15} translateY={8}>
      {/* Season tabs */}
      <div className="sticky top-0 z-10 bg-[var(--surface)] -mx-4 px-4 flex items-center gap-1 border-b border-[var(--border)] mb-4">
        {SEASONS.map((s, i) => (
          <button key={s} onClick={() => handleSeason(i)}
            className={cn(
              'px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap',
              seasonIdx === i
                ? 'border-[#033882] text-[var(--txt)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--txt)]'
            )}>
            {formatSeason(Number(s))}
          </button>
        ))}
      </div>

      <div className="overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={activeSeason}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }}
          >
      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--muted)] py-8 text-center">
          No games found for {activeSeason}{activeDivision ? ` · Division ${activeDivision}` : ''}.
        </p>
      ) : (
        <div ref={scrollRef} className="flex gap-4 py-3 px-4 overflow-x-auto no-scrollbar">
          {filtered.map(g => {
            const homeWon = g.home_score != null && g.away_score != null && g.home_score > g.away_score
            const awayWon = g.home_score != null && g.away_score != null && g.away_score > g.home_score
            const scored  = g.home_score != null && g.away_score != null
            const homeSchool = g.home_team_slug.replace(/-varsity-football$/, '')
            const awaySchool = g.away_team_slug.replace(/-varsity-football$/, '')
            const homePhoto  = TEAM_PHOTOS[homeSchool]?.[0]
            const awayPhoto  = TEAM_PHOTOS[awaySchool]?.[0]
            return (
              <div key={g.id}
                data-game-id={g.id}
                onClick={() => {
                  const panelOpen = parts.length === 2 && parts[0] === 'game'
                  if (panelOpen) {
                    const params = new URLSearchParams()
                    params.set('h', g.home_name)
                    params.set('v', g.away_name)
                    if (selectedTeam) params.set('team', selectedTeam)
                    router.push(`/game/${g.id}?${params.toString()}`, { scroll: false })
                  } else {
                    router.push(`/launchpad/game/${g.id}${selectedTeam ? `?team=${selectedTeam}` : ''}`, { scroll: false })
                  }
                }}
                className={cn("group rounded-2xl overflow-hidden relative min-h-[292px] w-[400px] shrink-0 flex flex-col justify-between cursor-pointer transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.35)]", selectedGameId === g.id ? "outline outline-2 outline-[#033882] outline-offset-2 shadow-[inset_0_0_16px_rgba(3,56,130,0.18)]" : "shadow-sm")}>

                {/* Split photo background */}
                <div className="absolute inset-0 flex">
                  <div className="relative flex-1">
                    {homePhoto
                      ? <Image src={homePhoto} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                      : <div className="h-full bg-gradient-to-br from-[#023882] to-[#0a52c7]" />}
                  </div>
                  <div className="relative flex-1">
                    {awayPhoto
                      ? <Image src={awayPhoto} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                      : <div className="h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e]" />}
                  </div>
                </div>

                {/* Gradient overlays */}
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 to-transparent" />

                {/* Top: week badge left */}
                <div className="relative z-10 px-3 pt-3">
                  {g.game_number != null && (
                    <span className="text-[11px] font-semibold text-black bg-white rounded-full px-2.5 py-0.5">Week {g.game_number}</span>
                  )}
                </div>

                <div />

                {/* Bottom: logos in corners */}
                <div className="relative z-10 flex items-end justify-between px-3 pb-3">
                  <div onClick={e => { e.stopPropagation(); router.push(`/team/${g.home_team_slug}`) }}>
                    <LogoOrDiv slug={g.home_team_slug} div={g.home_div} size={32} />
                  </div>
                  <div onClick={e => { e.stopPropagation(); router.push(`/team/${g.away_team_slug}`) }}>
                    <LogoOrDiv slug={g.away_team_slug} div={g.away_div} size={32} />
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}
          </motion.div>
        </AnimatePresence>
      </div>
    </RevealFx>
  )
}
