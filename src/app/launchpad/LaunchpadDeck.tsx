'use client'

import { useSearchParams } from 'next/navigation'
import { RevealFx } from '@/components/RevealFx'
import { HoneycombMap } from '@/app/honeycomb/Honeycomb'
import type { HexSchool } from '@/lib/section-schools'
import type { DivisionKey } from '@/components/editorial'

const DIV_MAP: Record<string, DivisionKey> = {
  'Division I': 'I', 'Division II': 'II', 'Division III': 'III', 'Division IV': 'IV',
}

/**
 * The launchpad "deck": the division-tab row stays put while the body below
 * swaps between the Launchpad view (children) and the Honeycomb view, driven by
 * the ?view URL param. Keyed by view so RevealFx replays on each flip. The
 * shared ?div filter maps straight into the honeycomb's dimming.
 */
export function LaunchpadDeck({
  honeycombSchools,
  children,
}: {
  honeycombSchools: HexSchool[]
  children: React.ReactNode
}) {
  const sp = useSearchParams()
  const view = sp.get('view') === 'honeycomb' ? 'honeycomb' : 'launchpad'
  const activeDiv: DivisionKey = DIV_MAP[sp.get('div') ?? ''] ?? 'All'

  return (
    <RevealFx key={view} delay={0} translateY={8}>
      {view === 'honeycomb'
        ? <HoneycombMap schools={honeycombSchools} activeDiv={activeDiv} />
        : children}
    </RevealFx>
  )
}
