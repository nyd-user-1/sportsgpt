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
  const lastViewed = last ? Number(last) : undefined

  return (
    <div className="min-h-screen bg-black">
      <GalleryGrid photos={photos} lastViewed={lastViewed} />
    </div>
  )
}
