import { Map } from 'lucide-react'

export default function DetailDefault() {
  return (
    <div className="h-full rounded-xl border border-[var(--border)] overflow-hidden flex flex-col items-center justify-center gap-2"
      style={{ background: 'linear-gradient(135deg,#e8f4fb 0%,#d0eaf7 100%)' }}>
      <Map className="h-12 w-12 text-[var(--muted)]" />
      <p className="text-sm font-medium text-[var(--txt2)]">New York State</p>
      <p className="text-xs text-[var(--muted)]">County Map</p>
    </div>
  )
}
