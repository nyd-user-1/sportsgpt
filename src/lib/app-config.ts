/**
 * app-config.ts — the ONE file to edit when cloning this repo for a new app.
 *
 * Change APP_NAME, ACCENT_COLOR, the nav arrays, and the path maps here.
 * Swap the logo in src/components/AppLogo.tsx.
 */

import {
  MessageCircle, LayoutDashboard, Rocket, BarChart3, Map,
  Building2, School, Hash, Landmark,
} from 'lucide-react'
import { CHART_CONFIGS } from '@/lib/chart-configs'

// ── Brand ──────────────────────────────────────────────────────────────────
export const APP_NAME         = 'SportsGPT'
export const APP_TAGLINE      = 'AI-powered high school sports intelligence'
export const CHAT_PLACEHOLDER = 'Ask about Section XI football...'
export const ACCENT_COLOR     = '#023887'
export const CHART_NAV_EVENT  = 'sportsgpt:chart-nav'

// ── Top-level nav cycle (prev/next arrows in AppLayout header) ─────────────
export const NAV_CYCLE = [
  '/charts',
  ...CHART_CONFIGS.map(c => `/chart/${c.slug}`),
  '/maps',
  '/team',
  '/school',
  '/schedule',
  '/section',
  '/launchpad',
]

// ── Sidebar active-label lookup (exact path → label) ──────────────────────
export const PATH_NAV: Record<string, string> = {
  '/':           'Chat',
  '/charts':     'Charts',
  '/maps':       'Maps',
  '/team':       'Teams',
  '/school':     'Schools',
  '/schedule':   'Schedule',
  '/section':    'Section XI',
  '/launchpad':  'Launchpad',
  '/standings':  'Standings',
  '/glossary':   'Glossary',
}

// ── Page title shown in AppLayout header (exact path → title) ─────────────
export const PATH_TITLE: Record<string, string> = {
  '/charts':     'Charts',
  '/maps':       'Maps',
  '/team':       'Teams',
  '/school':     'Schools',
  '/schedule':   'Schedule',
  '/section':    'Section XI',
  '/launchpad':  'Launchpad',
  '/standings':  'Standings',
  '/glossary':   'Glossary',
}

// ── Sidebar nav items ──────────────────────────────────────────────────────
export type NavItem = { label: string; icon: React.ComponentType<{ className?: string }>; href: string }

export const SIDEBAR_NAV_TOP: NavItem[] = [
  { label: 'Chat',      icon: MessageCircle,   href: '/'          },
  { label: 'Charts',    icon: LayoutDashboard, href: '/charts'    },
  { label: 'Maps',      icon: Map,             href: '/maps'      },
  { label: 'Teams',     icon: Building2,       href: '/team'      },
  { label: 'Schools',   icon: School,          href: '/school'    },
  { label: 'Schedule',  icon: Hash,            href: '/schedule'  },
  { label: 'Section XI',icon: Landmark,        href: '/section'   },
  { label: 'Launchpad', icon: Rocket,          href: '/launchpad' },
]

export const SIDEBAR_NAV_BOTTOM: NavItem[] = [
  { label: 'Standings', icon: BarChart3, href: '/standings' },
]

export const SIDEBAR_DATA_ITEMS: string[] = [
  'Teams', 'Schools', 'Players', 'Games', 'Sections',
]

export const SIDEBAR_MAP_ITEMS: string[] = [
  'Section XI', 'Long Island', 'Schools',
]

export const SIDEBAR_FOOTER_LABEL = 'Glossary'
