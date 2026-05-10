import { AppLayout } from '@/components/AppLayout'
import { ProviderSection } from './ProviderSection'

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

          {/* ── Two-slot top row ── */}
          <div className="h-[380px] shrink-0 flex gap-4">
            {/* Left slot — county table (page.tsx) */}
            {children}
            {/* Right slot — map placeholder or county detail (@detail) */}
            <div className="flex-1 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              {detail}
            </div>
          </div>

          {/* ── Provider section ── */}
          <ProviderSection />

        </div>
      </div>
    </AppLayout>
  )
}
