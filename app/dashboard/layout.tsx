'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import BrandIcon from '@/components/layout/BrandIcon'
import { useAuth } from '@/lib/auth-context'
import { isAdminEmail, VENDOR_CONFIG } from '@/lib/config'

type NavItem = {
  href: string
  label: string
  exact?: boolean
  show: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'OVERVIEW', exact: true, show: true },
  { href: '/dashboard/estimates', label: 'ESTIMATE REQUESTS', show: VENDOR_CONFIG.hasEstimates },
  { href: '/dashboard/services', label: 'PLANS', show: VENDOR_CONFIG.hasServices },
  { href: '/dashboard/areas', label: 'SERVICE AREAS', show: VENDOR_CONFIG.hasServices },
  { href: '/dashboard/subscription', label: 'SUBSCRIPTION', show: VENDOR_CONFIG.hasSubscription },
  { href: '/dashboard/settings', label: 'SETTINGS', show: true },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && (!user || !isAdminEmail(user.email))) {
      router.replace('/login')
    }
  }, [user, isLoading, router])


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (isLoading || !user || !isAdminEmail(user.email)) return null

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 lg:hidden" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 220, background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Brand lockup */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)' }}>
          <Link href="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
            <BrandIcon size={44} className="flex-shrink-0" />
            <div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, fontWeight: 600, color: 'var(--text)', lineHeight: 1.2 }}>
                {VENDOR_CONFIG.vendorName}
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2, letterSpacing: '0.1em' }}>
                ADMIN
              </div>
            </div>
          </Link>
        </div>

        {/* Nav: text only, all caps, gold left bar when active */}
        <nav className="flex-1 overflow-y-auto py-4">
          {NAV_ITEMS.filter(i => i.show).map(item => {
            const isExact = item.exact === true
            const active = isExact ? pathname === item.href : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '11px 20px',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  color: active ? 'var(--text)' : 'var(--muted)',
                  textDecoration: 'none',
                  borderLeft: `3px solid ${active ? 'var(--accent)' : 'transparent'}`,
                  background: active ? 'var(--accent-soft)' : 'transparent',
                  transition: 'all 0.15s',
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email}
          </div>
          <button
            onClick={() => { logout(); router.push('/') }}
            style={{ fontSize: 12, color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, letterSpacing: '0.04em' }}
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar, 52px, sticky */}
        <header
          className="lg:hidden flex items-center gap-3 sticky top-0 z-10"
          style={{ height: 52, padding: '0 16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          <button onClick={() => setSidebarOpen(true)} style={{ color: 'var(--muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 6, display: 'flex' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
          <Link href="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
            <BrandIcon size={36} />
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>
              {VENDOR_CONFIG.vendorName}
            </span>
          </Link>
        </header>

        <main className="flex-1 p-6 lg:p-10 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
