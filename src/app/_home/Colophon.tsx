import Link from 'next/link'

const SANS = { fontFamily: 'var(--font-sans), system-ui, sans-serif' } as const
const MONO = { fontFamily: 'var(--font-mono), ui-monospace, monospace' } as const

function fmtUpdatedAt(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Foot of the page — single mono line of bullet-separated meta. Reads as an
 * editorial colophon, not a dashboard footer.
 */
export function Colophon({ updatedAt }: { updatedAt: string }) {
  const segments: Array<{ label: string; href?: string }> = [
    { label: 'Colophon' },
    { label: `Data as of ${fmtUpdatedAt(updatedAt)}` },
    { label: 'Newsday + MaxPreps' },
    { label: 'Glossary', href: '/glossary' },
    { label: 'Admin',    href: '/admin' },
    { label: 'v5.0' },
  ]

  return (
    <footer className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pb-12">
      <div className="h-px w-full bg-[var(--paper-rule)] mb-6" />
      <div
        className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]"
        style={SANS}
      >
        {segments.map((s, i) => (
          <span key={i} className="flex items-center gap-3">
            {i > 0 && (
              <span aria-hidden style={MONO} className="text-[var(--paper-rule)]">·</span>
            )}
            {s.href
              ? (
                <Link
                  href={s.href}
                  className="text-[var(--paper-faint)] hover:text-[var(--paper-strong)] transition-colors"
                >
                  {s.label}
                </Link>
              ) : (
                <span>{s.label}</span>
              )
            }
          </span>
        ))}
      </div>
    </footer>
  )
}
