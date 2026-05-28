// Proper NYSED school-district name for each Section XI program, derived from
// the Suffolk district GeoJSON's POPULAR_NA field (the same source /maps uses),
// expanded to full form (UFSD → Union Free School District, CSD → Central
// School District). A team belongs to a school, and every school is a district;
// this is the district that school sits in. Co-ops (one football program drawn
// from several districts) are labelled as such.
//
// Not stored in the DB (schools.name is just the short school name, and the
// report-card ingest kept entity_cd but not the entity name) — so this map is
// the canonical lookup until/unless the district name is ingested.

export const SCHOOL_DISTRICTS: Record<string, string> = {
  'amityville':            'Amityville Union Free School District',
  'babylon':               'Babylon Union Free School District',
  'bay-shore':             'Bay Shore Union Free School District',
  'bayport-blue-point':    'Bayport-Blue Point Union Free School District',
  'bellport':              'South Country Central School District',
  'brentwood':             'Brentwood Union Free School District',
  'centereach':            'Middle Country Central School District',
  'center-moriches':       'Center Moriches Union Free School District',
  'central-islip':         'Central Islip Union Free School District',
  'commack':               'Commack Union Free School District',
  'comsewogue':            'Comsewogue Union Free School District',
  'connetquot':            'Connetquot Central School District',
  'copiague':              'Copiague Union Free School District',
  'deer-park':             'Deer Park Union Free School District',
  'east-hampton-bridgehampton-pierson': 'East Hampton–Bridgehampton–Pierson (Co-op)',
  'east-islip':            'East Islip Union Free School District',
  'eastport-south-manor':  'Eastport-South Manor Central School District',
  'floyd':                 'William Floyd Union Free School District',
  'glenn':                 'Elwood Union Free School District',
  'greenport-southold-mattituck': 'Greenport–Southold–Mattituck (Co-op)',
  'half-hollow-hills-east': 'Half Hollow Hills Central School District',
  'half-hollow-hills-west': 'Half Hollow Hills Central School District',
  'hampton-bays':          'Hampton Bays Union Free School District',
  'harborfields':          'Harborfields Central School District',
  'hauppauge':             'Hauppauge Union Free School District',
  'huntington':            'Huntington Union Free School District',
  'islip':                 'Islip Union Free School District',
  'kings-park':            'Kings Park Central School District',
  'lindenhurst':           'Lindenhurst Union Free School District',
  'longwood':              'Longwood Central School District',
  'miller-place':          'Miller Place Union Free School District',
  'mt-sinai':              'Mount Sinai Union Free School District',
  'newfield':              'Middle Country Central School District',
  'north-babylon':         'North Babylon Union Free School District',
  'northport':             'Northport-East Northport Union Free School District',
  'patchogue-medford':     'Patchogue-Medford Union Free School District',
  'port-jefferson':        'Port Jefferson Union Free School District',
  'riverhead':             'Riverhead Central School District',
  'rocky-point':           'Rocky Point Union Free School District',
  'sachem-east':           'Sachem Central School District',
  'sachem-north':          'Sachem Central School District',
  'sayville':              'Sayville Union Free School District',
  'shoreham-wading-river': 'Shoreham-Wading River Central School District',
  'smithtown-east':        'Smithtown Central School District',
  'smithtown-west':        'Smithtown Central School District',
  'southampton':           'Southampton Union Free School District',
  'ward-melville':         'Three Village Central School District',
  'west-babylon':          'West Babylon Union Free School District',
  'west-islip':            'West Islip Union Free School District',
  'westhampton':           'Westhampton Beach Union Free School District',
  'whitman':               'South Huntington Union Free School District',
  'wyandanch':             'Wyandanch Union Free School District',
}

/** Proper district name for a school slug, or null if unknown. */
export function districtName(schoolSlug: string | null | undefined): string | null {
  if (!schoolSlug) return null
  return SCHOOL_DISTRICTS[schoolSlug] ?? null
}
