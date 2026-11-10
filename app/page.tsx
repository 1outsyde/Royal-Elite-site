'use client'

import { useEffect, useState } from 'react'
import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import CoverVideo from '@/components/ui/CoverVideo'
import EstimateForm from '@/components/sections/EstimateForm'
import { BRAND_HERO_PATH, isOwnBrandHero } from '@/lib/brand'
import { FALLBACK_CITIES, formatDollars, planPriceCents, type Plan } from '@/lib/estimates'
import { phoneHref, type Content, type PriceCard as PriceCardContent } from '@/lib/siteContent'
import { useSiteContent } from '@/lib/useSiteContent'

// Royal Elite Moving homepage. Plans and cities come from Benny's Outsyde account (edited in his
// dashboard). Words and prices come from Dashboard > Home page (siteConfig.content, lib/siteContent.ts),
// falling back to the text the site shipped with.

export default function HomePage() {
  const [cover, setCover] = useState<string | null>(null)
  const [coverType, setCoverType] = useState<'image' | 'video'>('image')
  const [coverPoster, setCoverPoster] = useState<string | null>(null)
  const [coverFailed, setCoverFailed] = useState(false)
  const [cities, setCities] = useState<string[]>(FALLBACK_CITIES)
  const [plans, setPlans] = useState<Plan[]>([])
  const c = useSiteContent()

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller

    fetch('/api/bookings/business', { signal })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        const biz = data?.business ?? data
        if (!biz) return
        const c = biz.coverImage ?? biz.cover_image ?? null
        setCover(isOwnBrandHero(c) ? null : c)
        setCoverType((biz.coverMediaType ?? biz.cover_media_type) === 'video' ? 'video' : 'image')
        setCoverPoster(biz.coverPosterUrl ?? null)
        const list = Array.isArray(biz.serviceCities) ? biz.serviceCities.filter((x: unknown) => typeof x === 'string' && x.trim()) : []
        if (list.length) setCities(list)
      })
      .catch(() => {})

    fetch('/api/bookings/services', { signal })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        const list: Plan[] = Array.isArray(data?.services) ? data.services : []
        // Public list is live + active only. Royal Elite plans are request only.
        setPlans(list.filter(p => p.isActive !== false && p.status === 'live' && p.requestOnly === true))
      })
      .catch(() => {})

    const t = setTimeout(() => controller.abort(), 15000)
    return () => { controller.abort(); clearTimeout(t) }
  }, [])

  return (
    <div className="bg-base text-ink">
      <Nav />
      <Hero c={c} cover={coverFailed ? null : cover} coverType={coverType} coverPoster={coverPoster} onFail={() => setCoverFailed(true)} />
      <TrustStrip c={c} />
      <Areas c={c} cities={cities} />
      {plans.length > 0 ? <LivePlans plans={plans} /> : <StaticPricing c={c} />}
      <section id="estimate" className="py-section-md border-t border-line" style={{ background: 'var(--surface)' }}>
        <div className="section-container" style={{ maxWidth: 820 }}>
          <div className="text-center mb-10">
            <p className="eyebrow">Free estimate</p>
            <h2 className="font-display text-display-md md:text-display-lg text-white mt-3">Request your free estimate</h2>
            <p className="text-body-md text-muted mt-3">{c.noticeLine}</p>
          </div>
          <EstimateForm cities={cities} plans={plans} />
        </div>
      </section>
      <Policies c={c} />
      <Footer />
    </div>
  )
}

