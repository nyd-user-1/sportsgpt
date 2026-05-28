import { AppLayout } from '@/components/AppLayout'
import { RevealFx } from '@/components/RevealFx'
import { EditorialHead, Tablet, PAPER_BRIDGE } from '@/components/editorial'
import { formatSeason } from '@/lib/utils'
import { loadHomeData } from '@/app/_home/data'
import { MastheadActions }   from '@/app/_home/MastheadActions'
import { HomeNavTabs }       from '@/app/_home/HomeNavTabs'
import { HomeChatLauncher }  from '@/app/_home/HomeChatLauncher'
import { Colophon }          from '@/app/_home/Colophon'

export const dynamic = 'force-dynamic'

export default async function Home2() {
  const data        = await loadHomeData()
  const seasonLabel = formatSeason(data.currentSeason)

  return (
    <AppLayout paperMode>
      <main
        className="flex-1 overflow-y-auto no-scrollbar"
        style={{ backgroundColor: 'var(--paper)', ...PAPER_BRIDGE }}
      >
        <div className="mx-auto max-w-6xl px-6 sm:px-10 md:px-14 pt-12 sm:pt-16 pb-24">
          <RevealFx delay={0} translateY={4} className="pt-8 -mt-8">
            <EditorialHead
              size="xl"
              eyebrow={`Section XI · Long Island · ${seasonLabel} Edition`}
              rightSlot={<MastheadActions />}
            >
              SportsGPT
            </EditorialHead>
          </RevealFx>

          <HomeNavTabs />

          <RevealFx delay={0.1} translateY={8}>
            <Tablet>
              <div className="px-5 sm:px-8 py-8">
                <HomeChatLauncher prompts={data.chatPrompts} />
              </div>
            </Tablet>
          </RevealFx>
        </div>

        <Colophon updatedAt={data.updatedAt} />
      </main>
    </AppLayout>
  )
}
