-- All storage metadata/checkpoints are exercised inside a rolled-back transaction.
begin;
create temp table save127_fixture as
select p.id as pid,p.company_id as co,p.created_by as uid,
 (select id from public.profiles where role='SUPER_ADMIN' and active limit 1) as super_uid,
 (select cm.user_id from public.company_members cm join public.profiles pr on pr.id=cm.user_id
  where cm.active and cm.company_id<>p.company_id and pr.role='ADMIN' and pr.active limit 1) as other_uid
from public.projects p join public.profiles pr on pr.id=p.created_by where pr.role='ADMIN' order by p.created_at desc limit 1;
grant select on save127_fixture to authenticated;
select set_config('request.jwt.claim.sub',(select uid::text from save127_fixture),true);
set local role authenticated;
insert into storage.objects(bucket_id,name)
select 'project-files',co||'/'||pid||'/floorplans/save127-rollback-admin.png' from save127_fixture;
do $$
declare p public.projects; patch jsonb; first_version integer;
begin
 select * into p from public.projects where id=(select pid from save127_fixture);
 first_version=p.version_no;
 patch=jsonb_build_object('project_data',p.project_data||jsonb_build_object('fp',jsonb_build_object('storagePath',p.company_id||'/'||p.id||'/floorplans/save127-rollback-admin.png','w',100,'h',100)),
 'module',p.module,'camera_count',p.camera_count,'detector_count',p.detector_count,'fire_detector_count',p.fire_detector_count,'floor_count',p.floor_count,'total_budget',p.total_budget);
 perform public.sigs_save_project_checkpoint(p.id,patch,'MANUAL');
 perform public.sigs_save_project_checkpoint(p.id,patch,'AUTO');
 if not exists(select 1 from public.project_versions where project_id=p.id and reason='MANUAL') then raise exception 'Manual checkpoint missing'; end if;
 if not exists(select 1 from public.project_versions where project_id=p.id and reason='AUTO') then raise exception 'Automatic checkpoint missing'; end if;
 if (select version_no from public.projects where id=p.id)<>first_version+2 then raise exception 'Project version not incremented'; end if;
 if (select project_data->'fp'->>'storagePath' from public.projects where id=p.id) is null then raise exception 'Plant reference lost'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select super_uid::text from save127_fixture),true);
set local role authenticated;
insert into storage.objects(bucket_id,name)
select 'project-files',co||'/'||pid||'/floorplans/save127-rollback-super.png' from save127_fixture where super_uid is not null;
reset role;
select set_config('request.jwt.claim.sub',(select other_uid::text from save127_fixture),true);
set local role authenticated;
do $$ begin
 if (select other_uid from save127_fixture) is not null then
  begin
   insert into storage.objects(bucket_id,name) select 'project-files',co||'/'||pid||'/floorplans/save127-denied.png' from save127_fixture;
   raise exception 'Foreign company upload permitted';
  exception when insufficient_privilege then null;
  end;
 end if;
end $$;
reset role;
rollback;
select 'PASS: manual/automatic checkpoints, persisted plan reference, Admin/Super Admin plan permissions and foreign-company denial; all fixtures rolled back.' as result;
