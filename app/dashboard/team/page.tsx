'use client'

import { useEffect, useState, type CSSProperties } from 'react'

// Dashboard > Team (owner only, Legend 2026-11-11): people who help run the site dashboard with their own
// Outsyde login. They work Estimate requests (status, notes) and see the other pages read only.

type Member = { userId: string; email: string | null; name: string | null; role: string; createdAt: string }

function authHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem('outsyde_access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

const input: CSSProperties = {
  flex: 1, minWidth: 0, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px',
  color: 'var(--text)', fontSize: 14, fontFamily: 'inherit',
}
const ROLE_LABEL: Record<string, string> = { requests: 'Estimate requests', manager: 'Manager' }

export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  async function load() {
    const r = await fetch('/api/admin/team', { headers: authHeaders(), cache: 'no-store' })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(typeof d?.error === 'string' ? d.error : 'Could not load your team.')
    setMembers(Array.isArray(d.members) ? d.members : [])
  }

  useEffect(() => {
    fetch('/api/admin/team', { headers: authHeaders(), cache: 'no-store' })
      .then(async r => {
        const d = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(typeof d?.error === 'string' ? d.error : 'Could not load your team.')
        setMembers(Array.isArray(d.members) ? d.members : [])
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Could not load your team.'))
      .finally(() => setLoading(false))
  }, [])

  async function add() {
    setBusy(true); setError(null); setOk(null)
    try {
      const r = await fetch('/api/admin/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ email: email.trim() }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(typeof d?.error === 'string' ? d.error : 'Could not add them. Please try again.')
      setEmail('')
      setOk(`Added ${d.member?.name ?? d.member?.email ?? 'them'}. They can sign in on this site with their own Outsyde login.`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add them. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(m: Member) {
    setBusy(true); setError(null); setOk(null)
    try {
      const r = await fetch(`/api/admin/team/${encodeURIComponent(m.userId)}`, { method: 'DELETE', headers: authHeaders() })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(typeof d?.error === 'string' ? d.error : 'Could not remove them. Please try again.')
      setOk(`Removed ${m.name ?? m.email ?? 'them'}. They can no longer open this dashboard.`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove them. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>Loading...</p>

  return (
    <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 34, color: 'var(--text)', marginBottom: 6 }}>Team</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          People who help you with estimate requests. They sign in on this site with their own Outsyde login, update
          requests and notes, and can view your other pages without changing them.
        </p>
      </div>

      <section style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {members.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>No one else is on your team yet.</p>
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {members.map(m => (
              <li key={m.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 15, color: 'var(--text)' }}>{m.name ?? m.email}</p>
                  <p style={{ fontSize: 13, color: 'var(--muted)', wordBreak: 'break-all' }}>{m.email} · {ROLE_LABEL[m.role] ?? m.role}</p>
                </div>
                <button type="button" className="btn btn-outline" disabled={busy} onClick={() => remove(m)} aria-label={`Remove ${m.name ?? m.email}`}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label htmlFor="team-email" style={{ fontSize: 13, color: 'var(--text)' }}>Add someone by the email they use for Outsyde</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input id="team-email" type="email" value={email} placeholder="name@example.com" style={input}
            onChange={e => { setEmail(e.target.value); setError(null); setOk(null) }}
            onKeyDown={e => { if (e.key === 'Enter' && email.trim()) add() }} />
          <button type="button" className="btn btn-primary" disabled={busy || !email.trim()} onClick={add}>{busy ? 'Saving...' : 'Add'}</button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>They need a free Outsyde account first. They get estimate requests access.</p>
        {error && <p role="alert" style={{ color: '#fca5a5', fontSize: 14 }}>{error}</p>}
        {ok && <p style={{ color: 'var(--muted)', fontSize: 14 }}>{ok}</p>}
      </section>
    </div>
  )
}
