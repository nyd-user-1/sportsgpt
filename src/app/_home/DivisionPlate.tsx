import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { TABLET_RADIUS } from '@/components/editorial'
import { SCHOOL_LOGOS, DIVISION_LOGOS } from '@/lib/team-images'
import type { StandingsTeam } from './data'

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const SANS  = { fontFamily: 'var(--font-sans), system-ui, sans-serif' }  as const
const MONO  = { fontFamily: 'var(--font-mono), ui-monospace, monospace' } as const

const DIV_SLUG: Record<'I' | 'II' | 'III' | 'IV', string> = {
  I: 'division-i', II: 'division-ii', III: 'division-iii', IV: 'division-iv',
}
const DIV_NUM:  Record<'I' | 'II' | 'III' | 'IV', number> = { I: 1, II: 2, III: 3, IV: 4 }

const stripVF = (n: string) => n.replace(/\s+Varsity\s+Football$/i, '')
const fmtPct  = (w: number | null, l: number | null) => {
  const ww = w ?? 0, ll = l ?? 0, g = ww + ll
  return g === 0 ? '—' : (ww / g).toFixed(3).replace(/^0/, '')
}

/**
 * §II tile — header strip with division logo + name + season tag, three-row
 * truncated standings (rank · logo · team · record · pct), footer link.
 */
export function DivisionPlate({
  division,
  top,
  seasonLabel,
}: {
  division:    'I' | 'II' | 'III' | 'IV'
  top:         StandingsTeam[]
  seasonLabel: string
}) {
  return (
    <div
      className="flex flex-col h-full border border-[var(--paper-rule)] bg-[var(--paper-quiet)] overflow-hidden"
      style={{ borderRadius: TABLET_RADIUS }}
    >
      {/* Header */}
      <Link
        href={`/division/${DIV_SLUG[division]}`}
        className="group/head flex items-center gap-3 px-4 py-3 border-b border-[var(--paper-rule)] hover:bg-[color:color-mix(in_srgb,var(--paper-text)_4%,transparent)] transition-colors"
      >
        {DIVISION_LOGOS[DIV_NUM[division]] && (
          <Image
            src={DIVISION_LOGOS[DIV_NUM[division]]}
            alt=""
            width={26}
            height={26}
            className="object-contain shrink-0"
            unoptimized
          />
        )}
        <div className="min-w-0 flex-1">
          <p
            className="text-[15.5px] text-[var(--paper-text)] group-hover/head:text-[var(--paper-strong)] transition-colors"
            style={{ ...SERIF, fontWeight: 500, letterSpacing: '-0.005em' }}
          >
            Division {division}
          </p>
          <p className="text-[9.5px] uppercase tracking-[0.22em] text-[var(--paper-faint)]" style={SANS}>
            {seasonLabel}
          </p>
        </div>
      </Link>

      {/* Top-3 */}
      {top.length === 0 ? (
        <p
          className="px-4 py-8 text-center text-[13px] text-[var(--paper-muted)]"
          style={{ ...SERIF, fontStyle: 'italic' }}
        >
          No standings yet.
        </p>
      ) : (
        <ol className="flex-1">
          {top.map((t, i) => (
            <li key={t.slug} className={i > 0 ? 'border-t border-[var(--paper-rule-soft)]' : ''}>
              <Link
                href={`/team/${t.slug}`}
                className="group/row flex items-center gap-2.5 px-4 py-2.5 hover:bg-[color:color-mix(in_srgb,var(--paper-text)_5%,transparent)] transition-colors"
              >
                <span
                  className="w-5 text-right text-[var(--paper-faint)] tabular-nums text-[11px]"
                  style={MONO}
                >
                  {i + 1}.
                </span>
                {t.school_slug && SCHOOL_LOGOS[t.school_slug] && (
                  <Image
                    src={SCHOOL_LOGOS[t.school_slug]}
                    alt=""
                    width={20}
                    height={20}
                    className="object-contain shrink-0"
                    unoptimized
                  />
                )}
                <span
                  className="flex-1 min-w-0 truncate text-[14px] text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] transition-colors"
                  style={{ ...SERIF, fontWeight: 500 }}
                >
                  {stripVF(t.name)}
                </span>
                <span className="shrink-0 text-[12px] tabular-nums text-[var(--paper-text)]" style={MONO}>
                  {(t.overall_wins ?? 0)}–{(t.overall_losses ?? 0)}
                </span>
                <span className="w-10 shrink-0 text-right text-[12px] tabular-nums text-[var(--paper-muted)]" style={MONO}>
                  {fmtPct(t.overall_wins, t.overall_losses)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      {/* Footer */}
      <Link
        href={`/division/${DIV_SLUG[division]}`}
        className="px-4 py-3 border-t border-[var(--paper-rule)] flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-[var(--paper-strong)] hover:underline underline-offset-4"
        style={SANS}
      >
        Full standings
        <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  )
}
