'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Image from 'next/image'
import { Search, X, ChevronRight, Users, Building2, School, Trophy, Images, LayoutGrid, BarChart2 } from 'lucide-react'
import { SCHOOL_LOGOS, DIVISION_LOGOS } from '@/lib/team-images'
import { CHART_CONFIGS } from '@/lib/chart-configs'

type RecentEntry = { key: string; displayName: string; subtitle?: string; href: string; schoolSlug?: string; logoUrl?: string; type: 'player' | 'team' | 'school' | 'chart' }
const RECENTS_KEY = 'sportsgpt-recents'
const MAX_RECENTS = 5

function loadRecents(): RecentEntry[] {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY) ?? '[]') } catch { return [] }
}
function saveRecent(r: RecentEntry) {
  const prev = loadRecents().filter(x => x.key !== r.key)
  localStorage.setItem(RECENTS_KEY, JSON.stringify([r, ...prev].slice(0, MAX_RECENTS)))
}

const QUICK_NAV = [
  { key: 'nav-teams',      displayName: 'Teams',       subtitle: 'All Section XI varsity teams',    href: '/team',                   Icon: Building2  },
  { key: 'nav-players',    displayName: 'Players',     subtitle: 'Section XI players, all seasons', href: '/player',                 Icon: Users      },
  { key: 'nav-leaderboard',displayName: 'Leaderboard', subtitle: 'Top passers, rushers, receivers', href: '/leaderboard',            Icon: Trophy     },
  { key: 'nav-gallery',    displayName: 'Gallery',     subtitle: 'Team & player photos',            href: '/gallery',                Icon: Images     },
  { key: 'nav-div1',       displayName: 'Division I',  subtitle: 'Standings & top performers',      href: '/division/division-i',    Icon: LayoutGrid },
  { key: 'nav-div2',       displayName: 'Division II', subtitle: 'Standings & top performers',      href: '/division/division-ii',   Icon: LayoutGrid },
  { key: 'nav-div3',       displayName: 'Division III',subtitle: 'Standings & top performers',      href: '/division/division-iii',  Icon: LayoutGrid },
  { key: 'nav-div4',       displayName: 'Division IV', subtitle: 'Standings & top performers',      href: '/division/division-iv',   Icon: LayoutGrid },
  { key: 'nav-charts',    displayName: 'Charts',      subtitle: 'Stats, leaders & records',        href: '/charts',                 Icon: BarChart2  },
]

type PlayerRow  = { slug: string; name: string; position: string | null; school_slug: string; team_name: string | null }
type TeamRow    = { slug: string; name: string; division: string; school_slug: string }
type SchoolRow  = { slug: string; name: string }
type SearchData = { players: PlayerRow[]; teams: TeamRow[]; schools: SchoolRow[] }

type Result = {
  key: string
  type: 'player' | 'team' | 'school' | 'chart'
  name: string
  displayName: string
  subtitle?: string
  href: string
  schoolSlug?: string
  logoUrl?: string
  score: number
}

function matchScore(query: string, text: string): number {
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (t === q) return -1
  if (t.startsWith(q)) return 0
  const i = t.indexOf(q)
  return i >= 0 ? i : Infinity
}

const DIVISIONS = [
  { label: 'Division I',   slug: 'division-i',   num: 1 },
  { label: 'Division II',  slug: 'division-ii',  num: 2 },
  { label: 'Division III', slug: 'division-iii', num: 3 },
  { label: 'Division IV',  slug: 'division-iv',  num: 4 },
]

