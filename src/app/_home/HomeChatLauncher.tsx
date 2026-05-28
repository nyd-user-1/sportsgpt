'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ChatInput, type ChatModelId } from '@/components/ChatInput'
import { TABLET_RADIUS } from '@/components/editorial'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import type { ChatPrompt } from './data'

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const SANS  = { fontFamily: 'var(--font-sans), system-ui, sans-serif' }  as const

/**
 * §VIII — live ChatInput wired to navigate to /chat with the prompt pre-filled
 * via `?q=`. Three suggested prompts below sit in a 3-up row and submit the
 * same way. No streaming here — the chat itself happens on /chat.
 */
export function HomeChatLauncher({ prompts }: { prompts: ChatPrompt[] }) {
  const router = useRouter()

  function sendTo(q: string, model: ChatModelId) {
    router.push(`/chat?q=${encodeURIComponent(q)}&model=${encodeURIComponent(model)}`)
  }

  return (
    <div className="flex flex-col gap-6">
      <ChatInput onSend={sendTo} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {prompts.map((p, i) => {
          const logo = p.logoSchoolSlug ? SCHOOL_LOGOS[p.logoSchoolSlug] : null
          return (
            <Link
              key={i}
              href={`/chat?q=${encodeURIComponent(p.q)}`}
              className="group/prompt flex flex-col justify-between gap-3 border border-[var(--paper-rule)] bg-[var(--paper-quiet)] px-4 py-3.5 hover:border-[var(--paper-strong)] hover:bg-[color:color-mix(in_srgb,var(--paper-text)_4%,transparent)] transition-colors"
              style={{ borderRadius: TABLET_RADIUS, minHeight: 120 }}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 shrink-0 rounded-full bg-[var(--paper)] border border-[var(--paper-rule)] flex items-center justify-center overflow-hidden">
                  {logo && (
                    <Image src={logo} alt="" width={18} height={18} className="object-contain" unoptimized />
                  )}
                </div>
                <span
                  className="text-[9.5px] uppercase tracking-[0.24em] text-[var(--paper-faint)]"
                  style={SANS}
                >
                  Prompt {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <p
                className="text-[14.5px] leading-[1.35] text-[var(--paper-text)] group-hover/prompt:text-[var(--paper-strong)] transition-colors"
                style={{ ...SERIF, fontStyle: 'italic' }}
              >
                {p.q}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
