import { Trophy } from 'lucide-react'

export default function DetailDefault() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2"
      style={{ background: 'linear-gradient(135deg,#f0f4f8 0%,#e8edf4 100%)' }}>
      <Trophy className="h-10 w-10 text-[var(--muted)]" />
      <p className="text-sm font-semibold text-[var(--txt2)]">Section XI Football</p>
      <p className="text-xs text-[var(--muted)]">Select a team to view details</p>
    </div>
  )
}
