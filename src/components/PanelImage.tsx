'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft } from 'lucide-react'
import { AppPanel } from './AppPanel'
import { TEAM_PHOTOS, SCHOOL_LOGOS } from '@/lib/team-images'

function PhotoCard({ url, teamName, schoolSlug, onClick }: {
  url: string; teamName: string; schoolSlug: string; onClick?: () => void
}) {
  const logo = SCHOOL_LOGOS[schoolSlug]
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className="group relative w-full cursor-zoom-in overflow-hidden rounded-xl aspect-[3/2] after:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:content-[''] after:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]"
    >
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
    </Tag>
  )
}

type Team = { slug: string; name: string }

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
  const [selected, setSelected] = useState<Team | null>(null)

  // Reset to picker when panel closes
  useEffect(() => { if (!open) setSelected(null) }, [open])

  const homePhotos = TEAM_PHOTOS[homeSchool] ?? []
  const awayPhotos = TEAM_PHOTOS[awaySchool] ?? []

  const teams: { team: Team; photos: string[] }[] = [
    { team: { slug: homeSchool, name: homeName }, photos: homePhotos },
    { team: { slug: awaySchool, name: awayName }, photos: awayPhotos },
  ].filter(t => t.photos.length > 0)

  const panelTitle = selected ? (
    <div className="flex items-center gap-1 min-w-0">
      <button
        onClick={() => setSelected(null)}
        className="shrink-0 -ml-1 p-1 rounded-md text-[var(--muted)] hover:text-[var(--txt)] hover:bg-[var(--inp-bg)] transition-colors"
        aria-label="Back to photos"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="truncate">{selected.name}</span>
    </div>
  ) : 'Photos'

  const detailPhotos = selected ? (TEAM_PHOTOS[selected.slug] ?? []) : []

  return (
    <AppPanel open={open} onClose={onClose} title={panelTitle}>
      {selected ? (
        // ── Team detail view ──────────────────────────────────────────────
        <div className="@container pb-4 px-4 pt-4">
          <div className="grid grid-cols-1 @[520px]:grid-cols-2 gap-3">
            {detailPhotos.map((url, i) => (
              <PhotoCard key={i} url={url} teamName={selected.name} schoolSlug={selected.slug} />
            ))}
          </div>
        </div>
      ) : teams.length === 0 ? (
        // ── Empty ─────────────────────────────────────────────────────────
        <div className="flex items-center justify-center h-32 text-sm text-[var(--muted)]">No photos available</div>
      ) : (
        // ── Picker view ───────────────────────────────────────────────────
        <div className="@container pb-4">
          {teams.map(({ team, photos }) => (
            <div key={team.slug} className="px-4 pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] mb-3">{team.name}</p>
              <div className="grid grid-cols-1 @[520px]:grid-cols-2 gap-3">
                {photos.map((url, i) => (
                  <PhotoCard
                    key={i}
                    url={url}
                    teamName={team.name}
                    schoolSlug={team.slug}
                    onClick={() => setSelected(team)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppPanel>
  )
}
