'use client'

import Image from 'next/image'
import { AppPanel } from './AppPanel'
import { TEAM_PHOTOS } from '@/lib/team-images'

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
                  <div key={i} className="relative aspect-[3/2] rounded-xl overflow-hidden bg-[var(--inp-bg)]">
                    <Image src={url} alt={homeName} fill className="object-cover object-top" unoptimized />
                  </div>
                ))}
              </div>
            </div>
          )}
          {awayPhotos.length > 0 && (
            <div className="px-4 pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">{awayName}</p>
              <div className="grid grid-cols-1 @[520px]:grid-cols-2 gap-3">
                {awayPhotos.map((url, i) => (
                  <div key={i} className="relative aspect-[3/2] rounded-xl overflow-hidden bg-[var(--inp-bg)]">
                    <Image src={url} alt={awayName} fill className="object-cover object-top" unoptimized />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AppPanel>
  )
}
