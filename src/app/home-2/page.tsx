import { redirect } from 'next/navigation'

// The home hub was promoted to `/`. Keep this route as a permanent redirect
// so any old `/home-2` links/bookmarks land on the new front door.
export default function Home2Redirect() {
  redirect('/')
}
