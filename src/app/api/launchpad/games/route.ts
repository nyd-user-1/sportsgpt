import { NextRequest, NextResponse } from 'next/server'
import { fetchLaunchpadGames } from '@/lib/launchpad-games'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const seasonRaw = req.nextUrl.searchParams.get('season')
  const season = Number(seasonRaw)
  if (!seasonRaw || Number.isNaN(season)) {
    return NextResponse.json({ error: 'season query param required' }, { status: 400 })
  }

  const games = await fetchLaunchpadGames([season])
  return NextResponse.json(games)
}
