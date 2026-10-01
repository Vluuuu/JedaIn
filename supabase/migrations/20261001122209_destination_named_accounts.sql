-- Keep existing accounts valid while new destination accounts use the place name.
alter table public.partner_applications drop constraint partner_applications_account_email_check;
alter table public.partner_applications add constraint partner_applications_account_email_check
  check (account_email ~ '^[a-z0-9]+(-[a-z0-9]+)*@jedain\.biz\.id$'
    and length(split_part(account_email,'@',1)) <= 64);

create or replace function public.finish_partner_account_issue(p_application_id uuid, p_actor_id uuid, p_issue_token uuid, p_account_email text)
returns public.partner_applications language plpgsql security definer set search_path = '' as $$
declare app public.partner_applications; d jsonb; expected_email text; name_slug text; fallback_email text;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Penerbitan akun hanya melalui server.'; end if;
  select * into app from public.partner_applications where id = p_application_id and auth_user_id = p_actor_id for update;
  if not found or app.account_issue_token is distinct from p_issue_token or p_issue_token is null
    or app.account_issue_started_at < now() - interval '2 minutes' or app.status not in ('PENDING_REVIEW','APPROVED') then
    raise exception 'Penerbitan akun kedaluwarsa. Coba lagi.';
  end if;
  d := app.payload;
  if app.role = 'EO' then
    expected_email := 'to-' || app.id::text || '@jedain.biz.id';
  else
    name_slug := coalesce(nullif(rtrim(left(trim(both '-' from regexp_replace(lower(trim(d ->> 'name')), '[^a-z0-9]+', '-', 'g')),64),'-'),''),'destinasi');
    expected_email := name_slug || '@jedain.biz.id';
    fallback_email := rtrim(left(name_slug,27),'-') || '-' || app.id::text || '@jedain.biz.id';
    -- The old Edge version can finish during deployment; reissue migrates its UUID address.
    if p_account_email = fallback_email or p_account_email = 'destinasi-' || app.id::text || '@jedain.biz.id'
      or (app.status = 'APPROVED' and p_account_email = app.account_email) then
      expected_email := p_account_email;
    end if;
  end if;
  if p_account_email is distinct from expected_email or not exists (
    select 1 from auth.users u where u.id = app.auth_user_id and lower(u.email) = expected_email
  ) or not exists (
    select 1 from public.partner_profiles p where p.id = app.partner_id and p.auth_user_id = app.auth_user_id and p.role = app.role
  ) then raise exception 'Akun dan profil mitra belum terverifikasi.'; end if;
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

revoke all on function public.finish_partner_account_issue(uuid,uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.finish_partner_account_issue(uuid,uuid,uuid,text) to service_role;
