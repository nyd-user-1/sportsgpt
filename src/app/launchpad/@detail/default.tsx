import Image from 'next/image'

export default function DetailDefault() {
  return (
    <div className="h-full relative overflow-hidden rounded-xl">
      <Image
        src="/jack.avif"
        alt="Section XI Football"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      <div className="absolute bottom-4 left-4">
        <p className="text-sm font-semibold text-white">Section XI Football</p>
        <p className="text-xs text-white/70 mt-0.5">Select a team to view details</p>
      </div>
    </div>
  )
}
