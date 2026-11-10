// Home page words and prices Benny edits on Dashboard > Home page (Legend 2026-11-10).
// Saved on his Outsyde account under siteConfig.content. Every field falls back to the text the
// site shipped with (app/page.tsx @ 58e3ea7), so a blank or missing field never shows an empty card.

export interface PriceCard { tag: string; title: string; price: string; unit: string; sub: string; body: string; extra: string }
export interface Row { size: string; price: string }
export interface PackTable { title: string; note: string; rows: Row[]; foot: string }

export interface Content {
  region: string
  headline: string
  headlineAccent: string
  tagline: string
  heroText: string
  phone: string
  trust: string[]
  servicesOffered: string[]
  longDistanceLine: string
  standardEyebrow: string
  standardWeekday: PriceCard
  standardWeekend: PriceCard
  light: PriceCard
  surchargeNote: string
  packingEyebrow: string
  simplePack: PackTable
  fullPack: PackTable
  longDistanceEyebrow: string
  longDistance: { rows: Row[] }
  longDistanceNote: string
  noticeLine: string
  policies: { booking: string; deposit: string; care: string }
}

/** What may be saved: any part of Content, cards and tables partly. */
export type SiteContent = { [K in keyof Content]?: unknown }

export const LIMITS = { short: 80, medium: 240, long: 600, listItems: 10 } as const

const rows = (sizes: string[], prices: string[]): Row[] => sizes.map((size, i) => ({ size, price: prices[i] }))
const BEDROOMS = ['1 Bedroom', '2 Bedroom', '3 Bedroom', '4 Bedroom']

export const DEFAULT_CONTENT: Content = {
  region: 'Hampton Roads and the Eastern Shore',
  headline: 'Moving doesn’t have to be',
  headlineAccent: 'stressful.',
  tagline: 'Your move. Our priority.',
  heroText: 'Professional, reliable residential and commercial moving designed to make your move smooth, efficient and worry free. Let Royal Elite handle the heavy lifting.',
  phone: '757-944-4925',
  trust: ['Residential and commercial', 'In town and out of town', 'Careful handling', 'Same day and scheduled'],
  servicesOffered: [
    'Residential and commercial moving',
    'In town and out of town moves',
    'Loading and unloading',
    'Careful handling of furniture and belongings',
    'Same day and scheduled moves (call to confirm availability)',
    'Professional packing services',
  ],
  longDistanceLine: 'Long distance moves up to 250 miles',
  standardEyebrow: 'Crew, truck and labor, first 3 hours included',
  standardWeekday: { tag: 'Weekday, Mon to Thurs', title: 'Standard Move', price: '$300', unit: 'first 3 hrs', sub: 'Professional crew and truck included.', body: 'Loading, transport and unloading of your household with careful handling start to finish.', extra: '+$50 per additional hour' },
  standardWeekend: { tag: 'Weekend, Fri to Sun', title: 'Standard Move', price: '$350', unit: 'first 3 hrs', sub: 'Professional crew and truck included.', body: 'Same full service move, scheduled for weekend convenience when you need it most.', extra: '+$50 per additional hour' },
  light: { tag: 'Quick and light', title: 'Light Move', price: '$250', unit: 'flat', sub: 'Bed, couch, dressers and light furniture.', body: 'Ideal for quick moves, downsizing or storage runs. No kitchens or full room packing.', extra: 'Flat rate, no hourly' },
  surchargeNote: '3rd floor or above +$100. Same day pack and move (before 5 PM) +$100. Over 50 miles +$25 per 10 miles. Additional stops quoted as needed.',
  packingEyebrow: 'Done 24 to 48 hours before your move, same day available',
  simplePack: { title: 'Simple Pack', note: 'Basic household items, minimal fragiles. Boxes and room labeling included.', rows: rows(BEDROOMS, ['$200', '$300', '$400', '$500']), foot: '+$20 per additional hour, inventory checklist included' },
  fullPack: { title: 'Full Pack', note: 'Kitchen, fragiles, closets and full prep. All materials and fragile wrapping included.', rows: rows(BEDROOMS, ['$300', '$450', '$600', '$750']), foot: '+$20 per additional hour, full inventory checklist' },
  longDistanceEyebrow: 'Up to 250 miles included, fuel and labor included',
  longDistance: { rows: rows(BEDROOMS.slice(0, 3), ['$1,700', '$2,500', '$3,200']) },
  longDistanceNote: 'Starting prices, subject to final assessment. Additional miles beyond 250 and packing are quoted separately unless bundled.',
  noticeLine: '72 hour minimum notice. We call you back to confirm your date and deposit.',
  policies: {
    booking: 'We require a minimum of 72 hours notice before your requested move date. A free walk through assessment is done before service to confirm scope, time and resources.',
    deposit: 'A $100 non refundable deposit secures your date and applies to your total. Out of town and commercial moves require 30 to 50 percent upfront. Balance due on completion by cash, check or card.',
    care: 'We handle your belongings with reasonable care and diligence. Please pack and label valuables and fragile items appropriately. Client cancellations forfeit the deposit; weather reschedules are accommodated.',
  },
}

