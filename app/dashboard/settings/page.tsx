'use client'

import { useState, useEffect } from 'react'
import { useWindowWidth } from '@/lib/useWindowWidth'
import CoverVideo from '@/components/ui/CoverVideo'
import { COVER_VIDEO_MAX_SECONDS, uploadCoverVideo } from '@/lib/coverMedia'
import { useCropFile } from '@/components/crop/useCropFile'

export default function SettingsPage() {
  const isMobile = useWindowWidth() < 768
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)
  const [heroMediaType, setHeroMediaType] = useState<'image' | 'video'>('image')
  const [heroPosterUrl, setHeroPosterUrl] = useState<string | null>(null)
  const [heroUploading, setHeroUploading] = useState(false)
  const [heroError, setHeroError] = useState<string | null>(null)
  const [heroSuccess, setHeroSuccess] = useState(false)
  const { crop, cropModal } = useCropFile()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [logoSuccess, setLogoSuccess] = useState(false)

  useEffect(() => {
    // Works before the business is public too (owner record), see app/api/admin/business.
    fetch('/api/admin/business', { cache: 'no-store' })
      .then(r => r.json())
      .then(data => {
        const biz = data.business ?? data
        setHeroImageUrl(biz.coverImage ?? biz.cover_image ?? null)
        setHeroMediaType((biz.coverMediaType ?? biz.cover_media_type) === 'video' ? 'video' : 'image')
        setHeroPosterUrl(biz.coverPosterUrl ?? null)
        setLogoUrl(biz.logoImage ?? biz.logo_image ?? null)
      })
      .catch(() => null)
  }, [])

  // Logo: saved on the Outsyde account, so the same logo shows on this site and in the app.
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0]
    e.target.value = ''
    if (!picked) return
    // Round crop first (photo ratios step 4), same as the app and goutsyde.com.
    const cropped = await crop(picked, 'logo')
    if (!cropped) return
    const file = cropped.file

    setLogoError(null)
    setLogoSuccess(false)

    if (file.size > 8 * 1024 * 1024) {
      setLogoError('File too large. The maximum is 8MB.')
      return
    }

    setLogoUploading(true)

    try {
      const token = localStorage.getItem('outsyde_access_token')
      const form = new FormData()
      form.append('image', file)

      const uploadRes = await fetch('/api/admin/logo-image', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`)

      const { url } = await uploadRes.json()
      if (!url) throw new Error('No URL returned from upload')

      const patchRes = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ logoImage: url }),
      })
      if (!patchRes.ok) throw new Error(`Profile update failed: ${patchRes.status}`)

      setLogoUrl(url)
      setLogoSuccess(true)
      setTimeout(() => setLogoSuccess(false), 4000)
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Upload failed. Try again.')
    } finally {
      setLogoUploading(false)
    }
  }

  async function handleHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0]
    e.target.value = ''
    if (!picked) return

    setHeroError(null)
    setHeroSuccess(false)

    // 16:9 crop first (photo ratios step 4), same shape as the cover in the app.
    const cropped = await crop(picked, 'cover')
    if (!cropped) return
    const file = cropped.file

    if (file.size > 8 * 1024 * 1024) {
      setHeroError('File too large — maximum 8MB.')
      return
    }

    setHeroUploading(true)

    try {
      const token = localStorage.getItem('outsyde_access_token')
      const form = new FormData()
      form.append('image', file)

      const uploadRes = await fetch('/api/admin/hero-image', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })

      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`)

      const { url } = await uploadRes.json()
      if (!url) throw new Error('No URL returned from upload')

      const patchRes = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ heroImageUrl: url }),
      })

      if (!patchRes.ok) throw new Error(`Profile update failed: ${patchRes.status}`)

      setHeroImageUrl(url)
      setHeroMediaType('image')
      setHeroPosterUrl(null)
      setHeroSuccess(true)
      setTimeout(() => setHeroSuccess(false), 4000)
    } catch (err) {
      setHeroError(err instanceof Error ? err.message : 'Upload failed. Try again.')
    } finally {
      setHeroUploading(false)
    }
  }

  async function handleHeroVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setHeroError(null)
    setHeroSuccess(false)
    setHeroUploading(true)

    try {
      const token = localStorage.getItem('outsyde_access_token')
      const uploadId = await uploadCoverVideo(file, token)

      const patchRes = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ heroVideoUploadId: uploadId }),
      })
      if (!patchRes.ok) throw new Error(`Profile update failed: ${patchRes.status}`)

      // The backend returns the stream URL straight away if Mux has already finished.
      const saved = await patchRes.json().catch(() => ({}))
      const savedCover = saved?.business?.coverImage
      setHeroImageUrl(typeof savedCover === 'string' && savedCover ? savedCover : uploadId)
      setHeroMediaType('video')
      setHeroPosterUrl(null)
      setHeroSuccess(true)
      setTimeout(() => setHeroSuccess(false), 4000)
    } catch (err) {
      setHeroError(err instanceof Error ? err.message : 'Upload failed. Try again.')
    } finally {
      setHeroUploading(false)
      e.target.value = ''
    }
  }

  const uploadButtonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: heroUploading ? 'var(--surface-2)' : 'var(--accent)',
    color: heroUploading ? 'var(--muted)' : 'var(--on-accent)',
    fontSize: 13,
    fontWeight: 600,
    padding: '10px 22px',
    borderRadius: 4,
    cursor: heroUploading ? 'not-allowed' : 'pointer',
    letterSpacing: '0.04em',
    transition: 'background 0.2s',
  } as const

  return (
    <div style={{ maxWidth: 680 }}>
      {cropModal}
      <h1 style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: 32,
        fontWeight: 600,
        color: 'var(--text)',
        marginBottom: 8,
      }}>
        Site Settings
      </h1>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 36, lineHeight: 1.6 }}>
        Manage how your public-facing site looks to clients.
      </p>

      {/* Logo */}
      <div style={{
        background: 'var(--surface)',
        border: '1.5px solid var(--border)',
        borderRadius: 12,
        padding: isMobile ? '24px 20px' : '28px 32px',
        marginBottom: 20,
      }}>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 24,
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: 6,
        }}>
          Logo
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
          Your logo shows on this site and on your Outsyde profile, search results and messages.
          A square image works best (at least 512px).
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
            border: '1.5px solid var(--border)', background: 'var(--surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl || '/logo-icon-v2.png'}
              alt="Current logo"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>
            {logoUrl ? 'Current logo' : 'Using the built in logo. Upload one to show it in the app too.'}
          </p>
        </div>

        <label style={{
          ...uploadButtonStyle,
          background: logoUploading ? 'var(--surface-2)' : 'var(--accent)',
          color: logoUploading ? 'var(--muted)' : 'var(--on-accent)',
          cursor: logoUploading ? 'not-allowed' : 'pointer',
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {logoUploading ? 'Uploading…' : 'Upload logo'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            disabled={logoUploading}
            onChange={handleLogoUpload}
          />
        </label>

        {logoError && (
          <p style={{ fontSize: 12, color: '#F87171', marginTop: 12 }}>{logoError}</p>
        )}
        {logoSuccess && (
          <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 12 }}>
            ✓ Logo updated
          </p>
        )}
      </div>

      {/* Hero Image */}
      <div style={{
        background: 'var(--surface)',
        border: '1.5px solid var(--border)',
        borderRadius: 12,
        padding: isMobile ? '24px 20px' : '28px 32px',
      }}>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 24,
          fontWeight: 600,
          color: 'var(--text)',
          marginBottom: 6,
        }}>
          Cover Photo or Video
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>
          This is your business cover. It appears on your homepage and across the Outsyde platform.
          Upload a high quality photo of your work (at least 1200px wide) or a short video (up to {COVER_VIDEO_MAX_SECONDS} seconds, plays muted on a loop).
        </p>

        {heroImageUrl && heroMediaType === 'video' && (
          <div style={{ marginBottom: 24 }}>
            <CoverVideo
              src={heroImageUrl}
              poster={heroPosterUrl}
              style={{
                width: '100%',
                maxWidth: 480,
                height: 220,
                borderRadius: 8,
                border: '1.5px solid var(--border)',
                display: 'block',
                background: '#000',
              }}
              processing={
                <div style={{
                  width: '100%', maxWidth: 480, height: 220, borderRadius: 8,
                  border: '1.5px solid var(--border)', background: '#000', color: 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, textAlign: 'center', padding: '0 24px',
                }}>
                  Video uploaded. It is processing and will show on your site in a minute or two.
                </div>
              }
            />
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Current cover video</p>
          </div>
        )}

        {heroImageUrl && heroMediaType !== 'video' && (
          <div style={{ marginBottom: 24 }}>
            <img
              src={heroImageUrl}
              alt="Current hero"
              style={{
                width: '100%',
                maxWidth: 480,
                aspectRatio: '16 / 9',
                objectFit: 'cover',
                borderRadius: 8,
                border: '1.5px solid var(--border)',
                display: 'block',
              }}
            />
            <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>Current cover image</p>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <label style={uploadButtonStyle}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {heroUploading ? 'Uploading…' : 'Upload cover photo'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            disabled={heroUploading}
            onChange={handleHeroUpload}
          />
        </label>

        <label style={uploadButtonStyle}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          {heroUploading ? 'Uploading…' : 'Upload cover video'}
          <input
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            style={{ display: 'none' }}
            disabled={heroUploading}
            onChange={handleHeroVideoUpload}
          />
        </label>
        </div>

        {heroError && (
          <p style={{ fontSize: 12, color: '#F87171', marginTop: 12 }}>{heroError}</p>
        )}
        {heroSuccess && (
          <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 12 }}>
            ✓ Cover updated
          </p>
        )}
      </div>
    </div>
  )
}
