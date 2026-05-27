'use client'

import React from 'react'
import Image from 'next/image'
import { X, Check, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AppPanel } from './AppPanel'
import { SCHOOL_LOGOS, PLAYER_PHOTOS, TEAM_PHOTOS } from '@/lib/team-images'
import { ACCENT_COLOR } from '@/lib/app-config'
import { formatSeason, cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────

export type ComparePasser = {
  player_slug: string; player_name: string; school_slug: string; school_name: string
  position?: string | null; season: number
  completions: number | null; attempts: number | null
  pass_yards: number | null; pass_tds: number | null; interceptions: number | null
  comp_pct: number | null; ypa: number | null; ypc: number | null
  td_rate: number | null; int_rate: number | null; td_int_ratio: number | null
  yva: number | null; cmd_score: number | null; gbi_score: number | null; ies_score: number | null
}
export type CompareRusher = {
  player_slug: string; player_name: string; school_slug: string; school_name: string
  position?: string | null; season: number
  rush_attempts: number | null; rush_yards: number | null; rush_tds: number | null
  games_played: number | null; yards_per_game: number | null
}
export type CompareReceiver = {
  player_slug: string; player_name: string; school_slug: string; school_name: string
  position?: string | null; season: number
  receptions: number | null; recv_yards: number | null; recv_tds: number | null
}
export type AnyPlayer = ComparePasser | CompareRusher | CompareReceiver

type StatTab = 'Passing' | 'Rushing' | 'Receiving'

// ── Style tokens (editorial) ─────────────────────────────────────────────────

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const SANS  = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' } as const
const MONO  = { fontFamily: 'var(--font-mono), ui-monospace, monospace' } as const

const P1_BLUE = 'var(--paper-strong)'
const P2_RED  = '#dc2626'

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(v: number | null, decimals = 0, suffix = ''): string {
  if (v == null) return '—'
  const n = Number(v)
  return (decimals > 0 ? n.toFixed(decimals) : String(Math.round(n))) + suffix
}

function fmtSigned(v: number | null): string {
  if (v == null) return '—'
  const n = Math.round(Number(v))
  return (n > 0 ? '+' : '') + n
}

type Winner = 'win' | 'lose' | 'tie' | 'none'

function winFor(mine: number | null, theirs: number | null, higherBetter = true): Winner {
  if (mine == null || theirs == null) return 'none'
  const m = Number(mine), t = Number(theirs)
  if (m === t) return 'tie'
  return (higherBetter ? m > t : m < t) ? 'win' : 'lose'
}

// ── PlayerInfoBar + PlayerPhoto ──────────────────────────────────────────────

function PlayerInfoBar({ player, slot, onClear }: { player: AnyPlayer | null; slot: '1' | '2'; onClear: () => void }) {
  const logo = player ? SCHOOL_LOGOS[player.school_slug] : undefined
  const nameWithPosition = player
    ? (player.position ? `${player.player_name}, ${player.position}` : player.player_name)
    : null

  return (
    <div className="sticky top-0 z-10 border-b border-[var(--paper-rule)] flex items-center gap-3 px-4 py-3" style={{ backgroundColor: 'var(--paper)' }}>
      {player && logo ? (
        <Link
          href={`/team/${player.school_slug}-varsity-football`}
          className="shrink-0 w-10 h-10 rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)] flex items-center justify-center overflow-hidden hover:opacity-80 transition-opacity"
        >
          <Image src={logo} alt={player.school_name} width={34} height={34} className="object-contain" unoptimized />
        </Link>
      ) : (
        <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)] flex items-center justify-center">
          <span className="text-xs tabular-nums text-[var(--paper-faint)]" style={SANS}>{slot}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        {player ? (
          <>
            <p
              className="text-[var(--paper-text)] leading-tight truncate"
              style={{ ...SERIF, fontSize: 16, fontWeight: 500, letterSpacing: '-0.005em' }}
            >
              {nameWithPosition}
            </p>
            <p
              className="mt-0.5 text-[12px] text-[var(--paper-muted)] truncate"
              style={{ ...SERIF, fontStyle: 'italic' }}
            >
              {player.school_name} · {formatSeason(player.season)}
            </p>
          </>
        ) : (
          <span className="text-xs text-[var(--paper-faint)]" style={{ ...SERIF, fontStyle: 'italic' }}>
            Select from table
          </span>
        )}
      </div>
      {player && (
        <button
          onClick={onClear}
          className="shrink-0 p-1 self-start rounded text-[var(--paper-faint)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] transition-colors"
          aria-label={`Remove player ${slot}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

function PlayerPhoto({ player, slot }: { player: AnyPlayer | null; slot: '1' | '2' }) {
  const photo     = player ? PLAYER_PHOTOS[player.player_slug] : undefined
  const teamPhoto = player ? TEAM_PHOTOS[player.school_slug]?.[0] : undefined
  const logo      = player ? SCHOOL_LOGOS[player.school_slug] : undefined
  const heroSrc   = photo || teamPhoto
  const badgeColor = slot === '1' ? P1_BLUE : P2_RED

  return (
    <div
      className="mx-4 mt-4 mb-3 border border-[var(--paper-rule)] bg-[var(--paper-quiet)] relative"
      style={{ padding: 6, borderRadius: 3 }}
    >
      <div
        className="relative w-full h-[225px] sm:h-[260px] overflow-hidden"
        style={{ borderRadius: 1 }}
      >
        {player ? (
          heroSrc ? (
            <Image src={heroSrc} alt={player.player_name} fill className="object-cover object-top" unoptimized />
          ) : (
            <div
              className="h-full flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR}18, ${ACCENT_COLOR}40)` }}
            >
              {logo && <Image src={logo} alt="" width={84} height={84} className="object-contain opacity-70" unoptimized />}
            </div>
          )
        ) : (
          <div className="h-full flex items-center justify-center bg-[var(--paper-quiet)]">
            <span
              className="text-[80px] leading-none text-[var(--paper-faint)] tabular-nums"
              style={MONO}
            >
              {slot}
            </span>
          </div>
        )}
      </div>
      <span
        className="absolute top-3 left-3 z-10 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-white"
        style={{ ...SANS, borderRadius: 2, backgroundColor: slot === '1' ? P1_BLUE : P2_RED }}
      >
        Player {slot}
      </span>
    </div>
  )
}

