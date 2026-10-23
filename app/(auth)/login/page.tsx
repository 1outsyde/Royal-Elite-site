'use client'
import { useState, FormEvent, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import BrandLogo from '@/components/layout/BrandLogo'
import { useAuth } from '@/lib/auth-context'
import { isAdminEmail } from '@/lib/config'
import PasswordInput from '@/components/ui/PasswordInput'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const justRegistered = searchParams.get('registered') === 'true'
  const redirect = searchParams.get('redirect') ?? '/account'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const loggedInUser = await login(email, password)
      if (isAdminEmail(loggedInUser.email) || loggedInUser.role === 'vendor' || loggedInUser.role === 'admin') {
        router.push('/dashboard')
      } else {
        router.push(redirect)
      }
    } catch {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    padding: '12px 14px',
    color: 'var(--text)',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box',
    borderRadius: '4px',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.65rem',
    letterSpacing: '.16em',
    textTransform: 'uppercase',
    color: 'var(--muted)',
    marginBottom: 8,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ marginBottom: 20 }}>
          <BrandLogo variant="full" priority maxWidthClass="max-w-[320px] sm:max-w-[360px]" />
        </div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '2.4rem', fontWeight: 500, textAlign: 'center', marginBottom: 6, color: 'var(--text)' }}>
          Sign In
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 36 }}>
          Welcome back
        </p>

        {justRegistered && (
          <div style={{ marginBottom: 20, padding: '12px 16px', border: '1px solid var(--accent)', background: 'var(--accent-soft)', color: 'var(--text)', fontSize: '0.85rem', borderRadius: '4px' }}>
            Account created. Please sign in.
          </div>
        )}

        {error && (
          <div style={{ marginBottom: 20, padding: '12px 16px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#fca5a5', fontSize: '0.85rem', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <PasswordInput
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 8,
              background: loading ? 'var(--surface-2)' : 'var(--accent)',
              color: loading ? 'var(--muted)' : 'var(--on-accent)',
              border: 'none',
              padding: '14px',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '.16em',
              textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer',
              borderRadius: '4px',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--muted)', marginTop: 24 }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
            Create one
          </Link>
        </p>
        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--muted)', marginTop: 12 }}>
          <Link href="/forgot-password" style={{ color: 'var(--muted)', textDecoration: 'underline' }}>
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  )
}