const LONG_KEYS = new Set(['heroText', 'surchargeNote', 'longDistanceNote', 'booking', 'deposit', 'care'])
const MEDIUM_KEYS = new Set(['body', 'sub', 'note', 'foot', 'noticeLine', 'tagline'])
const limitFor = (key: string) => (LONG_KEYS.has(key) ? LIMITS.long : MEDIUM_KEYS.has(key) ? LIMITS.medium : LIMITS.short)

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)

function text(v: unknown, fallback: string, key: string): string {
  if (typeof v !== 'string') return fallback
  const t = v.trim()
  return t ? t.slice(0, limitFor(key)) : fallback
}

function obj<T extends object>(v: unknown, fallback: T): T {
  const src = isObj(v) ? v : {}
  const out: Record<string, unknown> = {}
  for (const [k, d] of Object.entries(fallback)) {
    if (typeof d === 'string') out[k] = text(src[k], d, k)
    else if (k === 'rows') out[k] = (d as Row[]).map((r, i) => obj(Array.isArray(src.rows) ? src.rows[i] : undefined, r))
    else out[k] = obj(src[k], d as object)
  }
  return out as T
}

/** Saved content (anything) to the full content the page renders. */
export function resolveContent(raw: unknown): Content {
  const src = isObj(raw) ? raw : {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { trust: _t, servicesOffered: _s, ...scalarDefaults } = DEFAULT_CONTENT
  const base = obj(src, scalarDefaults)
  const trust = DEFAULT_CONTENT.trust.map((d, i) => text(Array.isArray(src.trust) ? src.trust[i] : undefined, d, 'trust'))
  const offered = Array.isArray(src.servicesOffered)
    ? src.servicesOffered.filter((x): x is string => typeof x === 'string' && !!x.trim()).map(x => x.trim().slice(0, LIMITS.short)).slice(0, LIMITS.listItems)
    : []
  const all: Record<string, unknown> = { ...base, trust, servicesOffered: offered.length ? offered : DEFAULT_CONTENT.servicesOffered }
  return Object.fromEntries(Object.keys(DEFAULT_CONTENT).map(k => [k, all[k]])) as unknown as Content
}

/** The whole siteConfig to save: keeps keys this editor does not own (photos, future keys), replaces content. */
export function mergeSiteConfig(existing: Record<string, unknown> | null | undefined, content: SiteContent): Record<string, unknown> {
  return { ...(isObj(existing) ? existing : {}), content }
}

/** Move types for the estimate form: the price card names in page order, no repeats. */
export function moveTypesFrom(c: Content): string[] {
  const names = [c.standardWeekday.title, c.standardWeekend.title, c.light.title, c.simplePack.title, c.fullPack.title, 'Long-Distance Move']
  return names.filter((n, i) => names.indexOf(n) === i)
}

/** tel: link for a US phone number as Benny types it. */
export function phoneHref(phone: string): string {
  const d = phone.replace(/\D/g, '')
  return `tel:+${d.length === 10 ? '1' + d : d}`
}
