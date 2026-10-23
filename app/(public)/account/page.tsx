'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { VENDOR_CONFIG } from '@/lib/config'

// ─── Design tokens ───────────────────────────────────────────────────────────
const BG          = 'var(--bg)'
const SURFACE     = 'var(--surface)'
const ACCENT      = 'var(--accent)'
const ON_ACCENT   = 'var(--on-accent)'
const TEXT        = 'var(--text)'
const MUTED       = 'var(--muted)'
const BORDER      = 'var(--border)'
const CARD_BG     = 'var(--surface)'
const FONT_DISPLAY = 'Georgia, serif'
const FONT_BODY    = 'system-ui, sans-serif'


function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: CARD_BG,
      border: `1px solid ${BORDER}`,
      borderRadius: 4,
      padding: '20px 24px',
      marginBottom: 16,
      ...style,
    }}>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: '1.25rem', fontWeight: 500, color: TEXT, marginBottom: 16 }}>
      {children}
    </h3>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ imageUrl, initial, size = 56 }: { imageUrl?: string | null; initial: string; size?: number }) {
  if (imageUrl) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: ACCENT, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: FONT_DISPLAY, fontSize: size * 0.42, fontWeight: 600, color: ON_ACCENT,
    }}>
      {initial}
    </div>
  )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function ProfileSection() {
  const { user, logout, updateUser } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [displayName, setDisplayName]       = useState(user?.displayName ?? user?.name ?? user?.firstName ?? '')
  const [username, setUsername]             = useState(user?.username ?? '')
  const [identitySaving, setIdentitySaving] = useState(false)
  const [identityMsg, setIdentityMsg]       = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('outsyde_access_token') : null
      const form = new FormData()
      form.append('file', file)
      form.append('folder', 'profiles')
      const uploadRes = await fetch('/api/user/upload-image', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      const { url } = await uploadRes.json()
      if (!url) throw new Error('No URL returned')
      const token2 = typeof window !== 'undefined' ? localStorage.getItem('outsyde_access_token') : null
      await fetch('/api/user/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token2 ? { Authorization: `Bearer ${token2}` } : {}),
        },
        body: JSON.stringify({ profileImageUrl: url }),
      })
      updateUser({ profileImageUrl: url })
    } catch {
      // silent — user will see no change in avatar
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIdentitySaving(true)
    setIdentityMsg(null)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('outsyde_access_token') : null
      const res = await fetch('/api/user/identity', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ displayName, ...(username.trim() ? { username: username.trim() } : {}) }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { message?: string }).message ?? 'Save failed')
      }
      updateUser({ displayName, name: displayName, ...(username.trim() ? { username: username.trim() } : {}) })
      setIdentityMsg('Changes saved.')
    } catch (err: unknown) {
      setIdentityMsg(err instanceof Error ? err.message : 'Failed to save. Please try again.')
    } finally {
      setIdentitySaving(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: SURFACE, border: `1px solid ${BORDER}`,
    padding: '12px 14px', color: TEXT, fontSize: '1rem', outline: 'none',
    boxSizing: 'border-box', borderRadius: 4, fontFamily: FONT_BODY,
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.65rem', letterSpacing: '.14em', textTransform: 'uppercase',
    color: MUTED, marginBottom: 6, fontFamily: FONT_BODY,
  }

  const initial = user?.firstName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div>
      {/* Section 1 — Photo */}
      <Card>
        <SectionTitle>Profile Photo</SectionTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Avatar imageUrl={user?.profileImageUrl} initial={initial} size={72} />
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              style={{
                background: ACCENT, color: ON_ACCENT, border: 'none', padding: '10px 20px',
                fontSize: '0.72rem', letterSpacing: '.12em', textTransform: 'uppercase',
                cursor: photoUploading ? 'not-allowed' : 'pointer', opacity: photoUploading ? 0.6 : 1,
                borderRadius: 4, fontFamily: FONT_BODY, fontWeight: 700,
              }}
            >
              {photoUploading ? 'Uploading…' : 'Change Photo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handlePhotoChange}
            />
          </div>
        </div>
      </Card>

      {/* Section 2 — Account Info */}
      <Card>
        <SectionTitle>Account Info</SectionTitle>
        <form onSubmit={handleIdentitySubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              autoComplete="name"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              autoComplete="username"
              style={inputStyle}
            />
            <p style={{ fontFamily: FONT_BODY, fontSize: '0.75rem', color: MUTED, marginTop: 6 }}>
              Lowercase letters, numbers, underscores only. 14-day cooldown.
            </p>
          </div>
          {identityMsg && (
            <p style={{ fontFamily: FONT_BODY, fontSize: '0.85rem', color: identityMsg === 'Changes saved.' ? '#4CAF50' : '#fca5a5' }}>
              {identityMsg}
            </p>
          )}
          <div>
            <button
              type="submit"
              disabled={identitySaving}
              style={{
                background: ACCENT, color: ON_ACCENT, border: 'none', padding: '11px 24px',
                fontSize: '0.72rem', fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase',
                cursor: identitySaving ? 'not-allowed' : 'pointer', opacity: identitySaving ? 0.6 : 1,
                borderRadius: 4, fontFamily: FONT_BODY,
              }}
            >
              {identitySaving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Card>

      {/* Section 3 — Email */}
      <Card>
        <SectionTitle>Email Address</SectionTitle>
        <p style={{ fontFamily: FONT_BODY, fontSize: '0.9375rem', color: TEXT, marginBottom: 6 }}>
          {user?.email}
        </p>
        <p style={{ fontFamily: FONT_BODY, fontSize: '0.8rem', color: MUTED }}>
          To change your email address, contact{' '}
          <a href={`mailto:${VENDOR_CONFIG.contactEmail}`} style={{ color: ACCENT, textDecoration: 'underline' }}>
            {VENDOR_CONFIG.contactEmail}
          </a>
        </p>
      </Card>

      {/* Section 4 — Password */}
      <Card>
        <SectionTitle>Password</SectionTitle>
        <p style={{ fontFamily: FONT_BODY, fontSize: '0.875rem', color: MUTED, marginBottom: 16, lineHeight: 1.6 }}>
          To change your password, we&apos;ll send a reset link to your email.
        </p>
        <Link
          href="/forgot-password"
          style={{
            display: 'inline-block', background: 'transparent',
            border: `1px solid ${ACCENT}`, color: ACCENT, padding: '10px 22px',
            fontSize: '0.72rem', fontWeight: 500, letterSpacing: '.14em',
            textTransform: 'uppercase', textDecoration: 'none',
            borderRadius: 4, fontFamily: FONT_BODY,
          }}
        >
          Reset Password
        </Link>
      </Card>

      {/* Sign out */}
      <button
        onClick={handleLogout}
        style={{
          width: '100%', background: 'transparent', border: `1px solid #DC2626`,
          color: '#DC2626', padding: '13px', fontSize: '0.72rem', fontWeight: 500,
          letterSpacing: '.14em', textTransform: 'uppercase', cursor: 'pointer',
          borderRadius: 4, fontFamily: FONT_BODY, marginTop: 8,
        }}
      >
        Sign Out
      </button>
    </div>
  )
}

// ─── Root page ────────────────────────────────────────────────────────────────
export default function AccountPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login?redirect=/account')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: MUTED, fontFamily: FONT_BODY, fontSize: '0.9rem' }}>Loading…</p>
      </div>
    )
  }

  if (!user) return null

  const initial = user.firstName?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: BG }}>
      {/* Header */}
      <div style={{ background: SURFACE, paddingTop: 40, paddingBottom: 24 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
          {/* Back link */}
          <Link
            href="/"
            style={{
              display: 'inline-block', marginBottom: 20,
              fontFamily: FONT_BODY, fontSize: '0.8125rem',
              color: MUTED, textDecoration: 'none',
            }}
          >
            ← Back to Home
          </Link>

          {/* Avatar + identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <Avatar imageUrl={user.profileImageUrl} initial={initial} size={56} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: FONT_DISPLAY, fontSize: '1.5rem', fontWeight: 500, color: TEXT, marginBottom: 2 }}>
                {user.firstName || user.email.split('@')[0]}
              </p>
              <p style={{ fontFamily: FONT_BODY, fontSize: '0.85rem', color: ACCENT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 64px' }}>
        <ProfileSection />
      </div>
    </div>
  )
}
