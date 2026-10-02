import { neon } from '@/lib/aurora';

const url = process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@placeholder/placeholder';

export const sql = neon(url);
