'use client'

import { useState, type CSSProperties } from 'react'
import type { AnswerValue, FormQuestion } from '@/lib/requestForm'
import { LIMITS } from '@/lib/requestForm'

// Benny's request form questions inside the estimate form (step 6). Answers go up with the request;
// photos upload first (resized in the browser so phone photos fit the site's upload size) and send their urls.

type Props = {
  questions: FormQuestion[]
  values: Record<string, AnswerValue>
  onChange: (id: string, v: AnswerValue) => void
  field: CSSProperties
  label: CSSProperties
}

export default function RequestQuestions({ questions, values, onChange, field, label }: Props) {
  if (questions.length === 0) return null
  const photosUsed = questions.reduce((n, q) => n + (q.type === 'photos' && Array.isArray(values[q.id ?? '']) ? (values[q.id ?? ''] as string[]).length : 0), 0)
  return (
    <>
      {questions.map(q => {
        if (!q.id) return null
        const id = `est-q-${q.id}`
        const v = values[q.id]
        const title = <>{q.label}{q.required ? ' *' : ''}</>
        const hint = q.help ? <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: 6 }}>{q.help}</p> : null
        if (q.type === 'choice') {
          const picked = Array.isArray(v) ? v : typeof v === 'string' && v ? [v] : []
          return (
            <fieldset key={q.id} className="md:col-span-2" style={{ border: 0, padding: 0, margin: 0 }}>
              <legend style={label}>{title}</legend>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(q.options ?? []).map(o => {
                  const on = picked.includes(o)
                  return (
                    <label key={o} style={{ ...field, width: 'auto', display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', borderColor: on ? 'var(--accent)' : 'var(--border)' }}>
                      <input type={q.multiple ? 'checkbox' : 'radio'} name={id} checked={on}
                        onChange={() => onChange(q.id!, q.multiple ? (on ? picked.filter(x => x !== o) : [...picked, o]) : o)} />
                      {o}
                    </label>
                  )
                })}
              </div>
              {hint}
            </fieldset>
          )
        }
        if (q.type === 'photos') {
          return (
            <div key={q.id} className="md:col-span-2">
              <p style={label}>{title}</p>
              <PhotoAnswer id={id} urls={Array.isArray(v) ? v : []} max={Math.min(q.maxPhotos ?? LIMITS.photosPerQuestion, LIMITS.photosPerQuestion)}
                roomLeft={LIMITS.photosTotal - photosUsed} onChange={urls => onChange(q.id!, urls)} field={field} />
              {hint}
            </div>
          )
        }
        return (
          <div key={q.id} className={q.type === 'long_text' ? 'md:col-span-2' : undefined}>
            <label style={label} htmlFor={id}>{title}</label>
            {q.type === 'long_text' ? (
              <textarea id={id} rows={3} maxLength={LIMITS.longAnswer} value={typeof v === 'string' ? v : ''} onChange={e => onChange(q.id!, e.target.value)} style={{ ...field, resize: 'vertical' }} />
            ) : (
              <input id={id} type={q.type === 'date' ? 'date' : 'text'} maxLength={LIMITS.shortAnswer} value={typeof v === 'string' ? v : ''} onChange={e => onChange(q.id!, e.target.value)} style={field} />
            )}
            {hint}
          </div>
        )
      })}
    </>
  )
}

function PhotoAnswer({ id, urls, max, roomLeft, onChange, field }: { id: string; urls: string[]; max: number; roomLeft: number; onChange: (u: string[]) => void; field: CSSProperties }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canAdd = urls.length < max && roomLeft > 0

  async function add(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)
    setBusy(true)
    const next = [...urls]
    try {
      for (const file of Array.from(files).slice(0, Math.min(max - urls.length, roomLeft))) {
        const body = new FormData()
        body.append('image', await shrink(file))
        let token: string | null = null
        try { token = localStorage.getItem('outsyde_access_token') } catch { token = null }
        const res = await fetch('/api/request-photo', { method: 'POST', body, headers: token ? { Authorization: `Bearer ${token}` } : {} })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || typeof data?.url !== 'string') throw new Error(typeof data?.error === 'string' ? data.error : 'That photo could not be uploaded.')
        next.push(data.url)
        onChange([...next])
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That photo could not be uploaded.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {urls.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {urls.map(u => (
            <div key={u} style={{ position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)' }} />
              <button type="button" aria-label="Remove photo" onClick={() => onChange(urls.filter(x => x !== u))}
                style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,.7)', color: '#fff', border: 0, borderRadius: 4, fontSize: 12, padding: '2px 6px', cursor: 'pointer' }}>Remove</button>
            </div>
          ))}
        </div>
      )}
      {canAdd && (
        <label htmlFor={id} style={{ ...field, width: 'auto', alignSelf: 'flex-start', cursor: busy ? 'wait' : 'pointer' }}>
          {busy ? 'Uploading...' : `Add photos (up to ${max})`}
          <input id={id} type="file" accept="image/*" multiple={max - urls.length > 1} disabled={busy} style={{ display: 'none' }}
            onChange={e => { add(e.target.files); e.target.value = '' }} />
        </label>
      )}
      {error && <p role="alert" style={{ color: '#fca5a5', fontSize: '0.85rem' }}>{error}</p>}
    </div>
  )
}

/** Shrinks a photo to at most 1600px on its long side as a JPEG; a file the browser can't read is sent as is. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.85))
    return blob ? new File([blob], 'photo.jpg', { type: 'image/jpeg' }) : file
  } catch {
    return file
  }
}
