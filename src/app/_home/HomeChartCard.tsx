import Link from 'next/link'
import Image from 'next/image'
import { TABLET_RADIUS } from '@/components/editorial'
import { SCHOOL_LOGOS } from '@/lib/team-images'
import type { FeaturedChart } from './data'

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const SANS  = { fontFamily: 'var(--font-sans), system-ui, sans-serif' }  as const

/**
 * Compact chart card for §IV. Matted color photo + serif title + tiny logo.
 * Mirrors the chart card pattern in ChartsAlmanac but at a smaller footprint
 * (intended for a 6-up row). Standalone — does not depend on the almanac file.
 */
export function HomeChartCard({ chart }: { chart: FeaturedChart }) {
  const logo = SCHOOL_LOGOS[chart.schoolSlug]
  return (
    <Link
      href={`/charts/${chart.slug}`}
      className="group/card flex flex-col text-left"
    >
      <div
        className="w-full border border-[var(--paper-rule)] bg-[var(--paper-quiet)] group-hover/card:border-[var(--paper-strong)] transition-colors"
        style={{ padding: 6, borderRadius: TABLET_RADIUS }}
      >
        <div
          className="relative w-full overflow-hidden bg-[var(--paper)]"
          style={{ aspectRatio: '4 / 5', borderRadius: 1 }}
        >
          {chart.photo
            ? (
              <Image
                src={chart.photo}
                alt=""
                fill
                className="object-cover object-top transition-transform duration-500 ease-out group-hover/card:scale-[1.02]"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                unoptimized
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                {logo && <Image src={logo} alt="" width={48} height={48} className="opacity-70 object-contain" unoptimized />}
              </div>
            )
          }
        </div>
      </div>
      <div className="mt-3 flex items-start gap-2">
        {logo && (
          <Image src={logo} alt="" width={16} height={16} className="mt-0.5 shrink-0 object-contain opacity-90" unoptimized />
        )}
        <p
          className="text-[13.5px] leading-[1.25] text-[var(--paper-text)] group-hover/card:text-[var(--paper-strong)] transition-colors"
          style={{ ...SERIF, fontWeight: 500, letterSpacing: '-0.005em' }}
        >
          {chart.title}
        </p>
      </div>
    </Link>
  )
}
