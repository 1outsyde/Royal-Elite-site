# Royal Elite Moving

Standalone site for Royal Elite Moving (Outsyde business `93b7f8c3-71e8-4856-b8eb-7cbdb15e77c0`, its own login Info.RoyalEliteMoving@gmail.com; separate from B Provision `9ebaa477`), cloned from `nail-sniper-web` (main `02196cd`).

Estimate requests only: customers sign in, pick their city and a plan, and send the estimate form. The request is saved on outsyde-backend (`POST /api/estimate-requests`), emailed to the business and Outsyde, and listed in the dashboard (`/dashboard/estimates`). No online booking, payments, products, add-ons or points until deposits are built.

Frontend only (Next.js on Vercel). All data goes through outsyde-backend; see the Outsyde Brain vault note `vendor-site-pattern`.

## Environment (Vercel)
- `NEXT_PUBLIC_OUTSYDE_BUSINESS_ID`, `OUTSYDE_BUSINESS_ID`: `93b7f8c3-71e8-4856-b8eb-7cbdb15e77c0`
- `NEXT_PUBLIC_OUTSYDE_API_URL`, `OUTSYDE_API_URL`: outsyde-backend URL
- `NEXT_PUBLIC_SITE_URL`: the site's own URL
Never add `DATABASE_URL`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY` or `INTERNAL_API_KEY`.

## Home page content
Benny edits the site's words and prices on Dashboard > Home page. They are saved on the business as `siteConfig.content` (see `lib/siteContent.ts`, tests `npx tsx lib/siteContent.test.ts`); any blank field shows the built-in text. Plans stay hidden (`VENDOR_CONFIG.hasPlans`) until Royal Elite connects Stripe, because adding a plan turns on "offers services" and the backend then hides the site until payouts are set up.
