import type { Metadata } from 'next'
import './globals.css'
import { APP_NAME, APP_TAGLINE } from '@/lib/app-config'

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_TAGLINE,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&display=swap" rel="stylesheet" />
      </head>
      <body className="h-full" style={{ fontFamily: "'DM Sans', sans-serif", background: 'var(--bg)' }}>
        {children}
      </body>
    </html>
  )
}
