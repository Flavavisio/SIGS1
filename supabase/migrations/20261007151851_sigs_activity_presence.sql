create table if not exists public.sigs_presence (
 session_id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,
 last_seen timestamptz not null default now(),page text not null,online boolean not null default true
);
create index if not exists sigs_presence_user_seen on public.sigs_presence(user_id,last_seen desc);
create table if not exists public.sigs_access_events (
 id bigint generated always as identity primary key,user_id uuid references auth.users(id) on delete set null,
 name text,email text,role text,page text not null,ip inet,created_at timestamptz not null default now()
);
create index if not exists sigs_access_created on public.sigs_access_events(created_at desc);
create table if not exists public.sigs_visits (
 id bigint generated always as identity primary key,visitor_id uuid not null,page text not null,ip inet,
 city text,region text,country text,consent_version text not null,created_at timestamptz not null default now()
);
create index if not exists sigs_visits_created on public.sigs_visits(created_at desc);
create index if not exists sigs_visits_ip_created on public.sigs_visits(ip,created_at desc);
alter table public.sigs_presence enable row level security;
alter table public.sigs_access_events enable row level security;
alter table public.sigs_visits enable row level security;
revoke all on public.sigs_presence,public.sigs_access_events,public.sigs_visits from anon,authenticated;
grant select on public.sigs_presence,public.sigs_access_events,public.sigs_visits to authenticated;
grant all on public.sigs_presence,public.sigs_access_events,public.sigs_visits to service_role;
grant usage,select on sequence public.sigs_access_events_id_seq,public.sigs_visits_id_seq to service_role;
create policy sigs_presence_super_read on public.sigs_presence for select to authenticated using ((select private.is_super_admin()));
create policy sigs_access_super_read on public.sigs_access_events for select to authenticated using ((select private.is_super_admin()));
create policy sigs_visits_super_read on public.sigs_visits for select to authenticated using ((select private.is_super_admin()));
select cron.schedule('sigs-activity-retention','35 3 * * *',$$delete from public.sigs_presence where last_seen < now()-interval '7 days';delete from public.sigs_access_events where created_at < now()-interval '90 days';delete from public.sigs_visits where created_at < now()-interval '30 days';$$);
