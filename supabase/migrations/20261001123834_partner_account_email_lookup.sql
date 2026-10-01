-- Only the issuing server can inspect Auth email occupancy; no public directory.
create function public.partner_account_email_in_use(p_email text, p_actor_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if auth.role() is distinct from 'service_role' then raise exception 'Alamat akun hanya diperiksa melalui server.'; end if;
  return exists(select 1 from auth.users where lower(email) = lower(p_email) and id <> p_actor_id);
end; $$;
revoke all on function public.partner_account_email_in_use(text,uuid) from public, anon, authenticated;
grant execute on function public.partner_account_email_in_use(text,uuid) to service_role;
