import { AppLayout } from '@/components/AppLayout'
import { GLOSSARY_TERMS, type GlossaryTerm } from '@/lib/glossary-terms'

const CATEGORIES = [
  'Standard — Passing',
  'Standard — Rushing',
  'Standard — Receiving',
  'Standard — Team',
  'Foundational QB',
  'Advanced QB',
  'Team Analytics',
] as const

function grouped() {
  const map = new Map<string, GlossaryTerm[]>()
  for (const cat of CATEGORIES) map.set(cat, [])
  for (const t of GLOSSARY_TERMS) {
    map.get(t.category)?.push(t)
  }
  return map
}

export default function GlossaryPage() {
  const groups = grouped()
  const allTerms = GLOSSARY_TERMS

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="mx-auto max-w-4xl px-6 py-10">

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-[var(--txt)] mb-2">Data Glossary</h1>
            <p className="text-sm text-[var(--muted)] leading-relaxed max-w-2xl">
              Definitions for every metric shown across the platform — standard stats, foundational QB metrics, and advanced composite analytics.
            </p>
          </div>

          <div className="flex gap-10">

            {/* Left nav */}
            <div className="hidden md:block shrink-0 w-48">
              <div className="sticky top-6 flex flex-col gap-5">
                {CATEGORIES.map(cat => {
                  const terms = groups.get(cat) ?? []
                  if (!terms.length) return null
                  return (
                    <div key={cat}>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">
                        {cat}
                      </p>
                      <div className="flex flex-col gap-0.5">
                        {terms.map(t => (
                          <a key={t.id} href={`#${t.id}`}
                            className="text-sm text-[var(--muted)] hover:text-[var(--txt)] transition-colors py-0.5">
                            {t.name}
                          </a>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Definitions */}
            <div className="flex-1 min-w-0 flex flex-col gap-14">
              {CATEGORIES.map(cat => {
                const terms = groups.get(cat) ?? []
                if (!terms.length) return null
                return (
                  <div key={cat}>
                    <div className="flex items-center gap-3 mb-6">
                      <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">{cat}</h2>
                      <div className="flex-1 h-px bg-[var(--border)]" />
                    </div>

                    <div className="flex flex-col gap-8">
                      {terms.map(t => (
                        <div key={t.id} id={t.id} className="scroll-mt-6">
                          <div className="flex items-baseline gap-2 mb-1.5">
                            <h3 className="text-lg font-bold text-[var(--txt)]">{t.name}</h3>
                            <a href={`#${t.id}`} className="text-[var(--muted)] hover:text-[var(--txt)] transition-colors text-sm">#</a>
                          </div>

                          <p className="text-sm text-[var(--muted)] leading-relaxed mb-3">{t.definition}</p>

                          {t.formula && (
                            <div className="mb-3 px-4 py-2.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] font-mono text-sm text-[var(--txt)]">
                              {t.formula}
                            </div>
                          )}

                          <div className="rounded-xl border border-[var(--border)] overflow-hidden text-sm">
                            <div className="grid grid-cols-[80px_1fr] gap-x-3 px-4 py-2.5 border-b border-[var(--border)]">
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Source</span>
                              <span className="text-[var(--txt)]">{t.source}</span>
                            </div>
                            <div className="grid grid-cols-[80px_1fr] gap-x-3 px-4 py-2.5">
                              <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Caveats</span>
                              <span className="text-[var(--muted)]">{t.caveats}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  )
}
