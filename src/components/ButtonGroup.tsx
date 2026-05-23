'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Shared button group for detail pages.
 * Renders: ‹ prev | …middle buttons… | next ›
 * Used by GameShell, TeamShell, PlayerShell, ChartDetailPage, etc.
 *
 * Each middle button gets a tooltip on hover. Active state highlights the icon
 * with the accent color and a muted background.
 */
export interface ButtonGroupButton {
  icon: LucideIcon
  tooltip: string
  active?: boolean
  onClick: () => void
}

interface Props {
  prevHref?: string
  nextHref?: string
  onPrev?: () => void
  onNext?: () => void
  buttons: ButtonGroupButton[]
}

const btnCls = 'inline-flex items-center justify-center h-8 w-8 border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:text-[#033882] hover:bg-[var(--inp-bg)] transition-colors'
const activeCls = 'bg-[var(--inp-bg)] text-[#033882]'
const tipCls = 'absolute left-1/2 -translate-x-1/2 -top-8 px-2 py-1 rounded bg-[var(--txt)] text-[var(--bg)] text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50'

export function ButtonGroup({ prevHref, nextHref, onPrev, onNext, buttons }: Props) {
  return (
    <div className="hidden sm:flex items-center shrink-0">
      <div className="inline-flex -space-x-px">
        <div className="relative group">
          {prevHref ? (
            <Link href={prevHref} className={cn(btnCls, 'rounded-l-full')}><ChevronLeft className="h-4 w-4" /></Link>
          ) : (
            <button onClick={onPrev} className={cn(btnCls, 'rounded-l-full')}><ChevronLeft className="h-4 w-4" /></button>
          )}
          <span className={tipCls}>Previous</span>
        </div>

        {buttons.map((b, i) => {
          const Icon = b.icon
          return (
            <div key={i} className="relative group">
              <button onClick={b.onClick} className={cn(btnCls, b.active && activeCls)}>
                <Icon className="h-4 w-4" />
              </button>
              <span className={tipCls}>{b.tooltip}</span>
            </div>
          )
        })}

        <div className="relative group">
          {nextHref ? (
            <Link href={nextHref} className={cn(btnCls, 'rounded-r-full')}><ChevronRight className="h-4 w-4" /></Link>
          ) : (
            <button onClick={onNext} className={cn(btnCls, 'rounded-r-full')}><ChevronRight className="h-4 w-4" /></button>
          )}
          <span className={tipCls}>Next</span>
        </div>
      </div>
    </div>
  )
}
