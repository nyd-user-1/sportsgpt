'use client'

import { use, useState, useRef } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronDown, ChartSpline, MessageCircle } from 'lucide-react'
import { PanelChart } from '@/components/PanelChart'
import { PanelChat } from '@/components/PanelChat'
import { PLACEHOLDER_TEAMS, toSlug } from '@/lib/placeholder-data'
import { ACCENT_COLOR } from '@/lib/app-config'
import { cn } from '@/lib/utils'

const DEFAULT_ROWS = 2

function fmtPct(w: number, l: number) {
  const g = w + l
  return g === 0 ? '—' : (w / g).toFixed(3).replace(/^0/, '')
}

export default function TeamDetailSlot({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const sorted = [...PLACEHOLDER_TEAMS].sort((a, b) => b.wins - a.wins || b.pf - a.pf)
  const team   = sorted.find(t => toSlug(t.name) === slug)
  if (!team) notFound()

  const idx      = sorted.findIndex(t => t.id === team.id)
  const n        = sorted.length
  const prevSlug = toSlug(sorted[(idx - 1 + n) % n].name)
  const nextSlug = toSlug(sorted[(idx + 1) % n].name)

  const [infoExpanded, setInfoExpanded] = useState(false)
  const [chartsOpen,   setChartsOpen]   = useState(false)
  const [chatOpen,     setChatOpen]     = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  const diff = team.pf - team.pa

  const profileRows = [
    { label: 'Record',             value: `${team.wins}–${team.losses}`,         highlight: false },
    { label: 'Win %',              value: fmtPct(team.wins, team.losses),         highlight: true  },
    { label: 'Points For',         value: String(team.pf),                        highlight: false },
    { label: 'Points Against',     value: String(team.pa),                        highlight: false },
    { label: 'Point Differential', value: diff >= 0 ? `+${diff}` : String(diff), highlight: diff > 0 },
    { label: 'Division',           value: `Division ${team.division}`,            highlight: false },
    { label: 'City',               value: team.city,                              highlight: false },
    { label: 'Coach',              value: team.coach,                             highlight: false },
  ]

  const visibleRows = infoExpanded ? profileRows : profileRows.slice(0, DEFAULT_ROWS)

  const btn    = 'inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors'
  const active = 'text-[var(--txt)] bg-[var(--inp-bg)]'

  const divisionTeams = PLACEHOLDER_TEAMS.filter(t => t.division === team.division && t.id !== team.id)

  return (
    <>
      <div className="h-full overflow-y-auto no-scrollbar">
        <div className="px-5 pt-5 pb-4">

          {/* Header */}
          <div className="mb-5 flex items-center justify-between gap-2">
            <h1 className="text-lg font-bold text-[var(--txt)] leading-snug">{team.name}</h1>
            <div className="flex items-center shrink-0">
              <div className="inline-flex -space-x-px">
                <Link href={`/launchpad/${prevSlug}`} scroll={false} className={`${btn} rounded-l-full`}><ChevronLeft className="h-4 w-4" /></Link>
                <button onClick={() => setChartsOpen(v => !v)} className={`${btn} ${chartsOpen ? active : ''}`}><ChartSpline className="h-4 w-4" /></button>
                <button onClick={() => setChatOpen(v => !v)}   className={`${btn} ${chatOpen   ? active : ''}`}><MessageCircle className="h-4 w-4" /></button>
                <Link href={`/launchpad/${nextSlug}`} scroll={false} className={`${btn} rounded-r-full`}><ChevronRight className="h-4 w-4" /></Link>
              </div>
            </div>
          </div>

          {/* InfoTable */}
          <div className="mb-5 rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
            <button
              onClick={() => setInfoExpanded(v => !v)}
              className="flex items-center justify-between w-full px-4 py-3 bg-[var(--surface)] hover:bg-[var(--inp-bg)] transition-colors"
            >
              <span className="text-sm font-semibold text-[var(--txt)]">Team Profile</span>
              <ChevronDown className={cn('h-4 w-4 text-[var(--muted)] transition-transform duration-200', infoExpanded && 'rotate-180')} />
            </button>
            {visibleRows.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto] gap-x-3 px-4 py-2.5 border-t border-[var(--border)]">
                <span className="text-sm text-[var(--muted)]">{row.label}</span>
                <span className={cn('text-sm text-right', row.highlight ? 'font-bold' : 'text-[var(--txt)]')}
                  style={row.highlight ? { color: ACCENT_COLOR } : undefined}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* Division peers */}
          <div ref={carouselRef} className="overflow-x-auto no-scrollbar">
            <div className="flex gap-2 pb-1">
              {divisionTeams.map(t => (
                <Link key={t.id} href={`/launchpad/${toSlug(t.name)}`} scroll={false}
                  className="shrink-0 w-36 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 hover:bg-[var(--inp-bg)] hover:border-transparent transition-all">
                  <p className="text-xs font-bold text-[var(--txt)] leading-snug">{t.name}</p>
                  <p className="text-[10px] font-bold mt-1" style={{ color: ACCENT_COLOR }}>{t.wins}–{t.losses}</p>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>

      <PanelChart open={chartsOpen} onClose={() => setChartsOpen(false)} />
      <PanelChat  open={chatOpen}   onClose={() => setChatOpen(false)}   countyName={team.name} />
    </>
  )
}
