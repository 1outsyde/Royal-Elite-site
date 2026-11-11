import { NextRequest, NextResponse } from 'next/server'

// Dashboard > Request form: Royal Elite's base form (backend /api/vendor/request-forms, isBase).
// GET returns it (or null); PUT saves the questions, creating the base form the first time.
const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!
const FORM_NAME = 'Estimate request form'

function headers(req: NextRequest): Record<string, string> {
  const token = req.cookies.get('outsyde_access_token')?.value
    || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  return {
    'Content-Type': 'application/json',
    'x-business-id': BUSINESS_ID ?? '',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

type Form = { id: string; isBase: boolean; questions: unknown[] }

async function baseForm(req: NextRequest): Promise<{ status: number; form: Form | null; error?: unknown }> {
  const res = await fetch(`${API_URL}/api/vendor/request-forms`, { headers: headers(req), cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { status: res.status, form: null, error: data }
  const forms: Form[] = Array.isArray(data?.forms) ? data.forms : []
  return { status: 200, form: forms.find(f => f.isBase) ?? null }
}

export async function GET(req: NextRequest) {
  const found = await baseForm(req)
  if (found.status !== 200) return NextResponse.json(found.error ?? {}, { status: found.status })
  return NextResponse.json({ form: found.form })
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const questions = Array.isArray(body?.questions) ? body.questions : []
  const found = await baseForm(req)
  if (found.status !== 200) return NextResponse.json(found.error ?? {}, { status: found.status })
  const res = found.form
    ? await fetch(`${API_URL}/api/vendor/request-forms/${encodeURIComponent(found.form.id)}`, {
        method: 'PATCH', headers: headers(req), body: JSON.stringify({ questions }),
      })
    : await fetch(`${API_URL}/api/vendor/request-forms`, {
        method: 'POST', headers: headers(req), body: JSON.stringify({ name: FORM_NAME, isBase: true, questions }),
      })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
