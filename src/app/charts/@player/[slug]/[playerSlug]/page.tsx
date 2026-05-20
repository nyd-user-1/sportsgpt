import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { sql } from '@/lib/db'
import { PlayerPanelContent, type PlayerPasser, type PlayerRusher, type PlayerReceiver, type AnyPlayerRow } from '@/components/PanelPlayer'

export const dynamic = 'force-dynamic'

export default async function ChartPlayerPanel({
  params,
}: {
  params: Promise<{ slug: string; playerSlug: string }>
}) {
  const { playerSlug } = await params

  const rows = await sql`
    SELECT ps.*, s.name AS school_name
    FROM player_season_stats ps
    LEFT JOIN schools s ON s.slug = ps.school_slug
    WHERE ps.player_slug = ${playerSlug}
    ORDER BY ps.season DESC, ps.pass_yards DESC NULLS LAST, ps.rush_yards DESC NULLS LAST
    LIMIT 1
  `

  const r = rows[0]
  if (!r) notFound()

  const statType = r.stat_type as string
  const statTab  = statType === 'Rushing' ? 'Rushing' : statType === 'Receiving' ? 'Receiving' : 'Passing'

  const base: { player_slug: string; player_name: string; school_slug: string; school_name: string; season: number } = {
    player_slug:  r.player_slug as string,
    player_name:  r.player_name as string,
    school_slug:  r.school_slug as string,
    school_name:  r.school_name as string,
    season:       Number(r.season),
  }

  let player: AnyPlayerRow
  if (statTab === 'Passing') {
    player = { ...base,
      completions: r.completions != null ? Number(r.completions) : null,
      attempts: r.attempts != null ? Number(r.attempts) : null,
      pass_yards: r.pass_yards != null ? Number(r.pass_yards) : null,
      pass_tds: r.pass_tds != null ? Number(r.pass_tds) : null,
      interceptions: r.interceptions != null ? Number(r.interceptions) : null,
      comp_pct: (r.completions && r.attempts) ? (Number(r.completions) / Number(r.attempts)) * 100 : null,
      ypa: (r.pass_yards && r.attempts) ? Number(r.pass_yards) / Number(r.attempts) : null,
      ypc: (r.pass_yards && r.completions) ? Number(r.pass_yards) / Number(r.completions) : null,
      td_rate: (r.pass_tds && r.attempts) ? (Number(r.pass_tds) / Number(r.attempts)) * 100 : null,
      int_rate: (r.interceptions && r.attempts) ? (Number(r.interceptions) / Number(r.attempts)) * 100 : null,
      td_int_ratio: (r.pass_tds && r.interceptions && Number(r.interceptions) > 0)
        ? Number(r.pass_tds) / Number(r.interceptions) : null,
      yva: r.yva != null ? Number(r.yva) : null,
      cmd_score: r.cmd_score != null ? Number(r.cmd_score) : null,
      gbi_score: r.gbi_score != null ? Number(r.gbi_score) : null,
      ies_score: r.ies_score != null ? Number(r.ies_score) : null,
    } as PlayerPasser
  } else if (statTab === 'Rushing') {
    player = { ...base,
      rush_attempts: r.rush_attempts != null ? Number(r.rush_attempts) : null,
      rush_yards: r.rush_yards != null ? Number(r.rush_yards) : null,
      rush_tds: r.rush_tds != null ? Number(r.rush_tds) : null,
      games_played: r.games_played != null ? Number(r.games_played) : null,
      yards_per_game: r.yards_per_game != null ? Number(r.yards_per_game) : null,
    } as PlayerRusher
  } else {
    player = { ...base,
      receptions: r.receptions != null ? Number(r.receptions) : null,
      recv_yards: r.recv_yards != null ? Number(r.recv_yards) : null,
      recv_tds: r.recv_tds != null ? Number(r.recv_tds) : null,
    } as PlayerReceiver
  }

  return (
    <>
      <PlayerPanelContent player={player} statTab={statTab} />
      <div className="shrink-0 border-t border-[var(--border)] px-4 py-3">
        <Link
          href={`/player/${playerSlug}`}
          className="flex items-center justify-between text-sm font-semibold hover:underline text-[#033882]"
        >
          <span>View full profile</span>
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </>
  )
}
