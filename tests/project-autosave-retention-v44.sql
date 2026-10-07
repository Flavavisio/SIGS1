-- Integration test against an existing project; all test changes roll back.
begin;
do $$
declare p public.projects; base integer; a1 uuid; a2 uuid; a3 uuid; m uuid; s uuid; protected_ids uuid[];
begin
 select * into p from public.projects order by created_at limit 1;
 if not found then raise exception 'Sem projeto para testar'; end if;
 select coalesce(max(version_no),0)+10 into base from public.project_versions where project_id=p.id;
 select array_agg(id) into protected_ids from public.project_versions where project_id<>p.id or reason<>'AUTO';
 insert into public.project_versions(project_id,company_id,version_no,reason,module,project_data)
 values(p.id,p.company_id,base,'AUTO',p.module,'{"test":1}') returning id into a1;
 insert into public.project_versions(project_id,company_id,version_no,reason,module,project_data)
 values(p.id,p.company_id,base+1,'MANUAL',p.module,'{"test":"manual"}') returning id into m;
 insert into public.project_versions(project_id,company_id,version_no,reason,module,project_data)
 values(p.id,p.company_id,base+2,'AUTO',p.module,'{"test":2}') returning id into a2;
 insert into public.project_versions(project_id,company_id,version_no,reason,module,project_data)
 values(p.id,p.company_id,base+3,'PRE_RESTORE',p.module,'{"test":"safety"}') returning id into s;
 insert into public.project_versions(project_id,company_id,version_no,reason,module,project_data)
 values(p.id,p.company_id,base+4,'AUTO',p.module,'{"test":3}') returning id into a3;
 assert (select count(*)=2 from public.project_versions where project_id=p.id and reason='AUTO'),'Não retém exatamente duas';
 assert not exists(select 1 from public.project_versions where id=a1),'Não removeu a primeira';
 assert (select count(*)=2 from public.project_versions where id in(a2,a3)),'Não preservou as mais recentes';
 assert (select count(*)=2 from public.project_versions where id in(m,s)),'Alterou gravações manuais ou segurança';
 assert not exists(select 1 from unnest(protected_ids) x(id) where not exists(select 1 from public.project_versions v where v.id=x.id)),'Alterou outros projetos ou gravações protegidas';
end $$;
rollback;
select 'PASS: third AUTO replaces oldest; two latest, MANUAL, PRE_RESTORE and other projects preserved; test rolled back' as result;
