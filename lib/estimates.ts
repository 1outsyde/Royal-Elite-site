// Royal Elite estimate form: shared types and the content goutsyde.com/shop/royalelite shows today.
// The site uses the live plans and cities from Benny's Outsyde account when they exist, and these
// built-in lists only until then (his plans can't be public before his plan and Stripe are set up).

export interface Plan {
  id: string
  name: string
  description?: string | null
  price?: number | null
  priceCents?: number | null
  imageUrl?: string | null
  serviceCities?: string[] | null
  requestOnly?: boolean | null
  isActive?: boolean | null
  status?: string | null
}

export const ESTIMATE_STATUSES = ['new', 'called', 'quoted', 'booked', 'closed'] as const
export type EstimateStatus = typeof ESTIMATE_STATUSES[number]

export const STATUS_LABEL: Record<EstimateStatus, string> = {
  new: 'New',
  called: 'Called',
  quoted: 'Quoted',
  booked: 'Booked',
  closed: 'Closed',
}

// Same lists as goutsyde.com/shop/royalelite (used until Benny's account has its own).
export const FALLBACK_CITIES = ['Chesapeake', 'Norfolk', 'Portsmouth', 'Suffolk']
export const FALLBACK_MOVE_TYPES = ['Standard Move', 'Light Move', 'Long-Distance Move', 'Packing Only']
export const HOME_SIZES = ['Studio', '1 Bedroom', '2 Bedroom', '3 Bedroom', '4 Bedroom', 'Commercial']
export const FLOORS = ['Ground / 1st floor', '2nd floor', '3rd floor or above']

export function planPriceCents(p: Plan): number | null {
  const v = p.priceCents ?? p.price
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

export function formatDollars(cents: number): string {
  const d = cents / 100
  return Number.isInteger(d) ? `$${d.toLocaleString('en-US')}` : `$${d.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const key = (c: string) => c.trim().replace(/\s+/g, ' ').toLowerCase()

/** Same rule as the backend: an empty plan city list means every city the business serves. */
export function planOfferedIn(p: Plan, city: string): boolean {
  const list = p.serviceCities ?? []
  if (list.length === 0) return true
  return list.some(c => key(c) === key(city))
}

/** Earliest move date the form offers: 72 hours notice (Royal Elite policy). */
export function earliestMoveDate(now = new Date()): string {
  const d = new Date(now.getTime() + 72 * 60 * 60 * 1000)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
