create table if not exists public.schools (
  id text primary key,
  foundation_id text,
  name text not null,
  code text not null unique,
  city text,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

create table if not exists public.app_users (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  role text not null,
  full_name text not null,
  email text,
  phone_number text,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  parent_id text references public.app_users(id) on delete set null,
  full_name text not null,
  class_name text,
  student_number text,
  photo_url text,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

create table if not exists public.pickup_persons (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  parent_id text references public.app_users(id) on delete set null,
  full_name text not null,
  relationship text,
  phone_number text,
  photo_url text,
  status text not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

create table if not exists public.nfc_cards (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  pickup_person_id text references public.pickup_persons(id) on delete set null,
  card_uid text not null,
  status text not null default 'ACTIVE',
  issued_at timestamptz not null default now(),
  unique (school_id, card_uid)
);

create table if not exists public.authorizations (
  id text primary key,
  student_id text not null references public.students(id) on delete cascade,
  pickup_person_id text not null references public.pickup_persons(id) on delete cascade,
  is_active boolean not null default true,
  unique (student_id, pickup_person_id)
);

create table if not exists public.weekly_schedules (
  id text primary key,
  student_id text not null references public.students(id) on delete cascade,
  pickup_person_id text not null references public.pickup_persons(id) on delete cascade,
  day_of_week text not null,
  unique (student_id, pickup_person_id, day_of_week)
);

create table if not exists public.pickup_logs (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  student_id text,
  student_name text not null,
  pickup_person_id text,
  pickup_person_name text not null,
  nfc_card_id text,
  duty_teacher_id text,
  verification_method text not null,
  status text not null,
  "timestamp" timestamptz not null default now(),
  notes text not null default '',
  verification_photo text
);

create table if not exists public.emergency_otps (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  student_id text not null references public.students(id) on delete cascade,
  student_name text not null,
  pickup_person_id text not null references public.pickup_persons(id) on delete cascade,
  pickup_person_name text not null,
  otp_code text not null,
  status text not null default 'PENDING',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_students_school on public.students(school_id);
create index if not exists idx_pickup_persons_school on public.pickup_persons(school_id);
create index if not exists idx_nfc_cards_lookup on public.nfc_cards(school_id, card_uid);
create index if not exists idx_pickup_logs_school_time on public.pickup_logs(school_id, "timestamp" desc);
create index if not exists idx_emergency_otps_school_status on public.emergency_otps(school_id, status);

alter table public.schools enable row level security;
alter table public.app_users enable row level security;
alter table public.students enable row level security;
alter table public.pickup_persons enable row level security;
alter table public.nfc_cards enable row level security;
alter table public.authorizations enable row level security;
alter table public.weekly_schedules enable row level security;
alter table public.pickup_logs enable row level security;
alter table public.emergency_otps enable row level security;

grant select, insert, update, delete on all tables in schema public to service_role;

insert into public.schools (id, foundation_id, name, code, city, status) values
  ('1001-tk-ceria-salatiga', 'found-01', 'PAUD/TK Ceria Salatiga', 'TK-SALATIGA-01', 'Salatiga', 'ACTIVE'),
  ('1002-tk-harapan-semarang', 'found-01', 'TK Harapan Bangsa Semarang', 'TK-SEMARANG-02', 'Semarang', 'ACTIVE')
on conflict (id) do nothing;

insert into public.app_users (id, school_id, role, full_name, email, phone_number) values
  ('usr-admin-1', '1001-tk-ceria-salatiga', 'ADMIN', 'Ibu Ratna S.Pd (Admin)', 'admin@tkceria-salatiga.sch.id', '081122334455'),
  ('usr-teacher-1', '1001-tk-ceria-salatiga', 'TEACHER', 'Pak Ahmad (Guru Piket)', 'ahmad@tkceria-salatiga.sch.id', '081122334456'),
  ('usr-parent-1', '1001-tk-ceria-salatiga', 'PARENT', 'Ibu Dewi Kurnia (Orang Tua)', 'dewi@gmail.com', '081234567890'),
  ('usr-foundation-1', '1001-tk-ceria-salatiga', 'FOUNDATION', 'Drs. H. Bambang', 'bambang@yayasan.org', '081999888777')
on conflict (id) do nothing;

insert into public.students (id, school_id, parent_id, full_name, class_name, student_number, photo_url, status) values
  ('1111', '1001-tk-ceria-salatiga', 'usr-parent-1', 'Ananda Bintang', 'TK-A1', 'NIS-2025-014', 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150', 'ACTIVE'),
  ('1112', '1001-tk-ceria-salatiga', 'usr-parent-1', 'Siti Rahma', 'TK-B2', 'NIS-2024-089', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150', 'ACTIVE')
on conflict (id) do nothing;

insert into public.pickup_persons (id, school_id, parent_id, full_name, relationship, phone_number, photo_url, status) values
  ('2222', '1001-tk-ceria-salatiga', 'usr-parent-1', 'Budi Santoso', 'Ayah Kandung', '081234567890', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'ACTIVE'),
  ('2223', '1001-tk-ceria-salatiga', 'usr-parent-1', 'Pak Joko', 'Supir Keluarga', '081987654321', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', 'ACTIVE')
on conflict (id) do nothing;

insert into public.nfc_cards (id, school_id, pickup_person_id, card_uid, status, issued_at) values
  ('card-001', '1001-tk-ceria-salatiga', '2222', '04:A2:8B:12:FE:67:80', 'ACTIVE', '2026-01-10T08:00:00Z'),
  ('card-002', '1001-tk-ceria-salatiga', '2223', '04:B3:9C:23:FF:78:91', 'ACTIVE', '2026-01-15T08:00:00Z'),
  ('card-lost', '1001-tk-ceria-salatiga', null, '99:99:99:99:99:99:99', 'LOST', '2025-12-01T08:00:00Z')
on conflict (id) do nothing;

insert into public.authorizations (id, student_id, pickup_person_id, is_active) values
  ('auth-1', '1111', '2222', true),
  ('auth-2', '1111', '2223', true),
  ('auth-3', '1112', '2222', true)
on conflict (id) do nothing;

insert into public.weekly_schedules (id, student_id, pickup_person_id, day_of_week) values
  ('sch-1', '1111', '2222', 'MON'),
  ('sch-2', '1111', '2222', 'TUE'),
  ('sch-3', '1111', '2222', 'WED'),
  ('sch-4', '1111', '2223', 'THU'),
  ('sch-5', '1111', '2223', 'FRI')
on conflict (id) do nothing;
