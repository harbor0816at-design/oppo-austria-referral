create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into public.profiles(id,email,first_name,last_name,phone,country,language,status)
  values(
    new.id,
    coalesce(new.email,''),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'country','AT'),
    coalesce(new.raw_user_meta_data->>'language','de'),
    'pending'
  )
  on conflict(id) do nothing;
  return new;
end;
$function$;
