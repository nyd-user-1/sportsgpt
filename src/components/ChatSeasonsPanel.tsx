'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, ArrowRight, ChevronRight } from 'lucide-react'
import { AppPanel } from '@/components/AppPanel'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { formatSeason } from '@/lib/utils'

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans), system-ui, sans-serif' }
const MONO:  React.CSSProperties = { fontFamily: 'var(--font-mono), ui-monospace, monospace' }

// ── Types ─────────────────────────────────────────────────────────────────────

export type TeamMeta = { slug: string; name: string }

type SeasonRecord = {
  season: number; wins: number; losses: number; ties: number
  conf_wins: number; conf_losses: number; name: string; division: string; school_slug: string
}

type ScheduleGame = {
  id: number; week: number | null; game_date: string | null; side: string
  team_score: number | null; opp_score: number | null; opponent_name: string; opp_slug: string
}

type PlayerStat = {
  player_name: string; player_slug: string | null; school_slug: string; team_name: string; stat_type: string
  rush_att: number | null; rush_yds: number | null; rush_tds: number | null
  pass_comp: number | null; pass_att: number | null; pass_yds: number | null; pass_tds: number | null; pass_int: number | null
  rec_rec: number | null; rec_yds: number | null; rec_tds: number | null
}

type GameSummary = {
  game: {
    id: number; season: number; game_number: number | null; game_date: string | null
    home_team_slug: string; away_team_slug: string
    home_score: number | null; away_score: number | null
    home_name: string; home_school: string; away_name: string; away_school: string
  } | null
  quarterScores: Record<string, unknown> | null
  playerStats: PlayerStat[]
}

type PanelView =
  | { type: 'seasons'; team: TeamMeta }
  | { type: 'schedule'; team: TeamMeta; season: number }
  | { type: 'game'; gameId: number; team: TeamMeta; season: number }

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(raw: string | null) {
  if (!raw) return null
  const d = new Date(raw)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
}

function stripVarsity(name: string) {
  return name.replace(/\s+Varsity Football$/i, '')
}

function SchoolLogo({ slug, size = 28 }: { slug: string; size?: number }) {
  const src = SCHOOL_LOGOS[slug]
  if (!src) {
    return (
      <div
        style={{ width: size, height: size }}
        className="rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)]"
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full overflow-hidden bg-[var(--paper-quiet)] border border-[var(--paper-rule)] flex items-center justify-center"
    >
      <Image
        src={src}
        alt=""
        width={Math.round(size * 0.78)}
        height={Math.round(size * 0.78)}
        className="object-contain"
        unoptimized
      />
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-5 pt-6 pb-2 border-t border-[var(--paper-rule)] first:border-t-0">
      <span
        className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]"
        style={SANS}
      >
        {label}
      </span>
    </div>
  )
}

// ── Level views ───────────────────────────────────────────────────────────────

