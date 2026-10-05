alter table public.user_agreements
  alter column signature_path drop not null;

alter table public.user_agreements
  add column if not exists signing_method text not null default 'electronic',
  add column if not exists paper_status text,
  add column if not exists paper_received_at timestamptz,
  add column if not exists completed_at timestamptz;

alter table public.user_agreements
  drop constraint if exists user_agreements_status_check;
alter table public.user_agreements
  add constraint user_agreements_status_check
  check (status in ('paper_requested','paper_received','submitted','approved','rejected','superseded'));

alter table public.user_agreements
  drop constraint if exists user_agreements_signing_method_check;
alter table public.user_agreements
  add constraint user_agreements_signing_method_check
  check (signing_method in ('electronic','paper'));

alter table public.user_agreements
  drop constraint if exists user_agreements_paper_status_check;
alter table public.user_agreements
  add constraint user_agreements_paper_status_check
  check (paper_status is null or paper_status in ('requested','received','completed'));

drop index if exists public.user_agreements_one_active_submission;
create unique index user_agreements_one_active_submission
on public.user_agreements(user_id, template_id)
where status in ('paper_requested','paper_received','submitted','approved');

alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check
check (status in ('active','blocked','pending','agreement_pending','agreement_rejected','rejected'));
