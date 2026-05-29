'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { BOARD_THREADS, type BoardThread } from '@/lib/board-data'

export type DiscView =
  | { type: 'categories' }
  | { type: 'threads'; category: string }
  | { type: 'discussion'; threadId: number }
  | { type: 'compose' }

type DiscussionContextValue = {
  open: boolean
  /** True once the panel has been opened this session — drives the 💬 "new" dot. */
  seen: boolean
  threads: BoardThread[]
  viewStack: DiscView[]
  current: DiscView
  canGoBack: boolean
  openPanel: () => void
  close: () => void
  toggle: () => void
  push: (v: DiscView) => void
  pop: () => void
  openThread: (id: number) => void
  openCompose: () => void
  addReply: (threadId: number, body: string) => void
  postThread: (t: { title: string; body: string; category: string }) => void
}

const DiscussionContext = createContext<DiscussionContextValue | null>(null)

const ROOT: DiscView = { type: 'categories' }

export function DiscussionProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(false)
  const [threads, setThreads] = useState<BoardThread[]>(BOARD_THREADS)
  // viewStack is intentionally NOT reset on open/close. Preserving it across
  // navigation is the whole point — a discussion you drilled into follows you
  // from page to page. Do not "fix" this by resetting on open.
  const [viewStack, setViewStack] = useState<DiscView[]>([ROOT])

  const openPanel = useCallback(() => { setOpen(true); setSeen(true) }, [])
  const close     = useCallback(() => setOpen(false), [])
  const toggle    = useCallback(() => { setSeen(true); setOpen(o => !o) }, [])
  const push      = useCallback((v: DiscView) => setViewStack(s => [...s, v]), [])
  const pop       = useCallback(() => setViewStack(s => (s.length > 1 ? s.slice(0, -1) : s)), [])

  const openThread = useCallback((id: number) => {
    const t = threads.find(x => x.id === id)
    setViewStack(t
      ? [ROOT, { type: 'threads', category: t.tag }, { type: 'discussion', threadId: id }]
      : [ROOT, { type: 'discussion', threadId: id }])
    setOpen(true); setSeen(true)
  }, [threads])

  const openCompose = useCallback(() => {
    setViewStack([ROOT, { type: 'compose' }])
    setOpen(true); setSeen(true)
  }, [])

  const addReply = useCallback((threadId: number, body: string) => {
    const text = body.trim()
    if (!text) return
    setThreads(ts => ts.map(t => t.id === threadId
      ? { ...t, replyCount: t.replyCount + 1, lastActivity: 'now', replies: [...t.replies, { id: Date.now(), author: 'You', initials: 'YOU', body: text, ago: 'now' }] }
      : t))
  }, [])

  const postThread = useCallback(({ title, body, category }: { title: string; body: string; category: string }) => {
    const name = title.trim()
    if (!name) return
    const t: BoardThread = {
      id: Date.now(), title: name, body: body.trim() || '—',
      author: 'You', initials: 'YOU', tag: category,
      ago: 'now', replyCount: 0, lastActivity: 'now', replies: [],
    }
    setThreads(ts => [t, ...ts])
    setViewStack([ROOT, { type: 'threads', category }, { type: 'discussion', threadId: t.id }])
  }, [])

  const current = viewStack[viewStack.length - 1] ?? ROOT
  const canGoBack = viewStack.length > 1

  const value = useMemo<DiscussionContextValue>(() => ({
    open, seen, threads, viewStack, current, canGoBack,
    openPanel, close, toggle, push, pop, openThread, openCompose, addReply, postThread,
  }), [open, seen, threads, viewStack, current, canGoBack, openPanel, close, toggle, push, pop, openThread, openCompose, addReply, postThread])

  return <DiscussionContext.Provider value={value}>{children}</DiscussionContext.Provider>
}

export function useDiscussion() {
  const ctx = useContext(DiscussionContext)
  if (!ctx) throw new Error('useDiscussion must be used within DiscussionProvider')
  return ctx
}
