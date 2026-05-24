'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChartSpline, MessageCircle, FileUser, ArrowLeft, ArrowRight } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { AppPanel } from '@/components/AppPanel'
import { PanelChart } from '@/components/PanelChart'
import { PanelChat } from '@/components/PanelChat'
import { RevealFx } from '@/components/RevealFx'
import {
  EditorialHead,
  EditorialButtonGroup,
  HeroStrip,
  PlayerRankedList,
  SectionHead,
  StickyControlBar,
} from '@/components/editorial'
import { TEAM_PHOTOS, SCHOOL_LOGOS, PLAYER_PHOTOS, DIVISION_LOGOS } from '@/lib/team-images'
import { cn, formatSeason } from '@/lib/utils'
import { CURRENT_SEASON } from '@/lib/app-config'

type DivisionSummary = {
  division: string
  team_count: number
  avg_win_pct: number | null
}

type RecentChamp = {
  season: number
  division: string
  team_slug: string
  team_name: string
  overall_wins: number | null
  overall_losses: number | null
}

type GameRow = {
  id: number
  game_date: string | null
  season: number
  home_team_slug: string
  away_team_slug: string
  home_score: number | null
  away_score: number | null
  home_name: string
  away_name: string
  home_school_slug: string | null
  away_school_slug: string | null
}

type LeaderRow = {
  player_slug: string
  player_name: string
  school_name: string
  school_slug: string | null
  pass_yards: number | null
  pass_tds: number | null
  season: number
}

type TeamRow = {
  slug: string
  name: string
  division: string
  school_slug: string | null
  overall_wins: number | null
  overall_losses: number | null
  conference_wins: number | null
  conference_losses: number | null
  season: number
}

const DIV_SLUGS: Record<string, string> = {
  I: 'division-i', II: 'division-ii', III: 'division-iii', IV: 'division-iv',
}
const DIV_ORDER = ['I', 'II', 'III', 'IV']

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const MONO  = { fontFamily: 'var(--font-mono, ui-monospace), monospace' } as const

function fmtPct(w: number | null, l: number | null) {
  const ww = w ?? 0; const ll = l ?? 0
  const g = ww + ll
  return g === 0 ? '—' : (ww / g).toFixed(3).replace(/^0/, '')
}

function fmtGameDate(raw: string | null) {
  if (!raw) return '—'
  const d = new Date(raw + 'T12:00:00')
  return `${d.getMonth() + 1}/${d.getDate()}`
}

