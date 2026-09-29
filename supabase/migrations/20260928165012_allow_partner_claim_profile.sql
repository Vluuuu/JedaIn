-- Migration: 20260928000001_allow_partner_claim_profile.sql
-- Purpose: Allow authenticated demo partners to view and claim their own partner profile
-- in public.partner_profiles by matching their authenticated email address.
--
-- Security constraints:
-- 1. Must be authenticated.
-- 2. Partner can only select their own profile (matching auth_user_id or email).
-- 3. Partner can only update their profile's auth_user_id to their own auth.uid()
--    when the profile's email matches auth.jwt() ->> 'email'.

alter table public.partner_profiles
add column if not exists email text;

update public.partner_profiles
set email = case id
  when 'eo_jeda_alam' then 'partner@jedaalam.id'
  when 'dest_partner_lereng_hijau' then 'destinasi@lerenghijau.id'
  when 'eo_kreatif_desa' then 'partner@kreatifdesa.id'
end
where id in ('eo_jeda_alam', 'dest_partner_lereng_hijau', 'eo_kreatif_desa');

create unique index if not exists partner_profiles_email_unique_lower
on public.partner_profiles (lower(email))
where email is not null;

drop policy if exists "Allow partner to claim profile by email" on public.partner_profiles;
drop policy if exists "Allow partner to view own profile" on public.partner_profiles;

create policy "Allow partner to view own profile"
on public.partner_profiles
for select
to authenticated
using (
  auth_user_id = auth.uid()
  or lower(email) = lower(auth.jwt() ->> 'email')
);

create policy "Allow partner to claim profile by email"
on public.partner_profiles
for update
to authenticated
using (
  (auth_user_id is null and lower(email) = lower(auth.jwt() ->> 'email'))
  or auth_user_id = auth.uid()
)
with check (
  auth_user_id = auth.uid()
);
