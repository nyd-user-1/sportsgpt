'use client'

import { useRef, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'
import Image from 'next/image'
import Link from 'next/link'
import HeroCard from './HeroCard'
import type { GalleryPhoto } from '@/lib/gallery'
import { SCHOOL_LOGOS } from '@/lib/team-images'

export default function GalleryGrid({
  photos,
  lastViewed,
}: {
  photos: GalleryPhoto[]
  lastViewed?: string
}) {
  const lastRef = useRef<HTMLAnchorElement>(null)
  const [dark, setDark] = useState(true)

  useEffect(() => {
    if (lastViewed !== undefined && lastRef.current) {
      lastRef.current.scrollIntoView({ block: 'center', behavior: 'instant' })
    }
  }, [lastViewed])

  function handleToggle(e: React.MouseEvent) {
    const x = e.clientX
    const y = e.clientY

    if (!document.startViewTransition) {
      setDark(d => !d)
      return
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    )

    const transition = document.startViewTransition(() => {
      flushSync(() => setDark(d => !d))
    })

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 600,
          easing: 'cubic-bezier(.76,.32,.29,.99)',
          pseudoElement: '::view-transition-new(root)',
        }
      )
    })
  }

  const tileRing = dark
    ? 'after:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
    : 'after:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]'

  return (
    <div className={dark ? 'bg-black' : 'bg-[#e8e8e8]'}>
      <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4 px-4 py-4">
        <HeroCard dark={dark} onToggle={handleToggle} />
        {photos.map((photo, i) => (
          <GalleryTile
            key={photo.id}
            photo={photo}
            tileRing={tileRing}
            priority={i < 4}
            linkRef={photo.id === lastViewed ? lastRef : undefined}
          />
        ))}
      </div>
    </div>
  )
}

function GalleryTile({
  photo,
  tileRing,
  priority,
  linkRef,
}: {
  photo: GalleryPhoto
  tileRing: string
  priority: boolean
  linkRef?: React.Ref<HTMLAnchorElement>
}) {
  // Defer the school-logo download until the tile is actually hovered. The
  // overlay is hidden (translate-y-full) until hover, so eager-loading the logo
  // on every tile just wastes a request per tile during scroll-through.
  const [hovered, setHovered] = useState(false)

  return (
    <Link
      href={`/gallery/p/${photo.id}`}
      ref={linkRef}
      scroll={false}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`group relative mb-4 block w-full cursor-zoom-in overflow-hidden rounded-xl after:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:content-[''] ${tileRing}`}
    >
      <Image
        src={photo.url}
        alt={photo.playerName ?? ''}
        width={720}
        height={480}
        priority={priority}
        className="w-full transform rounded-xl brightness-90 transition duration-300 will-change-auto group-hover:brightness-110 group-hover:scale-[1.02]"
        unoptimized
      />
      {photo.teamName && (photo.category === 'players' ? photo.playerName : true) && (
        <div className="absolute bottom-0 inset-x-0 rounded-b-xl px-3 py-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)' }}>
          {photo.category === 'players' && photo.playerName ? (
            <div className="flex items-center gap-2">
              {hovered && photo.schoolSlug && SCHOOL_LOGOS[photo.schoolSlug] && (
                <Image
                  src={SCHOOL_LOGOS[photo.schoolSlug]}
                  alt=""
                  width={28}
                  height={28}
                  className="shrink-0 object-contain"
                  unoptimized
                />
              )}
              <div className="min-w-0">
                <p className="text-white text-sm font-bold leading-snug truncate">{photo.playerName}</p>
                <p className="text-white/60 text-xs truncate">{photo.teamName}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {hovered && photo.schoolSlug && SCHOOL_LOGOS[photo.schoolSlug] && (
                <Image
                  src={SCHOOL_LOGOS[photo.schoolSlug]}
                  alt=""
                  width={28}
                  height={28}
                  className="shrink-0 object-contain"
                  unoptimized
                />
              )}
              <p className="text-white text-sm font-bold leading-snug truncate">{photo.teamName}</p>
            </div>
          )}
        </div>
      )}
    </Link>
  )
}
