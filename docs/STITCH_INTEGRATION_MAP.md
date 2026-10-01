# Stitch Integration Map

The production-facing UI is based directly on the uploaded Stitch HTML reference instead of being redrawn.

## Routes
- `/` -> responsive dispatcher `/portal/index.html`
- Desktop >= 768px -> `/portal/desktop.html`
- H5/mobile < 768px -> `/portal/mobile.html`
- `/my-referrals` -> the same responsive portal, overview tab

## Demo logic replaced
`public/portal/referral-api.js` overrides the Stitch demo globals after the original Stitch script loads:
- `loginDemo()` -> real `/api/auth/login`
- Magic Link -> `/api/auth/magic-link`
- `logoutDemo()` -> real `/api/auth/logout`
- `completeRegistration()` -> real `/api/auth/register`
- static profile -> `/api/profile`
- static code/link/stats -> `/api/referral/me`
- static referral list -> `/api/referral/list`
- reward summary -> `/api/rewards`
- tier/progress -> `/api/tiers`
- WhatsApp/E-mail/Facebook share -> real current user's referral link

## Intentionally disabled in V1
- Bank payout: Stitch demo implied a real bank payout. V1 only displays earned/available rewards; payout action shows a not-enabled notice.
- QR: the Stitch QR artwork is only a placeholder and is therefore not presented as a real QR code.
- Product/order verification: remains manual via Admin referral qualification until an order webhook/API is connected.

## Security behavior
The static Stitch pages never receive the Supabase service-role key. They only call same-origin Next.js API endpoints using the authenticated HttpOnly session cookies.
