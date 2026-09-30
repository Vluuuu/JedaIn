-- Migration: 20260928000000_allow_demo_eo_self_approval.sql
-- Purpose: Allow authenticated Travel Organizer (EO) to self-approve their own package
-- specifically from PENDING_ADMIN_REVIEW to APPROVED for prototype demo purposes,
-- while Admin workspace backend integration is deferred.
--
-- Security constraints enforced:
-- 1. Actor must be an authenticated user.
-- 2. Actor must own the package through partner_profiles mapping:
--    partner_profiles.auth_user_id = auth.uid() AND partner_profiles.id = packages.eo_id AND partner_profiles.role = 'EO'.
-- 3. Initial state in USING clause must strictly be 'PENDING_ADMIN_REVIEW'.
-- 4. Target state in WITH CHECK clause must strictly be 'APPROVED'.
-- 5. Does NOT permit transition directly to 'LIVE' (EO must still separately publish).
-- 6. Does NOT allow modifying packages belonging to other EOs.
-- 7. Does NOT allow arbitrary status transitions.

drop policy if exists "Allow EO demo self-approval" on public.packages;

create policy "Allow EO demo self-approval"
on public.packages
for update
to authenticated
using (
  status = 'PENDING_ADMIN_REVIEW'
  and exists (
    select 1
    from public.partner_profiles
    where partner_profiles.auth_user_id = auth.uid()
      and partner_profiles.id = packages.eo_id
      and partner_profiles.role = 'EO'
  )
)
with check (
  status = 'APPROVED'
  and exists (
    select 1
    from public.partner_profiles
    where partner_profiles.auth_user_id = auth.uid()
      and partner_profiles.id = packages.eo_id
      and partner_profiles.role = 'EO'
  )
);
