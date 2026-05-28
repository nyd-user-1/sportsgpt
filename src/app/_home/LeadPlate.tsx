import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { TABLET_RADIUS } from '@/components/editorial'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import type { MiniStat } from './data'

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const SANS  = { fontFamily: 'var(--font-sans), system-ui, sans-serif' }  as const
const MONO  = { fontFamily: 'var(--font-mono), ui-monospace, monospace' } as const

/**
 * The §I right-column block: roman numeral kicker, drop-cap deck, mini-stat
 * column, footer link. Pairs with HeroStrip on the left at a fixed height so
 * both columns visually anchor.
 */
export function LeadPlate({
  roman,
  kicker,
  dropCap,
  deck,
  href,
  hrefLabel,
  rows,
}: {
  roman:     string
  kicker:    string
  dropCap:   string
  deck:      string
  href:      string
  hrefLabel: string
  rows:      MiniStat[]
}) {
  return (
    <div
      className="h-full flex flex-col border border-[var(--paper-rule)] bg-[var(--paper-quiet)] p-7"
      style={{ borderRadius: TABLET_RADIUS }}
    >
      {/* Kicker row */}
      <div className="flex items-baseline gap-3">
        <span
          className="text-[var(--paper-strong)] tabular-nums"
          style={{ ...MONO, fontSize: 13, letterSpacing: '0.04em' }}
        >
          {roman}
        </span>
        <span
          className="text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]"
          style={SANS}
        >
          {kicker}
        </span>
      </div>

      {/* Deck with drop cap */}
      <p
        className="mt-4 text-[15px] leading-[1.55] text-[var(--paper-text)]"
        style={{ ...SERIF, fontStyle: 'italic', fontWeight: 400 }}
      >
        <span
          className="float-left mr-2 leading-[0.85] text-[var(--paper-text)]"
          style={{ ...SERIF, fontSize: 56, fontStyle: 'normal', fontWeight: 500 }}
        >
          {dropCap}
        </span>
        {deck}
      </p>

      {/* Mini stats */}
      {rows.length > 0 && (
        <ul className="mt-6 border-t border-[var(--paper-rule)]">
          {rows.map((s, i) => {
            const logo = s.href.startsWith('/team/') || s.href.startsWith('/player/')
              ? (rows[i] && SCHOOL_LOGOS && Object.keys(SCHOOL_LOGOS).find(k => s.href.includes(k))
                  ? SCHOOL_LOGOS[Object.keys(SCHOOL_LOGOS).find(k => s.href.includes(k)) as string]
                  : null)
              : null
            return (
              <li
                key={i}
                className="border-b border-[var(--paper-rule-soft)] last:border-b-0"
              >
                <Link
                  href={s.href}
                  className="group/row flex items-center gap-3 py-3 transition-colors hover:bg-[color:color-mix(in_srgb,var(--paper-text)_4%,transparent)] -mx-2 px-2"
                >
                  <div className="w-7 h-7 shrink-0 rounded-full bg-[var(--paper)] border border-[var(--paper-rule)] flex items-center justify-center overflow-hidden">
                    {logo
                      ? <Image src={logo} alt="" width={18} height={18} className="object-contain" unoptimized />
                      : <span className="text-[9px] uppercase tracking-[0.18em] text-[var(--paper-faint)]" style={SANS}>{(s.label[0] ?? '·').toUpperCase()}</span>
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[9.5px] uppercase tracking-[0.24em] text-[var(--paper-faint)]"
                      style={SANS}
                    >
                      {s.label}
                    </p>
                    <p
                      className="text-[14px] text-[var(--paper-text)] group-hover/row:text-[var(--paper-strong)] transition-colors truncate"
                      style={{ ...SERIF, fontWeight: 500 }}
                    >
                      {s.name}
                    </p>
                  </div>
                  <div className="shrink-0 text-right tabular-nums">
                    <span className="text-[15px] text-[var(--paper-text)]" style={MONO}>{s.value}</span>
                    <span className="ml-1.5 text-[10px] text-[var(--paper-muted)]" style={SANS}>{s.unit}</span>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {/* Footer link */}
      <div className="mt-auto pt-6">
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em] text-[var(--paper-strong)] hover:underline underline-offset-4"
          style={SANS}
        >
          {hrefLabel}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
