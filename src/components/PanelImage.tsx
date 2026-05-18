'use client'

import Image from 'next/image'
import { AppPanel } from './AppPanel'
import { TEAM_PHOTOS, SCHOOL_LOGOS } from '@/lib/team-images'

function PhotoCard({ url, teamName, schoolSlug }: { url: string; teamName: string; schoolSlug: string }) {
  const logo = SCHOOL_LOGOS[schoolSlug]
  return (
    <div className="group relative cursor-zoom-in overflow-hidden rounded-xl aspect-[3/2] after:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:content-[''] after:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]">
      <Image
        src={url}
        alt={teamName}
        fill
        className="object-cover object-top transform brightness-90 transition duration-300 will-change-auto group-hover:brightness-110 group-hover:scale-[1.02]"
        unoptimized
      />
      <div
        className="absolute bottom-0 inset-x-0 rounded-b-xl px-3 py-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out"
        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)' }}
      >
        <div className="flex items-center gap-2">
          {logo && (
            <Image src={logo} alt="" width={28} height={28} className="shrink-0 object-contain" unoptimized />
          )}
          <p className="text-white text-sm font-bold leading-snug truncate">{teamName}</p>
        </div>
      </div>
    </div>
  )
}

export function PanelImage({
  open, onClose,
  homeSchool, homeName,
  awaySchool, awayName,
}: {
  open: boolean
  onClose: () => void
  homeSchool: string
  homeName: string
  awaySchool: string
  awayName: string
}) {
  const homePhotos = TEAM_PHOTOS[homeSchool] ?? []
  const awayPhotos = TEAM_PHOTOS[awaySchool] ?? []

  if (!open) return null

  return (
    <AppPanel open={open} onClose={onClose} title="Photos">
      {homePhotos.length === 0 && awayPhotos.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-sm text-[var(--muted)]">No photos available</div>
      ) : (
        <div className="@container pb-4">
          {homePhotos.length > 0 && (
            <div className="px-4 pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">{homeName}</p>
              <div className="grid grid-cols-1 @[520px]:grid-cols-2 gap-3">
                {homePhotos.map((url, i) => (
                  <PhotoCard key={i} url={url} teamName={homeName} schoolSlug={homeSchool} />
                ))}
              </div>
            </div>
          )}
          {awayPhotos.length > 0 && (
            <div className="px-4 pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">{awayName}</p>
              <div className="grid grid-cols-1 @[520px]:grid-cols-2 gap-3">
                {awayPhotos.map((url, i) => (
                  <PhotoCard key={i} url={url} teamName={awayName} schoolSlug={awaySchool} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AppPanel>
  )
}
