'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutGrid, X } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, ResponsiveContainer } from 'recharts'
import { CHART_CONFIGS } from '@/lib/chart-configs'

const PREVIEW: Record<string, { x: number; y: number }[]> = {
  'providers-by-county':  [100,62,58,42,38,32,28,24,20,18,14,10].map((y,x)=>({x,y})),
  'capacity-by-county':   [100,88,82,70,62,54,46,38,30,24,18,14].map((y,x)=>({x,y})),
  'program-types':        [100,32,22,20,1].map((y,x)=>({x,y})),
  'facilities-by-year':   [5,8,12,18,22,30,28,32,35,42,38,40].map((y,x)=>({x,y})),
  'age-group-capacity':   [18,30,45,62].map((y,x)=>({x,y})),
  'facility-status':      [100,44,1].map((y,x)=>({x,y})),
  'license-expiration':   [55,88,100,78,60,45,32,20].map((y,x)=>({x,y})),
  'infant-care-cost':     [100,92,85,78,72,65,58,52,46,40,35,30].map((y,x)=>({x,y})),
  'toddler-care-cost':    [100,90,82,74,66,59,52,46,40,35,30,26].map((y,x)=>({x,y})),
  'preschool-care-cost':  [100,88,78,68,60,52,45,38,32,27,22,18].map((y,x)=>({x,y})),
  'household-income':     [100,95,88,82,76,70,64,58,52,46,40,35].map((y,x)=>({x,y})),
  'cost-trend':           [42,48,52,56,60,64,70,75,80,84,88,100].map((y,x)=>({x,y})),
  'center-vs-family':     [40,45,50,56,62,68,74,80,85,90,94,100].map((y,x)=>({x,y})),
  'income-vs-cost':       [30,55,42,70,48,65,38,82,60,45,75,52].map((y,x)=>({x,y})),
  'lfpr-by-county':       [100,95,88,82,76,70,64,58,52,46,40,35].map((y,x)=>({x,y})),
}
const AREA_SLUGS = new Set(['facilities-by-year','cost-trend','center-vs-family'])

export function ChartsDrawer() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm font-medium text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors"
      >
        <LayoutGrid className="h-4 w-4" />
        <span>Charts</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)] rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-y-0' : 'translate-y-full'}`}
        style={{ maxHeight: '72vh' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-2 pb-3">
          <div>
            <h2 className="text-lg font-bold text-[var(--txt)]">Charts</h2>
            <p className="text-sm text-[var(--muted)]">Explore childcare data</p>
          </div>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-[var(--inp-bg)] transition-colors text-[var(--muted)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Grid */}
        <div className="overflow-y-auto no-scrollbar px-4 pb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {CHART_CONFIGS.map(chart => {
              const data = PREVIEW[chart.slug] ?? [50,60,70,80,75].map((y,x)=>({x,y}))
              return (
                <button key={chart.slug}
                  onClick={() => { router.push(`/chart/${chart.slug}`); setOpen(false) }}
                  className="group text-left rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:shadow-md hover:border-transparent transition-all overflow-hidden">
                  <div className="h-20 px-2 pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      {AREA_SLUGS.has(chart.slug) ? (
                        <AreaChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
                          <defs>
                            <linearGradient id={`dr-${chart.slug}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={chart.color} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={chart.color} stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <Area type="monotone" dataKey="y" stroke={chart.color} strokeWidth={1.5}
                            fill={`url(#dr-${chart.slug})`} dot={false} animationDuration={400} />
                          <XAxis dataKey="x" hide />
                        </AreaChart>
                      ) : (
                        <BarChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: 2 }}>
                          <Bar dataKey="y" fill={chart.color} radius={[2,2,0,0]} animationDuration={400} />
                          <XAxis dataKey="x" hide />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                  <div className="px-3 pb-2.5 pt-1">
                    <p className="text-xs font-semibold text-[var(--txt)] group-hover:text-sky-500 transition-colors leading-tight">{chart.title}</p>
                    <p className="text-[10px] text-[var(--muted)] mt-0.5 leading-tight">{chart.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
