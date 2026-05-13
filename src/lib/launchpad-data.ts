// ── REPLACE FOR NEW DOMAIN ────────────────────────────────────────────────
// LAUNCHPAD_TABS  — tab labels shown above the card grid
// LAUNCHPAD_ITEMS — cards per tab: name (display title), location (subtitle), slug (team slug from DB)
// Cards link to /team/[slug] via ProviderSection.tsx

export type LaunchpadItem = { name: string; county: string; slug: string }

export const LAUNCHPAD_TABS: string[] = [
  'Division I',
  'Division II',
  'Division III',
  'Division IV',
]

export const LAUNCHPAD_ITEMS: Record<string, LaunchpadItem[]> = {
  'Division I': [
    { name: 'Ward Melville Patriots',           county: 'East Setauket',   slug: 'ward-melville-varsity-football'          },
    { name: 'Sachem North Flaming Arrows',      county: 'Lake Ronkonkoma', slug: 'sachem-north-varsity-football'           },
    { name: 'Sachem East Flaming Arrows',       county: 'Farmingville',    slug: 'sachem-east-varsity-football'            },
    { name: 'Bay Shore Marauders',              county: 'Bay Shore',       slug: 'bay-shore-varsity-football'              },
    { name: 'Brentwood Indians',                county: 'Brentwood',       slug: 'brentwood-varsity-football'              },
    { name: 'William Floyd Colonials',          county: 'Mastic Beach',    slug: 'william-floyd-varsity-football'          },
    { name: 'Lindenhurst Bulldogs',             county: 'Lindenhurst',     slug: 'lindenhurst-varsity-football'            },
    { name: 'Commack Cougars',                  county: 'Commack',         slug: 'commack-varsity-football'                },
    { name: 'Northport Tigers',                 county: 'Northport',       slug: 'northport-varsity-football'              },
    { name: 'Longwood Lions',                   county: 'Middle Island',   slug: 'longwood-varsity-football'               },
  ],
  'Division II': [
    { name: 'Smithtown West Bulls',             county: 'Smithtown',              slug: 'smithtown-west-varsity-football'         },
    { name: 'Smithtown East Bulls',             county: 'Saint James',            slug: 'smithtown-east-varsity-football'         },
    { name: 'Half Hollow Hills West Colts',     county: 'Dix Hills',              slug: 'half-hollow-hills-west-varsity-football' },
    { name: 'Half Hollow Hills East T-Birds',   county: 'Dix Hills',              slug: 'half-hollow-hills-east-varsity-football' },
    { name: 'Kings Park Kingsmen',              county: 'Kings Park',             slug: 'kings-park-varsity-football'             },
    { name: 'Comsewogue Warriors',              county: 'Port Jefferson Station', slug: 'comsewogue-varsity-football'             },
    { name: 'Connetquot Thunderbirds',          county: 'Bohemia',                slug: 'connetquot-varsity-football'             },
    { name: 'Hauppauge Eagles',                 county: 'Hauppauge',              slug: 'hauppauge-varsity-football'              },
  ],
  'Division III': [
    { name: 'West Islip Lions',                 county: 'West Islip',   slug: 'west-islip-varsity-football'              },
    { name: 'Shoreham-Wading River Wildcats',   county: 'Shoreham',     slug: 'shoreham-wading-river-varsity-football'   },
    { name: 'Mount Sinai Mustangs',             county: 'Mount Sinai',  slug: 'mount-sinai-varsity-football'             },
    { name: 'East Islip Redmen',                county: 'East Islip',   slug: 'east-islip-varsity-football'              },
    { name: 'Islip Buccaneers',                 county: 'Islip',        slug: 'islip-varsity-football'                   },
    { name: 'Amityville Warriors',              county: 'Amityville',   slug: 'amityville-varsity-football'              },
  ],
  'Division IV': [
    { name: 'Port Jefferson Royals',            county: 'Port Jefferson',  slug: 'port-jefferson-varsity-football'         },
    { name: 'Babylon Panthers',                 county: 'Babylon',         slug: 'babylon-varsity-football'                },
    { name: 'Hampton Bays Baymen',              county: 'Hampton Bays',    slug: 'hampton-bays-varsity-football'           },
    { name: 'Center Moriches Eagles',           county: 'Center Moriches', slug: 'center-moriches-varsity-football'        },
    { name: 'Pierson Whalers',                  county: 'Sag Harbor',      slug: 'pierson-varsity-football'                },
  ],
}
