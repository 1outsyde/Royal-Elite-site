"use client"

import Link from "next/link"
import { useState } from "react"
import { VENDOR_CONFIG, isAdminEmail } from "@/lib/config"
import { useAuth } from "@/lib/auth-context"
import BrandLogo from "@/components/layout/BrandLogo"

const NAV_LINKS = [
  { label: "Services", href: "/#services" },
  { label: "Service areas", href: "/#areas" },
  { label: "Policies", href: "/#policies" },
]

export default function Nav() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout, isLoading } = useAuth()
  const authed = !!user
  const isAdmin = !!user && isAdminEmail(user.email)

  return (
    <nav className="sticky top-0 z-50 bg-base border-b border-line backdrop-blur-sm">
      <div className="section-container flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          href="/"
          aria-label={VENDOR_CONFIG.vendorName}
          className="flex items-center gap-3 min-w-0 font-display text-xl md:text-2xl text-white tracking-tight hover:text-accent transition-colors"
        >
          <BrandLogo variant="mark" />
          <span className="truncate">{VENDOR_CONFIG.vendorName}</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-body-sm text-muted hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-4">
          {!isLoading && (isAdmin ? (
            <Link
              href="/dashboard"
              className="text-body-sm text-muted hover:text-white transition-colors"
            >
              Dashboard
            </Link>
          ) : authed ? (
            <>
              <Link
                href="/account"
                className="text-body-sm text-muted hover:text-white transition-colors"
              >
                My Account
              </Link>
              <button
                onClick={() => logout()}
                className="text-body-sm text-muted hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0 font-inherit"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-body-sm text-muted hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link href="/#estimate" className="btn btn-primary">
                Free Estimate
              </Link>
            </>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 text-white"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
        >
          <span
            className={`block w-6 h-0.5 bg-current transition-all duration-200 ${isOpen ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`block w-6 h-0.5 bg-current transition-all duration-200 ${isOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-6 h-0.5 bg-current transition-all duration-200 ${isOpen ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-base border-t border-line">
          <div className="section-container py-6 flex flex-col gap-5">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-body-md text-muted hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="section-divider" />
            {!isLoading && (isAdmin ? (
              <Link
                href="/dashboard"
                className="text-body-md text-muted hover:text-white transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
              </Link>
            ) : authed ? (
              <>
                <Link
                  href="/account"
                  className="text-body-md text-muted hover:text-white transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  My Account
                </Link>
                <button
                  onClick={() => { logout(); setIsOpen(false) }}
                  className="text-body-md text-muted hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0 font-inherit text-left"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-body-md text-muted hover:text-white transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/#estimate"
                  className="btn btn-primary self-start"
                  onClick={() => setIsOpen(false)}
                >
                  Free Estimate
                </Link>
              </>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
