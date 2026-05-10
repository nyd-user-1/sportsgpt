'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Provider = { name: string; county: string }

const PROVIDERS: Record<string, Provider[]> = {
  'Family Day Care': [
    { name: "Sunshine Family Care",        county: 'Albany'      },
    { name: "Little Stars FDC",            county: 'Bronx'       },
    { name: "Maple Street Family Care",    county: 'Brooklyn'    },
    { name: "Rainbow Kids FDC",            county: 'Queens'      },
    { name: "Cozy Corner Care",            county: 'Nassau'      },
    { name: "Happy Home FDC",              county: 'Suffolk'     },
    { name: "Tender Hearts Family Care",   county: 'Westchester' },
    { name: "Blossom Family Day Care",     county: 'Erie'        },
    { name: "Little Sprouts FDC",          county: 'Monroe'      },
    { name: "Nest & Nurture Care",         county: 'Onondaga'    },
    { name: "Stepping Stones FDC",         county: 'Orange'      },
    { name: "Bright Days Family Care",     county: 'Dutchess'    },
    { name: "Cozy Kids FDC",               county: 'Rockland'    },
    { name: "Gentle Giants Care",          county: 'Saratoga'    },
    { name: "Morning Glory FDC",           county: 'Schenectady' },
    { name: "Sunrise Family Care",         county: 'Rensselaer'  },
    { name: "Tiny Treasures FDC",          county: 'Richmond'    },
    { name: "Meadow Kids Family Care",     county: 'Niagara'     },
    { name: "Clover Leaf FDC",             county: 'Oneida'      },
    { name: "Firefly Family Care",         county: 'Tompkins'    },
  ],
  'Group Family Day Care': [
    { name: "Happy Hearts Group Care",     county: 'Albany'      },
    { name: "Village Kids GFDC",           county: 'Bronx'       },
    { name: "Riverside Group Care",        county: 'Brooklyn'    },
    { name: "Hilltop Group FDC",           county: 'Queens'      },
    { name: "Pinecrest Group Care",        county: 'Nassau'      },
    { name: "Sunflower Group GFDC",        county: 'Suffolk'     },
    { name: "Orchard Group Care",          county: 'Westchester' },
    { name: "Blue Sky Group GFDC",         county: 'Erie'        },
    { name: "Horizon Group Care",          county: 'Monroe'      },
    { name: "Cedar Grove Group GFDC",      county: 'Onondaga'    },
    { name: "Parkside Group Care",         county: 'Orange'      },
    { name: "Harbor Light GFDC",           county: 'Dutchess'    },
    { name: "Waterfront Group Care",       county: 'Rockland'    },
    { name: "Birchwood Group GFDC",        county: 'Saratoga'    },
    { name: "Lakeview Group Care",         county: 'Schenectady' },
    { name: "Summit Group GFDC",           county: 'Rensselaer'  },
    { name: "Creekside Group Care",        county: 'Richmond'    },
    { name: "Willowbrook Group GFDC",      county: 'Niagara'     },
    { name: "Foxwood Group Care",          county: 'Oneida'      },
    { name: "Elmwood Group GFDC",          county: 'Tompkins'    },
  ],
  'School Age Child Care': [
    { name: "After School Academy",        county: 'Albany'      },
    { name: "Kids Zone SACC",              county: 'Bronx'       },
    { name: "Explorers After School",      county: 'Brooklyn'    },
    { name: "Discovery Kids SACC",         county: 'Queens'      },
    { name: "Champions After School",      county: 'Nassau'      },
    { name: "Scholars Club SACC",          county: 'Suffolk'     },
    { name: "Trailblazers After School",   county: 'Westchester' },
    { name: "Achievers SACC",              county: 'Erie'        },
    { name: "Pathfinders After School",    county: 'Monroe'      },
    { name: "Innovators SACC",             county: 'Onondaga'    },
    { name: "Leaders Club After School",   county: 'Orange'      },
    { name: "Creators SACC",              county: 'Dutchess'    },
    { name: "Voyagers After School",       county: 'Rockland'    },
    { name: "Builders SACC",              county: 'Saratoga'    },
    { name: "Dreamers After School",       county: 'Schenectady' },
    { name: "Pioneers SACC",              county: 'Rensselaer'  },
    { name: "Thinkers After School",       county: 'Richmond'    },
    { name: "Adventurers SACC",           county: 'Niagara'     },
    { name: "Sparks After School",         county: 'Oneida'      },
    { name: "Bridges SACC",              county: 'Tompkins'    },
  ],
  'Small Day Care Center': [
    { name: "Tiny Tots Center",            county: 'Albany'      },
    { name: "Bright Beginnings SDCC",      county: 'Bronx'       },
    { name: "Little Learners Center",      county: 'Brooklyn'    },
    { name: "Wonder Years SDCC",           county: 'Queens'      },
    { name: "Seedling Child Center",       county: 'Nassau'      },
    { name: "Sprout Small Care",           county: 'Suffolk'     },
    { name: "Bumblebee Day Center",        county: 'Westchester' },
    { name: "Pebble Path SDCC",           county: 'Erie'        },
    { name: "Button Nose Center",          county: 'Monroe'      },
    { name: "Acorn Day Care Center",       county: 'Onondaga'    },
    { name: "Ladybug SDCC",              county: 'Orange'      },
    { name: "Dewdrop Child Center",        county: 'Dutchess'    },
    { name: "Puddle Jump SDCC",           county: 'Rockland'    },
    { name: "Firefly Day Center",          county: 'Saratoga'    },
    { name: "Clover SDCC",               county: 'Schenectady' },
    { name: "Daisy Chain Center",          county: 'Rensselaer'  },
    { name: "Moonbeam SDCC",             county: 'Richmond'    },
    { name: "Starfish Day Center",         county: 'Niagara'     },
    { name: "Peppercorn SDCC",           county: 'Oneida'      },
    { name: "Buttercup Child Center",      county: 'Tompkins'    },
  ],
}

