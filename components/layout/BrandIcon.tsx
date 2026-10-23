'use client'

import { useState, type CSSProperties } from 'react'
import { useBrandLogo } from '@/lib/useBrandLogo'

type BrandIconProps = {
  size: number
  className?: string
  style?: CSSProperties
}

// The account logo (same as the app). Without one, a gold "RE" monogram in text, never a made up image.
export default function BrandIcon({ size, className, style }: BrandIconProps) {
  const accountLogo = useBrandLogo()
  const [failed, setFailed] = useState(false)
  if (!accountLogo || failed) {
    return (
      <span
        aria-hidden="true"
        className={className}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: size, height: size, borderRadius: '50%', border: '1px solid var(--accent)',
          color: 'var(--accent-hover)', fontFamily: 'var(--font-cormorant), Georgia, serif',
          fontWeight: 700, fontSize: Math.round(size * 0.42), letterSpacing: '0.02em', flexShrink: 0,
          ...style,
        }}
      >
        RE
      </span>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={accountLogo}
      alt="Royal Elite Moving"
      width={size}
      height={size}
      className={className}
      style={{ height: size, width: 'auto', objectFit: 'contain', ...style }}
      onError={() => setFailed(true)}
    />
  )
}
