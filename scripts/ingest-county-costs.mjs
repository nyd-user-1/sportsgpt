/**
 * Ingests NY county childcare cost data from the DOL National Database
 * of Childcare Prices (NDCP) CSV into the Neon `county_costs` table.
 *
 * Filters to New York rows only.
 *
 * Usage: DATABASE_URL=<url> node scripts/ingest-county-costs.mjs
 */

import fs from 'fs';
import readline from 'readline';
import pg from 'pg';
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Set DATABASE_URL before running');
  process.exit(1);
}

const CSV_PATH = new URL('../dol-child-care-data.csv', import.meta.url).pathname;
const pool = new Pool({ connectionString: DATABASE_URL, ssl: true });

const toNum = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
};

const COLS = [
  'county_fips_code', 'county_name', 'studyyear',
  'mcinfant', 'mcinfant_flag', 'mctoddler', 'mctoddler_flag', 'mcpreschool', 'mcpreschool_flag',
  '_75cinfant', '_75cinfant_flag', '_75ctoddler', '_75ctoddler_flag', '_75cpreschool', '_75cpreschool_flag',
  'mfccinfant', 'mfccinfant_flag', 'mfcctoddler', 'mfcctoddler_flag', 'mfccpreschool', 'mfccpreschool_flag',
  '_75fccinfant', '_75fccinfant_flag', '_75fcctoddler', '_75fcctoddler_flag', '_75fccpreschool', '_75fccpreschool_flag',
  'flfpr_20to64', 'flfpr_20to64_under6', 'flfpr_20to64_6to17',
  'mhi', 'mhi_2022', 'mfi', 'mfi_2022',
  'pr_f', 'pr_p',
  'h_under6_bothwork', 'h_under6_singlem', 'h_6to17_bothwork', 'h_6to17_singlem',
  'ingested_at',
];

const UPDATE_COLS = COLS.filter(c => c !== 'county_fips_code' && c !== 'studyyear' && c !== 'ingested_at');

function rowToParams(r, headerIdx) {
  const g = (name) => r[headerIdx[name]] ?? '';
  return [
    g('county_fips_code'),
    g('county_name'),
    toNum(g('studyyear')),
    toNum(g('mcinfant')),        toNum(g('mcinfant_flag')),
    toNum(g('mctoddler')),       toNum(g('mctoddler_flag')),
    toNum(g('mcpreschool')),     toNum(g('mcpreschool_flag')),
    toNum(g('_75cinfant')),      toNum(g('_75cinfant_flag')),
    toNum(g('_75ctoddler')),     toNum(g('_75ctoddler_flag')),
    toNum(g('_75cpreschool')),   toNum(g('_75cpreschool_flag')),
    toNum(g('mfccinfant')),      toNum(g('mfccinfant_flag')),
    toNum(g('mfcctoddler')),     toNum(g('mfcctoddler_flag')),
    toNum(g('mfccpreschool')),   toNum(g('mfccpreschool_flag')),
    toNum(g('_75fccinfant')),    toNum(g('_75fccinfant_flag')),
    toNum(g('_75fcctoddler')),   toNum(g('_75fcctoddler_flag')),
    toNum(g('_75fccpreschool')), toNum(g('_75fccpreschool_flag')),
    toNum(g('flfpr_20to64')),
    toNum(g('flfpr_20to64_under6')),
    toNum(g('flfpr_20to64_6to17')),
    toNum(g('mhi')),    toNum(g('mhi_2022')),
    toNum(g('mfi')),    toNum(g('mfi_2022')),
    toNum(g('pr_f')),   toNum(g('pr_p')),
    toNum(g('h_under6_bothwork')), toNum(g('h_under6_singlem')),
    toNum(g('h_6to17_bothwork')),  toNum(g('h_6to17_singlem')),
    new Date(),
  ];
}

async function upsertBatch(client, batch, headerIdx) {
  const colList  = COLS.join(', ');
  const updateSet = UPDATE_COLS.map(c => `${c} = EXCLUDED.${c}`).join(', ');
  const values = [];
  const placeholders = batch.map((row, i) => {
    const params = rowToParams(row, headerIdx);
    values.push(...params);
    const base = i * COLS.length;
    return `(${COLS.map((_, j) => `$${base + j + 1}`).join(', ')})`;
  });

  await client.query(
    `INSERT INTO county_costs (${colList}) VALUES ${placeholders.join(', ')}
     ON CONFLICT (county_fips_code, studyyear) DO UPDATE SET ${updateSet}`,
    values
  );
}

async function main() {
  const client = await pool.connect();
  try {
    const rl = readline.createInterface({ input: fs.createReadStream(CSV_PATH), crlfDelay: Infinity });
    let headerIdx = null;
    let batch = [];
    let total = 0;
    const BATCH_SIZE = 50;

    for await (const line of rl) {
      const fields = line.split(',');

      if (!headerIdx) {
        headerIdx = Object.fromEntries(fields.map((h, i) => [h.trim(), i]));
        continue;
      }

      // NY only
      if (fields[headerIdx['state_abbreviation']] !== 'NY') continue;

      batch.push(fields);

      if (batch.length >= BATCH_SIZE) {
        await upsertBatch(client, batch, headerIdx);
        total += batch.length;
        batch = [];
      }
    }

    if (batch.length > 0) {
      await upsertBatch(client, batch, headerIdx);
      total += batch.length;
    }

    console.log(`Done. Total NY rows ingested: ${total}`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
