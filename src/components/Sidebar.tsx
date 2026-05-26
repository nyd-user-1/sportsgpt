'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDown, User, MoreHorizontal, Search, LogOut } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  SIDEBAR_NAV_TOP, SIDEBAR_NAV_BOTTOM, SIDEBAR_NAV_MORE, SIDEBAR_FOOTER_LABEL,
  APP_NAME,
} from '@/lib/app-config'
import { AppLogo } from '@/components/AppLogo'

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans, "DM Sans"), sans-serif' }
const MONO:  React.CSSProperties = { fontFamily: 'var(--font-mono), ui-monospace, monospace' }

interface SidebarProps {
  activeLabel?: string
}

// ── Shared classes ───────────────────────────────────────────────────────────

const eyebrowCls   = 'px-3 pt-4 pb-2 text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]'
const navItemBase  = 'flex items-center gap-3 px-3 py-2 text-[13.5px] transition-colors'
const navItemRest  = 'text-[var(--paper-muted)] hover:text-[var(--paper-strong)]'
const navItemHot   = 'text-[var(--paper-strong)] bg-[var(--paper-quiet)]'
const subItemBase  = 'flex items-center gap-2 px-3 py-1.5 text-[12.5px] transition-colors'
const subItemRest  = 'text-[var(--paper-faint)] hover:text-[var(--paper-strong)]'
const subItemHot   = 'text-[var(--paper-strong)]'

// ── Sidebar ──────────────────────────────────────────────────────────────────

