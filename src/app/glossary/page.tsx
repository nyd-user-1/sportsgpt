import { AppLayout } from '@/components/AppLayout'
import { GLOSSARY_TERMS } from '@/lib/glossary-terms'

const TERMS = GLOSSARY_TERMS

export default function GlossaryPage() {
  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="mx-auto max-w-4xl px-6 py-10">

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-[var(--txt)] mb-2">Data Glossary</h1>
            <p className="text-sm text-[var(--muted)] leading-relaxed max-w-2xl">
              Definitions for every metric shown in the data tables.
            </p>
          </div>

          <div className="flex gap-10">

            {/* Left nav */}
            <div className="hidden md:block shrink-0 w-44">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-3">Terms</p>
              <div className="flex flex-col gap-1">
                {TERMS.map(t => (
                  <a key={t.id} href={`#${t.id}`}
                    className="text-sm text-[var(--muted)] hover:text-[var(--txt)] transition-colors py-0.5">
                    {t.name}
                  </a>
                ))}
              </div>
            </div>

            {/* Definitions */}
            <div className="flex-1 min-w-0 flex flex-col gap-10">
              {TERMS.map(t => (
                <div key={t.id} id={t.id} className="scroll-mt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold text-[var(--txt)]">{t.name}</h2>
                    <a href={`#${t.id}`} className="text-[var(--muted)] hover:text-[var(--txt)] transition-colors">#</a>
                  </div>
                  <p className="text-sm text-[var(--muted)] leading-relaxed mb-3">{t.definition}</p>
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
        </div>
      </div>
    </AppLayout>
  )
}
