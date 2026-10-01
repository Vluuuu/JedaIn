-- Prototype guide registration: full name, portrait, domicile and experience.
-- Preserve prior applied migrations and all account, photo and role guards.
create or replace function public.register_partner_application(p_role text, p_payload jsonb)
returns public.partner_applications
language plpgsql security definer set search_path = '' as $$
declare
  uid uuid := auth.uid();
  account_email text := lower(auth.jwt() ->> 'email');
  partner_id text;
  dest_id text;
  field text;
  existing public.partner_applications;
  result public.partner_applications;
begin
  if uid is null or account_email is null or p_role not in ('EO','DESTINATION') then
    raise exception 'Sesi akun pendaftaran tidak valid.';
  end if;
  -- Serialize retries and rejected resubmission for this authenticated account.
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));
  if jsonb_typeof(p_payload) <> 'object' or length(p_payload::text) > 30000
     or lower(trim(p_payload ->> 'email')) is distinct from account_email
     or (p_payload ->> 'agreedToSop') is distinct from 'true' then
    raise exception 'Email akun dan persetujuan SOP wajib sesuai.';
  end if;
  foreach field in array array['contactPerson','phone','city','province'] loop
    if coalesce(trim(p_payload ->> field),'') = '' then raise exception 'Lengkapi identitas dan kontak pengajuan.'; end if;
  end loop;
  if p_role = 'EO' then
    if coalesce(trim(p_payload ->> 'businessName'),'') = ''
      or coalesce(trim(p_payload ->> 'experienceDescription'),'') = ''
      or coalesce(p_payload ->> 'guideStatus','') not in ('CERTIFIED_GUIDE','CONCEPT_ONLY')
      or coalesce(p_payload ->> 'yearsOfOperation','') !~ '^\d+$' then
      raise exception 'Lengkapi informasi usaha, pengalaman, dan kategori pemandu.';
    end if;
  else
    foreach field in array array['name','managementName','locationLabel','description'] loop
      if coalesce(trim(p_payload ->> field),'') = '' then raise exception 'Lengkapi informasi destinasi dan bukti pemandu.'; end if;
    end loop;
    if (p_payload ->> 'guideReady') is distinct from 'true'
      or coalesce(p_payload ->> 'capacityPerSession','') !~ '^[1-9]\d*$'
      or coalesce(p_payload ->> 'baseCostPerPerson','') !~ '^[1-9]\d*$'
      or jsonb_typeof(p_payload -> 'highlights') is distinct from 'array' then
      raise exception 'Pemandu, kapasitas, biaya dasar, dan fasilitas wajib valid.';
    end if;
    if jsonb_array_length(p_payload -> 'highlights') < 1 then raise exception 'Minimal satu fasilitas atau aktivitas wajib diisi.'; end if;
    foreach field in array array['fullName','domicile','experience'] loop
      if coalesce(trim(p_payload -> 'guideIdentity' ->> field),'') = '' then raise exception 'Lengkapi identitas pemandu yang bertanggung jawab.'; end if;
    end loop;
    if not exists (select 1 from storage.objects o where o.bucket_id = 'partner-guide-photos'
      and o.name = p_payload #>> '{guideIdentity,photoPath}'
      and (storage.foldername(o.name))[1] = uid::text) then
      raise exception 'Foto pemandu belum tersimpan pada akun ini.';
    end if;
  end if;
  -- Four guide fields suffice for the prototype. Phone is optional and the
  -- submitted experience also supplies readiness evidence for existing review.
  if p_role = 'DESTINATION' and coalesce(trim(p_payload ->> 'guideReadinessEvidence'),'') = '' then
    p_payload := jsonb_set(p_payload, '{guideReadinessEvidence}',
      to_jsonb(trim(p_payload #>> '{guideIdentity,experience}')));
  end if;
  select * into existing from public.partner_applications a where a.auth_user_id = uid for update;
  if found then
    if existing.role <> p_role then raise exception 'Peran akun tidak sesuai dengan pengajuan sebelumnya.'; end if;
    if existing.status = 'APPROVED' then raise exception 'Pengajuan sudah disetujui dan tidak dapat diajukan ulang.'; end if;
    if existing.status = 'PENDING_REVIEW' then return existing; end if;
    partner_id := existing.partner_id;
    update public.partner_applications set payload = p_payload, status = 'PENDING_REVIEW', submitted_at = now(),
      reviewed_at = null, rejection_reason = null, approval_mode = null, email_notification = 'NOT_SENT'
      where id = existing.id returning * into result;
    update public.partner_profiles set display_name = p_payload ->> 'contactPerson',
      business_name = case when p_role = 'EO' then p_payload ->> 'businessName' else p_payload ->> 'managementName' end,
      guide_status = case when p_role = 'EO' then p_payload ->> 'guideStatus' end, updated_at = now()
      where id = partner_id;
    return result;
  end if;
  if exists(select 1 from public.partner_profiles p where p.auth_user_id = uid or lower(p.email) = account_email) then
    raise exception 'Akun mitra sudah terdaftar. Masuk dengan akun tersebut.';
  end if;
  partner_id := 'partner_' || gen_random_uuid()::text;
  if p_role = 'DESTINATION' then dest_id := 'dest_' || gen_random_uuid()::text; end if;
  insert into public.partner_profiles(id,auth_user_id,role,display_name,business_name,email,guide_status,destination_identity_id)
  values (partner_id, uid, p_role, trim(p_payload ->> 'contactPerson'),
    trim(case when p_role = 'EO' then p_payload ->> 'businessName' else p_payload ->> 'managementName' end),
    account_email, case when p_role = 'EO' then p_payload ->> 'guideStatus' end, dest_id);
  insert into public.partner_applications(partner_id,auth_user_id,role,email,payload,destination_id)
  values (partner_id,uid,p_role,account_email,p_payload,dest_id) returning * into result;
  return result;
end;
$$;
revoke all on function public.register_partner_application(text,jsonb) from public, anon;
grant execute on function public.register_partner_application(text,jsonb) to authenticated;
