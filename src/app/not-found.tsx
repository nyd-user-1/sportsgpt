import Link from 'next/link'
import { AppLayout } from '@/components/AppLayout'

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const MONO:  React.CSSProperties = { fontFamily: 'var(--font-mono), monospace' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans), system-ui, sans-serif' }

const NAV = [
  { href: '/',            label: 'Home' },
  { href: '/team',        label: 'Teams' },
  { href: '/player',      label: 'Players' },
  { href: '/charts',      label: 'Charts' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/gallery',     label: 'Gallery' },
]

export default function NotFound() {
  return (
    <AppLayout paperMode>
      <div
        className="flex-1 flex flex-col justify-center px-8 sm:px-14 md:px-20 overflow-y-auto"
        style={{ background: 'var(--paper)', color: 'var(--paper-text)' }}
      >
        <div className="max-w-[520px] mx-auto w-full py-20">

          {/* Eyebrow */}
          <p
            className="uppercase tracking-[0.28em] text-[var(--paper-faint)] mb-12"
            style={{ ...MONO, fontSize: 10 }}
          >
            Section XI · Error
          </p>

          {/* 404 + rule */}
          <div className="flex items-baseline gap-6 mb-8">
            <span
              className="shrink-0 text-[var(--paper-faint)]"
              style={{ ...MONO, fontSize: 80, fontWeight: 300, letterSpacing: '-0.04em', lineHeight: 1 }}
            >
              404
            </span>
            <div className="flex-1 border-t border-[var(--paper-rule)] mb-1" />
          </div>

          {/* Headline */}
          <h1
            className="text-[var(--paper-text)] mb-5"
            style={{
              ...SERIF,
              fontSize: 'clamp(28px, 4vw, 42px)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            This page has gone missing.
          </h1>

          {/* Subtext */}
          <p
            className="text-[var(--paper-muted)] mb-14 leading-[1.75]"
            style={{ ...SERIF, fontSize: 16, fontStyle: 'italic' }}
          >
            The story you&rsquo;re looking for has been moved, removed, or
            never existed. Try one of the sections below.
          </p>

          {/* Nav */}
          <p
            className="uppercase tracking-[0.24em] text-[var(--paper-faint)] mb-4"
            style={{ ...SANS, fontSize: 10 }}
          >
            Find your way back
          </p>

          <div>
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-4 py-3.5 border-t border-[var(--paper-rule-soft)] transition-colors px-4 -mx-4 hover:bg-[color:color-mix(in_srgb,var(--paper-text)_4%,transparent)]"
                style={{ borderRadius: 3 }}
              >
                <span
                  className="shrink-0 text-[var(--paper-faint)] group-hover:text-[var(--paper-strong)] transition-colors"
                  style={{ ...MONO, fontSize: 11 }}
                >
                  ↳
                </span>
                <span
                  className="text-[var(--paper-muted)] group-hover:text-[var(--paper-strong)] transition-colors"
                  style={{ ...SERIF, fontSize: 16, fontStyle: 'italic' }}
                >
                  {label}
                </span>
              </Link>
            ))}
            <div className="border-t border-[var(--paper-rule-soft)]" />
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
