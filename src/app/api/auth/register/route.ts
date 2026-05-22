import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json() as {
    name?: string; email?: string; password?: string
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const sql = neon(process.env.DATABASE_URL!)
  const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase().trim()} LIMIT 1`
  if (existing.length > 0) {
    return NextResponse.json({ error: 'An account with that email already exists' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)
  await sql`
    INSERT INTO users (name, email, password)
    VALUES (${name?.trim() || null}, ${email.toLowerCase().trim()}, ${hashed})`

  return NextResponse.json({ ok: true })
}
