'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, ArrowUpRight } from 'lucide-react'
import { AppPanel } from './AppPanel'
import { SCHOOL_LOGOS, PLAYER_PHOTOS, TEAM_PHOTOS } from '@/lib/team-images'
import { ACCENT_COLOR } from '@/lib/app-config'
import { formatSeason, cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

export type PlayerPasser = {
  player_slug: string; player_name: string; school_slug: string; school_name: string; season: number
  completions: number | null; attempts: number | null
  pass_yards: number | null; pass_tds: number | null; interceptions: number | null
  comp_pct: number | null; ypa: number | null; ypc: number | null
  td_rate: number | null; int_rate: number | null; td_int_ratio: number | null
  yva: number | null; cmd_score: number | null; gbi_score: number | null; ies_score: number | null
}
export type PlayerRusher = {
  player_slug: string; player_name: string; school_slug: string; school_name: string; season: number
  rush_attempts: number | null; rush_yards: number | null; rush_tds: number | null
  games_played: number | null; yards_per_game: number | null
}
export type PlayerReceiver = {
  player_slug: string; player_name: string; school_slug: string; school_name: string; season: number
  receptions: number | null; recv_yards: number | null; recv_tds: number | null
}
export type AnyPlayerRow = PlayerPasser | PlayerRusher | PlayerReceiver

type StatTab = 'Passing' | 'Rushing' | 'Receiving'

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// ── Accordion stat table ──────────────────────────────────────────────────────

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

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="text-sm tabular-nums font-medium text-[var(--txt)]">{value}</span>
    </div>
  )
}

// ── PlayerInfoBar (fixed) + PlayerPhoto (scrolls) ────────────────────────────

