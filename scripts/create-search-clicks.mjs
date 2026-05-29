// Create the search_clicks table — an aggregated, hard-capped (50-row) LFU
// leaderboard of query-stem → clicked-result. Run:
//   node --env-file=.env.local scripts/create-search-clicks.mjs
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

await sql`
  CREATE TABLE IF NOT EXISTS search_clicks (
    query_stem   text    NOT NULL,
    result_key   text    NOT NULL,
    result_type  text    NOT NULL,
    result_label text    NOT NULL,
    count        integer NOT NULL DEFAULT 1,
    updated_at   timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (query_stem, result_key)
  )
`
// Eviction picks the lowest count, oldest first — index supports it.
await sql`CREATE INDEX IF NOT EXISTS search_clicks_evict_idx ON search_clicks (count ASC, updated_at ASC)`

const rows = await sql`SELECT count(*)::int AS n FROM search_clicks`
console.log('search_clicks ready — rows:', rows[0].n)
