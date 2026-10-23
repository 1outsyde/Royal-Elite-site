'use client'

import { useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { VENDOR_CONFIG } from '@/lib/config'
import {
  FALLBACK_MOVE_TYPES, FLOORS, HOME_SIZES, earliestMoveDate, formatDollars, planOfferedIn, planPriceCents,
  type Plan,
} from '@/lib/estimates'

type Props = {
  cities: string[]
  plans: Plan[]
}

const field: CSSProperties = {
  width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px 14px',
  color: 'var(--text)', fontSize: '1rem', outline: 'none', borderRadius: 4, boxSizing: 'border-box',
}
const label: CSSProperties = {
  display: 'block', fontSize: '0.68rem', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8,
}

export default function EstimateForm({ cities, plans }: Props) {
  const { user, isLoading } = useAuth()
  const [city, setCity] = useState('')
  const [planId, setPlanId] = useState('')
  const [moveType, setMoveType] = useState(FALLBACK_MOVE_TYPES[0])
  // null = not touched yet, so the signed in account's name and email show (the customer can change them).
  const [nameInput, setName] = useState<string | null>(null)
  const [emailInput, setEmail] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [moveDate, setMoveDate] = useState('')
  const [homeSize, setHomeSize] = useState(HOME_SIZES[1])
  const [fromAddress, setFromAddress] = useState('')
  const [toAddress, setToAddress] = useState('')
  const [floor, setFloor] = useState(FLOORS[0])
  const [stops, setStops] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const cityPlans = useMemo(() => (city ? plans.filter(p => planOfferedIn(p, city)) : []), [plans, city])
  const usePlans = plans.length > 0

  // A plan picked for another city no longer counts once the city changes.
  const chosenPlanId = cityPlans.some(p => p.id === planId) ? planId : ''
  const name = nameInput ?? (user ? [user.firstName, user.lastName].filter(Boolean).join(' ') : '')
  const email = emailInput ?? user?.email ?? ''

  if (isLoading) return null

  if (!user) {
    return (
      <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 8, padding: '32px 24px', textAlign: 'center' }}>
        <p className="text-body-md" style={{ color: 'var(--text)', marginBottom: 8 }}>
          Sign in or create a free account to request your estimate.
        </p>
        <p className="text-body-sm" style={{ color: 'var(--muted)', marginBottom: 24 }}>
          Your Outsyde account works here, on goutsyde.com and in the Outsyde app.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/login?redirect=/%23estimate" className="btn btn-primary">Sign in</Link>
          <Link href="/register" className="btn btn-secondary">Create account</Link>
        </div>
        <p className="text-body-sm" style={{ color: 'var(--muted)', marginTop: 24 }}>
          Prefer to talk? Call <a href={VENDOR_CONFIG.phoneHref} className="link">{VENDOR_CONFIG.phone}</a>.
        </p>
      </div>
    )
  }

  if (status === 'ok') {
    return (
      <div style={{ border: '1px solid var(--accent)', background: 'var(--accent-soft)', borderRadius: 8, padding: '32px 24px', textAlign: 'center' }}>
        <p className="font-display" style={{ fontSize: 28, color: 'var(--text)', marginBottom: 10 }}>Request received.</p>
        <p className="text-body-md" style={{ color: 'var(--muted)' }}>
          Royal Elite Moving will call you within 24 to 48 hours to confirm the details and give you your estimate.
        </p>
      </div>
    )
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    setMessage('')
    const plan = plans.find(p => p.id === chosenPlanId)
    const details: Record<string, string> = {
      homeSize, fromAddress, toAddress, floor, stops, notes,
      ...(usePlans ? {} : { moveType }),
    }
    let token: string | null = null
    try { token = localStorage.getItem('outsyde_access_token') } catch { token = null }
    try {
      const res = await fetch('/api/estimate-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          serviceId: plan ? plan.id : null,
          city, name, email, phone,
          preferredDate: moveDate || null,
          details,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setStatus('ok')
        return
      }
      setStatus('error')
      setMessage(typeof data?.message === 'string' ? data.message : `Something went wrong. Please try again or call ${VENDOR_CONFIG.phone}.`)
    } catch {
      setStatus('error')
      setMessage(`Something went wrong. Please try again or call ${VENDOR_CONFIG.phone}.`)
    }
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div>
        <label style={label} htmlFor="est-city">Your city</label>
        <select id="est-city" required value={city} onChange={e => setCity(e.target.value)} style={field}>
          <option value="" disabled>Choose your city</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {usePlans ? (
        <div>
          <label style={label} htmlFor="est-plan">Service</label>
          <select id="est-plan" required value={chosenPlanId} onChange={e => setPlanId(e.target.value)} style={field} disabled={!city}>
            <option value="" disabled>{city ? (cityPlans.length ? 'Choose a service' : 'No services in this city yet') : 'Choose your city first'}</option>
            {cityPlans.map(p => {
              const cents = planPriceCents(p)
              return <option key={p.id} value={p.id}>{p.name}{cents ? `, from ${formatDollars(cents)}` : ''}</option>
            })}
          </select>
        </div>
      ) : (
        <div>
          <label style={label} htmlFor="est-type">Move type</label>
          <select id="est-type" value={moveType} onChange={e => setMoveType(e.target.value)} style={field}>
            {FALLBACK_MOVE_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}

      <div>
        <label style={label} htmlFor="est-name">Full name</label>
        <input id="est-name" required maxLength={120} value={name} onChange={e => setName(e.target.value)} autoComplete="name" style={field} />
      </div>
      <div>
        <label style={label} htmlFor="est-phone">Phone</label>
        <input id="est-phone" type="tel" required minLength={7} maxLength={40} value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" style={field} />
      </div>
      <div>
        <label style={label} htmlFor="est-email">Email</label>
        <input id="est-email" type="email" required maxLength={200} value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" style={field} />
      </div>
      <div>
        <label style={label} htmlFor="est-date">Preferred move date</label>
        <input id="est-date" type="date" required min={earliestMoveDate()} value={moveDate} onChange={e => setMoveDate(e.target.value)} style={field} />
      </div>
      <div>
        <label style={label} htmlFor="est-size">Home size</label>
        <select id="est-size" value={homeSize} onChange={e => setHomeSize(e.target.value)} style={field}>
          {HOME_SIZES.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
      </div>
      <div>
        <label style={label} htmlFor="est-floor">Floor (pickup or drop off)</label>
        <select id="est-floor" value={floor} onChange={e => setFloor(e.target.value)} style={field}>
          {FLOORS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      <div className="md:col-span-2">
        <label style={label} htmlFor="est-from">Pickup address</label>
        <input id="est-from" required maxLength={300} value={fromAddress} onChange={e => setFromAddress(e.target.value)} autoComplete="street-address" style={field} />
      </div>
      <div className="md:col-span-2">
        <label style={label} htmlFor="est-to">Drop off address</label>
        <input id="est-to" required maxLength={300} value={toAddress} onChange={e => setToAddress(e.target.value)} style={field} />
      </div>
      <div className="md:col-span-2">
        <label style={label} htmlFor="est-stops">Additional stops</label>
        <input id="est-stops" maxLength={300} value={stops} onChange={e => setStops(e.target.value)} placeholder="Optional" style={field} />
      </div>
      <div className="md:col-span-2">
        <label style={label} htmlFor="est-notes">Notes or special items</label>
        <textarea id="est-notes" maxLength={2000} rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Heavy items, stairs, fragile pieces, timing, and anything else we should know." style={{ ...field, resize: 'vertical' }} />
      </div>

      {status === 'error' && (
        <div className="md:col-span-2" role="alert" style={{ padding: '12px 16px', border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', fontSize: '0.9rem', borderRadius: 4 }}>
          {message}
        </div>
      )}

      <div className="md:col-span-2 flex flex-col gap-3">
        <button type="submit" className="btn btn-primary" disabled={status === 'sending'} style={{ width: '100%' }}>
          {status === 'sending' ? 'Sending...' : 'Request free estimate'}
        </button>
        <p className="text-body-xs" style={{ color: 'var(--muted)', textAlign: 'center' }}>
          No payment is taken on this form. We call you back within 24 to 48 hours to confirm the details and your estimate.
        </p>
      </div>
    </form>
  )
}
