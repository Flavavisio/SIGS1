-- Paid plan module policy. FREE and custom/demo policies remain unchanged.
insert into public.plan_modules(plan_id,module_code,enabled)
select p.id,m.code,case when p.code='EXPRESS' and m.code in ('INTRUSION','FIRE') then false else true end
from public.plans p cross join public.modules m where p.code in ('EXPRESS','PRO','SUPREME') and m.active
on conflict(plan_id,module_code) do update set enabled=excluded.enabled;

insert into public.license_modules(license_id,module_code,enabled)
select l.id,pm.module_code,pm.enabled from public.licenses l join public.plans p on p.id=l.plan_id
join public.plan_modules pm on pm.plan_id=p.id where p.code in ('EXPRESS','PRO','SUPREME')
on conflict(license_id,module_code) do update set enabled=excluded.enabled;
CREATE OR REPLACE FUNCTION private.sigs_register_auth_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare r jsonb; plan public.plans; cid uuid; lid uuid; kind text; contact_name text; space_name text;
begin
 r:=new.raw_user_meta_data->'sigs_registration';
 if r is null or jsonb_typeof(r)<>'object' then return new; end if;
 kind:=upper(coalesce(r->>'kind',''));
 contact_name:=trim(coalesce(r->>'contact_name',''));
 space_name:=case when kind='PERSON' then contact_name else trim(coalesce(r->>'company_name','')) end;
 if kind not in ('PERSON','COMPANY') or char_length(contact_name) not between 2 and 120 or char_length(space_name) not between 2 and 160 or new.email is null then raise exception 'Dados de registo inválidos'; end if;
 if char_length(coalesce(r->>'phone',''))>40 or char_length(coalesce(r->>'nif',''))>32 then raise exception 'Dados de contacto inválidos'; end if;
 select * into plan from public.plans where code=upper(r->>'plan') and code in ('FREE','EXPRESS','PRO','SUPREME') and active;
 if not found then raise exception 'Plano indisponível'; end if;
 update public.profiles set name=contact_name,role='ADMIN',active=true where id=new.id;
 insert into public.companies(name,legal_name,email,phone,nif,account_kind,created_by)
 values(space_name,case when kind='COMPANY' then space_name else null end,new.email,nullif(trim(r->>'phone'),''),nullif(trim(r->>'nif'),''),kind,new.id) returning id into cid;
 insert into public.company_settings(company_id,commercial_name) values(cid,space_name);
 insert into public.company_members(company_id,user_id,role,active) values(cid,new.id,'ADMIN',true);
 insert into public.licenses(company_id,plan_id,license_key,status,max_sales_users,billing_interval,starts_at,expires_at,notes,created_by)
 values(cid,plan.id,'SIGS-'||upper(gen_random_uuid()::text),case when plan.code='FREE' then 'ACTIVE'::public.license_status else 'PENDING'::public.license_status end,null,'MONTH',now(),null,'Registo público · '||kind,new.id) returning id into lid;
 insert into public.license_modules(license_id,module_code,enabled) select lid,m.code,coalesce(pm.enabled,true) from public.modules m left join public.plan_modules pm on pm.plan_id=plan.id and pm.module_code=m.code where m.active;
 insert into public.audit_logs(company_id,user_id,action,entity_type,entity_id,metadata)
 values(cid,new.id,case when plan.code='FREE' then 'FREE_REGISTRATION_ACTIVATED' else 'PAID_REGISTRATION_REQUESTED' end,'license',lid,jsonb_build_object('plan',plan.code,'kind',kind));
 return new;
