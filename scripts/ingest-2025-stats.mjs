/**
 * ingest-2025-stats.mjs — Ingest 2025-26 player season stats (season=2025 in DB)
 * Source: Newsday 2025 statistical leaders
 *
 * Usage: node --env-file=.env.local scripts/ingest-2025-stats.mjs
 */

import pg from 'pg'

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const SCHOOL_NAME_TO_SLUG = {
  'Floyd':                          'floyd',
  'Babylon':                        'babylon',
  'East Islip':                     'east-islip',
  'Smithtown West':                 'smithtown-west',
  'Brentwood':                      'brentwood',
  'Half Hollow Hills East':         'half-hollow-hills-east',
  'North Babylon':                  'north-babylon',
  'Bayport-Blue Point':             'bayport-blue-point',
  'Mt. Sinai':                      'mt-sinai',
  'Huntington':                     'huntington',
  'Hauppauge':                      'hauppauge',
  'Glenn':                          'glenn',
  'Ward Melville':                  'ward-melville',
  'Kings Park':                     'kings-park',
  'Patchogue-Medford':              'patchogue-medford',
  'Sayville':                       'sayville',
  'Centereach':                     'centereach',
  'Longwood':                       'longwood',
  'Connetquot':                     'connetquot',
  'Westhampton':                    'westhampton',
  'Miller Place':                   'miller-place',
  'Northport':                      'northport',
  'Islip':                          'islip',
  'Commack':                        'commack',
  'Shoreham-Wading River':          'shoreham-wading-river',
  'Sachem North':                   'sachem-north',
  'Half Hollow Hills West':         'half-hollow-hills-west',
  'West Islip':                     'west-islip',
  'Smithtown East':                 'smithtown-east',
  'Bellport':                       'bellport',
  'Lindenhurst':                    'lindenhurst',
  'East Hampton / Bridgehampton':   'east-hampton-bridgehampton-pierson',
  'Whitman':                        'whitman',
  'Deer Park':                      'deer-park',
  'Copiague':                       'copiague',
  'Harborfields':                   'harborfields',
  'Eastport-South Manor':           'eastport-south-manor',
}

// ── 2025-26 data ──────────────────────────────────────────────────────────────

const RUSHING = [
  { rank:  1, name: "Ja'Quan Thomas",    school: 'Floyd',                     att: 187, yds: 2082, td: 31 },
  { rank:  2, name: 'Aidan Winter',      school: 'Babylon',                   att: 149, yds: 2043, td: 27 },
  { rank:  3, name: 'Jake Simmons',      school: 'East Islip',                att: 290, yds: 2032, td: 22 },
  { rank:  4, name: 'Michael Cascione', school: 'Smithtown West',             att: 190, yds: 1650, td: 20 },
  { rank:  5, name: 'Cris Peralta',      school: 'Brentwood',                 att: 232, yds: 1585, td: 21 },
  { rank:  6, name: 'Daniel White',      school: 'Half Hollow Hills East',    att: 129, yds: 1460, td: 13 },
  { rank:  7, name: 'Dominic Prestano',  school: 'North Babylon',             att: 189, yds: 1339, td: 18 },
  { rank:  8, name: 'Colin Clark',       school: 'Bayport-Blue Point',        att: 182, yds: 1333, td: 20 },
  { rank:  9, name: 'Dontae Spadaro',    school: 'Mt. Sinai',                 att: 144, yds: 1314, td: 11 },
  { rank: 10, name: 'Yasir Jones',       school: 'Huntington',                att: 174, yds: 1258, td: 22 },
  { rank: 11, name: 'Jayden Bryan',      school: 'Half Hollow Hills East',    att: 82,  yds: 1202, td: 17 },
  { rank: 12, name: "Liam O'Connor",     school: 'Hauppauge',                 att: 150, yds: 1145, td: 17 },
  { rank: 13, name: 'Joe Competiello',   school: 'Glenn',                     att: 106, yds: 1142, td: 14 },
  { rank: 14, name: 'Joe Benedetto',     school: 'Ward Melville',             att: 161, yds: 1133, td: 20 },
  { rank: 15, name: 'Aidan Barbosa',     school: 'Kings Park',                att: 129, yds: 1123, td: 14 },
  { rank: 16, name: 'Colin Reyer',       school: 'Bayport-Blue Point',        att: 172, yds: 1113, td: 14 },
  { rank: 17, name: 'Aidyn Modeste',     school: 'Patchogue-Medford',         att: 168, yds: 1083, td: 14 },
  { rank: 18, name: 'Patrick Coan',      school: 'Sayville',                  att: 133, yds: 1082, td: 13 },
  { rank: 19, name: 'Jake Mikochik',     school: 'Centereach',                att: 203, yds: 1073, td:  6 },
  { rank: 20, name: 'Kyon Sarwari',      school: 'Longwood',                  att: 162, yds:  971, td: 13 },
  { rank: 21, name: 'Kai Jankow',        school: 'Babylon',                   att: 107, yds:  966, td: 11 },
  { rank: 22, name: 'Javon Barnwell',    school: 'Connetquot',                att: 143, yds:  950, td:  7 },
  { rank: 23, name: 'Timmy Holahan',     school: 'Sayville',                  att: 145, yds:  876, td: 11 },
  { rank: 24, name: 'Nic Simone',        school: 'Westhampton',               att: 135, yds:  864, td: 12 },
  { rank: 25, name: 'Camryn Hardy',      school: 'Miller Place',              att: 97,  yds:  823, td:  7 },
]

