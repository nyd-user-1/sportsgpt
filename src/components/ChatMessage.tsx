'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check, ThumbsUp, ThumbsDown } from 'lucide-react'
import type { Message } from '@/hooks/useChat'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mdComponents: any = {
  p:      ({ children }: { children: React.ReactNode }) => <p className="mb-3 leading-relaxed text-[var(--txt)]">{children}</p>,
  strong: ({ children }: { children: React.ReactNode }) => <strong className="font-semibold text-[var(--txt)]">{children}</strong>,
  h1:     ({ children }: { children: React.ReactNode }) => <div className="flex items-center gap-2 mt-7 mb-2"><span className="text-xs font-semibold text-[var(--muted)] shrink-0">{children}</span><div className="flex-1 border-t border-[var(--border)]" /></div>,
  h2:     ({ children }: { children: React.ReactNode }) => <div className="flex items-center gap-2 mt-6 mb-2"><span className="text-xs font-semibold text-[var(--muted)] shrink-0">{children}</span><div className="flex-1 border-t border-[var(--border)]" /></div>,
  h3:     ({ children }: { children: React.ReactNode }) => <div className="flex items-center gap-2 mt-5 mb-2"><span className="text-xs font-semibold text-[var(--muted)] shrink-0">{children}</span><div className="flex-1 border-t border-[var(--border)]" /></div>,
  ul:     ({ children }: { children: React.ReactNode }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
  ol:     ({ children }: { children: React.ReactNode }) => <ol className="list-decimal pl-6 space-y-1 my-2">{children}</ol>,
  li:     ({ children }: { children: React.ReactNode }) => <li className="text-[var(--txt)]">{children}</li>,
  table:  ({ children }: { children: React.ReactNode }) => <div className="my-4 rounded-xl border border-[var(--border)] overflow-hidden"><table className="w-full text-sm">{children}</table></div>,
  thead:  ({ children }: { children: React.ReactNode }) => <thead className="bg-[var(--inp-bg)]">{children}</thead>,
  th:     ({ children }: { children: React.ReactNode }) => <th className="text-left text-xs font-semibold text-[var(--muted)] px-3 py-2.5 border-b border-[var(--border)]">{children}</th>,
  td:     ({ children }: { children: React.ReactNode }) => <td className="text-[var(--txt)] px-3 py-2 border-b border-[var(--border)] last:border-0 text-sm">{children}</td>,
  tr:     ({ children }: { children: React.ReactNode }) => <tr className="border-b border-[var(--border)] last:border-0">{children}</tr>,
  hr:     () => <hr className="my-4 border-[var(--border)]" />,
  code:   ({ children }: { children: React.ReactNode }) => <code className="rounded bg-[var(--inp-bg)] px-1.5 py-0.5 text-xs text-[#033882]">{children}</code>,
  em:     ({ children }: { children: React.ReactNode }) => <em className="italic text-[var(--muted)]">{children}</em>,
  a:      ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} className="text-[#033882] hover:underline">{children}</a>
  ),
}

interface Props {
  message: Message
  isStreaming?: boolean
  onSend?: (content: string) => void
}

