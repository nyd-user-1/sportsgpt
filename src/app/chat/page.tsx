'use client'

import { useRef, useEffect, useCallback } from 'react'
import { AppLogo } from '@/components/AppLogo'
import { AppLayout } from '@/components/AppLayout'
import { ChatInput, type ChatInputHandle } from '@/components/ChatInput'
import { ChatMessage } from '@/components/ChatMessage'
import { CardCarouselExplore } from '@/components/CardCarouselExplore'
import { APP_NAME, APP_TAGLINE } from '@/lib/app-config'
import { useChat } from '@/hooks/useChat'
import { ArrowDown } from 'lucide-react'
import { useState } from 'react'

export default function ChatPage() {
  const { messages, isStreaming, sendMessage, stopStreaming } = useChat()
  const scrollRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<ChatInputHandle>(null)
  const isNearBottomRef = useRef(true)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const lastUserMsgRef = useRef<HTMLDivElement>(null)

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

  // Auto-scroll when near bottom; show button when content pushed off-screen during streaming
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
      <AppLayout>
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col items-center justify-center min-h-full px-4 py-8">
            <div className="w-full max-w-[773px] flex flex-col gap-6">

              <div className="flex justify-center">
                <div className="flex items-center gap-2">
                  <AppLogo className="h-9 w-9" />
                  <h1 className="text-3xl font-bold text-[var(--txt)]">{APP_NAME}</h1>
                </div>
              </div>

              <div className="relative">
                <ChatInput
                  ref={chatInputRef}
                  onSend={(msg, model) => sendMessage(msg, model)}
                  onStop={stopStreaming}
                  isStreaming={isStreaming}
                />
                <p className="text-center text-[10px] text-[var(--muted2)] mt-2">
                  {APP_TAGLINE} · Design &amp; Development by NYSgpt
                </p>
              </div>

              <div className="max-w-[636px] mx-auto w-full">
                <CardCarouselExplore onTeamClick={(prompt) => sendMessage(prompt)} />
              </div>

            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-1 flex-col overflow-hidden">
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
                    onSend={sendMessage}
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
                className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-lg hover:shadow-xl transition-shadow"
              >
                <ArrowDown className="h-4 w-4 text-[var(--txt2)]" />
              </button>
            </div>
          )}
          <div className="px-4 py-3">
            <div className="mx-auto max-w-3xl">
              <ChatInput
                onSend={(msg, model) => sendMessage(msg, model)}
                onStop={stopStreaming}
                isStreaming={isStreaming}
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
