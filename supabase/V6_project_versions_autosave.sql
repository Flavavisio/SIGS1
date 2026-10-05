-- SIGS Design V6 — Estabilização
-- NOTA: estas alterações já foram aplicadas ao projeto Supabase kbihedvyykjlbnipdgfm.

alter table public.projects
  add column if not exists updated_by uuid references auth.users(id),
  add column if not exists version_no integer not null default 1,
  add column if not exists last_saved_at timestamptz not null default now();

create table if not exists public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  version_no integer not null,
  reason text not null default 'AUTO',
  saved_by uuid references auth.users(id),
  module text not null,
  project_data jsonb not null,
  camera_count integer not null default 0,
  detector_count integer not null default 0,
  fire_detector_count integer not null default 0,
  floor_count integer not null default 1,
  created_at timestamptz not null default now(),
  unique(project_id,version_no)
);

create index if not exists project_versions_project_created_idx on public.project_versions(project_id,created_at desc);
create index if not exists project_versions_company_idx on public.project_versions(company_id);
create index if not exists projects_updated_by_idx on public.projects(updated_by);
create index if not exists project_versions_saved_by_idx on public.project_versions(saved_by);

alter table public.project_versions enable row level security;

drop policy if exists project_versions_select on public.project_versions;
create policy project_versions_select on public.project_versions
for select to authenticated
using (
  exists (
    select 1 from public.projects p
    where p.id=project_versions.project_id
      and (private.can_sales_view_project(p.company_id,p.created_by) or p.assigned_to=(select auth.uid()))
  )
);

revoke insert,update,delete on public.project_versions from authenticated;
grant select on public.project_versions to authenticated;

create or replace function private.sigs_next_project_version(p_project uuid)
returns integer language sql security definer set search_path=''
as $$
  select coalesce(max(v.version_no),0)+1 from public.project_versions v where v.project_id=p_project
$$;

create or replace function private.sigs_snapshot_project_if_due()
returns trigger language plpgsql security definer set search_path=''
as $$
declare next_no integer;
begin
  new.updated_by=(select auth.uid());
  new.last_saved_at=now();
  new.version_no=coalesce(old.version_no,1)+1;
  if old.project_data is distinct from new.project_data
     and not exists (
       select 1 from public.project_versions v
       where v.project_id=old.id and v.reason='AUTO' and v.created_at > now()-interval '15 minutes'
     )
  then
    next_no:=private.sigs_next_project_version(old.id);
    insert into public.project_versions(project_id,company_id,version_no,reason,saved_by,module,project_data,camera_count,detector_count,fire_detector_count,floor_count)
    values(old.id,old.company_id,next_no,'AUTO',(select auth.uid()),old.module,old.project_data,old.camera_count,old.detector_count,old.fire_detector_count,old.floor_count);
  end if;
  return new;
end
$$;

drop trigger if exists trg_sigs_project_snapshot on public.projects;
create trigger trg_sigs_project_snapshot before update of project_data on public.projects
for each row execute function private.sigs_snapshot_project_if_due();

create or replace function public.sigs_create_project_version(p_project uuid,p_reason text default 'MANUAL')
returns uuid language plpgsql security definer set search_path=''
as $$
declare p public.projects; vid uuid; next_no integer; reason_clean text;
begin
  select * into p from public.projects where id=p_project;
  if not found then raise exception 'Projeto não encontrado'; end if;
  if not (private.can_sales_view_project(p.company_id,p.created_by) or p.assigned_to=(select auth.uid())) then raise exception 'Sem permissão'; end if;
  if private.active_license_id(p.company_id) is null then raise exception 'Licença inativa'; end if;
  next_no:=private.sigs_next_project_version(p.id);
  reason_clean:=upper(left(coalesce(nullif(trim(p_reason),''),'MANUAL'),32));
  insert into public.project_versions(project_id,company_id,version_no,reason,saved_by,module,project_data,camera_count,detector_count,fire_detector_count,floor_count)
  values(p.id,p.company_id,next_no,reason_clean,(select auth.uid()),p.module,p.project_data,p.camera_count,p.detector_count,p.fire_detector_count,p.floor_count)
  returning id into vid;
  return vid;
end
$$;

create or replace function public.sigs_restore_project_version(p_version uuid)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v public.project_versions; p public.projects;
begin
  select * into v from public.project_versions where id=p_version;
  if not found then raise exception 'Versão não encontrada'; end if;
  select * into p from public.projects where id=v.project_id;
  if not found then raise exception 'Projeto não encontrado'; end if;
  if not (private.can_sales_view_project(p.company_id,p.created_by) or p.assigned_to=(select auth.uid())) then raise exception 'Sem permissão'; end if;
  if private.active_license_id(p.company_id) is null then raise exception 'Licença inativa'; end if;
  perform public.sigs_create_project_version(p.id,'PRE_RESTORE');
  update public.projects set project_data=v.project_data,module=v.module,camera_count=v.camera_count,detector_count=v.detector_count,fire_detector_count=v.fire_detector_count,floor_count=v.floor_count,updated_at=now(),updated_by=(select auth.uid()) where id=p.id;
  return p.id;
end
$$;

revoke execute on function public.sigs_create_project_version(uuid,text) from public, anon;
revoke execute on function public.sigs_restore_project_version(uuid) from public, anon;
grant execute on function public.sigs_create_project_version(uuid,text) to authenticated;
grant execute on function public.sigs_restore_project_version(uuid) to authenticated;
