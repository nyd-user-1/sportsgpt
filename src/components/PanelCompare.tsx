'use client'

import Image from 'next/image'
import { X } from 'lucide-react'
import { AppPanel } from './AppPanel'
import { SCHOOL_LOGOS, PLAYER_PHOTOS } from '@/lib/team-images'
import { ACCENT_COLOR } from '@/lib/app-config'
import { formatSeason, cn } from '@/lib/utils'

export type ComparePasser = {
  player_slug: string; player_name: string; school_slug: string; school_name: string
  completions: number | null; attempts: number | null
  pass_yards: number | null; pass_tds: number | null
  interceptions: number | null; season: number
  comp_pct: number | null; ypa: number | null; ypc: number | null
  td_rate: number | null; int_rate: number | null; td_int_ratio: number | null
  yva: number | null; cmd_score: number | null; gbi_score: number | null; ies_score: number | null
}
export type CompareRusher = {
  player_slug: string; player_name: string; school_slug: string; school_name: string
  rush_attempts: number | null; rush_yards: number | null; rush_tds: number | null; season: number
}
export type CompareReceiver = {
  player_slug: string; player_name: string; school_slug: string; school_name: string
  receptions: number | null; recv_yards: number | null; recv_tds: number | null; season: number
}

type ComparePlayer = ComparePasser | CompareRusher | CompareReceiver
type StatTab = 'Passing' | 'Rushing' | 'Receiving'

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

type Winner = 'a' | 'b' | 'tie' | 'none'

function winner(a: number | null, b: number | null, higherBetter = true): Winner {
  if (a == null || b == null) return 'none'
  if (a === b) return 'tie'
  return higherBetter ? (a > b ? 'a' : 'b') : (a < b ? 'a' : 'b')
}

function StatRow({
  label,
  aVal, bVal, win,
  aSub, bSub,
  border,
}: {
  label: string
  aVal: string; bVal: string; win: Winner
  aSub?: string; bSub?: string
  border?: boolean
}) {
  const aWins = win === 'a'
  const bWins = win === 'b'
  return (
    <div className={cn('grid grid-cols-[1fr_80px_1fr] items-center px-4 py-2 hover:bg-[var(--inp-bg)] transition-colors', border && 'border-t border-[var(--border)]')}>
      <div className="text-right">
        <span className={cn('text-sm tabular-nums font-medium', aWins ? 'font-bold' : 'text-[var(--txt)]')}
          style={aWins ? { color: ACCENT_COLOR } : undefined}>
          {aVal}
        </span>
        {aSub && <div className="text-[11px] text-[var(--muted)]">{aSub}</div>}
      </div>
      <div className="text-center px-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</span>
      </div>
      <div className="text-left">
        <span className={cn('text-sm tabular-nums font-medium', bWins ? 'font-bold' : 'text-[var(--txt)]')}
          style={bWins ? { color: ACCENT_COLOR } : undefined}>
          {bVal}
        </span>
        {bSub && <div className="text-[11px] text-[var(--muted)]">{bSub}</div>}
      </div>
    </div>
  )
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-4 pt-4 pb-1">
      <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--muted)]">{label}</span>
    </div>
  )
}

