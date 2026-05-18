'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import { useRouter } from 'next/navigation'
import { SCHOOL_COLORS } from '@/lib/school-colors'

const GEOJSON_URL = 'https://tmdolblsg0vd3laa.public.blob.vercel-storage.com/geojson/suffolk-schools.geojson'

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

// Maps GeoJSON POPULAR_NA → school slugs in our DB
const DISTRICT_SCHOOLS: Record<string, string[]> = {
  'AMITYVILLE UFSD':               ['amityville'],
  'BABYLON UFSD':                  ['babylon'],
  'BAY SHORE UFSD':                ['bay-shore'],
  'BAYPORT-BLUE POINT UFSD':       ['bayport-blue-point'],
  'BRENTWOOD UFSD':                ['brentwood'],
  'BROOKHAVEN-COMSEWOGUE UFSD':    ['comsewogue'],
  'CENTER MORICHES UFSD':          ['center-moriches'],
  'CENTRAL ISLIP UFSD':            ['central-islip'],
  'COMMACK UFSD':                  ['commack'],
  'CONNETQUOT CSD':                ['connetquot'],
  'COPIAGUE UFSD':                 ['copiague'],
  'DEER PARK UFSD':                ['deer-park'],
  'AMAGANSETT UFSD':               ['east-hampton-bridgehampton-pierson'],
  'EAST HAMPTON UFSD':             ['east-hampton-bridgehampton-pierson'],
  'MONTAUK UFSD':                  ['east-hampton-bridgehampton-pierson'],
  'SPRINGS UFSD':                  ['east-hampton-bridgehampton-pierson'],
  'EAST ISLIP UFSD':               ['east-islip'],
  'EASTPORT-SOUTH MANOR CSD':      ['eastport-south-manor'],
  'ELWOOD UFSD':                   ['glenn'],
  'GREENPORT UFSD':                ['greenport-southold-mattituck'],
  'MATTITUCK-CUTCHOGUE UFSD':      ['greenport-southold-mattituck'],
  'OYSTERPONDS UFSD':              ['greenport-southold-mattituck'],
  'SHELTER ISLAND UFSD':           ['greenport-southold-mattituck'],
  'SOUTHOLD UFSD':                 ['greenport-southold-mattituck'],
  'HALF HOLLOW HILLS CSD':         ['half-hollow-hills-east', 'half-hollow-hills-west'],
  'EAST QUOGUE UFSD':              ['hampton-bays'],
  'HAMPTON BAYS UFSD':             ['hampton-bays'],
  'HARBORFIELDS CSD':              ['harborfields'],
  'HAUPPAUGE UFSD':                ['hauppauge'],
  'HUNTINGTON UFSD':               ['huntington'],
  'ISLIP UFSD':                    ['islip'],
  'KINGS PARK CSD':                ['kings-park'],
  'LINDENHURST UFSD':              ['lindenhurst'],
  'LONGWOOD CSD':                  ['longwood'],
  'MIDDLE COUNTRY CSD':            ['centereach', 'newfield'],
  'MILLER PLACE UFSD':             ['miller-place'],
  'MT SINAI UFSD':                 ['mt-sinai'],
  'NORTH BABYLON UFSD':            ['north-babylon'],
  'NORTHPORT-EAST NORTHPORT UFSD': ['northport'],
  'PATCHOGUE-MEDFORD UFSD':        ['patchogue-medford'],
  'PORT JEFFERSON UFSD':           ['port-jefferson'],
  'RIVERHEAD CSD':                 ['riverhead'],
  'ROCKY POINT UFSD':              ['rocky-point'],
  'SACHEM CSD':                    ['sachem-north', 'sachem-east'],
  'SAYVILLE UFSD':                 ['sayville'],
  'SHOREHAM-WADING RIVER CSD':     ['shoreham-wading-river'],
  'SMITHTOWN CSD':                 ['smithtown-east', 'smithtown-west'],
  'SOUTH COUNTRY CSD':             ['bellport'],
  'SOUTH HUNTINGTON UFSD':         ['whitman'],
  'SOUTHAMPTON UFSD':              ['southampton'],
  'THREE VILLAGE CSD':             ['ward-melville'],
  'WEST BABYLON UFSD':             ['west-babylon'],
  'WEST ISLIP UFSD':               ['west-islip'],
  'REMSENBURG-SPEONK UFSD':        ['westhampton'],
  'WESTHAMPTON BEACH UFSD':        ['westhampton'],
  'WILLIAM FLOYD UFSD':            ['floyd'],
  'WYANDANCH UFSD':                ['wyandanch'],
}

function districtColor(slugs: string[]): string {
  for (const s of slugs) {
    const c = SCHOOL_COLORS[s]?.primary
    if (c) return c
  }
  return '#e5e7eb'
}

