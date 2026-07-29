do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'nfc_cards_status_check'
  ) then
    alter table public.nfc_cards
      add constraint nfc_cards_status_check
      check (status in ('ACTIVE', 'INACTIVE', 'LOST'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'pickup_logs_status_check'
  ) then
    alter table public.pickup_logs
      add constraint pickup_logs_status_check
      check (status in ('PENDING_PHOTO', 'VERIFIED', 'OUT_OF_SCHEDULE', 'BLOCKED'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'emergency_otps_status_check'
  ) then
    alter table public.emergency_otps
      add constraint emergency_otps_status_check
      check (status in ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'));
  end if;
end $$;

create unique index if not exists weekly_schedules_one_person_per_day
  on public.weekly_schedules(student_id, day_of_week);

insert into storage.buckets (id, name, public)
values ('images', 'images', false)
on conflict (id) do update set public = false;
