/**
 * Batch roster scraper — all teams × all seasons.
 * Run: node scripts/scrape-all-rosters.mjs
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'

const DELAY_MS = 800

// [newsday-slug, school-slug]
const TEAMS = [
  // Div I
  ['bay-shore',         'bay-shore'],
  ['brentwood',         'brentwood'],
  ['central-islip',     'central-islip'],
  ['commack',           'commack'],
  ['connetquot',        'connetquot'],
  ['floyd',             'floyd'],
  ['lindenhurst',       'lindenhurst'],
  ['longwood',          'longwood'],
  ['patchogue-medford', 'patchogue-medford'],
  ['riverhead',         'riverhead'],
  ['sachem-east',       'sachem-east'],
  ['sachem-north',      'sachem-north'],
  ['ward-melville',     'ward-melville'],
  ['whitman',           'whitman'],
  // Div II
  ['bellport',              'bellport'],
  ['centereach',            'centereach'],
  ['copiague',              'copiague'],
  ['deer-park',             'deer-park'],
  ['east-islip',            'east-islip'],
  ['half-hollow-hills-east','half-hollow-hills-east'],
  ['huntington',            'huntington'],
  ['newfield',              'newfield'],
  ['north-babylon',         'north-babylon'],
  ['northport',             'northport'],
  ['smithtown-east',        'smithtown-east'],
  ['smithtown-west',        'smithtown-west'],
  ['west-babylon',          'west-babylon'],
  ['west-islip',            'west-islip'],
  // Div III
  ['amityville',            'amityville'],
  ['comsewogue',            'comsewogue'],
  ['east-hampton',          'east-hampton-bridgehampton-pierson'],
  ['eastport-south-manor',  'eastport-south-manor'],
  ['harborfields',          'harborfields'],
  ['hauppauge',             'hauppauge'],
  ['half-hollow-hills-west','half-hollow-hills-west'],
  ['islip',                 'islip'],
  ['kings-park',            'kings-park'],
  ['rocky-point',           'rocky-point'],
  ['sayville',              'sayville'],
  ['westhampton',           'westhampton'],
  // Div IV
  ['babylon',                      'babylon'],
  ['bayport-blue-point',           'bayport-blue-point'],
  ['center-moriches',              'center-moriches'],
  ['glenn',                        'glenn'],
  ['greenport-southold-mattituck', 'greenport-southold-mattituck'],
  ['hampton-bays',                 'hampton-bays'],
  ['miller-place',                 'miller-place'],
  ['mt-sinai',                     'mt-sinai'],
  ['port-jefferson',               'port-jefferson'],
  ['shoreham-wading-river',        'shoreham-wading-river'],
  ['southampton',                  'southampton'],
  ['wyandanch',                    'wyandanch'],
]

const SEASONS = [2025, 2024, 2023, 2022, 2021]

const sleep = ms => new Promise(r => setTimeout(r, ms))

mkdirSync('./scripts/scraped/rosters', { recursive: true })

async function main() {
  let total = 0, skipped = 0, errors = 0

  for (const season of SEASONS) {
    console.log(`\n${'='.repeat(50)}`)
    console.log(`SEASON ${season}-${String(season+1).slice(2)}`)
    console.log('='.repeat(50))

    for (const [newsday, school] of TEAMS) {
      const outFile = `./scripts/scraped/rosters/${newsday}-${season}.json`
      if (existsSync(outFile)) {
        process.stdout.write(`  SKIP  ${newsday}-${season}\n`)
        skipped++
        continue
      }

      process.stdout.write(`  scraping ${newsday}-${season} ... `)
      try {
        execSync(`node scripts/scrape-rosters.mjs ${newsday} ${season}`, { stdio: 'pipe' })
        process.stdout.write('✓\n')
        total++
      } catch (e) {
        process.stdout.write(`✗ (${e.stderr?.toString().trim().slice(0,60)})\n`)
        errors++
      }
      await sleep(DELAY_MS)
    }
  }

  console.log(`\n── Done ──────────────────────────────`)
  console.log(`  Scraped : ${total}`)
  console.log(`  Skipped : ${skipped}`)
  console.log(`  Errors  : ${errors}`)
}

main().catch(console.error)
