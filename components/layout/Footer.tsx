import Link from "next/link"
import { VENDOR_CONFIG } from "@/lib/config"

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-base border-t border-line">
      <div className="section-container py-section-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col gap-5">
            <p className="font-display text-display-sm text-white">
              Royal <span className="text-accent">Elite</span> Moving
            </p>
            <p className="text-body-sm text-muted leading-relaxed">
              Residential and commercial moving across Hampton Roads and the Eastern Shore. Your move, our priority.
            </p>
            <Link href="/#estimate" className="btn btn-primary self-start">
              Get a free estimate
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            <p className="eyebrow">Explore</p>
            <Link href="/#services" className="text-body-sm text-muted hover:text-white transition-colors">Services and pricing</Link>
            <Link href="/#areas" className="text-body-sm text-muted hover:text-white transition-colors">Service areas</Link>
            <Link href="/#policies" className="text-body-sm text-muted hover:text-white transition-colors">Policies</Link>
            <Link href="/#estimate" className="text-body-sm text-muted hover:text-white transition-colors">Free estimate</Link>
          </div>

          <div className="flex flex-col gap-4">
            <p className="eyebrow">Contact</p>
            <a href={VENDOR_CONFIG.phoneHref} className="text-body-sm text-muted hover:text-white transition-colors">{VENDOR_CONFIG.phone}</a>
            <a href={`mailto:${VENDOR_CONFIG.contactEmail}`} className="text-body-sm text-muted hover:text-white transition-colors break-all">{VENDOR_CONFIG.contactEmail}</a>
            <Link href="/account" className="text-body-sm text-muted hover:text-white transition-colors">My account</Link>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-line flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <p className="text-body-xs text-muted">© {year} {VENDOR_CONFIG.vendorName}. All rights reserved.</p>
          <p className="text-body-xs text-muted">
            Powered by <a href="https://goutsyde.com" className="text-accent hover:underline">Outsyde</a>
          </p>
        </div>
      </div>
    </footer>
  )
}