// ── Stat table ────────────────────────────────────────────────────────────────

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

function StatRow({ label, value, win }: { label: string; value: string; win: Winner }) {
  const isWin = win === 'win'
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span
        className="text-[10px] uppercase tracking-[0.22em] text-[var(--paper-faint)]"
        style={SANS}
      >
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {isWin && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" strokeWidth={2.5} />}
        <span
          className={cn(
            'text-[14px] tabular-nums',
            isWin ? 'font-medium text-emerald-500' : 'text-[var(--paper-muted)]',
          )}
          style={MONO}
        >
          {value}
        </span>
      </div>
    </div>
  )
}

// ── Stat blocks ───────────────────────────────────────────────────────────────

function EmptyBlock() {
  return (
    <div
      className="mx-3 mt-2 flex items-center justify-center h-20 border border-dashed border-[var(--paper-rule)]"
      style={{ borderRadius: 3 }}
    >
      <span className="text-xs text-[var(--paper-faint)]" style={{ ...SERIF, fontStyle: 'italic' }}>
        Select a player
      </span>
    </div>
  )
}

function PassingStatBlock({ player, opponent }: { player: AnyPlayer | null; opponent: AnyPlayer | null }) {
  if (!player) return <EmptyBlock />
  const p = player as ComparePasser
  const o = opponent as ComparePasser | null
  return (
    <div className="pt-2">
      <AccordionStatTable title="Standard">
        <StatRow label="YDS"   value={fmt(p.pass_yards)}       win={winFor(p.pass_yards, o?.pass_yards ?? null)} />
        <StatRow label="ATT"   value={fmt(p.attempts)}         win={winFor(p.attempts, o?.attempts ?? null)} />
        <StatRow label="COMP"  value={fmt(p.completions)}      win={winFor(p.completions, o?.completions ?? null)} />
        <StatRow label="COMP%" value={fmt(p.comp_pct, 1, '%')} win={winFor(p.comp_pct, o?.comp_pct ?? null)} />
        <StatRow label="TD"    value={fmt(p.pass_tds)}         win={winFor(p.pass_tds, o?.pass_tds ?? null)} />
        <StatRow label="INT"   value={fmt(p.interceptions)}    win={winFor(p.interceptions, o?.interceptions ?? null, false)} />
      </AccordionStatTable>
      <AccordionStatTable title="Foundational QB">
        <StatRow label="YPA"    value={fmt(p.ypa, 1)}           win={winFor(p.ypa, o?.ypa ?? null)} />
        <StatRow label="YPC"    value={fmt(p.ypc, 1)}           win={winFor(p.ypc, o?.ypc ?? null)} />
        <StatRow label="TD%"    value={fmt(p.td_rate, 1, '%')}  win={winFor(p.td_rate, o?.td_rate ?? null)} />
        <StatRow label="INT%"   value={fmt(p.int_rate, 1, '%')} win={winFor(p.int_rate, o?.int_rate ?? null, false)} />
        <StatRow label="TD:INT" value={fmt(p.td_int_ratio, 1)}  win={winFor(p.td_int_ratio, o?.td_int_ratio ?? null)} />
        <StatRow label="YVA"    value={fmtSigned(p.yva)}        win={winFor(p.yva, o?.yva ?? null)} />
      </AccordionStatTable>
      <AccordionStatTable title="Advanced QB">
        <StatRow label="CMD" value={fmt(p.cmd_score, 2)} win={winFor(p.cmd_score, o?.cmd_score ?? null)} />
        <StatRow label="GBI" value={fmt(p.gbi_score, 1)} win={winFor(p.gbi_score, o?.gbi_score ?? null)} />
        <StatRow label="IES" value={fmt(p.ies_score, 1)} win={winFor(p.ies_score, o?.ies_score ?? null)} />
      </AccordionStatTable>
    </div>
  )
}

