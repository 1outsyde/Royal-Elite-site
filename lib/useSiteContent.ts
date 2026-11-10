'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_CONTENT, resolveContent, type Content } from './siteContent'

// One request per page load, shared by every part of the page that shows Benny's edited words.
let contentPromise: Promise<Content> | null = null

export function loadSiteContent(): Promise<Content> {
  if (!contentPromise) {
    contentPromise = fetch('/api/bookings/business')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        const biz = data?.business ?? data
        return resolveContent(biz?.siteConfig?.content)
      })
      .catch(() => DEFAULT_CONTENT)
  }
  return contentPromise
}

/** Benny's home page words and prices, or the built-in ones until they load. */
export function useSiteContent(): Content {
  const [content, setContent] = useState<Content>(DEFAULT_CONTENT)
  useEffect(() => {
    let alive = true
    loadSiteContent().then(c => { if (alive) setContent(c) })
    return () => { alive = false }
  }, [])
  return content
}
