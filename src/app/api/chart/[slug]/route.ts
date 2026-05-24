import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { fetchPassingYardsLeaders, fetchPassingTdsLeaders, fetchSingleGamePassing } from '@/lib/chart-data/passing'
import { fetchRushingYardsLeaders, fetchRushingTdsLeaders, fetchSingleGameRushing } from '@/lib/chart-data/rushing'
import { fetchReceivingYardsLeaders, fetchReceivingTdsLeaders } from '@/lib/chart-data/receiving'
import { fetchTotalTdsLeaders, fetchTotalYardsLeaders, fetchTotalPointsLeaders } from '@/lib/chart-data/composite'
import { fetchPFPA, fetchPointDifferential, fetchScoringOffense, fetchScoringDefense, fetchTopScoringGames, fetchBiggestBlowouts } from '@/lib/chart-data/scoring'
import { fetchSeasonRecords, fetchHomeAwayRecord, fetchWinLossDivision, fetchWinPercentage, fetchWinningStreaks, fetchLosingStreaks } from '@/lib/chart-data/wins'
import { fetchStrengthOfSchedule } from '@/lib/chart-data/schedule'

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
        const seasons = [2021,2022,2023,2024,2025]
        const seasonStrs = seasons.map(String)
        const rows = await fetchSeasonRecords(seasons)
        const stRows = rows.map(r => ({ name: r.name, value: r.wins, season: String(r.season) }))
        const seasonBars = buildSeasonBars(stRows, seasonStrs)
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: seasonStrs, valueLabel: 'Wins' })
      }

      case 'wins-by-school': {
        const seasons = [2021,2022,2023,2024,2025]
        const rows = await fetchSeasonRecords(seasons)
        // Sum wins per team across all seasons
        const byTeam = new Map<string, number>()
        for (const r of rows) byTeam.set(r.name, (byTeam.get(r.name) ?? 0) + r.wins)
        const tableRows: StdRow[] = [...byTeam.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([name, value]) => ({ name, value }))
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
        const seasons = [2021,2022,2023,2024,2025]
        const seasonStrs = seasons.map(String)
        const rows = await fetchReceivingYardsLeaders(seasons)
        const seasonBars = buildSeasonBars(rows, seasonStrs)
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: seasonStrs, valueLabel: 'Recv Yards' })
      }

      case 'receiving-tds-leaders': {
        const seasons = [2021,2022,2023,2024,2025]
        const seasonStrs = seasons.map(String)
        const rows = await fetchReceivingTdsLeaders(seasons)
        const seasonBars = buildSeasonBars(rows, seasonStrs)
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: seasonStrs, valueLabel: 'Recv TDs' })
      }

      case 'total-tds-leaders': {
        const seasons = [2021,2022,2023,2024,2025]
        const seasonStrs = seasons.map(String)
        const rows = await fetchTotalTdsLeaders(seasons)
        const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], seasonStrs)
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: seasonStrs, valueLabel: 'Total TDs' })
      }

      case 'total-yards-leaders': {
        const seasons = [2021,2022,2023,2024,2025]
        const seasonStrs = seasons.map(String)
        const rows = await fetchTotalYardsLeaders(seasons)
        const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], seasonStrs)
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: seasonStrs, valueLabel: 'Total Yards' })
      }

      case 'total-points-leaders': {
        const seasons = [2021,2022,2023,2024,2025]
        const seasonStrs = seasons.map(String)
        const rows = await fetchTotalPointsLeaders(seasons)
        const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], seasonStrs)
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: seasonStrs, valueLabel: 'Points' })
      }

      case 'home-away-record': {
        const rows = await fetchHomeAwayRecord([2021,2022,2023,2024,2025])
        const current = rows.filter(r => r.season === '2025').map(r => ({ name: r.name, value: r.home_wins }))
        const multiSeriesData = rows.filter(r => r.season === '2025').map(r => ({ name: r.name, home: r.home_wins, away: r.away_wins }))
        return NextResponse.json({
          variant: 'bar-multi', tableRows: current, kpiValue: current[0]?.value ?? 0, multiSeriesData,
          series: [{ key: 'home', label: 'Home Wins', color: '#033882' }, { key: 'away', label: 'Away Wins', color: '#94a3b8' }],
        })
      }

      case 'pf-pa': {
        const rows = await fetchPFPA([2021,2022,2023,2024,2025])
        const current = rows.filter(r => r.season === '2025').map(r => ({ name: r.name, value: r.pf }))
        const pfpaSeasons = ['2021','2022','2023','2024','2025'].map(yr => ({
          season: yr,
          points: rows.filter(r => r.season === yr).map(r => ({ name: r.name, pf: r.pf, pa: r.pa, wins: r.wins })),
        }))
        return NextResponse.json({ variant: 'pfpa', tableRows: current, kpiValue: current[0]?.value ?? 0, pfpaSeasons })
      }

      case 'win-loss-division': {
        const seasons = [2021,2022,2023,2024,2025]
        const seasonStrs = seasons.map(String)
        const rows = await fetchWinLossDivision(seasons)
        const current = rows.filter(r => r.season === '2025').map(r => ({ name: r.name, value: r.wins }))
        const winLossSeasons = seasonStrs.map(yr => ({
          season: yr,
          teams: rows.filter(r => r.season === yr).map(r => ({
            name: r.name, division: r.division, wins: r.wins, losses: r.losses,
          })),
        }))
        return NextResponse.json({ variant: 'win-loss-h', tableRows: current, kpiValue: current.length, winLossSeasons })
      }

      case 'strength-of-schedule': {
        const seasons = [2021,2022,2023,2024,2025]
        const seasonStrs = seasons.map(String)
        const rows = await fetchStrengthOfSchedule(seasons)
        const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], seasonStrs)
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: seasonStrs, valueLabel: 'SoS %' })
      }

      case 'point-differential-leaders': {
        const seasons = [2023,2024,2025]
        const seasonStrs = seasons.map(String)
        const rows = await fetchPointDifferential(seasons)
        const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], seasonStrs)
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: seasonStrs, valueLabel: 'Differential' })
      }

      case 'scoring-offense': {
        const seasons = [2021,2022,2023,2024,2025]
        const seasonStrs = seasons.map(String)
        const rows = await fetchScoringOffense(seasons)
        const seasonBars = buildSeasonBars(rows as {name:unknown;value:unknown;season:unknown}[], seasonStrs)
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: seasonStrs, valueLabel: 'Avg Pts/Game' })
      }

      case 'scoring-defense': {
        const seasons = [2021,2022,2023,2024,2025]
        const seasonStrs = seasons.map(String)
        const rows = await fetchScoringDefense(seasons)
        const seasonBars = seasonStrs.map(yr => {
          const bars = rows
            .filter(r => r.season === yr)
            .sort((a, b) => a.value - b.value)
            .slice(0, 25)
            .map(r => ({ name: r.name, value: r.value }))
          return { season: yr, topValue: bars[0]?.value ?? 0, bars }
        })
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: seasonStrs, valueLabel: 'Avg Pts Allowed' })
      }

      case 'top-scoring-games': {
        const seasons = [2023,2024,2025]
        const seasonStrs = seasons.map(String)
        const rows = await fetchTopScoringGames(seasons)
        const stripVF = (s: string) => s.replace(/\s+Varsity Football$/i, '')
        const seasonBars = seasonStrs.map(yr => {
          const bars = rows
            .filter(r => r.season === yr)
            .slice(0, 25)
            .map(r => ({ name: `${stripVF(r.home)} vs ${stripVF(r.away)}`, value: r.total }))
          return { season: yr, topValue: bars[0]?.value ?? 0, bars }
        })
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: seasonStrs, valueLabel: 'Combined Pts' })
      }

      case 'biggest-blowouts': {
        const seasons = [2023,2024,2025]
        const seasonStrs = seasons.map(String)
        const rows = await fetchBiggestBlowouts(seasons)
        const stripVF = (s: string) => s.replace(/\s+Varsity Football$/i, '')
        const seasonBars = seasonStrs.map(yr => {
          const bars = rows
            .filter(r => r.season === yr)
            .slice(0, 25)
            .map(r => ({ name: `${stripVF(r.winner)} def. ${stripVF(r.loser)}`, value: r.margin }))
          return { season: yr, topValue: bars[0]?.value ?? 0, bars }
        })
        const tableRows = seasonBars.find(s => s.season === '2025')?.bars ?? []
        return NextResponse.json({ variant: 'bar-interactive', tableRows, kpiValue: tableRows[0]?.value ?? 0, seasonBars, seasonFilters: seasonStrs, valueLabel: 'Point Margin' })
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
