import { notFound } from 'next/navigation'
import { GameDetailSlotContent } from '@/app/launchpad/GameDetailSlotContent'

export const dynamic = 'force-dynamic'

export default async function GameDetailSlot({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { id } = await params
  const sp = await searchParams
  const gameId = Number(id)
  if (!gameId) notFound()

  return <GameDetailSlotContent gameId={gameId} teamParam={sp.team ?? null} />
}
