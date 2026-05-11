import { sql } from '@/lib/db'
import TeamTable, { type TeamRow } from './TeamTable'

export const dynamic = 'force-dynamic'

const PLACEHOLDER: TeamRow[] = [
  { id:  1, name: 'Ward Melville Patriots',          school: 'Ward Melville',          section: 'XI', division: 'I',   city: 'East Setauket',         county: 'Suffolk', wins: 9,  losses: 1, pf: 312, pa:  87, coach: 'Bill Donahue'     },
  { id:  2, name: 'Sachem North Flaming Arrows',      school: 'Sachem North',            section: 'XI', division: 'I',   city: 'Lake Ronkonkoma',       county: 'Suffolk', wins: 8,  losses: 2, pf: 278, pa: 142, coach: 'Kevin Homa'       },
  { id:  3, name: 'Sachem East Flaming Arrows',       school: 'Sachem East',             section: 'XI', division: 'I',   city: 'Farmingville',          county: 'Suffolk', wins: 7,  losses: 3, pf: 245, pa: 168, coach: 'Rob Shaver'       },
  { id:  4, name: 'Bay Shore Marauders',              school: 'Bay Shore',               section: 'XI', division: 'I',   city: 'Bay Shore',             county: 'Suffolk', wins: 6,  losses: 4, pf: 198, pa: 201, coach: 'Anthony Termini'  },
  { id:  5, name: 'Brentwood Indians',                school: 'Brentwood',               section: 'XI', division: 'I',   city: 'Brentwood',             county: 'Suffolk', wins: 5,  losses: 5, pf: 187, pa: 213, coach: 'Marco DiNapoli'   },
  { id:  6, name: 'Smithtown West Bulls',             school: 'Smithtown West',          section: 'XI', division: 'II',  city: 'Smithtown',             county: 'Suffolk', wins: 9,  losses: 1, pf: 301, pa: 112, coach: 'Jim Munson'        },
  { id:  7, name: 'Smithtown East Bulls',             school: 'Smithtown East',          section: 'XI', division: 'II',  city: 'Saint James',           county: 'Suffolk', wins: 8,  losses: 2, pf: 267, pa: 134, coach: 'Dave Berry'        },
  { id:  8, name: 'Half Hollow Hills West Colts',     school: 'Half Hollow Hills West',  section: 'XI', division: 'II',  city: 'Dix Hills',             county: 'Suffolk', wins: 7,  losses: 3, pf: 234, pa: 156, coach: 'Kevin Carr'        },
  { id:  9, name: 'Half Hollow Hills East Thunderbirds', school: 'Half Hollow Hills East', section: 'XI', division: 'II', city: 'Dix Hills',            county: 'Suffolk', wins: 6,  losses: 4, pf: 198, pa: 178, coach: 'Ryan Cully'        },
  { id: 10, name: 'Kings Park Kingsmen',              school: 'Kings Park',              section: 'XI', division: 'II',  city: 'Kings Park',            county: 'Suffolk', wins: 5,  losses: 5, pf: 167, pa: 189, coach: 'Matt Sumpf'        },
  { id: 11, name: 'Comsewogue Warriors',              school: 'Comsewogue',              section: 'XI', division: 'II',  city: 'Port Jefferson Station', county: 'Suffolk', wins: 4,  losses: 6, pf: 145, pa: 213, coach: 'Chris Ebertowski' },
  { id: 12, name: 'Connetquot Thunderbirds',          school: 'Connetquot',              section: 'XI', division: 'III', city: 'Bohemia',               county: 'Suffolk', wins: 9,  losses: 1, pf: 289, pa:  98, coach: 'Tom Hyland'        },
  { id: 13, name: 'Hauppauge Eagles',                 school: 'Hauppauge',               section: 'XI', division: 'III', city: 'Hauppauge',             county: 'Suffolk', wins: 8,  losses: 2, pf: 256, pa: 123, coach: 'Jim La Cava'       },
  { id: 14, name: 'Longwood Lions',                   school: 'Longwood',                section: 'XI', division: 'III', city: 'Middle Island',         county: 'Suffolk', wins: 6,  losses: 4, pf: 198, pa: 178, coach: 'Tom Gall'          },
  { id: 15, name: 'West Islip Lions',                 school: 'West Islip',              section: 'XI', division: 'III', city: 'West Islip',            county: 'Suffolk', wins: 5,  losses: 5, pf: 167, pa: 201, coach: 'Keith Burns'       },
  { id: 16, name: 'Shoreham-Wading River Wildcats',   school: 'Shoreham-Wading River',   section: 'XI', division: 'IV',  city: 'Shoreham',              county: 'Suffolk', wins: 10, losses: 0, pf: 356, pa:  67, coach: 'Matt Millheiser'   },
  { id: 17, name: 'Mount Sinai Mustangs',             school: 'Mount Sinai',             section: 'XI', division: 'IV',  city: 'Mount Sinai',           county: 'Suffolk', wins: 8,  losses: 2, pf: 278, pa: 112, coach: 'Mike Schaefer'     },
  { id: 18, name: 'East Islip Redmen',                school: 'East Islip',              section: 'XI', division: 'IV',  city: 'East Islip',            county: 'Suffolk', wins: 6,  losses: 4, pf: 212, pa: 167, coach: 'Tom White'         },
  { id: 19, name: 'Islip Buccaneers',                 school: 'Islip',                   section: 'XI', division: 'IV',  city: 'Islip',                 county: 'Suffolk', wins: 5,  losses: 5, pf: 178, pa: 198, coach: 'Tom Weir'          },
  { id: 20, name: 'Port Jefferson Royals',            school: 'Port Jefferson',          section: 'XI', division: 'V',   city: 'Port Jefferson',        county: 'Suffolk', wins: 9,  losses: 1, pf: 312, pa:  78, coach: 'Brian Sheridan'    },
  { id: 21, name: 'Babylon Panthers',                 school: 'Babylon',                 section: 'XI', division: 'V',   city: 'Babylon',               county: 'Suffolk', wins: 8,  losses: 2, pf: 267, pa: 112, coach: 'John Murphy'       },
  { id: 22, name: 'Hampton Bays Baymen',              school: 'Hampton Bays',            section: 'XI', division: 'V',   city: 'Hampton Bays',          county: 'Suffolk', wins: 6,  losses: 4, pf: 198, pa: 167, coach: 'Tom D\'Amico'      },
  { id: 23, name: 'Center Moriches Eagles',           school: 'Center Moriches',         section: 'XI', division: 'V',   city: 'Center Moriches',       county: 'Suffolk', wins: 5,  losses: 5, pf: 167, pa: 189, coach: 'Scott Parker'      },
  { id: 24, name: 'Pierson Whalers',                  school: 'Pierson',                 section: 'XI', division: 'V',   city: 'Sag Harbor',            county: 'Suffolk', wins: 4,  losses: 6, pf: 145, pa: 213, coach: 'Phil Carney'       },
]

export default async function TeamPage() {
  let teams = PLACEHOLDER
  let total = PLACEHOLDER.length

  try {
    const [rows, countRows] = await Promise.all([
      sql`SELECT id, name, school, section, division, city, county, wins, losses, pf, pa, coach FROM teams ORDER BY wins DESC, pf DESC LIMIT 200`,
      sql`SELECT COUNT(*)::int AS total FROM teams`,
    ])
    if (rows.length > 0) {
      teams = rows.map(r => ({
        id:       Number(r.id),
        name:     r.name     as string,
        school:   r.school   as string,
        section:  r.section  as string,
        division: r.division as string,
        city:     r.city     as string,
        county:   r.county   as string,
        wins:     Number(r.wins),
        losses:   Number(r.losses),
        pf:       Number(r.pf),
        pa:       Number(r.pa),
        coach:    r.coach    as string,
      }))
      total = Number(countRows[0].total)
    }
  } catch { /* DB not connected — showing placeholder data */ }

  return <TeamTable teams={teams} total={total} />
}
