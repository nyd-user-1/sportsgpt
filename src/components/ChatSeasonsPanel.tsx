'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, ChevronRight } from 'lucide-react'
import { AppPanel } from '@/components/AppPanel'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { formatSeason } from '@/lib/utils'

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
  if (!src) return <div style={{ width: size, height: size }} className="rounded-full bg-[var(--inp-bg)]" />
  return <Image src={src} alt="" width={size} height={size} className="object-contain" />
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
    <div className="p-4 space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-[var(--inp-bg)] animate-pulse" />
      ))}
    </div>
  )

  if (!records.length) return <p className="p-6 text-sm text-[var(--muted)]">No season records found.</p>

  return (
    <div className="divide-y divide-[var(--border)]">
      {records.map(r => {
        const total = r.wins + r.losses + (r.ties ?? 0)
        const pct = total > 0 ? ((r.wins / total) * 100).toFixed(0) : '—'
        return (
          <button
            key={r.season}
            onClick={() => onSelect(r.season)}
            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--inp-bg)] transition-colors group"
          >
            <SchoolLogo slug={r.school_slug} size={32} />
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-[var(--txt)]">{formatSeason(r.season)}</div>
              <div className="text-xs text-[var(--muted)]">
                {r.wins}–{r.losses}{r.ties > 0 ? `–${r.ties}` : ''} · Div. {r.division}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm tabular-nums font-medium text-[var(--txt2)]">{pct}%</span>
              <ChevronRight className="h-4 w-4 text-[var(--muted)] group-hover:text-[var(--txt)] transition-colors" />
            </div>
          </button>
        )
      })}
    </div>
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
    <div className="p-4 space-y-2">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-12 rounded-xl bg-[var(--inp-bg)] animate-pulse" />
      ))}
    </div>
  )

  if (!games.length) return <p className="p-6 text-sm text-[var(--muted)]">No games found for this season.</p>

  return (
    <div className="divide-y divide-[var(--border)]">
      {games.map(g => {
        const won = g.team_score != null && g.opp_score != null && g.team_score > g.opp_score
        const lost = g.team_score != null && g.opp_score != null && g.team_score < g.opp_score
        const hasScore = g.team_score != null
        return (
          <button
            key={g.id}
            onClick={() => onSelectGame(g.id)}
            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[var(--inp-bg)] transition-colors group"
          >
            {/* Opponent */}
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <SchoolLogo slug={g.opp_slug} size={22} />
                <span className="text-sm font-medium text-[var(--txt)] truncate">
                  {g.side === 'home' ? 'vs.' : 'at'} {stripVarsity(g.opponent_name)}
                </span>
              </div>
              <div className="text-xs text-[var(--muted)] mt-0.5 pl-[30px]">
                {g.week != null && `Week ${g.week}`}
                {g.week != null && g.game_date && ' · '}
                {fmtDate(g.game_date)}
              </div>
            </div>
            {/* Score */}
            {hasScore ? (
              <span className={`text-sm tabular-nums font-semibold shrink-0 ${won ? 'text-green-600 dark:text-green-400' : lost ? 'text-red-600 dark:text-red-400' : 'text-[var(--txt2)]'}`}>
                {g.team_score}–{g.opp_score}
              </span>
            ) : (
              <span className="text-xs text-[var(--muted)]">Upcoming</span>
            )}
            <ChevronRight className="h-4 w-4 text-[var(--muted)] group-hover:text-[var(--txt)] transition-colors shrink-0" />
          </button>
        )
      })}
    </div>
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
    <div className="p-4 space-y-3">
      <div className="h-20 rounded-xl bg-[var(--inp-bg)] animate-pulse" />
      <div className="h-32 rounded-xl bg-[var(--inp-bg)] animate-pulse" />
      <div className="h-32 rounded-xl bg-[var(--inp-bg)] animate-pulse" />
    </div>
  )

  if (!data?.game) return <p className="p-6 text-sm text-[var(--muted)]">Game data not available.</p>

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
    <div className="pb-4">
      {/* Score card */}
      <div className="mx-4 mt-4 rounded-xl border border-[var(--border)] overflow-hidden">
        {/* Team rows */}
        {[
          { name: game.away_name, school: game.away_school, score: game.away_score, row: awayRow, won: !homeWon },
          { name: game.home_name, school: game.home_school, score: game.home_score, row: homeRow, won: homeWon },
        ].map((t) => (
          <div key={t.school} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] last:border-0">
            <SchoolLogo slug={t.school} size={28} />
            <span className={`flex-1 text-sm font-medium ${t.won ? 'text-[var(--txt)]' : 'text-[var(--muted)]'}`}>{t.name}</span>
            {/* Quarters */}
            {(homeRow || awayRow) && (
              <div className="hidden sm:flex gap-3 text-xs tabular-nums text-[var(--muted)]">
                {[t.row?.q1, t.row?.q2, t.row?.q3, t.row?.q4].map((q, i) => (
                  <span key={i}>{q ?? 0}</span>
                ))}
                {t.row?.ot1 != null && t.row.ot1 > 0 && <span>{t.row.ot1}</span>}
              </div>
            )}
            <span className={`text-lg font-bold tabular-nums ml-2 ${t.won ? 'text-[var(--txt)]' : 'text-[var(--muted)]'}`}>
              {t.score ?? '—'}
            </span>
          </div>
        ))}
      </div>

      {/* Game date */}
      {game.game_date && (
        <p className="px-5 mt-2 text-xs text-[var(--muted)]">
          Week {game.game_number ?? '?'} · {fmtDate(game.game_date)}
        </p>
      )}

      {/* Stat sections */}
      {passers.length > 0 && <StatSection title="Passing" rows={passers.map(p => ({
        name: p.player_name, slug: p.player_slug, school: p.school_slug,
        line: `${p.pass_comp ?? 0}/${p.pass_att ?? 0} · ${p.pass_yds ?? 0} yds${p.pass_tds ? ` · ${p.pass_tds} TD` : ''}`,
      }))} />}
      {rushers.length > 0 && <StatSection title="Rushing" rows={rushers.map(p => ({
        name: p.player_name, slug: p.player_slug, school: p.school_slug,
        line: `${p.rush_att ?? 0} att · ${p.rush_yds ?? 0} yds${p.rush_tds ? ` · ${p.rush_tds} TD` : ''}`,
      }))} />}
      {receivers.length > 0 && <StatSection title="Receiving" rows={receivers.map(p => ({
        name: p.player_name, slug: p.player_slug, school: p.school_slug,
        line: `${p.rec_rec ?? 0} rec · ${p.rec_yds ?? 0} yds${p.rec_tds ? ` · ${p.rec_tds} TD` : ''}`,
      }))} />}

      {/* Full page link */}
      <div className="mx-4 mt-4">
        <Link href={`/game/${gameId}`}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--txt2)] hover:text-[#033882] hover:border-[#033882]/30 transition-colors">
          View Full Game Page <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}

