'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { AppLogo } from '@/components/AppLogo'
import { APP_NAME } from '@/lib/app-config'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[var(--bg)]">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <AppLogo className="h-8 w-8" />
          <span className="text-2xl font-bold text-[var(--txt)]">{APP_NAME}</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
          <h1 className="text-xl font-semibold text-[var(--txt)] mb-1">Sign in</h1>
          <p className="text-sm text-[var(--muted)] mb-6">Welcome back</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--inp-bg)] px-3 text-sm text-[var(--txt)] placeholder:text-[var(--muted2)] outline-none focus:ring-2 focus:ring-[#033882]/30 focus:border-[#033882]/50 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full h-10 rounded-xl border border-[var(--border)] bg-[var(--inp-bg)] px-3 pr-10 text-sm text-[var(--txt)] placeholder:text-[var(--muted2)] outline-none focus:ring-2 focus:ring-[#033882]/30 focus:border-[#033882]/50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--txt)] transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-xl bg-[#033882] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[var(--muted)] mt-5">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-[#033882] font-medium hover:underline">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  )
}
