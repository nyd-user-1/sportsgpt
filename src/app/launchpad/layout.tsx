import { Suspense } from 'react'
import { AppLayout } from '@/components/AppLayout'
import { ProviderSection, type GameRow } from './ProviderSection'
import { LaunchpadTabs } from './LaunchpadTabs'
import { LaunchpadGameWrapper } from './LaunchpadGameWrapper'
import { sql } from '@/lib/db'
import { CURRENT_SEASON } from '@/lib/season'

export default async function LaunchpadLayout({
  children,
  detail,
  game,
}: {
  children: React.ReactNode
  detail: React.ReactNode
  game: React.ReactNode
}) {
  const rows = await sql`
    SELECT
      g.id, g.game_date, g.season,
      g.home_team_slug, g.away_team_slug,
      g.home_score, g.away_score, g.game_number,
      ht.name  AS home_name,  ht.division  AS home_div,
      at2.name AS away_name, at2.division AS away_div
    FROM games g
    JOIN teams ht  ON ht.slug  = g.home_team_slug
    JOIN teams at2 ON at2.slug = g.away_team_slug
    WHERE g.season = ANY(${[CURRENT_SEASON, CURRENT_SEASON - 1, CURRENT_SEASON - 2, CURRENT_SEASON - 3, CURRENT_SEASON - 4]})
    ORDER BY g.season DESC, g.game_date ASC NULLS LAST
  `

  const games: GameRow[] = rows.map(r => ({
    id:             Number(r.id),
    game_date:      r.game_date ? new Date(r.game_date as unknown as string).toISOString().slice(0, 10) : null,
    season:         Number(r.season),
    home_team_slug: r.home_team_slug as string,
    away_team_slug: r.away_team_slug as string,
    home_score:     r.home_score != null ? Number(r.home_score) : null,
    away_score:     r.away_score != null ? Number(r.away_score) : null,
    game_number:    r.game_number != null ? Number(r.game_number) : null,
    home_name:      (r.home_name as string).replace(/\s+Varsity\s+Football$/i, ''),
    away_name:      (r.away_name as string).replace(/\s+Varsity\s+Football$/i, ''),
    home_div:       r.home_div as string,
    away_div:       r.away_div as string,
  }))

  return (
    <AppLayout showNavArrows>
      <LaunchpadGameWrapper game={game} />
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="pt-1 px-4 pb-4 flex flex-col gap-5">

          {/* Division tabs — full width above both slots */}
          <Suspense fallback={<div className="h-9 border-b border-[var(--border)]" />}>
            <LaunchpadTabs />
          </Suspense>

          {/* Two-slot row */}
          <div className="h-[380px] shrink-0 flex gap-4">
            <Suspense fallback={null}>
              {children}
            </Suspense>
            <Suspense fallback={null}>
              <div className="flex-1 min-w-0 rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-all duration-200 hover:ring-1 hover:ring-white/30 hover:shadow-[0_0_24px_rgba(255,255,255,0.1)]">
                {detail}
              </div>
            </Suspense>
          </div>

          {/* Game cards section */}
          <ProviderSection games={games} />

        </div>
      </div>
    </AppLayout>
  )
}
