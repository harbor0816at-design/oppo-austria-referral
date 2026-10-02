create table if not exists public.payout_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  account_holder text not null,
  iban text not null,
  bic text,
  country text not null default 'AT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payout_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'EUR',
  payout_method text not null default 'bank_transfer',
  payout_account_id uuid references public.payout_accounts(id) on delete set null,
  status text not null default 'requested'
    check (status in ('requested','approved','paid','rejected','cancelled')),
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  paid_at timestamptz,
  rejected_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payout_request_rewards (
  payout_request_id uuid not null references public.payout_requests(id) on delete cascade,
  reward_id uuid not null references public.rewards(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  primary key (payout_request_id, reward_id)
);

alter table public.payout_accounts enable row level security;
alter table public.payout_requests enable row level security;
alter table public.payout_request_rewards enable row level security;

revoke all on public.payout_accounts from anon, authenticated;
revoke all on public.payout_requests from anon, authenticated;
revoke all on public.payout_request_rewards from anon, authenticated;

create index if not exists idx_payout_requests_user_id on public.payout_requests(user_id);
create index if not exists idx_payout_requests_status on public.payout_requests(status);
create index if not exists idx_payout_request_rewards_reward_id on public.payout_request_rewards(reward_id);
