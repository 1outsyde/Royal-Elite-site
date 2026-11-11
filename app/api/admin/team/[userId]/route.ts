import { NextRequest, NextResponse } from 'next/server'
import { vendorHeaders } from '@/lib/vendorProxy'

// Dashboard > Team: remove someone (backend DELETE /api/vendor/team/:userId, owner only).
const API_URL = process.env.OUTSYDE_API_URL!

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const res = await fetch(`${API_URL}/api/vendor/team/${encodeURIComponent(userId)}`, { method: 'DELETE', headers: vendorHeaders(req) })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