export type SchoolRecord = {
  school_slug: string
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

function DistrictLayer({ schools, onHover, onLoaded }: {
  schools: SchoolRecord[]
  onHover: (chip: ChipData | null) => void
  onLoaded: () => void
}) {
  const map = useMap()
  const router = useRouter()
  const initialized = useRef(false)

  // Build lookup: school_slug → SchoolRecord
  const bySlug = useMemo(() => {
    const m: Record<string, SchoolRecord> = {}
    for (const s of schools) m[s.school_slug] = s
    return m
  }, [schools])

  useEffect(() => {
    if (!map || initialized.current) return
    initialized.current = true

    fetch(GEOJSON_URL)
      .then(r => r.json())
      .then((gj: { type: string; features: { properties: Record<string, unknown>; geometry: object; type: string }[] }) => {
        // Only include districts that have at least one matching school
        const filtered = {
          type: 'FeatureCollection',
          features: gj.features.filter(f => {
            const name = String(f.properties.POPULAR_NA ?? '')
            const slugs = DISTRICT_SCHOOLS[name] ?? []
            return slugs.some(s => bySlug[s])
          }),
        }

        map.data.addGeoJson(filtered)

        map.data.setStyle((feature: google.maps.Data.Feature) => {
          const name = String(feature.getProperty('POPULAR_NA') ?? '')
          const slugs = DISTRICT_SCHOOLS[name] ?? []
          return {
            fillColor: districtColor(slugs),
            fillOpacity: 0.75,
            strokeColor: '#ffffff',
            strokeWeight: 1.2,
            strokeOpacity: 1,
          }
        })

        map.data.addListener('click', (e: google.maps.Data.MouseEvent) => {
          const name = String(e.feature.getProperty('POPULAR_NA') ?? '')
          const slugs = DISTRICT_SCHOOLS[name] ?? []
          const first = slugs.find(s => bySlug[s])
          if (first) router.push(`/team/${bySlug[first].team_slug}`)
        })

        map.data.addListener('mouseover', (e: google.maps.Data.MouseEvent) => {
          const name = String(e.feature.getProperty('POPULAR_NA') ?? '')
          const slugs = DISTRICT_SCHOOLS[name] ?? []
          const records = slugs.map(s => bySlug[s]).filter(Boolean)
          map.data.overrideStyle(e.feature, { strokeWeight: 2.5, strokeColor: '#033882', fillOpacity: 0.95 })
          if (records.length > 0) {
            const names = records.map(r => r.school_name).join(' / ')
            const totalW = records.reduce((s, r) => s + r.wins, 0)
            const totalL = records.reduce((s, r) => s + r.losses, 0)
            onHover({
              title: names,
              subtitle: records[0].division ? `Division ${records[0].division}` : name,
              record: totalW + totalL > 0 ? `${totalW}–${totalL}` : 'No games',
            })
          }
        })

        map.data.addListener('mouseout', () => {
          map.data.revertStyle()
          onHover(null)
        })

        onLoaded()
      })
  }, [map, bySlug, onHover, onLoaded, router])

  return null
}

export default function SuffolkDistrictMap({ schools, season }: {
  schools: SchoolRecord[]
  season: string
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const [hoveredChip, setHoveredChip] = useState<ChipData | null>(null)
  const [loaded, setLoaded] = useState(false)
  const handleLoaded = useCallback(() => setLoaded(true), [])
  const handleHover = useCallback((chip: ChipData | null) => setHoveredChip(chip), [])

  const defaultChip = useMemo<ChipData>(() => ({
    title: 'Section XI Football',
    subtitle: `${season} · ${schools.length} schools`,
    record: null,
  }), [season, schools.length])

  const chip = hoveredChip ?? defaultChip

  if (!apiKey) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-[var(--muted)]">
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
          <DistrictLayer schools={schools} onHover={handleHover} onLoaded={handleLoaded} />
        </Map>
      </APIProvider>

      {/* Skeleton */}
      <div className={`absolute inset-0 z-10 bg-[var(--inp-bg)] pointer-events-none transition-opacity duration-700 ${loaded ? 'opacity-0' : 'opacity-100'}`} />

      {/* Chip */}
      <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-sm rounded-xl shadow-md px-3 py-2.5 min-w-[180px] max-w-[240px]">
        <p className="text-sm font-bold text-[#1a1a1a] truncate">{chip.title}</p>
        {chip.subtitle && <p className="text-[11px] text-[#666] truncate">{chip.subtitle}</p>}
        {chip.record && <p className="text-[11px] font-semibold mt-0.5" style={{ color: '#033882' }}>{chip.record}</p>}
      </div>
    </div>
  )
}
