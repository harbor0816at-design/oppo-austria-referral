create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  first_name text,
  last_name text,
  phone text,
  country text not null default 'AT',
  language text not null default 'de',
  status text not null default 'pending' check (status in ('active','blocked','pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists profiles_email_lower_uidx on public.profiles ((lower(email)));

create table if not exists public.referral_tiers (
  id uuid primary key default gen_random_uuid(), name text not null unique,
  minimum_referrals integer not null check (minimum_referrals >= 0),
  reward_description text, active boolean not null default true,
  sort_order integer not null default 0, created_at timestamptz not null default now()
);

create table if not exists public.referral_rules (
  id uuid primary key default gen_random_uuid(), name text not null,
  referrer_reward numeric(12,2) not null check (referrer_reward >= 0),
  friend_reward numeric(12,2) not null check (friend_reward >= 0),
  currency char(3) not null default 'EUR', minimum_order_value numeric(12,2),
  eligible_products jsonb not null default '[]'::jsonb,
  active boolean not null default true, valid_from timestamptz not null default now(), valid_until timestamptz,
  created_at timestamptz not null default now(),
  check (valid_until is null or valid_until > valid_from)
);

create table if not exists public.referrers (
  id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.profiles(id) on delete cascade,
  referral_code text not null, referral_slug text not null, referral_link text not null,
  successful_referrals integer not null default 0 check (successful_referrals >= 0),
  pending_referrals integer not null default 0 check (pending_referrals >= 0),
  total_reward_amount numeric(12,2) not null default 0 check (total_reward_amount >= 0),
  current_tier text not null default 'Member', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists referrers_referral_code_lower_uidx on public.referrers ((lower(referral_code)));
create unique index if not exists referrers_referral_slug_lower_uidx on public.referrers ((lower(referral_slug)));
create index if not exists referrers_user_id_idx on public.referrers(user_id);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(), referrer_id uuid not null references public.referrers(id) on delete cascade,
  referral_code text not null, referred_email text, referred_user_id uuid references public.profiles(id) on delete set null,
  visitor_session_id uuid not null, status text not null default 'clicked' check (status in ('clicked','registered','pending','qualified','rejected','rewarded','cancelled')),
  created_at timestamptz not null default now(), registered_at timestamptz, qualified_at timestamptz, rewarded_at timestamptz,
  source text, utm_source text, utm_medium text, utm_campaign text,
  rejection_reason text, fraud_score integer not null default 0 check (fraud_score between 0 and 100),
  fraud_status text not null default 'normal' check (fraud_status in ('normal','review','blocked')), fraud_reason text
);
create index if not exists referrals_referrer_id_idx on public.referrals(referrer_id);
create index if not exists referrals_status_idx on public.referrals(status);
create index if not exists referrals_created_at_idx on public.referrals(created_at desc);
create index if not exists referrals_referred_user_id_idx on public.referrals(referred_user_id);
create index if not exists referrals_referral_code_idx on public.referrals(referral_code);
create unique index if not exists referrals_session_referrer_uidx on public.referrals(visitor_session_id,referrer_id);

create table if not exists public.rewards (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  referral_id uuid references public.referrals(id) on delete set null,
  reward_type text not null check (reward_type in ('store_credit','coupon','accessory','ambassador','event_invitation','early_access')),
  reward_amount numeric(12,2) not null default 0 check (reward_amount >= 0), currency char(3) not null default 'EUR',
  status text not null default 'pending' check (status in ('pending','approved','available','redeemed','cancelled','expired')),
  created_at timestamptz not null default now(), approved_at timestamptz, redeemed_at timestamptz, expires_at timestamptz
);
create index if not exists rewards_user_id_idx on public.rewards(user_id);
create index if not exists rewards_status_idx on public.rewards(status);
create index if not exists rewards_referral_id_idx on public.rewards(referral_id);
create unique index if not exists rewards_referral_user_type_uidx on public.rewards(referral_id,user_id,reward_type) where referral_id is not null;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(), admin_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null, entity_type text not null, entity_id uuid, old_value jsonb, new_value jsonb, created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_type,entity_id);

create table if not exists public.consent_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null, consent_version text not null, granted boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists consent_logs_user_id_idx on public.consent_logs(user_id);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,email,first_name,last_name,phone,country,language,status)
  values(new.id,coalesce(new.email,''),new.raw_user_meta_data->>'first_name',new.raw_user_meta_data->>'last_name',new.raw_user_meta_data->>'phone',coalesce(new.raw_user_meta_data->>'country','AT'),coalesce(new.raw_user_meta_data->>'language','de'),'active')
  on conflict(id) do nothing;
  return new;
end; $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.referral_tiers enable row level security;
alter table public.referral_rules enable row level security;
alter table public.referrers enable row level security;
alter table public.referrals enable row level security;
alter table public.rewards enable row level security;
alter table public.audit_logs enable row level security;
alter table public.consent_logs enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) is not null and (select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy referrers_select_own on public.referrers for select to authenticated using (user_id = (select auth.uid()));
create policy rewards_select_own on public.rewards for select to authenticated using (user_id = (select auth.uid()));
create policy tiers_read_active on public.referral_tiers for select to anon, authenticated using (active = true);
create policy rules_read_active on public.referral_rules for select to authenticated using (active = true and valid_from <= now() and (valid_until is null or valid_until >= now()));
create policy consent_select_own on public.consent_logs for select to authenticated using (user_id = (select auth.uid()));

-- No direct user policies on referrals, audit_logs or write operations. Those paths go through authenticated Route Handlers and service-role access.
-- Explicit grants are included because newer Supabase projects may not expose SQL-created public tables to Data API automatically.
grant usage on schema public to anon, authenticated;
grant select on public.referral_tiers to anon, authenticated;
grant select on public.referral_rules to authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.referrers, public.rewards, public.consent_logs to authenticated;

insert into public.referral_tiers(name,minimum_referrals,reward_description,active,sort_order) values
('Member',0,'Standard referral membership',true,0),
('3 Empfehlungen',3,'100 € OPPO Guthaben oder Zubehör-Paket',true,10),
('OPPO Ambassador',5,'Exklusiver Zugang und zusätzliche Vorteile',true,20),
('Top Ambassador',10,'Events, Early Access und limitierte Produkte',true,30)
on conflict(name) do update set minimum_referrals=excluded.minimum_referrals,reward_description=excluded.reward_description,active=excluded.active,sort_order=excluded.sort_order;

insert into public.referral_rules(name,referrer_reward,friend_reward,currency,minimum_order_value,eligible_products,active,valid_from)
select 'Austria Referral V1',50,50,'EUR',null,'[]'::jsonb,true,now()
where not exists(select 1 from public.referral_rules where name='Austria Referral V1');
