-- Jalankan di Supabase SQL Editor.
-- Script ini hanya memastikan profil login ADMIN dan FOUNDATION tersedia.
-- Password dan PIN TIDAK disimpan di database; keduanya tetap berupa hash
-- pada Vercel Environment Variables.

begin;

insert into public.app_users (
  id,
  school_id,
  role,
  full_name,
  email,
  phone_number
) values
  (
    'usr-admin-1',
    '1001-tk-ceria-salatiga',
    'ADMIN',
    'Ibu Ratna S.Pd (Admin)',
    'admin@tkceria-salatiga.sch.id',
    '081122334455'
  ),
  (
    'usr-foundation-1',
    '1001-tk-ceria-salatiga',
    'FOUNDATION',
    'Drs. H. Bambang (Yayasan Pendidikan)',
    'bambang@yayasan.org',
    '081999888777'
  )
on conflict (id) do update set
  school_id = excluded.school_id,
  role = excluded.role,
  full_name = excluded.full_name,
  email = excluded.email,
  phone_number = excluded.phone_number;

do $$
declare
  valid_account_count integer;
begin
  select count(*)
    into valid_account_count
  from public.app_users
  where
    (id = 'usr-admin-1'
      and lower(email) = 'admin@tkceria-salatiga.sch.id'
      and role = 'ADMIN')
    or
    (id = 'usr-foundation-1'
      and lower(email) = 'bambang@yayasan.org'
      and role = 'FOUNDATION');

  if valid_account_count <> 2 then
    raise exception 'Verifikasi akun gagal: profil ADMIN dan FOUNDATION belum lengkap';
  end if;
end
$$;

commit;

select
  id,
  school_id,
  role,
  full_name,
  email,
  case
    when role in ('ADMIN', 'FOUNDATION') then 'SIAP_LOGIN'
    else 'ROLE_TIDAK_VALID'
  end as verification_status
from public.app_users
where id in ('usr-admin-1', 'usr-foundation-1')
order by role;
