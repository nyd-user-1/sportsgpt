import { AppLayout } from '@/components/AppLayout'

const TERMS = [
  {
    id: 'county',
    name: 'County',
    definition: 'One of 62 counties in New York State. Each county contains a set of OCFS-licensed childcare providers. County-level data is aggregated from the New York State Office of Children and Family Services (OCFS) provider registry.',
    source: 'NY State OCFS Provider Registry',
    caveats: 'County boundaries follow New York State definitions. New York City boroughs (Bronx, Kings, New York, Queens, Richmond) are each treated as separate counties.',
  },
  {
    id: 'state',
    name: 'State',
    definition: 'State abbreviation for the provider\'s license jurisdiction. All entries in the ChildcareGPT county table are licensed under New York State (NY) OCFS regulations.',
    source: 'NY State OCFS Provider Registry',
    caveats: 'Only NY-licensed providers are included in this dataset.',
  },
  {
    id: 'grade',
    name: 'Grade',
    definition: 'A composite compliance grade assigned to each county based on its license compliance rate. A+ indicates ≥95% of providers meeting all OCFS regulatory requirements; A is ≥90%; B is ≥85%; C is ≥80%; D is below 80%.',
    source: 'Derived from OCFS compliance data',
    caveats: 'Grades reflect point-in-time compliance snapshots. Providers may be in various stages of renewal, correction, or inspection.',
  },
  {
    id: 'providers',
    name: 'Providers',
    definition: 'The number of OCFS-regulated childcare providers licensed to operate in the county. Includes Day Care Centers (DCC), Family Day Care Homes (FDC), Group Family Day Care Homes (GFDC), School Age Child Care programs (SACC), and Small Day Care Centers (SDCC).',
    source: 'NY State OCFS Provider Registry (data.ny.gov)',
    caveats: 'Counts include all active licensed providers at the time of data pull. Providers that have closed, surrendered, or had licenses revoked are excluded.',
  },
  {
    id: 'seats',
    name: 'Seats',
    definition: 'Total licensed childcare capacity in the county — the sum of all provider seat capacities as authorized on each provider\'s OCFS license. Represents the maximum number of children that can be legally cared for simultaneously.',
    source: 'NY State OCFS Provider Registry (total_capacity field)',
    caveats: 'Licensed capacity does not equal actual enrollment. Providers may operate below their licensed maximum due to staffing, space, or demand constraints.',
  },
  {
    id: 'filled',
    name: 'Filled',
    definition: 'Estimated number of licensed seats currently occupied across all providers in the county. Based on regional occupancy modeling using statewide enrollment averages.',
    source: 'Derived estimate — not a direct OCFS field',
    caveats: 'This is a modeled estimate, not a directly reported value. Actual occupancy data is not publicly available at the county level.',
  },
  {
    id: 'open',
    name: 'Open',
    definition: 'Available licensed seats in the county — the difference between total licensed seats and estimated filled seats. Higher open seat counts indicate greater childcare access and lower demand pressure.',
    source: 'Derived: Total Seats minus Filled Seats',
    caveats: 'Dependent on the accuracy of the Filled estimate. True availability may differ based on provider waitlists, age group restrictions, and subsidy acceptance policies.',
  },
  {
    id: 'avg-cost',
    name: 'Avg Cost',
    definition: 'Average weekly full-time childcare cost across all provider types and age groups in the county. Reflects the median market rate for center-based and family care combined.',
    source: 'DOL National Database of Childcare Prices (county_costs table)',
    caveats: 'Costs represent 2022 median values from the Department of Labor. Actual costs vary significantly by provider type, age group, and subsidy eligibility.',
  },
  {
    id: 'waitlist',
    name: 'Waitlist',
    definition: 'Average number of months a family waits for an available licensed childcare seat in the county. Longer waitlists indicate high demand relative to available capacity.',
    source: 'Derived estimate based on regional demand models',
    caveats: 'Not a directly reported metric. Waitlist duration varies significantly by provider type, age group, and neighborhood.',
  },
  {
    id: 'compliance',
    name: 'Compliance',
    definition: 'Percentage of licensed providers in the county currently meeting all OCFS regulatory requirements, including health, safety, staffing ratios, and training standards.',
    source: 'NY State OCFS Provider Registry',
    caveats: 'Compliance status is point-in-time. Providers may be in correction periods or pending re-inspection.',
  },
  {
    id: 'annual-mkt',
    name: 'Annual Mkt',
    definition: 'Estimated annual childcare market value for the county. Calculated as total licensed seats × average weekly cost × 52 weeks. Represents the gross economic value of the county\'s childcare supply at full occupancy.',
    source: 'Derived: Seats × Avg Weekly Cost × 52',
    caveats: 'This is a theoretical maximum based on full occupancy. Actual market revenue will be lower based on real occupancy rates, subsidy rates, and provider pricing.',
  },
  {
    id: 'turnover',
    name: 'Turnover',
    definition: 'Estimated annual provider workforce turnover rate. Reflects the percentage of childcare workers who leave their positions each year. Higher turnover is associated with lower wages, difficult working conditions, and inconsistent care quality.',
    source: 'Derived estimate based on state workforce models',
    caveats: 'Not a directly reported metric. Based on modeled estimates using waitlist duration as a proxy for market stress.',
  },
  {
    id: 'ratio',
    name: 'Ratio',
    definition: 'Estimated child-to-provider ratio in the county. Expressed as 1:N where N is the number of children per provider. OCFS sets maximum ratios by age group and program type. Lower ratios indicate more individualized care.',
    source: 'Derived estimate',
    caveats: 'This is an aggregate county-level estimate. OCFS-mandated ratios vary by age group: infants (1:4), toddlers (1:5), preschool (1:7–10).',
  },
  {
    id: 'infant-seats',
    name: 'Infant Seats',
    definition: 'Estimated licensed capacity for infants (typically birth to 18 months) across all providers in the county. Infant care is the most regulated, most expensive, and most undersupplied age group in New York.',
    source: 'Derived: ~25% of total county capacity based on OCFS age group distributions',
    caveats: 'Actual infant capacity data is available at the provider level in the facilities table (infant_capacity field). County-level totals are summed from provider records.',
  },
  {
    id: 'toddler-seats',
    name: 'Toddler Seats',
    definition: 'Estimated licensed capacity for toddlers (typically 18 months to 3 years) across all providers in the county. Toddler care represents the second most constrained age group after infant care.',
    source: 'Derived: ~35% of total county capacity based on OCFS age group distributions',
    caveats: 'Actual toddler capacity data is available at the provider level in the facilities table (toddler_capacity field). County-level totals are summed from provider records.',
  },
]

