'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const STATES = [
  {
    name: 'California',
    flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Flag_of_California.svg/320px-Flag_of_California.svg.png',
  },
  {
    name: 'Florida',
    flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Flag_of_Florida.svg/320px-Flag_of_Florida.svg.png',
  },
  {
    name: 'Texas',
    flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Flag_of_Texas.svg/320px-Flag_of_Texas.svg.png',
  },
  {
    name: 'Ohio',
    flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Flag_of_Ohio.svg/320px-Flag_of_Ohio.svg.png',
  },
  {
    name: 'New York',
    flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_New_York.svg/320px-Flag_of_New_York.svg.png',
  },
  {
    name: 'Illinois',
    flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Flag_of_Illinois.svg/320px-Flag_of_Illinois.svg.png',
  },
  {
    name: 'Arizona',
    flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Flag_of_Arizona.svg/320px-Flag_of_Arizona.svg.png',
  },
  {
    name: 'Georgia',
    flagUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Flag_of_Georgia_%28U.S._state%29.svg/320px-Flag_of_Georgia_%28U.S._state%29.svg.png',
  },
]

export function PortraitCardCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scrollLeft() {
    scrollRef.current?.scrollBy({ left: -260, behavior: 'smooth' })
  }
  function scrollRight() {
    scrollRef.current?.scrollBy({ left: 260, behavior: 'smooth' })
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-base font-semibold text-[var(--txt)]">Explore</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={scrollLeft}
            className="h-8 w-8 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-[var(--inp-bg)] transition-colors"
          >
            <ChevronLeft className="h-4 w-4 text-[var(--txt)]" />
          </button>
          <button
            type="button"
            onClick={scrollRight}
            className="h-8 w-8 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-[var(--inp-bg)] transition-colors"
          >
            <ChevronRight className="h-4 w-4 text-[var(--txt)]" />
          </button>
        </div>
      </div>

      {/* Cards */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory"
      >
        {STATES.map(state => (
          <button
            key={state.name}
            type="button"
            className="group relative shrink-0 w-[150px] h-[100px] rounded-2xl overflow-hidden snap-start shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:scale-[1.02] transition-transform"
          >
            {/* Flag background */}
            <div
              className="absolute inset-0 bg-[var(--inp-bg)]"
              style={{
                backgroundImage: `url(${state.flagUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            {/* State name */}
            <div className="absolute bottom-2 left-3">
              <p className="text-xs font-semibold text-white leading-snug">{state.name}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
