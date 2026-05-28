'use client'

import Image from 'next/image'
import Link from 'next/link'
import { X } from 'lucide-react'
import { AppPanel } from './AppPanel'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { formatSeason, cn } from '@/lib/utils'

// Minimal team-season shape needed for the head-to-head (a subset of the
// team index's TeamMagazineRow — kept local so this panel stays decoupled).
export type CompareTeam = {
  slug: string
  name: string
  school_slug: string | null
  division: string
  season: number
  overall_wins: number | null
  overall_losses: number | null
  conference_wins: number | null
  conference_losses: number | null
  games_played: number | null
  points_for: number | null
  points_against: number | null
}

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const SANS  = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' } as const
const MONO  = { fontFamily: 'var(--font-mono), ui-monospace, monospace' } as const

const stripSuffix = (n: string) => n.replace(/\s+Varsity\s+Football$/i, '')
const num = (v: number | null | undefined) => (v == null ? null : Number(v))
const winPct = (t: CompareTeam) => {
  const w = t.overall_wins ?? 0, l = t.overall_losses ?? 0
  return w + l === 0 ? null : w / (w + l)
}

function TeamHead({ team, slot, onClear }: { team: CompareTeam | null; slot: 1 | 2; onClear: () => void }) {
  const logo = team?.school_slug ? SCHOOL_LOGOS[team.school_slug] : undefined
  return (
    <div className="flex-1 min-w-0 px-3 py-3.5 flex flex-col items-center text-center">
      {team && logo ? (
        <Link href={`/team/${team.slug}`} className="shrink-0 hover:opacity-80 transition-opacity">
          <Image src={logo} alt="" width={40} height={40} className="h-10 w-10 object-contain" unoptimized />
        </Link>
      ) : (
        <div className="h-10 w-10 rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)] flex items-center justify-center">
          <span className="text-xs tabular-nums text-[var(--paper-faint)]" style={SANS}>{slot}</span>
        </div>
      )}
      {team ? (
        <>
          <p className="mt-2 text-[14px] leading-tight text-[var(--paper-text)] truncate max-w-full" style={{ ...SERIF, fontWeight: 500 }}>
            {stripSuffix(team.name)}
          </p>
          <p className="mt-0.5 text-[11px] text-[var(--paper-muted)]" style={{ ...SERIF, fontStyle: 'italic' }}>
            {formatSeason(team.season)} · Div {team.division}
          </p>
          <button onClick={onClear} className="mt-1.5 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors" aria-label={`Remove team ${slot}`}>
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      ) : (
        <p className="mt-2 text-[11px] text-[var(--paper-faint)]" style={{ ...SERIF, fontStyle: 'italic' }}>Select a row</p>
      )}
    </div>
  )
}

type Metric = { label: string; a: string; b: string; win: 0 | 1 | 2 }

function buildMetrics(a: CompareTeam | null, b: CompareTeam | null): Metric[] {
  const cmp = (av: number | null, bv: number | null, higherBetter: boolean): 0 | 1 | 2 => {
    if (av == null || bv == null || av === bv) return 0
    return (higherBetter ? av > bv : av < bv) ? 1 : 2
  }
  const rec = (t: CompareTeam | null) => (t ? `${t.overall_wins ?? 0}–${t.overall_losses ?? 0}` : '—')
  const pctStr = (t: CompareTeam | null) => {
    const p = t ? winPct(t) : null
    return p == null ? '—' : p.toFixed(3).replace(/^0/, '')
  }
  const diff = (t: CompareTeam | null) => (t && t.points_for != null && t.points_against != null ? t.points_for - t.points_against : null)
  const v = (n: number | null) => (n == null ? '—' : String(n))
  const sgn = (n: number | null) => (n == null ? '—' : n > 0 ? `+${n}` : String(n))

  return [
    { label: 'Record', a: rec(a), b: rec(b), win: cmp(a ? winPct(a) : null, b ? winPct(b) : null, true) },
    { label: 'Win %',  a: pctStr(a), b: pctStr(b), win: cmp(a ? winPct(a) : null, b ? winPct(b) : null, true) },
    { label: 'GP',     a: v(num(a?.games_played ?? null)), b: v(num(b?.games_played ?? null)), win: 0 },
    { label: 'PF',     a: v(num(a?.points_for ?? null)), b: v(num(b?.points_for ?? null)), win: cmp(num(a?.points_for ?? null), num(b?.points_for ?? null), true) },
    { label: 'PA',     a: v(num(a?.points_against ?? null)), b: v(num(b?.points_against ?? null)), win: cmp(num(a?.points_against ?? null), num(b?.points_against ?? null), false) },
    { label: 'Diff',   a: sgn(diff(a)), b: sgn(diff(b)), win: cmp(diff(a), diff(b), true) },
    { label: 'Conf',   a: a ? `${a.conference_wins ?? 0}–${a.conference_losses ?? 0}` : '—', b: b ? `${b.conference_wins ?? 0}–${b.conference_losses ?? 0}` : '—', win: 0 },
  ]
}

export function PanelCompareTeam({ teamA, teamB, onClearA, onClearB, onClose }: {
  teamA: CompareTeam | null
  teamB: CompareTeam | null
  onClearA: () => void
  onClearB: () => void
  onClose: () => void
}) {
  const open = !!(teamA || teamB)
  const metrics = buildMetrics(teamA, teamB)
  const winCls = (side: 1 | 2, win: 0 | 1 | 2) =>
    win === side ? 'text-emerald-500 font-semibold' : 'text-[var(--paper-text)]'

  return (
    <AppPanel
      open={open}
      onClose={onClose}
      title="Head to Head"
      footer={<span className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>VERSUS PANEL</span>}
    >
      <div style={{ background: 'var(--paper)', color: 'var(--paper-text)' }}>
        <div className="flex border-b border-[var(--paper-rule)] divide-x divide-[var(--paper-rule)]">
          <TeamHead team={teamA} slot={1} onClear={onClearA} />
          <TeamHead team={teamB} slot={2} onClear={onClearB} />
        </div>
        <div className="px-2 py-2">
          {metrics.map(m => (
            <div key={m.label} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2.5 border-b border-[var(--paper-rule-soft)] last:border-b-0">
              <span className={cn('text-right tabular-nums text-[15px]', winCls(1, m.win))} style={MONO}>{m.a}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--paper-faint)] text-center px-1" style={SANS}>{m.label}</span>
              <span className={cn('text-left tabular-nums text-[15px]', winCls(2, m.win))} style={MONO}>{m.b}</span>
            </div>
          ))}
        </div>
      </div>
    </AppPanel>
  )
}
