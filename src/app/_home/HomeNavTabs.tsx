import Link from 'next/link'

const SANS = { fontFamily: 'var(--font-sans), system-ui, sans-serif' } as const
const MONO = { fontFamily: 'var(--font-mono), ui-monospace, monospace' } as const

const TABS: { label: string; href: string }[] = [
  { label: 'Chat',     href: '/chat'                    },
  { label: 'Charts',   href: '/charts'                  },
  { label: 'Division', href: '/division/division-i'     },
  { label: 'Games',    href: '/section/section-xi#games' },
  { label: 'Players',  href: '/player'                  },
  { label: 'Teams',    href: '/team'                    },
]

/**
 * Editorial section-nav — six tabs sit on a single hairline rule, with the
 * rule extending to either side. Bullet separators between tabs.
 */
export function HomeNavTabs() {
  return (
    <div className="flex items-center gap-5 my-10">
      <span aria-hidden className="flex-1 h-px bg-[var(--paper-rule)]" />
      <nav className="flex items-center gap-4 sm:gap-5">
        {TABS.map((t, i) => (
          <span key={t.href} className="flex items-center gap-4 sm:gap-5">
            {i > 0 && (
              <span aria-hidden className="text-[var(--paper-rule)] select-none" style={MONO}>·</span>
            )}
            <Link
              href={t.href}
              className="text-[10.5px] uppercase tracking-[0.24em] text-[var(--paper-muted)] hover:text-[var(--paper-strong)] transition-colors whitespace-nowrap"
              style={SANS}
            >
              {t.label}
            </Link>
          </span>
        ))}
      </nav>
      <span aria-hidden className="flex-1 h-px bg-[var(--paper-rule)]" />
    </div>
  )
}
