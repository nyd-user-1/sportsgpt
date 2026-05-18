import { AppLayout } from '@/components/AppLayout'
import { MapsPanelWrapper } from './MapsPanelWrapper'

export default function MapsLayout({
  children,
  panel,
}: {
  children: React.ReactNode
  panel: React.ReactNode
}) {
  return (
    <AppLayout>
      {children}
      <MapsPanelWrapper panel={panel} />
    </AppLayout>
  )
}
