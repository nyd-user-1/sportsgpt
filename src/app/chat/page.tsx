'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { AppLogo } from '@/components/AppLogo'
import { AppLayout } from '@/components/AppLayout'
import { ChatInput, type ChatInputHandle, type ChatModelId, DEFAULT_MODEL } from '@/components/ChatInput'
import { ChatMessage } from '@/components/ChatMessage'
import { ChatSeasonsPanel, type TeamMeta } from '@/components/ChatSeasonsPanel'
import { CardCarousel } from '@/components/CardCarousel'
import { APP_NAME, APP_TAGLINE } from '@/lib/app-config'
import { useChat } from '@/hooks/useChat'
import { PAPER_BRIDGE } from '@/components/editorial'
import { ArrowDown } from 'lucide-react'

const SERIF: React.CSSProperties = { fontFamily: 'var(--font-display), Georgia, serif' }
const SANS:  React.CSSProperties = { fontFamily: 'var(--font-sans), system-ui, sans-serif' }

const GRAIN_STYLE: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='256' height='256'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: '180px 180px',
  opacity: 0.035,
  mixBlendMode: 'overlay' as const,
}

export default function ChatPage() {
  const { messages, isStreaming, sendMessage, stopStreaming } = useChat()
  const [selectedModel, setSelectedModel] = useState<ChatModelId>(DEFAULT_MODEL)
  const scrollRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<ChatInputHandle>(null)
  const isNearBottomRef = useRef(true)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const lastUserMsgRef = useRef<HTMLDivElement>(null)

  // Seasons panel state
  const [panelTeams, setPanelTeams] = useState<TeamMeta[]>([])
  const [panelOpen, setPanelOpen] = useState(false)

  const openSeasons = useCallback((teams: TeamMeta[]) => {
    setPanelTeams(teams)
    setPanelOpen(true)
  }, [])

  const hasMessages = messages.length > 0

  // When streaming starts, stop auto-scroll so user stays anchored at their question
  useEffect(() => {
    if (isStreaming) isNearBottomRef.current = false
  }, [isStreaming])

  // Scroll user bubble to ~1/3 from top on follow-up questions
  useEffect(() => {
    if (messages.length < 3) return
    const lastMsg = messages[messages.length - 1]
    if (lastMsg.role !== 'user') return
    const el = scrollRef.current
    const msgEl = lastUserMsgRef.current
    if (!el || !msgEl) return
    const msgRect = msgEl.getBoundingClientRect()
    const containerRect = el.getBoundingClientRect()
    const targetScrollTop = el.scrollTop + (msgRect.top - containerRect.top) - el.clientHeight * 0.33
    el.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' })
  }, [messages])

  // Auto-scroll when near bottom
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (isNearBottomRef.current) {
      el.scrollTop = el.scrollHeight
      setShowScrollBtn(false)
    } else {
      const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 80
      if (!nearBottom) setShowScrollBtn(true)
    }
  }, [messages])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 80
    isNearBottomRef.current = nearBottom
    setShowScrollBtn(!nearBottom)
  }, [])

  if (!hasMessages) {
    return (
      <AppLayout paperMode>
        {/* Grain overlay */}
        <div className="fixed inset-0 pointer-events-none z-[999]" style={GRAIN_STYLE} />
        <div className="flex-1 overflow-y-auto" style={PAPER_BRIDGE}>
          <div className="flex flex-col items-center justify-center min-h-full px-4 py-8">
            <div className="w-full max-w-[773px] flex flex-col gap-6">

              {/* Brand block — eyebrow + logo + name + rule */}
              <div className="flex flex-col items-center gap-3">
                <p
                  className="text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)]"
                  style={SANS}
                >
                  Section XI · Football
                </p>
                <div className="flex items-center gap-2.5">
                  <AppLogo className="h-9 w-9" />
                  <h1
                    className="text-[var(--paper-text)]"
                    style={{ ...SERIF, fontSize: 30, fontWeight: 500, letterSpacing: '-0.02em' }}
                  >
                    {APP_NAME}
                  </h1>
                </div>
                <div className="w-full max-w-[480px] border-t border-[var(--paper-rule)] mt-1" />
              </div>

              <div className="relative">
                <ChatInput
                  ref={chatInputRef}
                  onSend={(msg, model) => sendMessage(msg, model)}
                  onStop={stopStreaming}
                  isStreaming={isStreaming}
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                />
                <p
                  className="text-center text-[13px] text-[var(--paper-muted)] mt-3"
                  style={{ ...SERIF, fontStyle: 'italic' }}
                >
                  {APP_TAGLINE} · Design &amp; Development by NYSgpt
                </p>
              </div>

              <div className="max-w-[636px] mx-auto w-full">
                <CardCarousel onTeamClick={(prompt) => sendMessage(prompt, selectedModel)} />
              </div>

            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout paperMode>
      {/* Grain overlay */}
      <div className="fixed inset-0 pointer-events-none z-[999]" style={GRAIN_STYLE} />
      <div className="flex flex-1 flex-col overflow-hidden" style={PAPER_BRIDGE}>
        {/* Messages */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-4">
            {messages.map((msg, i) => {
              const isLastUser = msg.role === 'user' && i === messages.length - 1
              return (
                <div key={msg.id} ref={isLastUser ? lastUserMsgRef : undefined}>
                  <ChatMessage
                    message={msg}
                    isStreaming={isStreaming && msg.role === 'assistant' && i === messages.length - 1}
                    onSend={(content) => sendMessage(content, selectedModel)}
                    onOpenSeasons={openSeasons}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* Scroll to bottom button */}
        <div className="shrink-0 relative">
          {showScrollBtn && (
            <div className="absolute bottom-full left-0 right-0 flex justify-center pb-4 pointer-events-none z-50">
              <button
                onClick={() => {
                  const el = scrollRef.current
                  if (!el) return
                  el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
                  isNearBottomRef.current = true
                  setShowScrollBtn(false)
                }}
                className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-[var(--paper)] border border-[var(--paper-rule)] shadow-lg hover:shadow-xl transition-shadow"
              >
                <ArrowDown className="h-4 w-4 text-[var(--paper-muted)]" />
              </button>
            </div>
          )}
          <div className="px-4 py-3 border-t border-[var(--paper-rule)]" style={{ background: 'var(--paper)' }}>
            <div className="mx-auto max-w-3xl">
              <ChatInput
                onSend={(msg, model) => sendMessage(msg, model)}
                onStop={stopStreaming}
                isStreaming={isStreaming}
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seasons drill-down panel */}
      <ChatSeasonsPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        teams={panelTeams}
      />
    </AppLayout>
  )
}
