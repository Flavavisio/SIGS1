-- Transactional emails. No password, access token or license key is stored.
create table if not exists private.sigs_email_outbox (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
 license_id uuid, event text not null check(event in ('welcome','license_activated','license_renewed','license_expiring','license_expired','license_suspended','license_reactivated')),
 recipient text not null, payload jsonb not null, dedupe_key text not null unique,
 status text not null default 'pending' check(status in ('pending','processing','sent','failed','cancelled')),
 attempts integer not null default 0, available_at timestamptz not null default now(),
 created_at timestamptz not null default now(), claimed_at timestamptz, lease_id uuid,
 sent_at timestamptz, last_error text
);
alter table private.sigs_email_outbox enable row level security;
revoke all on private.sigs_email_outbox from public,anon,authenticated;
create index if not exists sigs_email_due on private.sigs_email_outbox(available_at,created_at) where status='pending';

create or replace function private.sigs_queue_license_email(lid uuid, kind text, discriminator text, days_left integer default null)
returns integer language plpgsql security definer set search_path='' as $$
declare l record; r record; n integer:=0; added integer; data jsonb;
begin
 select x.*,c.name as company_name,c.email as company_email,p.name as plan_name,p.max_projects,p.max_items_per_project
 into l from public.licenses x join public.companies c on c.id=x.company_id join public.plans p on p.id=x.plan_id where x.id=lid;
 if not found then return 0; end if;
 data:=jsonb_build_object('company',l.company_name,'plan',l.plan_name,'billing',case when l.billing_interval='YEAR' then 'Anual' else 'Mensal' end,'expires',to_char(l.expires_at at time zone 'Europe/Lisbon','DD/MM/YYYY'),'maxProjects',l.max_projects,'maxItems',l.max_items_per_project,'days',days_left);
 for r in select distinct lower(u.email) as email from public.company_members m join auth.users u on u.id=m.user_id join public.profiles p on p.id=m.user_id where m.company_id=l.company_id and m.role='ADMIN' and m.active and p.active and u.email is not null
 union select lower(l.company_email) where l.company_email is not null and not exists(select 1 from public.company_members m join public.profiles p on p.id=m.user_id where m.company_id=l.company_id and m.role='ADMIN' and m.active and p.active)
 loop
  insert into private.sigs_email_outbox(company_id,license_id,event,recipient,payload,dedupe_key)
  values(l.company_id,l.id,kind,r.email,data,l.id::text||':'||kind||':'||discriminator||':'||r.email) on conflict(dedupe_key) do nothing;
  get diagnostics added=row_count;n:=n+added;
 end loop;
 return n;
end $$;
revoke all on function private.sigs_queue_license_email(uuid,text,text,integer) from public,anon,authenticated;

create or replace function private.sigs_license_email_event() returns trigger language plpgsql security definer set search_path='' as $$
declare kind text;
begin
 if tg_op='INSERT' then
  if new.status='ACTIVE' then kind:='license_activated';elsif new.status='SUSPENDED' then kind:='license_suspended';else return new;end if;
 else
  if new.status='SUSPENDED' and old.status is distinct from new.status then kind:='license_suspended';
  elsif new.status='EXPIRED' and old.status is distinct from new.status then kind:='license_expired';
  elsif new.status='ACTIVE' and new.expires_at>old.expires_at then kind:='license_renewed';
  elsif new.status='ACTIVE' and old.status is distinct from new.status then kind:='license_reactivated';
  else return new;end if;
  update private.sigs_email_outbox set status='cancelled' where license_id=new.id and status='pending' and event<>'welcome';
 end if;
 perform private.sigs_queue_license_email(new.id,kind,case when kind='license_expired' then new.expires_at::text else new.updated_at::text end);
 return new;
end $$;
revoke all on function private.sigs_license_email_event() from public,anon,authenticated;
drop trigger if exists sigs_license_email_event on public.licenses;
create trigger sigs_license_email_event after insert or update on public.licenses for each row execute function private.sigs_license_email_event();

create or replace function private.sigs_member_welcome_email() returns trigger language plpgsql security definer set search_path='' as $$
declare email text; co text;
begin
 if not new.active then return new;end if;
 select u.email into email from auth.users u where u.id=new.user_id;
 select c.name into co from public.companies c where c.id=new.company_id;
 if email is not null then
 insert into private.sigs_email_outbox(company_id,event,recipient,payload,dedupe_key) values(new.company_id,'welcome',lower(email),jsonb_build_object('company',co),new.company_id::text||':welcome:'||new.user_id::text) on conflict(dedupe_key) do nothing;
 end if;return new;
end $$;
revoke all on function private.sigs_member_welcome_email() from public,anon,authenticated;
drop trigger if exists sigs_member_welcome_email on public.company_members;
create trigger sigs_member_welcome_email after insert on public.company_members for each row execute function private.sigs_member_welcome_email();

