'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { APIProvider, Map as GMap, useMap } from '@vis.gl/react-google-maps'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { countyToSlug } from '@/lib/ny-counties'

const COUNTIES_URL = 'https://raw.githubusercontent.com/nyd-user-1/nyd-geojson/main/us-counties.geojson'

// NY FIPS
const NY_STATE_FIPS = '36'

// Bounds for all of New York State
const NY_BOUNDS = { north: 45.01, south: 40.49, east: -71.77, west: -79.76 }

export type ChoroplethMetric =
  | 'mcinfant' | 'mctoddler' | 'mcpreschool'
  | 'mfccinfant' | 'mfcctoddler' | 'mfccpreschool'
  | 'mhi' | 'pr_f'

export type CountyCostRow = {
  county_fips_code: string
  county_name: string
  studyyear: number
  mcinfant: number | null
  mctoddler: number | null
  mcpreschool: number | null
  mfccinfant: number | null
  mfcctoddler: number | null
  mfccpreschool: number | null
  _75cinfant: number | null
  _75ctoddler: number | null
  _75cpreschool: number | null
  flfpr_20to64_under6: number | null
  mhi: number | null
  mfi: number | null
  pr_f: number | null
  pr_p: number | null
  h_under6_bothwork: number | null
  h_under6_singlem: number | null
}

const METRIC_META: Record<ChoroplethMetric, { label: string; format: (v: number) => string; thresholds: number[]; unit: string }> = {
  mcinfant:    { label: 'Median Infant Care',     unit: '/wk', format: v => `$${Math.round(v)}`, thresholds: [310, 295, 280, 270, 260] },
  mctoddler:   { label: 'Median Toddler Care',    unit: '/wk', format: v => `$${Math.round(v)}`, thresholds: [290, 275, 265, 255, 248] },
  mcpreschool: { label: 'Median Preschool Care',  unit: '/wk', format: v => `$${Math.round(v)}`, thresholds: [270, 255, 240, 228, 215] },
  mfccinfant:  { label: 'Family CC Infant',       unit: '/wk', format: v => `$${Math.round(v)}`, thresholds: [290, 275, 265, 255, 248] },
  mfcctoddler: { label: 'Family CC Toddler',      unit: '/wk', format: v => `$${Math.round(v)}`, thresholds: [275, 260, 250, 240, 230] },
  mfccpreschool:{ label: 'Family CC Preschool',   unit: '/wk', format: v => `$${Math.round(v)}`, thresholds: [265, 250, 238, 228, 218] },
  mhi:         { label: 'Median Household Income', unit: '',   format: v => `$${Math.round(v/1000)}k`, thresholds: [120000, 90000, 70000, 55000, 45000] },
  pr_f:        { label: 'Female Poverty Rate',    unit: '%',   format: v => `${v.toFixed(1)}%`, thresholds: [20, 15, 10, 7, 4] },
}

// Amber scale — darkest = highest cost (reversed for pr_f handled via threshold order)
const COLORS = ['#92400e', '#b45309', '#d97706', '#f59e0b', '#fbbf24', '#fef3c7']

function metricColor(value: number, thresholds: number[]): string {
  for (let i = 0; i < thresholds.length; i++) {
    if (value >= thresholds[i]) return COLORS[i]
  }
  return COLORS[COLORS.length - 1]
}

function buildLegendLabels(thresholds: number[], meta: typeof METRIC_META[ChoroplethMetric]) {
  return [
    `${meta.format(thresholds[0])}+`,
    `${meta.format(thresholds[1])} – ${meta.format(thresholds[0])}`,
    `${meta.format(thresholds[2])} – ${meta.format(thresholds[1])}`,
    `${meta.format(thresholds[3])} – ${meta.format(thresholds[2])}`,
    `${meta.format(thresholds[4])} – ${meta.format(thresholds[3])}`,
    `< ${meta.format(thresholds[4])}`,
  ]
}

