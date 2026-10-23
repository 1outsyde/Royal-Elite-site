# Royal Elite Moving

Standalone site for Royal Elite Moving (Outsyde business `9ebaa477`), cloned from `nail-sniper-web` (main `02196cd`).

Estimate requests only: customers sign in, pick their city and a plan, and send the estimate form. The request is saved on outsyde-backend (`POST /api/estimate-requests`), emailed to the business and Outsyde, and listed in the dashboard (`/dashboard/estimates`). No online booking, payments, products, add-ons or points until deposits are built.

Frontend only (Next.js on Vercel). All data goes through outsyde-backend; see the Outsyde Brain vault note `vendor-site-pattern`.

## Environment (Vercel)
- `NEXT_PUBLIC_OUTSYDE_BUSINESS_ID`, `OUTSYDE_BUSINESS_ID`: `9ebaa477-8d94-4522-b4fb-aaaa3c665c86`
- `NEXT_PUBLIC_OUTSYDE_API_URL`, `OUTSYDE_API_URL`: outsyde-backend URL
- `NEXT_PUBLIC_SITE_URL`: the site's own URL
Never add `DATABASE_URL`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY` or `INTERNAL_API_KEY`.
