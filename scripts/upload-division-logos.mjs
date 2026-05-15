import { put } from '@vercel/blob'
import { readFileSync, readdirSync } from 'fs'
import { join, extname } from 'path'

const SRC = '/Users/brendanstanton/code/sports assets/1 Review Assets/Division Logos'
const PREFIX = 'gallery/divisions/'
const MIME = { '.png': 'image/png', '.svg': 'image/svg+xml' }

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) { console.error('Missing BLOB_READ_WRITE_TOKEN'); process.exit(1) }

  const files = readdirSync(SRC).filter(f => ['.png', '.svg'].includes(extname(f).toLowerCase()))
  console.log(`Uploading ${files.length} division logos...`)

  for (const filename of files) {
    const pathname = PREFIX + filename
    const buffer   = readFileSync(join(SRC, filename))
    const mimeType = MIME[extname(filename).toLowerCase()]
    const blob = await put(pathname, buffer, { access: 'public', contentType: mimeType, token })
    console.log(`  ✓ ${filename} → ${blob.url}`)
  }
  console.log('Done.')
}

main().catch(err => { console.error(err); process.exit(1) })
