'use client'

import { AppLogo } from '@/components/AppLogo'
import { AppLayout } from '@/components/AppLayout'
import { ChatInput } from '@/components/ChatInput'
import { CardCarouselPortrait } from '@/components/CardCarouselPortrait'
import { APP_NAME, APP_TAGLINE } from '@/lib/app-config'

export default function HomePage() {
  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center justify-center min-h-full px-4 py-8">
          <div className="w-full max-w-[773px] flex flex-col gap-6">

            {/* Logo */}
            <div className="flex justify-center">
              <div className="flex items-center gap-2">
                <AppLogo className="h-9 w-9" />
                <h1 className="text-3xl font-bold text-[var(--txt)]">{APP_NAME}</h1>
              </div>
            </div>

            {/* ChatInput */}
            <div className="relative">
              <ChatInput />
              <p className="text-center text-[10px] text-[var(--muted2)] mt-2">
                {APP_TAGLINE} · Design &amp; Development by NYSgpt
              </p>
            </div>

            {/* Explore carousel */}
            <div className="max-w-[636px] mx-auto w-full">
              <CardCarouselPortrait />
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  )
}
