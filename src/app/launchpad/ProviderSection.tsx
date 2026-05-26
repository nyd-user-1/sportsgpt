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

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }

function LogoOrDiv({ slug, div, size = 40 }: { slug: string; div: string; size?: number }) {
  const schoolSlug = slug.replace(/-varsity-football$/, '')
  const logo = SCHOOL_LOGOS[schoolSlug]
  const cls = `shrink-0 rounded-full object-contain bg-white border border-white/40`
  return logo ? (
    <Image src={logo} alt="" width={size} height={size} className={cls} unoptimized />
  ) : (
    <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-black/40 border border-white/30 text-xs font-bold text-white"
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
      {/* Season tabs — editorial underline row */}
      <div className="sticky top-0 z-10 flex items-center border-b border-[var(--paper-rule)] mb-4"
        style={{ background: 'color-mix(in srgb, var(--paper) 92%, transparent)', backdropFilter: 'blur(8px)' }}>
        {SEASONS.map((s, i) => {
          const on = seasonIdx === i
          return (
            <button key={s} onClick={() => handleSeason(i)}
              className={cn(
                'px-4 py-3 text-[11px] uppercase tracking-[0.22em] whitespace-nowrap border-b-2 -mb-px transition-colors first:pl-0',
                on
                  ? 'border-[var(--paper-strong)] text-[var(--paper-strong)]'
                  : 'border-transparent text-[var(--paper-muted)] hover:text-[var(--paper-text)]',
              )}
              style={SANS}
            >
              {formatSeason(Number(s))}
            </button>
          )
        })}
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
        <p
          className="text-[14px] text-[var(--paper-muted)] py-8 text-center"
          style={{ ...SERIF, fontStyle: 'italic' }}
        >
          No games found for {activeSeason}{activeDivision ? ` · Division ${activeDivision}` : ''}.
        </p>
      ) : (
        <div ref={scrollRef} className="flex gap-4 py-3 overflow-x-auto no-scrollbar">
          {filtered.map(g => {
            const scored  = g.home_score != null && g.away_score != null
            const homeSchool = g.home_team_slug.replace(/-varsity-football$/, '')
            const awaySchool = g.away_team_slug.replace(/-varsity-football$/, '')
            const homePhoto  = TEAM_PHOTOS[homeSchool]?.[0]
            const awayPhoto  = TEAM_PHOTOS[awaySchool]?.[0]
            const onSel      = selectedGameId === g.id
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
                className={cn(
                  "group w-[400px] shrink-0 cursor-pointer transition-all border bg-[var(--paper-quiet)]",
                  onSel ? "border-[var(--paper-strong)]" : "border-[var(--paper-rule)] hover:border-[var(--paper-text)]"
                )}
                style={{ padding: 6, borderRadius: 3 }}
              >
                <div className="relative overflow-hidden min-h-[280px] flex flex-col justify-between"
                  style={{ borderRadius: 1 }}>

                  {/* Split photo background */}
                  <div className="absolute inset-0 flex">
                    <div className="relative flex-1">
                      {homePhoto
                        ? <Image src={homePhoto} alt="" fill className="object-cover object-top" unoptimized />
                        : <div className="h-full bg-gradient-to-br from-[#023882] to-[#0a52c7]" />}
                    </div>
                    <div className="relative flex-1">
                      {awayPhoto
                        ? <Image src={awayPhoto} alt="" fill className="object-cover object-top" unoptimized />
                        : <div className="h-full bg-gradient-to-br from-[#1a1a2e] to-[#16213e]" />}
                    </div>
                  </div>

                  {/* Gradient overlays */}
                  <div className="absolute inset-0 bg-black/35" />
                  <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 to-transparent" />

                  {/* Top: week badge left, score right */}
                  <div className="relative z-10 px-3 pt-3 flex items-start justify-between">
                    {g.game_number != null ? (
                      <span
                        className="text-[10px] uppercase tracking-[0.22em] px-2 py-1 border border-white/30 bg-black/45 backdrop-blur-sm text-white/95"
                        style={{ ...SANS, borderRadius: 2 }}
                      >
                        Week {g.game_number}
                      </span>
                    ) : <span />}
                    {scored && (
                      <span
                        className="text-[13px] tabular-nums px-2 py-1 border border-white/30 bg-black/45 backdrop-blur-sm text-white"
                        style={{ ...SANS, borderRadius: 2 }}
                      >
                        {g.home_score}–{g.away_score}
                      </span>
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