function RushingStatBlock({ player, opponent }: { player: AnyPlayer | null; opponent: AnyPlayer | null }) {
  if (!player) return <EmptyBlock />
  const p = player as CompareRusher
  const o = opponent as CompareRusher | null
  const pYpc    = p.rush_attempts ? (p.rush_yards ?? 0) / p.rush_attempts : null
  const oYpc    = o?.rush_attempts ? ((o.rush_yards ?? 0) / o.rush_attempts) : null
  const pTdPct  = p.rush_attempts ? ((p.rush_tds ?? 0) / p.rush_attempts) * 100 : null
  const oTdPct  = o?.rush_attempts ? (((o.rush_tds ?? 0) / o.rush_attempts) * 100) : null
  const pYpg    = p.yards_per_game != null ? Number(p.yards_per_game) : null
  const oYpg    = o?.yards_per_game != null ? Number(o.yards_per_game) : null
  const pTdsG   = p.games_played ? (p.rush_tds ?? 0) / p.games_played : null
  const oTdsG   = o?.games_played ? ((o.rush_tds ?? 0) / o.games_played) : null
  const pRExp   = (pYpc != null && p.rush_attempts) ? (pYpc * ((p.rush_tds ?? 0) / p.rush_attempts)) * 100 : null
  const oRExp   = (oYpc != null && o?.rush_attempts) ? (oYpc * ((o.rush_tds ?? 0) / o.rush_attempts)) * 100 : null
  return (
    <div className="pt-2">
      <AccordionStatTable title="Rushing">
        <StatRow label="YDS" value={fmt(p.rush_yards)}    win={winFor(p.rush_yards, o?.rush_yards ?? null)} />
        <StatRow label="ATT" value={fmt(p.rush_attempts)} win={winFor(p.rush_attempts, o?.rush_attempts ?? null)} />
        <StatRow label="YPC" value={pYpc != null ? pYpc.toFixed(1) : '—'} win={winFor(pYpc, oYpc)} />
        <StatRow label="TDs" value={fmt(p.rush_tds)}      win={winFor(p.rush_tds, o?.rush_tds ?? null)} />
      </AccordionStatTable>
      <AccordionStatTable title="Per Game">
        <StatRow label="YPG"   value={pYpg != null ? pYpg.toFixed(1) : '—'}     win={winFor(pYpg, oYpg)} />
        <StatRow label="TDs/G" value={pTdsG != null ? pTdsG.toFixed(1) : '—'}   win={winFor(pTdsG, oTdsG)} />
      </AccordionStatTable>
      <AccordionStatTable title="Efficiency">
        <StatRow label="TD%"   value={pTdPct != null ? pTdPct.toFixed(1) + '%' : '—'} win={winFor(pTdPct, oTdPct)} />
        <StatRow label="R-EXP" value={pRExp != null ? pRExp.toFixed(1) : '—'}           win={winFor(pRExp, oRExp)} />
      </AccordionStatTable>
    </div>
  )
}

