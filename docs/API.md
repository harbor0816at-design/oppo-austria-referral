# API
All JSON APIs use `{ success: true, data }` or `{ success: false, error }`.

## Public/Auth
- `POST /api/auth/register` — password or magic-link registration.
- `POST /api/auth/login` — email/password login.
- `POST /api/auth/logout`
- `GET /auth/confirm?code=...&next=/my-referrals`
- `GET /r/:code` — referral click tracking + 30-day HttpOnly cookies.
- `GET /api/tiers`

## Authenticated member
- `GET /api/profile`
- `POST /api/referral/create`
- `GET /api/referral/me`
- `GET /api/referral/stats`
- `GET /api/referral/list?status=pending`
- `GET /api/rewards`

## Admin (`app_metadata.role = admin`)
- `GET /api/admin/users`
- `GET /api/admin/referrals?status=pending`
- `PATCH /api/admin/referrals/:id` body `{ "status":"qualified" }`
- `GET /api/admin/rewards`
- `PATCH /api/admin/rewards/:id` body `{ "status":"redeemed" }`

Qualifying a referral creates the configured referrer reward once (unique DB constraint makes it idempotent), recalculates statistics/tier, and appends an audit log.
