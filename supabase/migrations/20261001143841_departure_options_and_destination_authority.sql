-- Additive catalog change. NULL denotes a pre-options package; old records and
-- demo destinations are preserved. Bookings remain the existing tab-local
-- simulated ledger and snapshot these options in the application boundary.
alter table public.packages add column departure_options jsonb;

create function public.enforce_package_departure_options()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  option jsonb;
  ids text[] := '{}';
  option_id text;
  min_price integer;
  submitted boolean := new.status not in ('DRAFT','REJECTED');
begin
  if tg_op = 'UPDATE' and old.status not in ('DRAFT','REJECTED')
    and new.departure_options is distinct from old.departure_options then
    raise exception 'Perubahan titik keberangkatan paket disetujui memerlukan draf baru.';
  end if;
  if new.departure_options is null then return new; end if;
  if jsonb_typeof(new.departure_options) is distinct from 'array' then
    raise exception 'Titik keberangkatan wajib berupa daftar.';
  end if;
  if submitted and jsonb_array_length(new.departure_options) = 0 then
    raise exception 'Tambahkan minimal satu titik keberangkatan sebelum submit.';
  end if;
  for option in select value from jsonb_array_elements(new.departure_options) loop
    if jsonb_typeof(option) is distinct from 'object'
      or jsonb_typeof(option -> 'id') is distinct from 'string'
      or coalesce(trim(option ->> 'id'),'') = ''
      or jsonb_typeof(option -> 'areaLabel') is distinct from 'string'
      or jsonb_typeof(option -> 'meetingPointLabel') is distinct from 'string'
      or jsonb_typeof(option -> 'departureTimeLabel') is distinct from 'string'
      or jsonb_typeof(option -> 'pricePerPerson') is distinct from 'number'
      or (option ->> 'pricePerPerson') !~ '^\d+$'
      or (option ->> 'pricePerPerson')::numeric > 2147483647 then
      raise exception 'Format titik keberangkatan atau harga tidak valid.';
    end if;
    option_id := option ->> 'id';
    if option_id = any(ids) then raise exception 'ID titik keberangkatan wajib unik.'; end if;
    ids := array_append(ids, option_id);
    if submitted and (trim(option ->> 'areaLabel') = ''
      or trim(option ->> 'meetingPointLabel') = ''
      or trim(option ->> 'departureTimeLabel') = ''
      or (option ->> 'pricePerPerson')::integer <= 0) then
      raise exception 'Lengkapi area, titik kumpul, waktu, dan harga positif sebelum submit.';
    end if;
    if (option ->> 'pricePerPerson')::integer > 0 then
      min_price := least(min_price, (option ->> 'pricePerPerson')::integer);
    end if;
  end loop;
  -- Compatibility summary, never the selected Traveler price.
  new.customer_price := coalesce(min_price, 0);
  return new;
end; $$;

create trigger enforce_package_departure_options
before insert or update on public.packages
for each row execute function public.enforce_package_departure_options();
revoke all on function public.enforce_package_departure_options() from public, anon, authenticated;

-- Keep existing ownership/LIVE-only read policies. No extra write grants.
-- This also guards SECURITY DEFINER registration/approval paths from the old UI.
create function public.enforce_destination_admin_authority()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare
  admin_actor boolean := exists (
    select 1 from public.partner_profiles p where p.auth_user_id = auth.uid() and p.role = 'ADMIN'
  );
begin
  -- Direct database operations by the trusted team have no end-user JWT.
  if auth.role() is null or admin_actor then return new; end if;
  if tg_table_name = 'destinations' then
    raise exception 'Destinasi hanya dapat ditambahkan oleh tim/Admin JedaIn.';
  end if;
  if new.role = 'DESTINATION' then
    if tg_op = 'INSERT' then
      raise exception 'Pendaftaran destinasi mandiri sudah ditutup.';
    end if;
    if old.status <> 'APPROVED' and (
      new.status = 'APPROVED' or new.account_issue_token is distinct from old.account_issue_token
    ) then
      raise exception 'Destinasi wajib diverifikasi tim/Admin sebelum aktivasi.';
    end if;
  end if;
  return new;
end; $$;

create trigger enforce_destination_admin_creation
before insert on public.destinations
for each row execute function public.enforce_destination_admin_authority();
create trigger enforce_destination_application_authority
before insert or update on public.partner_applications
for each row execute function public.enforce_destination_admin_authority();
revoke all on function public.enforce_destination_admin_authority() from public, anon, authenticated;
