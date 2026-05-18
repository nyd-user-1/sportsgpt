/**
 * TEST SCRIPT: Scrape Ward Melville 2025 box scores from Newsday
 *
 * Step 1 — team page  → extract game IDs + schedule
 * Step 2 — game pages → extract quarter scores, top performers,
 *                        highlights, and per-player stats
 *                        (Rushing / Passing / Receiving / Kicking / Defense)
 *
 * Output: scripts/ward-melville-2025-test.json  (inspect before any DB write)
 *
 * Run: node --env-file=.env.local scripts/scrape-boxscores-test.mjs
 */

import * as cheerio from 'cheerio'
import { writeFileSync } from 'fs'

const BASE        = 'https://scores.newsday.com'
const TEAM_SLUG   = 'ward-melville'
const DELAY_MS    = 1500   // polite delay between requests

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

// ── Step 1: team schedule page ────────────────────────────────────────────────

async function getTeamGames(slug) {
  const url = `${BASE}/sports/highschool/team/football/${slug}`
  console.log(`Fetching team page: ${url}`)
  const html = await fetchHtml(url)
  const $    = cheerio.load(html)

  const games = []
  $('tr.fin').each((_, row) => {
    const cells       = $(row).find('td')
    const date        = cells.eq(0).text().trim()             // "09/12/2025"
    const oppRaw      = cells.eq(1).text().trim()             // "Longwood" or "at Bay Shore"
    const isAway      = oppRaw.startsWith('at ')
    const opponent    = isAway ? oppRaw.slice(3).trim() : oppRaw

    // Score link lives inside span.win or span.loss
    const resultSpan  = $(row).find('span.win, span.loss, span.tie')
    const anchor      = resultSpan.find('a')
    const href        = anchor.attr('href') ?? ''
    const scoreText   = anchor.text().trim()                  // "35 - 7"
    const result      = $(row).find('span.win').length  ? 'W'
                      : $(row).find('span.loss').length ? 'L' : 'T'

    const idMatch = href.match(/\/game\/football\/(\d+)/)
    const gameId  = idMatch?.[1] ?? null

    const m      = scoreText.match(/(\d+)\s*-\s*(\d+)/)
    const myScore  = m ? +m[1] : null
    const oppScore = m ? +m[2] : null

    games.push({ date, opponent, isAway, result, myScore, oppScore, gameId })
  })

  return games
}

// ── Step 2: individual game box score ─────────────────────────────────────────

function parseStatTable($, table, statType) {
  // Returns [{ team, player, ...cols }]
  const rows = []
  let currentTeam = null

  $(table).find('tr').each((_, tr) => {
    const ths = $(tr).find('th')
    const tds = $(tr).find('td')

    if (ths.length >= 2) {
      // Header row — first th is the team name, rest are column labels
      currentTeam = ths.eq(0).text().trim()
      return  // skip; we'll use the headers from the first table header we encounter
    }
    if (tds.length < 2) return

    const playerAnchor = tds.eq(0).find('a')
    const player = (playerAnchor.length ? playerAnchor : tds.eq(0)).text().trim()
    if (!player) return

    const entry = { team: currentTeam, player }

    if (statType === 'rushing') {
      entry.att = +tds.eq(1).text() || 0
      entry.yds = +tds.eq(2).text() || 0
      entry.tds = +tds.eq(3).text() || 0
    } else if (statType === 'passing') {
      entry.att  = +tds.eq(1).text() || 0
      entry.comp = +tds.eq(2).text() || 0
      entry.yds  = +tds.eq(3).text() || 0
      entry.tds  = +tds.eq(4).text() || 0
      entry.int  = +tds.eq(5).text() || 0
    } else if (statType === 'receiving') {
      entry.rec = +tds.eq(1).text() || 0
      entry.yds = +tds.eq(2).text() || 0
      entry.tds = +tds.eq(3).text() || 0
      entry.pat = +tds.eq(4).text() || 0
    } else if (statType === 'kicking') {
      entry.fg     = +tds.eq(1).text() || 0
      entry.pat    = +tds.eq(2).text() || 0
      entry.points = +tds.eq(3).text() || 0
    } else if (statType === 'defense') {
      entry.int    = +tds.eq(1).text() || 0
      entry.sacks  = +tds.eq(2).text() || 0
      entry.fumbles = +tds.eq(3).text() || 0
    }

    rows.push(entry)
  })

  return rows
}

