import { notFound } from 'next/navigation'
import { sql } from '@/lib/db'
import { getChartConfig, getAdjacentSlugs } from '@/lib/chart-configs'
import { ChartDetailPage, type StdRow, type MultiRow, type SubRow, type SubRowMap } from '@/components/ChartDetailPage'
import { SportsBarChart } from '@/components/charts/SportsBarChart'
import { SportsBarChartMulti } from '@/components/charts/SportsBarChartMulti'
import { SportsBarChartInteractive, type SeasonBars } from '@/components/charts/SportsBarChartInteractive'
import { SportsBarChartStackedInteractive, type StackedSeasonBars } from '@/components/charts/SportsBarChartStackedInteractive'
import { SportsBarChartDynasty, type DynastyBar, type DynastyWindow } from '@/components/charts/SportsBarChartDynasty'
import { SportsAreaGradient } from '@/components/charts/SportsAreaGradient'
import { SportsPFPAScatter, type PFPASeason } from '@/components/charts/SportsPFPAScatter'
import { SportsWinLossBar, type WinLossSeason } from '@/components/charts/SportsWinLossBar'
import { SportsHomeAwayBar, type HomeAwaySeason } from '@/components/charts/SportsHomeAwayBar'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { CURRENT_SEASON, AVAILABLE_SEASONS } from '@/lib/season'
import { formatSeason } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const DIV_COLORS: Record<string, string> = {
  I:   '#033882',
  II:  '#4338ca',
  III: '#0ea5e9',
  IV:  '#10b981',
}

function buildBarsWithRecord(
  rows: { name: unknown; value: unknown; season: unknown; school_slug?: unknown; overall_wins?: unknown; overall_losses?: unknown }[],
  seasons: string[],
  limit = 50
): SeasonBars[] {
  return seasons.map(yr => {
    const yrows = rows
      .filter(r => String(r.season) === yr)
      .sort((a, b) => Number(b.value) - Number(a.value))
      .slice(0, limit)
      .map(r => ({
        name: String(r.name),
        value: Number(r.value),
        logoUrl: r.school_slug ? (SCHOOL_LOGOS[String(r.school_slug)] ?? '') : '',
        record: r.overall_wins != null ? `${r.overall_wins}–${r.overall_losses ?? 0}` : undefined,
        subtitle: formatSeason(yr),
      }))
    return { season: yr, topValue: yrows[0]?.value ?? 0, bars: yrows }
  })
}