const PASSING = [
  { rank:  1, name: 'Shane Kiernan',     school: 'Miller Place',              comp: 197, att: 253, yds: 2635, td: 34, int: 7 },
  { rank:  2, name: 'Jack Rao',          school: 'Islip',                     comp: 169, att: 243, yds: 2367, td: 29, int: 2 },
  { rank:  3, name: 'Hudson Philbrick',  school: 'Ward Melville',             comp: 112, att: 162, yds: 2000, td: 24, int: 2 },
  { rank:  4, name: 'Simon Blissett',    school: 'Northport',                 comp:  96, att: 149, yds: 1991, td: 23, int: 2 },
  { rank:  5, name: 'Patrick Coan',      school: 'Sayville',                  comp: 133, att: 178, yds: 1937, td: 25, int: 3 },
  { rank:  6, name: 'Nick DeVito',       school: 'Smithtown West',            comp: 106, att: 159, yds: 1680, td: 14, int: 4 },
  { rank:  7, name: 'Brandon Shapiro',   school: 'Kings Park',                comp: 108, att: 171, yds: 1678, td: 20, int: 9 },
  { rank:  8, name: 'Lincoln Riggs',     school: 'Commack',                   comp: 108, att: 168, yds: 1668, td: 16, int: 6 },
  { rank:  9, name: 'Jacob Guzik',       school: 'Huntington',                comp: 103, att: 136, yds: 1515, td: 16, int: 5 },
  { rank: 10, name: 'Noah Gregorek',     school: 'Shoreham-Wading River',     comp: 111, att: 193, yds: 1487, td: 19, int: 7 },
  { rank: 11, name: 'Luke LaRocca',      school: 'Sachem North',              comp:  94, att: 131, yds: 1351, td: 14, int: 5 },
  { rank: 12, name: 'Vincent Feraca',    school: 'Connetquot',                comp: 118, att: 193, yds: 1349, td:  9, int: 6 },
  { rank: 13, name: 'Luke Taff',         school: 'Half Hollow Hills West',    comp:  84, att: 160, yds: 1344, td: 10, int: 6 },
  { rank: 14, name: 'TJ Sonnenberg',     school: 'West Islip',                comp:  82, att: 114, yds: 1334, td: 15, int: 5 },
  { rank: 15, name: 'Antonio Marrone',   school: 'Smithtown East',            comp:  76, att: 123, yds: 1270, td: 13, int: 3 },
  { rank: 16, name: 'Max Sorrentino',    school: 'Mt. Sinai',                 comp:  56, att:  88, yds: 1198, td: 11, int: 5 },
  { rank: 17, name: 'Brett Rupolo',      school: 'Patchogue-Medford',         comp:  77, att: 117, yds: 1136, td:  4, int: 4 },
  { rank: 18, name: 'Mikey Russo',       school: 'Lindenhurst',               comp:  94, att: 142, yds: 1115, td: 12, int: 4 },
  { rank: 19, name: 'Nick Sevilla',      school: 'Half Hollow Hills East',    comp:  75, att:  76, yds: 1107, td: 12, int: 2 },
  { rank: 20, name: 'Nick LaChapelle',   school: 'Hauppauge',                 comp:  69, att: 127, yds: 1098, td:  7, int: 4 },
  { rank: 21, name: 'Joe Competiello',   school: 'Glenn',                     comp:  63, att:  99, yds: 1092, td: 12, int: 1 },
  { rank: 22, name: 'AJ Ierardi',        school: 'East Islip',                comp:  57, att: 100, yds: 1040, td: 12, int: 4 },
  { rank: 23, name: 'Theo Ball',         school: 'East Hampton / Bridgehampton', comp: 59, att: 90, yds: 1009, td: 13, int: 0 },
  { rank: 24, name: 'Braydon Cipp',      school: 'Bellport',                  comp:  65, att: 109, yds:  894, td:  9, int: 2 },
  { rank: 25, name: 'Colin Clark',       school: 'Bayport-Blue Point',        comp:  48, att:  78, yds:  857, td:  7, int: 0 },
]

