import { NextResponse } from 'next/server'

// Public: Royal Elite's request form questions for the estimate form (backend GET /api/businesses/:id/request-form).
const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

export async function GET() {
  try {
    const res = await fetch(`${API_URL}/api/businesses/${encodeURIComponent(BUSINESS_ID)}/request-form`, { cache: 'no-store' })
    const data = await res.json().catch(() => ({}))
    // No form yet (or an older backend): the estimate form simply shows no extra questions.
    if (!res.ok) return NextResponse.json({ questions: [] })
    return NextResponse.json({ questions: Array.isArray(data?.questions) ? data.questions : [] })
  } catch {
    return NextResponse.json({ questions: [] })
  }
}
