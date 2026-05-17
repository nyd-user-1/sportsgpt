'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { cn } from '@/lib/utils'

function DownloadMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div ref={ref} className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(v => !v)}
        className="p-1.5 text-[var(--muted)] hover:text-[var(--txt)] transition-colors"
        aria-label="Download"
      >
        <Download className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 min-w-[90px] rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden">
          {(['CSV', 'DOC', 'MD', 'PDF'] as const).map((fmt, i) => (
            <button
              key={fmt}
              onClick={() => setOpen(false)}
              className={cn(
                'w-full px-3 py-2 text-left text-sm text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors',
                i > 0 && 'border-t border-[var(--border)]'
              )}
            >
              {fmt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface InfoTableProps {
  title: string
  onToggle: () => void
  onPrev?: () => void
  onNext?: () => void
  children: React.ReactNode
}

export function InfoTable({ title, onToggle, onPrev, onNext, children }: InfoTableProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
      <div
        onClick={onToggle}
        className="flex items-center justify-between px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)] cursor-pointer hover:bg-[var(--inp-bg)] transition-colors"
      >
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold text-[var(--txt)]">{title}</span>
          {onPrev && (
            <button
              onClick={e => { e.stopPropagation(); onPrev() }}
              className="p-1 text-[var(--muted)] hover:text-[var(--txt)] transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {onNext && (
            <button
              onClick={e => { e.stopPropagation(); onNext() }}
              className="p-1 text-[var(--muted)] hover:text-[var(--txt)] transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
        <DownloadMenu />
      </div>
      {children}
    </div>
  )
}
