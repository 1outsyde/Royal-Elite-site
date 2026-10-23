import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";

// ─── Font Loading ──────────────────────────────────────────────────
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
  preload: true,
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
  preload: true,
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
  preload: false,
});

// ─── Metadata ─────────────────────────────────────────────────────
// Starts on the Vercel URL; NEXT_PUBLIC_SITE_URL changes once Royal Elite has its own domain.
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

const siteTitle = "Royal Elite Moving | Hampton Roads Movers";
const siteDescription =
  "Professional, reliable residential and commercial moving in Hampton Roads and the Eastern Shore. Request your free estimate online.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | Royal Elite Moving",
  },
  description: siteDescription,
  keywords: [
    "movers",
    "moving company",
    "Hampton Roads movers",
    "Chesapeake movers",
    "Norfolk movers",
    "packing services",
    "Royal Elite Moving",
  ],
  authors: [{ name: "Royal Elite Moving" }],
  creator: "Royal Elite Moving",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Royal Elite Moving",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/royalelite-og.png",
        width: 960,
        height: 960,
        alt: "Royal Elite Moving",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: siteTitle,
    description: siteDescription,
    images: ["/royalelite-og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1E0E33",
  colorScheme: "dark",
};

// ─── Root Layout ──────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-base text-ink font-body antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}