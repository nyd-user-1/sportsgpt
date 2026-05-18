import { AppLayout } from '@/components/AppLayout'
import { ChartsPanelWrapper } from './ChartsPanelWrapper'

export default function ChartsLayout({
  children,
  panel,
}: {
  children: React.ReactNode
  panel: React.ReactNode
}) {
  return (
    <AppLayout showNavArrows>
      {children}
      <ChartsPanelWrapper panel={panel} />
    </AppLayout>
  )
}
