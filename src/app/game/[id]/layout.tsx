import { GamePlayerPanelWrapper } from './GamePlayerPanelWrapper'

export default function GameLayout({
  children,
  panel,
}: {
  children: React.ReactNode
  panel: React.ReactNode
}) {
  return (
    <>
      {children}
      <GamePlayerPanelWrapper panel={panel} />
    </>
  )
}