const RECEIVING = [
  { rank:  1, name: 'AJ Rudolph',        school: 'Miller Place',              rec: 59, yds: 1010, td: 12 },
  { rank:  2, name: 'Matt Corrado',       school: 'Kings Park',                rec: 45, yds:  911, td: 10 },
  { rank:  3, name: 'Jack Kamenstein',    school: 'Huntington',                rec: 43, yds:  848, td: 10 },
  { rank:  4, name: 'Jake Rearick',       school: 'Smithtown West',            rec: 37, yds:  836, td:  7 },
  { rank:  5, name: 'Greyson Cabrera',    school: 'Northport',                 rec: 36, yds:  798, td:  9 },
  { rank:  6, name: 'Joe Karpowicz',      school: 'Ward Melville',             rec: 37, yds:  763, td:  9 },
  { rank:  7, name: 'Luke Neugebauer',    school: 'Sayville',                  rec: 38, yds:  738, td: 13 },
  { rank:  8, name: 'Brendan Cannon',     school: 'Miller Place',              rec: 45, yds:  684, td:  6 },
  { rank:  9, name: 'Conor Kenefick',     school: 'West Islip',                rec: 35, yds:  654, td:  9 },
  { rank: 10, name: 'Jake DeGennaro',     school: 'Islip',                     rec: 43, yds:  647, td:  5 },
  { rank: 11, name: 'Daniel Paolella',    school: 'Mt. Sinai',                 rec: 26, yds:  617, td:  9 },
  { rank: 12, name: 'Colin Darling',      school: 'Sayville',                  rec: 45, yds:  562, td:  4 },
  { rank: 13, name: 'Mason Ruocco',       school: 'Commack',                   rec: 34, yds:  550, td:  4 },
  { rank: 14, name: 'Gavin Engelhardt',   school: 'Half Hollow Hills West',    rec: 28, yds:  534, td:  5 },
  { rank: 15, name: 'George Greene',      school: 'Shoreham-Wading River',     rec: 41, yds:  530, td:  7 },
  { rank: 16, name: 'Joe Pistritto',      school: 'Hauppauge',                 rec: 24, yds:  528, td:  2 },
  { rank: 17, name: 'Alex Morales',       school: 'Islip',                     rec: 33, yds:  511, td: 12 },
  { rank: 18, name: 'Jack Halpin',        school: 'Islip',                     rec: 26, yds:  508, td:  7 },
  { rank: 19, name: 'Danny Miller',       school: 'Northport',                 rec: 19, yds:  505, td:  6 },
  { rank: 20, name: 'Jack Gardner',       school: 'Islip',                     rec: 42, yds:  503, td:  4 },
  { rank: 21, name: 'Elie Malcom',        school: 'Bellport',                  rec: 26, yds:  497, td:  6 },
  { rank: 22, name: 'James Huxtable',     school: 'Smithtown East',            rec: 35, yds:  482, td:  5 },
  { rank: 23, name: 'Jonathan Jean',      school: 'Smithtown East',            rec: 17, yds:  466, td:  6 },
  { rank: 24, name: 'Ryan Murgatroyd',    school: 'Lindenhurst',               rec: 29, yds:  453, td:  8 },
  { rank: 25, name: 'Nick Mastriano',     school: 'Connetquot',                rec: 37, yds:  442, td:  5 },
]

