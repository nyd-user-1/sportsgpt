import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { fetchPassingYardsLeaders, fetchPassingTdsLeaders, fetchSingleGamePassing } from '@/lib/chart-data/passing'
import { fetchRushingYardsLeaders, fetchRushingTdsLeaders, fetchSingleGameRushing } from '@/lib/chart-data/rushing'

const DIV_COLORS: Record<string, string> = {
  I: '#033882', II: '#4338ca', III: '#0ea5e9', IV: '#10b981',
}

type StdRow = { name: string; value: number }

function buildSeasonBars(rows: { name: unknown; value: unknown; season: unknown }[], seasons: string[]) {
  return seasons.map(yr => {
    const bars = rows
      .filter(r => String(r.season) === yr)
      .sort((a, b) => Number(b.value) - Number(a.value))
      .slice(0, 25)
      .map(r => ({ name: String(r.name), value: Number(r.value) }))
    return { season: yr, topValue: bars[0]?.value ?? 0, bars }
  })
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  try {
    switch (slug) {

      case 'win-pct-trend': {
        const rows = await sql`
          SELECT t.division, s.season::text AS season,
            ROUND((AVG(s.overall_wins::float / NULLIF(s.overall_wins + s.overall_losses, 0)) * 100)::numeric, 1) AS pct
          FROM teams t JOIN team_season_stats s ON s.team_slug = t.slug
          WHERE s.season IN (2021,2022,2023,2024) AND s.overall_wins + s.overall_losses > 0
          GROUP BY t.division, s.season ORDER BY s.season, t.division`
        const seasons = ['2021','2022','2023','2024']
        const multiPoints = seasons.map(yr => {
          const pt: Record<string, string | number> = { name: yr }
          for (const r of rows) { if (r.season === yr) pt[r.division as string] = Number(r.pct) }
          return pt
        })
        const tableRows: StdRow[] = rows.map(r => ({ name: `Div ${r.division} · ${r.season}`, value: Number(r.pct) }))
        return NextResponse.json({
          variant: 'line-multi', tableRows, multiPoints, kpiValue: 4,
          series: [
            { key: 'I',   label: 'Division I',   color: DIV_COLORS.I   },
            { key: 'II',  label: 'Division II',  color: DIV_COLORS.II  },
            { key: 'III', label: 'Division III', color: DIV_COLORS.III },
            { key: 'IV',  label: 'Division IV',  color: DIV_COLORS.IV  },
          ],
          valueSuffix: '%',
        })
      }

      case 'win-pct-by-division': {
        const rows = await sql`
          SELECT t.division AS div, SUM(s.overall_wins)::int AS wins
          FROM teams t JOIN team_season_stats s ON s.team_slug = t.slug AND s.season = 2024
          GROUP BY t.division ORDER BY t.division`
        const tableRows: StdRow[] = rows.map(r => ({ name: `Division ${r.div}`, value: Number(r.wins) }))
        const pieItems = rows.map(r => ({ name: `Division ${r.div}`, value: Number(r.wins), fill: DIV_COLORS[r.div as string] ?? '#033882' }))
        const pieConfig = Object.fromEntries(rows.map(r => [`Division ${r.div}`, { label: `Division ${r.div}`, color: DIV_COLORS[r.div as string] ?? '#033882' }]))
        return NextResponse.json({ variant: 'pie', tableRows, kpiValue: 4, pieItems, pieConfig })
      }

      case 'season-records': {
        const rows = await sql`
          SELECT t.name, s.overall_wins AS value, s.season
          FROM teams t JOIN team_season_stats s ON s.team_slug = t.slug
          WHERE s.season IN (2022,2023,2024) ORDER BY s.season, s.overall_wins DESC`
        const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], ['2022','2023','2024'])
        const tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: ['2022','2023','2024'], valueLabel: 'Wins' })
      }

      case 'wins-by-school': {
        const rows = await sql`
          SELECT t.name, SUM(s.overall_wins)::int AS value
          FROM teams t JOIN team_season_stats s ON s.team_slug = t.slug
          WHERE s.season IN (2022,2023,2024) GROUP BY t.name ORDER BY value DESC`
        const tableRows: StdRow[] = rows.map(r => ({ name: r.name as string, value: Number(r.value) }))
        const seasonBars = [{ season: 'All', topValue: tableRows[0]?.value ?? 0, bars: tableRows.slice(0, 25) }]
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, valueLabel: 'Total Wins' })
      }

      case 'schools-by-enrollment': {
        const rows = await sql`SELECT name, enrollment AS value FROM schools WHERE enrollment IS NOT NULL ORDER BY enrollment DESC`
        const tableRows: StdRow[] = rows.map(r => ({ name: r.name as string, value: Number(r.value) }))
        return NextResponse.json({ variant: 'bar', tableRows, kpiValue: tableRows[0]?.value ?? 0, valueLabel: 'Students' })
      }

      case 'passing-yards-leaders': {
        const seasons = [2021,2022,2023,2024,2025]
        const seasonStrs = seasons.map(String)
        const rows = await fetchPassingYardsLeaders(seasons)
        const seasonBars = buildSeasonBars(rows, seasonStrs)
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: seasonStrs, valueLabel: 'Pass Yards' })
      }

      case 'passing-tds-leaders': {
        const seasons = [2021,2022,2023,2024,2025]
        const seasonStrs = seasons.map(String)
        const rows = await fetchPassingTdsLeaders(seasons)
        const seasonBars = buildSeasonBars(rows, seasonStrs)
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: seasonStrs, valueLabel: 'Pass TDs' })
      }

      case 'rushing-yards-leaders': {
        const seasons = [2021,2022,2023,2024,2025]
        const seasonStrs = seasons.map(String)
        const rows = await fetchRushingYardsLeaders(seasons)
        const seasonBars = buildSeasonBars(rows, seasonStrs)
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: seasonStrs, valueLabel: 'Rush Yards' })
      }

      case 'rushing-tds-leaders': {
        const seasons = [2021,2022,2023,2024,2025]
        const seasonStrs = seasons.map(String)
        const rows = await fetchRushingTdsLeaders(seasons)
        const seasonBars = buildSeasonBars(rows, seasonStrs)
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: seasonStrs, valueLabel: 'Rush TDs' })
      }

      case 'receiving-yards-leaders': {
        const rows = await sql`
          SELECT player_name AS name, recv_yards AS value, season
          FROM player_season_stats WHERE stat_type='Receiving' AND recv_yards IS NOT NULL AND season IN (2022,2023,2024)
          ORDER BY season, recv_yards DESC`
        const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], ['2022','2023','2024'])
        const tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: ['2022','2023','2024'], valueLabel: 'Recv Yards' })
      }

      case 'receiving-tds-leaders': {
        const rows = await sql`
          SELECT player_name AS name, recv_tds AS value, season
          FROM player_season_stats WHERE stat_type='Receiving' AND recv_tds IS NOT NULL AND season IN (2022,2023,2024)
          ORDER BY season, recv_tds DESC`
        const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], ['2022','2023','2024'])
        const tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: ['2022','2023','2024'], valueLabel: 'Recv TDs' })
      }

      case 'total-tds-leaders': {
        const rows = await sql`
          SELECT player_name AS name, COALESCE(rush_tds,0) AS rush, COALESCE(recv_tds,0) AS recv, COALESCE(total_tds,0) AS total
          FROM player_season_stats WHERE stat_type='Touchdowns' AND season=2023
          ORDER BY total_tds DESC NULLS LAST LIMIT 20`
        const tableRows: StdRow[] = rows.map(r => ({ name: r.name as string, value: Number(r.total) }))
        const multiSeriesData = rows.map(r => ({ name: r.name as string, rush: Number(r.rush), recv: Number(r.recv) }))
        return NextResponse.json({
          variant: 'bar-multi', tableRows, kpiValue: tableRows[0]?.value ?? 0, multiSeriesData,
          series: [{ key: 'rush', label: 'Rush TDs', color: '#033882' }, { key: 'recv', label: 'Recv TDs', color: '#4338ca' }],
        })
      }

      case 'total-yards-leaders': {
        const rows = await sql`
          SELECT player_name AS name, COALESCE(pass_yards,0) AS pass, COALESCE(rush_yards,0) AS rush, COALESCE(recv_yards,0) AS recv, COALESCE(total_yards,0) AS total
          FROM player_season_stats WHERE stat_type='Total Yards' AND season=2023
          ORDER BY total_yards DESC NULLS LAST LIMIT 15`
        const tableRows: StdRow[] = rows.map(r => ({ name: r.name as string, value: Number(r.total) }))
        const multiSeriesData = rows.map(r => ({ name: r.name as string, pass: Number(r.pass), rush: Number(r.rush), recv: Number(r.recv) }))
        return NextResponse.json({
          variant: 'bar-multi', tableRows, kpiValue: tableRows[0]?.value ?? 0, multiSeriesData, stacked: true,
          series: [{ key: 'pass', label: 'Pass Yds', color: '#033882' }, { key: 'rush', label: 'Rush Yds', color: '#4338ca' }, { key: 'recv', label: 'Recv Yds', color: '#0ea5e9' }],
        })
      }

      case 'total-points-leaders': {
        const rows = await sql`
          SELECT player_name AS name, points AS value, season
          FROM player_season_stats WHERE stat_type='Scoring' AND season=2023 AND points IS NOT NULL
          ORDER BY points DESC LIMIT 20`
        const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], ['2023'])
        const tableRows = seasonBars[0]?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, valueLabel: 'Points' })
      }

      case 'home-away-record': {
        const rows = await sql`
          WITH records AS (
            SELECT t.name,
              COUNT(*) FILTER (WHERE g.home_team_slug = t.slug AND g.home_score > g.away_score)::int AS home_wins,
              COUNT(*) FILTER (WHERE g.away_team_slug = t.slug AND g.away_score > g.home_score)::int AS away_wins,
              g.season::text AS season
            FROM teams t
            JOIN games g ON (g.home_team_slug = t.slug OR g.away_team_slug = t.slug)
            WHERE g.home_score IS NOT NULL AND g.season IN (2023,2024,2025) AND t.level = 'Varsity'
            GROUP BY t.name, g.season
          )
          SELECT * FROM records WHERE home_wins + away_wins > 0
          ORDER BY season, home_wins + away_wins DESC`
        const bySeasonMap: Record<string, typeof rows> = {}
        for (const r of rows) { const s = r.season as string; if (!bySeasonMap[s]) bySeasonMap[s] = []; bySeasonMap[s].push(r) }
        const current = (bySeasonMap['2025'] ?? []).map(r => ({ name: r.name as string, value: Number(r.home_wins) }))
        const multiSeriesData = (bySeasonMap['2025'] ?? []).map(r => ({ name: r.name as string, home: Number(r.home_wins), away: Number(r.away_wins) }))
        return NextResponse.json({
          variant: 'bar-multi', tableRows: current, kpiValue: current[0]?.value ?? 0, multiSeriesData,
          series: [{ key: 'home', label: 'Home Wins', color: '#033882' }, { key: 'away', label: 'Away Wins', color: '#94a3b8' }],
        })
      }

      case 'pf-pa': {
        const rows = await sql`
          WITH scored AS (
            SELECT home_team_slug AS ts, home_score AS pf, away_score AS pa, season FROM games WHERE home_score IS NOT NULL AND season IN (2023,2024,2025)
            UNION ALL SELECT away_team_slug, away_score, home_score, season FROM games WHERE home_score IS NOT NULL AND season IN (2023,2024,2025)
          )
          SELECT t.name, s.season::text AS season, SUM(pf)::int AS pf, SUM(pa)::int AS pa, ts2.overall_wins::int AS wins
          FROM scored s JOIN teams t ON t.slug = s.ts
          JOIN team_season_stats ts2 ON ts2.team_slug = t.slug AND ts2.season = s.season
          WHERE t.level = 'Varsity'
          GROUP BY t.name, s.season, ts2.overall_wins
          ORDER BY s.season, pf DESC`
        const current = rows.filter(r => r.season === '2025').map(r => ({ name: r.name as string, value: Number(r.pf) }))
        const pfpaSeasons = ['2023','2024','2025'].map(yr => ({
          season: yr,
          points: rows.filter(r => r.season === yr).map(r => ({ name: r.name as string, pf: Number(r.pf), pa: Number(r.pa), wins: Number(r.wins) })),
        }))
        return NextResponse.json({ variant: 'pfpa', tableRows: current, kpiValue: current[0]?.value ?? 0, pfpaSeasons })
      }

      case 'win-loss-division': {
        const rows = await sql`
          SELECT t.name, t.division, ts.overall_wins::int AS wins, ts.overall_losses::int AS losses, ts.season::text AS season
          FROM team_season_stats ts JOIN teams t ON t.slug = ts.team_slug
          WHERE ts.season IN (2023,2024,2025) AND t.level = 'Varsity'
          ORDER BY ts.season, t.division, ts.overall_wins DESC`
        const current = rows.filter(r => r.season === '2025').map(r => ({ name: r.name as string, value: Number(r.wins) }))
        const winLossSeasons = ['2023','2024','2025'].map(yr => ({
          season: yr,
          teams: rows.filter(r => r.season === yr).map(r => ({
            name: r.name as string, division: r.division as string,
            wins: Number(r.wins), losses: Number(r.losses),
          })),
        }))
        return NextResponse.json({ variant: 'win-loss-h', tableRows: current, kpiValue: current.length, winLossSeasons })
      }

      case 'strength-of-schedule': {
        const rows = await sql`
          WITH pairs AS (
            SELECT home_team_slug AS team_slug, away_team_slug AS opp_slug, season FROM games WHERE home_score IS NOT NULL AND season IN (2023,2024,2025)
            UNION ALL SELECT away_team_slug, home_team_slug, season FROM games WHERE home_score IS NOT NULL AND season IN (2023,2024,2025)
          )
          SELECT t.name, gp.season::text AS season,
            ROUND(AVG(ts.overall_wins::float / NULLIF(ts.overall_wins + ts.overall_losses,0))*100)::int AS value
          FROM pairs gp JOIN teams t ON t.slug = gp.team_slug
          JOIN teams opp ON opp.slug = gp.opp_slug
          JOIN team_season_stats ts ON ts.team_slug = gp.opp_slug AND ts.season = gp.season
          WHERE t.level = 'Varsity'
          GROUP BY t.name, gp.season ORDER BY gp.season, value DESC`
        const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], ['2023','2024','2025'])
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: ['2023','2024','2025'], valueLabel: 'SoS %' })
      }

      case 'point-differential-leaders': {
        const rows = await sql`
          WITH gm AS (
            SELECT home_team_slug AS team_slug, home_score - away_score AS diff, season
            FROM games WHERE home_score IS NOT NULL AND season IN (2023,2024,2025)
            UNION ALL
            SELECT away_team_slug, away_score - home_score, season
            FROM games WHERE home_score IS NOT NULL AND season IN (2023,2024,2025)
          )
          SELECT t.name, SUM(gm.diff)::int AS value, gm.season::text AS season
          FROM gm JOIN teams t ON t.slug = gm.team_slug
          GROUP BY t.name, gm.season ORDER BY gm.season, value DESC`
        const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], ['2023','2024','2025'])
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: ['2023','2024','2025'], valueLabel: 'Differential' })
      }

      case 'scoring-offense': {
        const rows = await sql`
          WITH tg AS (
            SELECT home_team_slug AS team_slug, home_score AS score, season FROM games WHERE home_score IS NOT NULL AND season IN (2021,2022,2023,2024,2025)
            UNION ALL SELECT away_team_slug, away_score, season FROM games WHERE away_score IS NOT NULL AND season IN (2021,2022,2023,2024,2025)
          )
          SELECT t.name, ROUND(AVG(tg.score)::numeric,1) AS value, tg.season::text AS season
          FROM tg JOIN teams t ON t.slug = tg.team_slug WHERE t.level = 'Varsity'
          GROUP BY t.name, tg.season ORDER BY tg.season, value DESC`
        const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], ['2021','2022','2023','2024','2025'])
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: ['2021','2022','2023','2024','2025'], valueLabel: 'Avg Pts/Game' })
      }

      case 'scoring-defense': {
        const rows = await sql`
          WITH tg AS (
            SELECT home_team_slug AS team_slug, away_score AS allowed, season FROM games WHERE home_score IS NOT NULL AND season IN (2021,2022,2023,2024,2025)
            UNION ALL SELECT away_team_slug, home_score AS allowed, season FROM games WHERE home_score IS NOT NULL AND season IN (2021,2022,2023,2024,2025)
          )
          SELECT t.name, ROUND(AVG(tg.allowed)::numeric,1) AS value, tg.season::text AS season
          FROM tg JOIN teams t ON t.slug = tg.team_slug WHERE t.level = 'Varsity'
          GROUP BY t.name, tg.season ORDER BY tg.season, value ASC`
        const seasons = ['2021','2022','2023','2024','2025']
        const seasonBars = seasons.map(yr => {
          const bars = rows
            .filter(r => String(r.season) === yr)
            .sort((a, b) => Number(a.value) - Number(b.value))
            .slice(0, 25)
            .map(r => ({ name: String(r.name), value: Number(r.value) }))
          return { season: yr, topValue: bars[0]?.value ?? 0, bars }
        })
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: seasons, valueLabel: 'Avg Pts Allowed' })
      }

      case 'top-scoring-games': {
        const rows = await sql`
          SELECT g.id, ht.name AS home, at2.name AS away,
            g.home_score, g.away_score, (g.home_score + g.away_score) AS total,
            g.season::text AS season
          FROM games g
          JOIN game_box_scores bs ON bs.game_id = g.id
          JOIN teams ht ON ht.slug = g.home_team_slug
          JOIN teams at2 ON at2.slug = g.away_team_slug
          WHERE g.home_score IS NOT NULL AND g.season IN (2023,2024,2025)
          ORDER BY g.season, total DESC`
        const seasons = ['2023','2024','2025']
        const seasonBars = seasons.map(yr => {
          const bars = rows
            .filter(r => String(r.season) === yr)
            .slice(0, 25)
            .map(r => ({ name: `${r.home} vs ${r.away}`, value: Number(r.total) }))
          return { season: yr, topValue: bars[0]?.value ?? 0, bars }
        })
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: seasons, valueLabel: 'Combined Pts' })
      }

      case 'biggest-blowouts': {
        const rows = await sql`
          SELECT g.id,
            ABS(g.home_score - g.away_score) AS margin,
            CASE WHEN g.home_score > g.away_score THEN ht.name ELSE at2.name END AS winner,
            CASE WHEN g.home_score > g.away_score THEN at2.name ELSE ht.name END AS loser,
            g.season::text AS season
          FROM games g
          JOIN game_box_scores bs ON bs.game_id = g.id
          JOIN teams ht ON ht.slug = g.home_team_slug
          JOIN teams at2 ON at2.slug = g.away_team_slug
          WHERE g.home_score IS NOT NULL AND g.season IN (2023,2024,2025)
          ORDER BY g.season, margin DESC`
        const seasons = ['2023','2024','2025']
        const seasonBars = seasons.map(yr => {
          const bars = rows
            .filter(r => String(r.season) === yr)
            .slice(0, 25)
            .map(r => ({ name: `${r.winner} def. ${r.loser}`, value: Number(r.margin) }))
          return { season: yr, topValue: bars[0]?.value ?? 0, bars }
        })
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: seasons, valueLabel: 'Point Margin' })
      }

      case 'single-game-rushing': {
        const seasons = [2023,2024,2025]
        const seasonStrs = seasons.map(String)
        const rows = await fetchSingleGameRushing(seasons)
        const seasonBars = seasonStrs.map(yr => {
          const bars = rows
            .filter(r => String(r.season) === yr)
            .slice(0, 25)
            .map(r => ({ name: r.player, value: r.yds }))
          return { season: yr, topValue: bars[0]?.value ?? 0, bars }
        })
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: seasonStrs, valueLabel: 'Rush Yards' })
      }

      case 'single-game-passing': {
        const seasons = [2023,2024,2025]
        const seasonStrs = seasons.map(String)
        const rows = await fetchSingleGamePassing(seasons)
        const seasonBars = seasonStrs.map(yr => {
          const bars = rows
            .filter(r => String(r.season) === yr)
            .slice(0, 25)
            .map(r => ({ name: r.player, value: r.yds }))
          return { season: yr, topValue: bars[0]?.value ?? 0, bars }
        })
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: seasonStrs, valueLabel: 'Pass Yards' })
      }

      case 'team-scoring-avg': {
        const rows = await sql`
          WITH tg AS (
            SELECT home_team_slug AS team_slug, home_score AS score, season FROM games WHERE home_score IS NOT NULL AND season IN (2023,2024)
            UNION ALL
            SELECT away_team_slug, away_score, season FROM games WHERE away_score IS NOT NULL AND season IN (2023,2024)
          )
          SELECT t.name, ROUND(AVG(tg.score)::numeric,1) AS value, tg.season::text AS season
          FROM tg JOIN teams t ON t.slug=tg.team_slug GROUP BY t.name, tg.season HAVING COUNT(*)>=1
          ORDER BY tg.season, value DESC`
        const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], ['2023','2024'])
        const tableRows = seasonBars.find(s => s.season === '2024')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: ['2023','2024'], valueLabel: 'Avg Pts/Game' })
      }

      default:
        return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'DB error' }, { status: 500 })
  }
}
