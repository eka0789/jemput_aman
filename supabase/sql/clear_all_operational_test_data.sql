-- Destructive reset for a school installation that has not gone live yet.
-- Keeps schools and app_users so administrators can still sign in.
begin;

delete from public.report_export_events;
delete from public.emergency_otps;
delete from public.pickup_logs;
delete from public.weekly_schedules;
delete from public.authorizations;
delete from public.nfc_cards;
delete from public.pickup_persons;
delete from public.students;
delete from public.api_rate_limits;

commit;
