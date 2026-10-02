import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { neon } from '@/lib/aurora'
import bcrypt from 'bcryptjs'

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/sign-in',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const sql = neon(process.env.DATABASE_URL!)
        const rows = await sql`
          SELECT id, name, email, password FROM users
          WHERE email = ${String(credentials.email).toLowerCase().trim()}
          LIMIT 1`
        const user = rows[0]
        if (!user?.password) return null
        const ok = await bcrypt.compare(String(credentials.password), user.password)
        if (!ok) return null
        return { id: user.id, name: user.name, email: user.email }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) { token.id = user.id; token.name = user.name }
      return token
    },
    session({ session, token }) {
      if (session.user) { session.user.id = token.id as string; session.user.name = token.name as string }
      return session
    },
  },
})
