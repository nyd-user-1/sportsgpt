import { Trophy } from 'lucide-react'
import { ACCENT_COLOR } from '@/lib/app-config'

export function AppLogo({ className }: { className?: string }) {
  return (
    <Trophy
      className={className}
      style={{ stroke: ACCENT_COLOR, fill: `${ACCENT_COLOR}26` }}
    />
  )
}