function StatSection({
  title, rows,
}: {
  title: string
  rows: { name: string; slug: string | null; school: string; line: string }[]
}) {
  return (
    <div className="mx-4 mt-3 rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="px-4 py-2 bg-[var(--inp-bg)] border-b border-[var(--border)]">
        <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">{title}</span>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2.5 px-4 py-2.5">
            <SchoolLogo slug={r.school} size={22} />
            <div className="flex-1 min-w-0">
              {r.slug ? (
                <Link href={`/player/${r.slug}`} className="text-sm font-medium text-[#033882] hover:underline truncate block">
                  {r.name}
                </Link>
              ) : (
                <span className="text-sm font-medium text-[var(--txt)] truncate block">{r.name}</span>
              )}
            </div>
            <span className="text-xs tabular-nums text-[var(--muted)] shrink-0">{r.line}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ChatSeasonsPanel({
  open,
  onClose,
  teams,
}: {
  open: boolean
  onClose: () => void
  teams: TeamMeta[]
}) {
  const [viewStack, setViewStack] = useState<PanelView[]>([])

  // Reset to seasons view when panel opens with new teams
  useEffect(() => {
    if (open && teams.length > 0) {
      setViewStack([{ type: 'seasons', team: teams[0] }])
    }
  }, [open, teams])

  const currentView = viewStack[viewStack.length - 1] ?? null
  const canGoBack = viewStack.length > 1

  const pushView = (v: PanelView) => setViewStack(s => [...s, v])
  const popView  = () => setViewStack(s => s.slice(0, -1))

  // Build title
  const titleText = (() => {
    if (!currentView) return 'Seasons'
    if (currentView.type === 'seasons') return currentView.team.name
    if (currentView.type === 'schedule') return `${formatSeason(currentView.season)} Season`
    if (currentView.type === 'game') return 'Game Log'
    return ''
  })()

  const title = (
    <div className="flex items-center gap-1.5 min-w-0">
      {canGoBack && (
        <button
          onClick={popView}
          className="shrink-0 p-1 rounded-lg text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      )}
      {currentView?.type === 'seasons' && (
        <div className="shrink-0">
          <SchoolLogo slug={teams[0]?.slug ?? ''} size={22} />
        </div>
      )}
      <span className="font-semibold text-[var(--txt)] truncate">{titleText}</span>
      {currentView?.type === 'schedule' && (
        <span className="text-xs text-[var(--muted)] truncate">· {currentView.team.name}</span>
      )}
    </div>
  )

  const detailHref = currentView?.type === 'seasons'
    ? `/team/${currentView.team.slug}-varsity-football`
    : currentView?.type === 'game'
    ? `/game/${currentView.gameId}`
    : undefined

  return (
    <AppPanel open={open} onClose={onClose} title={title} detailHref={detailHref}>
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
