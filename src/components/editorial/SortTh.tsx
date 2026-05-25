import Link from 'next/link'
import { ChevronUp, ChevronDown, Info, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ACCENT_COLOR } from '@/lib/app-config'
import { GLOSSARY_TERMS } from '@/lib/glossary-terms'

const GLOSSARY_MAP = Object.fromEntries(GLOSSARY_TERMS.map(t => [t.id, t]))

/**
 * Sortable table header cell — paper palette, sticky, with optional
 * glossary tooltip (hover to reveal term + definition + "Learn more" link).
 *
 * Usage:
 *   <SortTh col="yards" label="Yards" sortCol={col} sortDir={dir} onSort={handleSort} right />
 */
export function SortTh({
  col,
  label,
  right,
  glossaryId,
  sortCol,
  sortDir,
  onSort,
  className,
}: {
  col: string
  label: string
  right?: boolean
  glossaryId?: string
  className?: string
  sortCol: string | null
  sortDir: 'asc' | 'desc'
  onSort: (col: string) => void
}) {
  const active = sortCol === col
  const term = glossaryId ? GLOSSARY_MAP[glossaryId] : undefined

  return (
    <th className={cn(
      'px-3 py-3 border-b border-[var(--paper-rule)] sticky top-0 bg-[var(--paper)] z-10',
      right ? 'text-right' : 'text-left',
      className,
    )}>
      <div className={cn('relative group/th', right ? 'inline-flex justify-end w-full' : 'inline-block')}>
        <button
          onClick={e => { e.stopPropagation(); onSort(col) }}
          className={cn(
            'inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors whitespace-nowrap cursor-pointer',
            active ? 'text-[var(--paper-text)]' : 'text-[var(--paper-faint)] hover:text-[var(--paper-muted)]',
          )}
        >
          {label}
          {active
            ? (sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)
            : <ChevronDown className="h-3 w-3 opacity-40" />}
        </button>

        {term && (
          <div className={cn(
            'pointer-events-none group-hover/th:pointer-events-auto absolute top-full z-50 mt-2 hidden group-hover/th:block w-64 rounded-xl border border-[var(--paper-rule)] bg-[var(--paper)] shadow-xl text-left normal-case tracking-normal whitespace-normal overflow-hidden',
            right ? 'right-0' : 'left-0',
          )}>
            <div className="px-3.5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--paper-text)] mb-1.5">{term.name}</p>
              <p className="text-[12px] text-[var(--paper-muted)] leading-relaxed font-normal">{term.definition}</p>
            </div>
            <Link
              href={`/glossary#${glossaryId}`}
              onClick={e => e.stopPropagation()}
              className="pointer-events-auto flex items-center justify-between gap-2 border-t border-[var(--paper-rule)] px-3.5 py-2.5 text-[11px] font-medium hover:bg-[var(--paper-quiet)] transition-colors"
              style={{ color: ACCENT_COLOR }}
            >
              <span className="inline-flex items-center gap-1.5"><Info className="h-3 w-3" />Learn more</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>
    </th>
  )
}
