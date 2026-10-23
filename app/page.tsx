'use client'

import { useEffect, useState } from 'react'
import Nav from '@/components/layout/Nav'
import Footer from '@/components/layout/Footer'
import CoverVideo from '@/components/ui/CoverVideo'
import EstimateForm from '@/components/sections/EstimateForm'
import { VENDOR_CONFIG } from '@/lib/config'
import { BRAND_HERO_PATH, isOwnBrandHero } from '@/lib/brand'
import { FALLBACK_CITIES, formatDollars, planPriceCents, type Plan } from '@/lib/estimates'

// Royal Elite Moving homepage. Plans and cities come from Benny's Outsyde account (edited in his
// dashboard). Until his plans are live, the page shows the same pricing as goutsyde.com/shop/royalelite.

export default function HomePage() {
  const [cover, setCover] = useState<string | null>(null)
  const [coverType, setCoverType] = useState<'image' | 'video'>('image')
  const [coverPoster, setCoverPoster] = useState<string | null>(null)
  const [coverFailed, setCoverFailed] = useState(false)
  const [cities, setCities] = useState<string[]>(FALLBACK_CITIES)
  const [plans, setPlans] = useState<Plan[]>([])

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
      <Hero cover={coverFailed ? null : cover} coverType={coverType} coverPoster={coverPoster} onFail={() => setCoverFailed(true)} />
      <TrustStrip />
      <Areas cities={cities} />
      {plans.length > 0 ? <LivePlans plans={plans} /> : <StaticPricing />}
      <section id="estimate" className="py-section-md border-t border-line" style={{ background: 'var(--surface)' }}>
        <div className="section-container" style={{ maxWidth: 820 }}>
          <div className="text-center mb-10">
            <p className="eyebrow">Free estimate</p>
            <h2 className="font-display text-display-md md:text-display-lg text-white mt-3">Request your free estimate</h2>
            <p className="text-body-md text-muted mt-3">72 hour minimum notice. We call you back to confirm your date and deposit.</p>
          </div>
          <EstimateForm cities={cities} plans={plans} />
        </div>
      </section>
      <Policies />
      <Footer />
    </div>
  )
}

function Hero({ cover, coverType, coverPoster, onFail }: { cover: string | null; coverType: 'image' | 'video'; coverPoster: string | null; onFail: () => void }) {
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
        <p className="eyebrow">Hampton Roads and the Eastern Shore</p>
        <h1 className="font-display text-white mt-5" style={{ fontSize: 'clamp(40px, 7vw, 80px)', lineHeight: 1.03, fontWeight: 700 }}>
          Moving doesn&rsquo;t have to be <em style={{ color: 'var(--accent-hover)' }}>stressful.</em>
        </h1>
        <p className="font-display mt-3" style={{ fontStyle: 'italic', fontSize: 'clamp(18px, 2.4vw, 24px)', color: 'var(--accent-hover)' }}>Your move. Our priority.</p>
        <p className="text-body-md text-muted mx-auto mt-5" style={{ maxWidth: 560 }}>
          Professional, reliable residential and commercial moving designed to make your move smooth, efficient and worry free. Let Royal Elite handle the heavy lifting.
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          <a href="#estimate" className="btn btn-primary">Get a free estimate</a>
          <a href={VENDOR_CONFIG.phoneHref} className="btn btn-secondary">Call {VENDOR_CONFIG.phone}</a>
        </div>
      </div>
    </section>
  )
}

function TrustStrip() {
  const items = ['Residential and commercial', 'In town and out of town', 'Careful handling', 'Same day and scheduled']
  return (
    <div className="border-y border-line" style={{ background: 'var(--surface)' }}>
      <div className="section-container grid grid-cols-2 md:grid-cols-4 gap-4 py-6 text-center">
        {items.map(i => <span key={i} className="text-body-sm text-muted" style={{ letterSpacing: '.04em' }}>{i}</span>)}
      </div>
    </div>
  )
}

function Areas({ cities }: { cities: string[] }) {
  const services = [
    'Residential and commercial moving',
    'In town and out of town moves',
    'Loading and unloading',
    'Careful handling of furniture and belongings',
    'Same day and scheduled moves (call to confirm availability)',
    'Professional packing services',
  ]
  return (
    <section id="areas" className="py-section-md">
      <div className="section-container grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <p className="eyebrow">What we do</p>
          <h2 className="font-display text-display-sm text-white mt-3 mb-5">Services offered</h2>
          <ul className="flex flex-col gap-3">
            {services.map(s => <li key={s} className="text-body-md text-muted">{s}</li>)}
          </ul>
        </div>
        <div>
          <p className="eyebrow">Where we go</p>
          <h2 className="font-display text-display-sm text-white mt-3 mb-5">Service areas</h2>
          <ul className="flex flex-col gap-3">
            {cities.map(c => <li key={c} className="text-body-md text-muted">{c}</li>)}
            <li className="text-body-md text-muted">Long distance moves up to 250 miles</li>
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
                  <img src={p.imageUrl} alt={p.name} style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'cover' }} />
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