const CARD_GRADIENTS = [
  ['#fca5a5', '#dc2626'], ['#22d3ee', '#0e7490'], ['#4ade80', '#15803d'],
  ['#fde047', '#b45309'], ['#34d399', '#065f46'], ['#60a5fa', '#1d4ed8'],
  ['#2dd4bf', '#0f766e'], ['#c084fc', '#7e22ce'], ['#fb923c', '#c2410c'],
  ['#f472b6', '#be185d'],
]

const PROVIDER_TABS = [
  'Family Day Care',
  'Group Family Day Care',
  'School Age Child Care',
  'Small Day Care Center',
]

export function ProviderSection() {
  const [activeTab, setActiveTab] = useState(0)
  const currentProviders = PROVIDERS[PROVIDER_TABS[activeTab]]

  return (
    <div>
      <div className="sticky top-0 z-10 bg-[var(--surface)] -mx-4 px-4 flex items-center gap-1 border-b border-[var(--border)] mb-4">
        {PROVIDER_TABS.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className={cn(
              'px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap',
              activeTab === i
                ? 'border-blue-500 text-[var(--txt)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--txt)]'
            )}>
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 pb-6">
        {currentProviders.map((p, i) => {
          const [light, dark] = CARD_GRADIENTS[i % CARD_GRADIENTS.length]
          return (
            <Link key={`${p.name}-${i}`}
              href={`/county/${p.county.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm transition-shadow hover:shadow-md"
              style={{ background: `linear-gradient(135deg, ${light}, ${dark})` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute top-3 right-3 rounded-full bg-white/20 backdrop-blur-sm px-2 py-1">
                <span className="text-xs font-bold text-white">{PROVIDER_TABS[activeTab].split(' ').map(w => w[0]).join('')}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
                <p className="text-sm font-bold text-white leading-snug">{p.name}</p>
                <p className="text-[10px] text-white/70">{p.county}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
