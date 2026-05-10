/**
 * Backfills facility_opened_date, license_issue_date, license_expiration_date
 * from the cb42-qumz dataset (same 16,800 facilities, extra date columns).
 *
 * Usage: DATABASE_URL=<url> node scripts/backfill-dates.mjs
 */

import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Set DATABASE_URL before running');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: true });

const API_BASE = 'https://data.ny.gov/resource/cb42-qumz.json';
const PAGE_SIZE = 1000;

function toDate(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

async function fetchPage(offset) {
  const url = `${API_BASE}?$select=facility_id,facility_opened_date,license_issue_date,license_expiration_date&$limit=${PAGE_SIZE}&$offset=${offset}&$order=facility_id`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} at offset ${offset}`);
  return res.json();
}

async function main() {
  const client = await pool.connect();
  try {
    console.log('Starting date backfill...');
    let offset = 0;
    let total = 0;

    while (true) {
      const rows = await fetchPage(offset);
      if (rows.length === 0) break;

      for (const r of rows) {
        await client.query(
          `UPDATE facilities SET
             facility_opened_date    = $1,
             license_issue_date      = $2,
             license_expiration_date = $3
           WHERE facility_id = $4`,
          [
            toDate(r.facility_opened_date),
            toDate(r.license_issue_date),
            toDate(r.license_expiration_date),
            Number.parseInt(r.facility_id, 10),
          ]
        );
      }

      total += rows.length;
      console.log(`  updated ${total} rows`);

      if (rows.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }

    console.log(`Done. Total rows updated: ${total}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
