-- V30: atomic manual/automatic checkpoints and reversible resume.
alter table public.project_versions add column if not exists total_budget numeric;
create or replace function private.sigs_snapshot_project_if_due()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 new.updated_by=(select auth.uid()); new.last_saved_at=now();
 new.version_no=coalesce(old.version_no,1)+1;
 return new;
end $$;
create or replace function public.sigs_create_project_version(p_project uuid,p_reason text default 'MANUAL')
returns uuid language plpgsql security definer set search_path='' as $$
declare p public.projects; vid uuid; reason_clean text;
begin
 if auth.uid() is null then raise exception 'Sem sessão'; end if;
 select * into p from public.projects where id=p_project for update;
 if not found then raise exception 'Projeto não encontrado'; end if;
 if not coalesce(private.can_sales_view_project(p.company_id,p.created_by) or p.assigned_to=auth.uid(),false) then raise exception 'Sem permissão'; end if;
 if private.active_license_id(p.company_id) is null then raise exception 'Licença inativa'; end if;
 if p.status='ARCHIVED' then raise exception 'Projeto arquivado'; end if;
 reason_clean:=upper(trim(coalesce(p_reason,'MANUAL')));
 if reason_clean not in ('MANUAL','AUTO','PRE_RESTORE') then raise exception 'Tipo de gravação inválido'; end if;
 insert into public.project_versions(project_id,company_id,version_no,reason,saved_by,module,project_data,camera_count,detector_count,fire_detector_count,floor_count,total_budget)
 values(p.id,p.company_id,private.sigs_next_project_version(p.id),reason_clean,auth.uid(),p.module,p.project_data,p.camera_count,p.detector_count,p.fire_detector_count,p.floor_count,p.total_budget) returning id into vid;
 return vid;
end $$;
create or replace function public.sigs_save_project_checkpoint(p_project uuid,p_patch jsonb,p_reason text default 'MANUAL')
returns public.projects language plpgsql security invoker set search_path='' as $$
declare p public.projects;
begin
 if auth.uid() is null then raise exception 'Sem sessão'; end if;
 if p_reason not in ('MANUAL','AUTO') then raise exception 'Tipo de gravação inválido'; end if;
 if jsonb_typeof(p_patch->'project_data') is distinct from 'object' then raise exception 'Dados de projeto inválidos'; end if;
 select * into p from public.projects where id=p_project for update;
 if not found then raise exception 'Projeto indisponível ou sem permissão'; end if;
 if p.status='ARCHIVED' then raise exception 'Projeto arquivado'; end if;
 update public.projects set project_data=p_patch->'project_data',module=p_patch->>'module',total_budget=(p_patch->>'total_budget')::numeric,
 camera_count=(p_patch->>'camera_count')::integer,detector_count=(p_patch->>'detector_count')::integer,fire_detector_count=(p_patch->>'fire_detector_count')::integer,floor_count=(p_patch->>'floor_count')::integer,updated_at=now(),updated_by=auth.uid()
 where id=p_project returning * into p;
 if not found then raise exception 'Gravação não autorizada'; end if;
 perform public.sigs_create_project_version(p_project,p_reason);
 return p;
end $$;
create or replace function public.sigs_restore_project_version(p_version uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v public.project_versions; p public.projects;
begin
 if auth.uid() is null then raise exception 'Sem sessão'; end if;
 select * into v from public.project_versions where id=p_version;
 if not found then raise exception 'Gravação não encontrada'; end if;
 select * into p from public.projects where id=v.project_id for update;
 if not found then raise exception 'Projeto não encontrado'; end if;
 if not coalesce(private.can_sales_view_project(p.company_id,p.created_by) or p.assigned_to=auth.uid(),false) then raise exception 'Sem permissão'; end if;
 if private.active_license_id(p.company_id) is null then raise exception 'Licença inativa'; end if;
 if p.status='ARCHIVED' then raise exception 'Projeto arquivado'; end if;
 perform public.sigs_create_project_version(p.id,'PRE_RESTORE');
 update public.projects set project_data=v.project_data,module=v.module,camera_count=v.camera_count,detector_count=v.detector_count,fire_detector_count=v.fire_detector_count,floor_count=v.floor_count,total_budget=coalesce(v.total_budget,p.total_budget),updated_at=now(),updated_by=auth.uid() where id=p.id;
 return p.id;
end $$;
create or replace function public.sigs_resume_project_version(p_version uuid,p_patch jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare p public.projects; pid uuid;
begin
 select project_id into pid from public.project_versions where id=p_version;
 if not found then raise exception 'Gravação indisponível ou sem permissão'; end if;
 select * into p from public.projects where id=pid for update;
 if not found then raise exception 'Projeto indisponível ou sem permissão'; end if;
 if p.status='ARCHIVED' then raise exception 'Projeto arquivado'; end if;
 if jsonb_typeof(p_patch->'project_data') is distinct from 'object' then raise exception 'Dados de projeto inválidos'; end if;
 update public.projects set project_data=p_patch->'project_data',module=p_patch->>'module',total_budget=(p_patch->>'total_budget')::numeric,
 camera_count=(p_patch->>'camera_count')::integer,detector_count=(p_patch->>'detector_count')::integer,fire_detector_count=(p_patch->>'fire_detector_count')::integer,floor_count=(p_patch->>'floor_count')::integer,updated_at=now(),updated_by=auth.uid()
 where id=pid returning * into p;
 if not found then raise exception 'Restauro não autorizado'; end if;
 return public.sigs_restore_project_version(p_version);
end $$;
revoke all on function public.sigs_save_project_checkpoint(uuid,jsonb,text),public.sigs_resume_project_version(uuid,jsonb),public.sigs_create_project_version(uuid,text),public.sigs_restore_project_version(uuid) from public,anon;
grant execute on function public.sigs_save_project_checkpoint(uuid,jsonb,text),public.sigs_resume_project_version(uuid,jsonb),public.sigs_create_project_version(uuid,text),public.sigs_restore_project_version(uuid) to authenticated;
