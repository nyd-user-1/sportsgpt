import { sql } from '@/lib/db'
import { ChartsGrid } from './ChartsGrid'

export const dynamic = 'force-dynamic'

export default async function ChartsPage() {
  const [
    teamWins, dynasty, pointDiff, homeAway, pfLeader, winLossDivision, sosLeader,
    passYds, passTDs, rushYds, rushTDs, recvYds, recvTDs,
    totalTDs, totalYds, totalPts,
    scoringOff, scoringDef, topGame, blowout,
    sgRush, sgPass,
  ] = await Promise.all([

    // season-records: most all-time wins (sum across seasons)
    sql`SELECT t.school_slug FROM team_season_stats s JOIN teams t ON t.slug = s.team_slug
        WHERE t.level = 'Varsity' GROUP BY t.school_slug
        ORDER BY SUM(s.overall_wins) DESC LIMIT 1`,

    // wins-by-school (dynasty): best 3yr total from most recent window
    sql`SELECT t.school_slug FROM team_season_stats s JOIN teams t ON t.slug = s.team_slug
        WHERE s.season IN (2023,2024,2025) AND t.level = 'Varsity'
        GROUP BY t.school_slug ORDER BY SUM(s.overall_wins) DESC LIMIT 1`,

    // point-differential-leaders: best all-time PF-PA
    sql`SELECT t.school_slug FROM team_season_stats s JOIN teams t ON t.slug = s.team_slug
        WHERE t.level = 'Varsity'
        GROUP BY t.school_slug
        ORDER BY SUM(COALESCE(s.points_for,0) - COALESCE(s.points_against,0)) DESC LIMIT 1`,

    // home-away-record: most home wins all-time
    sql`SELECT t.school_slug FROM games g JOIN teams t ON t.slug = g.home_team_slug
        WHERE g.home_score > g.away_score GROUP BY t.school_slug
        ORDER BY COUNT(*) DESC LIMIT 1`,

    // pf-pa: highest total PF
    sql`SELECT t.school_slug FROM team_season_stats s JOIN teams t ON t.slug = s.team_slug
        WHERE t.level = 'Varsity'
        GROUP BY t.school_slug ORDER BY SUM(COALESCE(s.points_for,0)) DESC LIMIT 1`,

    // win-loss-division: best all-time win pct
    sql`SELECT t.school_slug FROM team_season_stats s JOIN teams t ON t.slug = s.team_slug
        WHERE t.level = 'Varsity' AND (s.overall_wins + s.overall_losses) > 0
        GROUP BY t.school_slug
        ORDER BY SUM(s.overall_wins)::float / NULLIF(SUM(s.overall_wins + s.overall_losses),0) DESC LIMIT 1`,

    // strength-of-schedule: highest avg opp win pct
    sql`SELECT t.school_slug
        FROM games g
        JOIN teams t ON t.slug = g.home_team_slug
        JOIN team_season_stats opp ON opp.team_slug = g.away_team_slug AND opp.season = g.season
        WHERE (opp.overall_wins + opp.overall_losses) > 0
        GROUP BY t.school_slug
        ORDER BY AVG(opp.overall_wins::float / NULLIF(opp.overall_wins + opp.overall_losses,0)) DESC LIMIT 1`,

    // player charts — top school_slug per stat
    sql`SELECT school_slug FROM player_season_stats WHERE stat_type='Passing' AND pass_yards IS NOT NULL ORDER BY pass_yards DESC LIMIT 1`,
    sql`SELECT school_slug FROM player_season_stats WHERE stat_type='Passing' AND pass_tds   IS NOT NULL ORDER BY pass_tds   DESC LIMIT 1`,
    sql`SELECT school_slug FROM player_season_stats WHERE stat_type='Rushing' AND rush_yards IS NOT NULL ORDER BY rush_yards DESC LIMIT 1`,
    sql`SELECT school_slug FROM player_season_stats WHERE stat_type='Rushing' AND rush_tds   IS NOT NULL ORDER BY rush_tds   DESC LIMIT 1`,
    sql`SELECT school_slug FROM player_season_stats WHERE stat_type='Receiving' AND recv_yards IS NOT NULL ORDER BY recv_yards DESC LIMIT 1`,
    sql`SELECT school_slug FROM player_season_stats WHERE stat_type='Receiving' AND recv_tds   IS NOT NULL ORDER BY recv_tds   DESC LIMIT 1`,

    // total TDs: rush_tds + recv_tds
    sql`SELECT school_slug FROM (
          SELECT COALESCE(r.school_slug, v.school_slug) AS school_slug,
            COALESCE(r.rush_tds,0) + COALESCE(v.recv_tds,0) AS total
          FROM (SELECT player_slug,school_slug,rush_tds FROM player_season_stats WHERE stat_type='Rushing') r
          FULL OUTER JOIN (SELECT player_slug,school_slug,recv_tds FROM player_season_stats WHERE stat_type='Receiving') v
            ON v.player_slug = r.player_slug
        ) x ORDER BY total DESC LIMIT 1`,

    // total yards: pass + rush + recv
    sql`SELECT school_slug FROM player_season_stats WHERE stat_type='Total Yards' AND total_yards IS NOT NULL ORDER BY total_yards DESC LIMIT 1`,

    // total points (scoring)
    sql`SELECT school_slug FROM player_season_stats WHERE stat_type='Scoring' AND points IS NOT NULL ORDER BY points DESC LIMIT 1`,

    // scoring-offense: team with highest avg PF
    sql`SELECT t.school_slug FROM team_season_stats s JOIN teams t ON t.slug = s.team_slug
        WHERE t.level='Varsity' AND s.points_for IS NOT NULL
        GROUP BY t.school_slug ORDER BY AVG(s.points_for) DESC LIMIT 1`,

    // scoring-defense: team with lowest avg PA
    sql`SELECT t.school_slug FROM team_season_stats s JOIN teams t ON t.slug = s.team_slug
        WHERE t.level='Varsity' AND s.points_against IS NOT NULL AND (s.overall_wins+s.overall_losses) >= 8
        GROUP BY t.school_slug ORDER BY AVG(s.points_against) ASC LIMIT 1`,

    // top-scoring-games: school of the highest combined score game
    sql`SELECT t.school_slug FROM games g JOIN teams t ON t.slug = g.home_team_slug
        WHERE g.home_score IS NOT NULL AND g.away_score IS NOT NULL
        ORDER BY (g.home_score + g.away_score) DESC LIMIT 1`,

    // biggest-blowout: school with largest margin
    sql`SELECT t.school_slug FROM games g JOIN teams t ON t.slug = g.home_team_slug
        WHERE g.home_score IS NOT NULL AND g.away_score IS NOT NULL AND g.home_score > g.away_score
        ORDER BY (g.home_score - g.away_score) DESC LIMIT 1`,

    // single-game-rushing: top rush yards in one game (from player_game_stats)
    sql`SELECT school_slug FROM player_game_stats WHERE rush_yds IS NOT NULL ORDER BY rush_yds DESC LIMIT 1`,

    // single-game-passing: top pass yards in one game
    sql`SELECT school_slug FROM player_game_stats WHERE pass_yds IS NOT NULL ORDER BY pass_yds DESC LIMIT 1`,
  ])

  const pick = (rows: { school_slug: string }[]) => rows[0]?.school_slug ?? 'floyd'

  const chartSchools: Record<string, string> = {
    'season-records':             pick(teamWins as never),
    'wins-by-school':             pick(dynasty as never),
    'point-differential-leaders': pick(pointDiff as never),
    'home-away-record':           pick(homeAway as never),
    'pf-pa':                      pick(pfLeader as never),
    'win-loss-division':          pick(winLossDivision as never),
    'strength-of-schedule':       pick(sosLeader as never),
    'passing-yards-leaders':      pick(passYds as never),
    'passing-tds-leaders':        pick(passTDs as never),
    'rushing-yards-leaders':      pick(rushYds as never),
    'rushing-tds-leaders':        pick(rushTDs as never),
    'receiving-yards-leaders':    pick(recvYds as never),
    'receiving-tds-leaders':      pick(recvTDs as never),
    'total-tds-leaders':          pick(totalTDs as never),
    'total-yards-leaders':        pick(totalYds as never),
    'total-points-leaders':       pick(totalPts as never),
    'scoring-offense':            pick(scoringOff as never),
    'scoring-defense':            pick(scoringDef as never),
    'top-scoring-games':          pick(topGame as never),
    'biggest-blowouts':           pick(blowout as never),
    'single-game-rushing':        pick(sgRush as never),
    'single-game-passing':        pick(sgPass as never),
  }

  return <ChartsGrid chartSchools={chartSchools} />
}
