import { Suspense } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { ProviderSection } from './ProviderSection'
import { LaunchpadTabs } from './LaunchpadTabs'
import { LaunchpadGameWrapper } from './LaunchpadGameWrapper'
import { fetchLaunchpadGames } from '@/lib/launchpad-games'
import { CURRENT_SEASON } from '@/lib/season'

export default async function LaunchpadLayout({
  children,
  detail,
  game,
}: {
  children: React.ReactNode
  detail: React.ReactNode
  game: React.ReactNode
}) {
  // Only the current season is fetched server-side for the initial render.
  // Older seasons load on demand (see ProviderSection) when their tab is opened.
  const games = await fetchLaunchpadGames([CURRENT_SEASON])

  return (
    <AppLayout showNavArrows paperMode>
      <LaunchpadGameWrapper game={game} />
      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ backgroundColor: 'var(--paper)' }}>
        <div className="pt-2 px-6 sm:px-10 md:px-14 pb-8 flex flex-col gap-6">

          {/* Division tabs — full width above both slots */}
          <Suspense fallback={<div className="h-9 border-b border-[var(--paper-rule)]" />}>
            <LaunchpadTabs />
          </Suspense>

          {/* Two-slot row */}
          <div className="h-[380px] shrink-0 flex gap-5">
            <Suspense fallback={null}>
              {children}
            </Suspense>
            <Suspense fallback={null}>
              <div
                className="flex-1 min-w-0 border border-[var(--paper-rule)] bg-[var(--paper-quiet)] transition-all duration-200"
                style={{ padding: 6, borderRadius: 3 }}
              >
                <div className="relative h-full w-full overflow-hidden" style={{ borderRadius: 1 }}>
                  {detail}
                </div>
              </div>
            </Suspense>
          </div>

          {/* Game cards section */}
          <ProviderSection games={games} />

        </div>
      </div>
    </AppLayout>
  )
}
