'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BrandLogo from '@/components/layout/BrandLogo'
import { useAuth } from '@/lib/auth-context'
import PasswordInput from '@/components/ui/PasswordInput'

export default function RegisterPage() {
  const { register } = useAuth()
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (!agreed) {
      setError('Please agree to the terms to continue')
      return
    }

    setLoading(true)
    try {
      await register({ email, password, firstName, lastName })
      router.push('/account')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.'
      setError(message)
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
          Create Account
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 36 }}>
          Join Royal Elite Moving
        </p>

        {error && (
          <div style={{ marginBottom: 20, padding: '12px 16px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#fca5a5', fontSize: '0.85rem', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                autoComplete="given-name"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                autoComplete="family-name"
                style={inputStyle}
              />
            </div>
          </div>

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
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Confirm Password</label>
            <PasswordInput
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
              style={inputStyle}
            />
          </div>

          {/* Outsyde disclosure — required */}
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              required
              style={{ marginTop: 3, accentColor: 'var(--accent)', flexShrink: 0 }}
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.5 }}>
              I understand that this site is powered by{' '}
              <a href="https://goutsyde.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                Outsyde
              </a>
              , a commerce platform for independent businesses, and that my account and estimate request data are managed by Outsyde on behalf of Royal Elite Moving.
            </span>
          </label>

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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--muted)', marginTop: 24 }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
