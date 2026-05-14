/**
 * Uploads team photos and player photos to Vercel Blob.
 *
 * Usage:
 *   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_... node scripts/ingest-blob-photos.mjs
 *
 * Or add BLOB_READ_WRITE_TOKEN to .env.local first, then:
 *   node --env-file=.env.local scripts/ingest-blob-photos.mjs
 *
 * Photos land at:
 *   gallery/teams/{filename}
 *   gallery/players/{filename}
 */

import { put, list } from '@vercel/blob'
import { readFileSync, readdirSync } from 'fs'
import { join, extname } from 'path'

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.svg'])

const DIRS = [
  { folder: 'public/Images',       prefix: 'gallery/teams/'   },
  { folder: 'public/PlayerPhotos', prefix: 'gallery/players/' },
  { folder: 'public/Logos',        prefix: 'gallery/logos/'   },
]

const MIME = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.svg':  'image/svg+xml',
}

// Fetch existing blob paths so we don't re-upload
async function existingPaths() {
  const paths = new Set()
  let cursor
  do {
    const res = await list({ prefix: 'gallery/', cursor, limit: 1000 })
    res.blobs.forEach(b => paths.add(b.pathname))
    cursor = res.cursor
  } while (cursor)
  return paths
}

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    console.error('Missing BLOB_READ_WRITE_TOKEN. Run with:')
    console.error('  node --env-file=.env.local scripts/ingest-blob-photos.mjs')
    process.exit(1)
  }

  console.log('Fetching existing blobs...')
  const existing = await existingPaths()
  console.log(`${existing.size} blobs already in store.`)

  let uploaded = 0
  let skipped  = 0

  for (const { folder, prefix } of DIRS) {
    let files
    try {
      files = readdirSync(folder)
    } catch {
      console.warn(`Skipping ${folder} (not found)`)
      continue
    }

    const images = files.filter(f => IMAGE_EXTS.has(extname(f).toLowerCase()))
    console.log(`\n${folder}: ${images.length} images → ${prefix}`)

    for (const filename of images) {
      const pathname = prefix + filename
      if (existing.has(pathname)) {
        skipped++
        continue
      }

      const filePath = join(folder, filename)
      const buffer   = readFileSync(filePath)
      const mimeType = MIME[extname(filename).toLowerCase()] ?? 'image/jpeg'

      try {
        const blob = await put(pathname, buffer, {
          access:      'public',
          contentType: mimeType,
          token,
        })
        console.log(`  ✓ ${filename} → ${blob.url}`)
        uploaded++
      } catch (err) {
        console.error(`  ✗ ${filename}: ${err.message}`)
      }
    }
  }

  console.log(`\nDone. Uploaded: ${uploaded}, Skipped (already exist): ${skipped}`)
}

main().catch(err => { console.error(err); process.exit(1) })