end $function$
;
CREATE OR REPLACE FUNCTION private.sigs_admin_customer(p_caller uuid, p_action text, p_data jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare cid uuid; uid uuid; ids uuid[]; co public.companies; lic public.licenses; pl public.plans; mail text; nm text; ending timestamptz; interval_name text; wanted_modules text[]; objects jsonb; kept integer; n integer; demo_days integer;
begin
 if coalesce(auth.role(),'')<>'service_role' or not exists(select 1 from public.profiles where id=p_caller and role='SUPER_ADMIN' and active) then raise exception 'SUPER_ADMIN required' using errcode='42501'; end if;
 if p_action='check_email' then
  mail:=lower(trim(p_data->>'email'));
  if mail is null or mail !~ '^[^[:space:]@,;<>]+@[^[:space:]@,;<>]+\.[^[:space:]@,;<>]+$' then raise exception 'Email inválido' using errcode='22023';end if;
  if exists(select 1 from auth.users where lower(email)=mail) then raise exception 'Este email já tem uma conta no SIGS. Elimina a conta antiga antes de voltar a usar o email.' using errcode='23505';end if;
  return jsonb_build_object('available',true);
 elsif p_action='create' then
  uid:=(p_data->>'user_id')::uuid;mail:=lower(trim(p_data->>'email'));nm:=trim(p_data->>'company_name');
  if nm is null or nm='' or trim(coalesce(p_data->>'name',''))='' then raise exception 'Empresa e nome do cliente são obrigatórios' using errcode='22023';end if;
  perform 1 from auth.users where id=uid and lower(email)=mail for update;
  if not found or exists(select 1 from public.company_members where user_id=uid) or exists(select 1 from public.profiles where id=uid and role='SUPER_ADMIN') then raise exception 'Conta indisponível para este convite' using errcode='23505';end if;
  select * into pl from public.plans where code=upper(coalesce(p_data->>'plan_code','EXPRESS')) and active;
  if not found then raise exception 'Plano inválido' using errcode='22023';end if;
  interval_name:=case when p_data->>'billing_interval'='YEAR' then 'YEAR' else 'MONTH' end;
  ending:=now()+case when interval_name='YEAR' then interval '1 year' else interval '1 month' end;
  if pl.code='DEMO' then
   demo_days:=coalesce((p_data->>'demo_days')::integer,30);
   if demo_days not between 1 and 365 then raise exception 'A demo deve durar entre 1 e 365 dias' using errcode='22023';end if;
   interval_name:='MONTH';ending:=now()+make_interval(days=>demo_days);
  end if;
  update public.profiles set name=trim(p_data->>'name'),email=mail,role='ADMIN',active=true where id=uid;
  insert into public.companies(name,email,nif,client_code,created_by) values(nm,mail,nullif(trim(p_data->>'nif'),''),nullif(trim(p_data->>'client_code'),''),p_caller) returning * into co;
  insert into public.company_settings(company_id,commercial_name) values(co.id,nm);
  insert into public.company_members(company_id,user_id,role,active,invited_by) values(co.id,uid,'ADMIN',true,p_caller);
  insert into public.licenses(company_id,plan_id,license_key,status,max_sales_users,billing_interval,starts_at,expires_at,trial_until,auto_renew,created_by)
   values(co.id,pl.id,'SIGS-'||upper(gen_random_uuid()::text),'ACTIVE',null,interval_name::public.billing_interval,now(),ending,case when pl.code='DEMO' then ending else null end,false,p_caller) returning * into lic;
  if jsonb_typeof(p_data->'modules')='array' then select array_agg(value) into wanted_modules from jsonb_array_elements_text(p_data->'modules');end if;
  wanted_modules:=coalesce(wanted_modules,array['CCTV','INTRUSION','FIRE','CLOUD']);
  insert into public.license_modules(license_id,module_code,enabled) select lic.id,m.code,case when pl.code in ('EXPRESS','PRO','SUPREME') then coalesce(pm.enabled,false) else true end from public.modules m left join public.plan_modules pm on pm.plan_id=pl.id and pm.module_code=m.code where m.active and (pl.code in ('EXPRESS','PRO','SUPREME') or m.code=any(wanted_modules));
  insert into public.invitations(company_id,email,role,status,expires_at,invited_by) values(co.id,mail,'ADMIN','PENDING',now()+interval '1 hour',p_caller);
  insert into public.audit_logs(company_id,user_id,action,entity_type,entity_id,metadata) values(co.id,p_caller,'CUSTOMER_INVITED','user',uid,jsonb_build_object('email',mail,'license_id',lic.id));
  return jsonb_build_object('company',to_jsonb(co),'license',to_jsonb(lic),'activation_email_sent',true);
 elsif p_action='cancel_invite' then
  uid:=(p_data->>'user_id')::uuid;
  perform 1 from auth.users where id=uid for update;
  if exists(select 1 from public.company_members where user_id=uid) or exists(select 1 from public.profiles where id=uid and role='SUPER_ADMIN') then return jsonb_build_object('cancelled',false);end if;
  delete from auth.users where id=uid;
  return jsonb_build_object('cancelled',true);
 elsif p_action in ('delete_preview','delete') then
  cid:=(p_data->>'company_id')::uuid;
  select * into co from public.companies where id=cid for update;
  if not found then raise exception 'Empresa não encontrada' using errcode='P0002';end if;
  if exists(select 1 from public.company_members m join public.profiles p on p.id=m.user_id where m.company_id=cid and (p.id=p_caller or p.role='SUPER_ADMIN')) then raise exception 'Não podes eliminar uma empresa associada ao Super Admin' using errcode='42501';end if;
  select coalesce(array_agg(m.user_id),'{}'::uuid[]) into ids from public.company_members m where m.company_id=cid and not exists(select 1 from public.company_members other where other.user_id=m.user_id and other.company_id<>cid);
  select count(*) into kept from public.company_members where company_id=cid and not(user_id=any(ids));
  if exists(select 1 from public.projects where company_id<>cid and (created_by=any(ids) or updated_by=any(ids))) or exists(select 1 from public.project_versions where company_id<>cid and saved_by=any(ids)) or exists(select 1 from public.sigs_clients where company_id<>cid and created_by=any(ids)) or exists(select 1 from public.sigs_quote_revisions where company_id<>cid and created_by=any(ids)) or exists(select 1 from public.invitations where company_id<>cid and invited_by=any(ids)) then raise exception 'Um utilizador tem registos noutra empresa. Resolve essas associações antes de apagar.' using errcode='23503';end if;
  if exists(select 1 from storage.objects where (owner_id=any(ids::text[]) or owner=any(ids)) and split_part(name,'/',1)<>cid::text) then raise exception 'Um utilizador tem ficheiros fora desta empresa. Resolve essas associações antes de apagar.' using errcode='23503';end if;
  select coalesce(jsonb_agg(jsonb_build_object('bucket',bucket_id,'path',name)),'[]'::jsonb) into objects from storage.objects where split_part(name,'/',1)=cid::text;
  if p_action='delete_preview' then return jsonb_build_object('objects',objects,'users_to_delete',cardinality(ids),'users_retained',kept);end if;
  if jsonb_array_length(objects)>0 then raise exception 'Os ficheiros da empresa devem ser removidos pelo Storage API antes da eliminação' using errcode='23503';end if;
  delete from public.sigs_quote_shares where company_id=cid;
  delete from public.sigs_quote_revisions where company_id=cid;
  delete from public.companies where id=cid;
  -- Hard delete: identities, refresh sessions and profiles cascade together.
  delete from auth.users where id=any(ids);get diagnostics n=row_count;
  insert into public.audit_logs(company_id,user_id,action,entity_type,entity_id,metadata) values(null,p_caller,'COMPANY_DELETED','company',cid,jsonb_build_object('users_deleted',n,'users_retained',kept));
  return jsonb_build_object('ok',true,'users_deleted',n,'users_retained',kept);
 end if;
 raise exception 'Operação inválida' using errcode='22023';
end $function$
;
CREATE OR REPLACE FUNCTION private.company_has_module(target_company uuid, requested_module text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select private.is_super_admin() or exists(
    select 1
    from public.licenses l
    join public.license_modules lm on lm.license_id=l.id
    where l.id=private.active_license_id(target_company)
      and lm.module_code=requested_module
      and lm.enabled=true
      and not (requested_module in ('INTRUSION','FIRE') and exists(select 1 from public.plans p where p.id=l.plan_id and p.code='EXPRESS'))
  )
$function$
;

create or replace function private.sigs_sync_paid_plan_modules()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.plans p where p.id=new.plan_id and p.code in ('EXPRESS','PRO','SUPREME')) then
  insert into public.license_modules(license_id,module_code,enabled)
  select new.id,pm.module_code,pm.enabled from public.plan_modules pm where pm.plan_id=new.plan_id
  on conflict(license_id,module_code) do update set enabled=excluded.enabled;
 end if;
 return new;
end $$;
revoke all on function private.sigs_sync_paid_plan_modules() from public,anon,authenticated;
create trigger sigs_sync_paid_plan_modules after update of plan_id on public.licenses
for each row when (old.plan_id is distinct from new.plan_id) execute function private.sigs_sync_paid_plan_modules();

