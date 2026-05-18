'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Check, X } from 'lucide-react'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { SCHOOL_COLORS } from '@/lib/school-colors'

function slugToName(slug: string) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const ENTRIES = Object.entries(SCHOOL_COLORS).sort(([a], [b]) => a.localeCompare(b))
const LS_KEY = 'colors-review-state'

type ReviewState = Record<string, 'confirmed' | 'flagged' | null>

export default function ColorsPage() {
  const [review, setReview] = useState<ReviewState>({})

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) setReview(JSON.parse(saved))
    } catch {}
  }, [])

  function toggle(slug: string, action: 'confirmed' | 'flagged') {
    setReview(prev => {
      const next = { ...prev, [slug]: prev[slug] === action ? null : action }
      localStorage.setItem(LS_KEY, JSON.stringify(next))
      return next
    })
  }

  const confirmed = ENTRIES.filter(([s]) => review[s] === 'confirmed').length
  const flagged   = ENTRIES.filter(([s]) => review[s] === 'flagged').length
  const remaining = ENTRIES.length - confirmed - flagged

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Section XI School Colors</h1>
            <p className="text-sm text-gray-500">
              <span className="text-green-600 font-medium">{confirmed} confirmed</span>
              {flagged > 0 && <> · <span className="text-red-500 font-medium">{flagged} flagged</span></>}
              {remaining > 0 && <> · {remaining} remaining</>}
            </p>
          </div>
          {(confirmed + flagged) > 0 && (
            <button
              onClick={() => { setReview({}); localStorage.removeItem(LS_KEY) }}
              className="text-xs text-gray-400 hover:text-gray-600 underline mt-1"
            >
              Reset all
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {ENTRIES.map(([slug, color]) => {
            const logoUrl  = SCHOOL_LOGOS[slug]
            const state    = review[slug] ?? null
            const isGood   = state === 'confirmed'
            const isBad    = state === 'flagged'

            return (
              <div
                key={slug}
                className={`bg-white rounded-xl shadow-sm border-2 p-4 flex flex-col items-center gap-2 text-center transition-colors ${
                  isGood ? 'border-green-400 bg-green-50'
                  : isBad ? 'border-red-400 bg-red-50'
                  : 'border-transparent'
                }`}
              >
                <div className="h-12 w-12 flex items-center justify-center">
                  {logoUrl ? (
                    <Image src={logoUrl} alt={slug} width={48} height={48} className="object-contain" unoptimized />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100" />
                  )}
                </div>

                <p className="text-[11px] font-semibold text-gray-800 leading-snug">
                  {slugToName(slug)}
                </p>

                <div className="flex gap-1.5">
                  <div
                    className="w-7 h-7 rounded-md border border-black/10 shadow-sm"
                    style={{ background: color.primary }}
                    title={color.primary}
                  />
                  <div
                    className="w-7 h-7 rounded-md border border-black/10 shadow-sm"
                    style={{ background: color.secondary }}
                    title={color.secondary}
                  />
                </div>

                <p className="text-[10px] text-gray-400">{color.label}</p>

                <div className="flex gap-2 mt-0.5">
                  <button
                    onClick={() => toggle(slug, 'confirmed')}
                    title="Confirm"
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                      isGood
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </button>
                  <button
                    onClick={() => toggle(slug, 'flagged')}
                    title="Flag for correction"
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                      isBad
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