function PlayerHeader({
  player, slot, onClear,
}: {
  player: ComparePlayer | null
  slot: 'A' | 'B'
  onClear: () => void
}) {
  const photo = player ? PLAYER_PHOTOS[player.player_slug] : undefined
  const logo  = player ? SCHOOL_LOGOS[player.school_slug] : undefined
  const empty = !player

  return (
    <div className="flex-1 flex flex-col items-center gap-1.5 px-3 py-3 relative min-w-0">
      {/* Slot badge */}
      <div className="absolute top-2 left-3 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
        style={{ background: ACCENT_COLOR }}>
        {slot}
      </div>

      {/* Clear button */}
      {player && (
        <button onClick={onClear}
          className="absolute top-2 right-3 p-0.5 rounded text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors">
          <X className="h-3 w-3" />
        </button>
      )}

      {/* Photo or logo or placeholder */}
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-[var(--border)] bg-[var(--inp-bg)] shrink-0 flex items-center justify-center">
        {photo ? (
          <Image src={photo} alt="" width={48} height={48} className="object-cover w-full h-full" unoptimized />
        ) : logo ? (
          <Image src={logo} alt="" width={36} height={36} className="object-contain" unoptimized />
        ) : (
          <span className="text-xl font-bold text-[var(--muted)]">{slot}</span>
        )}
      </div>

      {empty ? (
        <span className="text-xs text-[var(--muted)] text-center leading-tight">Select a player<br />from the table</span>
      ) : (
        <>
          <span className="text-xs font-semibold text-[var(--txt)] text-center leading-tight truncate w-full text-center">{player.player_name}</span>
          <div className="flex items-center gap-1 min-w-0">
            {logo && <Image src={logo} alt="" width={14} height={14} className="shrink-0 rounded-full object-contain bg-white border border-[var(--border)]" unoptimized />}
            <span className="text-[11px] text-[var(--muted)] truncate">{player.school_name}</span>
          </div>
          <span className="text-[11px] text-[var(--muted)]">{formatSeason(player.season)}</span>
        </>
      )}
    </div>
  )
}

function PassingStats({ a, b }: { a: ComparePasser; b: ComparePasser }) {
  return (
    <>
      <SectionLabel label="Standard" />
      <StatRow label="YDS" aVal={fmt(a.pass_yards)} bVal={fmt(b.pass_yards)} win={winner(a.pass_yards, b.pass_yards)} />
      <StatRow label="ATT" aVal={fmt(a.attempts)} bVal={fmt(b.attempts)} win={winner(a.attempts, b.attempts)} />
      <StatRow label="COMP" aVal={fmt(a.completions)} bVal={fmt(b.completions)} win={winner(a.completions, b.completions)} />
      <StatRow label="COMP%" aVal={fmt(a.comp_pct, 1, '%')} bVal={fmt(b.comp_pct, 1, '%')} win={winner(a.comp_pct, b.comp_pct)} />
      <StatRow label="TD" aVal={fmt(a.pass_tds)} bVal={fmt(b.pass_tds)} win={winner(a.pass_tds, b.pass_tds)} />
      <StatRow label="INT" aVal={fmt(a.interceptions)} bVal={fmt(b.interceptions)} win={winner(a.interceptions, b.interceptions, false)} />

      <SectionLabel label="Foundational QB" />
      <StatRow label="YPA" aVal={fmt(a.ypa, 1)} bVal={fmt(b.ypa, 1)} win={winner(a.ypa, b.ypa)} />
      <StatRow label="YPC" aVal={fmt(a.ypc, 1)} bVal={fmt(b.ypc, 1)} win={winner(a.ypc, b.ypc)} />
      <StatRow label="TD%" aVal={fmt(a.td_rate, 1, '%')} bVal={fmt(b.td_rate, 1, '%')} win={winner(a.td_rate, b.td_rate)} />
      <StatRow label="INT%" aVal={fmt(a.int_rate, 1, '%')} bVal={fmt(b.int_rate, 1, '%')} win={winner(a.int_rate, b.int_rate, false)} />
      <StatRow label="TD:INT" aVal={fmt(a.td_int_ratio, 1)} bVal={fmt(b.td_int_ratio, 1)} win={winner(a.td_int_ratio, b.td_int_ratio)} />
      <StatRow label="YVA" aVal={fmtSigned(a.yva)} bVal={fmtSigned(b.yva)} win={winner(a.yva, b.yva)} />

      <SectionLabel label="Advanced QB" />
      <StatRow label="CMD" aVal={fmt(a.cmd_score, 2)} bVal={fmt(b.cmd_score, 2)} win={winner(a.cmd_score, b.cmd_score)} />
      <StatRow label="GBI" aVal={fmt(a.gbi_score, 1)} bVal={fmt(b.gbi_score, 1)} win={winner(a.gbi_score, b.gbi_score)} />
      <StatRow label="IES" aVal={fmt(a.ies_score, 1)} bVal={fmt(b.ies_score, 1)} win={winner(a.ies_score, b.ies_score)} />
    </>
  )
}

