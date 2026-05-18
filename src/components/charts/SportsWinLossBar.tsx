'use client'

import { useEffect, useRef, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from 'recharts'
import { ChevronDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { SEASON_CHANGE_EVENT } from '@/lib/app-config'

export interface WinLossTeam { name: string; division: string; wins: number; losses: number }
export interface WinLossSeason { season: string; teams: WinLossTeam[] }

const DIVISIONS = ['I', 'II', 'III', 'IV']

function abbreviate(name: string): string {
  return name.replace(/ Varsity Football$/, '').replace(/ Football$/, '')
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload?: WinLossTeam & { name: string } }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <p style={{ fontWeight: 700, color: '#111', marginBottom: 4 }}>{d.name}</p>
      <span style={{ color: '#033882', fontWeight: 600 }}>{d.wins}W</span>
      {' '}
      <span style={{ color: '#ef4444', fontWeight: 600 }}>{d.losses}L</span>
    </div>
  )
}

interface Props { seasons: WinLossSeason[] }

export function SportsWinLossBar({ seasons }: Props) {
  const [active, setActive] = useState<string>(seasons[seasons.length - 1]?.season ?? '')
  const [division, setDivision] = useState('I')
  const [divOpen, setDivOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: Event) {
      const season = (e as CustomEvent<string>).detail
      if (seasons.some(s => s.season === season)) {
        setActive(season)
      }
    }
    window.addEventListener(SEASON_CHANGE_EVENT, handler)
    return () => window.removeEventListener(SEASON_CHANGE_EVENT, handler)
  }, [seasons])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDivOpen(false)
      }
    }
    if (divOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [divOpen])

  const allTeams = seasons.find(s => s.season === active)?.teams ?? []
  const data = allTeams
    .filter(t => t.division === division)
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 16)
    .map(t => ({ ...t, name: abbreviate(t.name) }))

  return (
    <Card className="border-0 shadow-none py-0">
      <CardContent className="px-0 pb-0">
        <div className="relative mb-2 flex items-center" ref={dropdownRef}>
          <button
            onClick={() => setDivOpen(o => !o)}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
          >
            Division {division}
            <ChevronDown size={10} />
          </button>
          {divOpen && (
            <div className="absolute top-full left-0 z-10 mt-1 rounded border border-gray-200 bg-white py-1 shadow-md">
              {DIVISIONS.map(d => (
                <button
                  key={d}
                  onClick={() => { setDivision(d); setDivOpen(false) }}
                  className={`block w-full px-4 py-1 text-left text-xs hover:bg-gray-50 ${d === division ? 'font-semibold text-[#033882]' : 'text-gray-700'}`}
                >
                  Division {d}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="h-[260px] sm:h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={data} margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: '#94a3b8' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 9, fill: '#374151' }}
                width={84}
              />
              <Tooltip
                content={({ active, payload }) => (
                  <CustomTooltip active={active} payload={payload as unknown as { payload?: WinLossTeam & { name: string } }[]} />
                )}
              />
              <Bar dataKey="wins" stackId="a" fill="#033882" radius={0} />
              <Bar dataKey="losses" stackId="a" fill="#ef4444" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
