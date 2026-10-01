# Setup

The live Supabase project is already created in `eu-central-1` and the database migrations plus the `referral-backend` Edge Function are deployed.

## Required application environment variables

Only three variables are required by the Next.js/Vercel application:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

`REFERRAL_COOKIE_DAYS` is optional and defaults to `30`.

The Vercel application does **not** need a Supabase secret/service-role key. Privileged referral/admin database mutations are isolated inside the deployed Supabase Edge Function, where Supabase provides secret credentials at runtime.

## Production steps

1. Copy `.env.supabase.example` to `.env.local` for local development.
2. Set `NEXT_PUBLIC_SITE_URL` to the final Vercel/custom domain.
3. In Supabase Auth, set the Site URL to the production site and allow `<SITE_URL>/auth/confirm` as a redirect URL.
4. Configure branded SMTP before production if reliable authentication email delivery is required.
5. Create the first real Auth user through the normal registration/magic-link flow, then promote that user's `app_metadata.role` to `admin` using a trusted Supabase Admin workflow/dashboard.
6. Enable Supabase Auth leaked-password protection before enabling password login in production.
7. Run `npm install`, `npm run typecheck`, `npm test`, and `npm run build` in a networked CI/development environment.

## Security model

- Browser/Next.js receives only the publishable key.
- User-facing privileged operations call the Supabase Edge Function with the user's JWT; the function revalidates the user server-side.
- Admin operations additionally require `app_metadata.role = admin`.
- Public Edge access is limited to referral-link click tracking for valid referral codes.
- RLS remains enabled on all public tables.
- Full IP addresses are not stored.
- Referred e-mail addresses returned to referrers are masked server-side.
