'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, ChartSpline, Map as MapIcon, MessageCircle } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { InfoTable } from '@/components/InfoTable'
import { RevealFx } from '@/components/RevealFx'
import { PanelChart } from '@/components/PanelChart'
import { PanelMap } from '@/components/PanelMap'
import { PanelChat } from '@/components/PanelChat'
import { SportsBarChart } from '@/components/charts/SportsBarChart'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { ACCENT_COLOR } from '@/lib/app-config'
import { getAdjacentSlugs } from '@/lib/chart-configs'
import { cn } from '@/lib/utils'

export type WinPctRow = {
  name: string
  school_slug: string
  team_slug: string
  value: number
}

const th = 'px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] bg-[var(--surface)]'
const td = 'px-4 py-3 text-sm'

const { prevSlug, nextSlug } = getAdjacentSlugs('win-percentage')

export function WinPctShell({ rows }: { rows: WinPctRow[] }) {
  const [tableExpanded, setTableExpanded] = useState(true)
  const [chartsOpen, setChartsOpen]       = useState(false)
  const [mapsOpen,   setMapsOpen]         = useState(false)
  const [chatOpen,   setChatOpen]         = useState(false)

  const visibleRows = tableExpanded ? rows : rows.slice(0, 10)

  const btn    = 'inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors'
  const active = 'text-[var(--txt)] bg-[var(--inp-bg)]'
  const tip    = 'absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 rounded bg-[var(--txt)] text-[var(--bg)] text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50'

  const mobileHeader = (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-[var(--txt)] leading-tight">Win %</p>
        <p className="text-[11px] text-[var(--muted)] leading-tight">Section XI · Charts</p>
      </div>
    </div>
  )

  return (
    <>
      <AppLayout mobileHeader={mobileHeader}>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="max-w-4xl mx-auto px-5 pt-2 pb-8 sm:py-8">

            {/* Header */}
            <RevealFx delay={0} translateY={4} className="pt-8 -mt-8">
            <div className="hidden sm:flex mb-8 items-start justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold text-[var(--txt)]">Win %</h1>
                <div className="flex items-center gap-1 text-xs text-[var(--muted)] mt-1">
                  <Link href="/section/section-xi" className="hover:text-[var(--txt)] transition-colors">Section XI</Link>
                  <span>/</span>
                  <Link href="/charts" className="hover:text-[var(--txt)] transition-colors">Charts</Link>
                  <span>/</span>
                  <span className="font-medium" style={{ color: ACCENT_COLOR }}>Win %</span>
                </div>
              </div>
              <div className="hidden sm:flex items-center shrink-0">
                <div className="inline-flex -space-x-px">
                  <div className="relative group">
                    <Link href={`/chart/${prevSlug}`} className={`${btn} rounded-l-full`}><ChevronLeft className="h-4 w-4" /></Link>
                    <span className={tip}>Prev</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => setChartsOpen(v => !v)} className={`${btn} ${chartsOpen ? active : ''}`}><ChartSpline className="h-4 w-4" /></button>
                    <span className={tip}>Charts</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => setMapsOpen(v => !v)} className={`${btn} ${mapsOpen ? active : ''}`}><MapIcon className="h-4 w-4" /></button>
                    <span className={tip}>Map</span>
                  </div>
                  <div className="relative group">
                    <button onClick={() => setChatOpen(v => !v)} className={`${btn} ${chatOpen ? active : ''}`}><MessageCircle className="h-4 w-4" /></button>
                    <span className={tip}>Ask SportsGPT</span>
                  </div>
                  <div className="relative group">
                    <Link href={`/chart/${nextSlug}`} className={`${btn} rounded-r-full`}><ChevronRight className="h-4 w-4" /></Link>
                    <span className={tip}>Next</span>
                  </div>
                </div>
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
            <RevealFx delay={0.3} translateY={8}>
            <div className="mb-8">
              <InfoTable title="All-Time Win %" onToggle={() => setTableExpanded(v => !v)}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--surface)]">
                      <th className={cn(th, 'text-left w-10')}>#</th>
                      <th className={cn(th, 'text-left')}>Team</th>
                      <th className={cn(th, 'text-right')}>Win %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((r, i) => {
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

      <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
      <PanelMap   open={mapsOpen}   onClose={() => setMapsOpen(false)}   />
      <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)}   countyName="Win %" />
    </>
  )
}
