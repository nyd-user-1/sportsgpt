'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown, ArrowUpRight } from 'lucide-react'
import { SCHOOL_LOGOS, TEAM_PHOTOS } from '@/lib/team-images'
import { SCHOOL_COLORS } from '@/lib/school-colors'
import { ACCENT_COLOR } from '@/lib/app-config'
import { formatSeason, cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

export type TeamPanelData = {
  team: {
    slug: string
    name: string
    school_slug: string
    division: string
  }
  seasonRows: {
    season: number
    overall_wins: number
    overall_losses: number
    overall_ties?: number
    conference_wins: number | null
    conference_losses: number | null
    points_for: number | null
    points_against: number | null
  }[]
  playerRows: {
    player_slug: string
    player_name: string
    stat_type: string
    pass_yards: number | null
    pass_tds: number | null
    rush_yards: number | null
    rush_tds: number | null
    recv_yards: number | null
    recv_tds: number | null
    position: string | null
  }[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortName(name: string) {
  return name.replace(/\s+Varsity\s+Football$/i, '')
}

function playerKeyStat(p: TeamPanelData['playerRows'][0]): string {
  if (p.stat_type === 'Passing')   return `${p.pass_yards ?? 0} yds · ${p.pass_tds ?? 0} TD`
  if (p.stat_type === 'Rushing')   return `${p.rush_yards ?? 0} yds · ${p.rush_tds ?? 0} TD`
  if (p.stat_type === 'Receiving') return `${p.recv_yards ?? 0} yds · ${p.recv_tds ?? 0} TD`
  return ''
}

// ── AccordionStatTable (same as PanelPlayer) ──────────────────────────────────

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

// ── TeamPhoto ─────────────────────────────────────────────────────────────────

function TeamPhoto({ team }: { team: TeamPanelData['team'] }) {
  const photo  = TEAM_PHOTOS[team.school_slug]?.[0]
  const logo   = SCHOOL_LOGOS[team.school_slug]
  const colors = SCHOOL_COLORS[team.school_slug]
  return (
    <div className="relative mx-3 mt-3 mb-1 h-[225px] sm:h-[280px] rounded-xl overflow-hidden bg-[var(--inp-bg)]">
      {photo ? (
        <Image src={photo} alt={team.name} fill className="object-cover object-top" unoptimized />
      ) : (
        <div className="h-full flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${colors?.primary ?? ACCENT_COLOR}28, ${colors?.primary ?? ACCENT_COLOR}55)` }}>
          {logo && <Image src={logo} alt="" width={72} height={72} className="object-contain opacity-60" unoptimized />}
        </div>
      )}
    </div>
  )
}

// ── TeamInfoBar (sticky) ──────────────────────────────────────────────────────

function TeamInfoBar({ team, seasonRows }: { team: TeamPanelData['team']; seasonRows: TeamPanelData['seasonRows'] }) {
  const logo    = SCHOOL_LOGOS[team.school_slug]
  const current = seasonRows[0]
  const record  = current
    ? `${current.overall_wins}–${current.overall_losses}${current.overall_ties ? `–${current.overall_ties}` : ''}`
    : null
  const conf = current?.conference_wins != null
    ? `${current.conference_wins}–${current.conference_losses} conf`
    : null

  return (
    <div className="sticky top-0 z-10 border-b border-[var(--border)] flex items-center gap-2.5 px-3 py-2.5 bg-[var(--surface)]">
      {logo ? (
        <div className="shrink-0">
          <Image src={logo} alt={team.name} width={38} height={38}
            className="rounded-full object-contain bg-white border border-[var(--border)]" unoptimized />
        </div>
      ) : (
        <div className="shrink-0 w-[38px] h-[38px] rounded-full bg-[var(--inp-bg)]" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-[var(--txt)] leading-snug truncate">{shortName(team.name)}</p>
        <p className="text-xs text-[var(--muted)] mt-0.5">
          Division {team.division}
          {record && ` · ${record}`}
          {conf && ` (${conf})`}
        </p>
      </div>
    </div>
  )
}

// ── Stat sections ─────────────────────────────────────────────────────────────

function SeasonRecords({ seasonRows }: { seasonRows: TeamPanelData['seasonRows'] }) {
  return (
    <AccordionStatTable title="Season Records">
      {seasonRows.slice(0, 5).map(s => (
        <div key={s.season} className="flex items-center justify-between px-4 py-2.5">
          <span className="text-sm text-[var(--muted)]">{formatSeason(s.season)}</span>
          <span className="text-sm tabular-nums font-medium text-[var(--txt)]">
            {s.overall_wins}–{s.overall_losses}
          </span>
        </div>
      ))}
    </AccordionStatTable>
  )
}

function TopPlayers({ playerRows }: { playerRows: TeamPanelData['playerRows'] }) {
  if (!playerRows.length) return null
  return (
    <AccordionStatTable title="Top Players">
      {playerRows.map(p => (
        <Link
          key={`${p.player_slug}-${p.stat_type}`}
          href={`/player/${p.player_slug}`}
          className="flex items-center justify-between px-4 py-2.5 hover:bg-[var(--inp-bg)] transition-colors"
        >
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--txt)] truncate">{p.player_name}</p>
            <p className="text-xs text-[var(--muted)]">{p.position ?? p.stat_type}</p>
          </div>
          <span className="text-xs tabular-nums text-[var(--muted)] shrink-0 ml-3">{playerKeyStat(p)}</span>
        </Link>
      ))}
    </AccordionStatTable>
  )
}

// ── TeamPanelContent (used by @team parallel route) ───────────────────────────

export function TeamPanelContent({ team, seasonRows, playerRows }: TeamPanelData) {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <TeamPhoto team={team} />
      <TeamInfoBar team={team} seasonRows={seasonRows} />
      <div className="pt-2">
        <SeasonRecords seasonRows={seasonRows} />
        <TopPlayers playerRows={playerRows} />
      </div>
      <div className="px-4 py-3 border-t border-[var(--border)] mt-1">
        <Link
          href={`/team/${team.slug}`}
          className="flex items-center justify-between text-sm font-semibold hover:underline"
          style={{ color: ACCENT_COLOR }}
        >
          <span>View full profile</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
