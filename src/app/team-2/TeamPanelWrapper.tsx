'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { AppPanel } from '@/components/AppPanel'
import { TeamPanelFooter } from '@/components/PanelTeam'
import { SCHOOL_LOGOS } from '@/lib/team-images'

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }

export function TeamPanelWrapper({ panel }: { panel: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const match    = pathname.match(/^\/team-2\/(.+)$/)
  const slug     = match ? match[1] : null

  const schoolSlug = slug ? slug.replace(/-varsity-football$/, '') : ''
  const teamName = schoolSlug
    ? schoolSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : ''
  const logoSrc = SCHOOL_LOGOS[schoolSlug]

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
      {slug ? (
        <Link
          href={`/team/${slug}`}
          className="text-[var(--paper-text)] hover:text-[var(--paper-strong)] transition-colors truncate"
          style={{ ...SERIF, fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em' }}
        >
          {teamName}
        </Link>
      ) : (
        <span
          className="text-[var(--paper-text)] truncate"
          style={{ ...SERIF, fontSize: 15, fontWeight: 500, letterSpacing: '-0.005em' }}
        >
          {teamName}
        </span>
      )}
    </div>
  )

  return (
    <AppPanel
      open={!!slug}
      onClose={() => router.push('/team-2', { scroll: false })}
      title={title}
      bodyClass="flex flex-col"
      footer={slug ? <TeamPanelFooter /> : undefined}
    >
      {panel}
    </AppPanel>
  )
}
