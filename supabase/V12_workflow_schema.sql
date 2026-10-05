-- SIGS V12: company data, immutable commercial revisions and expiring public shares.
create table public.sigs_clients (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete cascade,
 name text not null check (length(name) between 1 and 200), email text, phone text, notes text,
 created_by uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now()
);
create index on public.sigs_clients(company_id);
alter table public.sigs_clients enable row level security;
create policy clients_read on public.sigs_clients for select to authenticated using (company_id=private.current_company_id());
create policy clients_add on public.sigs_clients for insert to authenticated with check (company_id=private.current_company_id() and created_by=(select auth.uid()) and private.active_license_id(company_id) is not null);
create policy clients_edit on public.sigs_clients for update to authenticated using (company_id=private.current_company_id()) with check (company_id=private.current_company_id() and private.active_license_id(company_id) is not null);
revoke all on public.sigs_clients from anon,authenticated;
grant select,insert,update on public.sigs_clients to authenticated;

create table public.sigs_company_preferences (
 company_id uuid primary key references public.companies(id) on delete cascade,
 settings jsonb not null default '{}' check (octet_length(settings::text)<3000000), updated_at timestamptz not null default now()
);
alter table public.sigs_company_preferences enable row level security;
create policy preferences_read on public.sigs_company_preferences for select to authenticated using (company_id=private.current_company_id());
create policy preferences_add on public.sigs_company_preferences for insert to authenticated with check (private.is_company_admin(company_id));
create policy preferences_edit on public.sigs_company_preferences for update to authenticated using (private.is_company_admin(company_id)) with check (private.is_company_admin(company_id));
revoke all on public.sigs_company_preferences from anon,authenticated;
grant select,insert,update on public.sigs_company_preferences to authenticated;

create table public.sigs_supplier_prices (
 company_id uuid not null references public.companies(id) on delete cascade, reference text not null check(length(reference) between 1 and 200),
 name text not null, cost numeric check(cost>=0), pvp numeric check(pvp>=0), stock numeric check(stock>=0), image_url text,
 updated_at timestamptz not null default now(), primary key(company_id,reference)
);
alter table public.sigs_supplier_prices enable row level security;
create policy supplier_read on public.sigs_supplier_prices for select to authenticated using (company_id=private.current_company_id());
create policy supplier_add on public.sigs_supplier_prices for insert to authenticated with check (private.is_company_admin(company_id));
create policy supplier_edit on public.sigs_supplier_prices for update to authenticated using (private.is_company_admin(company_id)) with check (private.is_company_admin(company_id));
revoke all on public.sigs_supplier_prices from anon,authenticated;
grant select,insert,update on public.sigs_supplier_prices to authenticated;

create table public.sigs_quote_revisions (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
 company_id uuid not null references public.companies(id), revision_no integer not null check(revision_no>0),
 public_snapshot jsonb not null check(jsonb_typeof(public_snapshot)='object' and octet_length(public_snapshot::text)<8000000),
 created_by uuid not null default auth.uid() references auth.users(id), created_at timestamptz not null default now(), unique(project_id,revision_no)
);
alter table public.sigs_quote_revisions enable row level security;
create policy revision_read on public.sigs_quote_revisions for select to authenticated using (exists(select 1 from public.projects p where p.id=project_id and p.company_id=sigs_quote_revisions.company_id));
create policy revision_add on public.sigs_quote_revisions for insert to authenticated with check (created_by=(select auth.uid()) and company_id=private.current_company_id() and private.active_license_id(company_id) is not null and exists(select 1 from public.projects p where p.id=project_id and p.company_id=sigs_quote_revisions.company_id));
revoke all on public.sigs_quote_revisions from anon,authenticated;
grant select,insert on public.sigs_quote_revisions to authenticated;

create or replace function public.sigs_save_quote_revision(p_project uuid,p_snapshot jsonb) returns public.sigs_quote_revisions
language plpgsql security invoker set search_path='' as $$
declare p public.projects; r public.sigs_quote_revisions;
begin
 select * into p from public.projects where id=p_project for update;
 if p.id is null or p.company_id<>private.current_company_id() or auth.uid() is null then raise exception 'Projeto não disponível'; end if;
 insert into public.sigs_quote_revisions(project_id,company_id,revision_no,public_snapshot)
 values(p.id,p.company_id,coalesce((select max(revision_no) from public.sigs_quote_revisions where project_id=p.id),0)+1,p_snapshot) returning * into r;
 return r;
end $$;
revoke all on function public.sigs_save_quote_revision(uuid,jsonb) from public,anon;
grant execute on function public.sigs_save_quote_revision(uuid,jsonb) to authenticated;

create table public.sigs_quote_shares (
 id uuid primary key default gen_random_uuid(), revision_id uuid not null references public.sigs_quote_revisions(id) on delete cascade,
 company_id uuid not null references public.companies(id), token_hash text not null unique,
 expires_at timestamptz not null, revoked_at timestamptz, created_at timestamptz not null default now(),
 response text check(response in ('ACCEPTED','CHANGES','DECLINED')), respondent text, response_note text, responded_at timestamptz
);
create index on public.sigs_quote_shares(company_id);
create index on public.sigs_quote_shares(revision_id);
alter table public.sigs_quote_shares enable row level security;
create policy share_read on public.sigs_quote_shares for select to authenticated using (exists(select 1 from public.sigs_quote_revisions r where r.id=revision_id and r.company_id=sigs_quote_shares.company_id));
create policy share_add on public.sigs_quote_shares for insert to authenticated with check (company_id=private.current_company_id() and exists(select 1 from public.sigs_quote_revisions r where r.id=revision_id and r.company_id=sigs_quote_shares.company_id) and expires_at>now() and expires_at<=now()+interval '91 days' and revoked_at is null and response is null and respondent is null and response_note is null and responded_at is null and token_hash ~ '^[0-9a-f]{64}$');
create policy share_revoke on public.sigs_quote_shares for update to authenticated using (exists(select 1 from public.sigs_quote_revisions r where r.id=revision_id and r.company_id=sigs_quote_shares.company_id)) with check (company_id=private.current_company_id());
revoke all on public.sigs_quote_shares from anon,authenticated;
grant select on public.sigs_quote_shares to authenticated;
grant insert(revision_id,company_id,token_hash,expires_at) on public.sigs_quote_shares to authenticated;
grant update(revoked_at) on public.sigs_quote_shares to authenticated;

