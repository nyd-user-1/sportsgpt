'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { ChevronDown, User, MoreHorizontal, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  SIDEBAR_NAV_TOP, SIDEBAR_NAV_BOTTOM, SIDEBAR_NAV_MORE, SIDEBAR_FOOTER_LABEL,
} from '@/lib/app-config'

interface SidebarProps {
  activeLabel?: string
  onNavigate?: () => void
}

export function Sidebar({ activeLabel = 'Chat', onNavigate }: SidebarProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const router   = useRouter()
  const pathname = usePathname()

  function openSearch() {
    const p = new URLSearchParams(window.location.search)
    p.set('cmd', 'open')
    router.push(`${pathname}?${p}`, { scroll: false })
    onNavigate?.()
  }

  return (
    <aside className="flex h-full flex-col bg-[var(--surface)] overflow-hidden">

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 pt-3 space-y-0.5">

        {/* 1. Launchpad */}
        {SIDEBAR_NAV_TOP.slice(0, 1).map(({ label, icon: Icon, href }) => (
          <Link key={label} href={href} onClick={onNavigate}
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
          <Link key={label} href={href} onClick={onNavigate}
            className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors',
              activeLabel === label ? 'bg-[var(--inp-bg)] text-[var(--txt)]' : 'text-[var(--txt)] hover:bg-[var(--inp-bg)]')}>
            <Icon className="h-[18px] w-[18px] flex-shrink-0" />{label}
          </Link>
        ))}

        <div className="my-2 border-t border-[var(--border)]" />

        {/* Gallery + Leaderboard */}
        {SIDEBAR_NAV_BOTTOM.map(({ label, icon: Icon, href }) => (
          <Link key={label} href={href} onClick={onNavigate}
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
              <Link key={label} href={href} onClick={onNavigate}
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
        <Link href="/glossary" onClick={onNavigate} className="flex items-center rounded-lg px-3 py-2.5 text-[15px] font-medium text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)] transition-colors">
          {SIDEBAR_FOOTER_LABEL}
        </Link>
        <Link href="/admin" onClick={onNavigate} className="flex items-center rounded-lg px-3 py-2.5 text-[15px] font-medium text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)] transition-colors">
          Admin
        </Link>
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2.5 cursor-pointer hover:bg-[var(--inp-bg)] transition-colors">
          <User className="h-[18px] w-[18px] text-[var(--txt)] flex-shrink-0" />
          <span className="text-[15px] font-medium text-[var(--txt)]">Log In</span>
        </div>
      </div>

    </aside>
  )
}
