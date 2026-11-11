'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { LIMITS, QUESTION_TYPES, TYPE_LABEL, blankQuestion, cleanForSave, type FormQuestion, type QuestionType } from '@/lib/requestForm'

// Dashboard > Request form (step 6, Legend 2026-11-10): the extra questions on Royal Elite's estimate form.
// Saved as his Outsyde base form; the move details (type, home size, addresses, date) are always asked.

function authHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem('outsyde_access_token')
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch {
    return {}
  }
}

const input: CSSProperties = {
  width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 6, padding: '9px 12px',
  color: 'var(--text)', fontSize: 14, boxSizing: 'border-box', fontFamily: 'inherit',
}
const small: CSSProperties = { fontSize: 12, color: 'var(--muted)' }

export default function RequestFormPage() {
  const [questions, setQuestions] = useState<FormQuestion[]>([])
  const [saved, setSaved] = useState('[]')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState(false)

  function apply(list: unknown) {
    const qs = (Array.isArray(list) ? list : []) as FormQuestion[]
    setQuestions(qs)
    setSaved(JSON.stringify(cleanForSave(qs)))
  }

  useEffect(() => {
    fetch('/api/admin/request-form', { headers: authHeaders(), cache: 'no-store' })
      .then(async r => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(typeof data?.message === 'string' ? data.message : typeof data?.error === 'string' ? data.error : 'Could not load your request form.')
        apply(data.form?.questions)
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Could not load your request form.'))
      .finally(() => setLoading(false))
  }, [])

  const dirty = JSON.stringify(cleanForSave(questions)) !== saved

  function update(i: number, q: FormQuestion) { setQuestions(qs => qs.map((x, n) => (n === i ? q : x))); setOk(false) }
  function move(i: number, d: -1 | 1) {
    setQuestions(qs => { const next = [...qs]; const j = i + d; if (j < 0 || j >= next.length) return qs; [next[i], next[j]] = [next[j], next[i]]; return next })
    setOk(false)
  }
  function remove(i: number) { setQuestions(qs => qs.filter((_, n) => n !== i)); setOk(false) }
  function add(type: QuestionType) { setQuestions(qs => [...qs, blankQuestion(type)]); setOk(false) }

  async function save() {
    setSaving(true); setError(null); setOk(false)
    try {
      const res = await fetch('/api/admin/request-form', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ questions: cleanForSave(questions) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data?.message === 'string' ? data.message : 'Could not save. Please try again.')
      apply(data.form?.questions)
      setOk(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p style={{ color: 'var(--muted)' }}>Loading...</p>

  return (
    <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 90 }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 34, color: 'var(--text)', marginBottom: 6 }}>Request form</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14 }}>
          Extra questions customers answer when they request an estimate. Their move type, home size, addresses, floor, stops,
          date and notes are always asked. Answers show on each request and in the request email.
        </p>
      </div>

      {questions.length === 0 && (
        <p style={{ fontSize: 14, color: 'var(--muted)', border: '1px dashed var(--border)', borderRadius: 8, padding: 18 }}>
          No extra questions yet. Add one below.
        </p>
      )}

      {questions.map((q, i) => (
        <section key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--accent-hover)' }}>Question {i + 1} · {TYPE_LABEL[q.type]}</p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" className="btn btn-outline" aria-label={`Move question ${i + 1} up`} disabled={i === 0} onClick={() => move(i, -1)}>Up</button>
              <button type="button" className="btn btn-outline" aria-label={`Move question ${i + 1} down`} disabled={i === questions.length - 1} onClick={() => move(i, 1)}>Down</button>
              <button type="button" className="btn btn-outline" aria-label={`Remove question ${i + 1}`} onClick={() => remove(i)}>Remove</button>
            </div>
          </div>
          <div>
            <label htmlFor={`q-${i}-label`} style={{ fontSize: 13, color: 'var(--text)' }}>Question</label>
            <input id={`q-${i}-label`} value={q.label} maxLength={LIMITS.label} placeholder="How many boxes do you have?" style={{ ...input, marginTop: 6 }}
              onChange={e => update(i, { ...q, label: e.target.value })} />
          </div>
          <div>
            <label htmlFor={`q-${i}-help`} style={{ fontSize: 13, color: 'var(--text)' }}>Hint (optional)</label>
            <input id={`q-${i}-help`} value={q.help ?? ''} maxLength={LIMITS.help} placeholder="Shown under the question" style={{ ...input, marginTop: 6 }}
              onChange={e => update(i, { ...q, help: e.target.value })} />
          </div>
          {q.type === 'choice' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontSize: 13, color: 'var(--text)' }}>Choices</p>
              {(q.options ?? []).map((o, n) => (
                <div key={n} style={{ display: 'flex', gap: 6 }}>
                  <input id={`q-${i}-opt-${n}`} aria-label={`Choice ${n + 1}`} value={o} maxLength={LIMITS.option} style={input}
                    onChange={e => update(i, { ...q, options: (q.options ?? []).map((x, k) => (k === n ? e.target.value : x)) })} />
                  <button type="button" className="btn btn-outline" aria-label={`Remove choice ${n + 1}`} onClick={() => update(i, { ...q, options: (q.options ?? []).filter((_, k) => k !== n) })}>Remove</button>
                </div>
              ))}
              {(q.options ?? []).length < LIMITS.options && (
                <button type="button" className="btn btn-outline" style={{ alignSelf: 'flex-start' }} onClick={() => update(i, { ...q, options: [...(q.options ?? []), ''] })}>Add a choice</button>
              )}
              <label style={{ fontSize: 14, color: 'var(--text)', display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="checkbox" checked={q.multiple === true} onChange={e => update(i, { ...q, multiple: e.target.checked })} /> Customers can pick more than one
              </label>
            </div>
          )}
          {q.type === 'photos' && (
            <div>
              <label htmlFor={`q-${i}-max`} style={{ fontSize: 13, color: 'var(--text)' }}>Most photos a customer can add</label>
              <select id={`q-${i}-max`} value={q.maxPhotos ?? LIMITS.photosPerQuestion} style={{ ...input, marginTop: 6, maxWidth: 120 }}
                onChange={e => update(i, { ...q, maxPhotos: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          )}
          <label style={{ fontSize: 14, color: 'var(--text)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={q.required} onChange={e => update(i, { ...q, required: e.target.checked })} /> Required
          </label>
        </section>
      ))}

      {questions.length < LIMITS.questions && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 13, color: 'var(--text)' }}>Add a question</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {QUESTION_TYPES.map(t => <button key={t} type="button" className="btn btn-outline" onClick={() => add(t)}>{TYPE_LABEL[t]}</button>)}
          </div>
          <p style={small}>Up to {LIMITS.questions} questions. Photo questions take up to {LIMITS.photosPerQuestion} photos each, {LIMITS.photosTotal} per request.</p>
        </div>
      )}

      <div style={{ position: 'sticky', bottom: 0, background: 'var(--bg)', borderTop: '1px solid var(--border)', padding: '14px 0', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" onClick={save} disabled={saving || !dirty} className="btn btn-primary">{saving ? 'Saving...' : 'Save request form'}</button>
        {error && <span role="alert" style={{ color: '#fca5a5', fontSize: 14 }}>{error}</span>}
        {ok && <span style={{ color: 'var(--muted)', fontSize: 14 }}>Saved. Your estimate form is updated.</span>}
        {!ok && !error && dirty && <span style={{ color: 'var(--muted)', fontSize: 14 }}>You have unsaved changes.</span>}
      </div>
    </div>
  )
}
