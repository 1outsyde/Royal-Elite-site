'use client'

import { useCallback, useEffect, useState } from 'react'
import { refusalMessage } from '@/lib/planState'
import { formatDollars } from '@/lib/estimates'

// Royal Elite's plans (Outsyde vendor services). Plans are request only by default: customers ask for
// an estimate, nothing is booked or paid online. Each plan can be limited to some service areas.

interface PlanRow {
  id: string
  name: string
  description: string | null
  price: number
  durationMinutes: number
  status: 'draft' | 'live' | 'archived' | 'paused'
  isActive: boolean | null
  imageUrl: string | null
  stripeProductId: string | null
  serviceCities: string[] | null
  requestOnly: boolean | null
}

type Form = {
  name: string
  description: string
  price: string
  imageUrl: string | null
  cities: string[]
}

const EMPTY: Form = { name: '', description: '', price: '', imageUrl: null, cities: [] }
// Not used for request only plans (nothing is scheduled online), but the backend needs a length.
const DEFAULT_DURATION_MINUTES = 180

function authHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem('outsyde_access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

const field: React.CSSProperties = {
  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px',
  color: 'var(--text)', fontSize: 14, boxSizing: 'border-box',
}
const lbl: React.CSSProperties = { display: 'block', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }

const STATUS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  live: { bg: '#15803D', color: '#fff', label: 'LIVE' },
  draft: { bg: 'var(--surface-2)', color: 'var(--muted)', label: 'DRAFT' },
  paused: { bg: '#B45309', color: '#fff', label: 'PAUSED' },
  archived: { bg: '#7F1D1D', color: '#fff', label: 'ARCHIVED' },
}

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanRow[]>([])
  const [areas, setAreas] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<PlanRow | 'new' | null>(null)
  const [form, setForm] = useState<Form>(EMPTY)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [sRes, bRes] = await Promise.all([
        fetch('/api/admin/services', { headers: authHeaders(), cache: 'no-store' }),
        fetch('/api/admin/business', { headers: authHeaders(), cache: 'no-store' }),
      ])
      const sData = await sRes.json().catch(() => ({}))
      if (!sRes.ok) throw new Error(typeof sData?.error === 'string' ? sData.error : 'Could not load your plans.')
      setPlans(Array.isArray(sData.services) ? sData.services : [])
      const bData = await bRes.json().catch(() => ({}))
      setAreas(bRes.ok && Array.isArray(bData.business?.serviceCities) ? bData.business.serviceCities : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your plans.')
    } finally {
      setLoading(false)
    }
  }, [])

  // First load runs after mount, never synchronously inside the effect body.
  useEffect(() => {
    const t = setTimeout(() => { load() }, 0)
    return () => clearTimeout(t)
  }, [load])

  function openNew() {
    setEditing('new')
    setForm(EMPTY)
    setFormError(null)
  }

  function openEdit(p: PlanRow) {
    setEditing(p)
    setForm({
      name: p.name,
      description: p.description ?? '',
      price: (p.price / 100).toString(),
      imageUrl: p.imageUrl,
      cities: p.serviceCities ?? [],
    })
    setFormError(null)
  }

  async function uploadImage(file: File) {
    setUploading(true)
    setFormError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/services/upload-image', { method: 'POST', headers: authHeaders(), body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) throw new Error(typeof data?.error === 'string' ? data.error : 'Image upload failed.')
      setForm(f => ({ ...f, imageUrl: data.url }))
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Image upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    setFormError(null)
    if (!form.name.trim()) { setFormError('Give the plan a name.'); return }
    const dollars = Number(form.price)
    if (!Number.isFinite(dollars) || dollars < 7) { setFormError('Enter a starting price of at least $7.'); return }
    const body = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Math.round(dollars * 100),
      imageUrl: form.imageUrl,
      serviceCities: form.cities,
      // Royal Elite plans are always request only (Legend 2026-10-22).
      requestOnly: true,
      ...(editing === 'new' ? { durationMinutes: DEFAULT_DURATION_MINUTES } : {}),
    }
    setSaving(true)
    try {
      const res = editing === 'new'
        ? await fetch('/api/admin/services', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) })
        : await fetch(`/api/admin/services/${(editing as PlanRow).id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(await refusalMessage(res, 'Could not save the plan.'))
      setEditing(null)
      await load()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Could not save the plan.')
    } finally {
      setSaving(false)
    }
  }

  async function publish(p: PlanRow) {
    setBusy(p.id)
    try {
      const res = !p.stripeProductId
        ? await fetch(`/api/admin/services/${p.id}/go-live`, { method: 'POST', headers: authHeaders() })
        : await fetch(`/api/admin/services/${p.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ status: 'live', isActive: true }) })
      if (!res.ok) throw new Error(await refusalMessage(res, 'Could not publish the plan.'))
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not publish the plan.')
    } finally {
      setBusy(null)
    }
  }

  async function archive(p: PlanRow) {
    if (!confirmArchive(p)) return
    setBusy(p.id)
    try {
      const res = await fetch(`/api/admin/services/${p.id}/archive`, { method: 'POST', headers: authHeaders() })
      if (!res.ok) throw new Error(await refusalMessage(res, 'Could not archive the plan.'))
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Could not archive the plan.')
    } finally {
      setBusy(null)
    }
  }

  const visible = plans.filter(p => showArchived || p.status !== 'archived')

  return (
    <div style={{ maxWidth: 980 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 className="font-display" style={{ fontSize: 34, color: 'var(--text)', marginBottom: 6 }}>Plans</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14, maxWidth: 620 }}>
            Your moving and packing plans. Customers see live plans on your site and in the Outsyde app, and request an estimate for the one they want. Nothing is paid online.
          </p>
        </div>
        <button onClick={openNew} className="btn btn-primary">Add a plan</button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Loading...</p>
      ) : error ? (
        <p role="alert" style={{ color: '#fca5a5' }}>{error}</p>
      ) : (
        <>
          {visible.length === 0 ? (
            <div style={{ padding: 32, border: '1px dashed var(--border)', borderRadius: 8, textAlign: 'center', color: 'var(--muted)' }}>
              No plans yet. Until you add and publish plans, your site shows your standard price list.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {visible.map(p => {
                const badge = STATUS_BADGE[p.status] ?? STATUS_BADGE.draft
                const where = (p.serviceCities ?? []).length ? (p.serviceCities ?? []).join(', ') : 'Every service area'
                return (
                  <div key={p.id} style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', padding: 16, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" style={{ width: 64, height: 64, borderRadius: 6, objectFit: 'cover' }} />
                    ) : null}
                    <div style={{ flex: 1, minWidth: 220 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{p.name}</span>
                        <span style={{ background: badge.bg, color: badge.color, fontSize: 10, fontWeight: 700, letterSpacing: '.08em', padding: '2px 8px', borderRadius: 999 }}>{badge.label}</span>
                        {p.requestOnly ? null : <span style={{ fontSize: 11, color: 'var(--accent-hover)' }}>Saving it makes it estimate request only</span>}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>From {formatDollars(p.price)}, {where}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button onClick={() => openEdit(p)} className="btn btn-secondary">Edit</button>
                      {p.status !== 'live' && p.status !== 'archived' && (
                        <button onClick={() => publish(p)} disabled={busy === p.id} className="btn btn-primary">{busy === p.id ? 'Publishing...' : 'Publish'}</button>
                      )}
                      {p.status !== 'archived' && (
                        <button onClick={() => archive(p)} disabled={busy === p.id} className="btn btn-secondary">Archive</button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {plans.some(p => p.status === 'archived') && (
            <button onClick={() => setShowArchived(s => !s)} style={{ marginTop: 16, background: 'none', border: 'none', color: 'var(--muted)', textDecoration: 'underline', cursor: 'pointer', fontSize: 13 }}>
              {showArchived ? 'Hide archived plans' : 'Show archived plans'}
            </button>
          )}
        </>
      )}

      {editing && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 24 }}>
            <h2 className="font-display" style={{ fontSize: 26, color: 'var(--text)', marginBottom: 18 }}>{editing === 'new' ? 'Add a plan' : 'Edit plan'}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={lbl} htmlFor="plan-name">Plan name</label>
                <input id="plan-name" value={form.name} maxLength={120} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="For example Standard Move, weekday" style={field} />
              </div>
              <div>
                <label style={lbl} htmlFor="plan-price">Starting price ($)</label>
                <input id="plan-price" type="number" min={7} step="1" inputMode="decimal" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="300" style={field} />
              </div>
              <div>
                <label style={lbl} htmlFor="plan-desc">Description</label>
                <textarea id="plan-desc" rows={4} maxLength={2000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What's included, extra hour rate, surcharges." style={{ ...field, resize: 'vertical' }} />
              </div>

              <div>
                <span style={lbl}>Offered in</span>
                {areas.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontSize: 13 }}>Add your cities on the Service areas page first. Until then this plan is offered everywhere you serve.</p>
                ) : (
                  <>
                    <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 8 }}>Leave all unchecked to offer it in every service area.</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {areas.map(c => {
                        const on = form.cities.some(x => x.toLowerCase() === c.toLowerCase())
                        return (
                          <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, border: `1px solid ${on ? 'var(--accent)' : 'var(--border)'}`, background: on ? 'var(--accent-soft)' : 'transparent', color: 'var(--text)', fontSize: 13, cursor: 'pointer' }}>
                            <input type="checkbox" checked={on} onChange={() => setForm({ ...form, cities: on ? form.cities.filter(x => x.toLowerCase() !== c.toLowerCase()) : [...form.cities, c] })} />
                            {c}
                          </label>
                        )
                      })}
                    </div>
                    {form.cities.some(x => !areas.some(a => a.toLowerCase() === x.toLowerCase())) && (
                      <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 8 }}>
                        Also saved: {form.cities.filter(x => !areas.some(a => a.toLowerCase() === x.toLowerCase())).join(', ')} (not in your service areas).
                      </p>
                    )}
                  </>
                )}
              </div>

              <div>
                <span style={lbl}>Photo</span>
                {form.imageUrl ? (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.imageUrl} alt="" style={{ width: 96, height: 64, borderRadius: 6, objectFit: 'cover' }} />
                    <button onClick={() => setForm({ ...form, imageUrl: null })} className="btn btn-secondary">Remove</button>
                  </div>
                ) : (
                  <input type="file" accept="image/*" disabled={uploading} onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f) }} style={{ color: 'var(--muted)', fontSize: 13 }} />
                )}
                {uploading && <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>Uploading...</p>}
              </div>


              {formError && <p role="alert" style={{ color: '#fca5a5', fontSize: 14 }}>{formError}</p>}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setEditing(null)} className="btn btn-secondary" disabled={saving}>Cancel</button>
                <button onClick={save} className="btn btn-primary" disabled={saving || uploading}>{saving ? 'Saving...' : 'Save plan'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function confirmArchive(p: PlanRow): boolean {
  try {
    return window.confirm(`Archive "${p.name}"? It comes off your site and the app. You can still see it under archived plans.`)
  } catch {
    return true
  }
}
