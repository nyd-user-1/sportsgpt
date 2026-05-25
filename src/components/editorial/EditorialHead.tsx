import type { ReactNode, CSSProperties } from 'react'
import { TierIndicator, type Tier } from '@/components/TierIndicator'

type Size = 'xl' | 'lg' | 'md' | 'sm'

const SIZE: Record<Size, string> = {
  xl: 'clamp(3rem, 8.5vw, 6.25rem)',
  lg: 'clamp(2.5rem, 6.5vw, 4.75rem)',
  md: 'clamp(2rem, 5vw, 3.5rem)',
  sm: 'clamp(1.625rem, 3.5vw, 2.5rem)',
}

type Props = {
  eyebrow?: ReactNode
  children: ReactNode
  subhead?: ReactNode
  meta?: ReactNode[]
  rightSlot?: ReactNode
  /** Replaces the decorative `——` line before the eyebrow text. */
  leadingSlot?: ReactNode
  tier?: Tier
  size?: Size
  className?: string
  style?: CSSProperties
}

export function EditorialHead({
  eyebrow,
  children,
  subhead,
  meta,
  rightSlot,
  leadingSlot,
  tier,
  size = 'xl',
  className = '',
  style,
}: Props) {
  const showEyebrowRow = !!eyebrow || !!tier || !!rightSlot

  return (
    <header className={`flex flex-col items-start ${className}`} style={style}>
      {showEyebrowRow && (
        <div className="w-full mb-6 sm:mb-8 flex items-center justify-between gap-4 min-h-[28px]">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)] min-w-0 flex-1">
            {leadingSlot ?? <span aria-hidden className="inline-block w-6 h-px bg-[var(--paper-rule)] shrink-0" />}
            {tier && (
              <span className="text-[var(--paper-strong)] shrink-0">
                <TierIndicator tier={tier} size={4} />
              </span>
            )}
            {eyebrow && <span className="truncate">{eyebrow}</span>}
          </div>
          {rightSlot && <div className="shrink-0">{rightSlot}</div>}
        </div>
      )}

      <h1
        className="text-[var(--paper-text)] leading-[1] tracking-[-0.02em] max-w-full"
        style={{
          fontFamily: 'var(--font-display), Georgia, serif',
          fontSize: SIZE[size],
          fontWeight: 400,
          paddingBottom: '0.08em',
        }}
      >
        {children}
      </h1>

      {subhead && (
        <p
          className="mt-6 sm:mt-7 max-w-xl text-[15px] sm:text-base leading-[1.65] text-[var(--paper-muted)]"
          style={{ fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }}
        >
          {subhead}
        </p>
      )}

      {meta && meta.length > 0 && (
        <div className="mt-7 sm:mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] uppercase tracking-[0.22em] text-[var(--paper-faint)] tabular-nums">
          {meta.flatMap((item, i) =>
            i === 0
              ? [<span key={i}>{item}</span>]
              : [
                  <span key={`s-${i}`} aria-hidden className="text-[var(--paper-rule)]">/</span>,
                  <span key={i}>{item}</span>,
                ]
          )}
        </div>
      )}
    </header>
  )
}

export function EditorialAccent({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`block italic text-[var(--paper-strong)] ${className}`}
      style={{ fontWeight: 300, fontVariationSettings: '"opsz" 120' }}
    >
      {children}
    </span>
  )
}