create or replace function private.sigs_schedule_license_emails() returns integer language plpgsql security definer set search_path='' as $$
declare l record; days integer; n integer:=0;
begin
 for l in select distinct on(company_id) * from public.licenses order by company_id,created_at desc,id desc loop
  if l.status<>'ACTIVE' or l.expires_at is null then continue;end if;
  days:=(l.expires_at at time zone 'Europe/Lisbon')::date-(now() at time zone 'Europe/Lisbon')::date;
  if l.expires_at<=now() then n:=n+private.sigs_queue_license_email(l.id,'license_expired',l.expires_at::text);
  elsif days in (7,3,1) then n:=n+private.sigs_queue_license_email(l.id,'license_expiring',l.expires_at::text||':'||days::text,days);end if;
 end loop;return n;
end $$;
revoke all on function private.sigs_schedule_license_emails() from public,anon,authenticated;

create or replace function private.sigs_email_claim(batch_size integer) returns setof private.sigs_email_outbox language plpgsql security definer set search_path='' as $$
begin
 -- SMTP acceptance is ambiguous after a worker crash: require inspection instead of resending automatically.
 update private.sigs_email_outbox set status='failed',last_error='DELIVERY_UNKNOWN' where status='processing' and claimed_at<now()-interval '15 minutes';
 return query with due as(select id from private.sigs_email_outbox where status='pending' and available_at<=now() order by created_at for update skip locked limit greatest(1,least(batch_size,5)))
 update private.sigs_email_outbox o set status='processing',claimed_at=now(),lease_id=gen_random_uuid(),attempts=attempts+1 from due where o.id=due.id returning o.*;
end $$;
revoke all on function private.sigs_email_claim(integer) from public,anon,authenticated;
grant execute on function private.sigs_email_claim(integer) to service_role;

create or replace function private.sigs_email_complete(job_id uuid,lease uuid,success boolean,error_code text default null) returns boolean language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 update private.sigs_email_outbox set status=case when success then 'sent' else 'failed' end,sent_at=case when success then now() else null end,last_error=case when success then null else left(regexp_replace(coalesce(error_code,'SMTP_FAILED'),'[^A-Z0-9_]','','g'),40) end
 where id=job_id and lease_id=lease and status='processing';get diagnostics n=row_count;return n=1;
end $$;
revoke all on function private.sigs_email_complete(uuid,uuid,boolean,text) from public,anon,authenticated;
grant execute on function private.sigs_email_complete(uuid,uuid,boolean,text) to service_role;

create or replace function private.sigs_email_status() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not private.is_super_admin() then raise exception 'SUPER_ADMIN required' using errcode='42501';end if;
 return jsonb_build_object('counts',(select coalesce(jsonb_object_agg(status,n),'{}') from(select status,count(*) n from private.sigs_email_outbox group by status)x),'recent',(select coalesce(jsonb_agg(x),'[]') from(select event,status,created_at,sent_at,last_error from private.sigs_email_outbox order by created_at desc limit 20)x));
end $$;
revoke all on function private.sigs_email_status() from public,anon;
grant execute on function private.sigs_email_status() to authenticated;

-- Invoker wrappers expose only the narrowly authorized operations, not the private schema.
create or replace function public.sigs_email_claim(batch_size integer default 5) returns jsonb language sql security invoker set search_path='' as $$select coalesce(jsonb_agg(x),'[]') from private.sigs_email_claim(batch_size) x$$;
create or replace function public.sigs_email_complete(job_id uuid,lease uuid,success boolean,error_code text default null) returns boolean language sql security invoker set search_path='' as $$select private.sigs_email_complete(job_id,lease,success,error_code)$$;
create or replace function public.sigs_email_status() returns jsonb language sql security invoker set search_path='' as $$select private.sigs_email_status()$$;
revoke all on function public.sigs_email_claim(integer),public.sigs_email_complete(uuid,uuid,boolean,text),public.sigs_email_status() from public,anon,authenticated;
grant execute on function public.sigs_email_claim(integer),public.sigs_email_complete(uuid,uuid,boolean,text) to service_role;
grant execute on function public.sigs_email_status() to authenticated;
grant usage on schema private to service_role;

create extension if not exists pg_cron;
select cron.schedule('sigs-license-email-reminders','15 * * * *','select private.sigs_schedule_license_emails()');

-- Dispatch is dormant until a repo-scoped service JWT is placed in Vault.
-- SMTP must separately be configured and enabled in Edge Function secrets.
create or replace function private.sigs_dispatch_email_worker() returns bigint language plpgsql security definer set search_path='' as $$
declare key text; request_id bigint;
begin
 select decrypted_secret into key from vault.decrypted_secrets where name='sigs_email_worker_jwt' limit 1;
 if key is null or not exists(select 1 from private.sigs_email_outbox where status='pending' and available_at<=now()) then return null;end if;
 select net.http_post(url:='https://kbihedvyykjlbnipdgfm.supabase.co/functions/v1/sigs-email-worker',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||key),body:='{"action":"dispatch"}'::jsonb,timeout_milliseconds:=100000) into request_id;
 return request_id;
end $$;
revoke all on function private.sigs_dispatch_email_worker() from public,anon,authenticated;
select cron.schedule('sigs-email-dispatch','*/5 * * * *','select private.sigs_dispatch_email_worker()');
