import BrandIcon from "./BrandIcon"

type BrandLogoProps = {
  variant?: "mark" | "full"
  className?: string
  heightClass?: string
  maxWidthClass?: string
  priority?: boolean
}

// "full": the Royal Elite wordmark in text (same style as goutsyde.com/shop/royalelite).
// "mark": the Outsyde account logo (same as the app), with a text monogram as fallback.
export default function BrandLogo({ variant = "mark", className = "" }: BrandLogoProps) {
  if (variant === "full") {
    return (
      <span
        className={`block text-center font-display ${className}`}
        style={{ fontSize: "clamp(34px, 7vw, 46px)", fontWeight: 600, letterSpacing: "0.03em", lineHeight: 1.05, color: "var(--text)" }}
      >
        Royal <span style={{ color: "var(--accent-hover)" }}>Elite</span>
        <span className="block font-body" style={{ fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase", color: "var(--muted)", marginTop: 8 }}>
          Moving
        </span>
      </span>
    )
  }
  return <BrandIcon size={44} className={`block ${className}`} />
}
