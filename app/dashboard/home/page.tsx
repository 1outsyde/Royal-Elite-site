'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import Link from 'next/link'
import { DEFAULT_CONTENT, LIMITS, mergeSiteConfig, resolveContent, type Content, type PackTable, type PriceCard } from '@/lib/siteContent'

function authHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem('outsyde_access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

const input: CSSProperties = {
  width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px',
  color: 'var(--text)', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit',
}
const small: CSSProperties = { fontSize: 12, color: 'var(--muted)', marginTop: 4 }
const card: CSSProperties = { border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }

// Dashboard > Home page: the words and prices on Royal Elite's site (Legend 2026-11-10). Layout, colors
// and fonts stay fixed; photos are on Settings, cities on Service areas. Saved on the Outsyde account
// (siteConfig.content) and shown on the site right away. A blank field shows the original text.
export default function HomeContentPage() {
  const [form, setForm] = useState<Content>(DEFAULT_CONTENT)
  const [siteConfig, setSiteConfig] = useState<Record<string, unknown> | null>(null)
  const [saved, setSaved] = useState<string>(JSON.stringify(DEFAULT_CONTENT))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  useEffect(() => {
    fetch('/api/admin/business', { headers: authHeaders(), cache: 'no-store' })
      .then(async r => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Could not load your home page.')
        const biz = data.business ?? data
        const sc = biz?.siteConfig && typeof biz.siteConfig === 'object' ? biz.siteConfig : null
        const c = resolveContent(sc?.content)
        setSiteConfig(sc)
        setForm(c)
        setSaved(JSON.stringify(c))
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Could not load your home page.'))
      .finally(() => setLoading(false))
  }, [])

  const dirty = JSON.stringify(form) !== saved

  function set<K extends keyof Content>(key: K, value: Content[K]) {
    setForm(f => ({ ...f, [key]: value }))
    setOk(false)
  }

  async function save() {
    setSaving(true)
    setError(null)
    setOk(false)
    try {
      const next = mergeSiteConfig(siteConfig, form)
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ siteConfig: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data?.error === 'string' ? data.error : 'Could not save. Please try again.')
      const sc = data.business?.siteConfig && typeof data.business.siteConfig === 'object' ? data.business.siteConfig : next
      const c = resolveContent(sc.content)
      setSiteConfig(sc)
      setForm(c)
      setSaved(JSON.stringify(c))
      setOk(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>Loading...</p>

  return (
    <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 22, paddingBottom: 90 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 34, color: 'var(--text)', marginBottom: 6 }}>Home page</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Change the words and prices on your site. Each field says where it shows. Leave a field empty to bring back the original text.
          Your cities are on <Link href="/dashboard/areas" style={{ color: 'var(--accent-hover)' }}>Service areas</Link>, and your photos and logo on <Link href="/dashboard/settings" style={{ color: 'var(--accent-hover)' }}>Settings</Link>.
        </p>
      </div>

      <Section title="Top of the page">
        <Field id="region" label="Service region" where="Above the headline and in the footer" value={form.region} max={LIMITS.short} onChange={v => set('region', v)} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field id="headline" label="Headline" where="Big headline" value={form.headline} max={LIMITS.short} onChange={v => set('headline', v)} />
          <Field id="headlineAccent" label="Headline gold word" where="End of the headline, in gold" value={form.headlineAccent} max={LIMITS.short} onChange={v => set('headlineAccent', v)} />
        </div>
        <Field id="tagline" label="Tagline" where="Under the headline and in the footer" value={form.tagline} max={LIMITS.medium} onChange={v => set('tagline', v)} />
        <Field id="heroText" label="Intro" where="Under the tagline" value={form.heroText} max={LIMITS.long} long onChange={v => set('heroText', v)} />
        <Field id="phone" label="Phone number" where="Call button, estimate box and footer" value={form.phone} max={LIMITS.short} onChange={v => set('phone', v)} />
        <div>
          <p style={{ fontSize: 13, color: 'var(--text)', marginBottom: 6 }}>Strip under the photo (4 short lines)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {form.trust.map((t, i) => (
              <input key={i} id={`trust-${i}`} aria-label={`Strip item ${i + 1}`} value={t} maxLength={LIMITS.short} style={input}
                onChange={e => set('trust', form.trust.map((x, n) => (n === i ? e.target.value : x)))} />
            ))}
          </div>
        </div>
      </Section>

      <Section title="Services and service areas">
        <div>
          <label htmlFor="servicesOffered" style={{ fontSize: 13, color: 'var(--text)' }}>Services offered (one per line)</label>
          <textarea id="servicesOffered" rows={7} style={{ ...input, marginTop: 6 }}
            value={form.servicesOffered.join('\n')}
            onChange={e => set('servicesOffered', e.target.value.split('\n'))} />
          <p style={small}>Shows in: the Services offered list. Up to {LIMITS.listItems} lines.</p>
        </div>
        <Field id="longDistanceLine" label="Line under your cities" where="Service areas list, after your cities" value={form.longDistanceLine} max={LIMITS.short} onChange={v => set('longDistanceLine', v)} />
      </Section>

      <Section title="Standard moving services">
        <Field id="standardEyebrow" label="Small heading" where="Above Standard moving services" value={form.standardEyebrow} max={LIMITS.short} onChange={v => set('standardEyebrow', v)} />
        <PriceCardFields id="standardWeekday" heading="Card 1" value={form.standardWeekday} onChange={v => set('standardWeekday', v)} />
        <PriceCardFields id="standardWeekend" heading="Card 2" value={form.standardWeekend} onChange={v => set('standardWeekend', v)} />
        <PriceCardFields id="light" heading="Card 3" value={form.light} onChange={v => set('light', v)} />
        <Field id="surchargeNote" label="Extra charges note" where="Under the three cards" value={form.surchargeNote} max={LIMITS.long} long onChange={v => set('surchargeNote', v)} />
      </Section>

      <Section title="Packing services">
        <Field id="packingEyebrow" label="Small heading" where="Above Packing services" value={form.packingEyebrow} max={LIMITS.short} onChange={v => set('packingEyebrow', v)} />
        <PackFields id="simplePack" value={form.simplePack} onChange={v => set('simplePack', v)} />
        <PackFields id="fullPack" value={form.fullPack} onChange={v => set('fullPack', v)} />
      </Section>

      <Section title="Long distance moves">
        <Field id="longDistanceEyebrow" label="Small heading" where="Above Long distance moves" value={form.longDistanceEyebrow} max={LIMITS.short} onChange={v => set('longDistanceEyebrow', v)} />
        <Rows id="longDistance" rows={form.longDistance.rows} onChange={rows => set('longDistance', { rows })} />
        <Field id="longDistanceNote" label="Note" where="Under the long distance prices" value={form.longDistanceNote} max={LIMITS.long} long onChange={v => set('longDistanceNote', v)} />
      </Section>

      <Section title="Estimate and policies">
        <Field id="noticeLine" label="Estimate line" where="Under Request your free estimate" value={form.noticeLine} max={LIMITS.medium} onChange={v => set('noticeLine', v)} />
        <Field id="policyBooking" label="Booking and notice" where="Policies, first card" value={form.policies.booking} max={LIMITS.long} long onChange={v => set('policies', { ...form.policies, booking: v })} />
        <Field id="policyDeposit" label="Deposit and payment" where="Policies, second card" value={form.policies.deposit} max={LIMITS.long} long onChange={v => set('policies', { ...form.policies, deposit: v })} />
        <Field id="policyCare" label="Care and cancellation" where="Policies, third card" value={form.policies.care} max={LIMITS.long} long onChange={v => set('policies', { ...form.policies, care: v })} />
      </Section>

      <div style={{ position: 'sticky', bottom: 0, background: 'var(--bg, var(--base))', borderTop: '1px solid var(--border)', padding: '14px 0', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={save} disabled={saving || !dirty} className="btn btn-primary">{saving ? 'Saving...' : 'Save home page'}</button>
        {error && <span role="alert" style={{ color: '#fca5a5', fontSize: 14 }}>{error}</span>}
        {ok && <span style={{ color: 'var(--muted)', fontSize: 14 }}>Saved. Your site is updated.</span>}
        {!ok && !error && dirty && <span style={{ color: 'var(--muted)', fontSize: 14 }}>You have unsaved changes.</span>}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={card}>
      <h2 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '.12em', color: 'var(--muted)', textTransform: 'uppercase' }}>{title}</h2>
      {children}
    </section>
  )
}

function Field({ id, label, where, value, max, long, onChange }: { id: string; label: string; where?: string; value: string; max: number; long?: boolean; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} style={{ fontSize: 13, color: 'var(--text)' }}>{label}</label>
      {long ? (
        <textarea id={id} rows={3} maxLength={max} value={value} onChange={e => onChange(e.target.value)} style={{ ...input, marginTop: 6 }} />
      ) : (
        <input id={id} maxLength={max} value={value} onChange={e => onChange(e.target.value)} style={{ ...input, marginTop: 6 }} />
      )}
      {where && <p style={small}>Shows in: {where}</p>}
    </div>
  )
}

function PriceCardFields({ id, heading, value, onChange }: { id: string; heading: string; value: PriceCard; onChange: (v: PriceCard) => void }) {
  const f = (k: keyof PriceCard) => (v: string) => onChange({ ...value, [k]: v })
  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 13, color: 'var(--accent-hover)' }}>{heading}: {value.title}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field id={`${id}-title`} label="Name" value={value.title} max={LIMITS.short} onChange={f('title')} />
        <Field id={`${id}-price`} label="Price" value={value.price} max={LIMITS.short} onChange={f('price')} />
        <Field id={`${id}-unit`} label="Per" value={value.unit} max={LIMITS.short} onChange={f('unit')} />
      </div>
      <Field id={`${id}-tag`} label="Small line above the name" value={value.tag} max={LIMITS.short} onChange={f('tag')} />
      <Field id={`${id}-sub`} label="First line" value={value.sub} max={LIMITS.medium} onChange={f('sub')} />
      <Field id={`${id}-body`} label="Description" value={value.body} max={LIMITS.medium} long onChange={f('body')} />
      <Field id={`${id}-extra`} label="Gold line at the bottom" value={value.extra} max={LIMITS.short} onChange={f('extra')} />
    </div>
  )
}

