'use client'

import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
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
  const searchParams = useSearchParams()

  const divParam  = searchParams.get('div')
  const activeDivision = divParam ? SEARCH_DIV_MAP[divParam] : null
  const filtered  = activeDivision ? rows.filter(r => r.division === activeDivision) : rows

  return (
    <div className="w-[55%] min-w-0 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col">
      {/* Table */}
      <div className="overflow-y-auto no-scrollbar flex-1">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[var(--surface)]">
            <tr className="border-b border-[var(--border)]">
              {['Team', 'W', 'L', 'PCT', 'Conf'].map(h => (
                <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => (
              <tr
                key={t.slug}
                onClick={() => router.push(`/team/${t.slug}`)}
                className={cn(
                  'border-b border-[var(--border)] hover:bg-[var(--row-hover)] cursor-pointer transition-colors',
                  i % 2 !== 0 && 'bg-[var(--inp-bg)]'
                )}
              >
                <td className="px-4 py-3 font-medium text-[var(--txt)] max-w-[220px]">
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
                  </div>
                </td>
                <td className="px-4 py-3 text-[var(--txt)]">{t.overall_wins ?? '—'}</td>
                <td className="px-4 py-3 text-[var(--txt2)]">{t.overall_losses ?? '—'}</td>
                <td className="px-4 py-3 text-[var(--txt2)]">{fmtPct(t.overall_wins, t.overall_losses)}</td>
                <td className="px-4 py-3 text-[var(--txt2)]">{fmtRecord(t.conference_wins, t.conference_losses)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
