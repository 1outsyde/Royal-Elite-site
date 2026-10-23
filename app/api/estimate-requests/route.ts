import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

// Customer estimate request. The backend needs the customer's own sign in (no x-business-id here):
// it saves the request, emails Royal Elite and Outsyde, and limits each account to 5 per hour.
export async function POST(req: NextRequest) {
  const token = req.cookies.get('outsyde_access_token')?.value
    || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) {
    return NextResponse.json({ success: false, message: 'Please sign in to request an estimate.' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, message: 'Please check the form and try again.' }, { status: 400 })
  }

  const res = await fetch(`${API_URL}/api/estimate-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...body, businessId: BUSINESS_ID, source: 'royal-elite-site' }),
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
