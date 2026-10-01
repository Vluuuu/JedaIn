-- Contact email stays private on the application; login credentials are issued
-- by the authenticated Edge Function. No plaintext password is stored here.
alter table public.partner_applications
  add column account_email text check (account_email ~ '^(to|destinasi)-[0-9a-f-]{36}@jedain\.biz\.id$'),
  add column account_issued_at timestamptz,
  add column account_issue_token uuid,
  add column account_issue_started_at timestamptz;

create function public.begin_partner_account_issue(p_application_id uuid, p_actor_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare app public.partner_applications; token uuid := gen_random_uuid();
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Penerbitan akun hanya melalui server.'; end if;
  select * into app from public.partner_applications where id = p_application_id and auth_user_id = p_actor_id for update;
  if not found or app.status not in ('PENDING_REVIEW','APPROVED') then raise exception 'Pengajuan tidak dapat diterbitkan.'; end if;
  if app.account_issue_token is not null and app.account_issue_started_at > now() - interval '2 minutes' then
    raise exception 'Penerbitan akun sedang diproses. Coba lagi sebentar.';
  end if;
  update public.partner_applications set account_issue_token = token, account_issue_started_at = now() where id = app.id;
  return token;
end; $$;

create function public.finish_partner_account_issue(p_application_id uuid, p_actor_id uuid, p_issue_token uuid, p_account_email text)
returns public.partner_applications language plpgsql security definer set search_path = '' as $$
declare app public.partner_applications; d jsonb; expected_email text;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Penerbitan akun hanya melalui server.'; end if;
  select * into app from public.partner_applications where id = p_application_id and auth_user_id = p_actor_id for update;
  if not found or app.account_issue_token is distinct from p_issue_token or p_issue_token is null
    or app.account_issue_started_at < now() - interval '2 minutes' or app.status not in ('PENDING_REVIEW','APPROVED') then
    raise exception 'Penerbitan akun kedaluwarsa. Coba lagi.';
  end if;
  expected_email := (case when app.role = 'EO' then 'to-' else 'destinasi-' end) || app.id::text || '@jedain.biz.id';
  if p_account_email is distinct from expected_email or not exists (
    select 1 from auth.users u where u.id = app.auth_user_id and lower(u.email) = expected_email
  ) or not exists (
    select 1 from public.partner_profiles p where p.id = app.partner_id and p.auth_user_id = app.auth_user_id and p.role = app.role
  ) then raise exception 'Akun dan profil mitra belum terverifikasi.'; end if;
  d := app.payload;
  if app.role = 'DESTINATION' and app.status <> 'APPROVED' then
    if (d ->> 'guideReady') is distinct from 'true' or not exists (
      select 1 from storage.objects o where o.bucket_id = 'partner-guide-photos'
      and o.name = d #>> '{guideIdentity,photoPath}' and (storage.foldername(o.name))[1] = app.auth_user_id::text
    ) then raise exception 'Bukti pemandu wajib tersedia sebelum persetujuan demo.'; end if;
    insert into public.destinations(id,partner_id,name,location_label,province,city,guide_ready,
      base_cost_per_person,description,highlights,capacity_per_session,status,local_guide_summary,base_cost_includes,base_cost_excludes)
    values(app.destination_id,app.partner_id,trim(d ->> 'name'),trim(d ->> 'locationLabel'),trim(d ->> 'province'),trim(d ->> 'city'),true,
      (d ->> 'baseCostPerPerson')::integer,d ->> 'description',d -> 'highlights',(d ->> 'capacityPerSession')::integer,'ACTIVE',
      (d #>> '{guideIdentity,fullName}') || ' — ' || (d #>> '{guideIdentity,experience}'),
      coalesce(d -> 'baseCostIncludes','[]'::jsonb),coalesce(d -> 'baseCostExcludes','[]'::jsonb));
  end if;
  update public.partner_profiles set email = expected_email, updated_at = now() where id = app.partner_id;
  update public.partner_applications set status = 'APPROVED', reviewed_at = coalesce(reviewed_at,now()),
    approval_mode = coalesce(approval_mode,'DEMO'), email_notification = 'SIMULATED',
    account_email = expected_email, account_issued_at = now()
    where id = app.id returning * into app;
  return app;
end; $$;

create function public.release_partner_account_issue(p_application_id uuid, p_issue_token uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Penerbitan akun hanya melalui server.'; end if;
  update public.partner_applications set account_issue_token = null, account_issue_started_at = null
    where id = p_application_id and account_issue_token = p_issue_token;
end; $$;

revoke all on function public.begin_partner_account_issue(uuid,uuid), public.finish_partner_account_issue(uuid,uuid,uuid,text),
  public.release_partner_account_issue(uuid,uuid) from public, anon, authenticated;
grant execute on function public.begin_partner_account_issue(uuid,uuid), public.finish_partner_account_issue(uuid,uuid,uuid,text),
  public.release_partner_account_issue(uuid,uuid) to service_role;

-- Older contact/password applicants remain compatible until the frontend is updated.
create or replace function public.approve_partner_application_demo()
returns public.partner_applications
language plpgsql security definer set search_path = '' as $$
declare
  app public.partner_applications;
  d jsonb;
begin
  select * into app from public.partner_applications where auth_user_id = auth.uid() for update;
  if not found then raise exception 'Pengajuan akun ini tidak ditemukan.'; end if;
  if app.payload ->> 'accountProvisioning' = 'PLATFORM' then
    raise exception 'Gunakan persetujuan demo dengan penerbitan akun JedaIn.';
  end if;
  if app.status = 'APPROVED' then return app; end if;
  if app.status <> 'PENDING_REVIEW' then raise exception 'Pengajuan tidak sedang menunggu tinjauan.'; end if;
  d := app.payload;
  if app.role = 'DESTINATION' then
    if (d ->> 'guideReady') is distinct from 'true' or not exists (
      select 1 from storage.objects o where o.bucket_id = 'partner-guide-photos'
      and o.name = d #>> '{guideIdentity,photoPath}' and (storage.foldername(o.name))[1] = auth.uid()::text
    ) then raise exception 'Bukti pemandu wajib tersedia sebelum persetujuan demo.'; end if;
    insert into public.destinations(id,partner_id,name,location_label,province,city,guide_ready,
      base_cost_per_person,description,highlights,capacity_per_session,status,local_guide_summary,base_cost_includes,base_cost_excludes)
    values(app.destination_id,app.partner_id,trim(d ->> 'name'),trim(d ->> 'locationLabel'),trim(d ->> 'province'),trim(d ->> 'city'),true,
      (d ->> 'baseCostPerPerson')::integer,d ->> 'description',d -> 'highlights',(d ->> 'capacityPerSession')::integer,'ACTIVE',
      (d #>> '{guideIdentity,fullName}') || ' — ' || (d #>> '{guideIdentity,experience}'),
      coalesce(d -> 'baseCostIncludes','[]'::jsonb),coalesce(d -> 'baseCostExcludes','[]'::jsonb));
  end if;
  update public.partner_applications set status = 'APPROVED', reviewed_at = now(), approval_mode = 'DEMO', email_notification = 'SIMULATED'
    where id = app.id returning * into app;
  return app;
end;
$$;
revoke all on function public.approve_partner_application_demo() from public, anon;
grant execute on function public.approve_partner_application_demo() to authenticated;

