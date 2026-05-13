'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, User, BarChart3, Map } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  SIDEBAR_NAV_TOP, SIDEBAR_NAV_BOTTOM,
  SIDEBAR_DATA_ITEMS, SIDEBAR_MAP_ITEMS, SIDEBAR_FOOTER_LABEL,
} from '@/lib/app-config'

interface SidebarProps {
  activeLabel?: string
}

export function Sidebar({ activeLabel = 'Chat' }: SidebarProps) {
  const [dataOpen, setDataOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)

  return (
    <aside className="flex h-full flex-col bg-[var(--surface)] overflow-hidden">

      {/* Header — Log In */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2.5">
          <User className="h-[18px] w-[18px] text-[var(--txt)] flex-shrink-0" />
          <span className="text-[15px] font-medium text-[var(--txt)]">Log In</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 space-y-0.5">

        {SIDEBAR_NAV_TOP.map(({ label, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors',
              activeLabel === label
                ? 'bg-[var(--inp-bg)] text-[var(--txt)]'
                : 'text-[var(--txt)] hover:bg-[var(--inp-bg)]'
            )}
          >
            <Icon className="h-[18px] w-[18px] flex-shrink-0" />
            {label}
          </Link>
        ))}

        {SIDEBAR_DATA_ITEMS.length > 0 && (
          <>
            <button
              onClick={() => setDataOpen(v => !v)}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors"
            >
              <BarChart3 className="h-[18px] w-[18px] flex-shrink-0" />
              <span className="flex-1 text-left">Data</span>
              <ChevronDown className={cn('h-4 w-4 text-[var(--muted)] transition-transform duration-200', dataOpen && 'rotate-180')} />
            </button>
            {dataOpen && (
              <div className="ml-[30px] border-l border-[var(--border)] pl-3 space-y-0.5">
                {SIDEBAR_DATA_ITEMS.map(item => (
                  <div key={item} className="flex items-center rounded-lg px-3 py-2 text-[14px] font-medium text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)] cursor-pointer">
                    {item}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {SIDEBAR_MAP_ITEMS.length > 0 && (
          <>
            <button
              onClick={() => setMapOpen(v => !v)}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors"
            >
              <Map className="h-[18px] w-[18px] flex-shrink-0" />
              <span className="flex-1 text-left">Map</span>
              <ChevronDown className={cn('h-4 w-4 text-[var(--muted)] transition-transform duration-200', mapOpen && 'rotate-180')} />
            </button>
            {mapOpen && (
              <div className="ml-[30px] border-l border-[var(--border)] pl-3 space-y-0.5">
                {SIDEBAR_MAP_ITEMS.map(item => (
                  <div key={item} className="flex items-center rounded-lg px-3 py-2 text-[14px] font-medium text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)] cursor-pointer">
                    {item}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {SIDEBAR_NAV_BOTTOM.map(({ label, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors',
              activeLabel === label
                ? 'bg-[var(--inp-bg)] text-[var(--txt)]'
                : 'text-[var(--txt)] hover:bg-[var(--inp-bg)]'
            )}
          >
            <Icon className="h-[18px] w-[18px] flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 space-y-1">
        <Link href="/team/east-islip-redmen" className="flex items-center rounded-lg px-3 py-2.5 text-[15px] font-medium text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)] transition-colors">
          East Islip
        </Link>
        <Link href="/glossary" className="flex items-center rounded-lg px-3 py-2.5 text-[15px] font-medium text-[var(--txt)] bg-[var(--inp-bg)] hover:opacity-80">
          {SIDEBAR_FOOTER_LABEL}
        </Link>
        <Link href="/admin" className="flex items-center rounded-lg px-3 py-2.5 text-[15px] font-medium text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)] transition-colors">
          Admin
        </Link>
      </div>

    </aside>
  )
}
