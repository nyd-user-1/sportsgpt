import { neon } from '@neondatabase/serverless';

const url = process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@placeholder/placeholder';

export const sql = neon(url);