function RushingStats({ a, b }: { a: CompareRusher; b: CompareRusher }) {
  const aYpc = a.rush_attempts ? (a.rush_yards ?? 0) / a.rush_attempts : null
  const bYpc = b.rush_attempts ? (b.rush_yards ?? 0) / b.rush_attempts : null
  return (
    <>
      <SectionLabel label="Rushing" />
      <StatRow label="YDS" aVal={fmt(a.rush_yards)} bVal={fmt(b.rush_yards)} win={winner(a.rush_yards, b.rush_yards)} />
      <StatRow label="ATT" aVal={fmt(a.rush_attempts)} bVal={fmt(b.rush_attempts)} win={winner(a.rush_attempts, b.rush_attempts)} />
      <StatRow label="YPC" aVal={aYpc != null ? aYpc.toFixed(1) : '—'} bVal={bYpc != null ? bYpc.toFixed(1) : '—'} win={winner(aYpc, bYpc)} />
      <StatRow label="TDs" aVal={fmt(a.rush_tds)} bVal={fmt(b.rush_tds)} win={winner(a.rush_tds, b.rush_tds)} />
    </>
  )
}

function ReceivingStats({ a, b }: { a: CompareReceiver; b: CompareReceiver }) {
  const aYpr = a.receptions ? (a.recv_yards ?? 0) / a.receptions : null
  const bYpr = b.receptions ? (b.recv_yards ?? 0) / b.receptions : null
  return (
    <>
      <SectionLabel label="Receiving" />
      <StatRow label="YDS" aVal={fmt(a.recv_yards)} bVal={fmt(b.recv_yards)} win={winner(a.recv_yards, b.recv_yards)} />
      <StatRow label="REC" aVal={fmt(a.receptions)} bVal={fmt(b.receptions)} win={winner(a.receptions, b.receptions)} />
      <StatRow label="YPR" aVal={aYpr != null ? aYpr.toFixed(1) : '—'} bVal={bYpr != null ? bYpr.toFixed(1) : '—'} win={winner(aYpr, bYpr)} />
      <StatRow label="TD" aVal={fmt(a.recv_tds)} bVal={fmt(b.recv_tds)} win={winner(a.recv_tds, b.recv_tds)} />
    </>
  )
}

function panelTitle(a: ComparePlayer | null, b: ComparePlayer | null): string {
  if (!a && !b) return 'Compare Players'
  if (a && !b) return a.player_name
  if (a && b) return `${a.player_name.split(' ').pop()} vs ${b.player_name.split(' ').pop()}`
  return 'Compare Players'
}

export function PanelCompare({
  open, onClose,
  playerA, playerB,
  onClearA, onClearB,
  statTab,
}: {
  open: boolean
  onClose: () => void
  playerA: ComparePlayer | null
  playerB: ComparePlayer | null
  onClearA: () => void
  onClearB: () => void
  statTab: StatTab
}) {
  return (
    <AppPanel open={open} onClose={onClose} title={panelTitle(playerA, playerB)}>
      <div className="flex flex-col h-full">

        {/* Player headers */}
        <div className="shrink-0 flex border-b border-[var(--border)]">
          <PlayerHeader player={playerA} slot="A" onClear={onClearA} />
          <div className="w-px bg-[var(--border)] self-stretch" />
          <PlayerHeader player={playerB} slot="B" onClear={onClearB} />
        </div>

        {/* Stats */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
          {playerA && playerB ? (
            statTab === 'Passing' ? (
              <PassingStats a={playerA as ComparePasser} b={playerB as ComparePasser} />
            ) : statTab === 'Rushing' ? (
              <RushingStats a={playerA as CompareRusher} b={playerB as CompareRusher} />
            ) : (
              <ReceivingStats a={playerA as CompareReceiver} b={playerB as CompareReceiver} />
            )
          ) : (
            <div className="flex items-center justify-center h-32 text-sm text-[var(--muted)]">
              Select two players to compare
            </div>
          )}
        </div>

      </div>
    </AppPanel>
  )
}