function ReceivingStatBlock({ player, opponent }: { player: AnyPlayer | null; opponent: AnyPlayer | null }) {
  if (!player) return <EmptyBlock />
  const p = player as CompareReceiver
  const o = opponent as CompareReceiver | null
  const pYpr = p.receptions ? (p.recv_yards ?? 0) / p.receptions : null
  const oYpr = o?.receptions ? ((o.recv_yards ?? 0) / o.receptions) : null
  return (
    <div className="pt-2">
      <AccordionStatTable title="Receiving">
        <StatRow label="YDS" value={fmt(p.recv_yards)}  win={winFor(p.recv_yards, o?.recv_yards ?? null)} />
        <StatRow label="REC" value={fmt(p.receptions)}  win={winFor(p.receptions, o?.receptions ?? null)} />
        <StatRow label="YPR" value={pYpr != null ? pYpr.toFixed(1) : '—'} win={winFor(pYpr, oYpr)} />
        <StatRow label="TDs" value={fmt(p.recv_tds)}    win={winFor(p.recv_tds, o?.recv_tds ?? null)} />
      </AccordionStatTable>
    </div>
  )
}

// ── DiffStrip footer ─────────────────────────────────────────────────────────

function DiffCell({ label, delta }: { label: string; delta: number | null }) {
  const p1Wins = delta != null && delta > 0
  const p2Wins = delta != null && delta < 0

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3">
      <span className="text-[9px] uppercase tracking-[0.22em] text-[var(--paper-faint)]" style={SANS}>{label}</span>
      {p1Wins ? (
        <span
          className="px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-white"
          style={{ ...SANS, borderRadius: 2, backgroundColor: P1_BLUE }}
        >
          Player 1
        </span>
      ) : p2Wins ? (
        <span
          className="px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-white"
          style={{ ...SANS, borderRadius: 2, backgroundColor: P2_RED }}
        >
          Player 2
        </span>
      ) : (
        <span className="text-xs text-[var(--paper-faint)]" style={{ ...SERIF, fontStyle: 'italic' }}>—</span>
      )}
    </div>
  )
}

type DiffItem = { label: string; delta: number | null; format: (n: number) => string }

