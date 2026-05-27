'use client'

import { useState, useEffect, useRef } from 'react'
import { flushSync } from 'react-dom'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { PanelLeftOpen, PanelLeftClose, Sun, Moon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { AppLogo } from '@/components/AppLogo'
import { Sidebar } from '@/components/Sidebar'
import {
  APP_NAME, ACCENT_COLOR, CHART_NAV_EVENT,
  PATH_NAV, PATH_TITLE,
} from '@/lib/app-config'

type ChartNavDetail = {
  prevHref: string
  nextHref: string
  color: string
  pageTitle?: string
} | null

export function AppLayout({ children, mobileHeader, hideHeader, paperMode }: { children: React.ReactNode; showNavArrows?: boolean; mobileHeader?: React.ReactNode; hideHeader?: boolean; paperMode?: boolean }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chartNav, setChartNav] = useState<ChartNavDetail>(null)
  const [dark, setDark] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const saved = localStorage.getItem('theme')
    const isDark = saved ? saved === 'dark' : true
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  }, [])

  function toggleTheme(e: React.MouseEvent) {
    const x = e.clientX
    const y = e.clientY
    const next = !dark

    const apply = () => {
      setDark(next)
      document.documentElement.classList.toggle('dark', next)
      localStorage.setItem('theme', next ? 'dark' : 'light')
    }

    if (!document.startViewTransition) { apply(); return }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )
    const transition = document.startViewTransition(() => { flushSync(apply) })
    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
        { duration: 600, easing: 'cubic-bezier(.76,.32,.29,.99)', pseudoElement: '::view-transition-new(root)' }
      )
    })
  }

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
    pathname.startsWith('/chart/')    ? 'Charts'    :
    pathname.startsWith('/position/') ? 'Positions' : undefined
  )
  const title = PATH_TITLE[pathname] ?? (
    pathname.startsWith('/launchpad') ? 'Launchpad' :
    pathname.startsWith('/position/') ? 'Positions' : undefined
  )

  // Mobile floating sidebar toggle — draggable, snaps to right edge on release.
  const FAB_SIZE = 48
  const [fabPos, setFabPos] = useState<{ x: number; y: number } | null>(null)
  const [fabDragging, setFabDragging] = useState(false)
  const fabRef = useRef<HTMLButtonElement>(null)
  const fabDrag = useRef<{ ptrX: number; ptrY: number; startX: number; startY: number; moved: boolean } | null>(null)

  const handleFabPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    fabDrag.current = {
      ptrX: e.clientX,
      ptrY: e.clientY,
      startX: rect.left,
      startY: rect.top,
      moved: false,
    }

    const onMove = (ev: PointerEvent) => {
      const d = fabDrag.current
      if (!d) return
      ev.preventDefault()
      const dx = ev.clientX - d.ptrX
      const dy = ev.clientY - d.ptrY
      if (!d.moved && Math.hypot(dx, dy) > 6) {
        d.moved = true
        setFabDragging(true)
      }
      if (d.moved) {
        const x = Math.max(0, Math.min(window.innerWidth - FAB_SIZE, d.startX + dx))
        const y = Math.max(0, Math.min(window.innerHeight - FAB_SIZE, d.startY + dy))
        setFabPos({ x, y })
      }
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      const d = fabDrag.current
      fabDrag.current = null
      if (!d) return
      if (!d.moved) {
        setSidebarOpen(v => !v)
        return
      }
      setFabDragging(false)
      setFabPos(prev => {
        const currX = prev?.x ?? d.startX
        const snapLeft = currX + FAB_SIZE / 2 < window.innerWidth / 2
        return {
          x: snapLeft ? 8 : window.innerWidth - FAB_SIZE - 8,
          y: prev?.y ?? d.startY,
        }
      })
    }

    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
  }

  return (
    <div className="flex h-dvh overflow-hidden p-0 sm:p-[18px] bg-[var(--surface)] sm:bg-[var(--bg)]">

      <div className={`shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${sidebarOpen ? 'w-full sm:w-[240px] sm:mr-[18px]' : 'w-0'}`}>
        <div className={`w-[240px] h-full rounded-none sm:rounded-2xl overflow-hidden sm:border ${paperMode ? 'sm:border-[var(--paper-rule)]' : 'sm:border-[var(--border)]'}`}>
          <Sidebar activeLabel={activeNav} />
        </div>
      </div>

      <div className={`relative flex flex-1 flex-col min-w-0 rounded-none sm:rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.07)] sm:border ${paperMode ? 'bg-[var(--paper)] sm:border-[var(--paper-rule)]' : 'bg-[var(--surface)] sm:border-[var(--border)]'}`}>

        {hideHeader ? (
          <button onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar"
            className={`hidden sm:flex absolute top-5 left-5 z-20 h-9 w-9 items-center justify-center rounded-xl border-0 outline-none transition-colors ${paperMode ? 'hover:bg-[var(--paper-quiet)]' : 'hover:bg-[var(--inp-bg)]'}`}>
            {sidebarOpen
              ? <PanelLeftClose className={`h-5 w-5 ${paperMode ? 'text-[var(--paper-faint)]' : 'text-[var(--txt)]'}`} />
              : <PanelLeftOpen  className={`h-5 w-5 ${paperMode ? 'text-[var(--paper-faint)]' : 'text-[var(--txt)]'}`} />
            }
          </button>
        ) : (
        <div className="flex items-center px-5 pt-5 pb-5">

          <button onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar"
            className={`hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border-0 outline-none transition-colors ${paperMode ? 'hover:bg-[var(--paper-quiet)]' : 'hover:bg-[var(--inp-bg)]'}`}>
            {sidebarOpen
              ? <PanelLeftClose className={`h-5 w-5 ${paperMode ? 'text-[var(--paper-faint)]' : 'text-[var(--txt)]'}`} />
              : <PanelLeftOpen  className={`h-5 w-5 ${paperMode ? 'text-[var(--paper-faint)]' : 'text-[var(--txt)]'}`} />
            }
          </button>

          {mobileHeader && (
            <div className="flex sm:hidden flex-1 min-w-0">{mobileHeader}</div>
          )}

          {title && (
            <div className={`ml-4 flex items-center gap-2 ${paperMode ? 'text-[var(--paper-text)]' : 'text-[var(--txt)]'}`}>
              <span
                className="text-[22px] leading-none tracking-[-0.01em]"
                style={{ fontFamily: 'var(--font-display), Georgia, serif', fontWeight: 500 }}
              >
                {chartNav?.pageTitle ?? title}
              </span>
            </div>
          )}

          <div className="flex-1" />

          <button
            onClick={e => toggleTheme(e)}
            aria-label="Toggle dark mode"
            className={`hidden sm:flex h-8 w-8 items-center justify-center rounded-full transition-colors mr-2 ${paperMode
              ? 'border border-[var(--paper-rule)] bg-transparent text-[var(--paper-faint)] hover:bg-[var(--paper-quiet)] hover:text-[var(--paper-text)]'
              : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)]'
            }`}
          >
            {dark ? <Sun className="h-4 w-4 fill-amber-400 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>

          <AuthButtons />

        </div>
        )}

        {children}

      </div>

      <div id="app-panel-root" className="flex shrink-0 h-full" />

      <button
        ref={fabRef}
        onPointerDown={handleFabPointerDown}
        aria-label="Toggle sidebar"
        style={{
          touchAction: 'none',
          ...(fabPos ? { left: fabPos.x, top: fabPos.y } : {}),
        }}
        className={`sm:hidden fixed z-50 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] shadow-lg hover:bg-[var(--inp-bg)] ${fabPos ? '' : 'bottom-4 right-2'} ${fabDragging ? '' : 'transition-[left,top] duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]'}`}
      >
        {sidebarOpen
          ? <PanelLeftClose className="h-5 w-5 text-[var(--txt)]" />
          : <PanelLeftOpen  className="h-5 w-5 text-[var(--txt)]" />
        }
      </button>
    </div>
  )
}

// ── Auth buttons: sign-in/sign-up shown in header only when signed out ────────
function AuthButtons() {
  const { data: session, status } = useSession()

  if (status === 'loading' || session?.user) return null

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/sign-in"
        className="h-8 px-3.5 border border-[var(--paper-rule)] dark:border-[var(--paper-rule)] text-[11px] uppercase tracking-[0.18em] font-medium text-[var(--paper-faint)] hover:text-[var(--paper-text)] hover:bg-[var(--paper-quiet)] transition-colors flex items-center"
        style={{ borderRadius: 3, fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
      >
        Sign in
      </Link>
      <Link
        href="/sign-up"
        className="h-8 px-3.5 bg-[var(--paper-text)] text-[var(--paper)] text-[11px] uppercase tracking-[0.18em] font-medium hover:opacity-85 transition-opacity flex items-center"
        style={{ borderRadius: 3, fontFamily: 'var(--font-sans), system-ui, sans-serif' }}
      >
        Sign up
      </Link>
    </div>
  )
}
