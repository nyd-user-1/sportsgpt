import Link from 'next/link'
import { ChartSpline, FileUser, MessageCircle, Images, type LucideIcon } from 'lucide-react'
import { TABLET_RADIUS } from '@/components/editorial'

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const

const ACTIONS: { icon: LucideIcon; tooltip: string; href: string }[] = [
  { icon: ChartSpline,   tooltip: 'Charts',        href: '/charts'   },
  { icon: FileUser,      tooltip: 'Players',       href: '/player'   },
  { icon: MessageCircle, tooltip: 'Ask SportsGPT', href: '/chat'     },
  { icon: Images,        tooltip: 'Gallery',       href: '/gallery'  },
]

/**
 * Right-slot icon group on the masthead — same hairline shape as
 * EditorialButtonGroup, but each cell is a plain Link (no client toggle state).
 */
export function MastheadActions() {
  const cell = 'inline-flex items-center justify-center h-9 w-9 border border-[var(--paper-rule)] text-[var(--paper-muted)] hover:text-[var(--paper-strong)] hover:bg-[var(--paper-quiet)] transition-colors'
  const tip  = 'absolute left-1/2 -translate-x-1/2 -top-9 px-2 py-1 rounded bg-[var(--paper-text)] text-[var(--paper)] text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50'
  return (
    <div className="hidden sm:flex items-center shrink-0">
      <div className="inline-flex -space-x-px">
        {ACTIONS.map((a, i) => {
          const Icon = a.icon
          const isFirst = i === 0
          const isLast  = i === ACTIONS.length - 1
          return (
            <div key={a.href} className="relative group">
              <Link
                href={a.href}
                className={cell}
                aria-label={a.tooltip}
                style={{
                  ...(isFirst ? { borderTopLeftRadius:  TABLET_RADIUS, borderBottomLeftRadius:  TABLET_RADIUS } : {}),
                  ...(isLast  ? { borderTopRightRadius: TABLET_RADIUS, borderBottomRightRadius: TABLET_RADIUS } : {}),
                }}
              >
                <Icon className="h-4 w-4" />
              </Link>
              <span className={tip} style={{ ...SERIF, fontStyle: 'italic' }}>{a.tooltip}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
