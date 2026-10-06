create table if not exists public.crm_customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  referrer_id uuid references public.referrers(id) on delete set null,
  full_name text not null,
  whatsapp text,
  phone_norm text,
  email text,
  source text,
  source_detail text,
  current_device text,
  product_interest_id uuid references public.referral_products(id) on delete set null,
  product_interest_text text,
  primary_need text,
  purchase_barrier text,
  purchase_horizon text,
  lead_score integer not null default 0 check (lead_score between 0 and 100),
  temperature text not null default 'warm' check (temperature in ('cold','warm','hot')),
  state text not null default 'new' check (state in ('new','qualified','decision','high_intent','showroom','purchased','owner','referral_eligible','advocate','lost')),
  advisor_user_id uuid references auth.users(id) on delete set null,
  first_contact_at timestamptz not null default now(),
  last_contact_at timestamptz,
  next_action text,
  next_action_due timestamptz,
  satisfaction text not null default 'unknown' check (satisfaction in ('unknown','positive','neutral','issue')),
  marketing_consent boolean not null default false,
  consent_source text,
  consent_at timestamptz,
  opted_out_at timestamptz,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_content_assets (
  id uuid primary key default gen_random_uuid(),
  content_code text not null unique,
  title text not null,
  category text not null check (category in ('decision','camera','battery','switching','trust','service','showroom','offer','owner','referral','other')),
  purchase_barrier text,
  channel text not null default 'whatsapp' check (channel in ('whatsapp','web','showroom','email','other')),
  language text not null default 'de' check (language in ('de','en','zh')),
  body text,
  asset_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_actions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.crm_customers(id) on delete cascade,
  action_type text not null default 'follow_up',
  title text not null,
  due_at timestamptz not null,
  status text not null default 'open' check (status in ('open','done','cancelled')),
  priority text not null default 'normal' check (priority in ('normal','high','urgent')),
  assigned_to uuid references auth.users(id) on delete set null,
  outcome text,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.crm_customers(id) on delete cascade,
  activity_type text not null check (activity_type in ('whatsapp','call','showroom','content_sent','order','note','status_change','referral','other')),
  summary text not null,
  content_asset_id uuid references public.crm_content_assets(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_appointments (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.crm_customers(id) on delete cascade,
  appointment_at timestamptz not null,
  status text not null default 'booked' check (status in ('booked','attended','no_show','cancelled')),
  purpose text,
  outcome text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_order_imports (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  row_count integer not null default 0 check (row_count >= 0),
  matched_count integer not null default 0 check (matched_count >= 0),
  possible_count integer not null default 0 check (possible_count >= 0),
  unmatched_count integer not null default 0 check (unmatched_count >= 0),
  status text not null default 'uploaded' check (status in ('uploaded','processed','failed')),
  error_message text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_orders (
  id uuid primary key default gen_random_uuid(),
  import_id uuid references public.crm_order_imports(id) on delete set null,
  order_number text not null unique,
  order_date timestamptz,
  customer_name text,
  email text,
  phone text,
  phone_norm text,
  product_name text,
  quantity integer not null default 1 check (quantity > 0),
  gross_amount numeric(12,2) not null default 0 check (gross_amount >= 0),
  net_amount numeric(12,2) check (net_amount is null or net_amount >= 0),
  currency char(3) not null default 'EUR',
  country text,
  status text not null default 'confirmed',
  customer_id uuid references public.crm_customers(id) on delete set null,
  match_status text not null default 'unmatched' check (match_status in ('matched','possible','unmatched','manual')),
  match_score integer not null default 0 check (match_score between 0 and 100),
  match_reason text,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_customers_state_idx on public.crm_customers(state);
create index if not exists crm_customers_temperature_idx on public.crm_customers(temperature);
create index if not exists crm_customers_advisor_idx on public.crm_customers(advisor_user_id);
create index if not exists crm_customers_next_action_due_idx on public.crm_customers(next_action_due);
create index if not exists crm_customers_phone_norm_idx on public.crm_customers(phone_norm);
create index if not exists crm_customers_email_lower_idx on public.crm_customers(lower(email));
create index if not exists crm_actions_due_open_idx on public.crm_actions(due_at) where status = 'open';
create index if not exists crm_actions_customer_idx on public.crm_actions(customer_id);
create index if not exists crm_activities_customer_time_idx on public.crm_activities(customer_id, occurred_at desc);
create index if not exists crm_appointments_time_idx on public.crm_appointments(appointment_at);
create index if not exists crm_orders_match_status_idx on public.crm_orders(match_status);
create index if not exists crm_orders_customer_idx on public.crm_orders(customer_id);
create index if not exists crm_orders_phone_norm_idx on public.crm_orders(phone_norm);
create index if not exists crm_orders_email_lower_idx on public.crm_orders(lower(email));

alter table public.crm_customers enable row level security;
alter table public.crm_content_assets enable row level security;
alter table public.crm_actions enable row level security;
alter table public.crm_activities enable row level security;
alter table public.crm_appointments enable row level security;
alter table public.crm_order_imports enable row level security;
alter table public.crm_orders enable row level security;

revoke all on public.crm_customers from anon;
revoke all on public.crm_content_assets from anon;
revoke all on public.crm_actions from anon;
revoke all on public.crm_activities from anon;
revoke all on public.crm_appointments from anon;
revoke all on public.crm_order_imports from anon;
revoke all on public.crm_orders from anon;

grant select, insert, update, delete on public.crm_customers to authenticated;
grant select, insert, update, delete on public.crm_content_assets to authenticated;
grant select, insert, update, delete on public.crm_actions to authenticated;
grant select, insert, update, delete on public.crm_activities to authenticated;
grant select, insert, update, delete on public.crm_appointments to authenticated;
grant select, insert, update, delete on public.crm_order_imports to authenticated;
grant select, insert, update, delete on public.crm_orders to authenticated;

create policy "crm staff customers" on public.crm_customers for all to authenticated
using (coalesce(auth.jwt()->'app_metadata'->>'role','') in ('employee','admin','super_admin'))
with check (coalesce(auth.jwt()->'app_metadata'->>'role','') in ('employee','admin','super_admin'));
create policy "crm staff content assets" on public.crm_content_assets for all to authenticated
using (coalesce(auth.jwt()->'app_metadata'->>'role','') in ('employee','admin','super_admin'))
with check (coalesce(auth.jwt()->'app_metadata'->>'role','') in ('employee','admin','super_admin'));
create policy "crm staff actions" on public.crm_actions for all to authenticated
using (coalesce(auth.jwt()->'app_metadata'->>'role','') in ('employee','admin','super_admin'))
with check (coalesce(auth.jwt()->'app_metadata'->>'role','') in ('employee','admin','super_admin'));
create policy "crm staff activities" on public.crm_activities for all to authenticated
using (coalesce(auth.jwt()->'app_metadata'->>'role','') in ('employee','admin','super_admin'))
with check (coalesce(auth.jwt()->'app_metadata'->>'role','') in ('employee','admin','super_admin'));
create policy "crm staff appointments" on public.crm_appointments for all to authenticated
using (coalesce(auth.jwt()->'app_metadata'->>'role','') in ('employee','admin','super_admin'))
with check (coalesce(auth.jwt()->'app_metadata'->>'role','') in ('employee','admin','super_admin'));
create policy "crm staff order imports" on public.crm_order_imports for all to authenticated
using (coalesce(auth.jwt()->'app_metadata'->>'role','') in ('employee','admin','super_admin'))
with check (coalesce(auth.jwt()->'app_metadata'->>'role','') in ('employee','admin','super_admin'));
create policy "crm staff orders" on public.crm_orders for all to authenticated
using (coalesce(auth.jwt()->'app_metadata'->>'role','') in ('employee','admin','super_admin'))
with check (coalesce(auth.jwt()->'app_metadata'->>'role','') in ('employee','admin','super_admin'));
