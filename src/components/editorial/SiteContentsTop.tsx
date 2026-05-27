import Link from 'next/link'

/**
 * Top-of-sidebar "SITE" block — global links shown above every `ContentsNav`'s
 * page-specific list. Pass into the `topChildren` prop. Keeps the SITE block
 * identical across every editorial page (Division / Teams / Players).
 */
export function SiteContentsTop({
  divisionHref = '/division/division-i',
  totalTeams = 52,
  totalPlayers = 4722,
}: {
  /** Optional override for the Division link target. Defaults to Division I. */
  divisionHref?: string
  totalTeams?: number
  totalPlayers?: number
}) {
  const links = [
    { roman: 'I',   label: 'Division', count: 4,            href: divisionHref },
    { roman: 'II',  label: 'Teams',    count: totalTeams,   href: '/team' },
    { roman: 'III', label: 'Players',  count: totalPlayers, href: '/player' },
  ] as const

  return (
    <div className="mb-8">
      <p className="mb-4 text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]">Site</p>
      <ol className="flex flex-col">
        {links.map(link => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="group flex items-baseline gap-3 py-1.5 text-[13px] leading-tight text-[var(--paper-muted)] hover:text-[var(--paper-strong)] transition-colors"
            >
              <span
                className="shrink-0 w-6 text-right italic"
                style={{ fontFamily: 'var(--font-display), Georgia, serif', fontSize: 12 }}
              >
                {link.roman}
              </span>
              <span className="flex-1 truncate">{link.label}</span>
              <span className="text-[10px] tabular-nums opacity-60">{link.count}</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
