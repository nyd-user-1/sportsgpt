import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { PLAYER_PHOTOS, SCHOOL_LOGOS } from '@/lib/team-images'
import { TABLET_RADIUS } from './PaperBridge'
import { MONO } from './Tablet'

export type RankedPlayer = {
  slug: string
  name: string
  school: string
  schoolSlug?: string
  /** Explicit rank — pass `i + 1` for unfiltered top-N, or the precomputed rank for search-filtered views. */
  rank: number
  /** Primary stat string, e.g. "2,400 YDS". Rendered in mono accent. */
  primary: string
  /** Optional secondary stat string, e.g. "24 TD". Rendered in muted mono after a dot separator. */
  secondary?: string
}

/**
 * Editorial ranked list — avatar (color) + mono rank + serif name + italic
 * school + mono stat. Each row links to `/player/[slug]`.
 */
export function PlayerRankedList({
  rows,
  emptyLabel,
}: {
  rows: RankedPlayer[]
  /** Optional. If provided and `rows` is empty, renders a centered italic message instead of nothing. */
  emptyLabel?: string
}) {
  if (rows.length === 0 && emptyLabel) {
    return (
      <p
        className="py-10 text-center text-sm text-[var(--paper-muted)]"
        style={{ fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }}
      >
        {emptyLabel}
      </p>
    )
  }

  return (
    <ol className="flex flex-col">
      {rows.map((p, i) => {
        const photo = PLAYER_PHOTOS[p.slug]
        const logo  = p.schoolSlug ? SCHOOL_LOGOS[p.schoolSlug] : undefined
        return (
          <li
            key={p.slug}
            className={cn(
              'group/row',
              i > 0 && 'border-t border-[var(--paper-rule-soft)]'
            )}
          >
            <Link
              href={`/player/${p.slug}`}
              className="grid grid-cols-[40px_36px_1fr_auto] sm:grid-cols-[44px_40px_1fr_auto] items-center gap-3 sm:gap-4 py-4 px-2 -mx-2 transition-colors hover:bg-[color:color-mix(in_srgb,var(--paper-text)_4%,transparent)]"
              style={{ borderRadius: TABLET_RADIUS }}
            >
              <div className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-[var(--paper-quiet)] border border-[var(--paper-rule)] flex items-center justify-center">
                {photo
                  ? (
                    <Image
                      src={photo} alt="" width={44} height={44}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  )
                  : logo
                  ? (
                    <Image
                      src={logo} alt="" width={28} height={28}
                      className="object-contain"
                      unoptimized
                    />
                  )
                  : null}
              </div>

              <span
                className="text-[var(--paper-faint)] tabular-nums text-[13px]"
                style={MONO}
              >
                {String(p.rank).padStart(2, ' ')}.
              </span>

              <div className="min-w-0">
                <p
                  className="text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] transition-colors leading-tight truncate"
                  style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 19, fontWeight: 500, letterSpacing: '-0.005em' }}
                >
                  {p.name}
                </p>
                <p
                  className="mt-0.5 text-[13px] text-[var(--paper-muted)] truncate"
                  style={{ fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }}
                >
                  {p.school}
                </p>
              </div>

              <div className="shrink-0 text-right tabular-nums" style={MONO}>
                <span className="text-[13.5px] text-[var(--paper-text)] font-medium">{p.primary}</span>
                {p.secondary && (
                  <>
                    <span className="mx-2 text-[var(--paper-faint)]">·</span>
                    <span className="text-[13.5px] text-[var(--paper-muted)]">{p.secondary}</span>
                  </>
                )}
              </div>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
