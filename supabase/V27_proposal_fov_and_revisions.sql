-- V27: keep invoker RPCs and company/project RLS; allow existing Super Admin role.
alter policy projects_update on public.projects with check (
 (company_id=private.current_company_id() or private.is_super_admin())
 and (created_by=(select auth.uid()) or assigned_to=(select auth.uid()) or private.is_company_admin(company_id) or private.is_super_admin())
 and private.active_license_id(company_id) is not null
);
alter policy revision_add on public.sigs_quote_revisions with check (
 created_by=(select auth.uid()) and (company_id=private.current_company_id() or private.is_super_admin())
 and private.active_license_id(company_id) is not null
 and exists(select 1 from public.projects p where p.id=project_id and p.company_id=sigs_quote_revisions.company_id and p.status<>'ARCHIVED')
);
alter policy share_add on public.sigs_quote_shares with check (
 (company_id=private.current_company_id() or private.is_super_admin())
 and private.active_license_id(company_id) is not null
 and exists(select 1 from public.sigs_quote_revisions r where r.id=revision_id and r.company_id=sigs_quote_shares.company_id)
 and expires_at>now() and expires_at<=now()+interval '91 days'
 and revoked_at is null and response is null and respondent is null and response_note is null and responded_at is null
 and token_hash ~ '^[0-9a-f]{64}$'
);
alter policy share_revoke on public.sigs_quote_shares with check (
 (company_id=private.current_company_id() or private.is_super_admin())
 and exists(select 1 from public.sigs_quote_revisions r where r.id=revision_id and r.company_id=sigs_quote_shares.company_id)
);

create or replace function public.sigs_save_quote_revision(p_project uuid,p_snapshot jsonb) returns public.sigs_quote_revisions
language plpgsql security invoker set search_path='' as $$
declare p public.projects; r public.sigs_quote_revisions;
begin
 select * into p from public.projects where id=p_project for update;
 if p.id is null or (p.company_id is distinct from private.current_company_id() and not private.is_super_admin()) or auth.uid() is null then raise exception 'Projeto não disponível'; end if;
 if p.status='ARCHIVED' then raise exception 'Projeto arquivado'; end if;
 insert into public.sigs_quote_revisions(project_id,company_id,revision_no,public_snapshot)
 values(p.id,p.company_id,coalesce((select max(revision_no) from public.sigs_quote_revisions where project_id=p.id),0)+1,p_snapshot) returning * into r;
 return r;
end $$;
revoke all on function public.sigs_save_quote_revision(uuid,jsonb) from public,anon;
grant execute on function public.sigs_save_quote_revision(uuid,jsonb) to authenticated;


create or replace function private.sigs_public_quote(p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.sigs_quote_shares; snap jsonb;
begin
 if p_token !~ '^[0-9a-f]{64}$' then return null; end if;
 select * into s from public.sigs_quote_shares where token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and revoked_at is null and expires_at>now();
 if s.id is null then return null; end if;
 select public_snapshot into snap from public.sigs_quote_revisions where id=s.revision_id;
 -- A strict public field allowlist; internal project/commercial data is never read.
 snap=jsonb_build_object('project',snap->'project','company',snap->'company','client',snap->'client','reference',snap->'reference','description',snap->'description','terms',snap->'terms','validity',snap->'validity','date',snap->'date','logo',snap->'logo','color',snap->'color','contacts',snap->'contacts','alternative',snap->'alternative','sub',snap->'sub','tax',snap->'tax','total',snap->'total','taxRate',snap->'taxRate','discount',snap->'discount','floors',(select coalesce(jsonb_agg(jsonb_build_object('name',f->'name','scale',case when jsonb_typeof(f->'scale')='object' then jsonb_build_object('ok',f->'scale'->'ok','ppm',f->'scale'->'ppm') else null end,'fp',case when jsonb_typeof(f->'fp')='object' then jsonb_build_object('x',f->'fp'->'x','y',f->'fp'->'y','w',f->'fp'->'w','h',f->'fp'->'h','image',f->'fp'->'image') else null end,'devices',(select coalesce(jsonb_agg(jsonb_build_object('x',d->'x','y',d->'y','label',d->'label','ref',d->'ref','name',d->'name','type',d->'type','lens',d->'lens','rotation',d->'rotation','fov',d->'fov','range',d->'range','thermalFov',d->'thermalFov','thermalRange',d->'thermalRange')),'[]'::jsonb) from jsonb_array_elements(coalesce(f->'devices','[]'::jsonb)) d))),'[]'::jsonb) from jsonb_array_elements(coalesce(snap->'floors','[]'::jsonb)) f),'lines',(select coalesce(jsonb_agg(jsonb_build_object('ref',x->'ref','name',x->'name','qty',x->'qty','unit',x->'unit','sale',x->'sale','net',x->'net')),'[]'::jsonb) from jsonb_array_elements(coalesce(snap->'lines','[]'::jsonb)) x));
 return jsonb_build_object('snapshot',snap,'response',s.response,'responded_at',s.responded_at,'expires_at',s.expires_at);
end $$;

notify pgrst, 'reload schema';
