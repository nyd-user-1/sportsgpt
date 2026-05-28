import { AppLayout } from '@/components/AppLayout'
import { RevealFx } from '@/components/RevealFx'
import {
  EditorialHead,
  SectionHead,
  SubSectionHead,
  HeroStrip,
  PlayerRankedList,
  ScrollTable,
  Tablet,
  PAPER_BRIDGE,
} from '@/components/editorial'
import { formatSeason } from '@/lib/utils'
import { loadHomeData } from './_home/data'
import { VolumeRule } from './_home/VolumeRule'
import { MastheadActions } from './_home/MastheadActions'
import { LeadPlate } from './_home/LeadPlate'
import { DivisionPlate } from './_home/DivisionPlate'
import { HomeChartCard } from './_home/HomeChartCard'
import { ScoreboardRow } from './_home/ScoreboardRow'
import { HomeChatLauncher } from './_home/HomeChatLauncher'
import { Colophon } from './_home/Colophon'

export const dynamic = 'force-dynamic'

const SANS = { fontFamily: 'var(--font-sans), system-ui, sans-serif' } as const

const paperLink =
  'text-[10px] uppercase tracking-[0.22em] text-[var(--paper-strong)] hover:underline underline-offset-4'

export default async function Home() {
  const data        = await loadHomeData()
  const seasonLabel = formatSeason(data.currentSeason)

  return (
    <AppLayout paperMode>
      <main
        className="flex-1 overflow-y-auto no-scrollbar"
        style={{ backgroundColor: 'var(--paper)', ...PAPER_BRIDGE }}
      >
        {/* ── Masthead ───────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-2">
          <RevealFx delay={0} translateY={4} className="pt-8 -mt-8">
            <EditorialHead
              size="xl"
              eyebrow={`Section XI · Long Island · ${seasonLabel} Edition`}
              subhead="The complete record of Suffolk County high school football."
              meta={[
                `${data.counts.teams.toLocaleString()} teams`,
                '4 divisions',
                `${data.counts.games.toLocaleString()} games on record`,
                `${data.counts.players.toLocaleString()} players tracked`,
                `${data.counts.seasons} seasons`,
              ]}
              rightSlot={<MastheadActions />}
            >
              SportsGPT
            </EditorialHead>
            <VolumeRule label="Volume V · No. 1" />
          </RevealFx>
        </section>

        {/* ── I. Lead Plate ─────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-14 pb-20">
          <RevealFx delay={0.1} translateY={8}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <HeroStrip
                  slides={data.lead.heroPhotos}
                  height={540}
                  padding={8}
                  intervalMs={0}
                />
              </div>
              <div className="lg:col-span-4" style={{ minHeight: 540 }}>
                <LeadPlate
                  roman="I."
                  kicker={data.lead.kicker}
                  dropCap={data.lead.dropCap}
                  deck={data.lead.deck}
                  href={data.lead.href}
                  hrefLabel={data.lead.hrefLabel}
                  rows={data.lead.miniStats}
                />
              </div>
            </div>
          </RevealFx>
        </section>

        {/* ── II. The Standing ──────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pb-20">
          <RevealFx delay={0.15} translateY={8}>
            <SectionHead
              eyebrow="II."
              title="The Standing"
              blurb={`Top three teams in each division, ${seasonLabel}.`}
              meta={
                <a href="/section/section-xi" className={paperLink} style={SANS}>
                  Section XI overview →
                </a>
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.divisions.map(d => (
                <DivisionPlate
                  key={d.division}
                  division={d.division}
                  top={d.top}
                  seasonLabel={seasonLabel}
                />
              ))}
            </div>
          </RevealFx>
        </section>

        {/* ── III. By the Numbers ───────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pb-20">
          <RevealFx delay={0.2} translateY={8}>
            <SectionHead
              eyebrow="III."
              title="By the Numbers"
              blurb={`Statistical leaders for the ${seasonLabel} season, by category.`}
              meta={
                <a href="/leaderboard" className={paperLink} style={SANS}>
                  View all leaders →
                </a>
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
              {([
                { key: 'passing',    label: 'Passing',   rows: data.leaders.passing,   href: '/leaderboard?tab=Passing'   },
                { key: 'rushing',    label: 'Rushing',   rows: data.leaders.rushing,   href: '/leaderboard?tab=Rushing'   },
                { key: 'receiving',  label: 'Receiving', rows: data.leaders.receiving, href: '/leaderboard?tab=Receiving' },
              ] as const).map(col => (
                <div key={col.key}>
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <SubSectionHead>{col.label}</SubSectionHead>
                    <span
                      className="text-[10px] uppercase tracking-[0.22em] text-[var(--paper-faint)] tabular-nums"
                      style={SANS}
                    >
                      {seasonLabel}
                    </span>
                  </div>
                  <PlayerRankedList
                    rows={col.rows.map((r, i) => ({
                      slug:       r.slug,
                      name:       r.name,
                      school:     r.school,
                      schoolSlug: r.school_slug ?? undefined,
                      rank:       i + 1,
                      primary:    r.primary,
                      secondary:  r.secondary,
                    }))}
                    emptyLabel={`No ${col.label.toLowerCase()} leaders yet.`}
                  />
                  <div className="mt-3 pt-3 border-t border-[var(--paper-rule)]">
                    <a href={col.href} className={paperLink} style={SANS}>
                      Full {col.label.toLowerCase()} board →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </RevealFx>
        </section>

        {/* ── IV. From the Almanac ──────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pb-20">
          <RevealFx delay={0.25} translateY={8}>
            <SectionHead
              eyebrow="IV."
              title="From the Almanac"
              blurb={`Six selected charts from the ${data.counts.charts} in this year's record. Team, player, and game.`}
              meta={
                <a href="/charts" className={paperLink} style={SANS}>
                  See all {data.counts.charts} charts →
                </a>
              }
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-5">
              {data.charts.map(c => (
                <HomeChartCard key={c.slug} chart={c} />
              ))}
            </div>
          </RevealFx>
        </section>

        {/* ── V. The Scoreboard ─────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pb-20">
          <RevealFx delay={0.3} translateY={8}>
            <SectionHead
              eyebrow="V."
              title="The Scoreboard"
              blurb="Most recent results from across the section."
              meta={
                <a href="/section/section-xi#games" className={paperLink} style={SANS}>
                  Full schedule →
                </a>
              }
            />
            <ScrollTable maxH={0}>
              <div className="flex flex-col">
                {data.recentGames.map((g, i) => (
                  <ScoreboardRow
                    key={g.id}
                    game={g}
                    isLast={i === data.recentGames.length - 1}
                  />
                ))}
                {data.recentGames.length === 0 && (
                  <div className="px-5 py-12 text-center text-[14px] text-[var(--paper-muted)] italic">
                    No recent games on record.
                  </div>
                )}
              </div>
            </ScrollTable>
          </RevealFx>
        </section>

        {/* ── VI. Ask SportsGPT ─────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pb-24">
          <RevealFx delay={0.35} translateY={8}>
            <SectionHead
              eyebrow="VI."
              title="Ask SportsGPT"
              blurb="An editor at your service. Ask about any team, any season, any player."
              meta={
                <a href="/chat" className={paperLink} style={SANS}>
                  Open the chat →
                </a>
              }
            />
            <Tablet>
              <div className="px-5 sm:px-8 py-8">
                <HomeChatLauncher prompts={data.chatPrompts} />
              </div>
            </Tablet>
          </RevealFx>
        </section>

        <Colophon updatedAt={data.updatedAt} />
      </main>
    </AppLayout>
  )
}
