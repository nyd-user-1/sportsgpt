import { Suspense } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { ProviderSection } from './ProviderSection'
import { LaunchpadTabs } from './LaunchpadTabs'

export default function LaunchpadLayout({
  children,
  detail,
}: {
  children: React.ReactNode
  detail: React.ReactNode
}) {
  return (
    <AppLayout showNavArrows>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-4 flex flex-col gap-5">

          {/* ── Division tabs — full width above both slots ── */}
          <Suspense fallback={<div className="h-9 border-b border-[var(--border)]" />}>
            <LaunchpadTabs />
          </Suspense>

          {/* ── Two-slot row ── */}
          <div className="h-[380px] shrink-0 flex gap-4">
            <Suspense fallback={null}>
              {children}
            </Suspense>
            <div className="flex-1 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              {detail}
            </div>
          </div>

          {/* ── Provider card section ── */}
          <ProviderSection />

        </div>
      </div>
    </AppLayout>
  )
}
