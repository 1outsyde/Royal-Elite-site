import { NextRequest, NextResponse } from 'next/server'

// Who gets each estimate request email (backend migration 111, GET/PUT /api/vendor/request-recipients).
const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

function proxyHeaders(req: NextRequest): Record<string, string> {
  const token = req.cookies.get('outsyde_access_token')?.value
  const cookieHeader = req.headers.get('cookie')
  return {
    'Content-Type': 'application/json',
    'x-business-id': BUSINESS_ID ?? '',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
  }
}

export async function GET(req: NextRequest) {
  const res = await fetch(`${API_URL}/api/vendor/request-recipients`, { headers: proxyHeaders(req), cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const res = await fetch(`${API_URL}/api/vendor/request-recipients`, {
    method: 'PUT',
    headers: proxyHeaders(req),
    body: JSON.stringify({ emails: Array.isArray(body?.emails) ? body.emails : [] }),
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