function buildDiffs(playerA: AnyPlayer, playerB: AnyPlayer, statTab: StatTab): DiffItem[] {
  const fmtInt = (n: number) => (n > 0 ? '+' : '') + Math.round(n)
  const fmtDp1 = (n: number) => (n > 0 ? '+' : '') + n.toFixed(1)
  const fmtPp  = (n: number) => (n > 0 ? '+' : '') + n.toFixed(1) + 'pp'
  const d = <T extends number | null>(a: T, b: T) => (a != null && b != null ? (a as number) - (b as number) : null)

  if (statTab === 'Passing') {
    const a = playerA as ComparePasser, b = playerB as ComparePasser
    return [
      { label: 'YDS',    delta: d(a.pass_yards,   b.pass_yards),   format: fmtInt },
      { label: 'ATT',    delta: d(a.attempts,      b.attempts),     format: fmtInt },
      { label: 'COMP',   delta: d(a.completions,   b.completions),  format: fmtInt },
      { label: 'PCT',    delta: d(a.comp_pct,      b.comp_pct),     format: fmtPp  },
      { label: 'TD',     delta: d(a.pass_tds,      b.pass_tds),     format: fmtInt },
      { label: 'TD:INT', delta: d(a.td_int_ratio,  b.td_int_ratio), format: fmtDp1 },
    ]
  }
  if (statTab === 'Rushing') {
    const a = playerA as CompareRusher, b = playerB as CompareRusher
    const aYpc   = a.rush_attempts ? (a.rush_yards ?? 0) / a.rush_attempts : null
    const bYpc   = b.rush_attempts ? (b.rush_yards ?? 0) / b.rush_attempts : null
    const aTdPct = a.rush_attempts ? ((a.rush_tds ?? 0) / a.rush_attempts) * 100 : null
    const bTdPct = b.rush_attempts ? ((b.rush_tds ?? 0) / b.rush_attempts) * 100 : null
    const aYpg   = a.yards_per_game != null ? Number(a.yards_per_game) : null
    const bYpg   = b.yards_per_game != null ? Number(b.yards_per_game) : null
    const aRExp  = (aYpc != null && a.rush_attempts) ? (aYpc * ((a.rush_tds ?? 0) / a.rush_attempts)) * 100 : null
    const bRExp  = (bYpc != null && b.rush_attempts) ? (bYpc * ((b.rush_tds ?? 0) / b.rush_attempts)) * 100 : null
    return [
      { label: 'YDS',   delta: d(a.rush_yards,    b.rush_yards),    format: fmtInt },
      { label: 'ATT',   delta: d(a.rush_attempts,  b.rush_attempts), format: fmtInt },
      { label: 'YPC',   delta: aYpc != null && bYpc != null ? aYpc - bYpc : null,         format: fmtDp1 },
      { label: 'TDs',   delta: d(a.rush_tds,       b.rush_tds),      format: fmtInt },
      { label: 'YPG',   delta: aYpg != null && bYpg != null ? aYpg - bYpg : null,         format: fmtDp1 },
      { label: 'TD%',   delta: aTdPct != null && bTdPct != null ? aTdPct - bTdPct : null, format: fmtPp  },
      { label: 'R-EXP', delta: aRExp != null && bRExp != null ? aRExp - bRExp : null,     format: fmtDp1 },
    ]
  }
  const a = playerA as CompareReceiver, b = playerB as CompareReceiver
  const aYpr = a.receptions ? (a.recv_yards ?? 0) / a.receptions : null
  const bYpr = b.receptions ? (b.recv_yards ?? 0) / b.receptions : null
  return [
    { label: 'YDS', delta: d(a.recv_yards,  b.recv_yards),  format: fmtInt },
    { label: 'REC', delta: d(a.receptions,  b.receptions),  format: fmtInt },
    { label: 'YPR', delta: aYpr != null && bYpr != null ? aYpr - bYpr : null, format: fmtDp1 },
    { label: 'TDs', delta: d(a.recv_tds,    b.recv_tds),    format: fmtInt },
  ]
}

function WinnerCell({ p1Wins, p2Wins }: { p1Wins: number; p2Wins: number }) {
  const tie = p1Wins === p2Wins
  const p1 = p1Wins > p2Wins
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3 px-1">
      <span className="text-[9px] uppercase tracking-[0.22em] text-[var(--paper-faint)]" style={SANS}>Winner</span>
      {tie ? (
        <span className="text-xs text-[var(--paper-faint)]" style={{ ...SERIF, fontStyle: 'italic' }}>—</span>
      ) : (
        <span
          className="px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-white"
          style={{ ...SANS, borderRadius: 2, backgroundColor: p1 ? P1_BLUE : P2_RED }}
        >
          Player {p1 ? '1' : '2'}
        </span>
      )}
    </div>
  )
}

function DiffStrip({ playerA, playerB, statTab }: { playerA: AnyPlayer; playerB: AnyPlayer; statTab: StatTab }) {
  const diffs  = buildDiffs(playerA, playerB, statTab)
  const p1Wins = diffs.filter(d => d.delta != null && d.delta > 0).length
  const p2Wins = diffs.filter(d => d.delta != null && d.delta < 0).length

  return (
    <div className="flex items-stretch divide-x divide-[var(--paper-rule)] bg-[var(--paper)]">
      {diffs.map(item => <DiffCell key={item.label} label={item.label} delta={item.delta} />)}
      <WinnerCell p1Wins={p1Wins} p2Wins={p2Wins} />
    </div>
  )
}

// ── Panel title — stacked avatars + serif italic "X vs. Y" ──────────────────

