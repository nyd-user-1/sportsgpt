import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ChildcareGPT',
  description: 'AI-powered childcare intelligence',
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
