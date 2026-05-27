'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { GLOSSARY_TERMS, GLOSSARY_UPDATED, type GlossaryTerm } from '@/lib/glossary-terms'
import { TierIndicator, type Tier } from '@/components/TierIndicator'
import { cn } from '@/lib/utils'
import {
  EditorialHead, EditorialAccent, FormulaTablet, EditorialNote,
  StickyControlBar, ContentsNav, SearchInput, useSearchHotkey, Highlight,
} from '@/components/editorial'

const CATEGORIES = [
  'Standard — Passing',
  'Standard — Rushing',
  'Standard — Receiving',
  'Standard — Team',
  'Foundational QB',
  'Advanced QB',
  'Team Analytics',
  'Academic',
  'Demographic',
  'Data Architecture',
] as const

type Category = typeof CATEGORIES[number]

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']

const CHAPTER_BLURB: Record<Category, string> = {
  'Standard — Passing':   'Quarterback counting stats.',
  'Standard — Rushing':   'Carries, yardage, scoring rate.',
  'Standard — Receiving': 'Catches into yards. Top 25 per season.',
  'Standard — Team':      'Wins, losses, scoring, schedule.',
  'Foundational QB':      'Rates and ratios — where comparison begins.',
  'Advanced QB':          'Composites that try to read the position whole.',
  'Team Analytics':       'Team dominance composites.',
  'Academic':             'Enrollment, SAT, AP, graduation and college acceptance — the school context behind the football.',
  'Demographic':          'Race mix, need indicators, and the multi-year enrollment trend behind every district.',
  'Data Architecture':    'Where the numbers come from — and how the system is built.',
}

const TIER: Record<Category, Tier> = {
  'Standard — Passing':   1,
  'Standard — Rushing':   1,
  'Standard — Receiving': 1,
  'Standard — Team':      1,
  'Foundational QB':      2,
  'Advanced QB':          3,
  'Team Analytics':       3,
  'Academic':             1,
  'Demographic':          1,
  'Data Architecture':    1,
}

const CATEGORY_SHORT: Record<Category, string> = {
  'Standard — Passing':   'Passing',
  'Standard — Rushing':   'Rushing',
  'Standard — Receiving': 'Receiving',
  'Standard — Team':      'Team',
  'Foundational QB':      'Foundational QB',
  'Advanced QB':          'Advanced QB',
  'Team Analytics':       'Team Analytics',
  'Academic':             'Academic',
  'Demographic':          'Demographic',
  'Data Architecture':    'Data Architecture',
}

