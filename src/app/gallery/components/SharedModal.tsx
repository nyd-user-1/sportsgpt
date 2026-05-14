'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, MotionConfig } from 'framer-motion'
import { useSwipeable } from 'react-swipeable'
import { X, ChevronLeft, ChevronRight, ArrowDownToLine, ExternalLink } from 'lucide-react'
import type { GalleryPhoto } from '@/lib/gallery'


function range(lo: number, hi: number) {
  return Array.from({ length: hi - lo }, (_, i) => lo + i)
}

export default function SharedModal({
  photos,
  currentId,
  direction,
}: {
  photos: GalleryPhoto[]
  currentId: number
  direction: number
}) {
  const router = useRouter()
  const current = photos[currentId]
  const hasNext = currentId < photos.length - 1
  const hasPrev = currentId > 0

  function navigate(newId: number) {
    router.push(`/gallery/p/${newId}`, { scroll: false })
  }

  function close() {
    router.push('/gallery', { scroll: false })
  }

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' && hasNext) navigate(currentId + 1)
      if (e.key === 'ArrowLeft'  && hasPrev) navigate(currentId - 1)
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [currentId, hasNext, hasPrev])

  const handlers = useSwipeable({
    onSwipedLeft:  () => { if (hasNext) navigate(currentId + 1) },
    onSwipedRight: () => { if (hasPrev) navigate(currentId - 1) },
    trackMouse: true,
  })

  // Filmstrip: show ±15 around current
  const strip = photos.filter(p => range(currentId - 15, currentId + 16).includes(p.id))

  async function download() {
    const res  = await fetch(current.url)
    const blob = await res.blob()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = current.pathname.split('/').pop() ?? 'photo.jpg'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <MotionConfig transition={{ x: { type: 'spring', stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }}>
      <div className="fixed inset-0 z-50 flex flex-col bg-black" {...handlers}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <button onClick={close} className="rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
          <span className="text-white/40 text-sm">{currentId + 1} / {photos.length}</span>
          <div className="flex items-center gap-1">
            <a href={current.url} target="_blank" rel="noreferrer"
              className="rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              <ExternalLink className="h-5 w-5" />
            </a>
            <button onClick={download}
              className="rounded-full p-2 text-white/70 hover:text-white hover:bg-white/10 transition-colors">
              <ArrowDownToLine className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main image — fade + scale-up on mount */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          <motion.div key={currentId}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center">
            <Image
              src={current.url}
              alt=""
              fill
              className="object-contain"
              unoptimized
              priority
            />
          </motion.div>

          {/* Prev */}
          {hasPrev && (
            <button onClick={() => navigate(currentId - 1)}
              className="absolute left-4 z-10 rounded-full p-3 bg-black/40 text-white hover:bg-black/70 transition-colors backdrop-blur-sm">
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {/* Next */}
          {hasNext && (
            <button onClick={() => navigate(currentId + 1)}
              className="absolute right-4 z-10 rounded-full p-3 bg-black/40 text-white hover:bg-black/70 transition-colors backdrop-blur-sm">
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Filmstrip */}
        {(() => {
          const THUMB_W = 80  // w-20
          const GAP     = 4   // gap-1
          const STEP    = THUMB_W + GAP  // 84px per slot
          const idxInStrip = strip.findIndex(p => p.id === currentId)
          // Center the active thumb: shift strip left so active thumb sits at viewport center
          const offsetPx = idxInStrip * STEP + THUMB_W / 2
          return (
            <div className="shrink-0 h-24 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-10" />
              <motion.div
                className="flex items-center gap-1 absolute top-0 bottom-0"
                initial={{ left: `calc(50% - ${offsetPx}px)` }}
                animate={{ left: `calc(50% - ${offsetPx}px)` }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}>
                {strip.map(p => {
                  const isActive = p.id === currentId
                  return (
                    <button key={p.id} onClick={() => navigate(p.id)}
                      className="relative shrink-0 overflow-hidden rounded transition-all duration-200"
                      style={{
                        width:   isActive ? 92  : THUMB_W,
                        height:  isActive ? 76  : 60,
                        opacity: isActive ? 1   : 0.4,
                        outline: isActive ? '2px solid rgba(255,255,255,0.7)' : 'none',
                        outlineOffset: '2px',
                      }}>
                      <Image src={p.url} alt="" fill className="object-cover" unoptimized />
                    </button>
                  )
                })}
              </motion.div>
            </div>
          )
        })()}

      </div>
    </MotionConfig>
  )
}