// Same pricing as goutsyde.com/shop/royalelite, shown until Benny's plans are live on his account.
function StaticPricing() {
  return (
    <section id="services" className="py-section-md border-t border-line">
      <div className="section-container flex flex-col gap-14">
        <div>
          <div className="text-center mb-8">
            <p className="eyebrow">Crew, truck and labor, first 3 hours included</p>
            <h2 className="font-display text-display-md text-white mt-3">Standard moving services</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PriceCard tag="Weekday, Mon to Thurs" title="Standard Move" price="$300" unit="first 3 hrs" sub="Professional crew and truck included." body="Loading, transport and unloading of your household with careful handling start to finish." extra="+$50 per additional hour" />
            <PriceCard tag="Weekend, Fri to Sun" title="Standard Move" price="$350" unit="first 3 hrs" sub="Professional crew and truck included." body="Same full service move, scheduled for weekend convenience when you need it most." extra="+$50 per additional hour" />
            <PriceCard tag="Quick and light" title="Light Move" price="$250" unit="flat" sub="Bed, couch, dressers and light furniture." body="Ideal for quick moves, downsizing or storage runs. No kitchens or full room packing." extra="Flat rate, no hourly" />
          </div>
          <p className="text-body-sm text-muted text-center mt-6">
            3rd floor or above +$100. Same day pack and move (before 5 PM) +$100. Over 50 miles +$25 per 10 miles. Additional stops quoted as needed.
          </p>
        </div>

        <div>
          <div className="text-center mb-8">
            <p className="eyebrow">Done 24 to 48 hours before your move, same day available</p>
            <h2 className="font-display text-display-md text-white mt-3">Packing services</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PackTable title="Simple Pack" note="Basic household items, minimal fragiles. Boxes and room labeling included." rows={[['1 Bedroom', '$200'], ['2 Bedroom', '$300'], ['3 Bedroom', '$400'], ['4 Bedroom', '$500']]} foot="+$20 per additional hour, inventory checklist included" />
            <PackTable title="Full Pack" note="Kitchen, fragiles, closets and full prep. All materials and fragile wrapping included." rows={[['1 Bedroom', '$300'], ['2 Bedroom', '$450'], ['3 Bedroom', '$600'], ['4 Bedroom', '$750']]} foot="+$20 per additional hour, full inventory checklist" />
          </div>
        </div>

        <div>
          <div className="text-center mb-8">
            <p className="eyebrow">Up to 250 miles included, fuel and labor included</p>
            <h2 className="font-display text-display-md text-white mt-3">Long distance moves</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[['1 Bedroom', '$1,700'], ['2 Bedroom', '$2,500'], ['3 Bedroom', '$3,200']].map(([size, price]) => (
              <div key={size} className="card text-center" style={{ padding: 28 }}>
                <p className="text-body-sm text-muted" style={{ letterSpacing: '.12em', textTransform: 'uppercase' }}>{size}</p>
                <p className="text-body-xs text-muted mt-3">Starting at</p>
                <p className="font-display mt-1" style={{ fontSize: 40, color: 'var(--accent-hover)' }}>{price}</p>
              </div>
            ))}
          </div>
          <p className="text-body-sm text-muted text-center mt-6">
            Starting prices, subject to final assessment. Additional miles beyond 250 and packing are quoted separately unless bundled.
          </p>
        </div>
      </div>
    </section>
  )
}

function PriceCard(p: { tag: string; title: string; price: string; unit: string; sub: string; body: string; extra: string }) {
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
          {p.rows.map(([size, price]) => (
            <tr key={size}>
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

function Policies() {
  const items = [
    { h: 'Booking and notice', p: 'We require a minimum of 72 hours notice before your requested move date. A free walk through assessment is done before service to confirm scope, time and resources.' },
    { h: 'Deposit and payment', p: 'A $100 non refundable deposit secures your date and applies to your total. Out of town and commercial moves require 30 to 50 percent upfront. Balance due on completion by cash, check or card.' },
    { h: 'Care and cancellation', p: 'We handle your belongings with reasonable care and diligence. Please pack and label valuables and fragile items appropriately. Client cancellations forfeit the deposit; weather reschedules are accommodated.' },
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
