'use client'

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { ArrowUp, Square, MapPin, Mic, Check, ChevronUp } from 'lucide-react'
import { PlusMenu } from '@/components/PlusMenu'
import { CHAT_PLACEHOLDER } from '@/lib/app-config'

export const CHAT_MODELS = [
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku',  provider: 'Anthropic' },
  { id: 'claude-sonnet-4-6',         label: 'Claude Sonnet', provider: 'Anthropic' },
  { id: 'gpt-4o-mini',               label: 'GPT-4o Mini',   provider: 'OpenAI'    },
  { id: 'gpt-4o',                    label: 'GPT-4o',        provider: 'OpenAI'    },
  { id: 'gemini-2.0-flash',          label: 'Gemini 2.0',    provider: 'Gemini'    },
] as const

export type ChatModelId = typeof CHAT_MODELS[number]['id']

export const DEFAULT_MODEL: ChatModelId = 'claude-haiku-4-5-20251001'

export interface ChatInputHandle {
  injectPrompt: (text: string) => void
}

interface Props {
  onSend?: (message: string, model: ChatModelId) => void
  onStop?: () => void
  isStreaming?: boolean
}

export const ChatInput = forwardRef<ChatInputHandle, Props>(function ChatInput(
  { onSend, onStop, isStreaming = false },
  ref
) {
  const [input, setInput] = useState('')
  const [selectedModel, setSelectedModel] = useState<ChatModelId>(DEFAULT_MODEL)
  const [menuOpen, setMenuOpen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    injectPrompt: (text: string) => {
      setInput(text)
      setTimeout(() => textareaRef.current?.focus(), 0)
    },
  }))

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`
  }, [input])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const handleSubmit = () => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return
    onSend?.(trimmed, selectedModel)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const currentModel = CHAT_MODELS.find(m => m.id === selectedModel) ?? CHAT_MODELS[0]

  return (
    <div className="relative flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--inp-bg)] px-4 pt-3 pb-3 transition-all gap-1 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">

      {/* Model dropdown — opens upward */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute bottom-full right-4 mb-2 w-52 rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden py-1 z-50"
        >
          {CHAT_MODELS.map((m, i) => (
            <button
              key={m.id}
              onClick={() => { setSelectedModel(m.id); setMenuOpen(false) }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--inp-bg)] ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}
            >
              <span className="flex-1 text-left">
                <span className="font-medium text-[var(--txt)]">{m.label}</span>
                <span className="ml-2 text-[11px] text-[var(--muted)]">{m.provider}</span>
              </span>
              {m.id === selectedModel && <Check className="h-3.5 w-3.5 text-[#033882] shrink-0" />}
            </button>
          ))}
        </div>
      )}

      {/* Textarea */}
      <div className="flex items-start">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={CHAT_PLACEHOLDER}
          className="flex-1 resize-none bg-transparent py-1 text-[17px] text-[var(--txt)] placeholder:text-[var(--muted2)] outline-none leading-relaxed"
          style={{ minHeight: '40px' }}
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center pt-1">
        <PlusMenu onSelect={t => { setInput(t); textareaRef.current?.focus() }} />
        <button type="button" className="ml-2 flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-black/7 hover:text-[var(--txt)] transition-colors">
          <MapPin className="h-4 w-4" />
        </button>
        <button type="button" className="ml-2 flex h-8 w-8 items-center justify-center rounded-full text-[var(--muted)] hover:bg-black/7 hover:text-[var(--txt)] transition-colors">
          <Mic className="h-4 w-4" />
        </button>
        <div className="flex-1" />

        {/* Model selector button */}
        <button
          type="button"
          onClick={() => setMenuOpen(o => !o)}
          className={`mr-2 flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors ${
            menuOpen
              ? 'bg-[#033882]/10 text-[#033882]'
              : 'text-[var(--muted)] hover:bg-[var(--inp-bg)] hover:text-[var(--txt)]'
          }`}
        >
          <span>{currentModel.label}</span>
          <ChevronUp className={`h-3 w-3 transition-transform ${menuOpen ? '' : 'rotate-180'}`} />
        </button>

        {/* Send / Stop */}
        <button
          type="button"
          onClick={isStreaming ? onStop : handleSubmit}
          disabled={!isStreaming && !input.trim()}
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors disabled:opacity-25 ${
            isStreaming
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-[#1a1a1a] hover:opacity-80 text-white'
          }`}
        >
          {isStreaming ? <Square className="h-4 w-4" fill="currentColor" /> : <ArrowUp className="h-4 w-4" />}
        </button>
      </div>

    </div>
  )
})
