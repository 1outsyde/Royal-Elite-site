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

export const ADMIN_EMAILS = [
  "bprovisionproperties@yahoo.com",
  "info@goutsyde.com",
]

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
