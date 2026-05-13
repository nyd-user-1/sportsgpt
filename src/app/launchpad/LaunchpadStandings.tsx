'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ACCENT_COLOR } from '@/lib/app-config'

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

const TABS = ['All', 'Div I', 'Div II', 'Div III', 'Div IV']
const DIV_MAP: Record<string, string> = {
  'Div I': 'I', 'Div II': 'II', 'Div III': 'III', 'Div IV': 'IV',
}

export function LaunchpadStandings({ rows }: { rows: StandingsRow[] }) {
  const router    = useRouter()
  const [activeTab, setActiveTab] = useState('All')

  const filtered = activeTab === 'All'
    ? rows
    : rows.filter(r => r.division === DIV_MAP[activeTab])

  return (
    <div className="w-[55%] min-w-0 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col">
      {/* Division tabs */}
      <div className="flex items-center border-b border-[var(--border)] overflow-x-auto no-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px shrink-0',
              activeTab === tab
                ? 'text-[var(--txt)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--txt)]'
            )}
            style={activeTab === tab ? { borderColor: ACCENT_COLOR, borderBottomWidth: '2px' } : undefined}
          >
            {tab}
          </button>
        ))}
      </div>

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
                onClick={() => router.push(`/launchpad/${t.slug}`, { scroll: false })}
                className={cn(
                  'border-b border-[var(--border)] hover:bg-[var(--row-hover)] cursor-pointer transition-colors',
                  i % 2 !== 0 && 'bg-[var(--inp-bg)]'
                )}
              >
                <td className="px-4 py-3 font-medium text-[var(--txt)] max-w-[180px] truncate">{t.name}</td>
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
