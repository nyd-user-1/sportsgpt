import { AppLayout } from '@/components/AppLayout'
import { AlmanacClient } from './AlmanacClient'

export default function GlossaryPage() {
  return (
    <AppLayout>
      <div
        className="flex-1 overflow-y-auto no-scrollbar"
        style={{ backgroundColor: 'var(--paper)' }}
      >
        <AlmanacClient />
      </div>
    </AppLayout>
  )
}