function SeasonsView({ team, onSelect }: { team: TeamMeta; onSelect: (s: number) => void }) {
  const [records, setRecords] = useState<SeasonRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/team/${team.slug}/records`)
      .then(r => r.json())
      .then(d => { setRecords(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [team.slug])

  if (loading) return (
    <div className="px-5 py-6 space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 bg-[var(--paper-quiet)] animate-pulse rounded" />
      ))}
    </div>
  )

  if (!records.length) return (
    <p
      className="px-5 py-10 text-center text-sm text-[var(--paper-muted)]"
      style={{ ...SERIF, fontStyle: 'italic' }}
    >
      No season records found.
    </p>
  )

  return (
    <ol className="flex flex-col">
      <SectionHeader label="Seasons" />
      {records.map((r, i) => {
        const total = r.wins + r.losses + (r.ties ?? 0)
        const pct = total > 0 ? ((r.wins / total) * 100).toFixed(0) : '—'
        return (
          <li
            key={r.season}
            className={i > 0 ? 'border-t border-[var(--paper-rule-soft)]' : ''}
          >
            <button
              onClick={() => onSelect(r.season)}
              className="group/row w-full flex items-center gap-3 sm:gap-4 px-5 py-4 transition-colors hover:bg-[color:color-mix(in_srgb,var(--paper-text)_4%,transparent)] text-left"
            >
              <SchoolLogo slug={r.school_slug} size={36} />

              <span
                className="text-[var(--paper-faint)] tabular-nums text-[13px] shrink-0"
                style={MONO}
              >
                {String(i + 1).padStart(2, ' ')}.
              </span>

              <div className="flex-1 min-w-0">
                <p
                  className="text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] transition-colors leading-tight truncate"
                  style={{ ...SERIF, fontSize: 17, fontWeight: 500, letterSpacing: '-0.005em' }}
                >
                  {formatSeason(r.season)}
                </p>
                <p
                  className="mt-0.5 text-[13px] text-[var(--paper-muted)] truncate"
                  style={{ ...SERIF, fontStyle: 'italic' }}
                >
                  {r.wins}–{r.losses}{r.ties > 0 ? `–${r.ties}` : ''} · Division {r.division}
                </p>
              </div>

              <div className="shrink-0 flex items-baseline gap-1">
                <span
                  className="text-[13.5px] tabular-nums text-[var(--paper-text)] font-medium"
                  style={MONO}
                >
                  {pct}
                </span>
                <span
                  className="text-[10px] text-[var(--paper-muted)]"
                  style={SANS}
                >
                  %
                </span>
              </div>

              <ChevronRight className="h-4 w-4 text-[var(--paper-faint)] group-hover/row:text-[var(--paper-strong)] transition-colors shrink-0" />
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function ScheduleView({
  team, season, onSelectGame,
}: {
  team: TeamMeta
  season: number
  onSelectGame: (gameId: number) => void
}) {
  const [games, setGames] = useState<ScheduleGame[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/team/${team.slug}/schedule/${season}`)
      .then(r => r.json())
      .then(d => { setGames(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [team.slug, season])

  if (loading) return (
    <div className="px-5 py-6 space-y-2">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-12 bg-[var(--paper-quiet)] animate-pulse rounded" />
      ))}
    </div>
  )

  if (!games.length) return (
    <p
      className="px-5 py-10 text-center text-sm text-[var(--paper-muted)]"
      style={{ ...SERIF, fontStyle: 'italic' }}
    >
      No games found for this season.
    </p>
  )

  return (
    <ol className="flex flex-col">
      <SectionHeader label="Schedule" />
      {games.map((g, i) => {
        const won  = g.team_score != null && g.opp_score != null && g.team_score > g.opp_score
        const lost = g.team_score != null && g.opp_score != null && g.team_score < g.opp_score
        const hasScore = g.team_score != null
        const resultLetter = won ? 'W' : lost ? 'L' : hasScore ? 'T' : null
        return (
          <li
            key={g.id}
            className={i > 0 ? 'border-t border-[var(--paper-rule-soft)]' : ''}
          >
            <button
              onClick={() => onSelectGame(g.id)}
              className="group/row w-full flex items-center gap-3 sm:gap-4 px-5 py-4 transition-colors hover:bg-[color:color-mix(in_srgb,var(--paper-text)_4%,transparent)] text-left"
            >
              <SchoolLogo slug={g.opp_slug} size={32} />

              <span
                className="text-[var(--paper-faint)] tabular-nums text-[13px] shrink-0"
                style={MONO}
              >
                {g.week != null ? `W${String(g.week).padStart(2, '0')}` : String(i + 1).padStart(2, ' ') + '.'}
              </span>

              <div className="flex-1 min-w-0">
                <p
                  className="text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] transition-colors leading-tight truncate"
                  style={{ ...SERIF, fontSize: 16, fontWeight: 500, letterSpacing: '-0.005em' }}
                >
                  {g.side === 'home' ? 'vs.' : 'at'} {stripVarsity(g.opponent_name)}
                </p>
                {g.game_date && (
                  <p
                    className="mt-0.5 text-[12.5px] text-[var(--paper-muted)] truncate"
                    style={{ ...SERIF, fontStyle: 'italic' }}
                  >
                    {fmtDate(g.game_date)}
                  </p>
                )}
              </div>

              {hasScore ? (
                <div className="shrink-0 flex items-baseline gap-1.5">
                  <span
                    className={`text-[11px] font-medium ${won ? 'text-emerald-500' : lost ? 'text-rose-500' : 'text-[var(--paper-muted)]'}`}
                    style={SANS}
                  >
                    {resultLetter}
                  </span>
                  <span
                    className="text-[13.5px] tabular-nums text-[var(--paper-text)] font-medium"
                    style={MONO}
                  >
                    {g.team_score}–{g.opp_score}
                  </span>
                </div>
              ) : (
                <span
                  className="text-[10px] uppercase tracking-[0.18em] text-[var(--paper-faint)] shrink-0"
                  style={SANS}
                >
                  Upcoming
                </span>
              )}

              <ChevronRight className="h-4 w-4 text-[var(--paper-faint)] group-hover/row:text-[var(--paper-strong)] transition-colors shrink-0" />
            </button>
          </li>
        )
      })}
    </ol>
  )
}

