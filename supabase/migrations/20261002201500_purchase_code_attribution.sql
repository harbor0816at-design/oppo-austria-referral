alter table public.referral_sales add column if not exists referral_code text;
alter table public.referral_sales add column if not exists buyer_email text;

create index if not exists idx_referral_sales_referral_code
on public.referral_sales(referral_code);

create index if not exists idx_referral_sales_buyer_email
on public.referral_sales(lower(buyer_email));
