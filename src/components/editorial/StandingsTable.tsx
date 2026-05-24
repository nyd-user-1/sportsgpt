'use client'

/**
 * Editorial standings table — bordered Tablet wrapper with mono tabular columns
 * for #, Team (logo + serif name), W, L, PCT, Conf. Whole-row click target.
 *
 * RESERVED. Currently unused — the division standings render as a
 * PlayerRankedList of teams for consistency with the leader sections below.
 * Kept here for a future surface that prefers a column table over a ranked
 * list (e.g. a Section-wide comparison, an all-divisions sweep view).
 *
 * Generic shape: pass any row with `slug`, `name`, optional `school_slug`,
 * and the win/loss columns. Caller wires the link target via `hrefFor`.
 */

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { EmptyTablet, MONO, Tablet, tabletTd, tabletTh } from './index'

export type StandingsRow = {
  slug: string
  name: string
  school_slug?: string | null
  overall_wins: number | null
  overall_losses: number | null
  conference_wins?: number | null
  conference_losses?: number | null
}

function fmtPct(w: number | null, l: number | null) {
  const ww = w ?? 0
  const ll = l ?? 0
  const g = ww + ll
  return g === 0 ? '—' : (ww / g).toFixed(3).replace(/^0/, '')
}

export function StandingsTable({
  rows,
  emptyLabel,
  hrefFor = slug => `/team/${slug}`,
  stripSuffix = /\s+Varsity\s+Football$/i,
}: {
  rows: StandingsRow[]
  emptyLabel: string
  /** Where each row links. Defaults to `/team/{slug}`. */
  hrefFor?: (slug: string) => string
  /** Suffix stripped from team names for display. Defaults to "Varsity Football". */
  stripSuffix?: RegExp
}) {
  const router = useRouter()

  if (rows.length === 0) return <EmptyTablet label={emptyLabel} />

  return (
    <Tablet>
      <table className="w-full">
        <thead>
          <tr>
            <th className={tabletTh('text-left w-14 pl-5')}>#</th>
            <th className={tabletTh('text-left')}>Team</th>
            <th className={tabletTh('text-right w-14')}>W</th>
            <th className={tabletTh('text-right w-14')}>L</th>
            <th className={tabletTh('text-right w-20')}>PCT</th>
            <th className={tabletTh('text-right w-20 pr-5')}>Conf</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => (
            <tr
              key={t.slug}
              onClick={() => router.push(hrefFor(t.slug))}
              className="group/row border-t border-[var(--paper-rule-soft)] cursor-pointer hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors"
            >
              <td className={cn(tabletTd, 'pl-5 text-[var(--paper-faint)] tabular-nums')} style={MONO}>
                {String(i + 1).padStart(2, ' ')}.
              </td>
              <td className={tabletTd}>
                <Link
                  href={hrefFor(t.slug)}
                  onClick={e => e.stopPropagation()}
                  className="flex items-center gap-3 text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] transition-colors"
                >
                  {t.school_slug && SCHOOL_LOGOS[t.school_slug] && (
                    <Image
                      src={SCHOOL_LOGOS[t.school_slug]}
                      alt=""
                      width={22}
                      height={22}
                      className="shrink-0 h-[22px] w-[22px] object-contain"
                      unoptimized
                    />
                  )}
                  <span
                    className="text-[16px] leading-tight"
                    style={{ fontFamily: 'var(--font-display), Georgia, serif', fontWeight: 500, letterSpacing: '-0.005em' }}
                  >
                    {t.name.replace(stripSuffix, '')}
                  </span>
                </Link>
              </td>
              <td className={cn(tabletTd, 'text-right text-[var(--paper-text)] tabular-nums font-medium')} style={MONO}>
                {t.overall_wins ?? '—'}
              </td>
              <td className={cn(tabletTd, 'text-right text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                {t.overall_losses ?? '—'}
              </td>
              <td className={cn(tabletTd, 'text-right text-[var(--paper-text)] tabular-nums')} style={MONO}>
                {fmtPct(t.overall_wins, t.overall_losses)}
              </td>
              <td className={cn(tabletTd, 'text-right pr-5 text-[var(--paper-muted)] tabular-nums')} style={MONO}>
                {(t.conference_wins != null || t.conference_losses != null)
                  ? `${t.conference_wins ?? 0}–${t.conference_losses ?? 0}`
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Tablet>
  )
}
