// ── REPLACE FOR NEW DOMAIN ────────────────────────────────────────────────
// Rename fields to match your domain's data model.
// Used by Facility, ZIP Code, and City detail pages for slugs 1–10.
// These are placeholder records shown before real DB data exists.

export type DummyLocation = {
  slug: string
  county: string
  providers: number
  seats: number
  filled: number
  open: number
  diff: number
  avgCost: number
  waitlistMonths: number
  compliance: number
  zips: { zip: string; city: string; providers: number; seats: number }[]
}

export const DUMMY_LOCATIONS: DummyLocation[] = [
  { slug: '1',  county: '1',  providers: 12,  seats: 380,  filled: 340,  open: 40,  diff:  2,  avgCost: 220, waitlistMonths: 1.5, compliance: 90, zips: [{ zip: '10011', city: 'Sample City A', providers: 4, seats: 120 }, { zip: '10012', city: 'Sample City B', providers: 5, seats: 150 }, { zip: '10013', city: 'Sample City C', providers: 3, seats: 110 }] },
  { slug: '2',  county: '2',  providers: 25,  seats: 720,  filled: 640,  open: 80,  diff: -3,  avgCost: 265, waitlistMonths: 2.8, compliance: 93, zips: [{ zip: '10021', city: 'Sample City D', providers: 8, seats: 240 }, { zip: '10022', city: 'Sample City E', providers: 9, seats: 280 }, { zip: '10023', city: 'Sample City F', providers: 8, seats: 200 }] },
  { slug: '3',  county: '3',  providers: 48,  seats: 1400, filled: 1260, open: 140, diff:  5,  avgCost: 285, waitlistMonths: 3.4, compliance: 92, zips: [{ zip: '10031', city: 'Sample City G', providers: 15, seats: 460 }, { zip: '10032', city: 'Sample City H', providers: 18, seats: 510 }, { zip: '10033', city: 'Sample City I', providers: 15, seats: 430 }] },
  { slug: '4',  county: '4',  providers: 73,  seats: 2100, filled: 1890, open: 210, diff: -1,  avgCost: 310, waitlistMonths: 4.2, compliance: 94, zips: [{ zip: '10041', city: 'Sample City J', providers: 22, seats: 690 }, { zip: '10042', city: 'Sample City K', providers: 25, seats: 720 }, { zip: '10043', city: 'Sample City L', providers: 26, seats: 690 }] },
  { slug: '5',  county: '5',  providers: 142, seats: 4300, filled: 3860, open: 440, diff:  8,  avgCost: 285, waitlistMonths: 4.2, compliance: 94, zips: [{ zip: '10051', city: 'Sample City M', providers: 45, seats: 1400 }, { zip: '10052', city: 'Sample City N', providers: 50, seats: 1500 }, { zip: '10053', city: 'Sample City O', providers: 47, seats: 1400 }] },
  { slug: '6',  county: '6',  providers: 89,  seats: 2700, filled: 2430, open: 270, diff:  4,  avgCost: 250, waitlistMonths: 3.1, compliance: 93, zips: [{ zip: '10061', city: 'Sample City P', providers: 28, seats: 880 }, { zip: '10062', city: 'Sample City Q', providers: 30, seats: 920 }, { zip: '10063', city: 'Sample City R', providers: 31, seats: 900 }] },
  { slug: '7',  county: '7',  providers: 34,  seats: 990,  filled: 880,  open: 110, diff: -2,  avgCost: 195, waitlistMonths: 1.8, compliance: 89, zips: [{ zip: '10071', city: 'Sample City S', providers: 10, seats: 320 }, { zip: '10072', city: 'Sample City T', providers: 12, seats: 360 }, { zip: '10073', city: 'Sample City U', providers: 12, seats: 310 }] },
  { slug: '8',  county: '8',  providers: 67,  seats: 1900, filled: 1700, open: 200, diff:  6,  avgCost: 240, waitlistMonths: 2.5, compliance: 91, zips: [{ zip: '10081', city: 'Sample City V', providers: 20, seats: 620 }, { zip: '10082', city: 'Sample City W', providers: 23, seats: 660 }, { zip: '10083', city: 'Sample City X', providers: 24, seats: 620 }] },
  { slug: '9',  county: '9',  providers: 156, seats: 4800, filled: 4320, open: 480, diff: 11,  avgCost: 340, waitlistMonths: 5.1, compliance: 94, zips: [{ zip: '10091', city: 'Sample City Y', providers: 50, seats: 1580 }, { zip: '10092', city: 'Sample City Z', providers: 55, seats: 1640 }, { zip: '10093', city: 'Sample City AA', providers: 51, seats: 1580 }] },
  { slug: '10', county: '10', providers: 23,  seats: 660,  filled: 590,  open: 70,  diff: -4,  avgCost: 185, waitlistMonths: 2.1, compliance: 91, zips: [{ zip: '10101', city: 'Sample City BB', providers: 7, seats: 210 }, { zip: '10102', city: 'Sample City CC', providers: 8, seats: 230 }, { zip: '10103', city: 'Sample City DD', providers: 8, seats: 220 }] },
]

export function getDummyBySlug(slug: string): DummyLocation | undefined {
  return DUMMY_LOCATIONS.find(d => d.slug === slug)
}
