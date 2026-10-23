// Brand assets shared by the site and the Outsyde app.
//
// The Outsyde account (businesses.logo_image / cover_image) is the source of truth so the
// site and the app always show the same logo and cover. Royal Elite has no logo file yet,
// so without an account logo the site shows the "Royal Elite" wordmark in text.
// The hero fallback is the same picture goutsyde.com/shop/royalelite already uses.

export const BRAND_ICON_SRC: string | null = null

export const BRAND_HERO_PATH = '/royalelite-hero.jpg'

export function isOwnBrandHero(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    return new URL(url, 'https://local.invalid').pathname === BRAND_HERO_PATH
  } catch {
    return false
  }
}
