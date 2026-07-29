alter table public.pickup_logs
  drop constraint if exists pickup_logs_status_check;

alter table public.pickup_logs
  add constraint pickup_logs_status_check
  check (status in ('PENDING_PHOTO', 'VERIFIED', 'OUT_OF_SCHEDULE', 'BLOCKED'));

update public.pickup_logs
set verification_photo = split_part(
  regexp_replace(
    verification_photo,
    '^https?://[^/]+/storage/v1/object/(public|sign|authenticated)/images/',
    ''
  ),
  '?',
  1
)
where verification_photo ~ '^https?://[^/]+/storage/v1/object/(public|sign|authenticated)/images/';
