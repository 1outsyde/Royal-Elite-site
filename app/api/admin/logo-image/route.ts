import { NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.OUTSYDE_API_URL!
const BUSINESS_ID = process.env.OUTSYDE_BUSINESS_ID!

// POST /api/admin/logo-image → backend POST /api/media/upload-image (folder "logos").
// Same flow as hero-image; the caller then saves it with PATCH /api/admin/profile { logoImage }.
// The logo on the Outsyde account is the one the app shows, so the site and app stay in sync.
export async function POST(req: NextRequest) {
  try {
    const incoming = await req.formData()
    const forwarded = new FormData()
    for (const [key, value] of incoming.entries()) {
      // Backend multer expects field name "file"; frontend sends "image"
      forwarded.append(key === 'image' ? 'file' : key, value)
    }
    forwarded.append('folder', 'logos')
    forwarded.append('businessId', BUSINESS_ID ?? '')

    const token = req.cookies.get('outsyde_access_token')?.value
    const cookieHeader = req.headers.get('cookie')

    const res = await fetch(`${API_URL}/api/media/upload-image`, {
      method: 'POST',
      headers: {
        'x-business-id': BUSINESS_ID ?? '',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        // Do NOT set Content-Type — let fetch set multipart/form-data boundary
      },
      body: forwarded,
    })

    const data = await res.json().catch(() => ({}))
    // data.url is the CDN URL — caller should PATCH the business profile with logoImage
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 })
  }
}