export function ChatMessage({ message, isStreaming, onSend }: Props) {
  const isUser = message.role === 'user'
  const hasContent = message.content.length > 0

  // All hooks unconditionally at the top — rules of hooks
  const wipeRef         = useRef<HTMLDivElement>(null)
  const wipeRafRef      = useRef<number | null>(null)
  const wipeStartedRef  = useRef(false)
  const wipePRef        = useRef(-5)

  useEffect(() => {
    if (isUser || !isStreaming || !hasContent) return
    if (wipeStartedRef.current) return
    const el = wipeRef.current
    if (!el) return

    wipeStartedRef.current = true
    wipePRef.current = -5
    const RATE = 30
    let lastTime: number | null = null

    function tick(now: number) {
      if (lastTime === null) lastTime = now
      wipePRef.current = Math.min(wipePRef.current + ((now - lastTime) / 1000) * RATE, 110)
      lastTime = now
      const p = wipePRef.current
      el!.style.setProperty('--mp1', `${p - 2}%`)
      el!.style.setProperty('--mp2', `${p + 2}%`)
      el!.style.setProperty('--mp3', `${p + 8}%`)
      if (wipePRef.current < 110) wipeRafRef.current = requestAnimationFrame(tick)
    }
    wipeRafRef.current = requestAnimationFrame(tick)
    return () => { if (wipeRafRef.current) cancelAnimationFrame(wipeRafRef.current) }
  }, [isUser, isStreaming, hasContent])

  useEffect(() => {
    if (isUser || isStreaming) return
    wipeStartedRef.current = false
    if (wipeRafRef.current) { cancelAnimationFrame(wipeRafRef.current); wipeRafRef.current = null }
    const el = wipeRef.current
    if (!el) return
    const startP = wipePRef.current
    if (startP >= 110) { el.style.removeProperty('--mp1'); el.style.removeProperty('--mp2'); el.style.removeProperty('--mp3'); return }
    const t0 = performance.now()
    function fin(now: number) {
      const t = Math.min(1, (now - t0) / 800)
      const p = startP + (110 - startP) * t
      el!.style.setProperty('--mp1', `${p - 2}%`)
      el!.style.setProperty('--mp2', `${p + 2}%`)
      el!.style.setProperty('--mp3', `${p + 8}%`)
      if (t < 1) requestAnimationFrame(fin)
      else { el!.style.removeProperty('--mp1'); el!.style.removeProperty('--mp2'); el!.style.removeProperty('--mp3') }
    }
    requestAnimationFrame(fin)
  }, [isUser, isStreaming])

  // ── User bubble ───────────────────────────────────────────────────────────
  if (isUser) {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[90%] md:max-w-[70%] rounded-2xl bg-[var(--inp-bg)] px-4 py-3">
          <p className="text-[17px] leading-relaxed text-[var(--txt)]">{message.content}</p>
        </div>
      </div>
    )
  }

  // ── Assistant bubble ──────────────────────────────────────────────────────
  return (
    <div className="mb-6 max-w-[720px]">
      {isStreaming && !hasContent && (
        <div className="space-y-3 py-1">
          <div className="h-3 w-[88%] rounded-full bg-[var(--inp-bg)] animate-pulse" />
          <div className="h-3 w-[75%] rounded-full bg-[var(--inp-bg)] animate-pulse" />
          <div className="h-3 w-[82%] rounded-full bg-[var(--inp-bg)] animate-pulse" />
        </div>
      )}

      {hasContent && (
        <div ref={wipeRef} className={`space-y-1 text-[17px]${isStreaming ? ' mask-wipe' : ''}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {message.content}
          </ReactMarkdown>
        </div>
      )}

      {!isStreaming && hasContent && (
        <ChatFooter content={message.content} onSend={onSend} />
      )}
    </div>
  )
}

function ChatFooter({ content, onSend }: { content: string; onSend?: (content: string) => void }) {
  const [copied,   setCopied]   = useState(false)
  const [feedback, setFeedback] = useState<'good' | 'bad' | null>(null)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const followUps = extractFollowUps(content)

  return (
    <>
      <div className="pt-3 mt-1 border-t border-[var(--border)]">
        <div className="flex items-center gap-1">
          <button onClick={handleCopy}
            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors"
            title="Copy response">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
          <div className="flex items-center gap-1 ml-auto">
            <button onClick={() => setFeedback(feedback === 'good' ? null : 'good')}
              className={`inline-flex items-center justify-center h-8 w-8 rounded-md transition-colors ${feedback === 'good' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)]'}`}>
              <ThumbsUp className="h-4 w-4" />
            </button>
            <button onClick={() => setFeedback(feedback === 'bad' ? null : 'bad')}
              className={`inline-flex items-center justify-center h-8 w-8 rounded-md transition-colors ${feedback === 'bad' ? 'text-red-500 bg-red-50 dark:bg-red-900/20' : 'text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)]'}`}>
              <ThumbsDown className="h-4 w-4" />
            </button>
          </div>
        </div>
        {followUps.length > 0 && onSend && (
          <div className="mt-3 divide-y divide-[var(--border)]">
            {followUps.map((q, i) => (
              <button key={i} onClick={() => onSend(q)}
                className="flex w-full items-start py-2 text-left text-sm text-[var(--txt2)] hover:text-[#033882] transition-colors">
                {q}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function extractFollowUps(content: string): string[] {
  const lines = content.split('\n')
  const followUps: string[] = []
  let inSection = false
  for (const line of lines) {
    const t = line.trim()
    if (/follow.up|you (might|may|could) also (ask|want)|related questions/i.test(t)) { inSection = true; continue }
    if (inSection && /^[-*]\s+.+\?$/.test(t)) followUps.push(t.replace(/^[-*]\s+/, ''))
    if (inSection && t === '' && followUps.length > 0) break
  }
  return followUps.slice(0, 3)
}
