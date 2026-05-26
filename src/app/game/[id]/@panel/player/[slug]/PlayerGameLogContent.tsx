'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Style tokens ──────────────────────────────────────────────────────────────

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const SANS  = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' } as const
const MONO  = { fontFamily: 'var(--font-mono), ui-monospace, monospace' } as const

// ── Types ─────────────────────────────────────────────────────────────────────

type PlayerMeta = {
  slug: string
  name: string
  position: string | null
  school_slug: string
  team_name: string
  division: string | null
}

type GameMeta = {
  id: number
  season: number
  gameNumber: number | null
  gameDate: string | null
}

type Stats = {
  rush_att: number; rush_yds: number; rush_tds: number
  pass_comp: number; pass_att: number; pass_yds: number; pass_tds: number; pass_int: number
  rec_rec: number; rec_yds: number; rec_tds: number
  kick_pat: number; kick_fg: number; kick_points: number
  def_int: number; def_sacks: number; def_fumbles: number
}

// ── Accordion stat table — paper palette ─────────────────────────────────────

function AccordionStatTable({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true)
  return (
    <div
      className="mx-3 mb-3 mt-2 border border-[var(--paper-rule)] overflow-hidden bg-[var(--paper-quiet)]"
      style={{ borderRadius: 3 }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 h-[46px] transition-colors hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)]"
      >
        <span
          className="text-[14px] text-[var(--paper-text)]"
          style={{ ...SERIF, fontWeight: 600, letterSpacing: '-0.005em' }}
        >
          {title}
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-[var(--paper-muted)] transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && (
        <div className="divide-y divide-[var(--paper-rule-soft)] border-t border-[var(--paper-rule)]">
          {children}
        </div>
      )}
    </div>
  )
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--paper-faint)]" style={SANS}>
        {label}
      </span>
      <span className="text-[14px] tabular-nums font-medium text-[var(--paper-text)]" style={MONO}>
        {value}
      </span>
    </div>
  )
}

// ── Identity ────────────────────────────────────────────────────────────────

function PlayerIdentity({ player, game }: { player: PlayerMeta; game: GameMeta }) {
  const subtitleParts = [
    game.gameNumber != null ? `Week ${game.gameNumber}` : null,
    game.gameDate,
  ].filter(Boolean)
  return (
    <div className="px-5 py-5 border-b border-[var(--paper-rule)]">
      <p
        className="text-[var(--paper-text)] leading-tight truncate"
        style={{ ...SERIF, fontSize: 22, fontWeight: 500, letterSpacing: '-0.005em' }}
      >
        {player.name}
        {player.position && (
          <span
            className="ml-2 text-[var(--paper-muted)]"
            style={{ ...SERIF, fontStyle: 'italic', fontSize: 16, fontWeight: 400 }}
          >
            · {player.position}
          </span>
        )}
      </p>
      {subtitleParts.length > 0 && (
        <p
          className="mt-1 text-[12.5px] text-[var(--paper-muted)] truncate"
          style={{ ...SERIF, fontStyle: 'italic' }}
        >
          {subtitleParts.join(' · ')}
        </p>
      )}
    </div>
  )
}

// ── Stat sections (only render the ones with data) ───────────────────────────

function StatSections({ stats, statTypes }: { stats: Stats; statTypes: string[] }) {
  const hasPassing  = statTypes.includes('Passing')   || stats.pass_att > 0 || stats.pass_yds > 0
  const hasRushing  = statTypes.includes('Rushing')   || stats.rush_att > 0 || stats.rush_yds > 0
  const hasReceiving = statTypes.includes('Receiving') || stats.rec_rec > 0 || stats.rec_yds > 0
  const hasKicking  = statTypes.includes('Kicking')   || stats.kick_fg > 0 || stats.kick_pat > 0 || stats.kick_points > 0
  const hasDefense  = statTypes.includes('Defense')   || stats.def_int > 0 || stats.def_sacks > 0 || stats.def_fumbles > 0

  const compPct = stats.pass_att > 0 ? (stats.pass_comp / stats.pass_att) * 100 : null
  const ypc     = stats.rush_att > 0 ? stats.rush_yds  / stats.rush_att : null
  const ypr     = stats.rec_rec  > 0 ? stats.rec_yds   / stats.rec_rec  : null

  const anyData = hasPassing || hasRushing || hasReceiving || hasKicking || hasDefense

  if (!anyData) {
    return (
      <p
        className="px-5 py-10 text-center text-sm text-[var(--paper-muted)]"
        style={{ ...SERIF, fontStyle: 'italic' }}
      >
        No stats recorded for this player in this game.
      </p>
    )
  }

  return (
    <div className="pt-2 pb-2">
      {hasPassing && (
        <AccordionStatTable title="Passing">
          <StatRow label="YDS"   value={stats.pass_yds} />
          <StatRow label="ATT"   value={stats.pass_att} />
          <StatRow label="COMP"  value={stats.pass_comp} />
          <StatRow label="COMP%" value={compPct != null ? compPct.toFixed(1) + '%' : '—'} />
          <StatRow label="TD"    value={stats.pass_tds} />
          <StatRow label="INT"   value={stats.pass_int} />
        </AccordionStatTable>
      )}
      {hasRushing && (
        <AccordionStatTable title="Rushing">
          <StatRow label="YDS" value={stats.rush_yds} />
          <StatRow label="ATT" value={stats.rush_att} />
          <StatRow label="YPC" value={ypc != null ? ypc.toFixed(1) : '—'} />
          <StatRow label="TDs" value={stats.rush_tds} />
        </AccordionStatTable>
      )}
      {hasReceiving && (
        <AccordionStatTable title="Receiving">
          <StatRow label="YDS" value={stats.rec_yds} />
          <StatRow label="REC" value={stats.rec_rec} />
          <StatRow label="YPR" value={ypr != null ? ypr.toFixed(1) : '—'} />
          <StatRow label="TDs" value={stats.rec_tds} />
        </AccordionStatTable>
      )}
      {hasKicking && (
        <AccordionStatTable title="Kicking">
          <StatRow label="FG"  value={stats.kick_fg} />
          <StatRow label="PAT" value={stats.kick_pat} />
          <StatRow label="PTS" value={stats.kick_points} />
        </AccordionStatTable>
      )}
      {hasDefense && (
        <AccordionStatTable title="Defense">
          <StatRow label="INT"   value={stats.def_int} />
          <StatRow label="SACKS" value={stats.def_sacks} />
          <StatRow label="FUM"   value={stats.def_fumbles} />
        </AccordionStatTable>
      )}
    </div>
  )
}

// ── Top-level component ──────────────────────────────────────────────────────

export function PlayerGameLogContent({
  player, game, stats, statTypes,
}: {
  player: PlayerMeta
  game: GameMeta
  stats: Stats
  statTypes: string[]
}) {
  return (
    <div
      className="flex-1 overflow-y-auto no-scrollbar"
      style={{ backgroundColor: 'var(--paper)', color: 'var(--paper-text)' }}
    >
      <PlayerIdentity player={player} game={game} />
      <StatSections stats={stats} statTypes={statTypes} />
    </div>
  )
}
