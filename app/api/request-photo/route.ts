import { NextRequest, NextResponse } from 'next/server'

// A customer's photo for a request form answer → backend POST /api/media/upload-image (folder "requests",
// images only, sign in required). The returned url is sent as the answer; the backend only accepts its own urls.
const API_URL = process.env.OUTSYDE_API_URL!

export async function POST(req: NextRequest) {
  const token = req.cookies.get('outsyde_access_token')?.value
    || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'Please sign in to add photos.' }, { status: 401 })
  try {
    const incoming = await req.formData()
    const file = incoming.get('image') ?? incoming.get('file')
    if (!file || typeof file === 'string') return NextResponse.json({ error: 'Choose a photo to upload.' }, { status: 400 })
    const forwarded = new FormData()
    forwarded.append('file', file)
    forwarded.append('folder', 'requests')
    const res = await fetch(`${API_URL}/api/media/upload-image`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: forwarded,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return NextResponse.json({ error: typeof data?.error === 'string' ? data.error : 'That photo could not be uploaded.' }, { status: res.status })
    return NextResponse.json({ url: data.url })
  } catch {
    return NextResponse.json({ error: 'That photo could not be uploaded.' }, { status: 500 })
  }
}
