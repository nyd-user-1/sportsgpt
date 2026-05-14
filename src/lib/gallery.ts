import { list } from '@vercel/blob'
import { unstable_cache } from 'next/cache'

export type GalleryPhoto = {
  id: number
  url: string
  pathname: string
  category: 'teams' | 'players' | 'logos' | 'other'
}

async function fetchPhotos(): Promise<GalleryPhoto[]> {
  const allBlobs: GalleryPhoto[] = []
  let cursor: string | undefined

  do {
    const res = await list({ prefix: 'gallery/', cursor, limit: 1000 })
    res.blobs.forEach((b, _i) => {
      const cat: GalleryPhoto['category'] =
        b.pathname.startsWith('gallery/teams/')   ? 'teams'   :
        b.pathname.startsWith('gallery/players/') ? 'players' :
        b.pathname.startsWith('gallery/logos/')   ? 'logos'   : 'other'

      // skip logos from the main gallery view
      if (cat === 'logos') return

      allBlobs.push({
        id:       0, // assigned below
        url:      b.url,
        pathname: b.pathname,
        category: cat,
      })
    })
    cursor = res.cursor
  } while (cursor)

  // sort: teams first, then players, alphabetically within each
  allBlobs.sort((a, b) => {
    if (a.category !== b.category) return a.category === 'teams' ? -1 : 1
    return a.pathname.localeCompare(b.pathname)
  })

  return allBlobs.map((p, i) => ({ ...p, id: i }))
}

export const getPhotos = unstable_cache(fetchPhotos, ['gallery-photos'], {
  revalidate: 3600, // re-fetch from Blob at most once per hour
})
