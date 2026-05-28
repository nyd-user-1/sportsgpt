// Loose-geographic hex layout for the Section XI honeycomb. [col, row] on a
// COLS×ROWS grid (col 0 = west/Nassau side, rising east to the Forks; row 0 =
// North Shore, rising south). Originally derived from the Suffolk district
// GeoJSON centroids that /maps uses, then hand-tuned for a tighter silhouette.
// Edit any [col, row] to nudge a placement.

export const HEX_COLS = 10
export const HEX_ROWS = 6

export const HEX_LAYOUT: Record<string, [number, number]> = {
  // row 0 — North Shore / North Fork
  'comsewogue': [2, 0], 'port-jefferson': [3, 0], 'miller-place': [4, 0], 'rocky-point': [5, 0], 'greenport-southold-mattituck': [6, 0],
  // row 1
  'harborfields': [0, 1], 'northport': [1, 1], 'kings-park': [2, 1], 'hauppauge': [3, 1], 'ward-melville': [4, 1],
  'centereach': [5, 1], 'mt-sinai': [6, 1], 'shoreham-wading-river': [7, 1], 'riverhead': [8, 1],
  // row 2
  'huntington': [0, 2], 'half-hollow-hills-west': [1, 2], 'commack': [2, 2], 'bay-shore': [3, 2], 'smithtown-east': [4, 2],
  'sachem-north': [5, 2], 'newfield': [6, 2], 'longwood': [7, 2], 'center-moriches': [8, 2], 'southampton': [9, 2],
  // row 3
  'whitman': [0, 3], 'half-hollow-hills-east': [1, 3], 'glenn': [2, 3], 'west-islip': [3, 3], 'islip': [4, 3],
  'smithtown-west': [5, 3], 'sachem-east': [6, 3], 'bellport': [7, 3], 'eastport-south-manor': [8, 3],
  // row 4
  'copiague': [0, 4], 'west-babylon': [1, 4], 'wyandanch': [2, 4], 'north-babylon': [3, 4], 'brentwood': [4, 4],
  'east-islip': [5, 4], 'sayville': [6, 4], 'patchogue-medford': [7, 4], 'hampton-bays': [8, 4], 'east-hampton-bridgehampton-pierson': [9, 4],
  // row 5 — South Shore
  'amityville': [0, 5], 'lindenhurst': [1, 5], 'deer-park': [2, 5], 'babylon': [3, 5], 'central-islip': [4, 5],
  'connetquot': [5, 5], 'bayport-blue-point': [6, 5], 'floyd': [7, 5], 'westhampton': [8, 5],
}
