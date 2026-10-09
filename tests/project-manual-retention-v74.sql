begin;
do $$
declare p public.projects; base integer; m1 uuid; m2 uuid; m3 uuid; a1 uuid; a2 uuid; a3 uuid; safety uuid; protected_ids uuid[];
begin
 select * into p from public.projects order by created_at limit 1 for update;
 if not found then raise exception 'Sem projeto para testar'; end if;
 select coalesce(max(version_no),0)+10 into base from public.project_versions where project_id=p.id;
 select array_agg(id) into protected_ids from public.project_versions where project_id<>p.id or reason not in ('AUTO','MANUAL');
 insert into public.project_versions(project_id,company_id,version_no,reason,module,project_data) values(p.id,p.company_id,base,'MANUAL',p.module,'{}') returning id into m1;
 insert into public.project_versions(project_id,company_id,version_no,reason,module,project_data) values(p.id,p.company_id,base+1,'AUTO',p.module,'{}') returning id into a1;
 insert into public.project_versions(project_id,company_id,version_no,reason,module,project_data) values(p.id,p.company_id,base+2,'MANUAL',p.module,'{}') returning id into m2;
 insert into public.project_versions(project_id,company_id,version_no,reason,module,project_data) values(p.id,p.company_id,base+3,'AUTO',p.module,'{}') returning id into a2;
 insert into public.project_versions(project_id,company_id,version_no,reason,module,project_data) values(p.id,p.company_id,base+4,'PRE_RESTORE',p.module,'{}') returning id into safety;
 insert into public.project_versions(project_id,company_id,version_no,reason,module,project_data) values(p.id,p.company_id,base+5,'MANUAL',p.module,'{}') returning id into m3;
 assert not exists(select 1 from public.project_versions where id=m1),'Manual mais antiga não removida';
 assert (select count(*)=2 from public.project_versions where project_id=p.id and reason='MANUAL'),'Não conserva duas manuais';
 assert (select count(*)=2 from public.project_versions where id in(a1,a2)),'Manual alterou automáticas';
 insert into public.project_versions(project_id,company_id,version_no,reason,module,project_data) values(p.id,p.company_id,base+6,'AUTO',p.module,'{}') returning id into a3;
 assert not exists(select 1 from public.project_versions where id=a1),'Automática mais antiga não removida';
 assert (select count(*)=2 from public.project_versions where project_id=p.id and reason='AUTO'),'Não conserva duas automáticas';
 assert (select count(*)=2 from public.project_versions where id in(m2,m3)),'Automática alterou manuais';
 assert exists(select 1 from public.project_versions where id=safety),'Alterou cópia de segurança';
 assert not exists(select 1 from unnest(protected_ids) x(id) where not exists(select 1 from public.project_versions v where v.id=x.id)),'Alterou outro projeto ou cópia protegida';
end $$;
rollback;
select 'PASS: two MANUAL and two AUTO independently; third removes oldest of same type; safety and other projects preserved; test rolled back' as result;
