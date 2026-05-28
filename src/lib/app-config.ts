/**
 * app-config.ts — the ONE file to edit when cloning this repo for a new app.
 *
 * Change APP_NAME, ACCENT_COLOR, the nav arrays, and the path maps here.
 * Swap the logo in src/components/AppLogo.tsx.
 */

import { MessageCircle, LayoutDashboard, Building2, School, Rocket, Map, User, Users, Trophy, LayoutGrid, ListOrdered, Images } from 'lucide-react'
import { CHART_CONFIGS } from '@/lib/chart-configs'

// ── Season — update season.ts to bump for a new year ──────────────────────
export { CURRENT_SEASON, AVAILABLE_SEASONS } from '@/lib/season'

// ── Brand ──────────────────────────────────────────────────────────────────
export const APP_NAME               = 'SportsGPT'
export const APP_TAGLINE            = 'AI-powered high school sports intelligence'
export const CHAT_PLACEHOLDER       = 'Ask about Section XI football...'
export const CHAT_PLACEHOLDER_PANEL = 'Ask about this team...'
export const CHAT_PANEL_INTRO       = 'Ask anything about Section XI football.'
export const ACCENT_COLOR           = '#033882'
export const CHART_NAV_EVENT        = 'sportsgpt:chart-nav'
export const SEASON_CHANGE_EVENT    = 'sportsgpt:season-change'

// ── Top-level nav cycle (prev/next arrows in AppLayout header) ─────────────
export const NAV_CYCLE = [
  '/charts',
  ...CHART_CONFIGS.map(c => `/chart/${c.slug}`),
  '/maps',
  '/team',
  '/school',
  '/player',
  '/leaderboard',
  '/division/division-i',
  '/section/section-xi',
  '/launchpad',
]

// ── Sidebar active-label lookup (exact path → label) ──────────────────────
export const PATH_NAV: Record<string, string> = {
  '/':                    'Gallery',
  '/chat':                'Chat',
  '/charts':              'Charts',
  '/maps':                'Maps',
  '/team':                'Team',
  '/school':              'School',
  '/player':              'Player',
  '/leaderboard':         'Leaderboard',
  '/division':            'Divisions',
  '/division/division-i':   'Divisions',
  '/division/division-ii':  'Divisions',
  '/division/division-iii': 'Divisions',
  '/division/division-iv':  'Divisions',
  '/section':             'Section XI',
  '/section/section-xi':  'Section XI',
  '/launchpad':           'Launchpad',
  '/gallery':             'Gallery',
  '/glossary':            'Glossary',
  '/admin':               'Admin',
}

// ── Page title shown in AppLayout header (exact path → title) ─────────────
export const PATH_TITLE: Record<string, string> = {
  '/charts':              'Charts',
  '/maps':                'Maps',
  '/team':                'Team',
  '/school':              'School',
  '/player':              'Player',
  '/leaderboard':         'Leaderboard',
  '/division':            'Divisions',
  '/division/division-i': 'Division I',
  '/section':             'Section XI',
  '/section/section-xi':  'Section XI',
  '/launchpad':           'Launchpad',
  '/gallery':             'Gallery',
  '/glossary':            'Glossary',
  '/admin':               'Admin',
}

// ── Sidebar nav items ──────────────────────────────────────────────────────
export type NavItem = { label: string; icon: React.ComponentType<{ className?: string }>; href: string }

export const SIDEBAR_NAV_TOP: NavItem[] = [
  { label: 'Launchpad', icon: Rocket,          href: '/launchpad'           },
  { label: 'Chat',      icon: MessageCircle,   href: '/chat'                },
  { label: 'Charts',    icon: LayoutDashboard, href: '/charts'              },
  { label: 'Player',   icon: User,            href: '/player'              },
  { label: 'Team',     icon: Building2,       href: '/team'                },
]

export const SIDEBAR_NAV_BOTTOM: NavItem[] = [
  { label: 'Gallery',     icon: Images,      href: '/'           },
  { label: 'Leaderboard', icon: ListOrdered, href: '/leaderboard' },
]

export const SIDEBAR_NAV_MORE: NavItem[] = [
  { label: 'Maps',       icon: Map,         href: '/maps'                },
  { label: 'School',    icon: School,      href: '/school'              },
  { label: 'Divisions',  icon: LayoutGrid,  href: '/division/division-i' },
  { label: 'Positions',  icon: Users,       href: '/position/qb'         },
  { label: 'Section XI', icon: Trophy,      href: '/section/section-xi'  },
]

// Empty arrays = Data and Map accordion groups hidden from sidebar
export const SIDEBAR_DATA_ITEMS: string[] = []
export const SIDEBAR_MAP_ITEMS: string[]  = []

export const SIDEBAR_FOOTER_LABEL = 'Glossary'
