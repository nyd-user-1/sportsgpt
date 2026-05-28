'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import Image from 'next/image'
import { Search, X, ChevronRight, Users, Building2, School, BarChart2, Rocket, MessageCircle, Swords } from 'lucide-react'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { buildResults, type Result, type SearchData, type ResultType } from '@/lib/search'

type RecentEntry = { key: string; displayName: string; subtitle?: string; href: string; schoolSlug?: string; logoUrl?: string; type: ResultType }
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
  { key: 'nav-launchpad',  displayName: 'Launchpad',   subtitle: 'Standings, scores & game cards',  href: '/launchpad',   Icon: Rocket          },
  { key: 'nav-chat',       displayName: 'Chat',        subtitle: 'Ask about Section XI football',   href: '/chat',        Icon: MessageCircle   },
  { key: 'nav-charts',     displayName: 'Charts',      subtitle: 'Stats, leaders & records',        href: '/charts',      Icon: BarChart2       },
  { key: 'nav-players',    displayName: 'Players',     subtitle: 'Section XI players, all seasons', href: '/player',      Icon: Users           },
  { key: 'nav-teams',      displayName: 'Teams',       subtitle: 'All Section XI varsity teams',    href: '/team',        Icon: Building2       },
]

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }
const MONO:  React.CSSProperties = { fontFamily: 'var(--font-mono), ui-monospace, monospace' }

