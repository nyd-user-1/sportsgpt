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

// ── PlayerInfoBar (fixed) + PlayerPhoto (scrolls) ────────────────────────────

function PlayerInfoBar({ player, slot, onClear }: { player: AnyPlayer | null; slot: '1' | '2'; onClear: () => void }) {
  const logo = player ? SCHOOL_LOGOS[player.school_slug] : undefined
  const nameWithPosition = player
    ? (player.position ? `${player.player_name}, ${player.position}` : player.player_name)
    : null

  return (
    <div className="sticky top-0 z-10 border-b border-[var(--border)] flex items-center gap-2.5 px-3 py-2.5 bg-[var(--surface)]">
      {player && logo ? (
        <Link href={`/team/${player.school_slug}-varsity-football`} className="shrink-0">
          <Image src={logo} alt={player.school_name} width={38} height={38}
            className="rounded-full object-contain bg-white border border-[var(--border)] hover:opacity-80 transition-opacity" unoptimized />
        </Link>
      ) : (
        <div className="shrink-0 w-[38px] h-[38px] rounded-full bg-[var(--inp-bg)] flex items-center justify-center">
          <span className="text-xs font-bold text-[var(--muted)]">{slot}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        {player ? (
          <>
            <p className="text-[15px] font-bold text-[var(--txt)] leading-snug truncate">{nameWithPosition}</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">{player.school_name} · {formatSeason(player.season)}</p>
          </>
        ) : (
          <span className="text-xs text-[var(--muted)]">Select from table</span>
        )}
      </div>
      {player && (
        <button onClick={onClear}
          className="shrink-0 p-0.5 self-start rounded text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors"
          aria-label={`Remove player ${slot}`}>
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
  const label     = `Player ${slot}`

  return (
    <div className="relative mx-3 mt-3 mb-1 h-[225px] sm:h-[280px] rounded-xl overflow-hidden bg-[var(--inp-bg)]">
      {player ? (
        heroSrc ? (
          <Image src={heroSrc} alt={player.player_name} fill className="object-cover object-top" unoptimized />
        ) : (
          <div className="h-full flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR}18, ${ACCENT_COLOR}40)` }}>
            {logo && <Image src={logo} alt="" width={64} height={64} className="object-contain opacity-50" unoptimized />}
          </div>
        )
      ) : (
        <div className="h-full flex items-center justify-center">
          <span className="text-5xl font-black text-[var(--border)]">{slot}</span>
        </div>
      )}
      <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-sm"
        style={{ background: slot === '1' ? ACCENT_COLOR : P2_BADGE_COLOR }}>
        {label}
      </span>
    </div>
  )
}

// ── Stat table ────────────────────────────────────────────────────────────────

function AccordionStatTable({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true)
  return (
    <div className="mx-3 mb-3 mt-2 rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 h-[46px] transition-colors bg-[var(--surface)] hover:bg-[var(--inp-bg)]"
      >
        <span className="text-sm font-bold text-[var(--txt)]">{title}</span>
        <ChevronDown className={cn('h-3.5 w-3.5 text-[var(--muted)] transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
          {children}
        </div>
      )}
    </div>
  )
}

const WIN_TEXT  = '#16a34a'  // green-600
const WIN_BG    = 'bg-[#f0fdf4]'  // green-50

function StatRow({ label, value, win }: { label: string; value: string; win: Winner }) {
  const isWin = win === 'win'
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <div className="flex items-center gap-1">
        {isWin && <Check className="h-3.5 w-3.5 shrink-0" style={{ color: WIN_TEXT }} />}
        <span
          className={cn('text-sm tabular-nums', isWin ? 'font-bold' : 'font-medium text-[var(--muted)]')}
          style={isWin ? { color: WIN_TEXT } : undefined}
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
    <div className="mx-3 mt-2 flex items-center justify-center h-20 rounded-xl border border-dashed border-[var(--border)]">
      <span className="text-xs text-[var(--muted)]">Select a player</span>
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

// ── DiffStrip ─────────────────────────────────────────────────────────────────

const P1_COLOR = WIN_TEXT     // green for player 1 leads
const P2_COLOR = '#f97316'    // orange for player 2 leads

const P2_BADGE_COLOR = '#dc2626'  // red for player 2 badge

function DiffCell({ label, delta }: { label: string; delta: number | null }) {
  const p1Wins = delta != null && delta > 0
  const p2Wins = delta != null && delta < 0

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3">
      <span className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-semibold">{label}</span>
      {p1Wins ? (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white whitespace-nowrap border-2"
          style={{ color: ACCENT_COLOR, borderColor: ACCENT_COLOR }}>Player 1</span>
      ) : p2Wins ? (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white whitespace-nowrap border-2"
          style={{ color: P2_BADGE_COLOR, borderColor: P2_BADGE_COLOR }}>Player 2</span>
      ) : (
        <span className="text-xs text-[var(--muted)]">—</span>
      )}
    </div>
  )
}

type DiffItem = { label: string; delta: number | null; format: (n: number) => string }

function buildDiffs(playerA: AnyPlayer, playerB: AnyPlayer, statTab: StatTab): DiffItem[] {
  const fmtInt = (n: number) => (n > 0 ? '+' : '') + Math.round(n)
  const fmtDp1 = (n: number) => (n > 0 ? '+' : '') + n.toFixed(1)
  const fmtDp2 = (n: number) => (n > 0 ? '+' : '') + n.toFixed(2)
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

function WinnerCell({ playerA, playerB, p1Wins, p2Wins }: { playerA: AnyPlayer; playerB: AnyPlayer; p1Wins: number; p2Wins: number }) {
  const p1Last = playerA.player_name.split(' ').pop()!
  const p2Last = playerB.player_name.split(' ').pop()!
  const tie = p1Wins === p2Wins

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-1.5 py-3 px-1">
      <span className="text-[9px] uppercase tracking-wider text-[var(--muted)] font-semibold">Winner</span>
      {tie ? (
        <span className="text-xs text-[var(--muted)]">—</span>
      ) : p1Wins > p2Wins ? (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white whitespace-nowrap"
          style={{ background: ACCENT_COLOR }}>Player 1</span>
      ) : (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white whitespace-nowrap"
          style={{ background: P2_BADGE_COLOR }}>Player 2</span>
      )}
    </div>
  )
}

function DiffStrip({ playerA, playerB, statTab }: { playerA: AnyPlayer; playerB: AnyPlayer; statTab: StatTab }) {
  const diffs  = buildDiffs(playerA, playerB, statTab)
  const p1Wins = diffs.filter(d => d.delta != null && d.delta > 0).length
  const p2Wins = diffs.filter(d => d.delta != null && d.delta < 0).length

  return (
    <div className="flex items-stretch divide-x divide-[var(--border)]">
      {diffs.map(item => <DiffCell key={item.label} label={item.label} delta={item.delta} />)}
      <WinnerCell playerA={playerA} playerB={playerB} p1Wins={p1Wins} p2Wins={p2Wins} />
    </div>
  )
}

// ── Panel title ───────────────────────────────────────────────────────────────

function panelTitle(a: AnyPlayer | null, b: AnyPlayer | null): string {
  if (a && b) return `${a.player_name.split(' ').pop()} vs. ${b.player_name.split(' ').pop()}`
  if (a) return a.player_name
  if (b) return b.player_name
  return 'Compare Players'
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

  function clearA() {
    const params = new URLSearchParams(window.location.search)
    params.delete('a')
    const curB = params.get('b')
    if (curB) { params.set('a', curB); params.delete('b') }
    router.replace('/leaderboard?' + params.toString(), { scroll: false })
  }

  function clearB() {
    const params = new URLSearchParams(window.location.search)
    params.delete('b')
    router.replace('/leaderboard?' + params.toString(), { scroll: false })
  }

  function closeAll() {
    const params = new URLSearchParams(window.location.search)
    params.delete('a')
    params.delete('b')
    router.replace('/leaderboard?' + params.toString(), { scroll: false })
  }

  const footer = (playerA && playerB) ? (
    <DiffStrip playerA={playerA} playerB={playerB} statTab={statTab} />
  ) : undefined

  return (
    <AppPanel
      open={!!(playerA || playerB)}
      onClose={closeAll}
      title={panelTitle(playerA, playerB)}
      defaultExpanded={true}
      bodyClass="overflow-hidden"
      footer={footer}
    >
      <div className="h-full flex">
        {/* Column 1 */}
        <div className="flex flex-col flex-1 min-w-0 border-r border-[var(--border)]">
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
