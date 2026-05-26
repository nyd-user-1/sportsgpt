import { AppLayout } from '@/components/AppLayout'

export default function TeamMagazineLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppLayout paperMode>
      {children}
    </AppLayout>
  )
}
