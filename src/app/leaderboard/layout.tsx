export default function LeaderboardLayout({
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
