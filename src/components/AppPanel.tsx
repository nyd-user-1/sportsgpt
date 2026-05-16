'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Columns2, Columns3 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AppPanel({
  open,
  onClose,
  title,
  footer,
  children,
  defaultExpanded,
  bodyClass,
}: {
  open: boolean
  onClose: () => void
  title: string
  footer?: React.ReactNode
  children: React.ReactNode
  defaultExpanded?: boolean
  bodyClass?: string
}) {
  const [root, setRoot] = useState<Element | null>(null)
  const [expanded, setExpanded] = useState(defaultExpanded ?? false)

  useEffect(() => { setRoot(document.getElementById('app-panel-root')) }, [])
  useEffect(() => { if (!open) setExpanded(defaultExpanded ?? false) }, [open, defaultExpanded])

  if (!root) return null

  const w = expanded ? 'sm:w-[50vw]' : 'sm:w-[423px]'

  // The desktop panel mounts into #app-panel-root and pushes the layout via a width transition.
  // On mobile it would steal the entire viewport, hiding the main container — so on mobile
  // we render an overlay sheet that slides up from the bottom and never affects layout width.
  return (
    <>
      {/* Desktop: side panel that pushes content. Hidden on mobile. */}
      {createPortal(
        <div className={`hidden sm:flex shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${open ? `${w} sm:ml-[18px]` : 'w-0'}`}>
          {open && (
            <div className={`relative h-full w-full ${w} rounded-2xl bg-[var(--surface)] flex flex-col overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.07)]`}>

              {/* Header */}
              <div className="flex items-center gap-2 border-b border-[var(--border)] px-5 py-4 shrink-0">
                <span className="flex-1 text-base font-semibold text-[var(--txt)] truncate">{title}</span>
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
      )}

      {/* Mobile: bottom sheet overlay. */}
      <div
        onClick={onClose}
        className={`sm:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <div
        className={`sm:hidden fixed left-0 right-0 bottom-0 z-50 h-[88dvh] rounded-t-2xl bg-[var(--surface)] shadow-[0_-8px_32px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${open ? 'translate-y-0' : 'translate-y-full'}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Drag handle */}
        <div className="shrink-0 flex justify-center pt-2 pb-1">
          <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3 shrink-0">
          <span className="flex-1 text-base font-semibold text-[var(--txt)] truncate">{title}</span>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className={cn('flex-1 overflow-y-auto no-scrollbar', bodyClass)}>
          {open && children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 border-t border-[var(--border)]">
            {footer}
          </div>
        )}
      </div>
    </>
  )
}
