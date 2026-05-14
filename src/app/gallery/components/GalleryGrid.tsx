'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import HeroCard from './HeroCard'
import type { GalleryPhoto } from '@/lib/gallery'

export default function GalleryGrid({
  photos,
  lastViewed,
}: {
  photos: GalleryPhoto[]
  lastViewed?: number
}) {
  const lastRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (lastViewed !== undefined && lastRef.current) {
      lastRef.current.scrollIntoView({ block: 'center', behavior: 'instant' })
    }
  }, [lastViewed])

  return (
    <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 2xl:columns-4 px-4 py-4">
      <HeroCard />
      {photos.map(photo => (
        <Link
          key={photo.id}
          href={`/gallery/p/${photo.id}`}
          ref={photo.id === lastViewed ? lastRef : undefined}
          scroll={false}
          className="group relative mb-4 block w-full cursor-zoom-in overflow-hidden rounded-xl"
        >
          <Image
            src={photo.url}
            alt=""
            width={720}
            height={480}
            className="w-full transform rounded-xl brightness-90 transition duration-300 will-change-auto group-hover:brightness-110 group-hover:scale-[1.02]"
            unoptimized
          />
        </Link>
      ))}
    </div>
  )
}
