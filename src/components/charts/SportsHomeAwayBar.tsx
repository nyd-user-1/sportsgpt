'use client'

import * as React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { SEASON_CHANGE_EVENT } from '@/lib/app-config'
import { SCHOOL_LOGOS } from '@/lib/team-images'

export interface HomeAwayTeam {
  name: string
  school_slug: string
  home_wins: number
  away_wins: number
}

export interface HomeAwaySeason {
  season: string
  teams: HomeAwayTeam[]
}

function abbrev(name: string) {
  return name.replace(' Varsity Football', '').replace(' Football', '')
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: unknown[] }) {
  if (!active || !payload?.length) return null
  const item = (payload as { payload?: HomeAwayTeam }[])[0]?.payload
  if (!item) return null
  const logo = SCHOOL_LOGOS[item.school_slug]
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 12, minWidth: 160 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontWeight: 700 }}>
        {logo && <img src={logo} alt="" width={24} height={24} style={{ borderRadius: '50%', objectFit: 'cover' }} />}
        <span>{abbrev(item.name)}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, backgroundColor: '#033882', flexShrink: 0 }} />
        <span style={{ color: '#6b7280' }}>Home Wins</span>
        <span style={{ marginLeft: 'auto', fontWeight: 600, paddingLeft: 8 }}>{item.home_wins}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, backgroundColor: '#94a3b8', flexShrink: 0 }} />
        <span style={{ color: '#6b7280' }}>Away Wins</span>
        <span style={{ marginLeft: 'auto', fontWeight: 600, paddingLeft: 8 }}>{item.away_wins}</span>
      </div>
    </div>
  )
}

export function SportsHomeAwayBar({ seasons }: { seasons: HomeAwaySeason[] }) {
  const defaultSeason = seasons[seasons.length - 1]?.season ?? ''
  const [active, setActive] = React.useState(defaultSeason)

  React.useEffect(() => {
    function handler(e: Event) {
      const yr = (e as CustomEvent<string>).detail
      if (seasons.some(s => s.season === yr)) setActive(yr)
    }
    window.addEventListener(SEASON_CHANGE_EVENT, handler)
    return () => window.removeEventListener(SEASON_CHANGE_EVENT, handler)
  }, [seasons])

  const data = (seasons.find(s => s.season === active)?.teams ?? []).slice(0, 40)

  return (
    <Card className="border-0 shadow-none py-0">
      <CardContent className="px-0 pb-0">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 0, right: 12, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#f0f0f0" strokeDasharray="3 3" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={false} height={4} />
              <YAxis hide tickCount={10} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                content={({ active, payload }) => (
                  <CustomTooltip active={active} payload={payload as unknown[]} />
                )}
              />
              <Bar dataKey="away_wins" name="Away Wins" fill="#94a3b8" radius={0} />
              <Bar dataKey="home_wins" name="Home Wins" fill="#033882" radius={0} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
