-- Server-only setup: keep the cron credential encrypted in Vault.
create or replace function private.sigs_email_configure_dispatch(worker_jwt text)
returns boolean language plpgsql security definer set search_path='' as $$
declare existing_id uuid;
begin
 if worker_jwt is null or length(worker_jwt)<40 then
  raise exception 'SERVER_CREDENTIAL_REQUIRED';
 end if;
 perform pg_advisory_xact_lock(hashtext('sigs-email-dispatch-setup'));
 select id into existing_id from vault.secrets where name='sigs_email_worker_jwt' limit 1;
 if existing_id is null then
  perform vault.create_secret(worker_jwt,'sigs_email_worker_jwt','SIGS license email cron authorization');
 else
  perform vault.update_secret(existing_id,worker_jwt,'sigs_email_worker_jwt','SIGS license email cron authorization');
 end if;
 return true;
end $$;
revoke all on function private.sigs_email_configure_dispatch(text) from public,anon,authenticated;
grant execute on function private.sigs_email_configure_dispatch(text) to service_role;
create or replace function public.sigs_email_configure_dispatch(worker_jwt text)
returns boolean language sql security invoker set search_path='' as $$
 select private.sigs_email_configure_dispatch(worker_jwt);
$$;
revoke all on function public.sigs_email_configure_dispatch(text) from public,anon,authenticated;
grant execute on function public.sigs_email_configure_dispatch(text) to service_role;
