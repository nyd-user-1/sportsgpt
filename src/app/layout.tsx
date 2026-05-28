import type { Metadata, Viewport } from 'next'
import { DM_Sans, Fraunces, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { APP_NAME, APP_DESCRIPTION, SITE_URL } from '@/lib/app-config'
import { CommandPalette } from '@/components/CommandPalette'
import { AuthProvider } from '@/components/AuthProvider'
import { SidelineChat } from '@/components/SidelineChat'

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-sans',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    'Section XI football',
    'Long Island high school football',
    'Suffolk County football',
    'Nassau County football',
    'high school sports stats',
    'New York high school football',
    APP_NAME,
  ],
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: SITE_URL,
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_NAME,
    description: APP_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`h-full bg-[var(--surface)] sm:bg-[var(--bg)] ${dmSans.variable} ${fraunces.variable} ${mono.variable}`}
    >
      <body
        className="h-full bg-[var(--surface)] sm:bg-[var(--bg)]"
        style={{ fontFamily: 'var(--font-sans), sans-serif' }}
      >
        <AuthProvider>
          {children}
          <CommandPalette />
          <SidelineChat />
        </AuthProvider>
      </body>
    </html>
  )
}