function buildResults(data: SearchData, query: string): { divisions: Result[]; charts: Result[]; teams: Result[]; players: Result[]; schools: Result[] } {
  const q = query.trim()
  if (!q) return { divisions: [], charts: [], teams: [], players: [], schools: [] }

  const divisions: Result[] = []
  for (const d of DIVISIONS) {
    const s = matchScore(q, d.label)
    if (s < Infinity) {
      divisions.push({ key: `div-${d.slug}`, type: 'team', name: d.label, displayName: d.label, subtitle: 'Section XI', href: `/division/${d.slug}`, logoUrl: DIVISION_LOGOS[d.num], score: s })
    }
  }

  const charts: Result[] = []
  for (const c of CHART_CONFIGS) {
    const s = matchScore(q, c.title)
    if (s < Infinity) {
      charts.push({ key: `chart-${c.slug}`, type: 'chart', name: c.title, displayName: c.title, subtitle: 'Chart', href: `/charts/${c.slug}`, score: s })
    }
  }
  charts.sort((a, b) => a.score - b.score)

  const teams: Result[] = []
  for (const t of data.teams) {
    const display = t.name.replace(/\s+Varsity\s+Football$/i, '')
    const nameScore = matchScore(q, display)
    const divScore  = matchScore(q, `Division ${t.division}`)
    const s = Math.min(nameScore, divScore === Infinity ? Infinity : divScore + 5)
    if (s < Infinity) {
      teams.push({ key: `team-${t.slug}`, type: 'team', name: t.name, displayName: display, subtitle: `Division ${t.division}`, href: `/team/${t.slug}`, schoolSlug: t.school_slug, score: s })
    }
  }
  teams.sort((a, b) => a.score - b.score)

  const players: Result[] = []
  for (const p of data.players) {
    const nameScore  = matchScore(q, p.name)
    const schoolName = p.team_name?.replace(/\s+Varsity\s+Football$/i, '') ?? ''
    const teamScore  = matchScore(q, schoolName)
    const s = Math.min(nameScore, teamScore === Infinity ? Infinity : teamScore + 10)
    if (s < Infinity) {
      const parts = [p.position, schoolName].filter(Boolean)
      players.push({ key: `player-${p.slug}`, type: 'player', name: p.name, displayName: p.name, subtitle: parts.join(' · '), href: `/player/${p.slug}`, schoolSlug: p.school_slug, score: s })
    }
  }
  players.sort((a, b) => a.score - b.score)

  const schools: Result[] = []
  for (const s of data.schools) {
    const sc = matchScore(q, s.name)
    if (sc < Infinity) {
      schools.push({ key: `school-${s.slug}`, type: 'school', name: s.name, displayName: s.name, href: `/school/${s.slug}`, score: sc })
    }
  }
  schools.sort((a, b) => a.score - b.score)

  return { divisions, charts, teams, players, schools }
}

