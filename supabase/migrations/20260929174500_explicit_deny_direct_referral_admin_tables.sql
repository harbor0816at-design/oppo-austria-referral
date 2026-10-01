create policy referrals_deny_direct_access
on public.referrals
for all
to anon, authenticated
using (false)
with check (false);

create policy audit_logs_deny_direct_access
on public.audit_logs
for all
to anon, authenticated
using (false)
with check (false);
