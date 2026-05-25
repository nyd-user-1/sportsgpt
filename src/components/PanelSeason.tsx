'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { AppPanel } from '@/components/AppPanel'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { formatSeason } from '@/lib/utils'
import { GameContent } from '@/components/PanelGameLog'

// ── Style constants ───────────────────────────────────────────────────────────

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans), system-ui, sans-serif' }
const MONO:  React.CSSProperties = { fontFamily: 'var(--font-mono), ui-monospace, monospace' }

// ── Types ─────────────────────────────────────────────────────────────────────

type SeasonRecord = {
  season: number; wins: number; losses: number; ties: number
  conf_wins: number; conf_losses: number; name: string; division: string; school_slug: string
}

type ScheduleGame = {
  id: number; week: number | null; game_date: string | null; side: string
  team_score: number | null; opp_score: number | null; opponent_name: string; opp_slug: string
}

type NavView =
  | { type: 'seasons' }
  | { type: 'schedule'; season: number }
  | { type: 'game'; gameId: number }

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(raw: string | null): string | null {
  if (!raw) return null
  const d = new Date(raw)
  if (isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' })
}

function stripVarsity(name: string): string {
  return name.replace(/\s+Varsity Football$/i, '')
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SchoolLogo({ slug, size = 28 }: { slug: string; size?: number }) {
  const src = SCHOOL_LOGOS[slug]
  if (!src) {
    return (
      <div style={{ width: size, height: size }}
        className="rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)]" />
    )
  }
  return (
    <div style={{ width: size, height: size }}
      className="shrink-0 rounded-full overflow-hidden bg-[var(--paper-quiet)] border border-[var(--paper-rule)] flex items-center justify-center">
      <Image src={src} alt="" width={Math.round(size * 0.78)} height={Math.round(size * 0.78)}
        className="object-contain" unoptimized />
    </div>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-5 pt-6 pb-2 border-t border-[var(--paper-rule)] first:border-t-0">
      <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>
        {label}
      </span>
    </div>
  )
}

// ── Seasons content ───────────────────────────────────────────────────────────

function SeasonsContent({ slug, onSelect }: { slug: string; onSelect: (season: number) => void }) {
  const [records, setRecords] = useState<SeasonRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/team/${slug}/records`)
      .then(r => r.json())
      .then(d => { setRecords(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div className="px-5 py-6 space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 bg-[var(--paper-quiet)] animate-pulse rounded" />
      ))}
    </div>
  )

  if (!records.length) return (
    <p className="px-5 py-10 text-center text-sm text-[var(--paper-muted)]" style={{ ...SERIF, fontStyle: 'italic' }}>
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
          <li key={r.season} className={i > 0 ? 'border-t border-[var(--paper-rule-soft)]' : ''}>
            <button
              onClick={() => onSelect(r.season)}
              className="group/row w-full flex items-center gap-3 sm:gap-4 px-5 py-4 transition-colors hover:bg-[color:color-mix(in_srgb,var(--paper-text)_4%,transparent)] text-left">
              <SchoolLogo slug={r.school_slug} size={36} />
              <span className="text-[var(--paper-faint)] tabular-nums text-[13px] shrink-0" style={MONO}>
                {String(i + 1).padStart(2, ' ')}.
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] transition-colors leading-tight truncate"
                  style={{ ...SERIF, fontSize: 17, fontWeight: 500, letterSpacing: '-0.005em' }}>
                  {formatSeason(r.season)}
                </p>
                <p className="mt-0.5 text-[13px] text-[var(--paper-muted)] truncate" style={{ ...SERIF, fontStyle: 'italic' }}>
                  {r.wins}–{r.losses}{r.ties > 0 ? `–${r.ties}` : ''} · Division {r.division}
                </p>
              </div>
              <div className="shrink-0 flex items-baseline gap-1">
                <span className="text-[13.5px] tabular-nums text-[var(--paper-text)] font-medium" style={MONO}>{pct}</span>
                <span className="text-[10px] text-[var(--paper-muted)]" style={SANS}>%</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--paper-faint)] group-hover/row:text-[var(--paper-strong)] transition-colors shrink-0" />
            </button>
          </li>
        )
      })}
    </ol>
  )
}

// ── Schedule content ──────────────────────────────────────────────────────────

function ScheduleContent({ slug, season, onSelectGame }: {
  slug: string; season: number; onSelectGame: (gameId: number) => void
}) {
  const [games, setGames] = useState<ScheduleGame[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/team/${slug}/schedule/${season}`)
      .then(r => r.json())
      .then(d => { setGames(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [slug, season])

  if (loading) return (
    <div className="px-5 py-6 space-y-2">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-12 bg-[var(--paper-quiet)] animate-pulse rounded" />
      ))}
    </div>
  )

  if (!games.length) return (
    <p className="px-5 py-10 text-center text-sm text-[var(--paper-muted)]" style={{ ...SERIF, fontStyle: 'italic' }}>
      No games found for this season.
    </p>
  )

  return (
    <ol className="flex flex-col">
      <SectionHeader label="Schedule" />
      {games.map((g, i) => {
        const won        = g.team_score != null && g.opp_score != null && g.team_score > g.opp_score
        const lost       = g.team_score != null && g.opp_score != null && g.team_score < g.opp_score
        const hasScore   = g.team_score != null
        const resultLetter = won ? 'W' : lost ? 'L' : hasScore ? 'T' : null
        return (
          <li key={g.id} className={i > 0 ? 'border-t border-[var(--paper-rule-soft)]' : ''}>
            <button
              onClick={() => onSelectGame(g.id)}
              className="group/row w-full flex items-center gap-3 sm:gap-4 px-5 py-4 transition-colors hover:bg-[color:color-mix(in_srgb,var(--paper-text)_4%,transparent)] text-left">
              <SchoolLogo slug={g.opp_slug} size={32} />
              <span className="text-[var(--paper-faint)] tabular-nums text-[13px] shrink-0" style={MONO}>
                {g.week != null ? `W${String(g.week).padStart(2, '0')}` : `${String(i + 1).padStart(2, ' ')}.`}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] transition-colors leading-tight truncate"
                  style={{ ...SERIF, fontSize: 16, fontWeight: 500, letterSpacing: '-0.005em' }}>
                  {g.side === 'home' ? 'vs.' : 'at'} {stripVarsity(g.opponent_name)}
                </p>
                {g.game_date && (
                  <p className="mt-0.5 text-[12.5px] text-[var(--paper-muted)] truncate" style={{ ...SERIF, fontStyle: 'italic' }}>
                    {fmtDate(g.game_date)}
                  </p>
                )}
              </div>
              {hasScore ? (
                <div className="shrink-0 flex items-baseline gap-1.5">
                  <span className={`text-[11px] font-medium ${won ? 'text-emerald-500' : lost ? 'text-rose-500' : 'text-[var(--paper-muted)]'}`} style={SANS}>
                    {resultLetter}
                  </span>
                  <span className="text-[13.5px] tabular-nums text-[var(--paper-text)] font-medium" style={MONO}>
                    {g.team_score}–{g.opp_score}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--paper-faint)] shrink-0" style={SANS}>
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

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Season panel — lists all seasons for a team, then drills to schedule, then game log.
 * Self-contained: manages its own navigation stack (seasons → schedule → game).
 *
 * @param slug      School slug (e.g. "ward-melville") — NOT the full team slug.
 *                  The API appends "-varsity-football" internally.
 * @param teamName  Display name (e.g. "Ward Melville Varsity Football").
 */
export function PanelSeason({
  open,
  onClose,
  slug,
  teamName,
}: {
  open: boolean
  onClose: () => void
  slug: string
  teamName: string
}) {
  const [viewStack, setViewStack] = useState<NavView[]>([{ type: 'seasons' }])

  // Reset to seasons when panel closes
  useEffect(() => { if (!open) setViewStack([{ type: 'seasons' }]) }, [open])

  const currentView = viewStack[viewStack.length - 1]
  const canGoBack   = viewStack.length > 1
  const popView     = () => setViewStack(s => s.slice(0, -1))
  const pushView    = (v: NavView) => setViewStack(s => [...s, v])

  const titleText = currentView.type === 'seasons'  ? stripVarsity(teamName)
    : currentView.type === 'schedule' ? `${formatSeason(currentView.season)} Season`
    : 'Game Log'

  const panelTitle = (
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
      {currentView.type === 'seasons' && (
        <SchoolLogo slug={slug} size={22} />
      )}
      <span className="truncate" style={{ ...SERIF, fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em' }}>
        {titleText}
      </span>
      {currentView.type === 'schedule' && (
        <span className="text-[12px] text-[var(--paper-muted)] truncate" style={{ ...SERIF, fontStyle: 'italic' }}>
          · {stripVarsity(teamName)}
        </span>
      )}
    </div>
  )

  const detailHref = currentView.type === 'seasons'
    ? `/team/${slug}-varsity-football`
    : currentView.type === 'game'
    ? `/game/${currentView.gameId}`
    : undefined

  return (
    <AppPanel open={open} onClose={onClose} title={panelTitle} detailHref={detailHref}>
      {currentView.type === 'seasons' && (
        <SeasonsContent
          slug={slug}
          onSelect={season => pushView({ type: 'schedule', season })}
        />
      )}
      {currentView.type === 'schedule' && (
        <ScheduleContent
          slug={slug}
          season={currentView.season}
          onSelectGame={gameId => pushView({ type: 'game', gameId })}
        />
      )}
      {currentView.type === 'game' && (
        <GameContent gameId={currentView.gameId} />
      )}
    </AppPanel>
  )
}
