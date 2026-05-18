'use client'

import { useState, useEffect } from 'react'
import { Suspense } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { TEAM_PHOTOS } from '@/lib/team-images'

const DIV_TEAMS: Record<string, string[]> = {
  'I':   ['ward-melville', 'floyd', 'sachem-north', 'lindenhurst', 'longwood', 'sachem-east'],
  'II':  ['east-islip', 'northport', 'half-hollow-hills-east', 'smithtown-west', 'huntington', 'west-islip'],
  'III': ['kings-park', 'hauppauge', 'harborfields', 'rocky-point', 'sayville', 'comsewogue'],
  'IV':  ['shoreham-wading-river', 'port-jefferson', 'miller-place', 'mt-sinai', 'babylon', 'bayport-blue-point'],
}

// "All" state: one featured team per division
const ALL_TEAMS  = ['ward-melville', 'east-islip', 'kings-park', 'shoreham-wading-river']
const ALL_LABELS = ['Division I',    'Division II', 'Division III', 'Division IV']

const SEARCH_DIV_MAP: Record<string, string> = {
  'Division I': 'I', 'Division II': 'II', 'Division III': 'III', 'Division IV': 'IV',
}

type Slide = { src: string; label: string; sublabel: string }

function buildSlides(activeDivision: string | null): Slide[] {
  if (activeDivision) {
    return (DIV_TEAMS[activeDivision] ?? [])
      .map(slug => TEAM_PHOTOS[slug]?.[0])
      .filter((src): src is string => !!src)
      .slice(0, 6)
      .map(src => ({ src, label: `Division ${activeDivision}`, sublabel: 'Section XI Football' }))
  }
  return ALL_TEAMS
    .map((slug, i) => {
      const src = TEAM_PHOTOS[slug]?.[0]
      return src ? { src, label: ALL_LABELS[i], sublabel: 'Section XI Football' } : null
    })
    .filter((s): s is Slide => s !== null)
}

function DefaultSlider() {
  const searchParams   = useSearchParams()
  const divParam       = searchParams.get('div')
  const activeDivision = divParam ? (SEARCH_DIV_MAP[divParam] ?? null) : null
  const slides         = buildSlides(activeDivision)

  const [slideIdx, setSlideIdx] = useState(0)

  useEffect(() => { setSlideIdx(0) }, [activeDivision])

  useEffect(() => {
    if (slides.length < 2) return
    const t = setInterval(() => setSlideIdx(i => (i + 1) % slides.length), 4000)
    return () => clearInterval(t)
  }, [slides.length, activeDivision])

  if (slides.length === 0) return null

  const current = slides[slideIdx]

  return (
    <div className="h-full relative overflow-hidden">
      {slides.map(({ src }, i) => (
        <div key={src}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: i === slideIdx ? 1 : 0 }}>
          <Image src={src} alt="" fill className="object-cover object-top" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        </div>
      ))}

      {/* Prev / Next arrows */}
      {slides.length > 1 && (
        <>
          <button onClick={() => setSlideIdx(i => (i - 1 + slides.length) % slides.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => setSlideIdx(i => (i + 1) % slides.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 h-8 w-8 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Label — bottom left */}
      <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
        <p className="text-sm font-bold text-white leading-snug">{current.label}</p>
        <p className="text-xs text-white/60 mt-0.5">{current.sublabel}</p>
      </div>

      {/* Dots — bottom center */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setSlideIdx(i)}
              className="h-2 rounded-full bg-white transition-all duration-500 ease-in-out"
              style={{ width: i === slideIdx ? 28 : 8, opacity: i === slideIdx ? 1 : 0.45 }} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function DetailDefault() {
  return (
    <Suspense fallback={null}>
      <DefaultSlider />
    </Suspense>
  )
}
