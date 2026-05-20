/**
 * Roster scraper for any Newsday team/season.
 *
 * Usage:
 *   node scripts/scrape-rosters.mjs <newsday-slug> [season]
 *
 * Examples:
 *   node scripts/scrape-rosters.mjs east-islip 2025
 *   node scripts/scrape-rosters.mjs ward-melville
 *
 * Output: scripts/scraped/rosters/<slug>-<season>.json
 */

import * as cheerio from 'cheerio'
import { writeFileSync, mkdirSync } from 'fs'

const BASE = 'https://scores.newsday.com'

const slug   = process.argv[2]
const season = process.argv[3] ?? '2025'

if (!slug) {
  console.error('Usage: node scripts/scrape-rosters.mjs <newsday-slug> [season]')
  process.exit(1)
}

async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
    }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.text()
}

async function main() {
  const seasonSuffix = season === '2025' ? '' : `/${parseInt(season) + 1}`
  const url = `${BASE}/sports/highschool/team/football/${slug}${seasonSuffix}`
  console.log(`Fetching: ${url}`)

  const html = await fetchHtml(url)
  const $    = cheerio.load(html)

  const players = []

  $('table.roster tr').each((i, row) => {
    if (i === 0) return // skip header

    const cells  = $(row).find('td')
    const link   = cells.eq(0).find('a')
    const name   = link.text().trim()
    if (!name) return

    const href   = link.attr('href') ?? ''
    const match  = href.match(/\/player\/football\/(\d+)\/(\d+)/)
    const newsday_entry_id = match ? parseInt(match[1]) : null

    const cls    = cells.eq(1).text().trim() || null
    const pos    = cells.eq(2).text().trim() || null
    const numRaw = cells.eq(3).text().trim()
    const number = numRaw ? parseInt(numRaw) : null

    players.push({ name, newsday_entry_id, class: cls, position: pos, jersey_number: number })
  })

  console.log(`Found ${players.length} players`)
  players.forEach(p => console.log(`  #${p.jersey_number ?? '?'} ${p.name} (${p.position ?? '—'})`))


  mkdirSync('./scripts/scraped/rosters', { recursive: true })
  const outFile = `./scripts/scraped/rosters/${slug}-${season}.json`
  writeFileSync(outFile, JSON.stringify({ slug, season: parseInt(season), players }, null, 2))
  console.log(`\n✓ Written to ${outFile}`)
}

main().catch(err => { console.error(err.message); process.exit(1) })
