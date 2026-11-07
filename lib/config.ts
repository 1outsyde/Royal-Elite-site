export const BUSINESS_ID = process.env.NEXT_PUBLIC_OUTSYDE_BUSINESS_ID!
export const API_URL = process.env.NEXT_PUBLIC_OUTSYDE_API_URL!
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!

// Royal Elite Moving (business 9ebaa477, owner businessmanbenny). Estimate requests only:
// no online booking, payments, products, add-ons or points until deposits are built (Legend 2026-10-22).
export const VENDOR_CONFIG = {
  vendorName: "Royal Elite Moving",
  contactEmail: "bprovisionproperties@yahoo.com",
  phone: "757-944-4925",
  phoneHref: "tel:+17579444925",
  hasBookings: false,
  hasServices: true,
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

/**
 * Who sees the site dashboard: the owner of this business (businessId from /api/auth/me) or the Outsyde admin.
 * This only decides what the site shows; every dashboard request is still checked by the backend
 * (owner token, or admin + x-business-id).
 */
export function canManageSite<U extends { email?: string | null; businessId?: string | null }>(
  user: U | null | undefined,
  businessId: string | null | undefined = BUSINESS_ID,
): user is U {
  if (!user) return false
  if (isAdminEmail(user.email)) return true
  return !!businessId && !!user.businessId && user.businessId === businessId
}
