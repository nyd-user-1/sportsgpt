/**
 * app-config.ts — the ONE file to edit when cloning this repo for a new app.
 *
 * Change APP_NAME, ACCENT_COLOR, the nav arrays, and the path maps here.
 * Swap the logo in src/components/AppLogo.tsx.
 */

import { MessageCircle, LayoutDashboard, Building2, School, Rocket, Map, User, Trophy, LayoutGrid, ListOrdered, Images } from 'lucide-react'
import { CHART_CONFIGS } from '@/lib/chart-configs'

// ── Brand ──────────────────────────────────────────────────────────────────
export const APP_NAME               = 'SportsGPT'
export const APP_TAGLINE            = 'AI-powered high school sports intelligence'
export const CHAT_PLACEHOLDER       = 'Ask about Section XI football...'
export const CHAT_PLACEHOLDER_PANEL = 'Ask about this team...'
export const CHAT_PANEL_INTRO       = 'Ask anything using the panels and map.'
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
  '/team':                'Teams',
  '/school':              'Schools',
  '/player':              'Players',
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
  '/team':                'Teams',
  '/school':              'Schools',
  '/player':              'Players',
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
  { label: 'Chat',       icon: MessageCircle,   href: '/chat'                },
  { label: 'Charts',     icon: LayoutDashboard, href: '/charts'              },
  { label: 'Teams',      icon: Building2,       href: '/team'                },
  { label: 'Players',    icon: User,            href: '/player'              },
]

export const SIDEBAR_NAV_BOTTOM: NavItem[] = [
  { label: 'Maps',        icon: Map,           href: '/maps'                },
  { label: 'Schools',     icon: School,        href: '/school'              },
  { label: 'Leaderboard', icon: ListOrdered,   href: '/leaderboard'         },
  { label: 'Divisions',   icon: LayoutGrid,    href: '/division/division-i' },
  { label: 'Section XI',  icon: Trophy,        href: '/section/section-xi'  },
  { label: 'Launchpad',   icon: Rocket,        href: '/launchpad'           },
  { label: 'Gallery',     icon: Images,        href: '/'                    },
]

// Empty arrays = Data and Map accordion groups hidden from sidebar
export const SIDEBAR_DATA_ITEMS: string[] = []
export const SIDEBAR_MAP_ITEMS: string[]  = []

export const SIDEBAR_FOOTER_LABEL = 'Glossary'
