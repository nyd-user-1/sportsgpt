import { notFound } from 'next/navigation'
import { getPhotos } from '@/lib/gallery'
import SharedModal from '../../components/SharedModal'

export const dynamic = 'force-dynamic'

export default async function PhotoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const photos  = await getPhotos()
  const idx     = Number(id)

  if (isNaN(idx) || idx < 0 || idx >= photos.length) notFound()

  return <SharedModal photos={photos} currentId={idx} direction={1} />
}
