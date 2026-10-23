'use client'

import { useEffect, useState } from 'react'

function authHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem('outsyde_access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

const key = (c: string) => c.trim().replace(/\s+/g, ' ').toLowerCase()

// The cities Royal Elite serves. Customers pick one of these first on the estimate form,
// and each plan can be limited to some of them on the Plans page.
export default function AreasPage() {
  const [cities, setCities] = useState<string[]>([])
  const [saved, setSaved] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    fetch('/api/admin/business', { headers: authHeaders(), cache: 'no-store' })
      .then(async r => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Could not load your service areas.')
        const list: string[] = Array.isArray(data.business?.serviceCities) ? data.business.serviceCities : []
        setCities(list)
        setSaved(list)
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Could not load your service areas.'))
      .finally(() => setLoading(false))
  }, [])

  function add() {
    const name = input.trim().replace(/\s+/g, ' ')
    if (!name) return
    if (name.length > 60) { setError('City names can be up to 60 characters.'); return }
    if (cities.some(c => key(c) === key(name))) { setInput(''); return }
    if (cities.length >= 50) { setError('You can list up to 50 cities.'); return }
    setCities([...cities, name])
    setInput('')
    setError(null)
    setOk(false)
  }

  function remove(c: string) {
    setCities(cities.filter(x => x !== c))
    setOk(false)
  }

  async function save() {
    setSaving(true)
    setError(null)
    setOk(false)
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ serviceCities: cities }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Could not save your service areas.')
      const list: string[] = Array.isArray(data.business?.serviceCities) ? data.business.serviceCities : cities
      setCities(list)
      setSaved(list)
      setOk(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save your service areas.')
    } finally {
      setSaving(false)
    }
  }

  const dirty = JSON.stringify(cities) !== JSON.stringify(saved)

  return (
    <div style={{ maxWidth: 640 }}>
      <h1 className="font-display" style={{ fontSize: 34, color: 'var(--text)', marginBottom: 6 }}>Service areas</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
        The cities you serve. Customers choose one of these first on your estimate form, and only the plans offered there show up. Set which cities each plan covers on the Plans page.
      </p>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Loading...</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
              placeholder="Add a city, for example Virginia Beach"
              maxLength={60}
              style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', color: 'var(--text)', fontSize: 14 }}
            />
            <button onClick={add} className="btn btn-secondary">Add</button>
          </div>

          {cities.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 14, padding: 16, border: '1px dashed var(--border)', borderRadius: 8 }}>
              No cities yet. Until you add some, your site shows Chesapeake, Norfolk, Portsmouth and Suffolk, and accepts requests from any city.
            </p>
          ) : (
            <ul style={{ display: 'flex', flexWrap: 'wrap', gap: 8, listStyle: 'none', padding: 0 }}>
              {cities.map(c => (
                <li key={c} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px 6px 14px', borderRadius: 999, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: 14 }}>
                  {c}
                  <button onClick={() => remove(c)} aria-label={`Remove ${c}`} style={{ width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'var(--surface-2)', color: 'var(--muted)', cursor: 'pointer' }}>×</button>
                </li>
              ))}
            </ul>
          )}

          {error && <p role="alert" style={{ marginTop: 16, color: '#fca5a5', fontSize: 14 }}>{error}</p>}
          {ok && <p style={{ marginTop: 16, color: 'var(--muted)', fontSize: 14 }}>Saved.</p>}

          <button onClick={save} disabled={saving || !dirty} className="btn btn-primary" style={{ marginTop: 20 }}>
            {saving ? 'Saving...' : 'Save service areas'}
          </button>
        </>
      )}
    </div>
  )
}
