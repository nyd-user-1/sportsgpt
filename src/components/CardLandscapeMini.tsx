'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ACCENT_COLOR } from '@/lib/app-config'

/**
 * CardLandscapeMini — 210×90 horizontal card used in team-page carousels.
 *
 * Variants:
 *   game     → badge top-right, title (opponent), subtitle (date), stat (score)
 *   player   → title (name), subtitle (position/type), stat (value + label)
 *   standing → title (team), stat (record, accent), subtitle (pct, muted below)
 */

type Row = { text: string; color?: string }
type Stat = { value: string; label?: string; color?: string }

export function CardLandscapeMini({
  href,
  image,
  badge,
  title,
  titlePadRight,
  row2,
  stat,
  statFirst,   // if true, stat appears before row2 (standings layout)
}: {
  href?: string
  image?: React.ReactNode
  badge?: React.ReactNode   // absolute top-right corner
  title: string
  titlePadRight?: boolean   // add pr-6 to avoid overlap with badge
  row2?: Row
  stat?: Stat
  statFirst?: boolean
}) {
  const inner = (
    <div className="relative shrink-0 w-[210px] h-[90px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 flex items-center gap-3 hover:bg-[var(--inp-bg)] hover:border-transparent transition-all">
      {badge && (
        <div className="absolute top-2.5 right-3">{badge}</div>
      )}

      {/* Image slot — 45×45, no background */}
      {image && (
        <div className="shrink-0 w-[45px] h-[45px] flex items-center justify-center">
          {image}
        </div>
      )}

      {/* Text */}
      <div className="flex flex-col justify-center flex-1 min-w-0 h-[60px] gap-0.5">
        <p className={cn('text-sm font-bold text-[var(--txt)] leading-snug truncate', titlePadRight && 'pr-6')}>
          {title}
        </p>

        {statFirst && stat && (
          <p className="text-xs font-bold leading-snug" style={{ color: stat.color ?? ACCENT_COLOR }}>
            {stat.value}
            {stat.label && <span className="text-[var(--muted)] font-normal ml-1.5">{stat.label}</span>}
          </p>
        )}

        {row2 && (
          <p className="text-[11px] leading-none truncate" style={{ color: row2.color ?? 'var(--muted)' }}>
            {row2.text}
          </p>
        )}

        {!statFirst && stat && (
          <p className="text-xs font-bold mt-0.5" style={{ color: stat.color ?? ACCENT_COLOR }}>
            {stat.value}
            {stat.label && <span className="text-[var(--muted)] font-normal ml-1.5">{stat.label}</span>}
          </p>
        )}
      </div>
    </div>
  )

  return href ? <Link href={href} className="block">{inner}</Link> : inner
}

export function WLBadge({ result }: { result: 'W' | 'L' | 'T' }) {
  return (
    <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded',
      result === 'W' ? 'text-green-500' :
      result === 'L' ? 'text-red-500' :
      'text-[var(--muted)]')}>
      {result}
    </span>
  )
}
