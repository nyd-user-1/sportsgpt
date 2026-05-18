import Image from 'next/image'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import { SCHOOL_COLORS } from '@/lib/school-colors'

function slugToName(slug: string) {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export default function ColorsPage() {
  const entries = Object.entries(SCHOOL_COLORS).sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Section XI School Colors</h1>
        <p className="text-sm text-gray-500 mb-8">
          {entries.length} schools · Review and confirm before map deployment
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {entries.map(([slug, color]) => {
            const logoUrl = SCHOOL_LOGOS[slug]
            return (
              <div
                key={slug}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center gap-2 text-center"
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
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
