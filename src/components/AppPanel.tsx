'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { X, Columns2, Columns3, ArrowUpRight, ArrowLeft, ArrowRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppPanel({
  open,
  onClose,
  title,
  footer,
  children,
  defaultExpanded,
  bodyClass,
  detailHref,
  prevHref,
  nextHref,
  searchable,
  onSearchChange,
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  footer?: React.ReactNode
  children?: React.ReactNode
  defaultExpanded?: boolean
  bodyClass?: string
  detailHref?: string
  prevHref?: string
  nextHref?: string
  searchable?: boolean
  onSearchChange?: (q: string) => void
}) {
  const [root, setRoot] = useState<Element | null>(null)
  const [expanded, setExpanded] = useState(defaultExpanded ?? false)
  const [searchActive, setSearchActive] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setRoot(document.getElementById('app-panel-root')) }, [])
  useEffect(() => {
    if (!open) {
      setExpanded(defaultExpanded ?? false)
      setSearchActive(false)
      setSearchValue('')
      onSearchChange?.('')
    }
  }, [open, defaultExpanded]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchActive) searchInputRef.current?.focus()
  }, [searchActive])

  function activateSearch() { setSearchActive(true) }
  function deactivateSearch() {
    setSearchActive(false)
    setSearchValue('')
    onSearchChange?.('')
  }
  function handleSearchChange(v: string) {
    setSearchValue(v)
    onSearchChange?.(v)
  }

  if (!root) return null

  const w = expanded ? 'sm:w-[50vw]' : 'sm:w-[423px]'

  return createPortal(
    <div className={`shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${open ? `w-full ${w} sm:ml-[18px]` : 'w-0'}`}>
      {open && (
        <div className={`group/panel relative h-full w-full ${w} rounded-none sm:rounded-2xl bg-[var(--paper)] flex flex-col overflow-hidden shadow-[0_4px_32px_rgba(0,0,0,0.10)] border border-[var(--paper-rule)]`}>

          {/* Header */}
          <div className="flex items-center gap-2 border-b border-[var(--paper-rule)] px-5 py-4 shrink-0">
            {searchActive ? (
              <>
                <button onClick={deactivateSearch}
                  className="shrink-0 p-1.5 rounded-lg text-[var(--paper-faint)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] transition-colors">
                  <X className="h-4 w-4" />
                </button>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchValue}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Search players…"
                  className="flex-1 min-w-0 bg-transparent text-[14px] text-[var(--paper-text)] placeholder:text-[var(--paper-faint)] outline-none"
                  style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center gap-1 min-w-0">
                <span
                  className="text-[var(--paper-text)] truncate"
                  style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em' }}
                >{title}</span>
                {detailHref && (
                  <Link
                    href={detailHref}
                    className="shrink-0 p-1.5 rounded-lg text-[var(--paper-faint)] hover:text-[var(--paper-strong)] hover:bg-[var(--paper-quiet)] transition-colors"
                    aria-label="Open detail page"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            )}
            {/* Prev / Next navigation */}
            {!searchActive && prevHref && (
              <Link href={prevHref} scroll={false} className="shrink-0 p-1.5 rounded-lg text-[var(--paper-faint)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] transition-colors" aria-label="Previous">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            )}
            {!searchActive && nextHref && (
              <Link href={nextHref} scroll={false} className="shrink-0 p-1.5 rounded-lg text-[var(--paper-faint)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] transition-colors" aria-label="Next">
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            {/* Search */}
            {searchable && !searchActive && (
              <button onClick={activateSearch}
                className="shrink-0 p-1.5 rounded-lg text-[var(--paper-faint)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] transition-colors"
                aria-label="Search">
                <Search className="h-4 w-4" />
              </button>
            )}
            {/* Expand/collapse */}
            <button
              onClick={() => setExpanded(v => !v)}
              className="shrink-0 p-1.5 rounded-lg text-[var(--paper-faint)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] transition-colors"
              aria-label={expanded ? 'Collapse to third' : 'Expand to half'}
            >
              {expanded ? <Columns3 className="h-4 w-4" /> : <Columns2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-lg text-[var(--paper-faint)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className={cn('flex-1 overflow-y-auto no-scrollbar', bodyClass)}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="shrink-0 border-t border-[var(--paper-rule)]">
              {footer}
            </div>
          )}

        </div>
      )}
    </div>,
    root
  )
}
