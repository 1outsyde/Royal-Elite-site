'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ESTIMATE_STATUSES, STATUS_LABEL, type EstimateStatus } from '@/lib/estimates'

interface EstimateRequest {
  id: string
  status: EstimateStatus
  serviceId: string | null
  serviceName: string | null
  city: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  preferredDate: string | null
  details: Record<string, string>
  vendorNotes: string | null
  createdAt: string
  updatedAt: string
}

const DETAIL_LABELS: Record<string, string> = {
  moveType: 'Move type',
  homeSize: 'Home size',
  fromAddress: 'Pickup address',
  toAddress: 'Drop off address',
  floor: 'Floor',
  stops: 'Additional stops',
  notes: 'Notes',
}

const BADGE: Record<EstimateStatus, { bg: string; color: string }> = {
  new: { bg: 'var(--accent)', color: 'var(--on-accent)' },
  called: { bg: '#2563EB', color: '#fff' },
  quoted: { bg: '#7C3AED', color: '#fff' },
  booked: { bg: '#15803D', color: '#fff' },
  closed: { bg: 'var(--surface-2)', color: 'var(--muted)' },
}

function authHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem('outsyde_access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

function formatWhen(iso: string): string {
  const d = new Date(iso.includes('T') || iso.endsWith('Z') ? iso : iso.replace(' ', 'T') + 'Z')
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function formatMoveDate(v: string | null): string {
  if (!v) return 'Not given'
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v)
  if (!m) return v
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export default function EstimatesPage() {
  const [requests, setRequests] = useState<EstimateRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'all' | EstimateStatus>('all')
  const [openId, setOpenId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch('/api/admin/estimate-requests', { headers: authHeaders(), cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Could not load estimate requests.')
      setRequests(Array.isArray(data.requests) ? data.requests : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load estimate requests.')
    } finally {
      setLoading(false)
    }
  }, [])

  // First load runs after mount, never synchronously inside the effect body.
  useEffect(() => {
    const t = setTimeout(() => { load() }, 0)
    return () => clearTimeout(t)
  }, [load])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: requests.length }
    for (const s of ESTIMATE_STATUSES) c[s] = requests.filter(r => r.status === s).length
    return c
  }, [requests])

  const shown = tab === 'all' ? requests : requests.filter(r => r.status === tab)

  function replace(updated: EstimateRequest) {
    setRequests(list => list.map(r => (r.id === updated.id ? updated : r)))
  }

  return (
    <div style={{ maxWidth: 980 }}>
      <h1 className="font-display" style={{ fontSize: 34, color: 'var(--text)', marginBottom: 6 }}>Estimate requests</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
        Every request from your site, newest first. You also get each one by email. Call the customer back, then move the request along.
      </p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {(['all', ...ESTIMATE_STATUSES] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 14px', borderRadius: 999, fontSize: 12, fontWeight: 600, letterSpacing: '.06em', cursor: 'pointer',
              border: `1px solid ${tab === t ? 'var(--accent)' : 'var(--border)'}`,
              background: tab === t ? 'var(--accent-soft)' : 'transparent',
              color: tab === t ? 'var(--text)' : 'var(--muted)',
            }}
          >
            {t === 'all' ? 'All' : STATUS_LABEL[t]} ({counts[t] ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--muted)' }}>Loading...</p>
      ) : error ? (
        <div role="alert" style={{ padding: 16, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', borderRadius: 6 }}>
          {error} <button onClick={() => { setLoading(true); load() }} style={{ marginLeft: 8, color: 'var(--text)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>Try again</button>
        </div>
      ) : shown.length === 0 ? (
        <div style={{ padding: 32, border: '1px dashed var(--border)', borderRadius: 8, textAlign: 'center', color: 'var(--muted)' }}>
          {requests.length === 0 ? 'No estimate requests yet. New requests show up here and in your email.' : 'Nothing in this tab.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {shown.map(r => (
            <RequestCard key={r.id} r={r} open={openId === r.id} onToggle={() => setOpenId(openId === r.id ? null : r.id)} onSaved={replace} />
          ))}
        </div>
      )}
    </div>
  )
}

function RequestCard({ r, open, onToggle, onSaved }: { r: EstimateRequest; open: boolean; onToggle: () => void; onSaved: (r: EstimateRequest) => void }) {
  const [notes, setNotes] = useState(r.vendorNotes ?? '')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function save(body: { status?: EstimateStatus; vendorNotes?: string | null }) {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/estimate-requests/${r.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.request) throw new Error(typeof data?.error === 'string' ? data.error : 'Could not save.')
      onSaved(data.request)
      setMsg('Saved.')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Could not save.')
    } finally {
      setSaving(false)
    }
  }

  const badge = BADGE[r.status] ?? BADGE.closed
  const detailRows = Object.entries(r.details ?? {}).filter(([, v]) => v)

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', overflow: 'hidden' }}>
      <button onClick={onToggle} aria-expanded={open} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', padding: '16px 18px', color: 'var(--text)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ ...badge, background: badge.bg, padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>{STATUS_LABEL[r.status] ?? r.status}</span>
        <span style={{ fontWeight: 600, fontSize: 15 }}>{r.customerName}</span>
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>{[r.serviceName ?? r.details?.moveType, r.city].filter(Boolean).join(', ')}</span>
        <span style={{ color: 'var(--muted)', fontSize: 13, marginLeft: 'auto' }}>Move date {formatMoveDate(r.preferredDate)}</span>
      </button>

      {open && (
        <div style={{ padding: '4px 18px 18px', borderTop: '1px solid var(--border)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginTop: 14 }}>
            <Info label="Phone"><a href={`tel:${r.customerPhone.replace(/[^\d+]/g, '')}`} style={{ color: 'var(--accent-hover)' }}>{r.customerPhone}</a></Info>
            <Info label="Email"><a href={`mailto:${r.customerEmail}`} style={{ color: 'var(--accent-hover)', wordBreak: 'break-all' }}>{r.customerEmail}</a></Info>
            <Info label="Service">{r.serviceName ?? r.details?.moveType ?? 'Not chosen'}</Info>
            <Info label="City">{r.city ?? 'Not given'}</Info>
            <Info label="Preferred move date">{formatMoveDate(r.preferredDate)}</Info>
            <Info label="Sent">{formatWhen(r.createdAt)}</Info>
            {detailRows.filter(([k]) => k !== 'moveType').map(([k, v]) => (
              <Info key={k} label={DETAIL_LABELS[k] ?? k} wide={k === 'notes' || k === 'fromAddress' || k === 'toAddress'}>{v}</Info>
            ))}
          </div>

          <div style={{ marginTop: 18 }}>
            <p style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Status</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ESTIMATE_STATUSES.map(s => (
                <button
                  key={s}
                  disabled={saving || s === r.status}
                  onClick={() => save({ status: s })}
                  style={{
                    padding: '8px 14px', borderRadius: 6, fontSize: 13, cursor: saving || s === r.status ? 'default' : 'pointer',
                    border: `1px solid ${s === r.status ? 'var(--accent)' : 'var(--border)'}`,
                    background: s === r.status ? 'var(--accent)' : 'transparent',
                    color: s === r.status ? 'var(--on-accent)' : 'var(--text)',
                    fontWeight: 600,
                  }}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <label htmlFor={`notes-${r.id}`} style={{ display: 'block', fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>Your notes from the call</label>
            <textarea
              id={`notes-${r.id}`}
              value={notes}
              maxLength={5000}
              rows={4}
              onChange={e => setNotes(e.target.value)}
              placeholder="Quote given, walk through date, anything to remember."
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: 12, color: 'var(--text)', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
              <button
                onClick={() => save({ vendorNotes: notes.trim() ? notes : null })}
                disabled={saving || (notes.trim() || null) === (r.vendorNotes?.trim() || null)}
                className="btn btn-primary"
              >
                {saving ? 'Saving...' : 'Save notes'}
              </button>
              {msg && <span style={{ fontSize: 13, color: msg === 'Saved.' ? 'var(--muted)' : '#fca5a5' }}>{msg}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Info({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'md:col-span-2' : undefined}>
      <p style={{ fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>{label}</p>
      <div style={{ fontSize: 14, color: 'var(--text)', whiteSpace: 'pre-line' }}>{children}</div>
    </div>
  )
}
