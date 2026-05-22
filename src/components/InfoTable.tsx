'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'

interface InfoTableProps {
  title: string
  titleAs?: 'span' | 'h2'
  onToggle: () => void
  onPrev?: () => void
  onNext?: () => void
  onViewToggle?: () => void
  rightSlot?: React.ReactNode
  children: React.ReactNode
}

export function InfoTable({ title, titleAs = 'span', onToggle, onPrev, onNext, rightSlot, children }: InfoTableProps) {
  const btnCls = 'p-1 text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] rounded-md transition-colors'
  const TitleTag = titleAs
  const titleCls = titleAs === 'h2'
    ? 'text-lg font-semibold text-[var(--txt)]'
    : 'text-sm font-semibold text-[var(--txt)]'
  return (
    <div className="rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
      <div
        onClick={onToggle}
        className="flex items-center justify-between px-4 py-3 bg-[var(--surface)] border-b border-[var(--border)] cursor-pointer hover:bg-[var(--inp-bg)] transition-colors"
      >
        <TitleTag className={titleCls}>{title}</TitleTag>
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {rightSlot}
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
