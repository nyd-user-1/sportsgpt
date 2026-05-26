'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AppPanel } from '@/components/AppPanel'
import { SCHOOL_LOGOS } from '@/lib/team-images'

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const SANS  = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' } as const

function slugToName(slug: string) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function GamePlayerPanelWrapper({ panel }: { panel: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const params   = useSearchParams()
  const match    = pathname.match(/^(\/game\/[^/]+)\/player\/(.+)$/)
  const gameBase   = match ? match[1] : null
  const playerSlug = match ? match[2] : null

  const schoolSlug = params.get('school') ?? ''
  const teamName   = params.get('team')   ?? ''
  const teamSlug   = schoolSlug ? `${schoolSlug}-varsity-football` : null
  const logoSrc    = schoolSlug ? SCHOOL_LOGOS[schoolSlug] : null
  const titleText  = teamName || (playerSlug ? slugToName(playerSlug) : '')

  const title = (
    <div className="flex items-center gap-2 min-w-0">
      {logoSrc && (
        <div
          style={{ width: 22, height: 22 }}
          className="shrink-0 rounded-full overflow-hidden bg-[var(--paper-quiet)] border border-[var(--paper-rule)] flex items-center justify-center"
        >
          <Image src={logoSrc} alt="" width={17} height={17} className="object-contain" unoptimized />
        </div>
      )}
      {teamSlug && teamName ? (
        <Link
          href={`/team/${teamSlug}`}
          className="text-[var(--paper-text)] hover:text-[var(--paper-strong)] transition-colors truncate"
          style={{ ...SERIF, fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em' }}
        >
          {titleText}
        </Link>
      ) : (
        <span
          className="text-[var(--paper-text)] truncate"
          style={{ ...SERIF, fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em' }}
        >
          {titleText}
        </span>
      )}
    </div>
  )

  const footer = playerSlug ? (
    <div className="px-5 py-3.5 bg-[var(--paper)]">
      <span
        className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]"
        style={SANS}
      >
        Player Game Log
      </span>
    </div>
  ) : undefined

  return (
    <AppPanel
      open={!!playerSlug}
      onClose={() => gameBase && router.push(gameBase, { scroll: false })}
      title={title}
      footer={footer}
    >
      {panel}
    </AppPanel>
  )
}
