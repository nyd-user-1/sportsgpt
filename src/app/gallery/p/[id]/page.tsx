import { notFound } from 'next/navigation'
import { getPhotos } from '@/lib/gallery'
import SharedModal from '../../components/SharedModal'

// Cached for an hour, not rendered per request: nothing here reads searchParams,
// cookies or headers, and every crawler hit used to be a Neon query. Rosters and
// scores change between games, not between seconds. (Was force-dynamic.)
export const revalidate = 3600

export default async function PhotoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id }  = await params
  const photos  = await getPhotos()
  const idx     = photos.findIndex(p => p.id === id)

  if (idx === -1) notFound()

  return <SharedModal photos={photos} currentIdx={idx} direction={1} />
}