export function Sidebar({ activeLabel = 'Chat' }: SidebarProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const router   = useRouter()
  const pathname = usePathname()

  function openSearch() {
    const p = new URLSearchParams(window.location.search)
    p.set('cmd', 'open')
    router.push(`${pathname}?${p}`, { scroll: false })
  }

  return (
    <aside
      className="flex h-full flex-col overflow-hidden"
      style={{ backgroundColor: 'var(--paper)' }}
    >

      {/* Brand */}
      <div className="px-3 pt-3 pb-2">
        <Link
          href="/"
          className="flex items-center gap-2 border border-[var(--paper-rule)] px-3 py-2.5 hover:bg-[var(--paper-quiet)] transition-colors"
          style={{ borderRadius: 3 }}
        >
          <AppLogo className="h-[18px] w-[18px] shrink-0" />
          <span
            className="text-[15px] text-[var(--paper-text)]"
            style={{ ...SERIF, fontWeight: 500, letterSpacing: '-0.005em' }}
          >
            {APP_NAME}
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar">

        {/* ── Navigate ──────────────────────────────────────────── */}
        <p className={eyebrowCls} style={SANS}>Navigate</p>
        <div className="px-2 flex flex-col">

          {/* 1. Launchpad */}
          {SIDEBAR_NAV_TOP.slice(0, 1).map(({ label, icon: Icon, href }) => {
            const on = activeLabel === label
            return (
              <Link key={label} href={href}
                className={cn(navItemBase, on ? navItemHot : navItemRest)}
                style={{ ...SERIF, fontWeight: on ? 500 : 400, borderRadius: 3 }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
              </Link>
            )
          })}

          {/* 2. Search */}
          <button onClick={openSearch}
            className={cn(navItemBase, navItemRest, 'w-full text-left')}
            style={{ ...SERIF, borderRadius: 3 }}
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="flex-1">Search</span>
            <kbd
              className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] text-[var(--paper-faint)] border border-[var(--paper-rule)]"
              style={{ ...MONO, borderRadius: 2 }}
            >
              ⌘K
            </kbd>
          </button>

          {/* 3–6. Chat, Charts, Players, Teams */}
          {SIDEBAR_NAV_TOP.slice(1).map(({ label, icon: Icon, href }) => {
            const on = activeLabel === label
            return (
              <Link key={label} href={href}
                className={cn(navItemBase, on ? navItemHot : navItemRest)}
                style={{ ...SERIF, fontWeight: on ? 500 : 400, borderRadius: 3 }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
              </Link>
            )
          })}
        </div>

        {/* Divider */}
        <div className="mx-3 my-3 border-t border-[var(--paper-rule)]" />

        {/* ── Discover ──────────────────────────────────────────── */}
        <p className={eyebrowCls} style={SANS}>Discover</p>
        <div className="px-2 flex flex-col">
          {SIDEBAR_NAV_BOTTOM.map(({ label, icon: Icon, href }) => {
            const on = activeLabel === label
            return (
              <Link key={label} href={href}
                className={cn(navItemBase, on ? navItemHot : navItemRest)}
                style={{ ...SERIF, fontWeight: on ? 500 : 400, borderRadius: 3 }}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
              </Link>
            )
          })}

          {/* More... accordion */}
          <button onClick={() => setMoreOpen(v => !v)}
            className={cn(navItemBase, navItemRest, 'w-full text-left')}
            style={{ ...SERIF, borderRadius: 3 }}
          >
            <MoreHorizontal className="h-4 w-4 shrink-0" />
            <span className="flex-1">More</span>
            <ChevronDown
              className={cn('h-3.5 w-3.5 text-[var(--paper-faint)] transition-transform duration-200', moreOpen && 'rotate-180')}
            />
          </button>
          {moreOpen && (
            <div className="ml-7 mt-0.5 mb-1 border-l border-[var(--paper-rule)] pl-2 flex flex-col">
              {SIDEBAR_NAV_MORE.map(({ label, href }) => {
                const on = activeLabel === label
                return (
                  <Link key={label} href={href}
                    className={cn(subItemBase, on ? subItemHot : subItemRest)}
                    style={{ ...SERIF, fontStyle: 'italic' }}
                  >
                    <span className="opacity-50">–</span>
                    <span className="flex-1">{label}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-2 pb-3 pt-2">
        <p className={cn(eyebrowCls, '!pt-1')} style={SANS}>About</p>
        <Link href="/glossary"
          className={cn(navItemBase, navItemRest)}
          style={{ ...SERIF, fontStyle: 'italic', borderRadius: 3 }}
        >
          {SIDEBAR_FOOTER_LABEL}
        </Link>
        <Link href="/admin"
          className={cn(navItemBase, navItemRest)}
          style={{ ...SERIF, fontStyle: 'italic', borderRadius: 3 }}
        >
          Admin
        </Link>
        <div className="mt-2 px-1">
          <SidebarAuth />
        </div>
      </div>

    </aside>
  )
}

// ── Auth chip ────────────────────────────────────────────────────────────────

function SidebarAuth() {
  const { data: session, status } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  if (status === 'loading') {
    return <div className="h-[44px] border border-[var(--paper-rule)]" style={{ borderRadius: 3 }} />
  }

  if (!session?.user) {
    return (
      <Link
        href="/sign-in"
        className="flex items-center gap-2 border border-[var(--paper-rule)] px-3 py-2.5 hover:bg-[var(--paper-quiet)] transition-colors"
        style={{ borderRadius: 3 }}
      >
        <User className="h-4 w-4 text-[var(--paper-muted)] shrink-0" />
        <span
          className="text-[13.5px] text-[var(--paper-text)]"
          style={SERIF}
        >
          Log In
        </span>
      </Link>
    )
  }

  const initials = session.user.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : (session.user.email?.[0] ?? 'U').toUpperCase()

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setMenuOpen(v => !v)}
        className="w-full flex items-center gap-2 border border-[var(--paper-rule)] px-3 py-2 hover:bg-[var(--paper-quiet)] transition-colors"
        style={{ borderRadius: 3 }}
      >
        <div
          className="h-7 w-7 flex items-center justify-center shrink-0"
          style={{ background: 'var(--paper-strong)', borderRadius: 3 }}
        >
          <span className="text-[11px] font-bold text-white" style={MONO}>{initials}</span>
        </div>
        <span
          className="text-[13.5px] text-[var(--paper-text)] truncate text-left flex-1"
          style={SERIF}
        >
          {session.user.name || session.user.email}
        </span>
      </button>

      {menuOpen && (
        <div
          className="absolute left-0 right-0 bottom-full mb-2 border border-[var(--paper-rule)] bg-[var(--paper)] shadow-xl overflow-hidden py-1 z-50"
          style={{ borderRadius: 3 }}
        >
          <div className="px-4 py-2.5 border-b border-[var(--paper-rule)]">
            <p className="text-[12.5px] text-[var(--paper-text)] truncate" style={SERIF}>{session.user.name || 'Account'}</p>
            <p className="text-[11px] text-[var(--paper-muted)] truncate" style={{ ...SERIF, fontStyle: 'italic' }}>{session.user.email}</p>
          </div>
          <Link
            href="/profile"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-[var(--paper-muted)] hover:text-[var(--paper-strong)] hover:bg-[var(--paper-quiet)] transition-colors"
            style={SERIF}
          >
            <User className="h-4 w-4" /> Profile
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex w-full items-center gap-2.5 px-4 py-2 text-[13px] text-rose-500 hover:bg-[var(--paper-quiet)] transition-colors border-t border-[var(--paper-rule)]"
            style={SERIF}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
