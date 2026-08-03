create table if not exists public.report_export_events (
  id text primary key,
  school_id text not null references public.schools(id) on delete cascade,
  format text not null check (format in ('excel', 'pdf')),
  exported_by text,
  exported_at timestamptz not null default now()
);

create index if not exists idx_report_export_events_school_time
  on public.report_export_events(school_id, exported_at desc);

alter table public.report_export_events enable row level security;
grant select, insert, update, delete on public.report_export_events to service_role;
