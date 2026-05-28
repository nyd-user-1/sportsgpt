import type { Metadata } from 'next'
import { APP_NAME, SITE_URL } from '@/lib/app-config'

// Strip the " Varsity Football" suffix teams carry in the DB so titles read
// like "Floyd Football" rather than "Floyd Varsity Football".
export function cleanTeamName(name: string): string {
  return name.replace(/\s+Varsity\s+Football$/i, '').trim()
}

// Build a Metadata object with canonical + Open Graph/Twitter wired to a
// page-specific title, description, and path. metadataBase (set in the root
// layout) makes the relative canonical/og:url absolute.
export function pageMetadata(opts: {
  title: string
  description: string
  path: string
}): Metadata {
  const { title, description, path } = opts
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} · ${APP_NAME}`,
      description,
      url: `${SITE_URL}${path}`,
      siteName: APP_NAME,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · ${APP_NAME}`,
      description,
    },
  }
}
