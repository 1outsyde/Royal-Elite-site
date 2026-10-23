import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

// The business record for the dashboard (service cities, cover, logo). The public record works once
// the business is visible; before that, the owner's own record (GET /api/vendor/my-business), used
// only when it is this site's business so an admin never edits the wrong one.
export async function GET(req: NextRequest) {
  const pub = await fetch(`${API_URL}/api/businesses/${BUSINESS_ID}`, { cache: 'no-store' })
  if (pub.ok) {
    const data = await pub.json().catch(() => ({}))
    return NextResponse.json({ business: data.business ?? data })
  }

  const token = req.cookies.get('outsyde_access_token')?.value
  const res = await fetch(`${API_URL}/api/vendor/my-business`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  const biz = data?.business ?? data
  if (res.ok && biz?.id === BUSINESS_ID) {
    return NextResponse.json({ business: biz })
  }
  return NextResponse.json(
    { error: 'This business is not public yet. Sign in as the business owner to edit it.' },
    { status: 404 },
  )
}
