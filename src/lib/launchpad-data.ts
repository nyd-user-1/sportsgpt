// ── REPLACE FOR NEW DOMAIN ────────────────────────────────────────────────
// LAUNCHPAD_TABS  — tab labels shown above the card grid
// LAUNCHPAD_ITEMS — cards per tab: name (card title), county (subtitle / location)
// Cards link to /team/[name-as-slug] — update ProviderSection.tsx href if needed.

export type LaunchpadItem = { name: string; county: string }

export const LAUNCHPAD_TABS: string[] = [
  'Division I',
  'Division II',
  'Division III',
  'Division IV',
  'Division V',
]

export const LAUNCHPAD_ITEMS: Record<string, LaunchpadItem[]> = {
  'Division I': [
    { name: 'Ward Melville Patriots',        county: 'East Setauket'   },
    { name: 'Sachem North Flaming Arrows',   county: 'Lake Ronkonkoma' },
    { name: 'Sachem East Flaming Arrows',    county: 'Farmingville'    },
    { name: 'Bay Shore Marauders',           county: 'Bay Shore'       },
    { name: 'Brentwood Indians',             county: 'Brentwood'       },
  ],
  'Division II': [
    { name: 'Smithtown West Bulls',              county: 'Smithtown'              },
    { name: 'Smithtown East Bulls',              county: 'Saint James'            },
    { name: 'Half Hollow Hills West Colts',      county: 'Dix Hills'              },
    { name: 'Half Hollow Hills East Thunderbirds', county: 'Dix Hills'            },
    { name: 'Kings Park Kingsmen',               county: 'Kings Park'             },
    { name: 'Comsewogue Warriors',               county: 'Port Jefferson Station' },
  ],
  'Division III': [
    { name: 'Connetquot Thunderbirds', county: 'Bohemia'      },
    { name: 'Hauppauge Eagles',        county: 'Hauppauge'    },
    { name: 'Longwood Lions',          county: 'Middle Island' },
    { name: 'West Islip Lions',        county: 'West Islip'   },
  ],
  'Division IV': [
    { name: 'Shoreham-Wading River Wildcats', county: 'Shoreham'    },
    { name: 'Mount Sinai Mustangs',           county: 'Mount Sinai' },
    { name: 'East Islip Redmen',              county: 'East Islip'  },
    { name: 'Islip Buccaneers',               county: 'Islip'       },
  ],
  'Division V': [
    { name: 'Port Jefferson Royals',   county: 'Port Jefferson'  },
    { name: 'Babylon Panthers',        county: 'Babylon'         },
    { name: 'Hampton Bays Baymen',     county: 'Hampton Bays'    },
    { name: 'Center Moriches Eagles',  county: 'Center Moriches' },
    { name: 'Pierson Whalers',         county: 'Sag Harbor'      },
  ],
}
