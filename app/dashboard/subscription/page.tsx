'use client'

import { useEffect, useState } from 'react'
import { describePlan, PLAN_BADGE } from '@/lib/planState'

interface Subscription {
  planName?: string
  plan_name?: string
  status?: string
  price?: number
  price_cents?: number
  renewalDate?: string
  renewal_date?: string
  nextBillingDate?: string
  next_billing_date?: string
}

const TIERS = [
  { name: 'Starter', price: 29, description: 'Perfect for new vendors getting started' },
  { name: 'Growth', price: 59, description: 'For growing businesses with more volume' },
  { name: 'Pro', price: 99, description: 'Unlimited everything for established brands' },
]

function resolveSubscription(raw: Record<string, unknown>) {
  return {
    planName: String(raw.planName ?? raw.plan_name ?? raw.tierDisplayName ?? raw.tierName ?? 'Unknown'),
    status: String(raw.status ?? 'unknown'),
    priceCents: Number(raw.price ?? raw.price_cents ?? raw.priceInCents ?? 0),
    renewalDate: String(raw.renewalDate ?? raw.renewal_date ?? raw.nextBillingDate ?? raw.next_billing_date ?? raw.currentPeriodEnd ?? ''),
    plan: describePlan(raw),
  }
}

export default function SubscriptionPage() {
  const [sub, setSub] = useState<ReturnType<typeof resolveSubscription> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/subscription')
        if (!res.ok) throw new Error()
        const data = await res.json()
        // API returns { subscription: { ... } }; unwrap one level if present
        const payload = data?.subscription ?? data
        setSub(resolveSubscription(payload))
      } catch {
        setError('Could not load subscription details.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const plan = sub?.plan ?? null
  const badge = plan ? PLAN_BADGE[plan.kind] : PLAN_BADGE.other
  const renewalDisplay = sub?.renewalDate
    ? new Date(sub.renewalDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div>
      <div className="mb-8">
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 38, fontWeight: 600, color: 'var(--text)', margin: 0, lineHeight: 1 }}>Subscription</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 6 }}>Manage your Outsyde plan</p>
      </div>

      {/* Current plan */}
      <div className="rounded-2xl p-6 mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--accent-glow)' }}>
        <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>CURRENT PLAN</div>
        {loading ? (
          <div style={{ height: 36, width: 160, borderRadius: 6, background: 'var(--surface-2)' }} />
        ) : error ? (
          <p style={{ color: '#FCA5A5', fontSize: 14 }}>{error}</p>
        ) : sub ? (
          <div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 30, fontWeight: 600, color: 'var(--text)' }}>
                {sub.planName}
              </span>
              <span style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 12, fontWeight: 700,
                background: badge.bg,
                color: badge.color,
              }}>
                {plan?.label}
              </span>
            </div>
            {sub.priceCents > 0 && (
              <div style={{ fontSize: 15, color: 'var(--muted)', marginTop: 8 }}>
                ${(sub.priceCents / 100).toFixed(2)}/month
              </div>
            )}
            {plan?.note && (
              <p style={{ fontSize: 13, color: plan.kind === 'paused' ? '#991B1B' : '#92400E', marginTop: 8, lineHeight: 1.5 }}>
                {plan.note}
              </p>
            )}
            {renewalDisplay && plan?.showRenewal && (
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                Renews {renewalDisplay}
              </div>
            )}
          </div>
        ) : null}

        <button
          onClick={() => window.open('https://www.goutsyde.com/subscription/manage', '_blank')}
          style={{ marginTop: 20, fontSize: 13, padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: 'var(--on-accent)', fontWeight: 600, cursor: 'pointer' }}
        >
          Manage Plan →
        </button>
      </div>

      {/* Available tiers */}
      <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 12 }}>AVAILABLE PLANS</div>
      <div className="grid gap-3">
        {TIERS.map(tier => {
          const isCurrent = sub?.planName?.toLowerCase().includes(tier.name.toLowerCase())
          return (
            <div
              key={tier.name}
              className="flex items-center gap-4 px-5 py-4 rounded-2xl"
              style={{
                background: 'var(--surface)',
                border: `1px solid ${isCurrent ? 'var(--accent)' : 'var(--border)'}`,
                boxShadow: isCurrent ? '0 0 24px var(--accent-soft)' : 'none',
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{tier.name}</span>
                  {isCurrent && (
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--accent)', color: 'var(--on-accent)', fontWeight: 700 }}>
                      Current
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>{tier.description}</div>
              </div>
              <div style={{ fontSize: 20, fontFamily: 'Cormorant Garamond, serif', fontWeight: 600, color: 'var(--accent)', flexShrink: 0 }}>
                ${tier.price}<span style={{ fontSize: 13, color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif', fontWeight: 400 }}>/mo</span>
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 20 }}>
        To upgrade or downgrade your plan, visit{' '}
        <a href="https://www.goutsyde.com/subscription/manage" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
          goutsyde.com/subscription/manage
        </a>
      </p>
    </div>
  )
}
