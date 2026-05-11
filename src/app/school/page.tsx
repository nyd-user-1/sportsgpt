import { sql } from '@/lib/db'
import SchoolTable, { type SchoolRow } from './SchoolTable'

export const dynamic = 'force-dynamic'

const PLACEHOLDER: SchoolRow[] = [
  { id:  1, name: 'Ward Melville',           city: 'East Setauket',          county: 'Suffolk', section: 'XI', division: 'I',   enrollment: 2400, teams: 22, wins: 9,  losses: 1  },
  { id:  2, name: 'Sachem North',             city: 'Lake Ronkonkoma',        county: 'Suffolk', section: 'XI', division: 'I',   enrollment: 2800, teams: 24, wins: 8,  losses: 2  },
  { id:  3, name: 'Sachem East',              city: 'Farmingville',           county: 'Suffolk', section: 'XI', division: 'I',   enrollment: 2600, teams: 22, wins: 7,  losses: 3  },
  { id:  4, name: 'Bay Shore',                city: 'Bay Shore',              county: 'Suffolk', section: 'XI', division: 'I',   enrollment: 2100, teams: 18, wins: 6,  losses: 4  },
  { id:  5, name: 'Brentwood',                city: 'Brentwood',              county: 'Suffolk', section: 'XI', division: 'I',   enrollment: 4200, teams: 20, wins: 5,  losses: 5  },
  { id:  6, name: 'Smithtown West',           city: 'Smithtown',              county: 'Suffolk', section: 'XI', division: 'II',  enrollment: 1900, teams: 20, wins: 9,  losses: 1  },
  { id:  7, name: 'Smithtown East',           city: 'Saint James',            county: 'Suffolk', section: 'XI', division: 'II',  enrollment: 1800, teams: 20, wins: 8,  losses: 2  },
  { id:  8, name: 'Half Hollow Hills West',   city: 'Dix Hills',              county: 'Suffolk', section: 'XI', division: 'II',  enrollment: 2100, teams: 22, wins: 7,  losses: 3  },
  { id:  9, name: 'Half Hollow Hills East',   city: 'Dix Hills',              county: 'Suffolk', section: 'XI', division: 'II',  enrollment: 2000, teams: 20, wins: 6,  losses: 4  },
  { id: 10, name: 'Kings Park',               city: 'Kings Park',             county: 'Suffolk', section: 'XI', division: 'II',  enrollment: 1300, teams: 18, wins: 5,  losses: 5  },
  { id: 11, name: 'Comsewogue',               city: 'Port Jefferson Station', county: 'Suffolk', section: 'XI', division: 'II',  enrollment: 1100, teams: 16, wins: 4,  losses: 6  },
  { id: 12, name: 'Connetquot',               city: 'Bohemia',                county: 'Suffolk', section: 'XI', division: 'III', enrollment: 2000, teams: 20, wins: 9,  losses: 1  },
  { id: 13, name: 'Hauppauge',                city: 'Hauppauge',              county: 'Suffolk', section: 'XI', division: 'III', enrollment: 1400, teams: 18, wins: 8,  losses: 2  },
  { id: 14, name: 'Longwood',                 city: 'Middle Island',          county: 'Suffolk', section: 'XI', division: 'III', enrollment: 1800, teams: 18, wins: 6,  losses: 4  },
  { id: 15, name: 'West Islip',               city: 'West Islip',             county: 'Suffolk', section: 'XI', division: 'III', enrollment: 1500, teams: 18, wins: 5,  losses: 5  },
  { id: 16, name: 'Shoreham-Wading River',    city: 'Shoreham',               county: 'Suffolk', section: 'XI', division: 'IV',  enrollment:  700, teams: 14, wins: 10, losses: 0  },
  { id: 17, name: 'Mount Sinai',              city: 'Mount Sinai',            county: 'Suffolk', section: 'XI', division: 'IV',  enrollment:  900, teams: 16, wins: 8,  losses: 2  },
  { id: 18, name: 'East Islip',               city: 'East Islip',             county: 'Suffolk', section: 'XI', division: 'IV',  enrollment: 1200, teams: 16, wins: 6,  losses: 4  },
  { id: 19, name: 'Islip',                    city: 'Islip',                  county: 'Suffolk', section: 'XI', division: 'IV',  enrollment:  900, teams: 14, wins: 5,  losses: 5  },
  { id: 20, name: 'Port Jefferson',           city: 'Port Jefferson',         county: 'Suffolk', section: 'XI', division: 'V',   enrollment:  450, teams: 10, wins: 9,  losses: 1  },
  { id: 21, name: 'Babylon',                  city: 'Babylon',                county: 'Suffolk', section: 'XI', division: 'V',   enrollment:  600, teams: 12, wins: 8,  losses: 2  },
  { id: 22, name: 'Hampton Bays',             city: 'Hampton Bays',           county: 'Suffolk', section: 'XI', division: 'V',   enrollment:  550, teams: 10, wins: 6,  losses: 4  },
  { id: 23, name: 'Center Moriches',          city: 'Center Moriches',        county: 'Suffolk', section: 'XI', division: 'V',   enrollment:  480, teams: 10, wins: 5,  losses: 5  },
  { id: 24, name: 'Pierson',                  city: 'Sag Harbor',             county: 'Suffolk', section: 'XI', division: 'V',   enrollment:  350, teams:  8, wins: 4,  losses: 6  },
]

export default async function SchoolPage() {
  let schools = PLACEHOLDER
  let total   = PLACEHOLDER.length

  try {
    const [rows, countRows] = await Promise.all([
      sql`SELECT id, name, city, county, section, division, enrollment, teams, wins, losses FROM schools ORDER BY name LIMIT 200`,
      sql`SELECT COUNT(*)::int AS total FROM schools`,
    ])
    if (rows.length > 0) {
      schools = rows.map(r => ({
        id:         Number(r.id),
        name:       r.name       as string,
        city:       r.city       as string,
        county:     r.county     as string,
        section:    r.section    as string,
        division:   r.division   as string,
        enrollment: Number(r.enrollment),
        teams:      Number(r.teams),
        wins:       Number(r.wins),
        losses:     Number(r.losses),
      }))
      total = Number(countRows[0].total)
    }
  } catch { /* DB not connected — showing placeholder data */ }

  return <SchoolTable schools={schools} total={total} />
}
