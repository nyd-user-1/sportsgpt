import { AppLayout } from '@/components/AppLayout'
import { ChartsPanelWrapper } from './ChartsPanelWrapper'
import { ChartsPlayerWrapper } from './ChartsPlayerWrapper'
import { ChartsTeamWrapper } from './ChartsTeamWrapper'

export default function ChartsAlmanacLayout({
  children,
  panel,
  player,
  team,
}: {
  children: React.ReactNode
  panel: React.ReactNode
  player: React.ReactNode
  team: React.ReactNode
}) {
  return (
    <AppLayout paperMode showNavArrows>
      {children}
      <ChartsPanelWrapper panel={panel} />
      <ChartsPlayerWrapper player={player} />
      <ChartsTeamWrapper team={team} />
    </AppLayout>
  )
}