function Hero({ c, cover, coverType, coverPoster, onFail }: { c: Content; cover: string | null; coverType: 'image' | 'video'; coverPoster: string | null; onFail: () => void }) {
  const fallback = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={BRAND_HERO_PATH} alt="" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
  )
  return (
    <section className="relative overflow-hidden" style={{ minHeight: '78vh', display: 'flex', alignItems: 'center' }}>
      {coverType === 'video' && cover ? (
        <CoverVideo src={cover} poster={coverPoster} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} processing={fallback} />
      ) : cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="Royal Elite Moving" onError={onFail} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : fallback}
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(30,14,51,.72) 0%, rgba(42,18,71,.78) 55%, rgba(30,14,51,.96) 100%)' }} />
      <div className="section-container relative text-center" style={{ padding: '96px 0 80px' }}>
        <p className="eyebrow">{c.region}</p>
        <h1 className="font-display text-white mt-5" style={{ fontSize: 'clamp(40px, 7vw, 80px)', lineHeight: 1.03, fontWeight: 700 }}>
          {c.headline} <em style={{ color: 'var(--accent-hover)' }}>{c.headlineAccent}</em>
        </h1>
        <p className="font-display mt-3" style={{ fontStyle: 'italic', fontSize: 'clamp(18px, 2.4vw, 24px)', color: 'var(--accent-hover)' }}>{c.tagline}</p>
        <p className="text-body-md text-muted mx-auto mt-5" style={{ maxWidth: 560 }}>
          {c.heroText}
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          <a href="#estimate" className="btn btn-primary">Get a free estimate</a>
          <a href={phoneHref(c.phone)} className="btn btn-secondary">Call {c.phone}</a>
        </div>
      </div>
    </section>
  )
}

function TrustStrip({ c }: { c: Content }) {
  const items = c.trust
  return (
    <div className="border-y border-line" style={{ background: 'var(--surface)' }}>
      <div className="section-container grid grid-cols-2 md:grid-cols-4 gap-4 py-6 text-center">
        {items.map((i, n) => <span key={n} className="text-body-sm text-muted" style={{ letterSpacing: '.04em' }}>{i}</span>)}
      </div>
    </div>
  )
}

function Areas({ c, cities }: { c: Content; cities: string[] }) {
  const services = c.servicesOffered
  return (
    <section id="areas" className="py-section-md">
      <div className="section-container grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <p className="eyebrow">What we do</p>
          <h2 className="font-display text-display-sm text-white mt-3 mb-5">Services offered</h2>
          <ul className="flex flex-col gap-3">
            {services.map((s, n) => <li key={n} className="text-body-md text-muted">{s}</li>)}
          </ul>
        </div>
        <div>
          <p className="eyebrow">Where we go</p>
          <h2 className="font-display text-display-sm text-white mt-3 mb-5">Service areas</h2>
          <ul className="flex flex-col gap-3">
            {cities.map(c => <li key={c} className="text-body-md text-muted">{c}</li>)}
            <li className="text-body-md text-muted">{c.longDistanceLine}</li>
          </ul>
        </div>
      </div>
    </section>
  )
}

function LivePlans({ plans }: { plans: Plan[] }) {
  return (
    <section id="services" className="py-section-md border-t border-line">
      <div className="section-container">
        <div className="text-center mb-10">
          <p className="eyebrow">Services and pricing</p>
          <h2 className="font-display text-display-md text-white mt-3">Our moving plans</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(p => {
            const cents = planPriceCents(p)
            const where = (p.serviceCities ?? []).length ? (p.serviceCities ?? []).join(', ') : 'All service areas'
            return (
              <article key={p.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {p.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.imageUrl} alt={p.name} style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover' }} />
                ) : null}
                <div style={{ padding: 24 }}>
                  <h3 className="font-display text-white" style={{ fontSize: 26 }}>{p.name}</h3>
                  {cents ? <p className="mt-2" style={{ color: 'var(--accent-hover)', fontSize: 22, fontWeight: 600 }}>From {formatDollars(cents)}</p> : null}
                  {p.description ? <p className="text-body-sm text-muted mt-3" style={{ whiteSpace: 'pre-line' }}>{p.description}</p> : null}
                  <p className="text-body-xs mt-4" style={{ color: 'var(--muted)', letterSpacing: '.08em', textTransform: 'uppercase' }}>{where}</p>
                  <a href="#estimate" className="btn btn-secondary mt-5" style={{ width: '100%' }}>Request estimate</a>
                </div>
              </article>
            )
          })}
        </div>
        <p className="text-body-sm text-muted text-center mt-8">Prices are starting points. Your final estimate is confirmed on the call back.</p>
      </div>
    </section>
  )
}

