// Shared placeholder data — used by both index and detail pages.
// Replaced by real DB data once DATABASE_URL is connected.

export type TeamRow = {
  id: number; name: string; school: string; section: string; division: string
  city: string; county: string; wins: number; losses: number; pf: number; pa: number; coach: string
}

export type SchoolRow = {
  id: number; name: string; city: string; county: string; section: string; division: string
  enrollment: number; teams: number; wins: number; losses: number
}

export const PLACEHOLDER_TEAMS: TeamRow[] = [
  { id:  1, name: 'Ward Melville Patriots',             school: 'Ward Melville',          section: 'XI', division: 'I',   city: 'East Setauket',          county: 'Suffolk', wins: 9,  losses: 1, pf: 312, pa:  87, coach: 'Bill Donahue'      },
  { id:  2, name: 'Sachem North Flaming Arrows',         school: 'Sachem North',            section: 'XI', division: 'I',   city: 'Lake Ronkonkoma',        county: 'Suffolk', wins: 8,  losses: 2, pf: 278, pa: 142, coach: 'Kevin Homa'        },
  { id:  3, name: 'Sachem East Flaming Arrows',          school: 'Sachem East',             section: 'XI', division: 'I',   city: 'Farmingville',           county: 'Suffolk', wins: 7,  losses: 3, pf: 245, pa: 168, coach: 'Rob Shaver'        },
  { id:  4, name: 'Bay Shore Marauders',                 school: 'Bay Shore',               section: 'XI', division: 'I',   city: 'Bay Shore',              county: 'Suffolk', wins: 6,  losses: 4, pf: 198, pa: 201, coach: 'Anthony Termini'   },
  { id:  5, name: 'Brentwood Indians',                   school: 'Brentwood',               section: 'XI', division: 'I',   city: 'Brentwood',              county: 'Suffolk', wins: 5,  losses: 5, pf: 187, pa: 213, coach: 'Marco DiNapoli'    },
  { id:  6, name: 'Smithtown West Bulls',                school: 'Smithtown West',          section: 'XI', division: 'II',  city: 'Smithtown',              county: 'Suffolk', wins: 9,  losses: 1, pf: 301, pa: 112, coach: 'Jim Munson'         },
  { id:  7, name: 'Smithtown East Bulls',                school: 'Smithtown East',          section: 'XI', division: 'II',  city: 'Saint James',            county: 'Suffolk', wins: 8,  losses: 2, pf: 267, pa: 134, coach: 'Dave Berry'         },
  { id:  8, name: 'Half Hollow Hills West Colts',        school: 'Half Hollow Hills West',  section: 'XI', division: 'II',  city: 'Dix Hills',              county: 'Suffolk', wins: 7,  losses: 3, pf: 234, pa: 156, coach: 'Kevin Carr'         },
  { id:  9, name: 'Half Hollow Hills East Thunderbirds', school: 'Half Hollow Hills East',  section: 'XI', division: 'II',  city: 'Dix Hills',              county: 'Suffolk', wins: 6,  losses: 4, pf: 198, pa: 178, coach: 'Ryan Cully'         },
  { id: 10, name: 'Kings Park Kingsmen',                 school: 'Kings Park',              section: 'XI', division: 'II',  city: 'Kings Park',             county: 'Suffolk', wins: 5,  losses: 5, pf: 167, pa: 189, coach: 'Matt Sumpf'         },
  { id: 11, name: 'Comsewogue Warriors',                 school: 'Comsewogue',              section: 'XI', division: 'II',  city: 'Port Jefferson Station', county: 'Suffolk', wins: 4,  losses: 6, pf: 145, pa: 213, coach: 'Chris Ebertowski'  },
  { id: 12, name: 'Connetquot Thunderbirds',             school: 'Connetquot',              section: 'XI', division: 'III', city: 'Bohemia',                county: 'Suffolk', wins: 9,  losses: 1, pf: 289, pa:  98, coach: 'Tom Hyland'         },
  { id: 13, name: 'Hauppauge Eagles',                    school: 'Hauppauge',               section: 'XI', division: 'III', city: 'Hauppauge',              county: 'Suffolk', wins: 8,  losses: 2, pf: 256, pa: 123, coach: 'Jim La Cava'        },
  { id: 14, name: 'Longwood Lions',                      school: 'Longwood',                section: 'XI', division: 'III', city: 'Middle Island',          county: 'Suffolk', wins: 6,  losses: 4, pf: 198, pa: 178, coach: 'Tom Gall'           },
  { id: 15, name: 'West Islip Lions',                    school: 'West Islip',              section: 'XI', division: 'III', city: 'West Islip',             county: 'Suffolk', wins: 5,  losses: 5, pf: 167, pa: 201, coach: 'Keith Burns'        },
  { id: 16, name: 'Shoreham-Wading River Wildcats',      school: 'Shoreham-Wading River',   section: 'XI', division: 'IV',  city: 'Shoreham',               county: 'Suffolk', wins: 10, losses: 0, pf: 356, pa:  67, coach: 'Matt Millheiser'    },
  { id: 17, name: 'Mount Sinai Mustangs',                school: 'Mount Sinai',             section: 'XI', division: 'IV',  city: 'Mount Sinai',            county: 'Suffolk', wins: 8,  losses: 2, pf: 278, pa: 112, coach: 'Mike Schaefer'      },
  { id: 18, name: 'East Islip Redmen',                   school: 'East Islip',              section: 'XI', division: 'IV',  city: 'East Islip',             county: 'Suffolk', wins: 6,  losses: 4, pf: 212, pa: 167, coach: 'Tom White'          },
  { id: 19, name: 'Islip Buccaneers',                    school: 'Islip',                   section: 'XI', division: 'IV',  city: 'Islip',                  county: 'Suffolk', wins: 5,  losses: 5, pf: 178, pa: 198, coach: 'Tom Weir'           },
  { id: 20, name: 'Port Jefferson Royals',               school: 'Port Jefferson',          section: 'XI', division: 'V',   city: 'Port Jefferson',         county: 'Suffolk', wins: 9,  losses: 1, pf: 312, pa:  78, coach: 'Brian Sheridan'     },
  { id: 21, name: 'Babylon Panthers',                    school: 'Babylon',                 section: 'XI', division: 'V',   city: 'Babylon',                county: 'Suffolk', wins: 8,  losses: 2, pf: 267, pa: 112, coach: 'John Murphy'        },
  { id: 22, name: 'Hampton Bays Baymen',                 school: 'Hampton Bays',            section: 'XI', division: 'V',   city: 'Hampton Bays',           county: 'Suffolk', wins: 6,  losses: 4, pf: 198, pa: 167, coach: "Tom D'Amico"        },
  { id: 23, name: 'Center Moriches Eagles',              school: 'Center Moriches',         section: 'XI', division: 'V',   city: 'Center Moriches',        county: 'Suffolk', wins: 5,  losses: 5, pf: 167, pa: 189, coach: 'Scott Parker'       },
  { id: 24, name: 'Pierson Whalers',                     school: 'Pierson',                 section: 'XI', division: 'V',   city: 'Sag Harbor',             county: 'Suffolk', wins: 4,  losses: 6, pf: 145, pa: 213, coach: 'Phil Carney'        },
]

export const PLACEHOLDER_SCHOOLS: SchoolRow[] = [
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

export function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}
