/**
 * Ingest action photos → gallery/players/ on Blob
 * - Skips duplicates already in Blob (by name)
 * - Skips tiny files < 20KB (thumbnails)
 * - Converts JPG/PNG/TIFF → AVIF at quality 75 via sharp
 * - Uploads existing .avif files as-is
 */

import { list, put } from '@vercel/blob'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN
const SRC   = '/Users/brendanstanton/Code/sports assets/Action Photos'
const MIN_KB = 20

// Files to explicitly skip
const SKIP = new Set(['.ds_store', 'kings park.jpg', 'west-islip.avif'])

async function run() {
  // 1. Get existing Blob filenames (players + teams)
  const existing = new Set()
  for (const prefix of ['gallery/players/', 'gallery/teams/']) {
    let cursor
    do {
      const r = await list({ prefix, cursor, limit: 1000, token: TOKEN })
      r.blobs.forEach(b => existing.add(b.pathname.split('/').pop().toLowerCase()))
      cursor = r.cursor
    } while (cursor)
  }
  console.log(`Existing Blob files: ${existing.size}`)

  // 2. Process action photos
  const files = fs.readdirSync(SRC).filter(f => !f.startsWith('.'))
  let uploaded = 0, skipped = 0

  for (const file of files) {
    const lower = file.toLowerCase()
    const filePath = path.join(SRC, file)
    const stat = fs.statSync(filePath)
    const kb = stat.size / 1024

    // Skip tiny files, explicit skip list, or already in Blob
    if (kb < MIN_KB) { console.log(`  SKIP (${kb.toFixed(0)}KB too small): ${file}`); skipped++; continue }
    if (SKIP.has(lower))  { console.log(`  SKIP (duplicate): ${file}`); skipped++; continue }

    const ext = path.extname(file).toLowerCase()
    let buffer, blobName

    if (ext === '.avif') {
      // Already compressed — upload as-is
      buffer  = fs.readFileSync(filePath)
      blobName = file
    } else {
      // Convert to AVIF
      buffer  = await sharp(filePath).avif({ quality: 75 }).toBuffer()
      blobName = path.basename(file, ext) + '.avif'
    }

    // Skip if converted name already in Blob
    if (existing.has(blobName.toLowerCase())) {
      console.log(`  SKIP (blob exists): ${blobName}`); skipped++; continue
    }

    const r = await put(`gallery/players/${blobName}`, buffer, {
      access: 'public', token: TOKEN, addRandomSuffix: false,
    })
    const savedKb = buffer.length / 1024
    console.log(`  ✓ ${file} → ${blobName} (${kb.toFixed(0)}KB → ${savedKb.toFixed(0)}KB)`)
    uploaded++
  }

  console.log(`\nDone. Uploaded: ${uploaded}, Skipped: ${skipped}`)
}

run().catch(console.error)