// ── main ──────────────────────────────────────────────────────────────────────

async function upsertPlayer(client, slug, name, schoolSlug, position) {
  await client.query(`
    INSERT INTO players (slug, name, school_slug, position)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  `, [slug, name, schoolSlug, position])
}

async function main() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    let rushing = 0, passing = 0, receiving = 0

    // Rushing
    for (const r of RUSHING) {
      const schoolSlug = SCHOOL_NAME_TO_SLUG[r.school]
      if (!schoolSlug) { console.warn(`Unknown school: ${r.school}`); continue }
      const slug = slugify(r.name)
      await upsertPlayer(client, slug, r.name, schoolSlug, 'RB')
      await client.query(`
        INSERT INTO player_season_stats (
          player_slug, player_name, school_slug, school_name, season, stat_type, section,
          season_rank, rush_attempts, rush_yards, rush_tds)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (player_slug, season, stat_type) DO UPDATE SET
          season_rank   = EXCLUDED.season_rank,
          rush_attempts = EXCLUDED.rush_attempts,
          rush_yards    = EXCLUDED.rush_yards,
          rush_tds      = EXCLUDED.rush_tds
      `, [slug, r.name, schoolSlug, r.school, 2025, 'Rushing', 'XI',
          r.rank, r.att, r.yds, r.td])
      rushing++
    }

    // Passing
    for (const r of PASSING) {
      const schoolSlug = SCHOOL_NAME_TO_SLUG[r.school]
      if (!schoolSlug) { console.warn(`Unknown school: ${r.school}`); continue }
      const slug = slugify(r.name)
      await upsertPlayer(client, slug, r.name, schoolSlug, 'QB')
      await client.query(`
        INSERT INTO player_season_stats (
          player_slug, player_name, school_slug, school_name, season, stat_type, section,
          season_rank, completions, attempts, pass_yards, pass_tds, interceptions)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (player_slug, season, stat_type) DO UPDATE SET
          season_rank   = EXCLUDED.season_rank,
          completions   = EXCLUDED.completions,
          attempts      = EXCLUDED.attempts,
          pass_yards    = EXCLUDED.pass_yards,
          pass_tds      = EXCLUDED.pass_tds,
          interceptions = EXCLUDED.interceptions
      `, [slug, r.name, schoolSlug, r.school, 2025, 'Passing', 'XI',
          r.rank, r.comp, r.att, r.yds, r.td, r.int])
      passing++
    }

    // Receiving
    for (const r of RECEIVING) {
      const schoolSlug = SCHOOL_NAME_TO_SLUG[r.school]
      if (!schoolSlug) { console.warn(`Unknown school: ${r.school}`); continue }
      const slug = slugify(r.name)
      await upsertPlayer(client, slug, r.name, schoolSlug, 'WR')
      await client.query(`
        INSERT INTO player_season_stats (
          player_slug, player_name, school_slug, school_name, season, stat_type, section,
          season_rank, receptions, recv_yards, recv_tds)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (player_slug, season, stat_type) DO UPDATE SET
          season_rank = EXCLUDED.season_rank,
          receptions  = EXCLUDED.receptions,
          recv_yards  = EXCLUDED.recv_yards,
          recv_tds    = EXCLUDED.recv_tds
      `, [slug, r.name, schoolSlug, r.school, 2025, 'Receiving', 'XI',
          r.rank, r.rec, r.yds, r.td])
      receiving++
    }

    await client.query('COMMIT')
    console.log(`✅ Rushing: ${rushing}, Passing: ${passing}, Receiving: ${receiving}`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Rolled back:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