export default function GlossaryPage() {
  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="mx-auto max-w-4xl px-6 py-10">

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-[var(--txt)] mb-2">Data Glossary</h1>
            <p className="text-sm text-[var(--muted)] leading-relaxed max-w-2xl">
              Definitions for every metric shown in the ChildcareGPT data tables. All provider data sourced from the NY State Office of Children and Family Services (OCFS) and the U.S. Department of Labor National Database of Childcare Prices.
            </p>
          </div>

          <div className="flex gap-10">

            {/* Left nav */}
            <div className="hidden md:block shrink-0 w-44">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)] mb-3">Terms</p>
              <div className="flex flex-col gap-1">
                {TERMS.map(t => (
                  <a key={t.id} href={`#${t.id}`}
                    className="text-sm text-[var(--muted)] hover:text-[var(--txt)] transition-colors py-0.5">
                    {t.name}
                  </a>
                ))}
              </div>
            </div>

            {/* Definitions */}
            <div className="flex-1 min-w-0 flex flex-col gap-10">
              {TERMS.map(t => (
                <div key={t.id} id={t.id} className="scroll-mt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold text-[var(--txt)]">{t.name}</h2>
                    <a href={`#${t.id}`} className="text-[var(--muted)] hover:text-[var(--txt)] transition-colors">#</a>
                  </div>
                  <p className="text-sm text-[var(--muted)] leading-relaxed mb-3">{t.definition}</p>
                  <div className="rounded-xl border border-[var(--border)] overflow-hidden text-sm">
                    <div className="grid grid-cols-[80px_1fr] gap-x-3 px-4 py-2.5 border-b border-[var(--border)]">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Source</span>
                      <span className="text-[var(--txt)]">{t.source}</span>
                    </div>
                    <div className="grid grid-cols-[80px_1fr] gap-x-3 px-4 py-2.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">Caveats</span>
                      <span className="text-[var(--muted)]">{t.caveats}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </AppLayout>
  )
}
