'use client'

import { useEffect, useState, type CSSProperties } from 'react'

// "Who gets requests" on Dashboard > Requests (Legend 2026-11-10): the login email and Outsyde always get
// each request; Benny adds up to 5 more (Jeremiah handles Royal Elite's calls). The backend cleans the list.
const MAX = 5

function authHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem('outsyde_access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

const input: CSSProperties = {
  flex: 1, minWidth: 0, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '9px 12px',
  color: 'var(--text)', fontSize: 14, fontFamily: 'inherit',
}

export default function RequestRecipients() {
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null)
  const [outsydeEmail, setOutsydeEmail] = useState<string | null>(null)
  const [emails, setEmails] = useState<string[]>([])
  const [saved, setSaved] = useState('[]')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  function apply(data: { ownerEmail?: string | null; outsydeEmail?: string | null; emails?: string[] }) {
    const list = Array.isArray(data.emails) ? data.emails : []
    setOwnerEmail(data.ownerEmail ?? null)
    setOutsydeEmail(data.outsydeEmail ?? null)
    setEmails(list)
    setSaved(JSON.stringify(list))
  }

  useEffect(() => {
    fetch('/api/admin/request-recipients', { headers: authHeaders(), cache: 'no-store' })
      .then(async r => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Could not load who gets requests.')
        apply(data)
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Could not load who gets requests.'))
      .finally(() => setLoading(false))
  }, [])

  const cleaned = emails.map(e => e.trim()).filter(Boolean)
  const dirty = JSON.stringify(cleaned) !== saved

  async function save() {
    setSaving(true)
    setError(null)
    setOk(false)
    try {
      const res = await fetch('/api/admin/request-recipients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ emails: cleaned }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Could not save. Please try again.')
      apply(data)
      setOk(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <section style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: 18, marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <h2 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.12em', color: 'var(--muted)', textTransform: 'uppercase' }}>Who gets requests</h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6 }}>Every new request is emailed to everyone here.</p>
      </div>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 14, color: 'var(--text)' }}>
        {ownerEmail && <li>{ownerEmail} <span style={{ color: 'var(--muted)' }}>(your login, always included)</span></li>}
        {outsydeEmail && <li>{outsydeEmail} <span style={{ color: 'var(--muted)' }}>(Outsyde, always included)</span></li>}
      </ul>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {emails.map((e, i) => (
          <div key={i} style={{ display: 'flex', gap: 8 }}>
            <input id={`recipient-${i}`} type="email" aria-label={`Extra email ${i + 1}`} value={e} placeholder="name@example.com" style={input}
              onChange={ev => { setEmails(emails.map((x, n) => (n === i ? ev.target.value : x))); setOk(false) }} />
            <button type="button" className="btn btn-outline" onClick={() => { setEmails(emails.filter((_, n) => n !== i)); setOk(false) }}>Remove</button>
          </div>
        ))}
        {emails.length < MAX && (
          <button type="button" className="btn btn-outline" style={{ alignSelf: 'flex-start' }} onClick={() => { setEmails([...emails, '']); setOk(false) }}>
            Add an email
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-primary" disabled={saving || !dirty} onClick={save}>{saving ? 'Saving...' : 'Save'}</button>
        {error && <span role="alert" style={{ color: '#fca5a5', fontSize: 14 }}>{error}</span>}
        {ok && <span style={{ color: 'var(--muted)', fontSize: 14 }}>Saved.</span>}
      </div>
    </section>
  )
}
