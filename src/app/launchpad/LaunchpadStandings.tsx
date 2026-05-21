'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ArrowUpRight, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SCHOOL_LOGOS } from '@/lib/team-images'

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

// Maps the outer tab ?div param → division column value
const SEARCH_DIV_MAP: Record<string, string> = {
  'Division I': 'I', 'Division II': 'II', 'Division III': 'III', 'Division IV': 'IV',
}

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

      // Scroll row into view within the table container
      requestAnimationFrame(() => {
        const el = tableRef.current?.querySelector(`[data-slug="${next.slug}"]`)
        el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      })
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedSlug, filtered, router, searchParams])

  return (
    <div className="w-[55%] min-w-0 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col">
      {/* Table */}
      <div ref={tableRef} className="overflow-y-auto no-scrollbar flex-1">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-[var(--surface)]">
            <tr className="border-b border-[var(--border)]">
              {['Team', 'W', 'L', 'PCT', 'Conf', 'PF', 'PA', 'DIFF'].map(h => (
                <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => (
              <tr
                key={t.slug}
                data-slug={t.slug}
                onClick={() => { const qs = searchParams.toString(); router.push(`/launchpad/${t.slug}${qs ? `?${qs}` : ''}`, { scroll: false }) }}
                className={cn(
                  'border-b border-[var(--border)] hover:bg-[var(--row-hover)] cursor-pointer transition-colors',
                  selectedSlug === t.slug ? 'bg-blue-50 dark:bg-blue-950/40 shadow-[inset_3px_0_0_#033882]' : ''
                )}
              >
                <td className="px-4 py-3 font-medium text-[var(--txt)] w-[180px]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {(() => {
                      const schoolSlug = t.slug.replace(/-varsity-football$/, '')
                      const logo = SCHOOL_LOGOS[schoolSlug]
                      return logo ? (
                        <Image src={logo} alt="" width={24} height={24} className="shrink-0 rounded-full object-contain bg-white border border-[var(--border)]" unoptimized />
                      ) : (
                        <div className="shrink-0 h-6 w-6 rounded-full bg-[var(--inp-bg)] border border-[var(--border)]" />
                      )
                    })()}
                    <span className="truncate">{cleanName(t.name)}</span>
                    <Link href={`/team/${t.slug}`}
                      onClick={e => e.stopPropagation()}
                      className="group/arrow shrink-0 ml-1 relative inline-flex items-center justify-center w-5 h-5 text-[var(--muted)] hover:text-[var(--txt)] transition-colors duration-150">
                      <ArrowUpRight className="h-4 w-4 absolute transition-all duration-200 group-hover/arrow:opacity-0 group-hover/arrow:scale-75" />
                      <ArrowRight className="h-4 w-4 absolute transition-all duration-200 opacity-0 group-hover/arrow:opacity-100 group-hover/arrow:translate-x-0.5" />
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--txt)]">{t.overall_wins ?? '—'}</td>
                <td className="px-4 py-3 text-[var(--txt2)]">{t.overall_losses ?? '—'}</td>
                <td className="px-4 py-3 text-[var(--txt2)]">{fmtPct(t.overall_wins, t.overall_losses)}</td>
                <td className="px-4 py-3 text-[var(--txt2)]">{fmtRecord(t.conference_wins, t.conference_losses)}</td>
                <td className="px-4 py-3 text-[var(--txt2)]">{t.points_for ?? '—'}</td>
                <td className="px-4 py-3 text-[var(--txt2)]">{t.points_against ?? '—'}</td>
                <td className="px-4 py-3 text-[var(--txt2)] font-medium" style={{ color: t.points_for != null && t.points_against != null ? (t.points_for - t.points_against > 0 ? '#15803d' : t.points_for - t.points_against < 0 ? '#b91c1c' : undefined) : undefined }}>
                  {t.points_for != null && t.points_against != null ? (t.points_for - t.points_against > 0 ? `+${t.points_for - t.points_against}` : t.points_for - t.points_against) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