type Bounds = { north: number; south: number; east: number; west: number }
type HoverData = { name: string; value: number | null }

function FitBounds({ bounds }: { bounds: Bounds }) {
  const map = useMap()
  useEffect(() => {
    if (!map) return
    map.fitBounds(bounds, 32)
  }, [map, bounds])
  return null
}

function NYChoroplethLayer({
  data, metric, onHoverChange,
}: {
  data: CountyCostRow[]
  metric: ChoroplethMetric
  onHoverChange: (d: HoverData | null) => void
}) {
  const map = useMap()
  const router = useRouter()
  const initialized = useRef(false)
  const metricRef = useRef(metric)
  metricRef.current = metric
  const dataRef = useRef(data)
  dataRef.current = data

  useEffect(() => {
    if (!map || initialized.current) return
    initialized.current = true

    const lookup = new Map<string, CountyCostRow>()
    for (const row of data) lookup.set(row.county_fips_code, row)

    fetch(COUNTIES_URL)
      .then(r => r.json())
      .then((geojson: { type: string; features: { properties: Record<string, string>; geometry: object; type: string }[] }) => {
        const nyFeatures = {
          type: 'FeatureCollection',
          features: geojson.features.filter(f => f.properties.STATEFP === NY_STATE_FIPS),
        }
        map.data.addGeoJson(nyFeatures)
        map.data.setStyle((feature: google.maps.Data.Feature) => {
          const fips = (feature.getProperty('STATEFP') as string) + (feature.getProperty('COUNTYFP') as string)
          const row = lookup.get(fips)
          const val = row ? (row[metricRef.current] as number | null) : null
          const meta = METRIC_META[metricRef.current]
          return {
            fillColor: val != null ? metricColor(val, meta.thresholds) : '#e5e7eb',
            fillOpacity: val != null ? 0.78 : 0.3,
            strokeColor: '#ffffff',
            strokeWeight: 0.8,
            strokeOpacity: 0.9,
          }
        })

        map.data.addListener('mouseover', (e: google.maps.Data.MouseEvent) => {
          map.data.overrideStyle(e.feature, { strokeWeight: 2.5, strokeColor: '#1e3a5f', fillOpacity: 0.95 })
          const fips = (e.feature.getProperty('STATEFP') as string) + (e.feature.getProperty('COUNTYFP') as string)
          const row = lookup.get(fips)
          onHoverChange(row ? { name: row.county_name, value: row[metricRef.current] as number | null } : null)
        })
        map.data.addListener('mouseout', (e: google.maps.Data.MouseEvent) => {
          map.data.revertStyle(e.feature)
          onHoverChange(null)
        })
        map.data.addListener('click', (e: google.maps.Data.MouseEvent) => {
          const fips = (e.feature.getProperty('STATEFP') as string) + (e.feature.getProperty('COUNTYFP') as string)
          const row = lookup.get(fips)
          if (!row) return
          // county_name is like "Albany County" → strip " County" for the slug lookup
          const bare = row.county_name.replace(/ County$/, '')
          router.push(`/county/${countyToSlug(bare)}`)
        })
      })
  }, [map, data, onHoverChange, router])

  // Re-style when metric changes without reloading GeoJSON
  useEffect(() => {
    if (!map) return
    const lookup = new Map<string, CountyCostRow>()
    for (const row of dataRef.current) lookup.set(row.county_fips_code, row)
    const meta = METRIC_META[metric]
    map.data.setStyle((feature: google.maps.Data.Feature) => {
      const fips = (feature.getProperty('STATEFP') as string) + (feature.getProperty('COUNTYFP') as string)
      const row = lookup.get(fips)
      const val = row ? (row[metric] as number | null) : null
      return {
        fillColor: val != null ? metricColor(val, meta.thresholds) : '#e5e7eb',
        fillOpacity: val != null ? 0.78 : 0.3,
        strokeColor: '#ffffff',
        strokeWeight: 0.8,
        strokeOpacity: 0.9,
      }
    })
  }, [map, metric])

  return null
}

