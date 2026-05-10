'use client'

import Link from 'next/link'
import { AppPanel } from './AppPanel'
import { MiniAreaChart, MiniBarChart } from './MiniCharts'

const CHARTS = [
  { id: 'pc1', title: 'Provider Growth',       desc: 'Licensed providers enrolled monthly',          type: 'area', color: '#14b8a6', data: [25,48,72,82,78,62,58,72,88,86,80,72] },
  { id: 'pc2', title: 'Enrollment by County',  desc: 'Top counties by total childcare enrollment',   type: 'bar',  color: '#3b82f6', data: [100,88,78,68,58,50,42,35,28,22] },
  { id: 'pc3', title: 'Waitlist Trends',        desc: 'Average months on waitlist over the past year',type: 'area', color: '#6366f1', data: [32,38,35,42,45,41,48,50,47,53,51,56] },
  { id: 'pc4', title: 'Weekly Cost by County', desc: 'Average weekly childcare cost — top counties', type: 'bar',  color: '#ec4899', data: [100,91,82,73,67,61,55,50,46,41] },
  { id: 'pc5', title: 'Subsidy Coverage',       desc: 'CCDF subsidy enrollment trend by month',       type: 'area', color: '#10b981', data: [30,35,38,42,40,48,52,49,56,60,58,65] },
  { id: 'pc6', title: 'Compliance Rate',        desc: 'Annual facility inspection pass rate (%)',      type: 'area', color: '#ef4444', data: [82,85,88,86,90,92,89,93,91,95,92,96] },
]

export function PanelChart({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AppPanel open={open} onClose={onClose} title="Charts">
      <div className="px-4 py-4 space-y-3">
        {CHARTS.map(c => (
          <Link
            key={c.id}
            href="/charts"
            className="block w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--txt)]/20 transition-colors overflow-hidden cursor-pointer"
          >
            <div className="mx-3 mt-3 h-[100px]">
              {c.type === 'area' && <MiniAreaChart id={c.id} color={c.color} data={c.data} />}
              {c.type === 'bar'  && <MiniBarChart color={c.color} data={c.data} />}
            </div>
            <div className="px-4 pb-3 pt-2">
              <p className="font-semibold text-sm text-[var(--txt)]">{c.title}</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">{c.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </AppPanel>
  )
}