function buildSeasonBars(
  rows: { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[],
  seasons: string[],
  limit = 50
): SeasonBars[] {
  return seasons.map(yr => {
    const yrows = rows
      .filter(r => String(r.season) === yr)
      .sort((a, b) => Number(b.value) - Number(a.value))
      .slice(0, limit)
      .map(r => ({
        name: String(r.name),
        value: Number(r.value),
        logoUrl: r.school_slug ? (SCHOOL_LOGOS[String(r.school_slug)] ?? '') : '',
      }))
    const topValue = yrows[0]?.value ?? 0
    return { season: yr, topValue, bars: yrows }
  })
}

export default async function ChartPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const config = getChartConfig(slug)
  if (!config) notFound()

  const { prevSlug, nextSlug } = getAdjacentSlugs(slug)

  let tableRows: StdRow[] = []
  let multiPoints: MultiRow[] = []
  let kpiValue = 0
  let chartChild: React.ReactNode = null
  let seasonFilters: string[] | undefined = undefined
  let seasonRows: Record<string, StdRow[]> | undefined = undefined
  const ALL_SEASONS    = AVAILABLE_SEASONS.map(String)
  const LAST3_SEASONS  = ALL_SEASONS.slice(-3)
  const SEASONS_WITH_2020 = [2020, ...AVAILABLE_SEASONS]
  const SEASON_FILTER_MAP: Record<string, string[]> = {
    'season-records':             [...ALL_SEASONS, 'all'],
    'wins-by-school':             LAST3_SEASONS, // overridden in case block
    'point-differential-leaders': LAST3_SEASONS,
    'passing-yards-leaders':      [...ALL_SEASONS, 'all'],
    'passing-tds-leaders':        [...ALL_SEASONS, 'all'],
    'rushing-yards-leaders':      [...ALL_SEASONS, 'all'],
    'rushing-tds-leaders':        [...ALL_SEASONS, 'all'],
    'receiving-yards-leaders':    [...ALL_SEASONS, 'all'],
    'receiving-tds-leaders':      [...ALL_SEASONS, 'all'],
    'total-tds-leaders':          [...ALL_SEASONS, 'all'],
    'total-yards-leaders':        [...ALL_SEASONS, 'all'],
    'total-points-leaders':       ALL_SEASONS,
    'home-away-record':           [...ALL_SEASONS, 'all'],
    'pf-pa':                      [...ALL_SEASONS, 'all'],
    'win-loss-division':          ALL_SEASONS,
    'strength-of-schedule':       [...ALL_SEASONS, 'all'],
  }
  seasonFilters = SEASON_FILTER_MAP[slug]
  let subRows: SubRowMap | undefined = undefined
  let rowLinks: Record<string, string> | undefined = undefined

  switch (slug) {

    // ── season-records ─────────────────────────────────────────────────────────
    case 'season-records': {
      const recordRows = await sql`
        SELECT t.name, t.slug AS team_slug, t.school_slug, s.overall_wins AS wins, s.overall_losses AS losses, s.season
        FROM teams t
        JOIN team_season_stats s ON s.team_slug = t.slug
        WHERE s.season = ANY(${AVAILABLE_SEASONS})
        ORDER BY s.season, s.overall_wins DESC`

      const stackedSeasonBars: StackedSeasonBars[] = ALL_SEASONS.map(yr => ({
        season: yr,
        bars: recordRows
          .filter(r => String(r.season) === yr)
          .sort((a, b) => Number(b.wins) - Number(a.wins))
          .map(r => ({
            name: r.name as string,
            wins: Number(r.wins),
            losses: Number(r.losses),
            logoUrl: SCHOOL_LOGOS[r.school_slug as string] ?? '',
          })),
      }))

      // Build "All": sum wins + losses per team across all seasons
      const allRecordsMap = new Map<string, { name: string; wins: number; losses: number; logoUrl: string }>()
      for (const s of stackedSeasonBars) {
        for (const b of s.bars) {
          const ex = allRecordsMap.get(b.name)
          if (ex) { ex.wins += b.wins; ex.losses += b.losses }
          else allRecordsMap.set(b.name, { name: b.name, wins: b.wins, losses: b.losses, logoUrl: b.logoUrl ?? '' })
        }
      }
      const allRecordBars = [...allRecordsMap.values()].sort((a, b) => b.wins - a.wins)
      stackedSeasonBars.push({ season: 'all', bars: allRecordBars })

      seasonRows = {}
      for (const bar of stackedSeasonBars) {
        seasonRows[bar.season] = bar.bars.map(b => ({
          name: b.name,
          value: b.wins,
          logoUrl: b.logoUrl,
        }))
      }
      tableRows = seasonRows[String(CURRENT_SEASON)] ?? []
      kpiValue = tableRows.length

      rowLinks = Object.fromEntries(
        recordRows.map(r => [r.name as string, `/team/${r.team_slug as string}`])
      )

      chartChild = (
        <SportsBarChartStackedInteractive
          seasons={stackedSeasonBars}
          color={config.color}
        />
      )
      break
    }

    // ── wins-by-school (Current Dynasty) ──────────────────────────────────────
    case 'wins-by-school': {
      const rows = await sql`
        SELECT t.name, t.slug AS team_slug, t.school_slug, s.season,
          s.overall_wins, s.overall_losses, COALESCE(s.overall_ties, 0) AS overall_ties
        FROM teams t
        JOIN team_season_stats s ON s.team_slug = t.slug
        WHERE s.season = ANY(${SEASONS_WITH_2020})
        ORDER BY t.name, s.season`

      // Index wins/losses/ties per team per season
      const byTeam: Record<string, Record<string, { w: number; l: number; t: number }>> = {}
      const schoolSlugs: Record<string, string> = {}
      const teamSlugs: Record<string, string> = {}
      for (const r of rows) {
        const name = r.name as string
        const season = String(r.season)
        if (!byTeam[name]) byTeam[name] = {}
        byTeam[name][season] = { w: Number(r.overall_wins), l: Number(r.overall_losses), t: Number(r.overall_ties) }
        schoolSlugs[name] = r.school_slug as string
        teamSlugs[name] = r.team_slug as string
      }
      const teamNames = Object.keys(byTeam)

      const buildDynastyWindow = (endYear: number): DynastyWindow => {
        const [y1, y2, y3] = [String(endYear - 2), String(endYear - 1), String(endYear)]
        const bars: DynastyBar[] = teamNames
          .map(name => {
            const s = byTeam[name]
            const w1 = s[y1]?.w ?? 0, w2 = s[y2]?.w ?? 0, w3 = s[y3]?.w ?? 0
            const games = (s[y1] ? s[y1].w + s[y1].l + s[y1].t : 0)
                        + (s[y2] ? s[y2].w + s[y2].l + s[y2].t : 0)
                        + (s[y3] ? s[y3].w + s[y3].l + s[y3].t : 0)
            return { name, logoUrl: SCHOOL_LOGOS[schoolSlugs[name]] ?? '',
              yr1: w1, yr1Label: y1, yr2: w2, yr2Label: y2, yr3: w3, yr3Label: y3, totalGames: games }
          })
          .filter(b => b.yr1 + b.yr2 + b.yr3 > 0)
          .sort((a, b) => (b.yr1 + b.yr2 + b.yr3) - (a.yr1 + a.yr2 + a.yr3))
        return { filterYear: String(endYear), bars }
      }

      const has2020 = rows.some(r => String(r.season) === '2020')
      const dynastyWindows: DynastyWindow[] = [
        ...(has2020 ? [buildDynastyWindow(2022)] : []),
        buildDynastyWindow(2023),
        buildDynastyWindow(2024),
        buildDynastyWindow(CURRENT_SEASON),
      ]

      seasonRows = {}
      for (const w of dynastyWindows) {
        seasonRows[w.filterYear] = w.bars.map(b => {
          const total = b.yr1 + b.yr2 + b.yr3
          return {
            name: b.name,
            value: total,
            logoUrl: b.logoUrl,
            winPct: b.totalGames > 0 ? (total / b.totalGames) * 100 : 0,
          }
        })
      }
      rowLinks = Object.fromEntries(
        teamNames.map(name => [name, `/team/${teamSlugs[name]}`])
      )
      const win2025 = dynastyWindows.find(w => w.filterYear === String(CURRENT_SEASON))
      tableRows = seasonRows[String(CURRENT_SEASON)] ?? (win2025?.bars ?? []).map(b => ({
        name: b.name, value: b.yr1 + b.yr2 + b.yr3, logoUrl: b.logoUrl,
      }))
      kpiValue = tableRows[0]?.value ?? 0
      seasonFilters = dynastyWindows.map(w => w.filterYear)

      chartChild = <SportsBarChartDynasty windows={dynastyWindows} />
      break
    }

    // ── point-differential-leaders ────────────────────────────────────────────
    case 'point-differential-leaders': {
      const rows = await sql`
        SELECT
          t.name,
          t.school_slug,
          s.season,
          s.overall_wins,
          s.overall_losses,
          (
            SUM(CASE WHEN g.home_team_slug = t.slug THEN g.home_score ELSE g.away_score END)
            - SUM(CASE WHEN g.home_team_slug = t.slug THEN g.away_score ELSE g.home_score END)
          )::int AS value
        FROM teams t
        JOIN team_season_stats s ON s.team_slug = t.slug
        JOIN games g ON (g.home_team_slug = t.slug OR g.away_team_slug = t.slug)
          AND g.season = s.season
          AND g.home_score IS NOT NULL
        WHERE s.season = ANY(${AVAILABLE_SEASONS.slice(-3)})
        GROUP BY t.name, t.school_slug, s.season, s.overall_wins, s.overall_losses
        ORDER BY s.season, value DESC`

      const seasonBars = LAST3_SEASONS.map(yr => {
        const yrows = rows
          .filter(r => String(r.season) === yr)
          .sort((a, b) => Number(b.value) - Number(a.value))
          .slice(0, 52)
          .map(r => ({
            name: String(r.name),
            value: Number(r.value),
            logoUrl: r.school_slug ? (SCHOOL_LOGOS[String(r.school_slug)] ?? '') : '',
            record: `${r.overall_wins ?? 0}–${r.overall_losses ?? 0}`,
          }))
        return { season: yr, topValue: yrows[0]?.value ?? 0, bars: yrows }
      })
      tableRows = seasonBars.find(s => s.season === String(CURRENT_SEASON))?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = (
        <SportsBarChartInteractive
          seasons={seasonBars}
          color={config.color}
          valueLabel="Differential"
          negativeColor="#ef4444"
        />
      )
      break
    }

    // ── passing-yards-leaders ──────────────────────────────────────────────────
    case 'passing-yards-leaders': {
      const rows = await sql`
        SELECT ps.player_name AS name, ps.school_slug, ps.season, ps.pass_yards AS value,
          ts.overall_wins, ts.overall_losses
        FROM player_season_stats ps
        LEFT JOIN teams tm ON tm.school_slug = ps.school_slug AND tm.level = 'Varsity'
        LEFT JOIN team_season_stats ts ON ts.team_slug = tm.slug AND ts.season = ps.season
        WHERE ps.stat_type = 'Passing' AND ps.pass_yards IS NOT NULL AND ps.season = ANY(${AVAILABLE_SEASONS})
        ORDER BY ps.season, ps.pass_yards DESC`
      const seasonBarsArr = buildBarsWithRecord(rows as never[], ALL_SEASONS)
      const allBars = seasonBarsArr.flatMap(s => s.bars).sort((a, b) => b.value - a.value)
      seasonBarsArr.push({ season: 'all', topValue: allBars[0]?.value ?? 0, bars: allBars })
      seasonRows = Object.fromEntries(seasonBarsArr.map(s => [s.season, s.bars]))
      tableRows = seasonRows[String(CURRENT_SEASON)] ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = <SportsBarChartInteractive seasons={seasonBarsArr} color={config.color} valueLabel="Pass Yards" />
      break
    }

    // ── passing-tds-leaders ────────────────────────────────────────────────────
    case 'passing-tds-leaders': {
      const rows = await sql`
        SELECT ps.player_name AS name, ps.school_slug, ps.season, ps.pass_tds AS value,
          ts.overall_wins, ts.overall_losses
        FROM player_season_stats ps
        LEFT JOIN teams tm ON tm.school_slug = ps.school_slug AND tm.level = 'Varsity'
        LEFT JOIN team_season_stats ts ON ts.team_slug = tm.slug AND ts.season = ps.season
        WHERE ps.stat_type = 'Passing' AND ps.pass_tds IS NOT NULL AND ps.season = ANY(${AVAILABLE_SEASONS})
        ORDER BY ps.season, ps.pass_tds DESC`
      const seasonBarsArr = buildBarsWithRecord(rows as never[], ALL_SEASONS)
      const allBars = seasonBarsArr.flatMap(s => s.bars).sort((a, b) => b.value - a.value)
      seasonBarsArr.push({ season: 'all', topValue: allBars[0]?.value ?? 0, bars: allBars })
      seasonRows = Object.fromEntries(seasonBarsArr.map(s => [s.season, s.bars]))
      tableRows = seasonRows[String(CURRENT_SEASON)] ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = <SportsBarChartInteractive seasons={seasonBarsArr} color={config.color} valueLabel="Pass TDs" />
      break
    }

    // ── rushing-yards-leaders ──────────────────────────────────────────────────
    case 'rushing-yards-leaders': {
      const rows = await sql`
        SELECT ps.player_name AS name, ps.school_slug, ps.season, ps.rush_yards AS value,
          ts.overall_wins, ts.overall_losses
        FROM player_season_stats ps
        LEFT JOIN teams tm ON tm.school_slug = ps.school_slug AND tm.level = 'Varsity'
        LEFT JOIN team_season_stats ts ON ts.team_slug = tm.slug AND ts.season = ps.season
        WHERE ps.stat_type = 'Rushing' AND ps.rush_yards IS NOT NULL AND ps.season = ANY(${AVAILABLE_SEASONS})
        ORDER BY ps.season, ps.rush_yards DESC`
      const seasonBarsArr = buildBarsWithRecord(rows as never[], ALL_SEASONS)
      const allBars = seasonBarsArr.flatMap(s => s.bars).sort((a, b) => b.value - a.value)
      seasonBarsArr.push({ season: 'all', topValue: allBars[0]?.value ?? 0, bars: allBars })
      seasonRows = Object.fromEntries(seasonBarsArr.map(s => [s.season, s.bars]))
      tableRows = seasonRows[String(CURRENT_SEASON)] ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = <SportsBarChartInteractive seasons={seasonBarsArr} color={config.color} valueLabel="Rush Yards" />
      break
    }

    // ── rushing-tds-leaders ────────────────────────────────────────────────────
    case 'rushing-tds-leaders': {
      const rows = await sql`
        SELECT ps.player_name AS name, ps.school_slug, ps.season, ps.rush_tds AS value,
          ts.overall_wins, ts.overall_losses
        FROM player_season_stats ps
        LEFT JOIN teams tm ON tm.school_slug = ps.school_slug AND tm.level = 'Varsity'
        LEFT JOIN team_season_stats ts ON ts.team_slug = tm.slug AND ts.season = ps.season
        WHERE ps.stat_type = 'Rushing' AND ps.rush_tds IS NOT NULL AND ps.season = ANY(${AVAILABLE_SEASONS})
        ORDER BY ps.season, ps.rush_tds DESC`
      const seasonBarsArr = buildBarsWithRecord(rows as never[], ALL_SEASONS)
      const allBars = seasonBarsArr.flatMap(s => s.bars).sort((a, b) => b.value - a.value)
      seasonBarsArr.push({ season: 'all', topValue: allBars[0]?.value ?? 0, bars: allBars })
      seasonRows = Object.fromEntries(seasonBarsArr.map(s => [s.season, s.bars]))
      tableRows = seasonRows[String(CURRENT_SEASON)] ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = <SportsBarChartInteractive seasons={seasonBarsArr} color={config.color} valueLabel="Rush TDs" />
      break
    }

    // ── receiving-yards-leaders ────────────────────────────────────────────────
    case 'receiving-yards-leaders': {
      const rows = await sql`
        SELECT ps.player_name AS name, ps.school_slug, ps.season, ps.recv_yards AS value,
          ts.overall_wins, ts.overall_losses
        FROM player_season_stats ps
        LEFT JOIN teams tm ON tm.school_slug = ps.school_slug AND tm.level = 'Varsity'
        LEFT JOIN team_season_stats ts ON ts.team_slug = tm.slug AND ts.season = ps.season
        WHERE ps.stat_type = 'Receiving' AND ps.recv_yards IS NOT NULL AND ps.season = ANY(${AVAILABLE_SEASONS})
        ORDER BY ps.season, ps.recv_yards DESC`
      const seasonBarsArr = buildBarsWithRecord(rows as never[], ALL_SEASONS)
      const allBars = seasonBarsArr.flatMap(s => s.bars).sort((a, b) => b.value - a.value)
      seasonBarsArr.push({ season: 'all', topValue: allBars[0]?.value ?? 0, bars: allBars })
      seasonRows = Object.fromEntries(seasonBarsArr.map(s => [s.season, s.bars]))
      tableRows = seasonRows[String(CURRENT_SEASON)] ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = <SportsBarChartInteractive seasons={seasonBarsArr} color={config.color} valueLabel="Recv Yards" />
      break
    }

    // ── receiving-tds-leaders ──────────────────────────────────────────────────
    case 'receiving-tds-leaders': {
      const rows = await sql`
        SELECT ps.player_name AS name, ps.school_slug, ps.season, ps.recv_tds AS value,
          ts.overall_wins, ts.overall_losses
        FROM player_season_stats ps
        LEFT JOIN teams tm ON tm.school_slug = ps.school_slug AND tm.level = 'Varsity'
        LEFT JOIN team_season_stats ts ON ts.team_slug = tm.slug AND ts.season = ps.season
        WHERE ps.stat_type = 'Receiving' AND ps.recv_tds IS NOT NULL AND ps.season = ANY(${AVAILABLE_SEASONS})
        ORDER BY ps.season, ps.recv_tds DESC`
      const seasonBarsArr = buildBarsWithRecord(rows as never[], ALL_SEASONS)
      const allBars = seasonBarsArr.flatMap(s => s.bars).sort((a, b) => b.value - a.value)
      seasonBarsArr.push({ season: 'all', topValue: allBars[0]?.value ?? 0, bars: allBars })
      seasonRows = Object.fromEntries(seasonBarsArr.map(s => [s.season, s.bars]))
      tableRows = seasonRows[String(CURRENT_SEASON)] ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = <SportsBarChartInteractive seasons={seasonBarsArr} color={config.color} valueLabel="Recv TDs" />
      break
    }

    // ── total-tds-leaders ──────────────────────────────────────────────────────
    case 'total-tds-leaders': {
      const rows = await sql`
        WITH rushing AS (
          SELECT player_slug, school_slug, player_name, season,
            COALESCE(rush_tds, 0) AS rush_tds
          FROM player_season_stats
          WHERE stat_type = 'Rushing' AND season = ANY(${AVAILABLE_SEASONS})
        ),
        receiving AS (
          SELECT player_slug, school_slug, player_name, season,
            COALESCE(recv_tds, 0) AS recv_tds
          FROM player_season_stats
          WHERE stat_type = 'Receiving' AND season = ANY(${AVAILABLE_SEASONS})
        )
        SELECT
          COALESCE(r.player_name, v.player_name) AS name,
          COALESCE(r.school_slug, v.school_slug) AS school_slug,
          COALESCE(r.season, v.season) AS season,
          COALESCE(r.rush_tds, 0) + COALESCE(v.recv_tds, 0) AS value,
          ts.overall_wins, ts.overall_losses
        FROM rushing r
        FULL OUTER JOIN receiving v ON v.player_slug = r.player_slug AND v.season = r.season
        LEFT JOIN teams tm ON tm.school_slug = COALESCE(r.school_slug, v.school_slug) AND tm.level = 'Varsity'
        LEFT JOIN team_season_stats ts ON ts.team_slug = tm.slug AND ts.season = COALESCE(r.season, v.season)
        WHERE COALESCE(r.rush_tds, 0) + COALESCE(v.recv_tds, 0) > 0
        ORDER BY season, value DESC`

      const seasonBarsArr = buildBarsWithRecord(rows as never[], ALL_SEASONS)
      const allBars = seasonBarsArr.flatMap(s => s.bars).sort((a, b) => b.value - a.value)
      seasonBarsArr.push({ season: 'all', topValue: allBars[0]?.value ?? 0, bars: allBars })
      seasonRows = Object.fromEntries(seasonBarsArr.map(s => [s.season, s.bars]))
      tableRows = seasonRows[String(CURRENT_SEASON)] ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = <SportsBarChartInteractive seasons={seasonBarsArr} color={config.color} valueLabel="Total TDs" />
      break
    }

    // ── total-yards-leaders ────────────────────────────────────────────────────
    case 'total-yards-leaders': {
      const rows = await sql`
        WITH passing AS (
          SELECT player_slug, school_slug, player_name, season,
            COALESCE(pass_yards, 0) AS pass_yards
          FROM player_season_stats
          WHERE stat_type = 'Passing' AND season = ANY(${AVAILABLE_SEASONS})
        ),
        rushing AS (
          SELECT player_slug, school_slug, player_name, season,
            COALESCE(rush_yards, 0) AS rush_yards
          FROM player_season_stats
          WHERE stat_type = 'Rushing' AND season = ANY(${AVAILABLE_SEASONS})
        ),
        receiving AS (
          SELECT player_slug, school_slug, player_name, season,
            COALESCE(recv_yards, 0) AS recv_yards
          FROM player_season_stats
          WHERE stat_type = 'Receiving' AND season = ANY(${AVAILABLE_SEASONS})
        )
        SELECT
          COALESCE(pa.player_name, ru.player_name, re.player_name) AS name,
          COALESCE(pa.school_slug, ru.school_slug, re.school_slug) AS school_slug,
          COALESCE(pa.season, ru.season, re.season) AS season,
          COALESCE(pa.pass_yards, 0) + COALESCE(ru.rush_yards, 0) + COALESCE(re.recv_yards, 0) AS value,
          ts.overall_wins, ts.overall_losses
        FROM passing pa
        FULL OUTER JOIN rushing ru ON ru.player_slug = pa.player_slug AND ru.season = pa.season
        FULL OUTER JOIN receiving re
          ON re.player_slug = COALESCE(pa.player_slug, ru.player_slug)
          AND re.season = COALESCE(pa.season, ru.season)
        LEFT JOIN teams tm ON tm.school_slug = COALESCE(pa.school_slug, ru.school_slug, re.school_slug) AND tm.level = 'Varsity'
        LEFT JOIN team_season_stats ts ON ts.team_slug = tm.slug AND ts.season = COALESCE(pa.season, ru.season, re.season)
        WHERE COALESCE(pa.pass_yards, 0) + COALESCE(ru.rush_yards, 0) + COALESCE(re.recv_yards, 0) > 0
        ORDER BY season, value DESC`

      const seasonBarsArr = buildBarsWithRecord(rows as never[], ALL_SEASONS)
      const allBars = seasonBarsArr.flatMap(s => s.bars).sort((a, b) => b.value - a.value)
      seasonBarsArr.push({ season: 'all', topValue: allBars[0]?.value ?? 0, bars: allBars })
      seasonRows = Object.fromEntries(seasonBarsArr.map(s => [s.season, s.bars]))
      tableRows = seasonRows[String(CURRENT_SEASON)] ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = <SportsBarChartInteractive seasons={seasonBarsArr} color={config.color} valueLabel="Total Yards" />
      break
    }

    // ── total-points-leaders ───────────────────────────────────────────────────
    case 'total-points-leaders': {
      const rows = await sql`
        WITH tds AS (
          SELECT player_slug, school_slug, player_name, season,
            COALESCE(rush_tds, 0) AS rush_tds
          FROM player_season_stats
          WHERE stat_type = 'Rushing' AND season = ANY(${AVAILABLE_SEASONS})
        ),
        recv AS (
          SELECT player_slug, school_slug, player_name, season,
            COALESCE(recv_tds, 0) AS recv_tds,
            COALESCE(pat, 0) AS pat
          FROM player_season_stats
          WHERE stat_type = 'Receiving' AND season = ANY(${AVAILABLE_SEASONS})
        ),
        passing AS (
          SELECT player_slug, school_slug, player_name, season,
            COALESCE(pass_tds, 0) AS pass_tds
          FROM player_season_stats
          WHERE stat_type = 'Passing' AND season = ANY(${AVAILABLE_SEASONS})
        )
        SELECT
          COALESCE(t.player_name, r.player_name, p.player_name) AS name,
          COALESCE(t.school_slug, r.school_slug, p.school_slug) AS school_slug,
          COALESCE(t.season, r.season, p.season) AS season,
          (COALESCE(t.rush_tds, 0) + COALESCE(r.recv_tds, 0) + COALESCE(p.pass_tds, 0)) * 6
            + COALESCE(r.pat, 0) AS value
        FROM tds t
        FULL OUTER JOIN recv r ON r.player_slug = t.player_slug AND r.season = t.season
        FULL OUTER JOIN passing p
          ON p.player_slug = COALESCE(t.player_slug, r.player_slug)
          AND p.season = COALESCE(t.season, r.season)
        WHERE (COALESCE(t.rush_tds, 0) + COALESCE(r.recv_tds, 0) + COALESCE(p.pass_tds, 0)) * 6
          + COALESCE(r.pat, 0) > 0
        ORDER BY season, value DESC`

      const seasonBars = buildSeasonBars(
        rows as { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[],
        ALL_SEASONS
      )
      tableRows = seasonBars.find(s => s.season === String(CURRENT_SEASON))?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = (
        <SportsAreaGradient
          seasons={seasonBars}
          valueLabel="Points"
        />
      )
      break
    }

    // ── home-away-record ──────────────────────────────────────────────────────
    case 'home-away-record': {
      const rows = await sql`
        WITH records AS (
          SELECT t.name, t.school_slug,
            COUNT(*) FILTER (WHERE g.home_team_slug = t.slug AND g.home_score > g.away_score)::int AS home_wins,
            COUNT(*) FILTER (WHERE g.away_team_slug = t.slug AND g.away_score > g.home_score)::int AS away_wins,
            g.season::text AS season
          FROM teams t
          JOIN games g ON (g.home_team_slug = t.slug OR g.away_team_slug = t.slug)
          WHERE g.home_score IS NOT NULL AND g.season = ANY(${AVAILABLE_SEASONS}) AND t.level = 'Varsity'
          GROUP BY t.name, t.school_slug, g.season
        )
        SELECT * FROM records WHERE home_wins + away_wins > 0
        ORDER BY season, home_wins + away_wins DESC`

      const homeAwaySeasons: HomeAwaySeason[] = ALL_SEASONS.map(yr => ({
        season: yr,
        teams: rows
          .filter(r => String(r.season) === yr)
          .map(r => ({
            name: String(r.name),
            school_slug: String(r.school_slug),
            home_wins: Number(r.home_wins),
            away_wins: Number(r.away_wins),
          })),
      }))
      // Build "All" season by summing across all seasons per school
      const allMap = new Map<string, HomeAwaySeason['teams'][number]>()
      for (const s of homeAwaySeasons) {
        for (const t of s.teams) {
          const ex = allMap.get(t.school_slug)
          if (ex) { ex.home_wins += t.home_wins; ex.away_wins += t.away_wins }
          else allMap.set(t.school_slug, { ...t })
        }
      }
      const allTeams = [...allMap.values()].sort((a, b) => (b.home_wins + b.away_wins) - (a.home_wins + a.away_wins))
      homeAwaySeasons.push({ season: 'all', teams: allTeams })

      seasonRows = Object.fromEntries(homeAwaySeasons.map(s => [s.season,
        s.teams.map(t => ({ name: t.name, value: t.home_wins + t.away_wins, logoUrl: SCHOOL_LOGOS[t.school_slug] ?? '' }))
      ]))
      tableRows = seasonRows[String(CURRENT_SEASON)] ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = <SportsHomeAwayBar seasons={homeAwaySeasons} />
      break
    }

    // ── pf-pa ─────────────────────────────────────────────────────────────────
    case 'pf-pa': {
      const rows = await sql`
        WITH scored AS (
          SELECT home_team_slug AS ts, home_score AS pf, away_score AS pa, season FROM games WHERE home_score IS NOT NULL AND season = ANY(${AVAILABLE_SEASONS})
          UNION ALL SELECT away_team_slug, away_score, home_score, season FROM games WHERE home_score IS NOT NULL AND season = ANY(${AVAILABLE_SEASONS})
        )
        SELECT t.name, t.school_slug, s.season::text AS season,
          SUM(pf)::int AS pf, SUM(pa)::int AS pa, ts2.overall_wins::int AS wins
        FROM scored s JOIN teams t ON t.slug = s.ts
        JOIN team_season_stats ts2 ON ts2.team_slug = t.slug AND ts2.season = s.season
        WHERE t.level = 'Varsity'
        GROUP BY t.name, t.school_slug, s.season, ts2.overall_wins
        ORDER BY s.season, pf DESC`

      const pfpaSeasons: PFPASeason[] = ALL_SEASONS.map(yr => ({
        season: yr,
        points: rows.filter(r => String(r.season) === yr).map(r => ({
          name: String(r.name), school_slug: String(r.school_slug),
          pf: Number(r.pf), pa: Number(r.pa), wins: Number(r.wins),
        })),
      }))
      // Build "All" season: average PF/PA/wins per school across all seasons
      const allMap = new Map<string, { name: string; school_slug: string; totalPf: number; totalPa: number; totalWins: number; count: number }>()
      for (const s of pfpaSeasons) {
        for (const p of s.points) {
          const ex = allMap.get(p.school_slug)
          if (ex) { ex.totalPf += p.pf; ex.totalPa += p.pa; ex.totalWins += p.wins; ex.count++ }
          else allMap.set(p.school_slug, { name: p.name, school_slug: p.school_slug, totalPf: p.pf, totalPa: p.pa, totalWins: p.wins, count: 1 })
        }
      }
      const allPoints = [...allMap.values()]
        .map(t => ({ name: t.name, school_slug: t.school_slug, pf: Math.round(t.totalPf / t.count), pa: Math.round(t.totalPa / t.count), wins: Math.round(t.totalWins / t.count) }))
        .sort((a, b) => b.pf - a.pf)
      pfpaSeasons.push({ season: 'all', points: allPoints })

      seasonRows = Object.fromEntries(pfpaSeasons.map(s => [s.season,
        s.points.map(p => ({ name: p.name, value: p.pf, logoUrl: SCHOOL_LOGOS[p.school_slug] ?? '' }))
      ]))
      tableRows = seasonRows[String(CURRENT_SEASON)] ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = <SportsPFPAScatter seasons={pfpaSeasons} />
      break
    }

    // ── win-loss-division ─────────────────────────────────────────────────────
    case 'win-loss-division': {
      const rows = await sql`
        SELECT t.name, t.school_slug, t.division, ts.overall_wins::int AS wins, ts.overall_losses::int AS losses, ts.season::text AS season
        FROM team_season_stats ts JOIN teams t ON t.slug = ts.team_slug
        WHERE ts.season = ANY(${AVAILABLE_SEASONS}) AND t.level = 'Varsity'
        ORDER BY ts.season, t.division, ts.overall_wins DESC`

      const winLossSeasons: WinLossSeason[] = ALL_SEASONS.map(yr => ({
        season: yr,
        teams: rows.filter(r => String(r.season) === yr).map(r => ({
          name: String(r.name), division: String(r.division),
          wins: Number(r.wins), losses: Number(r.losses),
        })),
      }))
      seasonRows = Object.fromEntries(ALL_SEASONS.map(yr => [yr,
        rows.filter(r => String(r.season) === yr)
          .map(r => ({ name: String(r.name), value: Number(r.wins), logoUrl: SCHOOL_LOGOS[String(r.school_slug)] ?? '' }))
      ]))
      tableRows = seasonRows[String(CURRENT_SEASON)] ?? []
      kpiValue = tableRows.length
      chartChild = <SportsWinLossBar seasons={winLossSeasons} />
      break
    }

    // ── strength-of-schedule ──────────────────────────────────────────────────
    case 'strength-of-schedule': {
      const rows = await sql`
        WITH pairs AS (
          SELECT home_team_slug AS team_slug, away_team_slug AS opp_slug, season FROM games WHERE home_score IS NOT NULL AND season = ANY(${AVAILABLE_SEASONS})
          UNION ALL SELECT away_team_slug, home_team_slug, season FROM games WHERE home_score IS NOT NULL AND season = ANY(${AVAILABLE_SEASONS})
        )
        SELECT t.name, t.school_slug, gp.season::text AS season,
          ROUND(AVG(ts.overall_wins::float / NULLIF(ts.overall_wins + ts.overall_losses, 0)) * 100)::int AS value
        FROM pairs gp JOIN teams t ON t.slug = gp.team_slug
        JOIN teams opp ON opp.slug = gp.opp_slug
        JOIN team_season_stats ts ON ts.team_slug = gp.opp_slug AND ts.season = gp.season
        WHERE t.level = 'Varsity'
        GROUP BY t.name, t.school_slug, gp.season ORDER BY gp.season, value DESC`

      const seasonBarsArr = buildSeasonBars(rows as { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[], ALL_SEASONS)
      // "All": average SoS per team across all seasons
      const sosAllMap = new Map<string, { name: string; total: number; count: number; logoUrl: string }>()
      for (const s of seasonBarsArr) {
        for (const b of s.bars) {
          const ex = sosAllMap.get(b.name)
          if (ex) { ex.total += b.value; ex.count++ }
          else sosAllMap.set(b.name, { name: b.name, total: b.value, count: 1, logoUrl: b.logoUrl ?? '' })
        }
      }
      const allBars = [...sosAllMap.values()]
        .map(t => ({ name: t.name, value: Math.round(t.total / t.count), logoUrl: t.logoUrl }))
        .sort((a, b) => b.value - a.value)
      seasonBarsArr.push({ season: 'all', topValue: allBars[0]?.value ?? 0, bars: allBars })

      seasonRows = Object.fromEntries(seasonBarsArr.map(s => [s.season, s.bars]))
      tableRows = seasonRows[String(CURRENT_SEASON)] ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = <SportsBarChartInteractive seasons={seasonBarsArr} color={config.color} valueLabel="SoS %" showAvgLine />
      break
    }

    default:
      notFound()
  }

  return (
    <ChartDetailPage
      config={config}
      prevSlug={prevSlug}
      nextSlug={nextSlug}
      kpiValue={kpiValue}
      tableRows={tableRows}
      multiPoints={multiPoints}
      subRows={subRows}
      rowLinks={rowLinks}
      seasonFilters={seasonFilters}
      seasonRows={seasonRows}
      valueLabel={slug === 'wins-by-school' ? '3YR Total Wins' : slug === 'season-records' ? 'Wins' : undefined}
      showRank={slug === 'wins-by-school' || slug === 'season-records'}
    >
      {chartChild}
    </ChartDetailPage>
  )
}
