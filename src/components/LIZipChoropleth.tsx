'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

const NY_ZIP_GEOJSON = 'https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/ny_new_york_zip_codes_geo.min.json'

const LI_BOUNDS = { north: 41.15, south: 40.55, east: -71.85, west: -73.98 }

const MAP_STYLE = [
  { featureType: 'all', elementType: 'labels.text', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'administrative.locality', elementType: 'labels', stylers: [{ visibility: 'on' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f8f8f8' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#e5e7eb' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#d1d5db' }] },
  { featureType: 'road.local', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'all', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'all', stylers: [{ visibility: 'off' }] },
]

function winColor(pct: number | null): string {
  if (pct === null) return '#e5e7eb'
  if (pct >= 0.80) return '#1e3a8a'
  if (pct >= 0.60) return '#2563eb'
  if (pct >= 0.40) return '#60a5fa'
  if (pct >= 0.20) return '#bfdbfe'
  return '#eff6ff'
}

const LEGEND = [
  { color: '#1e3a8a', label: '80%+ win rate' },
  { color: '#2563eb', label: '60 – 80%' },
  { color: '#60a5fa', label: '40 – 60%' },
  { color: '#bfdbfe', label: '20 – 40%' },
  { color: '#eff6ff', label: 'Under 20%' },
]

export type SchoolZipEntry = {
  zip: string
  school_name: string
  team_slug: string
  division: string
  wins: number
  losses: number
  win_pct: number | null
}

type ChipData = { title: string; subtitle: string | null; record: string | null }

function FitBounds() {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    map.fitBounds(LI_BOUNDS, 24)
  }, [map])
  return null
}

function ZipLayer({ schools, onHover, onLoaded }: {
  schools: SchoolZipEntry[]
  onHover: (chip: ChipData | null) => void
  onLoaded: () => void
}) {
  const map = useMap()
  const router = useRouter()
  const initialized = useRef(false)

  useEffect(() => {
    if (!map || initialized.current) return
    initialized.current = true

    const lookup: Record<string, SchoolZipEntry> = {}
    for (const s of schools) lookup[s.zip] = s
    const zipSet = new Set(Object.keys(lookup))

    fetch(NY_ZIP_GEOJSON)
      .then(r => r.json())
      .then((gj: { type: string; features: { properties: Record<string, string>; geometry: object; type: string }[] }) => {
        const filtered = {
          type: 'FeatureCollection',
          features: gj.features.filter(f => {
            const zip = f.properties.ZCTA5CE10 ?? f.properties.GEOID10
            return zipSet.has(zip)
          }),
        }
        map.data.addGeoJson(filtered)
        map.data.setStyle((feature: google.maps.Data.Feature) => {
          const zip = (feature.getProperty('ZCTA5CE10') ?? feature.getProperty('GEOID10')) as string
          const s = lookup[zip]
          return {
            fillColor: s ? winColor(s.win_pct) : '#e5e7eb',
            fillOpacity: s ? 0.78 : 0.2,
            strokeColor: '#ffffff',
            strokeWeight: 1,
            strokeOpacity: 0.9,
          }
        })
        map.data.addListener('click', (e: google.maps.Data.MouseEvent) => {
          const zip = (e.feature.getProperty('ZCTA5CE10') ?? e.feature.getProperty('GEOID10')) as string
          const s = lookup[zip]
          if (s) router.push(`/team/${s.team_slug}`)
        })
        map.data.addListener('mouseover', (e: google.maps.Data.MouseEvent) => {
          const zip = (e.feature.getProperty('ZCTA5CE10') ?? e.feature.getProperty('GEOID10')) as string
          const s = lookup[zip]
          map.data.overrideStyle(e.feature, { strokeWeight: 2.5, strokeColor: '#033882', fillOpacity: 0.95 })
          if (s) {
            const games = s.wins + s.losses
            onHover({
              title: s.school_name,
              subtitle: `${zip} · Division ${s.division}`,
              record: games > 0 ? `${s.wins}–${s.losses}` : 'No games',
            })
          }
        })
        map.data.addListener('mouseout', () => {
          map.data.revertStyle()
          onHover(null)
        })
        onLoaded()
      })
  }, [map, schools, onHover, onLoaded, router])

  return null
}

export default function LIZipChoropleth({ schools, season }: {
  schools: SchoolZipEntry[]
  season: string
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const [hoveredChip, setHoveredChip] = useState<ChipData | null>(null)
  const [legendOpen, setLegendOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const handleLoaded = useCallback(() => setLoaded(true), [])
  const handleHover = useCallback((chip: ChipData | null) => setHoveredChip(chip), [])

  const defaultChip = useMemo<ChipData>(() => ({
    title: 'Section XI Football',
    subtitle: `${season} season · ${schools.length} schools`,
    record: null,
  }), [schools.length, season])

  const chip = hoveredChip ?? defaultChip

  if (!apiKey) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-[var(--muted)]">
        <p className="text-sm font-medium">Google Maps API key not configured.</p>
        <p className="text-xs">Add <code className="bg-[var(--inp-bg)] px-1.5 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to .env.local</p>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat: 40.83, lng: -72.92 }}
          defaultZoom={10}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          styles={MAP_STYLE as any}
          style={{ width: '100%', height: '100%' }}
        >
          <FitBounds />
          <ZipLayer schools={schools} onHover={handleHover} onLoaded={handleLoaded} />
        </Map>
      </APIProvider>

      {/* Skeleton overlay */}
      <div className={`absolute inset-0 z-10 bg-[var(--inp-bg)] pointer-events-none transition-opacity duration-700 ${loaded ? 'opacity-0' : 'opacity-100'}`} />

      {/* Info chip + legend */}
      <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-sm rounded-xl shadow-md overflow-hidden min-w-[190px]">
        <button
          type="button"
          onClick={() => setLegendOpen(o => !o)}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-black/[0.03] transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#1a1a1a] truncate">{chip.title}</p>
            {chip.subtitle && <p className="text-[11px] text-[#666] truncate">{chip.subtitle}</p>}
            {chip.record && <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#033882' }}>{chip.record}</p>}
          </div>
          <ChevronDown className={`h-4 w-4 shrink-0 text-[#aaa] transition-transform ${legendOpen ? 'rotate-180' : ''}`} />
        </button>
        {legendOpen && (
          <>
            <div className="border-t border-black/08 mx-3" />
            <div className="px-3 pt-2 pb-3 space-y-1">
              <p className="text-[9px] font-semibold uppercase tracking-widest text-[#aaa] mb-1.5">Win Rate</p>
              {LEGEND.map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-[3px] shrink-0 border border-black/10" style={{ background: color }} />
                  <span className="text-[11px] text-[#444]">{label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
