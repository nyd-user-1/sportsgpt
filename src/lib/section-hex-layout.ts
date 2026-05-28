// Loose-geographic hex layout for the Section XI honeycomb. [col, row] on a
// COLS×ROWS grid (col 0 = west/Nassau side, rising east to the Forks; row 0 =
// North Shore, rising south). Derived once from the Suffolk district GeoJSON
// centroids that /maps uses (district → school via DISTRICT_SCHOOLS), then
// binned to the grid with nearest-free-cell collision resolution. Edit by hand
// to nudge any placement.

export const HEX_COLS = 15
export const HEX_ROWS = 6

export const HEX_LAYOUT: Record<string, [number, number]> = {
  'amityville': [0, 5], 'whitman': [0, 3], 'huntington': [0, 2], 'copiague': [0, 4], 'harborfields': [0, 1],
  'half-hollow-hills-east': [1, 3], 'half-hollow-hills-west': [1, 2], 'lindenhurst': [1, 5], 'northport': [1, 1], 'west-babylon': [1, 4],
  'wyandanch': [2, 4], 'glenn': [2, 3], 'deer-park': [2, 5], 'north-babylon': [3, 4], 'babylon': [3, 5],
  'commack': [2, 2], 'west-islip': [3, 3], 'brentwood': [4, 4], 'bay-shore': [3, 2], 'kings-park': [2, 1],
  'islip': [4, 3], 'hauppauge': [3, 1], 'smithtown-east': [4, 2], 'smithtown-west': [5, 3], 'central-islip': [4, 5],
  'east-islip': [5, 4], 'connetquot': [5, 5], 'ward-melville': [4, 1], 'sayville': [6, 4], 'sachem-north': [5, 2],
  'sachem-east': [6, 3], 'centereach': [5, 1], 'newfield': [6, 2], 'port-jefferson': [4, 0], 'bayport-blue-point': [6, 5],
  'comsewogue': [3, 0], 'mt-sinai': [6, 1], 'patchogue-medford': [7, 4], 'miller-place': [5, 0], 'longwood': [7, 2],
  'rocky-point': [6, 0], 'bellport': [7, 3], 'shoreham-wading-river': [7, 1], 'floyd': [7, 5], 'eastport-south-manor': [8, 3],
  'center-moriches': [8, 2], 'riverhead': [8, 1], 'westhampton': [9, 3], 'hampton-bays': [10, 3], 'southampton': [11, 2],
  'greenport-southold-mattituck': [12, 0], 'east-hampton-bridgehampton-pierson': [14, 1],
}
