// Generate favicon.ico + apple-icon.png from the brand Trophy SVG.
// Run: node scripts/gen-icons.mjs
import sharp from 'sharp'
import { writeFileSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const APP = join(ROOT, 'src', 'app')

const ACCENT = '#033882'
const CUP = '#dbeafe'

// The brand Trophy (lucide), padded inside a rounded white tile so the
// dark-blue stroke stays visible on any tab/home-screen background.
function tile(size) {
  const pad = Math.round(size * 0.18)
  const inner = size - pad * 2
  const r = Math.round(size * 0.22)
  // lucide Trophy paths on a 24x24 viewBox, scaled into the inner region.
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" fill="#ffffff"/>
  <g transform="translate(${pad},${pad}) scale(${inner / 24})"
     fill="none" stroke="${ACCENT}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" fill="${CUP}"/>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
  </g>
</svg>`)
}

async function png(size) {
  return sharp(tile(size)).resize(size, size).png().toBuffer()
}

// Minimal ICO container wrapping PNG entries (PNG-in-ICO is valid for all
// modern browsers). Layout: 6-byte header + 16-byte dir entry per image +
// concatenated PNG payloads.
function buildIco(images) {
  const count = images.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)      // reserved
  header.writeUInt16LE(1, 2)      // type: icon
  header.writeUInt16LE(count, 4)  // image count

  const dir = Buffer.alloc(16 * count)
  let offset = 6 + 16 * count
  const payloads = []
  images.forEach((img, i) => {
    const b = i * 16
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, b + 0) // width (0 = 256)
    dir.writeUInt8(img.size >= 256 ? 0 : img.size, b + 1) // height
    dir.writeUInt8(0, b + 2)   // palette
    dir.writeUInt8(0, b + 3)   // reserved
    dir.writeUInt16LE(1, b + 4)  // color planes
    dir.writeUInt16LE(32, b + 6) // bits per pixel
    dir.writeUInt32LE(img.data.length, b + 8)  // size
    dir.writeUInt32LE(offset, b + 12)          // offset
    offset += img.data.length
    payloads.push(img.data)
  })

  return Buffer.concat([header, dir, ...payloads])
}

const sizes = [16, 32, 48]
const icoImages = await Promise.all(sizes.map(async size => ({ size, data: await png(size) })))
writeFileSync(join(APP, 'favicon.ico'), buildIco(icoImages))
console.log('wrote src/app/favicon.ico', sizes.join('/'))

const apple = await png(180)
writeFileSync(join(APP, 'apple-icon.png'), apple)
console.log('wrote src/app/apple-icon.png 180x180')

// sanity: read back the ico header
const back = readFileSync(join(APP, 'favicon.ico'))
console.log('ico bytes:', back.length, '| entries:', back.readUInt16LE(4))