export function SectionShell({
  divisionSummary,
  recentChamps,
  allTeams,
  games,
  leaders,
}: {
  divisionSummary: DivisionSummary[]
  recentChamps: RecentChamp[]
  allTeams: TeamRow[]
  games: GameRow[]
  leaders: LeaderRow[]
}) {
  const [chartsOpen,  setChartsOpen]  = useState(false)
  const [playersOpen, setPlayersOpen] = useState(false)
  const [chatOpen,    setChatOpen]    = useState(false)
  const [activeDiv,   setActiveDiv]   = useState<string>('I')
  const [seasonIdx,   setSeasonIdx]   = useState(0)
  const scheduleRef = useRef<HTMLDivElement>(null)
  const leaderRef   = useRef<HTMLDivElement>(null)

  const availableSeasons = [...new Set(allTeams.map(t => t.season))].sort((a, b) => b - a)
  const selectedSeason   = availableSeasons[seasonIdx] ?? CURRENT_SEASON

  const filteredTeams  = allTeams.filter(t => t.division === activeDiv && t.season === selectedSeason)
  const seasonGames    = games.filter(g => g.season === selectedSeason)
  const seasonLeaders  = leaders.filter(l => l.season === selectedSeason)
  const totalTeams     = [...new Set(allTeams.map(t => t.slug))].length

  // Build hero slides from one photo per division
  const heroSlides: string[] = []
  for (const div of DIV_ORDER) {
    for (const team of allTeams.filter(t => t.division === div)) {
      const schoolSlug = team.slug.replace(/-varsity-football$/, '')
      if (TEAM_PHOTOS[schoolSlug]?.[0]) {
        heroSlides.push(TEAM_PHOTOS[schoolSlug][0])
        break
      }
    }
  }

  function shiftSeason(dir: -1 | 1) {
    setSeasonIdx(i => (i + dir + availableSeasons.length) % availableSeasons.length)
  }

  // Team rows for PlayerRankedList
  const teamRows = filteredTeams.map((t, i) => ({
    slug:      t.slug,
    name:      t.name.replace(/\s+Varsity\s+Football$/i, ''),
    schoolSlug: t.school_slug ?? undefined,
    rank:      i + 1,
    primary:   `${t.overall_wins ?? 0}–${t.overall_losses ?? 0}`,
    secondary: fmtPct(t.overall_wins, t.overall_losses),
    href:      `/team/${t.slug}`,
  }))

  return (
    <>
      <AppLayout>
        <div
          className="flex-1 overflow-y-auto no-scrollbar"
          style={{ backgroundColor: 'var(--paper)' }}
        >
          {/* ── Masthead ──────────────────────────────────────────── */}
          <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-10">
            <EditorialHead
              size="xl"
              eyebrow="Section XI · Long Island"
              subhead="The complete record of Suffolk County high school football — four divisions, five seasons, every team on record."
              meta={[
                `${totalTeams} teams`,
                '4 divisions',
                `${availableSeasons.length} seasons of record`,
              ]}
              rightSlot={
                <EditorialButtonGroup
                  buttons={[
                    { icon: ChartSpline,   tooltip: 'Charts',        active: chartsOpen,  onClick: () => setChartsOpen(v => !v) },
                    { icon: FileUser,      tooltip: 'Players',       active: playersOpen, onClick: () => setPlayersOpen(v => !v) },
                    { icon: MessageCircle, tooltip: 'Ask SportsGPT', active: chatOpen,    onClick: () => setChatOpen(v => !v) },
                  ]}
                />
              }
            >
              Section XI
            </EditorialHead>
          </div>

          {/* ── Hero photo strip ──────────────────────────────────── */}
          {heroSlides.length > 0 && (
            <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 mb-14">
              <RevealFx delay={0.1} translateY={8}>
                <HeroStrip slides={heroSlides} height={440} />
              </RevealFx>
            </div>
          )}

          {/* ── Sticky control bar — season selector ─────────────── */}
          <StickyControlBar>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]"
                style={{ fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }}>
                Season
              </span>
              {availableSeasons.length > 1 && (
                <button
                  onClick={() => shiftSeason(-1)}
                  aria-label="Previous season"
                  className="p-1 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              <span
                className="text-[var(--paper-text)] tabular-nums min-w-[5.5rem] text-center"
                style={{ ...SERIF, fontSize: 17, fontStyle: 'italic', fontWeight: 400 }}
              >
                {formatSeason(selectedSeason)}
              </span>
              {availableSeasons.length > 1 && (
                <button
                  onClick={() => shiftSeason(1)}
                  aria-label="Next season"
                  className="p-1 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </StickyControlBar>

          {/* ── Main content ──────────────────────────────────────── */}
          <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-14 pb-24">

            {/* ── Standings ─────────────────────────────────────── */}
            <section className="mb-20 scroll-mt-24">
              <SectionHead
                title="Standings"
                blurb={`${formatSeason(selectedSeason)} season — all four divisions.`}
              />

              {/* Division tabs */}
              <div className="flex items-center gap-0 mb-6 border-b border-[var(--paper-rule)]">
                {DIV_ORDER.map(div => (
                  <button
                    key={div}
                    onClick={() => setActiveDiv(div)}
                    className={cn(
                      'px-4 py-2.5 text-[12px] uppercase tracking-[0.18em] border-b-2 -mb-px transition-colors',
                      activeDiv === div
                        ? 'border-[var(--paper-strong)] text-[var(--paper-strong)]'
                        : 'border-transparent text-[var(--paper-muted)] hover:text-[var(--paper-text)]'
                    )}
                    style={{ fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }}
                  >
                    Div. {div}
                  </button>
                ))}
              </div>

              {teamRows.length > 0
                ? <PlayerRankedList rows={teamRows} />
                : (
                  <p className="py-10 text-center text-sm text-[var(--paper-muted)]"
                    style={{ ...SERIF, fontStyle: 'italic' }}>
                    No standings data for {formatSeason(selectedSeason)}.
                  </p>
                )
              }
            </section>

            {/* ── Schedule ──────────────────────────────────────── */}
            {seasonGames.length > 0 && (
              <section className="mb-20">
                <SectionHead
                  title="Schedule"
                  blurb={`${formatSeason(selectedSeason)} games — most recent first.`}
                  meta={
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => scheduleRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}
                        className="h-7 w-7 rounded-full border border-[var(--paper-rule)] text-[var(--paper-muted)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] flex items-center justify-center transition-colors"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => scheduleRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
                        className="h-7 w-7 rounded-full border border-[var(--paper-rule)] text-[var(--paper-muted)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] flex items-center justify-center transition-colors"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  }
                />
                <div ref={scheduleRef} className="overflow-x-auto no-scrollbar">
                  <div className="flex gap-3 pb-2">
                    {seasonGames.map(g => {
                      const logo  = g.home_school_slug ? SCHOOL_LOGOS[g.home_school_slug] : undefined
                      const scored = g.home_score != null && g.away_score != null
                      return (
                        <Link
                          key={g.id}
                          href={`/game/${g.id}`}
                          className="shrink-0 w-[196px] border border-[var(--paper-rule)] bg-[var(--paper)] px-4 py-3.5 flex flex-col gap-1.5 hover:bg-[var(--paper-quiet)] transition-colors"
                          style={{ borderRadius: 3 }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {logo && (
                              <Image src={logo} alt="" width={18} height={18} className="shrink-0 object-contain" unoptimized />
                            )}
                            <span
                              className="text-[13.5px] text-[var(--paper-text)] truncate leading-snug"
                              style={{ ...SERIF, fontWeight: 500 }}
                            >
                              {g.home_name}
                            </span>
                          </div>
                          <p
                            className="text-[12px] text-[var(--paper-muted)] truncate"
                            style={{ ...SERIF, fontStyle: 'italic' }}
                          >
                            vs {g.away_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {scored ? (
                              <span
                                className="text-[13px] font-medium text-[var(--paper-strong)]"
                                style={MONO}
                              >
                                {g.home_score}–{g.away_score}
                              </span>
                            ) : (
                              <span className="text-[12px] text-[var(--paper-muted)]" style={MONO}>
                                {fmtGameDate(g.game_date)}
                              </span>
                            )}
                            {scored && (
                              <span className="text-[11px] text-[var(--paper-faint)]" style={MONO}>
                                {fmtGameDate(g.game_date)}
                              </span>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* ── Leaderboard ───────────────────────────────────── */}
            {seasonLeaders.length > 0 && (
              <section className="mb-20">
                <SectionHead
                  title="Passing Leaders"
                  blurb={`Top quarterbacks by passing yards — ${formatSeason(selectedSeason)}.`}
                  meta={
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => leaderRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}
                        className="h-7 w-7 rounded-full border border-[var(--paper-rule)] text-[var(--paper-muted)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] flex items-center justify-center transition-colors"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => leaderRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
                        className="h-7 w-7 rounded-full border border-[var(--paper-rule)] text-[var(--paper-muted)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] flex items-center justify-center transition-colors"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  }
                />
                <div ref={leaderRef} className="overflow-x-auto no-scrollbar">
                  <div className="flex gap-3 pb-2">
                    {seasonLeaders.map((p, i) => {
                      const photo = PLAYER_PHOTOS[p.player_slug]
                      const logo  = p.school_slug ? SCHOOL_LOGOS[p.school_slug] : undefined
                      return (
                        <Link
                          key={p.player_slug}
                          href={`/player/${p.player_slug}`}
                          className="shrink-0 w-[196px] border border-[var(--paper-rule)] bg-[var(--paper)] px-4 py-3.5 flex flex-col gap-1.5 hover:bg-[var(--paper-quiet)] transition-colors"
                          style={{ borderRadius: 3 }}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden border border-[var(--paper-rule)] flex items-center justify-center bg-[var(--paper-quiet)]">
                              {photo
                                ? <Image src={photo} alt="" width={32} height={32} className="w-full h-full object-cover" unoptimized />
                                : logo
                                ? <Image src={logo} alt="" width={22} height={22} className="object-contain" unoptimized />
                                : null}
                            </div>
                            <div className="min-w-0">
                              <span
                                className="block text-[13.5px] text-[var(--paper-text)] truncate leading-snug"
                                style={{ ...SERIF, fontWeight: 500 }}
                              >
                                {p.player_name}
                              </span>
                              <span
                                className="block text-[11.5px] text-[var(--paper-muted)] truncate"
                                style={{ ...SERIF, fontStyle: 'italic' }}
                              >
                                {p.school_name}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span
                              className="text-[13px] font-medium text-[var(--paper-strong)]"
                              style={MONO}
                            >
                              {(p.pass_yards ?? 0).toLocaleString()} YDS
                            </span>
                            <span className="text-[12px] text-[var(--paper-muted)]" style={MONO}>
                              {p.pass_tds ?? '—'} TD
                            </span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </section>
            )}

            {/* ── Divisions ─────────────────────────────────────── */}
            {divisionSummary.length > 0 && (
              <section className="mb-8">
                <SectionHead
                  title="Divisions"
                  blurb="The four classifications of Section XI football."
                />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {divisionSummary.map(d => {
                    const divNum = ({ I: 1, II: 2, III: 3, IV: 4 } as Record<string, number>)[d.division]
                    const logo   = divNum ? DIVISION_LOGOS[divNum] : undefined
                    return (
                      <Link
                        key={d.division}
                        href={`/division/${DIV_SLUGS[d.division]}`}
                        className="group border border-[var(--paper-rule)] bg-[var(--paper)] px-5 py-5 flex flex-col gap-3 hover:bg-[var(--paper-quiet)] transition-colors"
                        style={{ borderRadius: 3 }}
                      >
                        {logo && (
                          <Image src={logo} alt="" width={36} height={36} className="object-contain opacity-80 group-hover:opacity-100 transition-opacity" unoptimized />
                        )}
                        <div>
                          <p
                            className="text-[var(--paper-text)] group-hover:text-[var(--paper-strong)] transition-colors leading-snug"
                            style={{ ...SERIF, fontSize: 17, fontWeight: 500, letterSpacing: '-0.005em' }}
                          >
                            Division {d.division}
                          </p>
                          <p
                            className="mt-0.5 text-[12px] text-[var(--paper-muted)]"
                            style={{ ...SERIF, fontStyle: 'italic' }}
                          >
                            {d.team_count} teams
                          </p>
                        </div>
                        {d.avg_win_pct != null && (
                          <span
                            className="text-[12px] text-[var(--paper-strong)] font-medium"
                            style={MONO}
                          >
                            {(d.avg_win_pct * 100).toFixed(1)}% avg win
                          </span>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

          </div>
        </div>
      </AppLayout>

      <PanelChart open={chartsOpen}  onClose={() => setChartsOpen(false)} />
      <AppPanel   open={playersOpen} onClose={() => setPlayersOpen(false)} title="Players" />
      <PanelChat  open={chatOpen}    onClose={() => setChatOpen(false)} countyName="Section XI" />
    </>
  )
}