function ResultItem({ r, active, onHover, onClick }: { r: Result; active: boolean; onHover: () => void; onClick: () => void }) {
  const logo = r.logoUrl ?? (r.schoolSlug ? SCHOOL_LOGOS[r.schoolSlug] : undefined)
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${active ? 'bg-[var(--inp-bg)]' : 'hover:bg-[var(--inp-bg)]'}`}
      onMouseEnter={onHover}
      onClick={onClick}
    >
      <div className="w-7 h-7 shrink-0 flex items-center justify-center">
        {logo ? (
          <Image src={logo} alt="" width={28} height={28} className="object-contain" unoptimized />
        ) : r.type === 'player' ? (
          <Users className="h-4 w-4 text-[var(--muted)]" />
        ) : r.type === 'chart' ? (
          <BarChart2 className="h-4 w-4 text-[var(--muted)]" />
        ) : r.type === 'team' ? (
          <Building2 className="h-4 w-4 text-[var(--muted)]" />
        ) : (
          <School className="h-4 w-4 text-[var(--muted)]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--txt)] truncate">{r.displayName}</p>
        {r.subtitle && <p className="text-xs text-[var(--muted)] truncate">{r.subtitle}</p>}
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-[var(--muted)] shrink-0" />
    </button>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] bg-[var(--bg)]">
      {label}
    </div>
  )
}

function Palette() {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()

  const isOpen  = searchParams.get('cmd') === 'open'
  const urlQ    = searchParams.get('q') ?? ''

  const [query,     setQuery]     = useState(urlQ)
  const [data,      setData]      = useState<SearchData | null>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [recents,   setRecents]   = useState<RecentEntry[]>([])

  const inputRef    = useRef<HTMLInputElement>(null)
  const fetched     = useRef(false)
  const listRef     = useRef<HTMLDivElement>(null)

  // Global Cmd+K listener
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const p = new URLSearchParams(window.location.search)
        p.set('cmd', 'open')
        router.push(`${window.location.pathname}?${p}`, { scroll: false })
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [router])

  // Fetch data on first open; focus input
  useEffect(() => {
    if (!isOpen) return
    setQuery(urlQ)
    setActiveIdx(0)
    setRecents(loadRecents())
    if (!fetched.current) {
      fetched.current = true
      fetch('/api/search').then(r => r.json()).then(setData)
    }
    setTimeout(() => inputRef.current?.focus(), 30)
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  function close() {
    const p = new URLSearchParams(window.location.search)
    p.delete('cmd')
    p.delete('q')
    const qs = p.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  function updateQuery(q: string) {
    setQuery(q)
    setActiveIdx(0)
    const p = new URLSearchParams(window.location.search)
    if (q) p.set('q', q)
    else p.delete('q')
    router.replace(`${pathname}?${p}`, { scroll: false })
  }

  const { divisions, charts, teams, players, schools } = data ? buildResults(data, query) : { divisions: [], charts: [], teams: [], players: [], schools: [] }

  // Flat list for keyboard nav — search results when typing, recents+quicknav when empty
  const allResults: Result[] = [
    ...(divisions.length ? divisions.slice(0, 4) : []),
    ...(charts.length    ? charts.slice(0, 5)    : []),
    ...(teams.length     ? teams.slice(0, 5)     : []),
    ...(players.length   ? players.slice(0, 8)   : []),
    ...(schools.length   ? schools.slice(0, 4)   : []),
  ]
  const emptyNavItems = !query.trim() ? [
    ...recents.map(r => ({ ...r, score: 0, name: r.displayName })),
    ...QUICK_NAV.map(n => ({ key: n.key, type: 'team' as const, name: n.displayName, displayName: n.displayName, subtitle: n.subtitle, href: n.href, score: 0 })),
  ] : []
  const navLength = query.trim() ? allResults.length : emptyNavItems.length

  // Keyboard nav
  useEffect(() => {
    if (!isOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { close(); return }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx(i => Math.min(i + 1, navLength - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx(i => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter') {
        if (query.trim() && allResults[activeIdx]) {
          const r = allResults[activeIdx]
          saveRecent({ key: r.key, displayName: r.displayName, subtitle: r.subtitle, href: r.href, schoolSlug: r.schoolSlug, type: r.type })
          router.push(r.href)
        } else if (!query.trim() && emptyNavItems[activeIdx]) {
          router.push(emptyNavItems[activeIdx].href)
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, allResults, emptyNavItems, activeIdx, query]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null

  const hasResults = allResults.length > 0
  const isEmpty    = query.trim().length > 0 && !hasResults

  // Map result key → flat index
  const idxMap = Object.fromEntries(allResults.map((r, i) => [r.key, i]))

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
      onClick={close}
    >
      <div
        className="w-full max-w-lg bg-[var(--surface)] rounded-2xl shadow-2xl overflow-hidden border border-[var(--border)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <Search className="h-4 w-4 text-[var(--muted)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => updateQuery(e.target.value)}
            placeholder="Search teams, players, schools…"
            className="flex-1 bg-transparent text-[var(--txt)] placeholder:text-[var(--muted)] text-sm outline-none"
            autoComplete="off"
          />
          {query ? (
            <button onClick={() => updateQuery('')} className="text-[var(--muted)] hover:text-[var(--txt)] transition-colors">
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <kbd className="hidden sm:inline-flex text-[10px] text-[var(--muted)] bg-[var(--inp-bg)] px-1.5 py-0.5 rounded">⌘K</kbd>
              <kbd className="hidden sm:inline-flex text-[10px] text-[var(--muted)] bg-[var(--inp-bg)] px-1.5 py-0.5 rounded">esc</kbd>
            </div>
          )}
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[55vh] overflow-y-auto">
          {!data && (
            <div className="py-10 text-center text-sm text-[var(--muted)]">Loading…</div>
          )}
          {data && !query.trim() && (
            <>
              {recents.length > 0 && (
                <>
                  <SectionHeader label="Recent" />
                  {recents.map((r, i) => {
                    const logo = r.logoUrl ?? (r.schoolSlug ? SCHOOL_LOGOS[r.schoolSlug] : undefined)
                    return (
                      <button key={r.key}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${i === activeIdx ? 'bg-[var(--inp-bg)]' : 'hover:bg-[var(--inp-bg)]'}`}
                        onMouseEnter={() => setActiveIdx(i)}
                        onClick={() => { router.push(r.href) }}>
                        <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                          {logo
                            ? <Image src={logo} alt="" width={28} height={28} className="object-contain" unoptimized />
                            : r.type === 'player' ? <Users className="h-4 w-4 text-[var(--muted)]" />
                            : r.type === 'team'   ? <Building2 className="h-4 w-4 text-[var(--muted)]" />
                            : <School className="h-4 w-4 text-[var(--muted)]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-[var(--txt)] truncate">{r.displayName}</p>
                          {r.subtitle && <p className="text-xs text-[var(--muted)] truncate">{r.subtitle}</p>}
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-[var(--muted)] shrink-0" />
                      </button>
                    )
                  })}
                </>
              )}
              <SectionHeader label="Quick Nav" />
              {QUICK_NAV.map(({ key, displayName, subtitle, href, Icon }, i) => {
                const idx = recents.length + i
                return (
                  <button key={key}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${idx === activeIdx ? 'bg-[var(--inp-bg)]' : 'hover:bg-[var(--inp-bg)]'}`}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => { router.push(href) }}>
                    <div className="w-7 h-7 shrink-0 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-[var(--muted)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--txt)] truncate">{displayName}</p>
                      <p className="text-xs text-[var(--muted)] truncate">{subtitle}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-[var(--muted)] shrink-0" />
                  </button>
                )
              })}
            </>
          )}
          {isEmpty && (
            <div className="py-10 text-center text-sm text-[var(--muted)]">No results for &ldquo;{query}&rdquo;</div>
          )}

          {divisions.length > 0 && (
            <>
              <SectionHeader label="Divisions" />
              {divisions.slice(0, 4).map(r => (
                <ResultItem key={r.key} r={r}
                  active={idxMap[r.key] === activeIdx}
                  onHover={() => setActiveIdx(idxMap[r.key])}
                  onClick={() => { saveRecent({ key: r.key, displayName: r.displayName, subtitle: r.subtitle, href: r.href, schoolSlug: r.schoolSlug, type: r.type }); router.push(r.href) }} />
              ))}
            </>
          )}

          {charts.length > 0 && (
            <>
              <SectionHeader label="Charts" />
              {charts.slice(0, 5).map(r => (
                <ResultItem key={r.key} r={r}
                  active={idxMap[r.key] === activeIdx}
                  onHover={() => setActiveIdx(idxMap[r.key])}
                  onClick={() => { router.push(r.href) }} />
              ))}
            </>
          )}

          {teams.length > 0 && (
            <>
              <SectionHeader label="Teams" />
              {teams.slice(0, 5).map(r => (
                <ResultItem key={r.key} r={r}
                  active={idxMap[r.key] === activeIdx}
                  onHover={() => setActiveIdx(idxMap[r.key])}
                  onClick={() => { saveRecent({ key: r.key, displayName: r.displayName, subtitle: r.subtitle, href: r.href, schoolSlug: r.schoolSlug, type: r.type }); router.push(r.href) }} />
              ))}
            </>
          )}

          {players.length > 0 && (
            <>
              <SectionHeader label="Players" />
              {players.slice(0, 8).map(r => (
                <ResultItem key={r.key} r={r}
                  active={idxMap[r.key] === activeIdx}
                  onHover={() => setActiveIdx(idxMap[r.key])}
                  onClick={() => { saveRecent({ key: r.key, displayName: r.displayName, subtitle: r.subtitle, href: r.href, schoolSlug: r.schoolSlug, type: r.type }); router.push(r.href) }} />
              ))}
            </>
          )}

          {schools.length > 0 && (
            <>
              <SectionHeader label="Schools" />
              {schools.slice(0, 4).map(r => (
                <ResultItem key={r.key} r={r}
                  active={idxMap[r.key] === activeIdx}
                  onHover={() => setActiveIdx(idxMap[r.key])}
                  onClick={() => { saveRecent({ key: r.key, displayName: r.displayName, subtitle: r.subtitle, href: r.href, schoolSlug: r.schoolSlug, type: r.type }); router.push(r.href) }} />
              ))}
            </>
          )}

          {hasResults && (
            <div className="px-4 py-2 border-t border-[var(--border)] flex items-center gap-3 text-[10px] text-[var(--muted)]">
              <span><kbd className="bg-[var(--inp-bg)] px-1 py-0.5 rounded">↑↓</kbd> navigate</span>
              <span><kbd className="bg-[var(--inp-bg)] px-1 py-0.5 rounded">↵</kbd> open</span>
              <span><kbd className="bg-[var(--inp-bg)] px-1 py-0.5 rounded">esc</kbd> close</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function CommandPalette() {
  return (
    <Suspense>
      <Palette />
    </Suspense>
  )
}