function slugifyCat(cat: string) {
  return cat.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const TIER_FILTERS: { v: 0 | Tier; label: string }[] = [
  { v: 0, label: 'All' },
  { v: 1, label: 'Standard' },
  { v: 2, label: 'Foundational' },
  { v: 3, label: 'Advanced' },
]

export function AlmanacClient() {
  const [query, setQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<0 | Tier>(0)
  const [active, setActive] = useState<string>(slugifyCat(CATEGORIES[0]))
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const searchRef   = useRef<HTMLInputElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const map = new Map<Category, GlossaryTerm[]>()
    for (const cat of CATEGORIES) map.set(cat, [])
    for (const t of GLOSSARY_TERMS) {
      const cat = t.category as Category
      if (tierFilter !== 0 && TIER[cat] !== tierFilter) continue
      if (q) {
        const hay = `${t.name} ${t.definition} ${t.body ?? ''} ${t.formula ?? ''} ${t.source} ${t.caveats}`.toLowerCase()
        if (!hay.includes(q)) continue
      }
      map.get(cat)?.push(t)
    }
    return map
  }, [query, tierFilter])

  const totalVisible = useMemo(() => {
    let n = 0
    filtered.forEach(arr => { n += arr.length })
    return n
  }, [filtered])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting)
        if (!visible.length) return
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        setActive(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: [0, 0.4] }
    )
    Object.values(sectionRefs.current).forEach(el => el && observer.observe(el))
    return () => observer.disconnect()
  }, [filtered])

  useSearchHotkey(searchRef, () => setQuery(''))

  return (
    <div className="min-h-full pb-24" style={{ fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }}>
      {/* ── Masthead ──────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-10">
        <EditorialHead
          eyebrow="The SportsGPT Almanac"
          subhead={
            <>
              An almanac of every statistic shown across SportsGPT — what each
              number means, how it&rsquo;s measured, and where it comes from.
            </>
          }
          meta={[
            `${GLOSSARY_TERMS.length} terms`,
            `Updated ${GLOSSARY_UPDATED}`,
            'Section XI · Long Island',
          ]}
        >
          Metrics,
          <EditorialAccent>Defined.</EditorialAccent>
        </EditorialHead>
      </div>

      {/* ── Controls bar (sticky) ─────────────────────────────── */}
      <StickyControlBar>
        <SearchInput
          value={query}
          onChange={setQuery}
          inputRef={searchRef}
          placeholder="Search the almanac…"
        />
        <div className="ml-auto text-[11px] uppercase tracking-[0.18em] text-[var(--paper-faint)] tabular-nums hidden md:block">
          {query || tierFilter !== 0
            ? `${totalVisible} / ${GLOSSARY_TERMS.length} terms`
            : `${GLOSSARY_TERMS.length} terms`}
        </div>
      </StickyControlBar>

      {/* ── Body: sidebar + content ───────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-14 grid grid-cols-1 md:grid-cols-[180px_1fr] gap-x-12 lg:gap-x-20">

        {/* Sidebar */}
        <ContentsNav
          items={CATEGORIES.map(cat => ({
            id:    slugifyCat(cat),
            label: CATEGORY_SHORT[cat],
            count: filtered.get(cat)?.length ?? 0,
          }))}
          activeId={active}
        >
          <div className="mt-8 pt-5 border-t border-[var(--paper-rule)]">
            <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]">
              Filter by tier
            </p>
            <div className="flex flex-col gap-1">
              {TIER_FILTERS.map(({ v, label }) => {
                const isActive = tierFilter === v
                return (
                  <button
                    key={v}
                    onClick={() => setTierFilter(v)}
                    className={cn(
                      'group flex items-center gap-2.5 py-1 text-[12px] leading-tight text-left transition-colors',
                      isActive
                        ? 'text-[var(--paper-text)]'
                        : 'text-[var(--paper-muted)] hover:text-[var(--paper-text)]'
                    )}
                  >
                    <span
                      className={cn(
                        'shrink-0 w-[18px] text-left',
                        isActive ? 'text-[var(--paper-strong)]' : 'text-[var(--paper-faint)]'
                      )}
                    >
                      {v === 0 ? <span className="text-[10px]">∅</span> : <TierIndicator tier={v} size={4} />}
                    </span>
                    <span className="flex-1">{label}</span>
                  </button>
                )
              })}
            </div>
            <p
              className="mt-4 text-[11px] leading-relaxed text-[var(--paper-faint)]"
              style={{ fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }}
            >
              Standard raw counts · Foundational rates &amp; ratios · Advanced composites.
            </p>
          </div>
        </ContentsNav>

        {/* Content column */}
        <main className="min-w-0">
          {CATEGORIES.map((cat, i) => {
            const terms = filtered.get(cat) ?? []
            if (!terms.length) return null
            const slug = slugifyCat(cat)
            return (
              <section
                key={cat}
                id={slug}
                ref={(el: HTMLElement | null) => { sectionRefs.current[slug] = el }}
                className="mb-24 scroll-mt-24 first:mt-0"
              >
                {/* Chapter head */}
                <div className="mb-10">
                  <div className="flex items-end gap-5 sm:gap-8 border-b border-[var(--paper-rule)] pb-5">
                    <span
                      className="text-[var(--paper-strong)] italic leading-none shrink-0"
                      style={{
                        fontFamily: 'var(--font-display), Georgia, serif',
                        fontSize: 'clamp(2.75rem, 6vw, 4.5rem)',
                        fontWeight: 300,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {ROMAN[i]}.
                    </span>
                    <div className="flex-1 pb-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <TierIndicator tier={TIER[cat]} size={5} className="text-[var(--paper-strong)]" />
                        <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]">
                          Chapter {i + 1}
                        </span>
                      </div>
                      <h2
                        className="mt-2 text-[var(--paper-text)] leading-tight"
                        style={{
                          fontFamily: 'var(--font-display), Georgia, serif',
                          fontSize: 'clamp(1.5rem, 2.6vw, 2.125rem)',
                          fontWeight: 500,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {cat}
                      </h2>
                      <p
                        className="mt-1.5 text-[var(--paper-muted)] text-sm sm:text-[15px]"
                        style={{ fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }}
                      >
                        {CHAPTER_BLURB[cat]}
                      </p>
                    </div>
                    <span className="pb-2 text-[10px] uppercase tracking-[0.22em] text-[var(--paper-faint)] tabular-nums hidden sm:block shrink-0">
                      {terms.length} {terms.length === 1 ? 'term' : 'terms'}
                    </span>
                  </div>
                </div>

                {/* Terms */}
                <div className="flex flex-col">
                  {terms.map((t, idx) => (
                    <article
                      key={t.id}
                      id={t.id}
                      className={`group/term scroll-mt-28 py-10 ${
                        idx > 0 ? 'border-t border-[var(--paper-rule-soft)]' : ''
                      }`}
                    >
                      <header className="flex items-baseline gap-4 mb-4">
                        <span className="text-[var(--paper-strong)] shrink-0 self-center -translate-y-px">
                          <TierIndicator tier={TIER[cat]} size={5} />
                        </span>
                        <h3
                          className="flex-1 text-[var(--paper-text)] leading-[1.1]"
                          style={{
                            fontFamily: 'var(--font-display), Georgia, serif',
                            fontSize: 'clamp(1.5rem, 2.4vw, 1.875rem)',
                            fontWeight: 500,
                            letterSpacing: '-0.01em',
                          }}
                        >
                          <Highlight text={t.name} query={query} />
                        </h3>
                        <a
                          href={`#${t.id}`}
                          aria-label={`Permalink to ${t.name}`}
                          className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-[var(--paper-faint)] hover:text-[var(--paper-strong)] transition-opacity opacity-0 group-hover/term:opacity-100 focus:opacity-100 inline-flex items-center gap-1"
                          style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
                        >
                          {t.id}
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      </header>

                      <p className="max-w-[68ch] text-[15px] sm:text-[15.5px] leading-[1.72] text-[var(--paper-text)]/85">
                        <Highlight text={t.definition} query={query} />
                      </p>

                      {t.body && (
                        <p className="mt-4 max-w-[68ch] text-[15px] sm:text-[15.5px] leading-[1.72] text-[var(--paper-muted)]">
                          <Highlight text={t.body} query={query} />
                        </p>
                      )}

                      {t.formula && <FormulaTablet text={t.formula} className="mt-6" />}

                      <EditorialNote
                        className="mt-6"
                        entries={[
                          { label: 'Source', body: t.source },
                          { label: 'Note',   body: t.caveats },
                        ]}
                      />

                      {t.link && (
                        <a
                          href={t.link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.18em] text-[var(--paper-strong)] hover:underline underline-offset-4"
                          style={{ fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }}
                        >
                          {t.link.label}
                          <ArrowUpRight className="h-3 w-3" />
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            )
          })}

          {totalVisible === 0 && (
            <div className="py-24 text-center">
              <p
                className="text-[var(--paper-muted)] text-lg"
                style={{ fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }}
              >
                No terms match &ldquo;{query}&rdquo;.
              </p>
              <button
                onClick={() => { setQuery(''); setTierFilter(0) }}
                className="mt-4 text-xs uppercase tracking-[0.2em] text-[var(--paper-strong)] hover:underline underline-offset-4"
              >
                Clear filters
              </button>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-[var(--paper-rule)] max-w-[68ch]">
            <p
              className="text-[12.5px] leading-[1.75] text-[var(--paper-faint)]"
              style={{ fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }}
            >
              Compiled from Newsday box scores, Section XI official standings,
              and computations native to SportsGPT. Formulas marked
              &ldquo;not yet fully recovered&rdquo; are preserved from the
              original dataset and cannot currently be reproduced for new seasons.
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}
