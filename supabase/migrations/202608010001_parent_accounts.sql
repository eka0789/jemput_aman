alter table public.app_users
  add column if not exists password_hash text;

create unique index if not exists app_users_email_unique
  on public.app_users (lower(email))
  where email is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'app_users_role_check'
  ) then
    alter table public.app_users
      add constraint app_users_role_check
      check (role in ('ADMIN', 'TEACHER', 'PARENT', 'FOUNDATION'));
  end if;
end $$;
