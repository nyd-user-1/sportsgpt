import { getPhotos } from '@/lib/gallery'
import GalleryGrid from '@/app/gallery/components/GalleryGrid'

export const dynamic = 'force-dynamic'

export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<{ last?: string }>
}) {
  const { last } = await searchParams
  const photos    = await getPhotos()
  return (
    <div className="min-h-screen">
      <GalleryGrid photos={photos} lastViewed={last ?? undefined} />
    </div>
  )
}
