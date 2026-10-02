alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check
check (status in ('active','blocked','pending','agreement_pending','agreement_rejected'));

create table if not exists public.agreement_templates (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  title_de text not null default 'OPPO Austria Referral Vereinbarung',
  title_en text not null default 'OPPO Austria Referral Agreement',
  title_zh text not null default 'OPPO Austria 推荐合作协议',
  content_de text not null default '',
  content_en text not null default '',
  content_zh text not null default '',
  active boolean not null default true,
  required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_agreements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null references public.agreement_templates(id) on delete restrict,
  template_version text not null,
  title_snapshot text not null,
  content_snapshot text not null,
  signer_name text not null,
  signer_email text not null,
  signature_path text not null,
  status text not null default 'submitted'
    check (status in ('submitted','approved','rejected','superseded')),
  signed_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  content_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_agreements_one_active_submission
on public.user_agreements(user_id, template_id)
where status in ('submitted','approved');

create index if not exists idx_user_agreements_user on public.user_agreements(user_id);
create index if not exists idx_user_agreements_status on public.user_agreements(status);

alter table public.agreement_templates enable row level security;
alter table public.user_agreements enable row level security;
revoke all on public.agreement_templates from anon, authenticated;
revoke all on public.user_agreements from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('agreement-signatures','agreement-signatures',false,2097152,array['image/png'])
on conflict (id) do update
set public=false,
    file_size_limit=excluded.file_size_limit,
    allowed_mime_types=excluded.allowed_mime_types;

drop policy if exists "agreement_signature_user_insert" on storage.objects;
drop policy if exists "agreement_signature_admin_read" on storage.objects;

create policy "agreement_signature_user_insert"
on storage.objects for insert
to authenticated
with check (
  bucket_id='agreement-signatures'
  and (storage.foldername(name))[1]=auth.uid()::text
);

create policy "agreement_signature_admin_read"
on storage.objects for select
to authenticated
using (
  bucket_id='agreement-signatures'
  and coalesce(auth.jwt() -> 'app_metadata' ->> 'role','') in ('admin','super_admin')
);

insert into public.agreement_templates (
  version,title_de,title_en,title_zh,content_de,content_en,content_zh,active,required
)
values (
  'v1-placeholder',
  'OPPO Austria Referral Vereinbarung',
  'OPPO Austria Referral Agreement',
  'OPPO Austria 推荐合作协议',
  'Platzhalter: Der endgültige Vertragstext wird vor dem operativen Einsatz ergänzt.',
  'Placeholder: The final agreement text will be added before operational use.',
  '占位模板：正式协议条款将在实际运营前补充。',
  true,true
)
on conflict (version) do update
set active=true,required=true,updated_at=now();

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  notification_key text not null unique,
  notification_type text not null,
  user_id uuid references auth.users(id) on delete set null,
  recipient_email text not null,
  subject text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending','sent','failed','skipped')),
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_notification_logs_type on public.notification_logs(notification_type);
create index if not exists idx_notification_logs_user on public.notification_logs(user_id);
create index if not exists idx_notification_logs_status on public.notification_logs(status);

alter table public.notification_logs enable row level security;
revoke all on public.notification_logs from anon, authenticated;
