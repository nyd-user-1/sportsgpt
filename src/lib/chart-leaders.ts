import { sql } from '@/lib/db'

/**
 * Fetch the top-3 school slugs for each chart's leaderboard. Used by both
 * `/charts` and `/charts-2` to populate card photos.
 */
export async function fetchChartLeaders(): Promise<Record<string, string[]>> {
  const [
    teamWins, dynasty, pointDiff, homeAway, pfLeader, winLossDivision, sosLeader,
    passYds, passTDs, rushYds, rushTDs, recvYds, recvTDs,
    totalTDs, totalYds, totalPts,
    scoringOff, scoringDef, topGame, blowout,
    sgRush, sgPass,
    winStreaks, loseStreaks, ptsByQuarter, rushYdsTeam, passYdsTeam, turnovers,
    winPct,
  ] = await Promise.all([
    sql`SELECT t.school_slug FROM team_season_stats s JOIN teams t ON t.slug = s.team_slug
        WHERE t.level = 'Varsity' GROUP BY t.school_slug
        ORDER BY SUM(s.overall_wins) DESC LIMIT 3`,
    sql`SELECT t.school_slug FROM team_season_stats s JOIN teams t ON t.slug = s.team_slug
        WHERE s.season IN (2023,2024,2025) AND t.level = 'Varsity'
        GROUP BY t.school_slug ORDER BY SUM(s.overall_wins) DESC LIMIT 3`,
    sql`SELECT t.school_slug FROM team_season_stats s JOIN teams t ON t.slug = s.team_slug
        WHERE t.level = 'Varsity'
        GROUP BY t.school_slug
        ORDER BY SUM(COALESCE(s.points_for,0) - COALESCE(s.points_against,0)) DESC LIMIT 3`,
    sql`SELECT t.school_slug FROM games g JOIN teams t ON t.slug = g.home_team_slug
        WHERE g.home_score > g.away_score GROUP BY t.school_slug
        ORDER BY COUNT(*) DESC LIMIT 3`,
    sql`SELECT t.school_slug FROM team_season_stats s JOIN teams t ON t.slug = s.team_slug
        WHERE t.level = 'Varsity'
        GROUP BY t.school_slug ORDER BY SUM(COALESCE(s.points_for,0)) DESC LIMIT 3`,
    sql`SELECT t.school_slug FROM team_season_stats s JOIN teams t ON t.slug = s.team_slug
        WHERE t.level = 'Varsity' AND (s.overall_wins + s.overall_losses) > 0
        GROUP BY t.school_slug
        ORDER BY SUM(s.overall_wins)::float / NULLIF(SUM(s.overall_wins + s.overall_losses),0) DESC LIMIT 3`,
    sql`SELECT t.school_slug
        FROM games g
        JOIN teams t ON t.slug = g.home_team_slug
        JOIN team_season_stats opp ON opp.team_slug = g.away_team_slug AND opp.season = g.season
        WHERE (opp.overall_wins + opp.overall_losses) > 0
        GROUP BY t.school_slug
        ORDER BY AVG(opp.overall_wins::float / NULLIF(opp.overall_wins + opp.overall_losses,0)) DESC LIMIT 3`,
    sql`SELECT school_slug FROM player_season_stats WHERE stat_type='Passing' AND pass_yards IS NOT NULL ORDER BY pass_yards DESC LIMIT 3`,
    sql`SELECT school_slug FROM player_season_stats WHERE stat_type='Passing' AND pass_tds   IS NOT NULL ORDER BY pass_tds   DESC LIMIT 3`,
    sql`SELECT school_slug FROM player_season_stats WHERE stat_type='Rushing' AND rush_yards IS NOT NULL ORDER BY rush_yards DESC LIMIT 3`,
    sql`SELECT school_slug FROM player_season_stats WHERE stat_type='Rushing' AND rush_tds   IS NOT NULL ORDER BY rush_tds   DESC LIMIT 3`,
    sql`SELECT school_slug FROM player_season_stats WHERE stat_type='Receiving' AND recv_yards IS NOT NULL ORDER BY recv_yards DESC LIMIT 3`,
    sql`SELECT school_slug FROM player_season_stats WHERE stat_type='Receiving' AND recv_tds   IS NOT NULL ORDER BY recv_tds   DESC LIMIT 3`,
    sql`SELECT school_slug FROM (
          SELECT COALESCE(r.school_slug, v.school_slug) AS school_slug,
            COALESCE(r.rush_tds,0) + COALESCE(v.recv_tds,0) AS total
          FROM (SELECT player_slug,school_slug,rush_tds FROM player_season_stats WHERE stat_type='Rushing') r
          FULL OUTER JOIN (SELECT player_slug,school_slug,recv_tds FROM player_season_stats WHERE stat_type='Receiving') v
            ON v.player_slug = r.player_slug
        ) x ORDER BY total DESC LIMIT 3`,
    sql`SELECT school_slug FROM player_season_stats WHERE stat_type='Total Yards' AND total_yards IS NOT NULL ORDER BY total_yards DESC LIMIT 3`,
    sql`SELECT school_slug FROM player_season_stats WHERE stat_type='Scoring' AND points IS NOT NULL ORDER BY points DESC LIMIT 3`,
    sql`SELECT t.school_slug FROM team_season_stats s JOIN teams t ON t.slug = s.team_slug
        WHERE t.level='Varsity' AND s.points_for IS NOT NULL
        GROUP BY t.school_slug ORDER BY AVG(s.points_for) DESC LIMIT 3`,
    sql`SELECT t.school_slug FROM team_season_stats s JOIN teams t ON t.slug = s.team_slug
        WHERE t.level='Varsity' AND s.points_against IS NOT NULL AND (s.overall_wins+s.overall_losses) >= 8
        GROUP BY t.school_slug ORDER BY AVG(s.points_against) ASC LIMIT 3`,
    sql`SELECT t.school_slug FROM games g JOIN teams t ON t.slug = g.home_team_slug
        WHERE g.home_score IS NOT NULL AND g.away_score IS NOT NULL
        ORDER BY (g.home_score + g.away_score) DESC LIMIT 3`,
    sql`SELECT t.school_slug FROM games g JOIN teams t ON t.slug = g.home_team_slug
        WHERE g.home_score IS NOT NULL AND g.away_score IS NOT NULL AND g.home_score > g.away_score
        ORDER BY (g.home_score - g.away_score) DESC LIMIT 3`,
    sql`SELECT school_slug FROM player_game_stats WHERE rush_yds IS NOT NULL ORDER BY rush_yds DESC LIMIT 3`,
    sql`SELECT school_slug FROM player_game_stats WHERE pass_yds IS NOT NULL ORDER BY pass_yds DESC LIMIT 3`,
    sql`WITH team_games AS (
      SELECT home_team_slug AS team_slug, game_date,
        CASE WHEN home_score > away_score THEN 1 ELSE 0 END AS win
      FROM games WHERE home_score IS NOT NULL AND away_score IS NOT NULL
      UNION ALL
      SELECT away_team_slug, game_date,
        CASE WHEN away_score > home_score THEN 1 ELSE 0 END AS win
      FROM games WHERE home_score IS NOT NULL AND away_score IS NOT NULL
    ),
    numbered AS (
      SELECT team_slug, game_date, win,
        ROW_NUMBER() OVER (PARTITION BY team_slug ORDER BY game_date) -
        ROW_NUMBER() OVER (PARTITION BY team_slug, win ORDER BY game_date) AS grp
      FROM team_games
    ),
    streaks AS (SELECT team_slug, win, COUNT(*) AS streak_len FROM numbered GROUP BY team_slug, win, grp),
    best AS (SELECT team_slug, MAX(streak_len) AS value FROM streaks WHERE win = 1 GROUP BY team_slug)
    SELECT t.school_slug FROM best b JOIN teams t ON t.slug = b.team_slug WHERE t.level = 'Varsity' ORDER BY b.value DESC LIMIT 3`,
    sql`WITH team_games AS (
      SELECT home_team_slug AS team_slug, game_date,
        CASE WHEN home_score > away_score THEN 1 ELSE 0 END AS win
      FROM games WHERE home_score IS NOT NULL AND away_score IS NOT NULL
      UNION ALL
      SELECT away_team_slug, game_date,
        CASE WHEN away_score > home_score THEN 1 ELSE 0 END AS win
      FROM games WHERE home_score IS NOT NULL AND away_score IS NOT NULL
    ),
    numbered AS (
      SELECT team_slug, game_date, win,
        ROW_NUMBER() OVER (PARTITION BY team_slug ORDER BY game_date) -
        ROW_NUMBER() OVER (PARTITION BY team_slug, win ORDER BY game_date) AS grp
      FROM team_games
    ),
    streaks AS (SELECT team_slug, win, COUNT(*) AS streak_len FROM numbered GROUP BY team_slug, win, grp),
    best AS (SELECT team_slug, MAX(streak_len) AS value FROM streaks WHERE win = 0 GROUP BY team_slug)
    SELECT t.school_slug FROM best b JOIN teams t ON t.slug = b.team_slug WHERE t.level = 'Varsity' ORDER BY b.value DESC LIMIT 3`,
    sql`SELECT t.school_slug
    FROM game_box_scores b
    CROSS JOIN LATERAL jsonb_array_elements(b.quarter_scores) AS elem
    JOIN games g ON g.id = b.game_id
    JOIN teams t ON t.slug = (elem->>'team_slug')
    WHERE (elem->>'q4') IS NOT NULL AND t.level = 'Varsity'
    GROUP BY t.school_slug
    ORDER BY SUM((elem->>'q4')::int) DESC LIMIT 3`,
    sql`SELECT ps.school_slug FROM player_season_stats ps
    JOIN teams t ON t.school_slug = ps.school_slug AND t.level = 'Varsity'
    WHERE ps.stat_type = 'Rushing' AND ps.rush_yards IS NOT NULL
    GROUP BY ps.school_slug ORDER BY SUM(ps.rush_yards) DESC LIMIT 3`,
    sql`SELECT ps.school_slug FROM player_season_stats ps
    JOIN teams t ON t.school_slug = ps.school_slug AND t.level = 'Varsity'
    WHERE ps.stat_type = 'Passing' AND ps.pass_yards IS NOT NULL
    GROUP BY ps.school_slug ORDER BY SUM(ps.pass_yards) DESC LIMIT 3`,
    sql`SELECT pgs.school_slug FROM player_game_stats pgs
    JOIN teams t ON t.school_slug = pgs.school_slug AND t.level = 'Varsity'
    GROUP BY pgs.school_slug ORDER BY SUM(COALESCE(pgs.def_int,0)+COALESCE(pgs.def_fumbles,0)) DESC LIMIT 3`,
    sql`SELECT t.school_slug FROM team_season_stats s JOIN teams t ON t.slug = s.team_slug
        WHERE t.level = 'Varsity' GROUP BY t.school_slug
        HAVING SUM(s.overall_wins + s.overall_losses) >= 10
        ORDER BY SUM(s.overall_wins)::float / NULLIF(SUM(s.overall_wins + s.overall_losses), 0) DESC LIMIT 3`,
  ])

  const pick3 = (rows: unknown) =>
    (rows as { school_slug: string }[]).map(r => r.school_slug).filter(Boolean)

  return {
    'season-records':             pick3(teamWins),
    'wins-by-school':             pick3(dynasty),
    'point-differential-leaders': pick3(pointDiff),
    'home-away-record':           pick3(homeAway),
    'pf-pa':                      pick3(pfLeader),
    'win-loss-division':          pick3(winLossDivision),
    'strength-of-schedule':       pick3(sosLeader),
    'passing-yards-leaders':      pick3(passYds),
    'passing-tds-leaders':        pick3(passTDs),
    'rushing-yards-leaders':      pick3(rushYds),
    'rushing-tds-leaders':        pick3(rushTDs),
    'receiving-yards-leaders':    pick3(recvYds),
    'receiving-tds-leaders':      pick3(recvTDs),
    'total-tds-leaders':          pick3(totalTDs),
    'total-yards-leaders':        pick3(totalYds),
    'total-points-leaders':       pick3(totalPts),
    'scoring-offense':            pick3(scoringOff),
    'scoring-defense':            pick3(scoringDef),
    'top-scoring-games':          pick3(topGame),
    'biggest-blowouts':           pick3(blowout),
    'single-game-rushing':        pick3(sgRush),
    'single-game-passing':        pick3(sgPass),
    'win-percentage':             pick3(winPct),
    'winning-streaks':            pick3(winStreaks),
    'losing-streaks':             pick3(loseStreaks),
    'points-by-quarter':          pick3(ptsByQuarter),
    'rushing-yards-team':         pick3(rushYdsTeam),
    'passing-yards-team':         pick3(passYdsTeam),
    'turnovers':                  pick3(turnovers),
  }
}
