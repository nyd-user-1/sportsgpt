'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ArrowUpRight, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { RevealFx } from '@/components/RevealFx'
import { Tablet, MONO } from '@/components/editorial'

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }

export type StandingsRow = {
  slug: string
  name: string
  division: string
  overall_wins: number | null
  overall_losses: number | null
  overall_ties: number | null
  conference_wins: number | null
  conference_losses: number | null
  points_for: number | null
  points_against: number | null
}

function fmtPct(w: number | null, l: number | null): string {
  const wins   = w ?? 0
  const losses = l ?? 0
  const g = wins + losses
  return g === 0 ? '—' : (wins / g).toFixed(3).replace(/^0/, '')
}

function fmtRecord(w: number | null, l: number | null): string {
  if (w == null && l == null) return '—'
  return `${w ?? 0}–${l ?? 0}`
}

function cleanName(name: string): string {
  return name.replace(/\s+Varsity\s+Football$/i, '')
}

const SEARCH_DIV_MAP: Record<string, string> = {
  'Division I': 'I', 'Division II': 'II', 'Division III': 'III', 'Division IV': 'IV',
}

const th = 'px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--paper-faint)] text-left whitespace-nowrap'
const td = 'px-4 py-3 text-[13px] border-t border-[var(--paper-rule-soft)]'

export function LaunchpadStandings({ rows }: { rows: StandingsRow[] }) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const tableRef     = useRef<HTMLDivElement>(null)

  const parts = pathname.split('/').filter(Boolean)
  const selectedSlug = (parts.length === 2 && parts[0] === 'launchpad' && parts[1] !== 'game')
    ? parts[1]
    : (searchParams.get('team') ?? null)

  const divParam  = searchParams.get('div')
  const activeDivision = divParam ? SEARCH_DIV_MAP[divParam] : null
  const filtered  = activeDivision ? rows.filter(r => r.division === activeDivision) : rows

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const curIdx = selectedSlug ? filtered.findIndex(r => r.slug === selectedSlug) : -1
      if (curIdx === -1 && !selectedSlug) return

      e.preventDefault()
      const nextIdx = e.key === 'ArrowDown'
        ? Math.min(curIdx + 1, filtered.length - 1)
        : Math.max(curIdx - 1, 0)

      const next = filtered[nextIdx]
      if (!next || next.slug === selectedSlug) return

      const qs = searchParams.toString()
      router.push(`/launchpad/${next.slug}${qs ? `?${qs}` : ''}`, { scroll: false })

      requestAnimationFrame(() => {
        const el = tableRef.current?.querySelector(`[data-slug="${next.slug}"]`)
        el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      })
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedSlug, filtered, router, searchParams])

  return (
    <RevealFx translateY={4} className="w-[55%] min-w-0 shrink-0 flex flex-col">
      <Tablet className="flex flex-col h-full">
        <div ref={tableRef} className="overflow-y-auto no-scrollbar flex-1">
          <table className="w-full" style={{ borderSpacing: 0 }}>
            <thead className="sticky top-0 z-10" style={{ background: 'var(--paper-quiet)' }}>
              <tr className="border-b border-[var(--paper-rule)]">
                {['#', 'Team', 'W', 'L', 'PCT', 'Conf', 'PF', 'PA', 'Diff'].map(h => (
                  <th key={h} className={th} style={SANS}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const diff = t.points_for != null && t.points_against != null ? t.points_for - t.points_against : null
                const on = selectedSlug === t.slug
                const schoolSlug = t.slug.replace(/-varsity-football$/, '')
                const logo = SCHOOL_LOGOS[schoolSlug]
                return (
                  <tr
                    key={t.slug}
                    data-slug={t.slug}
                    onClick={() => { const qs = searchParams.toString(); router.push(`/launchpad/${t.slug}${qs ? `?${qs}` : ''}`, { scroll: false }) }}
                    className={cn(
                      'group/row cursor-pointer transition-colors',
                      on
                        ? 'bg-[var(--paper-quiet)] shadow-[inset_2px_0_0_var(--paper-strong)]'
                        : 'hover:bg-[color:color-mix(in_srgb,var(--paper-text)_4%,transparent)]'
                    )}
                  >
                    <td className={cn(td, 'text-[var(--paper-faint)] tabular-nums w-10')} style={MONO}>{i + 1}</td>
                    <td className={cn(td, 'w-[200px]')}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        {logo ? (
                          <Image src={logo} alt="" width={22} height={22} className="shrink-0 object-contain" unoptimized />
                        ) : (
                          <div className="shrink-0 h-[22px] w-[22px] rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)]" />
                        )}
                        <span
                          className={cn(
                            'truncate transition-colors',
                            on ? 'text-[var(--paper-strong)]' : 'text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)]'
                          )}
                          style={{ ...SERIF, fontSize: 14, fontWeight: 500, letterSpacing: '-0.005em' }}
                        >
                          {cleanName(t.name)}
                        </span>
                        <Link
                          href={`/team/${t.slug}`}
                          onClick={e => e.stopPropagation()}
                          aria-label={`${cleanName(t.name)} team page`}
                          className="group/arrow shrink-0 ml-1 relative inline-flex items-center justify-center w-5 h-5 text-[var(--paper-faint)] hover:text-[var(--paper-strong)] transition-colors duration-150"
                        >
                          <ArrowUpRight className="h-3.5 w-3.5 absolute transition-all duration-200 group-hover/arrow:opacity-0 group-hover/arrow:scale-75" />
                          <ArrowRight className="h-3.5 w-3.5 absolute transition-all duration-200 opacity-0 group-hover/arrow:opacity-100 group-hover/arrow:translate-x-0.5" />
                        </Link>
                      </div>
                    </td>
                    <td className={cn(td, 'text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>{t.overall_wins ?? '—'}</td>
                    <td className={cn(td, 'text-[var(--paper-muted)] tabular-nums')} style={MONO}>{t.overall_losses ?? '—'}</td>
                    <td className={cn(td, 'text-[var(--paper-text)] tabular-nums')} style={MONO}>{fmtPct(t.overall_wins, t.overall_losses)}</td>
                    <td className={cn(td, 'text-[var(--paper-muted)] tabular-nums')} style={MONO}>{fmtRecord(t.conference_wins, t.conference_losses)}</td>
                    <td className={cn(td, 'text-[var(--paper-text)] tabular-nums')} style={MONO}>{t.points_for ?? '—'}</td>
                    <td className={cn(td, 'text-[var(--paper-muted)] tabular-nums')} style={MONO}>{t.points_against ?? '—'}</td>
                    <td className={cn(td, 'tabular-nums font-medium')} style={MONO}>
                      {diff == null ? (
                        <span className="text-[var(--paper-faint)]">—</span>
                      ) : (
                        <span className={cn(
                          diff > 0 && 'text-emerald-500',
                          diff < 0 && 'text-rose-500',
                          diff === 0 && 'text-[var(--paper-faint)]',
                        )}>
                          {diff >= 0 ? `+${diff}` : diff}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Tablet>
    </RevealFx>
  )
}