function avatarSrc(p: AnyPlayer | null): string | undefined {
  if (!p) return undefined
  return SCHOOL_LOGOS[p.school_slug] || PLAYER_PHOTOS[p.player_slug] || TEAM_PHOTOS[p.school_slug]?.[0]
}

function PanelCompareTitle({ playerA, playerB }: { playerA: AnyPlayer | null; playerB: AnyPlayer | null }) {
  const aLast = playerA?.player_name.split(' ').pop() ?? null
  const bLast = playerB?.player_name.split(' ').pop() ?? null
  const aSrc  = avatarSrc(playerA)
  const bSrc  = avatarSrc(playerB)

  const title = aLast && bLast
    ? <>{aLast}<span className="mx-1.5 italic text-[var(--paper-muted)]">vs.</span>{bLast}</>
    : aLast || bLast || 'Compare Players'

  return (
    <div className="flex items-center gap-3 min-w-0">
      <span
        className="text-[var(--paper-text)] truncate"
        style={{ ...SERIF, fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em' }}
      >
        {title}
      </span>
    </div>
  )
}

function StackedLogo({ src, shadow }: { src: string | undefined; shadow?: boolean }) {
  return (
    <div
      className="shrink-0 w-10 h-10 rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)] flex items-center justify-center overflow-hidden"
      style={{ outline: '2px solid var(--paper)', boxShadow: shadow ? '-2px 0 6px rgba(0,0,0,0.35)' : undefined }}
    >
      {src && <Image src={src} alt="" width={34} height={34} className="object-contain" unoptimized />}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PanelCompare({
  playerA, playerB, statTab,
}: {
  playerA: AnyPlayer | null
  playerB: AnyPlayer | null
  statTab: StatTab
}) {
  const router = useRouter()

  function basePath() {
    return window.location.pathname.replace(/\/+$/, '') || '/leaderboard'
  }

  function clearA() {
    const params = new URLSearchParams(window.location.search)
    params.delete('a')
    const curB = params.get('b')
    if (curB) { params.set('a', curB); params.delete('b') }
    router.replace(`${basePath()}?${params.toString()}`, { scroll: false })
  }

  function clearB() {
    const params = new URLSearchParams(window.location.search)
    params.delete('b')
    router.replace(`${basePath()}?${params.toString()}`, { scroll: false })
  }

  function closeAll() {
    const params = new URLSearchParams(window.location.search)
    params.delete('a')
    params.delete('b')
    router.replace(`${basePath()}?${params.toString()}`, { scroll: false })
  }

  const footer = (playerA && playerB) ? (
    <DiffStrip playerA={playerA} playerB={playerB} statTab={statTab} />
  ) : undefined

  return (
    <AppPanel
      open={!!(playerA || playerB)}
      onClose={closeAll}
      title={<PanelCompareTitle playerA={playerA} playerB={playerB} />}
      defaultExpanded={true}
      bodyClass="overflow-hidden"
      footer={footer}
    >
      <div className="h-full flex" style={{ backgroundColor: 'var(--paper)', color: 'var(--paper-text)' }}>
        {/* Column 1 */}
        <div className="flex flex-col flex-1 min-w-0 border-r border-[var(--paper-rule)]">
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <PlayerPhoto player={playerA} slot="1" />
            <PlayerInfoBar player={playerA} slot="1" onClear={clearA} />
            {statTab === 'Passing'   && <PassingStatBlock   player={playerA} opponent={playerB} />}
            {statTab === 'Rushing'   && <RushingStatBlock   player={playerA} opponent={playerB} />}
            {statTab === 'Receiving' && <ReceivingStatBlock player={playerA} opponent={playerB} />}
          </div>
        </div>
        {/* Column 2 */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <PlayerPhoto player={playerB} slot="2" />
            <PlayerInfoBar player={playerB} slot="2" onClear={clearB} />
            {statTab === 'Passing'   && <PassingStatBlock   player={playerB} opponent={playerA} />}
            {statTab === 'Rushing'   && <RushingStatBlock   player={playerB} opponent={playerA} />}
            {statTab === 'Receiving' && <ReceivingStatBlock player={playerB} opponent={playerA} />}
          </div>
        </div>
      </div>
    </AppPanel>
  )
}
