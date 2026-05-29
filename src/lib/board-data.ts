// Seeded discussion-board content for the design prototype. Not yet persisted —
// wire to a `board_threads` / `board_posts` table (+ next-auth user) to go live.

export type BoardReply = { id: number; author: string; initials: string; body: string; ago: string }

export type BoardThread = {
  id: number
  title: string
  author: string
  initials: string
  tag: string
  body: string
  ago: string
  replyCount: number
  lastActivity: string
  pinned?: boolean
  replies: BoardReply[]
}

export const BOARD_TAGS = ['All', 'Game Day', 'Division I', 'Rankings', 'History', 'Recruiting'] as const

export const BOARD_THREADS: BoardThread[] = [
  {
    id: 1, pinned: true, tag: 'Rankings',
    title: 'Way-too-early 2026 Section XI power rankings',
    author: 'LI Gridiron', initials: 'LG', ago: '3h', replyCount: 3, lastActivity: '18m',
    body: 'Floyd and Ward Melville return most of their two-deep. Sayville loses a senior class but the program reloads. Where does everyone have the top 5 going into next fall?',
    replies: [
      { id: 11, author: 'Coach Petrucci', initials: 'CP', body: '1) Floyd 2) Ward Melville 3) Sayville 4) Sachem North 5) East Islip. Floyd’s line is the difference.', ago: '2h' },
      { id: 12, author: 'mike_sec11', initials: 'MS', body: 'Sleeper: Half Hollow Hills West. Quietly went +0 differential but graded out way better on tape.', ago: '1h' },
      { id: 13, author: 'Patriots22', initials: 'P2', body: 'No Lindenhurst in the top 5? Bold.', ago: '18m' },
    ],
  },
  {
    id: 2, tag: 'Game Day',
    title: 'Floyd vs Ward Melville — who you got?',
    author: 'mike_sec11', initials: 'MS', ago: '5h', replyCount: 3, lastActivity: '25m',
    body: 'Two 10-win teams, +213 vs +294 differential. Strength of schedule says Ward Melville but Floyd hasn’t trailed in the second half all year. Score predictions?',
    replies: [
      { id: 21, author: 'BayportFaithful', initials: 'BF', body: 'Floyd 24–17. Their defense travels.', ago: '3h' },
      { id: 22, author: 'LI Gridiron', initials: 'LG', body: 'Ward Melville at home is a different team. Taking the Patriots by 10.', ago: '40m' },
      { id: 23, author: 'You', initials: 'YOU', body: 'Floyd’s second-half conditioning wins it. 27–21 Colonials.', ago: '25m' },
    ],
  },
  {
    id: 3, tag: 'History',
    title: 'Most dominant single season in Section XI history?',
    author: 'almanac_andy', initials: 'AA', ago: '1d', replyCount: 2, lastActivity: '6h',
    body: 'Sayville’s 12–0 / +272 this year is up there. But what about the older title teams? Curious what the long-timers remember.',
    replies: [
      { id: 31, author: 'oldschoolLI', initials: 'OL', body: 'Nothing touches the early-2010s Sachem teams for sheer roster talent.', ago: '20h' },
      { id: 32, author: 'almanac_andy', initials: 'AA', body: 'Fair — but win % + differential, this Sayville team has a real case.', ago: '6h' },
    ],
  },
  {
    id: 4, tag: 'Recruiting',
    title: 'Which juniors are getting D1 looks?',
    author: 'recruitwatch', initials: 'RW', ago: '2d', replyCount: 1, lastActivity: '1d',
    body: 'Hearing a few names from the South Shore getting MAC and Ivy interest. Who’s on your radar?',
    replies: [
      { id: 41, author: 'Coach Petrucci', initials: 'CP', body: 'Two linemen from Connetquot are the real deal. Watch that film.', ago: '1d' },
    ],
  },
  {
    id: 5, tag: 'Division I',
    title: 'Is Sachem North the most underrated team in D-I?',
    author: 'Patriots22', initials: 'P2', ago: '2d', replyCount: 0, lastActivity: '2d',
    body: '7–3, +97 differential, and nobody talks about them. The schedule was brutal. Feels like a quarterfinal upset waiting to happen.',
    replies: [],
  },
  {
    id: 6, tag: 'Game Day',
    title: 'Sayville’s defense is being slept on',
    author: 'You', initials: 'YOU', ago: '4h', replyCount: 1, lastActivity: '1h',
    body: 'Twelve shutout quarters down the stretch and nobody’s mentioning them in the title talk. What am I missing?',
    replies: [
      { id: 61, author: 'almanac_andy', initials: 'AA', body: 'You’re not. Their front seven is the most disciplined unit in D-IV.', ago: '1h' },
    ],
  },
  {
    id: 7, tag: 'History',
    title: 'Best title-game finish you’ve seen at Stony Brook?',
    author: 'You', initials: 'YOU', ago: '1d', replyCount: 0, lastActivity: '1d',
    body: 'Curious what the long-timers rank #1. For me it’s still the goal-line stand a few years back.',
    replies: [],
  },
]
