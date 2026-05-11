'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PLACEHOLDER_TEAMS, toSlug } from '@/lib/placeholder-data'
import { cn } from '@/lib/utils'
import { ACCENT_COLOR } from '@/lib/app-config'

const DIVISIONS = ['Division I', 'Division II', 'Division III', 'Division IV', 'Division V']
const DIV_KEY   = ['I', 'II', 'III', 'IV', 'V']

function fmtPct(w: number, l: number) {
  const g = w + l
  return g === 0 ? '—' : (w / g).toFixed(3).replace(/^0/, '')
}

export default function LaunchpadPage() {
  const router = useRouter()
  const [divIdx, setDivIdx] = useState(0)

  const activeDivision = DIV_KEY[divIdx]
  const teams = PLACEHOLDER_TEAMS.filter(t => t.division === activeDivision)
    .sort((a, b) => b.wins - a.wins || b.pf - a.pf)

  return (
    <div className="w-[52%] min-w-0 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col">

      {/* Division pill tabs */}
      <div className="shrink-0 px-4 pt-3 pb-0 flex items-center gap-2 flex-wrap border-b border-[var(--border)]">
        {DIVISIONS.map((d, i) => (
          <button
            key={d}
            onClick={() => setDivIdx(i)}
            className={cn(
              'px-3 py-1.5 mb-3 rounded-lg text-sm font-medium transition-colors',
              divIdx === i
                ? 'border font-semibold'
                : 'text-[var(--muted)] hover:text-[var(--txt)]'
            )}
            style={divIdx === i ? { borderColor: ACCENT_COLOR, color: ACCENT_COLOR } : undefined}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Teams table */}
      <div className="overflow-y-auto no-scrollbar flex-1">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[var(--surface)]">
            <tr className="border-b border-[var(--border)]">
              {['Team', 'W', 'L', 'PCT', 'PF', 'PA', '+/−'].map(h => (
                <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((t, i) => {
              const diff = t.pf - t.pa
              return (
                <tr
                  key={t.id}
                  onClick={() => router.push(`/launchpad/${toSlug(t.name)}`, { scroll: false })}
                  className={cn(
                    'border-b border-[var(--border)] hover:bg-[var(--row-hover)] cursor-pointer transition-colors',
                    i % 2 !== 0 && 'bg-[var(--inp-bg)]'
                  )}
                >
                  <td className="px-4 py-3 font-medium text-[var(--txt)]">{t.name}</td>
                  <td className="px-4 py-3 text-[var(--txt)]">{t.wins}</td>
                  <td className="px-4 py-3 text-[var(--txt2)]">{t.losses}</td>
                  <td className="px-4 py-3 text-[var(--txt2)]">{fmtPct(t.wins, t.losses)}</td>
                  <td className="px-4 py-3 text-[var(--txt2)]">{t.pf}</td>
                  <td className="px-4 py-3 text-[var(--txt2)]">{t.pa}</td>
                  <td className={cn('px-4 py-3 font-semibold', diff >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                    {diff >= 0 ? `+${diff}` : diff}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

    </div>
  )
}
