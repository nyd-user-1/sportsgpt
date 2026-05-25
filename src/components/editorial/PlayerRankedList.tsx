import Link from 'next/link'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { PLAYER_PHOTOS, SCHOOL_LOGOS } from '@/lib/team-images'
import { TABLET_RADIUS } from './PaperBridge'
import { MONO } from './Tablet'
import { Highlight } from './Highlight'

export type RankedPlayer = {
  slug: string
  name: string
  /** Italic subtitle. Hidden if absent. (Players pass school name; teams pass conference record.) */
  school?: string
  schoolSlug?: string
  /** Pre-resolved logo/photo URL. When set, skips the SCHOOL_LOGOS/PLAYER_PHOTOS lookups. */
  logoUrl?: string
  /** Explicit rank — pass `i + 1` for unfiltered top-N, or the precomputed rank for search-filtered views. */
  rank: number
  /** Primary stat string, e.g. "2,400 YDS". Rendered in mono accent. */
  primary: string
  /** Optional secondary stat string, e.g. "24 TD". Rendered in muted mono after a dot separator. */
  secondary?: string
  /** Optional row link target. Defaults to `/player/{slug}`. */
  href?: string
}

/**
 * Editorial ranked list — avatar (color) + mono rank + serif name + italic
 * school + mono stat. Each row links to `/player/[slug]`.
 */
export function PlayerRankedList({
  rows,
  emptyLabel,
  query = '',
}: {
  rows: RankedPlayer[]
  /** Optional. If provided and `rows` is empty, renders a centered italic message instead of nothing. */
  emptyLabel?: string
  /** When set, wraps matching text in each row's name and subtitle with <mark.search-highlight>. */
  query?: string
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
        // Pre-resolved URL wins; otherwise look up SCHOOL_LOGOS then fall back to player photo
        const logo   = p.logoUrl ?? (p.schoolSlug ? SCHOOL_LOGOS[p.schoolSlug] : undefined)
        const photo  = PLAYER_PHOTOS[p.slug]
        const avatar = logo ?? photo
        return (
          <li
            key={`${p.slug}-${i}`}
            className={cn(
              'group/row',
              i > 0 && 'border-t border-[var(--paper-rule-soft)]'
            )}
          >
            <Link
              href={p.href ?? `/player/${p.slug}`}
              className="player-row-grid gap-3 sm:gap-4 py-5 px-4 -mx-4 transition-colors hover:bg-[color:color-mix(in_srgb,var(--paper-text)_4%,transparent)]"
              style={{ borderRadius: TABLET_RADIUS }}
            >
              <div className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden bg-[var(--paper-quiet)] border border-[var(--paper-rule)] flex items-center justify-center">
                {avatar
                  ? (
                    <Image
                      src={avatar} alt="" width={28} height={28}
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
                  <Highlight text={p.name} query={query} />
                </p>
                {p.school && (
                  <p
                    className="mt-0.5 text-[13px] text-[var(--paper-muted)] truncate"
                    style={{ fontFamily: 'var(--font-display), Georgia, serif', fontStyle: 'italic' }}
                  >
                    <Highlight text={p.school} query={query} />
                  </p>
                )}
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
