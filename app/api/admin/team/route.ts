import { NextRequest, NextResponse } from 'next/server'
import { vendorHeaders } from '@/lib/vendorProxy'

// Dashboard > Team (owner only): backend GET/POST /api/vendor/team (migration 112).
const API_URL = process.env.OUTSYDE_API_URL!

export async function GET(req: NextRequest) {
  const res = await fetch(`${API_URL}/api/vendor/team`, { headers: vendorHeaders(req), cache: 'no-store' })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const res = await fetch(`${API_URL}/api/vendor/team`, {
    method: 'POST',
    headers: vendorHeaders(req),
    body: JSON.stringify({ email: typeof body?.email === 'string' ? body.email : '' }),
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
