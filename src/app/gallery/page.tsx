import { getPhotos } from '@/lib/gallery'
import GalleryGrid from './components/GalleryGrid'

export const dynamic = 'force-dynamic'

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ last?: string }>
}) {
  const { last } = await searchParams
  const photos   = await getPhotos()
  const lastViewed = last ?? undefined

  return (
    <div className="min-h-screen">
      <GalleryGrid photos={photos} lastViewed={lastViewed} />
    </div>
  )
}
