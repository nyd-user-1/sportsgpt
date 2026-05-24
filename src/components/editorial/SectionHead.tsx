import type { ReactNode } from 'react'

/**
 * Editorial section heading — large serif title, italic subhead, optional
 * eyebrow above and right-aligned meta slot opposite the title.
 */
export function SectionHead({
  title,
  blurb,
  meta,
  eyebrow,
}: {
  title: ReactNode
  blurb?: ReactNode
  meta?: ReactNode
  eyebrow?: ReactNode
}) {
  return (
    <div className="mb-7 border-b border-[var(--paper-rule)] pb-4">
      {eyebrow && (
        <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]">
          {eyebrow}
        </p>
      )}
      <div className="flex items-end justify-between gap-6">
        <div className="min-w-0">
          <h2
            className="text-[var(--paper-text)] leading-[1.02]"
            style={{
              fontFamily: 'var(--font-display), Georgia, serif',
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 500,
              letterSpacing: '-0.015em',
              paddingBottom: '0.05em',
            }}
          >
            {title}
          </h2>
          {blurb && (
            <p
              className="mt-1.5 text-[var(--paper-muted)] text-sm sm:text-[15px]"
              style={{ fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }}
            >
              {blurb}
            </p>
          )}
        </div>
        {meta != null && (
          <div className="pb-2 shrink-0 hidden sm:block">{meta}</div>
        )}
      </div>
    </div>
  )
}
