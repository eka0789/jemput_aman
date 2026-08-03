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
