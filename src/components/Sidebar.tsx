'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDown, User, MoreHorizontal, Search, LogOut } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  SIDEBAR_NAV_TOP, SIDEBAR_NAV_BOTTOM, SIDEBAR_NAV_MORE, SIDEBAR_FOOTER_LABEL, SIDEBAR_DATA_ITEMS,
  APP_NAME,
} from '@/lib/app-config'
import { AppLogo } from '@/components/AppLogo'

interface SidebarProps {
  activeLabel?: string
}

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
    <aside className="flex h-full flex-col bg-[var(--surface)] overflow-hidden">

      {/* Brand */}
      <div className="p-3 pb-1">
        <Link href="/" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2.5 hover:bg-[var(--inp-bg)] transition-colors">
          <AppLogo className="h-[18px] w-[18px] shrink-0" />
          <span className="text-[15px] font-medium text-[var(--txt)]">{APP_NAME}</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 pt-1 space-y-0.5">

        {/* 1. Launchpad */}
        {SIDEBAR_NAV_TOP.slice(0, 1).map(({ label, icon: Icon, href }) => (
          <Link key={label} href={href}
            className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors',
              activeLabel === label ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--txt)] hover:bg-[var(--inp-bg)]')}>
            <Icon className="h-[18px] w-[18px] flex-shrink-0" />{label}
          </Link>
        ))}

        {/* 2. Search */}
        <button onClick={openSearch}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors">
          <Search className="h-[18px] w-[18px] flex-shrink-0" />
          <span className="flex-1 text-left">Search</span>
          <kbd className="hidden sm:inline-flex text-[10px] bg-[var(--inp-bg)] text-[var(--muted)] px-1.5 py-0.5 rounded">⌘K</kbd>
        </button>

        {/* 3–6. Chat, Charts, Players, Teams */}
        {SIDEBAR_NAV_TOP.slice(1).map(({ label, icon: Icon, href }) => (
          <Link key={label} href={href}
            className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors',
              activeLabel === label ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--txt)] hover:bg-[var(--inp-bg)]')}>
            <Icon className="h-[18px] w-[18px] flex-shrink-0" />{label}
          </Link>
        ))}

        <div className="my-2 border-t border-[var(--border)]" />

        {/* Gallery + Leaderboard */}
        {SIDEBAR_NAV_BOTTOM.map(({ label, icon: Icon, href }) => (
          <Link key={label} href={href}
            className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors',
              activeLabel === label ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--txt)] hover:bg-[var(--inp-bg)]')}>
            <Icon className="h-[18px] w-[18px] flex-shrink-0" />{label}
          </Link>
        ))}

        {/* More... accordion */}
        <button onClick={() => setMoreOpen(v => !v)}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors">
          <MoreHorizontal className="h-[18px] w-[18px] flex-shrink-0" />
          <span className="flex-1 text-left">More</span>
          <ChevronDown className={cn('h-4 w-4 text-[var(--muted)] transition-transform duration-200', moreOpen && 'rotate-180')} />
        </button>
        {moreOpen && (
          <div className="ml-[30px] border-l border-[var(--border)] pl-3 space-y-0.5">
            {SIDEBAR_NAV_MORE.map(({ label, icon: Icon, href }) => (
              <Link key={label} href={href}
                className={cn('flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors',
                  activeLabel === label ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)]')}>
                <Icon className="h-4 w-4 flex-shrink-0" />{label}
              </Link>
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 space-y-1">
        <Link href="/glossary" className="flex items-center rounded-lg px-3 py-2.5 text-[15px] font-medium text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)] transition-colors">
          {SIDEBAR_FOOTER_LABEL}
        </Link>
        <Link href="/admin" className="flex items-center rounded-lg px-3 py-2.5 text-[15px] font-medium text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)] transition-colors">
          Admin
        </Link>
        <SidebarAuth />
      </div>

    </aside>
  )
}

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
    return <div className="h-[44px] rounded-lg border border-[var(--border)]" />
  }

  if (!session?.user) {
    return (
      <Link href="/sign-in" className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2.5 hover:bg-[var(--inp-bg)] transition-colors">
        <User className="h-[18px] w-[18px] text-[var(--txt)] flex-shrink-0" />
        <span className="text-[15px] font-medium text-[var(--txt)]">Log In</span>
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
        className="w-full flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 hover:bg-[var(--inp-bg)] transition-colors"
      >
        <div className="h-7 w-7 rounded-full bg-[#033882] flex items-center justify-center flex-shrink-0">
          <span className="text-[11px] font-bold text-white">{initials}</span>
        </div>
        <span className="text-[15px] font-medium text-[var(--txt)] truncate text-left flex-1">
          {session.user.name || session.user.email}
        </span>
      </button>

      {menuOpen && (
        <div className="absolute left-0 right-0 bottom-full mb-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden py-1 z-50">
          <div className="px-4 py-2.5 border-b border-[var(--border)]">
            <p className="text-xs font-medium text-[var(--txt)] truncate">{session.user.name || 'Account'}</p>
            <p className="text-xs text-[var(--muted)] truncate">{session.user.email}</p>
          </div>
          <Link href="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors">
            <User className="h-4 w-4 text-[var(--muted)]" /> Profile
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-[var(--inp-bg)] transition-colors border-t border-[var(--border)]"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