function ResultItem({ r, active, onHover, onClick }: { r: Result; active: boolean; onHover: () => void; onClick: () => void }) {
  const logo = r.logoUrl ?? (r.schoolSlug ? SCHOOL_LOGOS[r.schoolSlug] : undefined)
  return (
    <button
      className={`group/row w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${active ? 'bg-[var(--paper-quiet)]' : 'hover:bg-[var(--paper-quiet)]'}`}
      onMouseEnter={onHover}
      onClick={onClick}
    >
      <div
        className="w-7 h-7 shrink-0 rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)] flex items-center justify-center overflow-hidden"
      >
        {logo ? (
          <Image src={logo} alt="" width={22} height={22} className="object-contain" unoptimized />
        ) : r.type === 'player' ? (
          <Users className="h-3.5 w-3.5 text-[var(--paper-faint)]" />
        ) : r.type === 'chart' ? (
          <BarChart2 className="h-3.5 w-3.5 text-[var(--paper-faint)]" />
        ) : r.type === 'team' ? (
          <Building2 className="h-3.5 w-3.5 text-[var(--paper-faint)]" />
        ) : r.type === 'game' ? (
          <Swords className="h-3.5 w-3.5 text-[var(--paper-faint)]" />
        ) : (
          <School className="h-3.5 w-3.5 text-[var(--paper-faint)]" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate transition-colors ${active ? 'text-[var(--paper-strong)]' : 'text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)]'}`}
          style={{ ...SERIF, fontSize: 14, fontWeight: 500, letterSpacing: '-0.005em' }}
        >
          {r.displayName}
        </p>
        {r.subtitle && (
          <p
            className="text-[11.5px] text-[var(--paper-muted)] truncate"
            style={{ ...SERIF, fontStyle: 'italic' }}
          >
            {r.subtitle}
          </p>
        )}
      </div>
      <ChevronRight className="h-3.5 w-3.5 text-[var(--paper-faint)] shrink-0" />
    </button>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div
      className="px-5 pt-4 pb-2 text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)] border-t border-[var(--paper-rule)] first:border-t-0"
      style={SANS}
    >
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

  const { divisions, charts, teams, games, players, schools } = data ? buildResults(data, query) : { divisions: [], charts: [], teams: [], games: [], players: [], schools: [] }

  // Flat list for keyboard nav — search results when typing, recents+quicknav when empty
  const allResults: Result[] = [
    ...(divisions.length ? divisions.slice(0, 4) : []),
    ...(charts.length    ? charts.slice(0, 5)    : []),
    ...(teams.length     ? teams.slice(0, 5)     : []),
    ...(games.length     ? games.slice(0, 5)     : []),
    ...(players.length   ? players.slice(0, 8)   : []),
    ...(schools.length   ? schools.slice(0, 4)   : []),
  ]
  const emptyNavItems = !query.trim() ? [
    ...QUICK_NAV.map(n => ({ key: n.key, type: 'team' as const, name: n.displayName, displayName: n.displayName, subtitle: n.subtitle, href: n.href, score: 0 })),
    ...recents.map(r => ({ ...r, score: 0, name: r.displayName })),
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

  const kbdCls = 'inline-flex items-center px-1.5 py-0.5 text-[10px] text-[var(--paper-faint)] border border-[var(--paper-rule)]'
  const kbdStyle: React.CSSProperties = { ...MONO, borderRadius: 2 }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={close}
    >
      <div
        className="w-full max-w-lg bg-[var(--paper)] shadow-2xl overflow-hidden border border-[var(--paper-rule)]"
        style={{ borderRadius: 3 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[var(--paper-rule)]">
          <Search className="h-4 w-4 text-[var(--paper-faint)] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => updateQuery(e.target.value)}
            placeholder="Search teams, players, schools…"
            className="flex-1 bg-transparent text-[var(--paper-text)] placeholder:text-[var(--paper-faint)] outline-none"
            style={{ ...SERIF, fontSize: 15, letterSpacing: '-0.005em' }}
            autoComplete="off"
          />
          {query ? (
            <button
              onClick={() => updateQuery('')}
              className="text-[var(--paper-faint)] hover:text-[var(--paper-strong)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-1">
              <kbd className={kbdCls} style={kbdStyle}>⌘K</kbd>
              <kbd className={kbdCls} style={kbdStyle}>esc</kbd>
            </div>
          )}
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[55vh] overflow-y-auto pb-2">
          {!data && (
            <div className="py-10 text-center text-[13px] text-[var(--paper-muted)]" style={{ ...SERIF, fontStyle: 'italic' }}>
              Loading…
            </div>
          )}
          {data && !query.trim() && (
            <>
              <SectionHeader label="Quick Nav" />
              {QUICK_NAV.map(({ key, displayName, subtitle, href, Icon }, i) => {
                const idx = i
                const active = idx === activeIdx
                return (
                  <button key={key}
                    className={`group/row w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${active ? 'bg-[var(--paper-quiet)]' : 'hover:bg-[var(--paper-quiet)]'}`}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => { router.push(href) }}>
                    <div className="w-7 h-7 shrink-0 rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)] flex items-center justify-center">
                      <Icon className="h-3.5 w-3.5 text-[var(--paper-faint)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate transition-colors ${active ? 'text-[var(--paper-strong)]' : 'text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)]'}`}
                        style={{ ...SERIF, fontSize: 14, fontWeight: 500, letterSpacing: '-0.005em' }}
                      >
                        {displayName}
                      </p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-[var(--paper-faint)] shrink-0" />
                  </button>
                )
              })}
              {recents.length > 0 && (
                <>
                  <SectionHeader label="Recent" />
                  {recents.map((r, i) => {
                    const logo = r.logoUrl ?? (r.schoolSlug ? SCHOOL_LOGOS[r.schoolSlug] : undefined)
                    const idx = QUICK_NAV.length + i
                    const active = idx === activeIdx
                    return (
                      <button key={r.key}
                        className={`group/row w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${active ? 'bg-[var(--paper-quiet)]' : 'hover:bg-[var(--paper-quiet)]'}`}
                        onMouseEnter={() => setActiveIdx(idx)}
                        onClick={() => { router.push(r.href) }}>
                        <div className="w-7 h-7 shrink-0 rounded-full bg-[var(--paper-quiet)] border border-[var(--paper-rule)] flex items-center justify-center overflow-hidden">
                          {logo
                            ? <Image src={logo} alt="" width={22} height={22} className="object-contain" unoptimized />
                            : r.type === 'player' ? <Users className="h-3.5 w-3.5 text-[var(--paper-faint)]" />
                            : r.type === 'team'   ? <Building2 className="h-3.5 w-3.5 text-[var(--paper-faint)]" />
                            : r.type === 'game'   ? <Swords className="h-3.5 w-3.5 text-[var(--paper-faint)]" />
                            : <School className="h-3.5 w-3.5 text-[var(--paper-faint)]" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate transition-colors ${active ? 'text-[var(--paper-strong)]' : 'text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)]'}`}
                            style={{ ...SERIF, fontSize: 14, fontWeight: 500, letterSpacing: '-0.005em' }}
                          >
                            {r.displayName}
                          </p>
                          {r.subtitle && (
                            <p
                              className="text-[11.5px] text-[var(--paper-muted)] truncate"
                              style={{ ...SERIF, fontStyle: 'italic' }}
                            >
                              {r.subtitle}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-[var(--paper-faint)] shrink-0" />
                      </button>
                    )
                  })}
                </>
              )}
            </>
          )}
          {isEmpty && (
            <div className="py-10 text-center text-[13px] text-[var(--paper-muted)]" style={{ ...SERIF, fontStyle: 'italic' }}>
              No results for &ldquo;{query}&rdquo;
            </div>
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

          {games.length > 0 && (
            <>
              <SectionHeader label="Games" />
              {games.slice(0, 5).map(r => (
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
            <div
              className="mt-2 px-5 py-2.5 border-t border-[var(--paper-rule)] flex items-center gap-4 text-[10px] uppercase tracking-[0.18em] text-[var(--paper-faint)]"
              style={SANS}
            >
              <span className="inline-flex items-center gap-1.5">
                <kbd className={kbdCls} style={kbdStyle}>↑↓</kbd> navigate
              </span>
              <span className="inline-flex items-center gap-1.5">
                <kbd className={kbdCls} style={kbdStyle}>↵</kbd> open
              </span>
              <span className="inline-flex items-center gap-1.5">
                <kbd className={kbdCls} style={kbdStyle}>esc</kbd> close
              </span>
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