create or replace function public.sigs_publish_quote(p_revision uuid,p_token text,p_days integer default 30) returns uuid
language plpgsql security invoker set search_path='' as $$
declare r public.sigs_quote_revisions; sid uuid;
begin
 if p_token !~ '^[0-9a-f]{64}$' or p_days not between 1 and 90 then raise exception 'Parâmetros inválidos'; end if;
 select * into r from public.sigs_quote_revisions where id=p_revision;
 if r.id is null then raise exception 'Revisão não disponível'; end if;
 insert into public.sigs_quote_shares(revision_id,company_id,token_hash,expires_at)
 values(r.id,r.company_id,encode(extensions.digest(p_token,'sha256'),'hex'),now()+make_interval(days=>p_days)) returning id into sid;
 return sid;
end $$;
revoke all on function public.sigs_publish_quote(uuid,text,integer) from public,anon;
grant execute on function public.sigs_publish_quote(uuid,text,integer) to authenticated;

-- Only this capability endpoint crosses RLS. Raw shares/revisions remain inaccessible to anon.
create or replace function private.sigs_public_quote(p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.sigs_quote_shares; snap jsonb;
begin
 if p_token !~ '^[0-9a-f]{64}$' then return null; end if;
 select * into s from public.sigs_quote_shares where token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and revoked_at is null and expires_at>now();
 if s.id is null then return null; end if;
 select public_snapshot into snap from public.sigs_quote_revisions where id=s.revision_id;
 -- A strict public field allowlist; internal project/commercial data is never read.
 snap=jsonb_build_object('project',snap->'project','company',snap->'company','client',snap->'client','reference',snap->'reference','description',snap->'description','terms',snap->'terms','validity',snap->'validity','date',snap->'date','logo',snap->'logo','color',snap->'color','contacts',snap->'contacts','alternative',snap->'alternative','sub',snap->'sub','tax',snap->'tax','total',snap->'total','taxRate',snap->'taxRate','discount',snap->'discount','floors',(select coalesce(jsonb_agg(jsonb_build_object('name',f->'name','fp',case when jsonb_typeof(f->'fp')='object' then jsonb_build_object('x',f->'fp'->'x','y',f->'fp'->'y','w',f->'fp'->'w','h',f->'fp'->'h','image',f->'fp'->'image') else null end,'devices',(select coalesce(jsonb_agg(jsonb_build_object('x',d->'x','y',d->'y','label',d->'label','ref',d->'ref','name',d->'name')),'[]'::jsonb) from jsonb_array_elements(coalesce(f->'devices','[]'::jsonb)) d))),'[]'::jsonb) from jsonb_array_elements(coalesce(snap->'floors','[]'::jsonb)) f),'lines',(select coalesce(jsonb_agg(jsonb_build_object('ref',x->'ref','name',x->'name','qty',x->'qty','unit',x->'unit','sale',x->'sale','net',x->'net')),'[]'::jsonb) from jsonb_array_elements(coalesce(snap->'lines','[]'::jsonb)) x));
 return jsonb_build_object('snapshot',snap,'response',s.response,'responded_at',s.responded_at,'expires_at',s.expires_at);
end $$;
revoke all on function private.sigs_public_quote(text) from public;
grant usage on schema private to anon,authenticated;
grant execute on function private.sigs_public_quote(text) to anon,authenticated;
create or replace function public.sigs_public_quote(p_token text) returns jsonb language sql security invoker set search_path='' as $$ select private.sigs_public_quote(p_token); $$;
revoke all on function public.sigs_public_quote(text) from public;
grant execute on function public.sigs_public_quote(text) to anon,authenticated;

create or replace function private.sigs_respond_quote(p_token text,p_response text,p_name text,p_note text) returns boolean
language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 if p_token is null or p_response is null or p_name is null or p_token !~ '^[0-9a-f]{64}$' or p_response not in ('ACCEPTED','CHANGES','DECLINED') or length(trim(p_name)) not between 2 and 160 or length(coalesce(p_note,''))>3000 then raise exception 'Resposta inválida'; end if;
 select id into sid from public.sigs_quote_shares where token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and expires_at>now() and revoked_at is null and response is null for update;
 if sid is null then return false; end if;
 update public.sigs_quote_shares set response=p_response,respondent=trim(p_name),response_note=coalesce(p_note,''),responded_at=now() where id=sid;
 return true;
end $$;
revoke all on function private.sigs_respond_quote(text,text,text,text) from public;
grant execute on function private.sigs_respond_quote(text,text,text,text) to anon,authenticated;
create or replace function public.sigs_respond_quote(p_token text,p_response text,p_name text,p_note text default '') returns boolean language sql security invoker set search_path='' as $$ select private.sigs_respond_quote(p_token,p_response,p_name,p_note); $$;
revoke all on function public.sigs_respond_quote(text,text,text,text) from public;
grant execute on function public.sigs_respond_quote(text,text,text,text) to anon,authenticated;
