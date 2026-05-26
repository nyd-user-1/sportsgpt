'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
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

// ── Style tokens ──────────────────────────────────────────────────────────────

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const SANS  = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' } as const
const MONO  = { fontFamily: 'var(--font-mono), ui-monospace, monospace' } as const

// ── Helpers ───────────────────────────────────────────────────────────────────

function shortName(name: string) {
  return name.replace(/\s+Varsity\s+Football$/i, '')
}

function playerStatParts(p: TeamPanelData['playerRows'][0]) {
  if (p.stat_type === 'Passing')
    return { primary: `${(p.pass_yards ?? 0).toLocaleString()} yds`, secondary: `${p.pass_tds ?? 0} TD` }
  if (p.stat_type === 'Rushing')
    return { primary: `${(p.rush_yards ?? 0).toLocaleString()} yds`, secondary: `${p.rush_tds ?? 0} TD` }
  if (p.stat_type === 'Receiving')
    return { primary: `${(p.recv_yards ?? 0).toLocaleString()} yds`, secondary: `${p.recv_tds ?? 0} TD` }
  return { primary: '', secondary: '' }
}

// ── TeamPhoto — matted hero treatment ─────────────────────────────────────────

function TeamPhoto({ team }: { team: TeamPanelData['team'] }) {
  const photo  = TEAM_PHOTOS[team.school_slug]?.[0]
  const logo   = SCHOOL_LOGOS[team.school_slug]
  const colors = SCHOOL_COLORS[team.school_slug]
  return (
    <div
      className="mx-5 mt-5 mb-4 border border-[var(--paper-rule)] bg-[var(--paper-quiet)]"
      style={{ padding: 6, borderRadius: 3 }}
    >
      <div
        className="relative w-full h-[225px] sm:h-[260px] overflow-hidden"
        style={{ borderRadius: 1 }}
      >
        {photo ? (
          <Image
            src={photo}
            alt={team.name}
            fill
            className="object-cover object-top"
            unoptimized
          />
        ) : (
          <div
            className="h-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${colors?.primary ?? ACCENT_COLOR}28, ${colors?.primary ?? ACCENT_COLOR}55)`,
            }}
          >
            {logo && (
              <Image
                src={logo}
                alt=""
                width={84}
                height={84}
                className="object-contain opacity-70"
                unoptimized
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── TeamInfoBar — identity row ────────────────────────────────────────────────

function TeamInfoBar({
  team,
  seasonRows,
}: {
  team: TeamPanelData['team']
  seasonRows: TeamPanelData['seasonRows']
}) {
  const logo    = SCHOOL_LOGOS[team.school_slug]
  const current = seasonRows[0]
  const record  = current
    ? `${current.overall_wins}–${current.overall_losses}${current.overall_ties ? `–${current.overall_ties}` : ''}`
    : null
  const conf = current?.conference_wins != null
    ? `${current.conference_wins}–${current.conference_losses} conf`
    : null

  return (
    <div className="px-5 pb-5 flex items-center gap-3 border-b border-[var(--paper-rule)]">
      <div className="shrink-0 w-12 h-12 rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)] flex items-center justify-center overflow-hidden">
        {logo && (
          <Image
            src={logo}
            alt={team.name}
            width={32}
            height={32}
            className="object-contain"
            unoptimized
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[var(--paper-text)] leading-tight truncate"
          style={{ ...SERIF, fontSize: 20, fontWeight: 500, letterSpacing: '-0.005em' }}
        >
          {shortName(team.name)}
        </p>
        <p
          className="mt-0.5 text-[12.5px] text-[var(--paper-muted)] truncate"
          style={{ ...SERIF, fontStyle: 'italic' }}
        >
          Division {team.division}
          {record && ` · ${record}`}
          {conf && ` (${conf})`}
        </p>
      </div>
    </div>
  )
}

// ── Section header — editorial pattern ────────────────────────────────────────

function SectionLabel({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return (
    <div
      className={cn(
        'px-5 pt-6 pb-2',
        !first && 'border-t border-[var(--paper-rule)]',
      )}
    >
      <span
        className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]"
        style={SANS}
      >
        {children}
      </span>
    </div>
  )
}

// ── Stat sections ─────────────────────────────────────────────────────────────

function SeasonRecords({ seasonRows }: { seasonRows: TeamPanelData['seasonRows'] }) {
  if (!seasonRows.length) return null
  return (
    <>
      <SectionLabel first>Season Records</SectionLabel>
      <div>
        {seasonRows.slice(0, 5).map(s => (
          <div
            key={s.season}
            className="flex items-center justify-between px-5 py-2.5 hover:bg-[var(--paper-quiet)] transition-colors"
          >
            <span
              className="text-[14px] text-[var(--paper-muted)]"
              style={{ ...SERIF, fontStyle: 'italic' }}
            >
              {formatSeason(s.season)}
            </span>
            <span
              className="text-[14px] tabular-nums text-[var(--paper-text)]"
              style={MONO}
            >
              {s.overall_wins}–{s.overall_losses}
              {s.overall_ties ? `–${s.overall_ties}` : ''}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

function TopPlayers({ playerRows }: { playerRows: TeamPanelData['playerRows'] }) {
  if (!playerRows.length) return null
  return (
    <>
      <SectionLabel>Top Players</SectionLabel>
      <div>
        {playerRows.map((p, i) => {
          const parts = playerStatParts(p)
          return (
            <Link
              key={`${p.player_slug}-${p.stat_type}`}
              href={`/player/${p.player_slug}`}
              className="group flex items-center gap-2.5 px-5 py-3 hover:bg-[var(--paper-quiet)] transition-colors"
            >
              <span
                className="shrink-0 tabular-nums text-[var(--paper-faint)] w-5 text-right"
                style={{ ...MONO, fontSize: 11 }}
              >
                {i + 1}.
              </span>

              <div className="flex-1 min-w-0">
                <p
                  className="text-[var(--paper-text)] group-hover:text-[var(--paper-strong)] transition-colors leading-tight truncate"
                  style={{ ...SERIF, fontSize: 16, fontWeight: 500, letterSpacing: '-0.005em' }}
                >
                  {p.player_name}
                </p>
                {(p.position || p.stat_type) && (
                  <p
                    className="text-[12px] text-[var(--paper-muted)] truncate"
                    style={{ ...SERIF, fontStyle: 'italic' }}
                  >
                    {p.position ?? p.stat_type}
                  </p>
                )}
              </div>

              <div className="shrink-0 text-right tabular-nums" style={MONO}>
                <span className="text-[13px] text-[var(--paper-text)] font-medium">
                  {parts.primary}
                </span>
                {parts.secondary && (
                  <>
                    <span className="mx-1.5 text-[var(--paper-faint)]">·</span>
                    <span className="text-[13px] text-[var(--paper-muted)]">
                      {parts.secondary}
                    </span>
                  </>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}

// ── TeamPanelContent ──────────────────────────────────────────────────────────

export function TeamPanelContent({ team, seasonRows, playerRows }: TeamPanelData) {
  return (
    <div
      className="flex-1 overflow-y-auto no-scrollbar"
      style={{ backgroundColor: 'var(--paper)', color: 'var(--paper-text)' }}
    >
      <TeamPhoto team={team} />
      <TeamInfoBar team={team} seasonRows={seasonRows} />
      <SeasonRecords seasonRows={seasonRows} />
      <TopPlayers playerRows={playerRows} />
    </div>
  )
}

// ── TeamPanelFooter (sticky panel identifier) ─────────────────────────────────

export function TeamPanelFooter() {
  return (
    <div className="px-5 py-3.5 bg-[var(--paper)]">
      <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>
        Team Panel
      </span>
    </div>
  )
}
