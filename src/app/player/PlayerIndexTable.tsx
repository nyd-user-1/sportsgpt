'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { AppLayout } from '@/components/AppLayout'
import { cn } from '@/lib/utils'
import { ACCENT_COLOR } from '@/lib/app-config'

type PlayerRow = {
  slug: string
  name: string
  team_name: string | null
  position: string | null
}

export default function PlayerIndexTable({ players }: { players: PlayerRow[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return players
    return players.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.team_name ?? '').toLowerCase().includes(q) ||
      (p.position ?? '').toLowerCase().includes(q)
    )
  }, [players, query])

  const td = 'px-4 py-2.5 border-b border-[var(--border)] text-sm'
  const th = 'px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)] text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] whitespace-nowrap text-left'

  return (
    <AppLayout showNavArrows>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Search bar */}
        <div className="shrink-0 px-5 pt-4 pb-3">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search players, teams, positions..."
              className="flex-1 bg-transparent text-sm text-[var(--txt)] placeholder:text-[var(--muted)] outline-none"
            />
            <span className="text-xs text-[var(--muted)]">{filtered.length} of {players.length}</span>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-hidden px-5 pb-5">
          <div className="h-full overflow-auto no-scrollbar rounded-xl border border-[var(--border)] px-2">
            <table className="text-sm whitespace-nowrap w-full border-separate" style={{ borderSpacing: 0 }}>
              <thead className="sticky top-0 z-20">
                <tr>
                  <th className={cn(th, 'sticky left-2 z-30 min-w-[40px]')}>#</th>
                  <th className={cn(th, 'sticky left-[48px] z-30 min-w-[200px]')}>Player</th>
                  <th className={th}>Team</th>
                  <th className={th}>Position</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.slug} className="group/row hover:bg-[var(--inp-bg)] transition-colors cursor-pointer">
                    <td className={cn(td, 'sticky left-2 z-[1] bg-[var(--surface)] group-hover/row:bg-[var(--row-hover)] text-[var(--muted)] font-medium transition-colors')}>{i + 1}</td>
                    <td className={cn(td, 'sticky left-[48px] z-[1] bg-[var(--surface)] group-hover/row:bg-[var(--row-hover)] font-semibold transition-colors')}>
                      <Link href={`/player/${p.slug}`} className="hover:underline" style={{ color: ACCENT_COLOR }}>{p.name}</Link>
                    </td>
                    <td className={cn(td, 'text-[var(--muted)]')}>{p.team_name ?? '—'}</td>
                    <td className={cn(td, 'text-[var(--muted)]')}>{p.position ?? '—'}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-[var(--muted)]">No players found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
