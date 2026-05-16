'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { PanelLeftOpen, PanelLeftClose, ChevronLeft, ChevronRight, ImageIcon } from 'lucide-react'
import { AppLogo } from '@/components/AppLogo'
import { Sidebar } from '@/components/Sidebar'
import {
  APP_NAME, ACCENT_COLOR, CHART_NAV_EVENT,
  NAV_CYCLE, PATH_NAV, PATH_TITLE,
} from '@/lib/app-config'

type ChartNavDetail = {
  prevHref: string
  nextHref: string
  color: string
  pageTitle?: string
} | null

export function AppLayout({ children, mobileHeader }: { children: React.ReactNode; showNavArrows?: boolean; mobileHeader?: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chartNav, setChartNav] = useState<ChartNavDetail>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const handle = (e: Event) => setChartNav((e as CustomEvent<ChartNavDetail>).detail)
    window.addEventListener(CHART_NAV_EVENT, handle)
    return () => window.removeEventListener(CHART_NAV_EVENT, handle)
  }, [])

  useEffect(() => {
    if (!pathname.startsWith('/chart/')) setChartNav(null)
  }, [pathname])

  const activeNav = PATH_NAV[pathname] ?? (
    pathname.startsWith('/county')    ? 'County'    :
    pathname.startsWith('/facility')  ? 'Facility'  :
    pathname.startsWith('/zip-code')  ? 'Zip Code'  :
    pathname.startsWith('/zip/')      ? 'Zip Code'  :
    pathname.startsWith('/city')      ? 'City'      :
    pathname.startsWith('/launchpad') ? 'Launchpad' :
    pathname.startsWith('/chart/')    ? 'Charts'    : undefined
  )
  const title = PATH_TITLE[pathname] ?? (
    pathname.startsWith('/launchpad') ? 'Launchpad' :
    pathname.startsWith('/chart/')    ? 'Charts'    : undefined
  )

  const navIdx  = NAV_CYCLE.indexOf(pathname)
  const n       = NAV_CYCLE.length
  const prevNav = navIdx >= 0 ? NAV_CYCLE[(navIdx - 1 + n) % n] : null
  const nextNav = navIdx >= 0 ? NAV_CYCLE[(navIdx + 1) % n]     : null

  const navBtnCls = 'flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--inp-bg)] transition-colors'

  return (
    <div className="flex h-dvh overflow-hidden p-0 sm:p-[18px] bg-[var(--surface)] sm:bg-[var(--bg)]">

      <div className={`shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${sidebarOpen ? 'w-full sm:w-[240px] sm:mr-[18px]' : 'w-0'}`}>
        <div className="w-[240px] h-full rounded-none sm:rounded-2xl overflow-hidden">
          <Sidebar activeLabel={activeNav} />
        </div>
      </div>

      <div className="flex flex-1 flex-col min-w-0 rounded-none sm:rounded-2xl bg-[var(--surface)] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.07)] border border-[var(--border)]">

        <div className="flex items-center px-5 pt-5 pb-5">

          <button onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar"
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border-0 outline-none transition-colors hover:bg-[var(--inp-bg)]">
            {sidebarOpen
              ? <PanelLeftClose className="h-5 w-5 text-[var(--txt)]" />
              : <PanelLeftOpen  className="h-5 w-5 text-[var(--txt)]" />
            }
          </button>

          {mobileHeader && (
            <div className="flex sm:hidden flex-1 min-w-0">{mobileHeader}</div>
          )}

          {title && (
            <div className="ml-4 flex items-center gap-2 text-[var(--txt)]">
              <Link href="/" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xl font-bold hover:bg-[var(--inp-bg)] transition-colors">
                <AppLogo className="h-5 w-5 shrink-0" />
                {APP_NAME}
              </Link>
              <span className="text-[var(--muted)] text-xl select-none">|</span>
              <span className="text-xl font-medium">{chartNav?.pageTitle ?? title}</span>
            </div>
          )}

          <div className="flex-1" />

          {pathname === '/' && (
            <div className="flex items-center gap-2">
              <Link href="/gallery"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--muted)] hover:bg-[var(--inp-bg)] transition-colors">
                <ImageIcon className="h-5 w-5" />
              </Link>
              <button className="h-9 px-4 rounded-full border border-[var(--border)] text-sm font-medium text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors">
                Sign in
              </button>
              <button className="h-9 px-4 rounded-full bg-[var(--txt)] text-sm font-medium text-[var(--surface)] hover:opacity-80 transition-opacity">
                Sign up
              </button>
            </div>
          )}

          {chartNav ? (
            <div className="hidden sm:flex items-center gap-1.5">
              <button onClick={() => router.push(chartNav.prevHref)} className={navBtnCls}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => router.push(chartNav.nextHref)} className={navBtnCls}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : navIdx >= 0 ? (
            <div className="hidden sm:flex items-center gap-1.5">
              <button onClick={() => prevNav && router.push(prevNav)} className={navBtnCls}>
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => nextNav && router.push(nextNav)} className={navBtnCls}>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}

        </div>

        {children}

      </div>

      <div id="chat-panel-root" className="flex shrink-0 h-full" />

      <button onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar"
        className="sm:hidden fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] shadow-lg transition-colors hover:bg-[var(--inp-bg)]">
        {sidebarOpen
          ? <PanelLeftClose className="h-5 w-5 text-[var(--txt)]" />
          : <PanelLeftOpen  className="h-5 w-5 text-[var(--txt)]" />
        }
      </button>
    </div>
  )
}
