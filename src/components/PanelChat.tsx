'use client'

import { useRef, useEffect, useState } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { AppLogo } from '@/components/AppLogo'
import { AppPanel } from './AppPanel'
import { useChat } from '@/hooks/useChat'
import { APP_NAME, CHAT_PLACEHOLDER_PANEL, CHAT_PANEL_INTRO } from '@/lib/app-config'

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const SANS  = { fontFamily: 'var(--font-sans), system-ui, sans-serif' } as const
const MONO  = { fontFamily: 'var(--font-mono), ui-monospace, monospace' } as const

const PANEL_MODEL = 'gemini-2.5-flash'

// Lightweight markdown components tuned for a narrow panel.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const md: any = {
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="mb-2 last:mb-0 leading-[1.6]" style={{ ...SERIF, fontSize: 14, color: 'var(--paper-text)' }}>
      {children}
    </p>
  ),
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="font-semibold text-[var(--paper-text)]">{children}</strong>
  ),
  em: ({ children }: { children: React.ReactNode }) => (
    <em className="italic text-[var(--paper-muted)]">{children}</em>
  ),
  code: ({ children }: { children: React.ReactNode }) => (
    <code className="px-1 py-0.5 rounded-[2px] bg-[var(--paper)] border border-[var(--paper-rule)] text-[12px] text-[var(--paper-text)]" style={MONO}>
      {children}
    </code>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc pl-5 mb-2 space-y-0.5" style={{ ...SERIF, fontSize: 14, color: 'var(--paper-text)' }}>
      {children}
    </ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="list-decimal pl-5 mb-2 space-y-0.5" style={{ ...SERIF, fontSize: 14, color: 'var(--paper-text)' }}>
      {children}
    </ol>
  ),
  a: ({ children, href }: { children: React.ReactNode; href?: string }) => (
    <a href={href} className="text-[var(--paper-strong)] underline-offset-2 hover:underline">{children}</a>
  ),
}

export function PanelChat({
  open,
  onClose,
  context,
  countyName,
}: {
  open: boolean
  onClose: () => void
  /** Free-form context label (team, division, section, etc.). */
  context?: string
  /** @deprecated Use `context`. Retained temporarily for legacy callers. */
  countyName?: string
}) {
  const label = context ?? countyName ?? ''
  const { messages, isStreaming, sendMessage, stopStreaming, clearMessages } = useChat()
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef   = useRef<HTMLDivElement>(null)

  // Reset the conversation when the panel opens or the context changes.
  useEffect(() => {
    if (open) clearMessages()
  }, [open, label, clearMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-grow textarea, capped at ~120px.
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [input])

  const submit = () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    sendMessage(trimmed, PANEL_MODEL, label)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const footer = (
    <div className="px-5 pt-3 pb-4 space-y-2.5 border-t border-[var(--paper-rule)]">
      {/* Context label */}
      <div
        className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-[var(--paper-faint)]"
        style={SANS}
      >
        <span aria-hidden className="inline-block w-4 h-px bg-[var(--paper-rule)]" />
        <span>{label}</span>
      </div>

      {/* Input — variant of ChatInput from /chat (textarea + send, no toolbar) */}
      <div
        className="flex flex-col border border-[var(--paper-rule)] bg-[var(--paper-quiet)] px-4 pt-3 pb-3 gap-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
        style={{ borderRadius: 3 }}
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={CHAT_PLACEHOLDER_PANEL}
            className="flex-1 resize-none bg-transparent py-1 text-[15px] text-[var(--paper-text)] placeholder:text-[var(--paper-faint)] outline-none leading-relaxed"
            style={{ minHeight: '32px', ...SERIF }}
          />
          <button
            onClick={isStreaming ? stopStreaming : submit}
            disabled={!isStreaming && !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center text-white transition-opacity disabled:opacity-25 hover:opacity-85"
            style={{
              borderRadius: 3,
              background: isStreaming ? '#dc2626' : 'var(--paper-strong)',
            }}
            aria-label={isStreaming ? 'Stop' : 'Send'}
          >
            {isStreaming
              ? <Square className="h-3.5 w-3.5" fill="currentColor" />
              : <ArrowUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--paper-faint)]" style={SANS}>
        Chat Panel
      </p>
    </div>
  )

  return (
    <AppPanel open={open} onClose={onClose} title={APP_NAME} footer={footer}>
      <div className="px-5 py-5">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 pt-14 text-center">
            <AppLogo className="h-10 w-10" />
            <p className="text-[15px] italic text-[var(--paper-muted)] max-w-[260px] leading-relaxed" style={SERIF}>
              {CHAT_PANEL_INTRO}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map(msg => {
              const isUser = msg.role === 'user'
              const empty  = !isUser && msg.content.length === 0
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mr-2 mt-0.5 border border-[var(--paper-rule)] bg-[var(--paper-quiet)]">
                      <AppLogo className="h-3 w-3" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] px-3.5 py-2.5 ${
                      isUser
                        ? 'border border-[var(--paper-rule)] bg-[var(--paper-quiet)] text-[var(--paper-text)] text-[14px] leading-relaxed'
                        : 'bg-[var(--paper-quiet)] text-[var(--paper-text)]'
                    }`}
                    style={{ ...SERIF, borderRadius: 3 }}
                  >
                    {isUser ? (
                      msg.content
                    ) : empty ? (
                      <span className="inline-block w-1.5 h-3.5 bg-[var(--paper-faint)] animate-pulse" />
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </AppPanel>
  )
}

