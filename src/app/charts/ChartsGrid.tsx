'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { CHART_CONFIGS, CHART_SLUGS_AZ } from '@/lib/chart-configs'
import { SCHOOL_LOGOS, TEAM_PHOTOS } from '@/lib/team-images'

const CATEGORY: Record<string, string> = {
  'season-records': 'Team & Season', 'wins-by-school': 'Team & Season',
  'point-differential-leaders': 'Team & Season', 'home-away-record': 'Team & Season',
  'pf-pa': 'Team & Season', 'win-loss-division': 'Team & Season', 'strength-of-schedule': 'Team & Season',
  'passing-yards-leaders': 'Player & Position', 'passing-tds-leaders': 'Player & Position',
  'rushing-yards-leaders': 'Player & Position', 'rushing-tds-leaders': 'Player & Position',
  'receiving-yards-leaders': 'Player & Position', 'receiving-tds-leaders': 'Player & Position',
  'total-tds-leaders': 'Player & Position', 'total-yards-leaders': 'Player & Position',
  'total-points-leaders': 'Player & Position',
  'scoring-offense': 'Game Records', 'scoring-defense': 'Game Records',
  'top-scoring-games': 'Game Records', 'biggest-blowouts': 'Game Records',
  'single-game-rushing': 'Game Records', 'single-game-passing': 'Game Records',
  'winning-streaks': 'Game Records', 'losing-streaks': 'Game Records',
  'points-by-quarter': 'Game Records',
  'rushing-yards-team': 'Team & Season', 'passing-yards-team': 'Team & Season',
  'turnovers': 'Team & Season',
}

const CHARTS = CHART_SLUGS_AZ.map(slug => ({ slug, category: CATEGORY[slug] ?? '' }))

export function ChartsGrid({ chartSchools }: { chartSchools: Record<string, string[]> }) {
  const router     = useRouter()
  const pathname   = usePathname()
  const match      = pathname.match(/^\/charts\/([^/]+)/)
  const activeSlug = match ? match[1] : null

  const [showActiveHover, setShowActiveHover] = useState(true)
  useEffect(() => {
    setShowActiveHover(true)
    const t = setTimeout(() => setShowActiveHover(false), 3000)
    return () => clearTimeout(t)
  }, [activeSlug])

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      <div className="p-4">
        <div data-charts-grid className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {CHARTS.map(({ slug, category }, idx) => {
            const config      = CHART_CONFIGS.find(c => c.slug === slug)
            if (!config) return null
            const isActive    = slug === activeSlug
            // Cycle through the top 3 schools, preferring those with photos
            const candidates  = chartSchools[slug] ?? ['floyd']
            const withPhotos  = candidates.filter(s => (TEAM_PHOTOS[s]?.length ?? 0) > 0)
            const pool        = withPhotos.length > 0 ? withPhotos : candidates
            const schoolSlug  = pool[idx % pool.length]
            const schoolPhotos = TEAM_PHOTOS[schoolSlug] ?? []
            const photo       = schoolPhotos[idx % Math.max(1, schoolPhotos.length)] ?? null
            const logoUrl     = SCHOOL_LOGOS[schoolSlug] ?? null

            return (
              <div key={slug} className="group/card flex flex-col gap-1.5">
                <button
                  onClick={() => router.push(`/charts/${slug}`, { scroll: false })}
                  className={`group relative overflow-hidden rounded-xl border border-[var(--border)] text-left transition-all ${
                    isActive
                      ? 'outline outline-2 outline-[#033882] outline-offset-2 shadow-[inset_0_0_16px_rgba(3,56,130,0.18)]'
                      : 'hover:outline hover:outline-1 hover:outline-[#033882] hover:outline-offset-2 hover:shadow-md'
                  }`}
                >
                  <div className="relative h-[180px] bg-[var(--bg2)]">
                    {photo && (
                      <Image
                        src={photo}
                        alt={config.title}
                        fill
                        className={`object-cover object-top transition duration-300 ${isActive && showActiveHover ? 'scale-105 brightness-110' : 'brightness-90 group-hover:brightness-110 group-hover:scale-105'}`}
                        sizes="(max-width: 1400px) 25vw, 340px"
                        unoptimized
                      />
                    )}
                    {logoUrl && (
                      <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow z-10">
                        <Image src={logoUrl} alt="" width={22} height={22} className="object-contain" unoptimized />
                      </div>
                    )}
                  </div>
                </button>
                <p className={`text-[13px] font-semibold leading-snug px-0.5 transition-colors group-hover/card:text-sky-500 ${isActive ? 'text-[#033882]' : 'text-[var(--txt)]'}`}>
                  {config.title}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
