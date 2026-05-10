/**
 * Ingests NY State regulated childcare facilities from data.ny.gov (SODA2)
 * into the Neon `facilities` table.
 *
 * Merges two datasets:
 *   fymg-3wv3 — core facility data (address, capacity, status, etc.)
 *   cb42-qumz — date columns (facility_opened_date, license_issue_date, license_expiration_date)
 *
 * Usage: DATABASE_URL=<url> node scripts/ingest-facilities.mjs
 */

import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Set DATABASE_URL before running');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL, ssl: true });

const MAIN_API  = 'https://data.ny.gov/resource/fymg-3wv3.json';
const DATES_API = 'https://data.ny.gov/resource/cb42-qumz.json';
const PAGE_SIZE  = 1000;
const BATCH_SIZE = 100;

const toInt   = (v) => { const n = Number.parseInt(v, 10); return isNaN(n) ? null : n; };
const toFloat = (v) => { const n = Number.parseFloat(v);   return isNaN(n) ? null : n; };
const toBool  = (v) => v === 'Y' ? true : v === 'N' ? false : null;
const toDate  = (v) => { if (!v) return null; const d = new Date(v); return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10); };

const COLS = [
  'facility_id','program_type','region_code','county','facility_status',
  'facility_name','address_omitted','street_number','street_name',
  'additional_address','floor','apartment','city','state','zip_code',
  'phone_number_omitted','phone_number','phone_extension','provider_name',
  'school_district_name','capacity_description',
  'infant_capacity','toddler_capacity','preschool_capacity',
  'school_age_capacity','total_capacity',
  'profile_url','latitude','longitude',
  'facility_opened_date','license_issue_date','license_expiration_date',
  'ingested_at',
];

const UPDATE_COLS = COLS.filter(c => c !== 'facility_id' && c !== 'ingested_at');

function rowToParams(r, dates) {
  return [
    toInt(r.facility_id),
    r.program_type ?? null,
    r.region_code ?? null,
    r.county ?? null,
    r.facility_status ?? null,
    r.facility_name ?? null,
    toBool(r.address_omitted),
    r.street_number ?? null,
    r.street_name ?? null,
    r.additional_address ?? null,
    r.floor ?? null,
    r.apartment ?? null,
    r.city ?? null,
    r.state ?? null,
    r.zip_code != null ? String(r.zip_code) : null,
    toBool(r.phone_number_omitted),
    r.phone_number ?? null,
    r.phone_extension ?? null,
    r.provider_name ?? null,
    r.school_district_name ?? null,
    r.capacity_description ?? null,
    toInt(r.infant_capacity),
    toInt(r.toddler_capacity),
    toInt(r.preschool_capacity),
    toInt(r.school_age_capacity),
    toInt(r.total_capacity),
    r.additional_information?.url ?? null,
    toFloat(r.latitude),
    toFloat(r.longitude),
    dates?.facility_opened_date    ?? null,
    dates?.license_issue_date      ?? null,
    dates?.license_expiration_date ?? null,
    new Date(),
  ];
}

async function fetchAllPages(baseUrl, selectCols) {
  const select = selectCols ? `&$select=${selectCols}` : '';
  const results = [];
  let offset = 0;
  while (true) {
    const url = `${baseUrl}?$limit=${PAGE_SIZE}&$offset=${offset}&$order=facility_id${select}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
    const page = await res.json();
    results.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return results;
}

async function upsertBatch(client, rows, dateMap) {
  const colList  = COLS.join(', ');
  const updateSet = UPDATE_COLS.map(c => `${c} = EXCLUDED.${c}`).join(', ');

  const values = [];
  const placeholders = rows.map((row, i) => {
    const id = toInt(row.facility_id);
    const params = rowToParams(row, dateMap.get(id));
    values.push(...params);
    const base = i * COLS.length;
    return `(${COLS.map((_, j) => `$${base + j + 1}`).join(', ')})`;
  });

  await client.query(
    `INSERT INTO facilities (${colList}) VALUES ${placeholders.join(', ')}
     ON CONFLICT (facility_id) DO UPDATE SET ${updateSet}`,
    values
  );
}

async function main() {
  const client = await pool.connect();
  try {
    console.log('Fetching date data from cb42-qumz...');
    const dateRows = await fetchAllPages(
      DATES_API,
      'facility_id,facility_opened_date,license_issue_date,license_expiration_date'
    );
    const dateMap = new Map(dateRows.map(r => [
      toInt(r.facility_id),
      {
        facility_opened_date:    toDate(r.facility_opened_date),
        license_issue_date:      toDate(r.license_issue_date),
        license_expiration_date: toDate(r.license_expiration_date),
      },
    ]));
    console.log(`  loaded dates for ${dateMap.size} facilities`);

    console.log('Ingesting facility data from fymg-3wv3...');
    let offset = 0;
    let total  = 0;

    while (true) {
      const url = `${MAIN_API}?$limit=${PAGE_SIZE}&$offset=${offset}&$order=facility_id`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} at offset ${offset}`);
      const rows = await res.json();
      if (rows.length === 0) break;

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        await upsertBatch(client, rows.slice(i, i + BATCH_SIZE), dateMap);
      }

      total += rows.length;
      console.log(`  ingested ${total} rows`);

      if (rows.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }

    console.log(`Done. Total rows ingested: ${total}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
