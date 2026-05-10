'use client'

import { useRouter } from 'next/navigation'
import { NY_COUNTIES } from '@/lib/ny-counties'
import { cn } from '@/lib/utils'

function fmt(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
}

export default function LaunchpadPage() {
  const router = useRouter()

  return (
    <div className="w-[52%] min-w-0 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden flex flex-col">
      <div className="overflow-y-auto no-scrollbar flex-1">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-[var(--surface)]">
            <tr className="border-b border-[var(--border)]">
              {['County','Providers','Seats','Seats Filled','Seats Open','Difference (+/-)'].map(h => (
                <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] px-4 py-4 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NY_COUNTIES.map((row, i) => (
              <tr
                key={row.county}
                onClick={() => router.push(`/launchpad/${row.slug}`, { scroll: false })}
                className={cn('border-b border-[var(--border)] hover:bg-[var(--row-hover)] cursor-pointer transition-colors', i % 2 !== 0 && 'bg-[var(--inp-bg)]')}
              >
                <td className="px-4 py-3 font-medium text-[var(--txt)]">{row.county}</td>
                <td className="px-4 py-3 text-[var(--txt2)]">{row.providers}</td>
                <td className="px-4 py-3 text-[var(--txt2)]">{fmt(row.seats)}</td>
                <td className="px-4 py-3 text-[var(--txt2)]">{fmt(row.filled)}</td>
                <td className="px-4 py-3 text-[var(--txt2)]">{fmt(row.open)}</td>
                <td className={cn('px-4 py-3 font-semibold', row.diff >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                  {row.diff >= 0 ? `+${row.diff}` : row.diff}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
