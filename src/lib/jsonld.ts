import { APP_NAME, SITE_URL } from '@/lib/app-config'

type Json = Record<string, unknown>

// Renders a schema.org JSON-LD blob. Used by server components — drop the
// returned object into a <script type="application/ld+json"> tag.
// We stringify here and the caller sets dangerouslySetInnerHTML so the JSON
// is emitted verbatim (React would otherwise HTML-escape it).
export function jsonLdScriptProps(data: Json | Json[]): { type: 'application/ld+json'; dangerouslySetInnerHTML: { __html: string } } {
  return {
    type: 'application/ld+json',
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  }
}

export function sportsTeamLd(opts: {
  name: string
  slug: string
  division?: string | null
}): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: `${opts.name} Football`,
    sport: 'American Football',
    url: `${SITE_URL}/team/${opts.slug}`,
    ...(opts.division ? { memberOf: { '@type': 'SportsOrganization', name: `Section XI Division ${opts.division}` } } : {}),
    parentOrganization: { '@type': 'SportsOrganization', name: 'Section XI' },
  }
}

export function personAthleteLd(opts: {
  name: string
  slug: string
  position?: string | null
  schoolName?: string | null
}): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: opts.name,
    url: `${SITE_URL}/player/${opts.slug}`,
    ...(opts.position ? { jobTitle: opts.position } : {}),
    ...(opts.schoolName ? { affiliation: { '@type': 'SportsTeam', name: `${opts.schoolName} Football` } } : {}),
  }
}

export function sportsEventLd(opts: {
  id: number
  homeName: string
  awayName: string
  homeScore?: number | null
  awayScore?: number | null
  date?: string | null
}): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${opts.awayName} at ${opts.homeName}`,
    sport: 'American Football',
    url: `${SITE_URL}/game/${opts.id}`,
    ...(opts.date ? { startDate: opts.date } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    homeTeam: { '@type': 'SportsTeam', name: `${opts.homeName} Football` },
    awayTeam: { '@type': 'SportsTeam', name: `${opts.awayName} Football` },
    organizer: { '@type': 'SportsOrganization', name: APP_NAME, url: SITE_URL },
  }
}
