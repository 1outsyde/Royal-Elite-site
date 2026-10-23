'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { STATUS_LABEL, type EstimateStatus } from '@/lib/estimates'

interface Req {
  id: string
  status: EstimateStatus
  customerName: string
  serviceName: string | null
  city: string | null
  preferredDate: string | null
  details: Record<string, string>
  createdAt: string
}

interface PlanRow { id: string; status: string }

function authHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem('outsyde_access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

export default function DashboardOverview() {
  const [requests, setRequests] = useState<Req[] | null>(null)
  const [plans, setPlans] = useState<PlanRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/estimate-requests', { headers: authHeaders(), cache: 'no-store' })
      .then(async r => {
        const d = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(typeof d?.error === 'string' ? d.error : 'Could not load estimate requests.')
        setRequests(Array.isArray(d.requests) ? d.requests : [])
      })
      .catch(e => { setError(e instanceof Error ? e.message : 'Could not load estimate requests.'); setRequests([]) })
    fetch('/api/admin/services', { headers: authHeaders(), cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { services: [] }))
      .then(d => setPlans(Array.isArray(d.services) ? d.services : []))
      .catch(() => setPlans([]))
  }, [])

  const count = (s: EstimateStatus) => (requests ?? []).filter(r => r.status === s).length
  const livePlans = (plans ?? []).filter(p => p.status === 'live').length

  return (
    <div style={{ maxWidth: 980 }}>
      <h1 className="font-display" style={{ fontSize: 34, color: 'var(--text)', marginBottom: 24 }}>Overview</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ marginBottom: 28 }}>
        <Stat label="New requests" value={requests ? count('new') : null} highlight />
        <Stat label="Called" value={requests ? count('called') : null} />
        <Stat label="Quoted" value={requests ? count('quoted') : null} />
        <Stat label="Live plans" value={plans ? livePlans : null} />
      </div>

      {error && <p role="alert" style={{ color: '#fca5a5', marginBottom: 16 }}>{error}</p>}

      <div style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.12em', color: 'var(--muted)' }}>LATEST REQUESTS</span>
          <Link href="/dashboard/estimates" style={{ fontSize: 13, color: 'var(--accent-hover)' }}>See all</Link>
        </div>
        {requests === null ? (
          <p style={{ padding: 18, color: 'var(--muted)' }}>Loading...</p>
        ) : requests.length === 0 ? (
          <p style={{ padding: 18, color: 'var(--muted)' }}>No estimate requests yet.</p>
        ) : (
          requests.slice(0, 5).map(r => (
            <Link key={r.id} href="/dashboard/estimates" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '12px 18px', borderBottom: '1px solid var(--border)', color: 'var(--text)', textDecoration: 'none' }}>
              <span style={{ fontWeight: 600 }}>{r.customerName}</span>
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>{[r.serviceName ?? r.details?.moveType, r.city].filter(Boolean).join(', ')}</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: r.status === 'new' ? 'var(--accent-hover)' : 'var(--muted)' }}>{STATUS_LABEL[r.status] ?? r.status}</span>
            </Link>
          ))
        )}
      </div>

      {plans !== null && livePlans === 0 && (
        <p style={{ marginTop: 20, fontSize: 14, color: 'var(--muted)' }}>
          You have no live plans yet, so your site shows your standard price list. Add and publish plans on the <Link href="/dashboard/services" style={{ color: 'var(--accent-hover)' }}>Plans</Link> page. Publishing needs an active Outsyde plan and payouts set up.
        </p>
      )}
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: number | null; highlight?: boolean }) {
  return (
    <div style={{ padding: 18, borderRadius: 8, border: `1px solid ${highlight ? 'var(--accent)' : 'var(--border)'}`, background: highlight ? 'var(--accent-soft)' : 'var(--surface)' }}>
      <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--text)' }}>{value === null ? '...' : value}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, letterSpacing: '.06em' }}>{label}</div>
    </div>
  )
}
