-- Run against the migrated prototype database as the trusted SQL executor.
-- All QA rows are rolled back; existing destinations/accounts are untouched.
begin;
do $$
declare
  owner_id text;
  owner_uid uuid;
  destination_id text;
  qa_id text := 'qa_departure_' || gen_random_uuid()::text;
  actual_price integer;
  rejected boolean;
  departures jsonb := '[{"id":"malang","areaLabel":"Malang","meetingPointLabel":"Alun-Alun","departureTimeLabel":"07.00 WIB","pricePerPerson":249000},{"id":"surabaya","areaLabel":"Surabaya","meetingPointLabel":"Gubeng","departureTimeLabel":"05.00 WIB","pricePerPerson":451400}]';
begin
  select id, auth_user_id into owner_id, owner_uid from public.partner_profiles where role='EO' and auth_user_id is not null limit 1;
  select id into destination_id from public.destinations where status='ACTIVE' and guide_ready limit 1;
  if owner_uid is null or destination_id is null then raise exception 'QA requires an existing linked EO and active destination.'; end if;
  perform set_config('jedain.qa_package',qa_id,true);
  perform set_config('jedain.qa_eo_uid',owner_uid::text,true);
  perform set_config('jedain.qa_eo_id',owner_id,true);
  insert into public.packages(id,eo_id,eo_display_name,destination_id,title,duration_label,guide_status,guide_source,departure_options,customer_price)
    values (qa_id,owner_id,'QA',destination_id,'Rollback departure QA','1 hari','CERTIFIED_GUIDE','DESTINATION',departures,1);
  select customer_price into actual_price from public.packages where id=qa_id;
  if actual_price <> 249000 then raise exception 'Minimum price summary failed.'; end if;
  -- Partial drafts remain saveable, but the database blocks incomplete submit.
  update public.packages set departure_options='[]' where id=qa_id;
  rejected := false;
  begin
    update public.packages set status='PENDING_ADMIN_REVIEW' where id=qa_id;
  exception when raise_exception then rejected:=true; end;
  if not rejected then raise exception 'Empty departure submission was accepted.'; end if;
  update public.packages set departure_options=jsonb_set(departures,'{0,pricePerPerson}','0') where id=qa_id;
  rejected := false;
  begin
    update public.packages set status='PENDING_ADMIN_REVIEW' where id=qa_id;
  exception when raise_exception then rejected:=true; end;
  if not rejected then raise exception 'Zero-price submission was accepted.'; end if;
  rejected := false;
  begin
    update public.packages set departure_options=jsonb_build_array(departures->0,departures->0) where id=qa_id;
  exception when raise_exception then rejected:=true; end;
  if not rejected then raise exception 'Duplicate IDs were accepted.'; end if;
  update public.packages set departure_options=departures,status='PENDING_ADMIN_REVIEW' where id=qa_id;
  update public.packages set status='APPROVED' where id=qa_id;
  update public.packages set status='LIVE' where id=qa_id;
  rejected := false;
  begin
    update public.packages set departure_options=jsonb_set(departures,'{1,pricePerPerson}','500000') where id=qa_id;
  exception when raise_exception then rejected:=true; end;
  if not rejected then raise exception 'LIVE material edit was accepted.'; end if;
  -- Legacy rows remain compatible; they do not invent new departure labels.
  insert into public.packages(id,eo_id,eo_display_name,destination_id,title,duration_label,guide_status,guide_source,customer_price)
    values (qa_id||'_legacy',owner_id,'QA',destination_id,'Rollback legacy QA','1 hari','CERTIFIED_GUIDE','DESTINATION',300000);
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',owner_uid)::text,true);
  rejected := false;
  begin
    insert into public.partner_applications(partner_id,auth_user_id,role,email,payload)
      values(qa_id,owner_uid,'DESTINATION','qa@example.test','{}');
  exception when raise_exception then rejected:=true; end;
  if not rejected then raise exception 'Self-registration was accepted.'; end if;
  perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  rejected := false;
  begin
    insert into public.destinations(id,name,location_label,province,city)
      values(qa_id,'QA','QA','QA','QA');
  exception when raise_exception then rejected:=true; end;
  if not rejected then raise exception 'Old service approval path created a destination.'; end if;
end; $$;

-- Verify existing ownership and LIVE-only policies as actual API roles.
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',current_setting('jedain.qa_eo_uid'))::text,true);
set local role authenticated;
do $$
declare observed integer;
begin
  select count(*) into observed from public.packages where id in (current_setting('jedain.qa_package'),current_setting('jedain.qa_package')||'_legacy');
  if observed<>2 then raise exception 'EO cannot read own LIVE and draft rows.'; end if;
end; $$;
reset role;
select set_config('request.jwt.claims','{"role":"anon"}',true);
set local role anon;
do $$
declare observed integer;
begin
  select count(*) into observed from public.packages where id in (current_setting('jedain.qa_package'),current_setting('jedain.qa_package')||'_legacy');
  if observed<>1 then raise exception 'Public read exposed a non-LIVE draft or hid the LIVE package.'; end if;
end; $$;
reset role;
select set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',gen_random_uuid())::text,true);
set local role authenticated;
do $$
declare changed integer;
begin
  update public.packages set title='Unauthorized' where id=current_setting('jedain.qa_package')||'_legacy';
  get diagnostics changed=row_count;
  if changed<>0 then raise exception 'An unrelated user edited another EO package.'; end if;
end; $$;
reset role;
rollback;
select 'PASS: departure validation, legacy compatibility, destination authority, ownership and LIVE-only reads; all QA rows rolled back' as result;
