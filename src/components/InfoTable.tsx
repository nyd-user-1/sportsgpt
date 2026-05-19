'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'

interface InfoTableProps {
  title: string
  onToggle: () => void
  onPrev?: () => void
  onNext?: () => void
  onViewToggle?: () => void
  children: React.ReactNode
}

export function InfoTable({ title, onToggle, onPrev, onNext, children }: InfoTableProps) {
  const btnCls = 'p-1 text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] rounded-md transition-colors'
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
      <div
        onClick={onToggle}
        className="flex items-center justify-between px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)] cursor-pointer hover:bg-[var(--inp-bg)] transition-colors"
      >
        <span className="text-sm font-semibold text-[var(--txt)]">{title}</span>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          {onPrev && (
            <button onClick={e => { e.stopPropagation(); onPrev() }} className={btnCls} aria-label="Previous">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          {onNext && (
            <button onClick={e => { e.stopPropagation(); onNext() }} className={btnCls} aria-label="Next">
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}
