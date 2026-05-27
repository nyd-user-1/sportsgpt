export default function LeaderboardMagazineLayout({
  children,
  compare,
}: {
  children: React.ReactNode
  compare: React.ReactNode
}) {
  return (
    <>
      {children}
      {compare}
    </>
  )
}
