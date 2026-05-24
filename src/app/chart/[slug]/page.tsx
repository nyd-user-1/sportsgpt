import { notFound } from 'next/navigation'
import { getChartConfig, getAdjacentSlugs } from '@/lib/chart-configs'
import { fetchPassingYardsLeaders, fetchPassingTdsLeaders, fetchSingleGamePassing } from '@/lib/chart-data/passing'
import { fetchRushingYardsLeaders, fetchRushingTdsLeaders, fetchSingleGameRushing } from '@/lib/chart-data/rushing'
import { fetchReceivingYardsLeaders, fetchReceivingTdsLeaders } from '@/lib/chart-data/receiving'
import { fetchTotalTdsLeaders, fetchTotalYardsLeaders, fetchTotalPointsLeaders } from '@/lib/chart-data/composite'
import { fetchPFPA, fetchPointDifferential, fetchScoringOffense, fetchScoringDefense, fetchTopScoringGames, fetchBiggestBlowouts } from '@/lib/chart-data/scoring'
import { fetchSeasonRecords, fetchHomeAwayRecord, fetchWinLossDivision, fetchWinPercentage, fetchWinningStreaks, fetchLosingStreaks } from '@/lib/chart-data/wins'
import { fetchStrengthOfSchedule } from '@/lib/chart-data/schedule'
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
    'scoring-offense':            [...ALL_SEASONS, 'all'],
    'scoring-defense':            [...ALL_SEASONS, 'all'],
    'top-scoring-games':          LAST3_SEASONS,
    'biggest-blowouts':           LAST3_SEASONS,
    'single-game-rushing':        LAST3_SEASONS,
    'single-game-passing':        LAST3_SEASONS,
  }
  seasonFilters = SEASON_FILTER_MAP[slug]
  let subRows: SubRowMap | undefined = undefined
  let rowLinks: Record<string, string> | undefined = undefined

  switch (slug) {

    // ── season-records ─────────────────────────────────────────────────────────
    case 'season-records': {
      const recordRows = await fetchSeasonRecords(AVAILABLE_SEASONS)

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
      const rows = await fetchSeasonRecords(SEASONS_WITH_2020)

      // Index wins/losses/ties per team per season
      const byTeam: Record<string, Record<string, { w: number; l: number; t: number }>> = {}
      const schoolSlugs: Record<string, string> = {}
      const teamSlugs: Record<string, string> = {}
      for (const r of rows) {
        const name = r.name
        const season = String(r.season)
        if (!byTeam[name]) byTeam[name] = {}
        byTeam[name][season] = { w: r.wins, l: r.losses, t: r.ties }
        schoolSlugs[name] = r.school_slug
        teamSlugs[name] = r.team_slug
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
      const rows = await fetchPointDifferential(AVAILABLE_SEASONS.slice(-3))
      const seasonBars = LAST3_SEASONS.map(yr => {
        const yrows = rows
          .filter(r => String(r.season) === yr)
          .sort((a, b) => b.value - a.value)
          .slice(0, 52)
          .map(r => ({
            name: r.name,
            value: r.value,
            logoUrl: SCHOOL_LOGOS[r.school_slug] ?? '',
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
      const rows = await fetchPassingYardsLeaders(AVAILABLE_SEASONS)
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
      const rows = await fetchPassingTdsLeaders(AVAILABLE_SEASONS)
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
      const rows = await fetchRushingYardsLeaders(AVAILABLE_SEASONS)
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
      const rows = await fetchRushingTdsLeaders(AVAILABLE_SEASONS)
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
      const rows = await fetchReceivingYardsLeaders(AVAILABLE_SEASONS)
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
      const rows = await fetchReceivingTdsLeaders(AVAILABLE_SEASONS)
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
      const rows = await fetchTotalTdsLeaders(AVAILABLE_SEASONS)
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
      const rows = await fetchTotalYardsLeaders(AVAILABLE_SEASONS)
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
      const rows = await fetchTotalPointsLeaders(AVAILABLE_SEASONS)
      const seasonBars = buildSeasonBars(
        rows as { name: unknown; value: unknown; season: unknown; school_slug?: unknown }[],
        ALL_SEASONS
      )
      tableRows = seasonBars.find(s => s.season === String(CURRENT_SEASON))?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = <SportsAreaGradient seasons={seasonBars} valueLabel="Points" />
      break
    }

    // ── home-away-record ──────────────────────────────────────────────────────
    case 'home-away-record': {
      const rows = await fetchHomeAwayRecord(AVAILABLE_SEASONS)

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
      const rows = await fetchPFPA(AVAILABLE_SEASONS)

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
      const rows = await fetchWinLossDivision(AVAILABLE_SEASONS)

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
      const rows = await fetchStrengthOfSchedule(AVAILABLE_SEASONS)

      const seasonBarsArr = buildSeasonBars(rows as never[], ALL_SEASONS)
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

    // ── scoring-offense ───────────────────────────────────────────────────────
    case 'scoring-offense': {
      const rows = await fetchScoringOffense(AVAILABLE_SEASONS)
      const seasonBarsArr = buildSeasonBars(rows as never[], ALL_SEASONS)
      const allBars = seasonBarsArr.flatMap(s => s.bars).sort((a, b) => b.value - a.value)
      seasonBarsArr.push({ season: 'all', topValue: allBars[0]?.value ?? 0, bars: allBars })
      seasonRows = Object.fromEntries(seasonBarsArr.map(s => [s.season, s.bars]))
      tableRows = seasonRows[String(CURRENT_SEASON)] ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = <SportsBarChartInteractive seasons={seasonBarsArr} color={config.color} valueLabel="Avg Pts/Game" />
      break
    }

    // ── scoring-defense ───────────────────────────────────────────────────────
    case 'scoring-defense': {
      const rows = await fetchScoringDefense(AVAILABLE_SEASONS)
      const defenseSeasonBars: SeasonBars[] = ALL_SEASONS.map(yr => {
        const yrows = rows
          .filter(r => r.season === yr)
          .sort((a, b) => a.value - b.value)
          .slice(0, 52)
          .map(r => ({
            name: r.name,
            value: r.value,
            logoUrl: SCHOOL_LOGOS[r.school_slug] ?? '',
          }))
        return { season: yr, topValue: yrows[0]?.value ?? 0, bars: yrows }
      })
      const allDefBars = [...rows]
        .sort((a, b) => a.value - b.value)
        .reduce((acc: typeof defenseSeasonBars[0]['bars'], r) => {
          const ex = acc.find(b => b.name === r.name)
          if (!ex) acc.push({ name: r.name, value: r.value, logoUrl: SCHOOL_LOGOS[r.school_slug] ?? '' })
          return acc
        }, [])
      defenseSeasonBars.push({ season: 'all', topValue: allDefBars[0]?.value ?? 0, bars: allDefBars })

      seasonRows = Object.fromEntries(defenseSeasonBars.map(s => [s.season, s.bars]))
      tableRows = seasonRows[String(CURRENT_SEASON)] ?? []
      kpiValue = tableRows[0]?.value ?? 0
      chartChild = <SportsBarChartInteractive seasons={defenseSeasonBars} color="#10b981" valueLabel="Avg Pts Allowed" />
      break
    }

    // ── top-scoring-games ─────────────────────────────────────────────────────
    case 'top-scoring-games': {
      const rows = await fetchTopScoringGames(AVAILABLE_SEASONS.slice(-3))
      const stripVF = (s: string) => s.replace(/\s+Varsity Football$/i, '')
      const scoringGameBars: SeasonBars[] = LAST3_SEASONS.map(yr => {
        const bars = rows
          .filter(r => r.season === yr)
          .slice(0, 25)
          .map(r => ({
            name: `${stripVF(r.home)} vs ${stripVF(r.away)}`,
            value: r.total,
            subtitle: `${r.home_score}–${r.away_score} · ${formatSeason(yr)}`,
            logoUrl:  SCHOOL_LOGOS[r.home_school] ?? '',
            logoUrl2: SCHOOL_LOGOS[r.away_school] ?? '',
          }))
        return { season: yr, topValue: bars[0]?.value ?? 0, bars }
      })
      tableRows = scoringGameBars.find(s => s.season === String(CURRENT_SEASON))?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      seasonRows = Object.fromEntries(scoringGameBars.map(s => [s.season, s.bars]))
      chartChild = <SportsBarChartInteractive seasons={scoringGameBars} color={config.color} valueLabel="Combined Pts" />
      break
    }

    // ── biggest-blowouts ──────────────────────────────────────────────────────
    case 'biggest-blowouts': {
      const rows = await fetchBiggestBlowouts(AVAILABLE_SEASONS.slice(-3))
      const stripVF = (s: string) => s.replace(/\s+Varsity Football$/i, '')
      const blowoutBars: SeasonBars[] = LAST3_SEASONS.map(yr => {
        const bars = rows
          .filter(r => r.season === yr)
          .slice(0, 25)
          .map(r => ({
            name: `${stripVF(r.winner)} def. ${stripVF(r.loser)}`,
            value: r.margin,
            subtitle: `${r.winner_score}–${r.loser_score} · ${formatSeason(yr)}`,
            logoUrl:  SCHOOL_LOGOS[r.winner_school] ?? '',
            logoUrl2: SCHOOL_LOGOS[r.loser_school]  ?? '',
          }))
        return { season: yr, topValue: bars[0]?.value ?? 0, bars }
      })
      tableRows = blowoutBars.find(s => s.season === String(CURRENT_SEASON))?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      seasonRows = Object.fromEntries(blowoutBars.map(s => [s.season, s.bars]))
      chartChild = <SportsBarChartInteractive seasons={blowoutBars} color={config.color} valueLabel="Point Margin" />
      break
    }

    // ── single-game-rushing ───────────────────────────────────────────────────
    case 'single-game-rushing': {
      const BOX_SEASONS = LAST3_SEASONS
      const rows = await fetchSingleGameRushing(AVAILABLE_SEASONS.slice(-3))
      const rushingGameBars: SeasonBars[] = BOX_SEASONS.map(yr => {
        const bars = rows
          .filter(r => String(r.season) === yr)
          .slice(0, 25)
          .map(r => ({
            name: r.player,
            value: r.yds,
            subtitle: (r.team_name ?? '') + ' · ' + formatSeason(yr),
          }))
        return { season: yr, topValue: bars[0]?.value ?? 0, bars }
      })
      tableRows = rushingGameBars.find(s => s.season === String(CURRENT_SEASON))?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      seasonRows = Object.fromEntries(rushingGameBars.map(s => [s.season, s.bars]))
      chartChild = <SportsBarChartInteractive seasons={rushingGameBars} color={config.color} valueLabel="Rush Yards" />
      break
    }

    // ── single-game-passing ───────────────────────────────────────────────────
    case 'single-game-passing': {
      const BOX_SEASONS = LAST3_SEASONS
      const rows = await fetchSingleGamePassing(AVAILABLE_SEASONS.slice(-3))
      const passingGameBars: SeasonBars[] = BOX_SEASONS.map(yr => {
        const bars = rows
          .filter(r => String(r.season) === yr)
          .slice(0, 25)
          .map(r => ({
            name: r.player,
            value: r.yds,
            subtitle: (r.team_name ?? '') + ' · ' + formatSeason(yr),
          }))
        return { season: yr, topValue: bars[0]?.value ?? 0, bars }
      })
      tableRows = passingGameBars.find(s => s.season === String(CURRENT_SEASON))?.bars ?? []
      kpiValue = tableRows[0]?.value ?? 0
      seasonRows = Object.fromEntries(passingGameBars.map(s => [s.season, s.bars]))
      chartChild = <SportsBarChartInteractive seasons={passingGameBars} color={config.color} valueLabel="Pass Yards" />
      break
    }

    // ── win-percentage ────────────────────────────────────────────────────────
    case 'win-percentage': {
      const rows = await fetchWinPercentage()
      tableRows = rows.map(r => ({
        name:    r.name,
        value:   r.value,
        logoUrl: SCHOOL_LOGOS[r.school_slug] ?? '',
      }))
      kpiValue = tableRows[0]?.value ?? 0
      rowLinks = Object.fromEntries(rows.map(r => [r.name, `/team/${r.school_slug}-varsity-football`]))
      chartChild = <SportsBarChart data={tableRows.slice(0, 20)} color={config.color} valueLabel="Win %" />
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
      showRank={slug === 'wins-by-school' || slug === 'season-records' || slug === 'win-percentage'}
    >
      {chartChild}
    </ChartDetailPage>
  )
}
