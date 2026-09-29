-- Migration: 20260929010000_allow_cancelling_overcapacity_sessions.sql
-- Purpose: Allow cancelling legacy or over-capacity sessions while strictly enforcing
-- destination capacity maximums and schedule conflict invariance for active sessions.
--
-- Security & Operational Rules:
-- 1. Basic sanity (capacity >= 1, end_at > start_at) still enforced for all rows.
-- 2. Destination capacity maximum (capacity <= destination.capacity_per_session) is only
--    enforced when NEW.status <> 'CANCELLED'.
-- 3. Schedule conflict overlap check is only enforced when NEW.status <> 'CANCELLED'.
-- 4. Fixed search_path (public, pg_temp) and SECURITY DEFINER maintained.
-- 5. Revoke EXECUTE from public, anon, and authenticated maintained.

create or replace function public.enforce_session_destination_rules()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_destination_id text;
  v_destination_name text;
  v_capacity_limit integer;
  v_conflict_id text;
  v_conflict_start timestamptz;
  v_conflict_end timestamptz;
begin
  -- 1. Input sanity check (structural validity)
  if NEW.capacity is null or NEW.capacity < 1 then
    raise exception 'Kapasitas peserta minimal 1 orang.'
      using errcode = 'check_violation';
  end if;

  if NEW.start_at is null or NEW.end_at is null or NEW.end_at <= NEW.start_at then
    raise exception 'Waktu selesai sesi harus setelah waktu mulai.'
      using errcode = 'check_violation';
  end if;

  -- 2. Resolve destination from package
  select p.destination_id
  into v_destination_id
  from public.packages p
  where p.id = NEW.package_id;

  if v_destination_id is null then
    raise exception 'Paket tidak ditemukan atau tidak memiliki destinasi valid.'
      using errcode = 'foreign_key_violation';
  end if;

  -- 3. Lock destination row to serialize concurrent scheduling transactions for this destination
  select d.name, d.capacity_per_session
  into v_destination_name, v_capacity_limit
  from public.destinations d
  where d.id = v_destination_id
  for update;

  if v_capacity_limit is null then
    raise exception 'Destinasi live tidak ditemukan di sistem.'
      using errcode = 'foreign_key_violation';
  end if;

  -- 4. Capacity ceiling and schedule overlap invariance only apply to active sessions
  -- (OPEN, FULL, CLOSED). CANCELLED sessions are exempt from capacity ceiling and do not block schedule.
  if NEW.status is distinct from 'CANCELLED' then
    -- Enforce authoritative destination capacity limit
    if NEW.capacity > v_capacity_limit then
      raise exception 'Kapasitas sesi (%) melebihi batas maksimal destinasi % (% orang).',
        NEW.capacity,
        coalesce(v_destination_name, v_destination_id),
        v_capacity_limit
        using errcode = 'check_violation';
    end if;

    -- Enforce schedule conflict invariance across all packages & EOs for the same destination
    -- Interval semantics: [start_at, end_at)
    -- Overlap condition: new.start_at < existing.end_at AND new.end_at > existing.start_at
    -- Blocking statuses: OPEN, FULL, CLOSED
    select s.id, s.start_at, s.end_at
    into v_conflict_id, v_conflict_start, v_conflict_end
    from public.sessions s
    join public.packages p on p.id = s.package_id
    where p.destination_id = v_destination_id
      and s.id <> coalesce(NEW.id, '')
      and s.status <> 'CANCELLED'
      and tstzrange(s.start_at, s.end_at, '[)') && tstzrange(NEW.start_at, NEW.end_at, '[)')
    limit 1;

    if v_conflict_id is not null then
      raise exception 'Destinasi % sudah memiliki sesi terjadwal pada kurun waktu % - % (sesi %).',
        coalesce(v_destination_name, v_destination_id),
        to_char(v_conflict_start at time zone 'Asia/Jakarta', 'DD Mon YYYY, HH24.MI') || ' WIB',
        to_char(v_conflict_end at time zone 'Asia/Jakarta', 'HH24.MI') || ' WIB',
        v_conflict_id
        using errcode = 'exclusion_violation';
    end if;
  end if;

  return NEW;
end;
$$;

-- Security hardening: ensure direct RPC execution is revoked
revoke execute on function public.enforce_session_destination_rules() from public, anon, authenticated;