const MAP_STYLE = [
  { featureType: 'all',    elementType: 'labels',          stylers: [{ visibility: 'off' }] },
  { featureType: 'water',  elementType: 'geometry',        stylers: [{ color: '#dbeafe' }] },
  { featureType: 'landscape', elementType: 'geometry',     stylers: [{ color: '#f8f8f8' }] },
  { featureType: 'road',   elementType: 'all',             stylers: [{ visibility: 'off' }] },
  { featureType: 'poi',    elementType: 'all',             stylers: [{ visibility: 'off' }] },
  { featureType: 'transit',elementType: 'all',             stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#94a3b8' }, { weight: '1.5' }] },
]

export default function NYCountyChoropleth({
  data,
  metric = 'mcinfant',
  year = 2022,
  onMetricChange,
  className = 'w-full h-[420px] rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.08)]',
}: {
  data: CountyCostRow[]
  metric?: ChoroplethMetric
  year?: number
  onMetricChange?: (m: ChoroplethMetric) => void
  className?: string
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''
  const [hovered, setHovered] = useState<HoverData | null>(null)
  const [legendOpen, setLegendOpen] = useState(false)

  const meta = METRIC_META[metric]
  const legendLabels = useMemo(() => buildLegendLabels(meta.thresholds, meta), [meta])

  const stateAvg = useMemo(() => {
    const vals = data.map(r => r[metric] as number | null).filter((v): v is number => v != null)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
  }, [data, metric])

  const chip = hovered
    ? { name: hovered.name, display: hovered.value != null ? `${meta.format(hovered.value)}${meta.unit}` : 'No data' }
    : { name: `NY State · ${year}`, display: stateAvg != null ? `avg ${meta.format(stateAvg)}${meta.unit}` : '—' }

  return (
    <div className={`relative ${className}`}>
      <APIProvider apiKey={apiKey}>
        <GMap
          defaultCenter={{ lat: 42.9, lng: -75.6 }}
          defaultZoom={6}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          styles={MAP_STYLE}
          style={{ width: '100%', height: '100%' }}
        >
          <FitBounds bounds={NY_BOUNDS} />
          <NYChoroplethLayer data={data} metric={metric} onHoverChange={setHovered} />
        </GMap>
      </APIProvider>

      {/* Info chip + legend */}
      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-xl shadow-md overflow-hidden min-w-[160px]">
        <button
          type="button"
          onClick={() => setLegendOpen(o => !o)}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
        >
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#555] truncate">{meta.label}</p>
            <p className="text-sm font-bold text-[#1a1a1a] truncate">{chip.name}</p>
            <p className="text-[11px] text-[#888] mt-0.5">{chip.display}</p>
          </div>
          <ChevronDown className={`h-4 w-4 shrink-0 text-[#999] transition-transform ${legendOpen ? 'rotate-180' : ''}`} />
        </button>

        {legendOpen && (
          <>
            <div className="border-t border-black/10 mx-3" />
            <div className="px-3 pt-2 pb-2.5 space-y-0.5">
              {COLORS.map((color, i) => (
                <div key={color} className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm shrink-0 border border-black/10" style={{ background: color }} />
                  <span className="text-[10px] text-[#333]">{legendLabels[i]}</span>
                </div>
              ))}
            </div>

            {onMetricChange && (
              <>
                <div className="border-t border-black/10 mx-3" />
                <div className="px-3 pt-2 pb-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#999] mb-1.5">Metric</p>
                  {(Object.keys(METRIC_META) as ChoroplethMetric[]).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => onMetricChange(m)}
                      className={`block w-full text-left text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                        m === metric ? 'bg-amber-100 text-amber-900 font-semibold' : 'text-[#444] hover:bg-black/5'
                      }`}
                    >
                      {METRIC_META[m].label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
