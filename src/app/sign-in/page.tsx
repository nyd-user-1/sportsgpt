'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { AppLogo } from '@/components/AppLogo'
import { APP_NAME } from '@/lib/app-config'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

const SERIF = { fontFamily: 'var(--font-display), Georgia, serif' } as const
const SANS  = { fontFamily: 'var(--font-sans), system-ui, sans-serif' } as const

export default function SignInPage() {
  return <Suspense><SignInForm /></Suspense>
}

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/chat'

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      setError('Invalid email or password.')
    } else {
      router.push(callbackUrl)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[var(--paper)] text-[var(--paper-text)]">
      <div className="w-full max-w-md">

        {/* Eyebrow + brand */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-[var(--paper-faint)] mb-6" style={SANS}>
            <span aria-hidden className="inline-block w-6 h-px bg-[var(--paper-rule)]" />
            Section XI · Long Island
            <span aria-hidden className="inline-block w-6 h-px bg-[var(--paper-rule)]" />
          </div>
          <div className="flex items-center justify-center gap-2.5">
            <AppLogo className="h-8 w-8" />
            <span className="text-[28px] tracking-[-0.01em] text-[var(--paper-text)]" style={{ ...SERIF, fontWeight: 500 }}>{APP_NAME}</span>
          </div>
        </div>

        {/* Card */}
        <div className="border border-[var(--paper-rule)] bg-[var(--paper-quiet)] p-8 sm:p-10" style={{ borderRadius: 3 }}>
          <h1 className="text-[40px] sm:text-[44px] leading-[1] tracking-[-0.02em] text-[var(--paper-text)]" style={{ ...SERIF, fontWeight: 400 }}>
            Sign in.
          </h1>
          <p className="mt-3 mb-7 text-[15px] italic text-[var(--paper-muted)]" style={SERIF}>
            Welcome back — the box scores are waiting.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.22em] text-[var(--paper-faint)] mb-2" style={SANS}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full h-11 border border-[var(--paper-rule)] bg-[var(--paper)] px-3.5 text-[15px] text-[var(--paper-text)] placeholder:text-[var(--paper-faint)] outline-none focus:border-[var(--paper-text)] transition-colors"
                style={{ ...SERIF, borderRadius: 3 }}
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.22em] text-[var(--paper-faint)] mb-2" style={SANS}>Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full h-11 border border-[var(--paper-rule)] bg-[var(--paper)] px-3.5 pr-10 text-[15px] text-[var(--paper-text)] placeholder:text-[var(--paper-faint)] outline-none focus:border-[var(--paper-text)] transition-colors"
                  style={{ ...SERIF, borderRadius: 3 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--paper-faint)] hover:text-[var(--paper-text)] transition-colors"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-[12px] text-red-400 border border-red-400/30 bg-red-500/5 px-3 py-2 italic" style={{ ...SERIF, borderRadius: 3 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[var(--paper-text)] text-[var(--paper)] text-[11px] uppercase tracking-[0.22em] font-semibold hover:opacity-85 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              style={{ ...SANS, borderRadius: 3 }}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
          </form>
        </div>

        <p className="text-center text-[13px] text-[var(--paper-muted)] mt-6 italic" style={SERIF}>
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-[var(--paper-strong)] not-italic font-medium hover:underline" style={SANS}>
            Sign up
          </Link>
        </p>

      </div>
    </div>
  )
}
