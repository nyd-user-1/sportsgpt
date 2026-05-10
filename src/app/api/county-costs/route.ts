import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(req: NextRequest) {
  const year = parseInt(req.nextUrl.searchParams.get('year') ?? '2022', 10);

  const rows = await sql`
    SELECT
      county_fips_code,
      county_name,
      studyyear,
      mcinfant, mctoddler, mcpreschool,
      mfccinfant, mfcctoddler, mfccpreschool,
      _75cinfant, _75ctoddler, _75cpreschool,
      flfpr_20to64_under6,
      mhi, mfi,
      pr_f, pr_p,
      h_under6_bothwork, h_under6_singlem
    FROM county_costs
    WHERE studyyear = ${year}
    ORDER BY county_name
  `;

  return NextResponse.json({ data: rows, year });
}
