create table if not exists public.api_rate_limits (
  bucket_key text primary key,
  request_count integer not null check (request_count > 0),
  reset_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table public.api_rate_limits enable row level security;
revoke all on table public.api_rate_limits from anon, authenticated;

create or replace function public.check_api_rate_limit(
  p_key text,
  p_window_seconds integer,
  p_max integer
)
returns table (allowed boolean, retry_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
  current_reset timestamptz;
begin
  if p_key is null or length(p_key) > 300 or p_window_seconds < 1 or p_max < 1 then
    raise exception 'Invalid rate-limit parameters';
  end if;

  insert into public.api_rate_limits as limits (bucket_key, request_count, reset_at, updated_at)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds), now())
  on conflict (bucket_key) do update
  set request_count = case
        when limits.reset_at <= now() then 1
        else limits.request_count + 1
      end,
      reset_at = case
        when limits.reset_at <= now() then now() + make_interval(secs => p_window_seconds)
        else limits.reset_at
      end,
      updated_at = now()
  returning request_count, reset_at into current_count, current_reset;

  return query select
    current_count <= p_max,
    greatest(1, ceil(extract(epoch from (current_reset - now())))::integer);
end;
$$;

revoke all on function public.check_api_rate_limit(text, integer, integer) from public;
grant execute on function public.check_api_rate_limit(text, integer, integer) to service_role;

create or replace function public.replace_weekly_schedule(
  p_student_id text,
  p_schedules jsonb
)
returns setof public.weekly_schedules
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_student_id is null or jsonb_typeof(p_schedules) <> 'array' then
    raise exception 'Invalid weekly schedule payload';
  end if;

  delete from public.weekly_schedules where student_id = p_student_id;

  insert into public.weekly_schedules (id, student_id, pickup_person_id, day_of_week)
  select
    'sch-' || replace(gen_random_uuid()::text, '-', ''),
    p_student_id,
    item.pickup_person_id,
    item.day_of_week
  from jsonb_to_recordset(p_schedules) as item(pickup_person_id text, day_of_week text);

  return query
    select * from public.weekly_schedules
    where student_id = p_student_id
    order by day_of_week;
end;
$$;

revoke all on function public.replace_weekly_schedule(text, jsonb) from public;
grant execute on function public.replace_weekly_schedule(text, jsonb) to service_role;

-- Keep this technical table bounded without affecting the 60-day audit policy.
create index if not exists api_rate_limits_updated_at_idx
  on public.api_rate_limits (updated_at);
