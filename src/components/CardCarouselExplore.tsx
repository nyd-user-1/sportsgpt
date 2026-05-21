'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TEAM_PHOTOS } from '@/lib/team-images'

const TEAMS: { slug: string; name: string }[] = [
  { slug: 'ward-melville',       name: 'Ward Melville'    },
  { slug: 'floyd',               name: 'William Floyd'    },
  { slug: 'hauppauge',           name: 'Hauppauge'        },
  { slug: 'sachem-east',         name: 'Sachem East'      },
  { slug: 'huntington',          name: 'Huntington'       },
  { slug: 'brentwood',           name: 'Brentwood'        },
  { slug: 'longwood',            name: 'Longwood'         },
  { slug: 'connetquot',          name: 'Connetquot'       },
  { slug: 'northport',           name: 'Northport'        },
  { slug: 'central-islip',       name: 'Central Islip'    },
  { slug: 'half-hollow-hills-east', name: 'Hills East'   },
  { slug: 'commack',             name: 'Commack'          },
]

export function CardCarouselExplore() {
  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-base font-semibold text-[var(--txt)]">Explore Teams</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => scrollRef.current?.scrollBy({ left: -260, behavior: 'smooth' })}
            className="h-8 w-8 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-[var(--inp-bg)] transition-colors">
            <ChevronLeft className="h-4 w-4 text-[var(--txt)]" />
          </button>
          <button type="button" onClick={() => scrollRef.current?.scrollBy({ left: 260, behavior: 'smooth' })}
            className="h-8 w-8 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-[var(--inp-bg)] transition-colors">
            <ChevronRight className="h-4 w-4 text-[var(--txt)]" />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory">
        {TEAMS.map(({ slug, name }) => {
          const photo = TEAM_PHOTOS[slug]?.[0]
          const teamSlug = `${slug}-varsity-football`
          return (
            <Link key={slug} href={`/team/${teamSlug}`}
              className="group relative shrink-0 w-[150px] h-[100px] rounded-2xl overflow-hidden snap-start shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:scale-[1.02] transition-transform block">
              <div className="absolute inset-0 bg-[var(--inp-bg)]"
                style={photo ? { backgroundImage: `url(${photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
              <div className="absolute bottom-2 left-3">
                <p className="text-xs font-semibold text-white leading-snug">{name}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
