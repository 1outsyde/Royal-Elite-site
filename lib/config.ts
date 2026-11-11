export const BUSINESS_ID = process.env.NEXT_PUBLIC_OUTSYDE_BUSINESS_ID!
export const API_URL = process.env.NEXT_PUBLIC_OUTSYDE_API_URL!
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!

// Royal Elite Moving (business 93b7f8c3, owner Info.RoyalEliteMoving@gmail.com, Legend 2026-11-10). Estimate requests only:
// no online booking, payments, products, add-ons or points until deposits are built (Legend 2026-10-22).
export const VENDOR_CONFIG = {
  vendorName: "Royal Elite Moving",
  contactEmail: "Info.RoyalEliteMoving@gmail.com",
  phone: "757-944-4925",
  phoneHref: "tel:+17579444925",
  hasBookings: false,
  hasServices: true,
  // Plans stay hidden until Royal Elite connects Stripe: adding a plan turns the business's "offers services"
  // on, and the backend then hides the whole site until payouts are set up (Legend 2026-11-10).
  hasPlans: false,
  hasProducts: false,
  hasAnalytics: false,
  hasSubscription: true,
  hasEstimates: true,
} as const

// Outsyde platform admin only. The owner is let in by owning this business (canManageSite), not by an email,
// so the owner can change their login email without losing the dashboard (change email, Legend 2026-11-06).
export const ADMIN_EMAILS = [
  "info@goutsyde.com",
]

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.trim().toLowerCase())
}

/** Roles the backend gives a business team member (migration 112). "manager" is reserved for later. */
const TEAM_ROLES = ['requests', 'manager']

type SiteUser = {
  email?: string | null
  businessId?: string | null
  team?: { businessId?: string | null; role?: string | null }[] | null
}

/**
 * Who sees the site dashboard and as what: the Outsyde admin, the owner of this business (businessId from
 * /api/auth/me), or a team member of it (/api/auth/me `team`, Legend 2026-11-11: Jeremiah, estimate requests
 * plus read only views). This only decides what the site shows; every dashboard request is still checked by
 * the backend (owner token, admin + x-business-id, or a team member on the routes that allow it).
 */
export function siteRole(user: SiteUser | null | undefined, businessId: string | null | undefined = BUSINESS_ID): 'admin' | 'owner' | 'team' | null {
  if (!user) return null
  if (isAdminEmail(user.email)) return 'admin'
  if (!businessId) return null
  if (user.businessId && user.businessId === businessId) return 'owner'
  const team = Array.isArray(user.team) ? user.team : []
  if (team.some(t => t && t.businessId === businessId && TEAM_ROLES.includes(String(t.role)))) return 'team'
  return null
}

export function canManageSite<U extends SiteUser>(
  user: U | null | undefined,
  businessId: string | null | undefined = BUSINESS_ID,
): user is U {
  return siteRole(user, businessId) !== null
}
