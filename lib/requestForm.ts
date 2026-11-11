// Royal Elite's estimate request form (step 6, Legend 2026-11-10). Benny builds it on Dashboard > Request form;
// it is his Outsyde base form (backend /api/vendor/request-forms, isBase). Customers answer it on the estimate
// form; the backend checks every answer (outsyde-backend requests/requestForms.ts checkAnswers), so these
// helpers only shape the data and catch an empty required answer before sending.

export const QUESTION_TYPES = ['short_text', 'long_text', 'choice', 'date', 'photos'] as const
export type QuestionType = typeof QUESTION_TYPES[number]

export const TYPE_LABEL: Record<QuestionType, string> = {
  short_text: 'Short answer',
  long_text: 'Long answer',
  choice: 'Choice',
  date: 'Date',
  photos: 'Photos',
}

// Same limits as the backend (requests/requestForms.ts).
export const LIMITS = { questions: 25, label: 200, help: 300, options: 20, option: 100, shortAnswer: 200, longAnswer: 2000, photosPerQuestion: 5, photosTotal: 10 } as const

export interface FormQuestion {
  id?: string
  type: QuestionType
  label: string
  help?: string
  required: boolean
  options?: string[]
  multiple?: boolean
  maxPhotos?: number
}

/** A question's answer while the customer fills the form. */
export type AnswerValue = string | string[]

export function blankQuestion(type: QuestionType): FormQuestion {
  if (type === 'choice') return { type, label: '', required: false, options: ['', ''], multiple: false }
  if (type === 'photos') return { type, label: '', required: false, maxPhotos: LIMITS.photosPerQuestion }
  return { type, label: '', required: false }
}

/** What the dashboard sends to save: trimmed, only the fields each type uses. */
export function cleanForSave(questions: FormQuestion[]): FormQuestion[] {
  return questions.map(q => {
    const out: FormQuestion = { ...(q.id ? { id: q.id } : {}), type: q.type, label: q.label.trim(), required: q.required === true }
    const help = (q.help ?? '').trim()
    if (help) out.help = help
    if (q.type === 'choice') {
      out.options = (q.options ?? []).map(o => o.trim()).filter(Boolean)
      out.multiple = q.multiple === true
    }
    if (q.type === 'photos') out.maxPhotos = Math.min(Math.max(1, Math.round(q.maxPhotos ?? LIMITS.photosPerQuestion)), LIMITS.photosPerQuestion)
    return out
  })
}

const filled = (v: AnswerValue | undefined) => (Array.isArray(v) ? v.length > 0 : typeof v === 'string' && v.trim() !== '')

/** The label of the first required question with no answer, or null when all are answered. */
export function firstMissing(questions: FormQuestion[], values: Record<string, AnswerValue>): string | null {
  for (const q of questions) if (q.required && q.id && !filled(values[q.id])) return q.label
  return null
}

/** The answers object the backend expects: question id to text or list; empty answers left out. */
export function toAnswers(questions: FormQuestion[], values: Record<string, AnswerValue>): Record<string, AnswerValue> {
  const out: Record<string, AnswerValue> = {}
  for (const q of questions) {
    if (!q.id) continue
    const v = values[q.id]
    if (Array.isArray(v)) { if (v.length) out[q.id] = v }
    else if (typeof v === 'string' && v.trim()) out[q.id] = v.trim()
  }
  return out
}
