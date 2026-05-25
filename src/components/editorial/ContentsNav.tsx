import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

export type ContentsItem = {
  id: string
  label: string
  count: number
  /** Optional sub-items shown indented below when this item is active. */
  subItems?: { id: string; label: string }[]
}

/**
 * Sticky sidebar contents list — Roman numeral + label + count per chapter,
 * with scroll-spy active state. Optionally renders `children` below the list
 * (used by the glossary for its tier-filter section).
 *
 * Pass `onSelect` to switch from scroll-anchor mode to filter mode: items
 * render as `<button>` instead of `<a>`, and clicking calls `onSelect(id)`.
 * The parent controls `activeId` for the selected state; clicking the active
 * item again should clear the selection (toggle handled by the parent).
 *
 * Hidden below `md` — pages should ensure their primary nav is reachable
 * elsewhere (sticky bar, scroll, etc.) on small screens.
 */
export function ContentsNav({
  label = 'Contents',
  items,
  activeId,
  onSelect,
  children,
  className = '',
}: {
  label?: string
  items: ContentsItem[]
  activeId?: string
  /** When provided, items render as buttons and call this handler on click. */
  onSelect?: (id: string) => void
  children?: ReactNode
  className?: string
}) {
  return (
    <nav className={cn('hidden md:block', className)}>
      <div className="sticky top-24 flex flex-col">
        <p className="mb-4 text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]">
          {label}
        </p>
        <ol className="flex flex-col">
          {items.map((item, i) => {
            const isActive = activeId === item.id
            const muted = item.count === 0
            const sharedClass = cn(
              'group flex items-baseline gap-3 py-1.5 text-[13px] leading-tight transition-colors',
              muted
                ? 'text-[var(--paper-faint)]'
                : isActive
                  ? 'text-[var(--paper-text)]'
                  : 'text-[var(--paper-muted)] hover:text-[var(--paper-strong)]'
            )
            const inner = (
              <>
                <span
                  className={cn(
                    'shrink-0 w-6 text-right italic transition-colors',
                    isActive && 'text-[var(--paper-strong)]'
                  )}
                  style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 12 }}
                >
                  {ROMAN[i] ?? `${i + 1}.`}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                <span className="text-[10px] tabular-nums opacity-60">{item.count}</span>
              </>
            )
            return (
              <li key={item.id}>
                {onSelect ? (
                  <button
                    onClick={() => onSelect(item.id)}
                    className={cn(sharedClass, 'w-full text-left')}
                  >
                    {inner}
                  </button>
                ) : (
                  <a href={`#${item.id}`} className={sharedClass}>
                    {inner}
                  </a>
                )}
                {isActive && item.subItems && item.subItems.length > 0 && (
                  <ol className="flex flex-col mt-0.5 mb-1">
                    {item.subItems.map(sub => (
                      <li key={sub.id}>
                        <a
                          href={`#${sub.id}`}
                          className="flex items-baseline gap-2 pl-9 py-1 text-[11px] text-[var(--paper-faint)] hover:text-[var(--paper-strong)] transition-colors leading-tight"
                        >
                          <span className="shrink-0 opacity-50">–</span>
                          <span className="truncate">{sub.label}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            )
          })}
        </ol>
        {children}
      </div>
    </nav>
  )
}