async function scrapeBoxScore(gameId) {
  const url = `${BASE}/sports/highschool/game/football/${gameId}`
  const html = await fetchHtml(url)
  const $    = cheerio.load(html)

  // Title + date/location
  const title       = $('h1').first().text().trim()
  const dateLine    = $('h1').first().next('p').text().trim()

  // Quarter scores — first table on the page
  const quarterRows = []
  $('table').first().find('tbody tr').each((_, row) => {
    const cells = $(row).find('td, th')
    const team  = cells.eq(0).find('a').text().trim() || cells.eq(0).text().trim()
    const q1    = cells.eq(1).text().trim()
    const q2    = cells.eq(2).text().trim()
    const q3    = cells.eq(3).text().trim()
    const q4    = cells.eq(4).text().trim()
    const ot1   = cells.eq(5).text().trim()
    const ot2   = cells.eq(6).text().trim()
    const ot3   = cells.eq(7).text().trim()
    const final = cells.eq(8).text().trim()
    if (team) quarterRows.push({ team, q1, q2, q3, q4, ot1, ot2, ot3, final })
  })

  // Top performers paragraph
  let topPerformers = ''
  $('*').each((_, el) => {
    const text = $(el).text()
    if ($(el).children().length === 0 && text.includes('Top performers')) {
      topPerformers = $(el).next().text().trim() || text.trim()
    }
  })
  // fallback: look for the heading then take its following text sibling
  if (!topPerformers) {
    const tp = $('p, div, h3, h4').filter((_, el) => $(el).text().trim() === 'Top performers')
    topPerformers = tp.next().text().trim()
  }

  // Highlights
  let highlights = ''
  $('h2, h3').filter((_, el) => /HIGHLIGHTS/i.test($(el).text())).each((_, el) => {
    highlights = $(el).next('p').text().trim()
  })

  // Player stat tables — identify by column headers
  const stats = { rushing: [], passing: [], receiving: [], kicking: [], defense: [] }
  $('table').each((i, table) => {
    if (i === 0) return  // skip scoreboard

    const headers = $(table).find('th').map((_, th) => $(th).text().trim().toLowerCase()).get()

    if (headers.includes('att') && headers.includes('yds') && headers.includes('tds') && !headers.includes('comps') && !headers.includes('comp')) {
      stats.rushing.push(...parseStatTable($, table, 'rushing'))
    } else if (headers.includes('comps') || headers.includes('comp')) {
      stats.passing.push(...parseStatTable($, table, 'passing'))
    } else if (headers.includes('rec')) {
      stats.receiving.push(...parseStatTable($, table, 'receiving'))
    } else if (headers.includes('fg') && headers.includes('points')) {
      stats.kicking.push(...parseStatTable($, table, 'kicking'))
    } else if (headers.includes('sacks')) {
      stats.defense.push(...parseStatTable($, table, 'defense'))
    }
  })

  return { gameId, title, dateLine, quarterRows, topPerformers, highlights, stats }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Ward Melville 2025 Box Score Scraper (TEST) ===\n')

  const games = await getTeamGames(TEAM_SLUG)
  console.log(`\nFound ${games.length} completed games:`)
  games.forEach(g => console.log(`  ${g.date}  ${g.isAway ? 'at ' : '   '}${g.opponent.padEnd(20)} ${g.result} ${g.myScore}-${g.oppScore}  game/${g.gameId}`))

  const results = []
  for (const game of games) {
    if (!game.gameId) {
      console.log(`\n  SKIP — no gameId for ${game.date} vs ${game.opponent}`)
      results.push({ ...game, error: 'no gameId' })
      continue
    }

    await sleep(DELAY_MS)
    console.log(`\nScraping game/${game.gameId} — ${game.date} ${game.opponent}`)
    try {
      const box = await scrapeBoxScore(game.gameId)
      console.log(`  ✓ Quarter rows: ${box.quarterRows.length}`)
      console.log(`  ✓ Rushing rows: ${box.stats.rushing.length}`)
      console.log(`  ✓ Passing rows: ${box.stats.passing.length}`)
      console.log(`  ✓ Receiving rows: ${box.stats.receiving.length}`)
      console.log(`  ✓ Kicking rows: ${box.stats.kicking.length}`)
      console.log(`  ✓ Defense rows: ${box.stats.defense.length}`)
      results.push({ ...game, box })
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`)
      results.push({ ...game, error: err.message })
    }
  }

  const outPath = './scripts/ward-melville-2025-test.json'
  writeFileSync(outPath, JSON.stringify(results, null, 2))
  console.log(`\n✓ Output written to ${outPath}`)
  console.log(`  Inspect the JSON before any DB writes.`)
}

main().catch(console.error)
