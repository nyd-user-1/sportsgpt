'use client'

import { AppPanel } from './AppPanel'

const MAPS = [
  { name: 'NY County Coverage',   desc: 'Provider distribution by county · NYS 2024',    bg: 'linear-gradient(135deg,#bfdbfe,#3b82f6)' },
  { name: 'CCDF Subsidy Map',     desc: 'Subsidy-eligible families by county',             bg: 'linear-gradient(135deg,#bbf7d0,#16a34a)' },
  { name: 'Compliance Overview',  desc: 'Inspection pass rates by region',                 bg: 'linear-gradient(135deg,#fed7aa,#ea580c)' },
  { name: 'Waitlist Heat Map',    desc: 'Average waitlist months by county',               bg: 'linear-gradient(135deg,#fecaca,#dc2626)' },
  { name: 'Cost Distribution',    desc: 'Average weekly cost by region',                   bg: 'linear-gradient(135deg,#e9d5ff,#7c3aed)' },
  { name: 'Quality Ratings Map',  desc: 'QRIS rating distribution across NY State',        bg: 'linear-gradient(135deg,#cffafe,#0e7490)' },
]

function MapPlaceholder({ bg }: { bg: string }) {
  return (
    <div className="w-full rounded-xl overflow-hidden" style={{ height: 140, background: bg }}>
      <div className="w-full h-full opacity-30" style={{
        backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,.3) 0,rgba(255,255,255,.3) 1px,transparent 0,transparent 50%),repeating-linear-gradient(90deg,rgba(255,255,255,.3) 0,rgba(255,255,255,.3) 1px,transparent 0,transparent 50%)',
        backgroundSize: '24px 24px',
      }} />
    </div>
  )
}

export function PanelMap({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AppPanel open={open} onClose={onClose} title="Maps">
      <div className="px-4 py-4 space-y-3">
        {MAPS.map(m => (
          <div
            key={m.name}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--txt)]/20 transition-colors overflow-hidden cursor-pointer"
          >
            <MapPlaceholder bg={m.bg} />
            <div className="px-4 pb-3 pt-2">
              <p className="font-semibold text-sm text-[var(--txt)]">{m.name}</p>
              <p className="text-xs text-[var(--muted)] mt-0.5">{m.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </AppPanel>
  )
}