function PackFields({ id, value, onChange }: { id: string; value: PackTable; onChange: (v: PackTable) => void }) {
  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 13, color: 'var(--accent-hover)' }}>{value.title}</p>
      <Field id={`${id}-title`} label="Name" value={value.title} max={LIMITS.short} onChange={v => onChange({ ...value, title: v })} />
      <Field id={`${id}-note`} label="Description" value={value.note} max={LIMITS.medium} onChange={v => onChange({ ...value, note: v })} />
      <Rows id={id} rows={value.rows} onChange={rows => onChange({ ...value, rows })} />
      <Field id={`${id}-foot`} label="Line under the prices" value={value.foot} max={LIMITS.medium} onChange={v => onChange({ ...value, foot: v })} />
    </div>
  )
}

function Rows({ id, rows, onChange }: { id: string; rows: { size: string; price: string }[]; onChange: (rows: { size: string; price: string }[]) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 140px', gap: 8 }}>
          <input id={`${id}-size-${i}`} aria-label={`Row ${i + 1} name`} value={r.size} maxLength={LIMITS.short} style={input}
            onChange={e => onChange(rows.map((x, n) => (n === i ? { ...x, size: e.target.value } : x)))} />
          <input id={`${id}-price-${i}`} aria-label={`Row ${i + 1} price`} value={r.price} maxLength={LIMITS.short} style={input}
            onChange={e => onChange(rows.map((x, n) => (n === i ? { ...x, price: e.target.value } : x)))} />
        </div>
      ))}
    </div>
  )
}
