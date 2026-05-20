'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { X, Columns2, Columns3, ArrowUpRight, ArrowRight, ArrowLeft } from 'lucide-react'
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
}: {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
  defaultExpanded?: boolean
  bodyClass?: string
  detailHref?: string
  prevHref?: string
  nextHref?: string
}) {
  const [root, setRoot] = useState<Element | null>(null)
  const [expanded, setExpanded] = useState(defaultExpanded ?? false)

  useEffect(() => { setRoot(document.getElementById('app-panel-root')) }, [])
  useEffect(() => { if (!open) setExpanded(defaultExpanded ?? false) }, [open, defaultExpanded])

  if (!root) return null

  const w = expanded ? 'sm:w-[50vw]' : 'sm:w-[423px]'

  return createPortal(
    <div className={`shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${open ? `w-full ${w} sm:ml-[18px]` : 'w-0'}`}>
      {open && (
        <div className={`group/panel relative h-full w-full ${w} rounded-none sm:rounded-2xl bg-[var(--surface)] flex flex-col overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.07)]`}>

          {/* Header */}
          <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4 shrink-0">
            <div className="flex-1 flex items-center gap-1 min-w-0">
              <span className="text-base font-semibold text-[var(--txt)] truncate">{title}</span>
              {detailHref && (
                <Link
                  href={detailHref}
                  className="group/arrow shrink-0 p-0.5 rounded text-[var(--muted)] hover:text-[var(--txt)] transition-colors relative w-4 h-4"
                  aria-label="Open detail page"
                >
                  <ArrowUpRight className="h-4 w-4 absolute transition-all duration-200 group-hover/arrow:opacity-0 group-hover/arrow:scale-75" />
                  <ArrowRight   className="h-4 w-4 absolute transition-all duration-200 opacity-0 group-hover/arrow:opacity-100 group-hover/arrow:translate-x-0.5" />
                </Link>
              )}
            </div>
            {/* Prev / Next navigation */}
            {prevHref && (
              <Link href={prevHref} scroll={false} className="shrink-0 p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors" aria-label="Previous">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            )}
            {nextHref && (
              <Link href={nextHref} scroll={false} className="shrink-0 p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors" aria-label="Next">
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            {/* ButtonPanelHalf / ButtonPanelThird */}
            <button
              onClick={() => setExpanded(v => !v)}
              className="shrink-0 p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors"
              aria-label={expanded ? 'Collapse to third' : 'Expand to half'}
            >
              {expanded ? <Columns3 className="h-4 w-4" /> : <Columns2 className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors"
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
            <div className="shrink-0 border-t border-[var(--border)]">
              {footer}
            </div>
          )}

        </div>
      )}
    </div>,
    root
  )
}
