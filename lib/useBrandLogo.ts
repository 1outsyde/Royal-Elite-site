'use client'

import { useEffect, useState } from 'react'
import { BRAND_ICON_SRC } from './brand'

// One request per page load, shared by every logo on the page.
let accountLogoPromise: Promise<string | null> | null = null

function loadAccountLogo(): Promise<string | null> {
  if (!accountLogoPromise) {
    accountLogoPromise = fetch('/api/bookings/business')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        const biz = data?.business ?? data
        const logo = biz?.logoImage ?? biz?.logo_image ?? null
        return typeof logo === 'string' && logo.trim() ? logo.trim() : null
      })
      .catch(() => null)
  }
  return accountLogoPromise
}

/** The account logo (same one the Outsyde app shows), or null when the account has none. */
export function useBrandLogo(): string | null {
  const [src, setSrc] = useState<string | null>(BRAND_ICON_SRC)
  useEffect(() => {
    let alive = true
    loadAccountLogo().then(logo => { if (alive && logo) setSrc(logo) })
    return () => { alive = false }
  }, [])
  return src
}