function GameView({ gameId }: { gameId: number }) {
  const [data, setData] = useState<GameSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/game/${gameId}/summary`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [gameId])

  if (loading) return (
    <div className="px-5 py-6 space-y-3">
      <div className="h-20 bg-[var(--paper-quiet)] animate-pulse rounded" />
      <div className="h-32 bg-[var(--paper-quiet)] animate-pulse rounded" />
      <div className="h-32 bg-[var(--paper-quiet)] animate-pulse rounded" />
    </div>
  )

  if (!data?.game) return (
    <p
      className="px-5 py-10 text-center text-sm text-[var(--paper-muted)]"
      style={{ ...SERIF, fontStyle: 'italic' }}
    >
      Game data not available.
    </p>
  )

  const { game, playerStats } = data
  const homeWon = (game.home_score ?? 0) > (game.away_score ?? 0)

  // Quarter breakdown from JSONB
  const qs = data.quarterScores as Record<string, { q1?: number; q2?: number; q3?: number; q4?: number; ot1?: number; final?: number }[]> | null
  const homeRow = qs?.home?.[0]
  const awayRow = qs?.away?.[0]

  // Group player stats
  const rushers  = playerStats.filter(p => p.stat_type === 'Rushing'   && (p.rush_yds ?? 0) > 0)
    .sort((a, b) => (b.rush_yds ?? 0) - (a.rush_yds ?? 0)).slice(0, 4)
  const passers  = playerStats.filter(p => p.stat_type === 'Passing'   && (p.pass_yds ?? 0) > 0)
    .sort((a, b) => (b.pass_yds ?? 0) - (a.pass_yds ?? 0)).slice(0, 3)
  const receivers = playerStats.filter(p => p.stat_type === 'Receiving' && (p.rec_yds ?? 0) > 0)
    .sort((a, b) => (b.rec_yds ?? 0) - (a.rec_yds ?? 0)).slice(0, 4)

  return (
    <div className="pb-6">
      {/* Final score — editorial split */}
      <div className="px-5 pt-6">
        <p
          className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)] mb-3"
          style={SANS}
        >
          Final · Week {game.game_number ?? '?'}{game.game_date ? ` · ${fmtDate(game.game_date)}` : ''}
        </p>

        <div className="flex flex-col">
          {[
            { name: game.away_name, school: game.away_school, score: game.away_score, row: awayRow, won: !homeWon },
            { name: game.home_name, school: game.home_school, score: game.home_score, row: homeRow, won: homeWon },
          ].map((t, idx) => (
            <div
              key={t.school}
              className={`flex items-center gap-3 py-3 ${idx === 0 ? '' : 'border-t border-[var(--paper-rule-soft)]'}`}
            >
              <SchoolLogo slug={t.school} size={32} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Link
                    href={`/team/${t.school}-varsity-football`}
                    aria-label={`${stripVarsity(t.name)} team page`}
                    className="group/arrow flex items-center gap-1.5 min-w-0 truncate text-[var(--paper-text)] hover:text-[var(--paper-strong)] transition-colors"
                    style={{ ...SERIF, fontSize: 16, fontWeight: 500, letterSpacing: '-0.005em' }}
                  >
                    <span className="truncate">{stripVarsity(t.name)}</span>
                    <span className="relative inline-flex items-center justify-center w-5 h-5 shrink-0 text-[var(--paper-faint)] group-hover/arrow:text-[var(--paper-strong)] transition-colors duration-150">
                      <ArrowUpRight className="h-3.5 w-3.5 absolute transition-all duration-200 group-hover/arrow:opacity-0 group-hover/arrow:scale-75" />
                      <ArrowRight  className="h-3.5 w-3.5 absolute transition-all duration-200 opacity-0 group-hover/arrow:opacity-100 group-hover/arrow:translate-x-0.5" />
                    </span>
                  </Link>
                </div>
                {(homeRow || awayRow) && (
                  <div className="mt-1 flex gap-3 text-[11px] tabular-nums text-[var(--paper-muted)]" style={MONO}>
                    {[t.row?.q1, t.row?.q2, t.row?.q3, t.row?.q4].map((q, i) => (
                      <span key={i}>{q ?? 0}</span>
                    ))}
                    {t.row?.ot1 != null && t.row.ot1 > 0 && <span>{t.row.ot1}</span>}
                  </div>
                )}
              </div>
              <span
                className={`shrink-0 flex items-baseline gap-1.5 tabular-nums ${t.won ? 'text-emerald-500' : 'text-rose-500'}`}
                style={MONO}
              >
                <span className="text-[12px] font-semibold uppercase tracking-[0.12em]">
                  {t.won ? 'W' : 'L'}
                </span>
                <span className="text-[22px] font-medium">
                  {t.score ?? '—'}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stat sections — flat editorial pattern */}
      {passers.length > 0 && (
        <>
          <SectionHeader label="Passing" />
          <StatRows rows={passers.map(p => ({
            name: p.player_name, slug: p.player_slug, school: p.school_slug,
            value: String(p.pass_yds ?? 0),
            unit: 'yds',
            meta: `${p.pass_comp ?? 0}/${p.pass_att ?? 0}${p.pass_tds ? ` · ${p.pass_tds} TD` : ''}`,
          }))} />
        </>
      )}
      {rushers.length > 0 && (
        <>
          <SectionHeader label="Rushing" />
          <StatRows rows={rushers.map(p => ({
            name: p.player_name, slug: p.player_slug, school: p.school_slug,
            value: String(p.rush_yds ?? 0),
            unit: 'yds',
            meta: `${p.rush_att ?? 0} att${p.rush_tds ? ` · ${p.rush_tds} TD` : ''}`,
          }))} />
        </>
      )}
      {receivers.length > 0 && (
        <>
          <SectionHeader label="Receiving" />
          <StatRows rows={receivers.map(p => ({
            name: p.player_name, slug: p.player_slug, school: p.school_slug,
            value: String(p.rec_yds ?? 0),
            unit: 'yds',
            meta: `${p.rec_rec ?? 0} rec${p.rec_tds ? ` · ${p.rec_tds} TD` : ''}`,
          }))} />
        </>
      )}

      {/* Full page link */}
      <div className="px-5 mt-8 pt-6 border-t border-[var(--paper-rule)]">
        <Link
          href={`/game/${gameId}`}
          className="group/link inline-flex items-center gap-1.5 text-[var(--paper-strong)] hover:opacity-80 transition-opacity"
          style={{ ...SERIF, fontStyle: 'italic', fontSize: 14 }}
        >
          View full game page
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

function ChatPanelFooter({ label }: { label: string }) {
  return (
    <div className="px-5 py-3.5 bg-[var(--paper)]">
      <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>
        {label}
      </span>
    </div>
  )
}

function StatRows({
  rows,
}: {
  rows: { name: string; slug: string | null; school: string; value: string; unit: string; meta: string }[]
}) {
  return (
    <ol className="flex flex-col">
      {rows.map((r, i) => {
        const Row = (
          <div className="group/row flex items-center gap-3 px-5 py-3 transition-colors hover:bg-[color:color-mix(in_srgb,var(--paper-text)_4%,transparent)]">
            <span
              className="shrink-0 tabular-nums text-[var(--paper-faint)] w-5 text-right"
              style={{ ...MONO, fontSize: 11 }}
            >
              {i + 1}.
            </span>
            <SchoolLogo slug={r.school} size={26} />
            <div className="flex-1 min-w-0">
              <p
                className="text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] transition-colors leading-tight truncate"
                style={{ ...SERIF, fontSize: 15, fontWeight: 500 }}
              >
                {r.name}
              </p>
              <p
                className="mt-0.5 text-[12px] text-[var(--paper-muted)] truncate"
                style={{ ...SERIF, fontStyle: 'italic' }}
              >
                {r.meta}
              </p>
            </div>
            <div className="shrink-0 flex items-baseline gap-1">
              <span className="text-[13.5px] tabular-nums text-[var(--paper-text)] font-medium" style={MONO}>{r.value}</span>
              <span className="text-[10px] text-[var(--paper-muted)]" style={SANS}>{r.unit}</span>
            </div>
          </div>
        )
        return (
          <li
            key={i}
            className={i > 0 ? 'border-t border-[var(--paper-rule-soft)]' : ''}
          >
            {r.slug ? <Link href={`/player/${r.slug}`}>{Row}</Link> : Row}
          </li>
        )
      })}
    </ol>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ChatSeasonsPanel({
  open,
  onClose,
  teams,
  initialSeason,
  initialGameId,
  initialGameSeason,
}: {
  open: boolean
  onClose: () => void
  teams: TeamMeta[]
  /** When provided, panel opens directly at the Schedule view for that season (skipping Seasons). */
  initialSeason?: number | null
  /** When provided with `initialGameSeason`, panel opens directly at the Game view with the
   *  Seasons → Schedule history pre-populated so the user can press Back to reach them. */
  initialGameId?: number | null
  initialGameSeason?: number | null
}) {
  const [viewStack, setViewStack] = useState<PanelView[]>([])

  // Reset stack when panel opens with new teams / season / game
  useEffect(() => {
    if (open && teams.length > 0) {
      if (initialGameId != null && initialGameSeason != null) {
        setViewStack([
          { type: 'seasons', team: teams[0] },
          { type: 'schedule', team: teams[0], season: initialGameSeason },
          { type: 'game', gameId: initialGameId, team: teams[0], season: initialGameSeason },
        ])
      } else if (initialSeason != null) {
        setViewStack([{ type: 'schedule', team: teams[0], season: initialSeason }])
      } else {
        setViewStack([{ type: 'seasons', team: teams[0] }])
      }
    }
  }, [open, teams, initialSeason, initialGameId, initialGameSeason])

  const currentView = viewStack[viewStack.length - 1] ?? null
  const canGoBack = viewStack.length > 1

  const pushView = (v: PanelView) => setViewStack(s => [...s, v])
  const popView  = () => setViewStack(s => s.slice(0, -1))

  // Standard team-name title across all three views
  const titleText = currentView ? stripVarsity(currentView.team.name) : ''

  const title = (
    <div className="flex items-center gap-2 min-w-0">
      {canGoBack && (
        <button
          onClick={popView}
          className="shrink-0 p-1 rounded-lg text-[var(--paper-faint)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}
      {!canGoBack && (
        <SchoolLogo slug={teams[0]?.slug ?? ''} size={22} />
      )}
      {currentView ? (
        <Link
          href={`/team/${currentView.team.slug}-varsity-football`}
          className="text-[var(--paper-text)] hover:text-[var(--paper-strong)] transition-colors truncate"
          style={{ ...SERIF, fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em' }}
        >
          {titleText}
        </Link>
      ) : (
        <span
          className="text-[var(--paper-text)] truncate"
          style={{ ...SERIF, fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em' }}
        >
          {titleText}
        </span>
      )}
    </div>
  )

  const footerLabel = currentView?.type === 'seasons'  ? 'Seasons Panel'
    : currentView?.type === 'schedule' ? 'Schedule Panel'
    : currentView?.type === 'game'     ? 'Game Log Panel'
    : null

  const footer = footerLabel ? <ChatPanelFooter label={footerLabel} /> : undefined

  return (
    <AppPanel open={open} onClose={onClose} title={title} footer={footer}>
      {currentView?.type === 'seasons' && (
        <SeasonsView
          team={currentView.team}
          onSelect={(season) => pushView({ type: 'schedule', team: currentView.team, season })}
        />
      )}
      {currentView?.type === 'schedule' && (
        <ScheduleView
          team={currentView.team}
          season={currentView.season}
          onSelectGame={(gameId) => pushView({ type: 'game', gameId, team: currentView.team, season: currentView.season })}
        />
      )}
      {currentView?.type === 'game' && (
        <GameView gameId={currentView.gameId} />
      )}
    </AppPanel>
  )
}