// Benny's price list from Dashboard > Home page, shown until he has live plans (after Stripe).
function StaticPricing({ c }: { c: Content }) {
  return (
    <section id="services" className="py-section-md border-t border-line">
      <div className="section-container flex flex-col gap-14">
        <div>
          <div className="text-center mb-8">
            <p className="eyebrow">{c.standardEyebrow}</p>
            <h2 className="font-display text-display-md text-white mt-3">Standard moving services</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PriceCard {...c.standardWeekday} />
            <PriceCard {...c.standardWeekend} />
            <PriceCard {...c.light} />
          </div>
          <p className="text-body-sm text-muted text-center mt-6">{c.surchargeNote}</p>
        </div>

        <div>
          <div className="text-center mb-8">
            <p className="eyebrow">{c.packingEyebrow}</p>
            <h2 className="font-display text-display-md text-white mt-3">Packing services</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PackTable title={c.simplePack.title} note={c.simplePack.note} rows={c.simplePack.rows.map(r => [r.size, r.price] as [string, string])} foot={c.simplePack.foot} />
            <PackTable title={c.fullPack.title} note={c.fullPack.note} rows={c.fullPack.rows.map(r => [r.size, r.price] as [string, string])} foot={c.fullPack.foot} />
          </div>
        </div>

        <div>
          <div className="text-center mb-8">
            <p className="eyebrow">{c.longDistanceEyebrow}</p>
            <h2 className="font-display text-display-md text-white mt-3">Long distance moves</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {c.longDistance.rows.map(({ size, price }, n) => (
              <div key={n} className="card text-center" style={{ padding: 28 }}>
                <p className="text-body-sm text-muted" style={{ letterSpacing: '.12em', textTransform: 'uppercase' }}>{size}</p>
                <p className="text-body-xs text-muted mt-3">Starting at</p>
                <p className="font-display mt-1" style={{ fontSize: 40, color: 'var(--accent-hover)' }}>{price}</p>
              </div>
            ))}
          </div>
          <p className="text-body-sm text-muted text-center mt-6">{c.longDistanceNote}</p>
        </div>
      </div>
    </section>
  )
}

function PriceCard(p: PriceCardContent) {
  return (
    <div className="card" style={{ padding: 28 }}>
      <p className="text-body-xs" style={{ color: 'var(--accent-hover)', letterSpacing: '.14em', textTransform: 'uppercase' }}>{p.tag}</p>
      <h3 className="font-display text-white mt-3" style={{ fontSize: 28 }}>{p.title}</h3>
      <p className="mt-2" style={{ fontSize: 34, fontWeight: 600, color: 'var(--text)' }}>{p.price}<span className="text-body-sm text-muted"> / {p.unit}</span></p>
      <p className="text-body-sm mt-3" style={{ color: 'var(--text)' }}>{p.sub}</p>
      <p className="text-body-sm text-muted mt-2">{p.body}</p>
      <p className="text-body-sm mt-4" style={{ color: 'var(--accent-hover)' }}>{p.extra}</p>
    </div>
  )
}

function PackTable(p: { title: string; note: string; rows: [string, string][]; foot: string }) {
  return (
    <div className="card" style={{ padding: 28 }}>
      <h3 className="font-display text-white" style={{ fontSize: 28 }}>{p.title}</h3>
      <p className="text-body-sm text-muted mt-2 mb-4">{p.note}</p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th className="text-body-xs text-muted" style={{ textAlign: 'left', padding: '8px 0', borderBottom: '1px solid var(--border)', letterSpacing: '.1em', textTransform: 'uppercase' }}>Home size</th>
            <th className="text-body-xs text-muted" style={{ textAlign: 'right', padding: '8px 0', borderBottom: '1px solid var(--border)', letterSpacing: '.1em', textTransform: 'uppercase' }}>First 3 hours</th>
          </tr>
        </thead>
        <tbody>
          {p.rows.map(([size, price], n) => (
            <tr key={n}>
              <td className="text-body-sm" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>{size}</td>
              <td className="text-body-sm" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', textAlign: 'right', color: 'var(--accent-hover)' }}>{price}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-body-xs text-muted mt-4">{p.foot}</p>
    </div>
  )
}

function Policies({ c }: { c: Content }) {
  const items = [
    { h: 'Booking and notice', p: c.policies.booking },
    { h: 'Deposit and payment', p: c.policies.deposit },
    { h: 'Care and cancellation', p: c.policies.care },
  ]
  return (
    <section id="policies" className="py-section-md border-t border-line">
      <div className="section-container grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map(i => (
          <div key={i.h} className="card" style={{ padding: 28 }}>
            <h3 className="font-display text-white" style={{ fontSize: 24 }}>{i.h}</h3>
            <p className="text-body-sm text-muted mt-3">{i.p}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
