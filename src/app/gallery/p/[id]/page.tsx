import { notFound } from 'next/navigation'
import { getPhotos } from '@/lib/gallery'
import SharedModal from '../../components/SharedModal'

export const dynamic = 'force-dynamic'

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
