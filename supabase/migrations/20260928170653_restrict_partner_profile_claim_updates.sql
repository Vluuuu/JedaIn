-- Migration: 20260928000002_restrict_partner_profile_claim_updates.sql
-- Purpose: Restrict UPDATE privilege on public.partner_profiles to column auth_user_id only
-- for the authenticated role, and revoke all UPDATE privileges from anon.
--
-- Security rationale:
-- Row-level security (RLS) policies "Allow partner to claim profile by email" and
-- "Allow partner to view own profile" govern which rows may be accessed or updated.
-- However, table-wide UPDATE privilege on public.partner_profiles would theoretically
-- permit an authenticated client fulfilling RLS to craft a direct Supabase REST update
-- modifying authorization and profile attributes (role, email, display_name,
-- business_name, guide_status, organizer_review_ref, destination_identity_id)
-- alongside auth_user_id.
--
-- Enforcing column-level UPDATE privilege ensures defense-in-depth:
-- 1. Revoke table-wide UPDATE from anon.
-- 2. Revoke table-wide UPDATE from authenticated.
-- 3. Grant UPDATE strictly on (auth_user_id) to authenticated.
--
-- Note: Does NOT modify existing RLS policies. RLS policies continue to enforce:
-- - SELECT: auth_user_id = auth.uid() OR lower(email) = lower(auth.jwt() ->> 'email')
-- - UPDATE USING: (auth_user_id IS NULL AND lower(email) = lower(auth.jwt() ->> 'email')) OR auth_user_id = auth.uid()
-- - UPDATE WITH CHECK: auth_user_id = auth.uid()

revoke update on table public.partner_profiles from anon;
revoke update on table public.partner_profiles from authenticated;

grant update (auth_user_id)
on table public.partner_profiles
to authenticated;
