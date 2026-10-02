-- Admin directory access avoids self-referencing partner-profile RLS.
-- This narrowly scoped helper lives outside the exposed API schema.
create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;
create function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from public.partner_profiles p
    where p.auth_user_id = auth.uid() and p.role = 'ADMIN'
  );
$$;
revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

drop policy if exists "admin can read partner profiles" on public.partner_profiles;
create policy "admin can read partner profiles" on public.partner_profiles
for select to authenticated using ((select private.is_admin()));

grant insert on public.destinations to authenticated;
create policy "admin can create verified destinations" on public.destinations
for insert to authenticated with check (
  (select private.is_admin()) and status = 'ACTIVE' and guide_ready
  and length(trim(name)) > 0 and length(trim(province)) > 0
  and length(trim(city)) > 0 and length(trim(description)) > 0
  and length(trim(coalesce(local_guide_summary, ''))) > 0
  and capacity_per_session > 0 and base_cost_per_person >= 0
  and local_guide_fee_per_person >= 0
);
