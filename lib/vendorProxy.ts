import type { NextRequest } from 'next/server'

const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

/** Headers for a dashboard call to a backend /api/vendor route: the signed in user's token + this site's business. */
export function vendorHeaders(req: NextRequest): Record<string, string> {
  const token = req.cookies.get('outsyde_access_token')?.value
    || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  return {
    'Content-Type': 'application/json',
    'x-business-id': BUSINESS_ID ?? '',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}