function PlayerInfoBar({ player }: { player: AnyPlayerRow }) {
  const logo = SCHOOL_LOGOS[player.school_slug]
  return (
    <div className="sticky top-0 z-10 border-b border-[var(--border)] flex items-center gap-2.5 px-3 py-2.5 bg-[var(--surface)]">
      {logo ? (
        <Link href={`/team/${player.school_slug}-varsity-football`} className="shrink-0">
          <Image src={logo} alt={player.school_name} width={38} height={38}
            className="rounded-full object-contain bg-white border border-[var(--border)] hover:opacity-80 transition-opacity" unoptimized />
        </Link>
      ) : (
        <div className="shrink-0 w-[38px] h-[38px] rounded-full bg-[var(--inp-bg)]" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-[var(--txt)] leading-snug truncate">{player.player_name}</p>
        <p className="text-xs text-[var(--muted)] mt-0.5">{player.school_name} · {formatSeason(player.season)}</p>
      </div>
    </div>
  )
}

function PlayerPhoto({ player }: { player: AnyPlayerRow }) {
  const photo     = PLAYER_PHOTOS[player.player_slug]
  const teamPhoto = TEAM_PHOTOS[player.school_slug]?.[0]
  const logo      = SCHOOL_LOGOS[player.school_slug]
  const heroSrc   = photo || teamPhoto
  return (
    <div className="relative mx-3 mt-3 mb-1 h-[225px] sm:h-[280px] rounded-xl overflow-hidden bg-[var(--inp-bg)]">
      {heroSrc ? (
        <Image src={heroSrc} alt={player.player_name} fill className="object-cover object-top" unoptimized />
      ) : (
        <div className="h-full flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${ACCENT_COLOR}18, ${ACCENT_COLOR}40)` }}>
          {logo && <Image src={logo} alt="" width={64} height={64} className="object-contain opacity-50" unoptimized />}
        </div>
      )}
    </div>
  )
}

// ── Stat blocks ───────────────────────────────────────────────────────────────

function PassingStats({ player }: { player: PlayerPasser }) {
  return (
    <div className="pt-2">
      <AccordionStatTable title="Standard">
        <StatRow label="YDS"   value={fmt(player.pass_yards)} />
        <StatRow label="ATT"   value={fmt(player.attempts)} />
        <StatRow label="COMP"  value={fmt(player.completions)} />
        <StatRow label="COMP%" value={fmt(player.comp_pct, 1, '%')} />
        <StatRow label="TD"    value={fmt(player.pass_tds)} />
        <StatRow label="INT"   value={fmt(player.interceptions)} />
      </AccordionStatTable>
      <AccordionStatTable title="Foundational QB">
        <StatRow label="YPA"    value={fmt(player.ypa, 1)} />
        <StatRow label="YPC"    value={fmt(player.ypc, 1)} />
        <StatRow label="TD%"    value={fmt(player.td_rate, 1, '%')} />
        <StatRow label="INT%"   value={fmt(player.int_rate, 1, '%')} />
        <StatRow label="TD:INT" value={fmt(player.td_int_ratio, 1)} />
        <StatRow label="YVA"    value={fmtSigned(player.yva)} />
      </AccordionStatTable>
      <AccordionStatTable title="Advanced QB">
        <StatRow label="CMD" value={fmt(player.cmd_score, 2)} />
        <StatRow label="GBI" value={fmt(player.gbi_score, 1)} />
        <StatRow label="IES" value={fmt(player.ies_score, 1)} />
      </AccordionStatTable>
    </div>
  )
}

function RushingStats({ player }: { player: PlayerRusher }) {
  const ypc = player.rush_attempts ? (player.rush_yards ?? 0) / player.rush_attempts : null
  const tdPct = player.rush_attempts ? ((player.rush_tds ?? 0) / player.rush_attempts) * 100 : null
  const tdsPerG = player.games_played ? (player.rush_tds ?? 0) / player.games_played : null
  const ypg = player.yards_per_game != null ? Number(player.yards_per_game) : null
  const rExp = (ypc != null && player.rush_attempts) ? (ypc * ((player.rush_tds ?? 0) / player.rush_attempts)) * 100 : null
  return (
    <div className="pt-2">
      <AccordionStatTable title="Rushing">
        <StatRow label="YDS"   value={fmt(player.rush_yards)} />
        <StatRow label="ATT"   value={fmt(player.rush_attempts)} />
        <StatRow label="YPC"   value={ypc != null ? ypc.toFixed(1) : '—'} />
        <StatRow label="TDs"   value={fmt(player.rush_tds)} />
      </AccordionStatTable>
      <AccordionStatTable title="Per Game">
        <StatRow label="YPG"   value={ypg != null ? ypg.toFixed(1) : '—'} />
        <StatRow label="TDs/G" value={tdsPerG != null ? tdsPerG.toFixed(1) : '—'} />
      </AccordionStatTable>
      <AccordionStatTable title="Efficiency">
        <StatRow label="TD%"   value={tdPct != null ? tdPct.toFixed(1) + '%' : '—'} />
        <StatRow label="R-EXP" value={rExp != null ? rExp.toFixed(1) : '—'} />
      </AccordionStatTable>
    </div>
  )
}

function ReceivingStats({ player }: { player: PlayerReceiver }) {
  const ypr = player.receptions ? (player.recv_yards ?? 0) / player.receptions : null
  return (
    <div className="pt-2">
      <AccordionStatTable title="Receiving">
        <StatRow label="YDS" value={fmt(player.recv_yards)} />
        <StatRow label="REC" value={fmt(player.receptions)} />
        <StatRow label="YPR" value={ypr != null ? ypr.toFixed(1) : '—'} />
        <StatRow label="TDs" value={fmt(player.recv_tds)} />
      </AccordionStatTable>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function PanelPlayer({
  player, statTab, onClose,
}: {
  player: AnyPlayerRow | null
  statTab: StatTab
  onClose: () => void
}) {
  const footer = player ? (
    <div className="px-4 py-3">
      <Link
        href={`/player/${player.player_slug}`}
        className="flex items-center justify-between text-sm font-semibold hover:underline"
        style={{ color: ACCENT_COLOR }}
      >
        <span>View full profile</span>
        <ArrowUpRight className="h-4 w-4" />
      </Link>
    </div>
  ) : undefined

  return (
    <AppPanel
      open={!!player}
      onClose={onClose}
      title={player?.player_name ?? 'Player'}
      footer={footer}
    >
      {player && (
        <>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <PlayerPhoto player={player} />
            <PlayerInfoBar player={player} />
            {statTab === 'Passing'   && <PassingStats   player={player as PlayerPasser} />}
            {statTab === 'Rushing'   && <RushingStats   player={player as PlayerRusher} />}
            {statTab === 'Receiving' && <ReceivingStats player={player as PlayerReceiver} />}
          </div>
        </>
      )}
    </AppPanel>
  )
}
