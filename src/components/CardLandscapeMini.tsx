'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ACCENT_COLOR } from '@/lib/app-config'

/**
 * The image slot owns its own sizing.
 * Pass { src, variant } — the component renders an <Image> at the slot's exact dimensions.
 * variant='logo'  → contained, no border (school logos, faces don't need to be cropped)
 * variant='photo' → cover-cropped, rounded (player headshots, team photos)
 */
type CardImage = { src: string; variant?: 'logo' | 'photo' }

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

const IMG_SIZE = 35

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
  image?: CardImage
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

      {image && (
        <div className="shrink-0 flex items-center justify-center" style={{ width: IMG_SIZE, height: IMG_SIZE }}>
          <Image
            src={image.src}
            alt=""
            width={IMG_SIZE}
            height={IMG_SIZE}
            unoptimized
            className={image.variant === 'photo'
              ? 'w-full h-full rounded-lg object-cover'
              : 'object-contain'}
          />
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
