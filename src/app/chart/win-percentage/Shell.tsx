'use client'

import Link from 'next/link'
import Image from 'next/image'
import { AppLayout } from '@/components/AppLayout'
import { InfoTable } from '@/components/InfoTable'
import { RevealFx } from '@/components/RevealFx'
import { SportsBarChart } from '@/components/charts/SportsBarChart'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { ACCENT_COLOR } from '@/lib/app-config'
import { cn } from '@/lib/utils'

export type WinPctRow = {
  name: string
  school_slug: string
  team_slug: string
  value: number
}

const th = 'px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]'
const td = 'px-4 py-3 text-sm'

export function WinPctShell({ rows }: { rows: WinPctRow[] }) {

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-4xl mx-auto px-5 pt-2 pb-8 sm:py-8">

          {/* Header */}
          <RevealFx delay={0} translateY={4} className="pt-8 -mt-8">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-[var(--txt)]">Win %</h1>
              <div className="flex items-center gap-1.5 text-xs text-[var(--muted)] mt-1">
                <Link href="/section/section-xi" className="hover:text-[var(--txt)] transition-colors">Section XI</Link>
                <span>/</span>
                <Link href="/charts" className="hover:text-[var(--txt)] transition-colors">Charts</Link>
                <span>/</span>
                <span className="font-medium" style={{ color: ACCENT_COLOR }}>Win %</span>
              </div>
            </div>
          </RevealFx>

          {/* Chart hero */}
          <RevealFx delay={0.15} translateY={16}>
            <div className="mb-8">
              <SportsBarChart
                data={rows.slice(0, 20).map(r => ({
                  name: r.name.replace(/\s+Varsity\s+Football$/i, ''),
                  value: r.value,
                  logoUrl: SCHOOL_LOGOS[r.school_slug],
                }))}
                color="#033882"
                valueLabel="Win %"
                chartClassName="aspect-auto h-[375px] w-full"
              />
            </div>
          </RevealFx>

          {/* Rankings table */}
          <RevealFx delay={0.42} translateY={8}>
            <div className="mb-8">
              <InfoTable title="All-Time Win %" onToggle={() => {}}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--surface)]">
                      <th className={cn(th, 'text-left w-10')}>#</th>
                      <th className={cn(th, 'text-left')}>Team</th>
                      <th className={cn(th, 'text-right')}>Win %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const logo = SCHOOL_LOGOS[r.school_slug]
                      const cleanName = r.name.replace(/\s+Varsity\s+Football$/i, '')
                      return (
                        <tr key={r.team_slug} className="border-t border-[var(--border)] hover:bg-[var(--inp-bg)] transition-colors">
                          <td className={cn(td, 'text-[var(--muted)] w-10')}>{i + 1}</td>
                          <td className={td}>
                            <div className="flex items-center gap-2">
                              {logo && <Image src={logo} alt="" width={20} height={20} className="shrink-0 h-5 w-5 object-contain rounded-full" unoptimized />}
                              <Link href={`/team/${r.team_slug}`} className="font-medium hover:underline" style={{ color: ACCENT_COLOR }}>
                                {cleanName}
                              </Link>
                            </div>
                          </td>
                          <td className={cn(td, 'text-right font-semibold text-[var(--txt)]')}>{r.value}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </InfoTable>
            </div>
          </RevealFx>

        </div>
      </div>
    </AppLayout>
  )
}
