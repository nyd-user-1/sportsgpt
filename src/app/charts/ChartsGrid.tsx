'use client'

import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { CHART_CONFIGS } from '@/lib/chart-configs'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { SCHOOL_COLORS } from '@/lib/school-colors'

const ROWS: { label: string; charts: string[] }[] = [
  {
    label: 'By Team & Season',
    charts: [
      'season-records', 'wins-by-school', 'point-differential-leaders',
      'home-away-record', 'pf-pa', 'win-loss-division', 'strength-of-schedule',
    ],
  },
  {
    label: 'By Player & Position',
    charts: [
      'passing-yards-leaders', 'passing-tds-leaders', 'rushing-yards-leaders', 'rushing-tds-leaders',
      'receiving-yards-leaders', 'receiving-tds-leaders', 'total-tds-leaders', 'total-yards-leaders',
      'total-points-leaders',
    ],
  },
  {
    label: 'Game Records & Scoring',
    charts: [
      'scoring-offense', 'scoring-defense', 'top-scoring-games', 'biggest-blowouts',
      'single-game-rushing', 'single-game-passing',
    ],
  },
]

export function ChartsGrid({ chartSchools }: { chartSchools: Record<string, string> }) {
  const router     = useRouter()
  const pathname   = usePathname()
  const match      = pathname.match(/^\/charts\/([^/]+)/)
  const activeSlug = match ? match[1] : null

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="p-4 space-y-8">
        {ROWS.map(row => (
          <section key={row.label}>
            <h2 className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-widest mb-3 px-1">
              {row.label}
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {row.charts.map(slug => {
                const config     = CHART_CONFIGS.find(c => c.slug === slug)
                if (!config) return null
                const isActive   = slug === activeSlug
                const schoolSlug = chartSchools[slug] ?? 'floyd'
                const bgColor    = SCHOOL_COLORS[schoolSlug]?.primary ?? '#033882'
                const logoUrl    = SCHOOL_LOGOS[schoolSlug] ?? null

                return (
                  <button
                    key={slug}
                    onClick={() => router.push(`/charts/${slug}`, { scroll: false })}
                    className={`group relative overflow-hidden rounded-xl border text-left transition-all ${
                      isActive
                        ? 'border-[#033882] shadow-md ring-1 ring-[#033882]/20'
                        : 'border-[var(--border)] hover:border-[#033882]/40 hover:shadow-md'
                    }`}
                  >
                    <div
                      className="relative h-[180px] flex items-center justify-center"
                      style={{ background: bgColor }}
                    >
                      {logoUrl && (
                        <Image
                          src={logoUrl}
                          alt=""
                          width={72}
                          height={72}
                          className="object-contain relative z-10"
                          style={{ filter: 'drop-shadow(0 0 18px rgba(255,255,255,0.55))' }}
                          unoptimized
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                        <p className="text-[13px] font-bold text-white leading-snug drop-shadow">
                          {config.title}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
