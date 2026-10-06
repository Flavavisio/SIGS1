-- Auth creates the identity; this private insert-only trigger provisions its own tenant.
-- User metadata is form input only. Roles, tenant IDs, status, limits and modules are server controlled.
alter table public.companies add column if not exists account_kind text not null default 'COMPANY' check(account_kind in ('PERSON','COMPANY'));
create or replace function private.sigs_register_auth_user()
returns trigger language plpgsql security definer set search_path='' as $$
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
 insert into public.license_modules(license_id,module_code,enabled) select lid,code,true from public.modules where active;
 insert into public.audit_logs(company_id,user_id,action,entity_type,entity_id,metadata)
 values(cid,new.id,case when plan.code='FREE' then 'FREE_REGISTRATION_ACTIVATED' else 'PAID_REGISTRATION_REQUESTED' end,'license',lid,jsonb_build_object('plan',plan.code,'kind',kind));
 return new;
end $$;
revoke all on function private.sigs_register_auth_user() from public,anon,authenticated;
drop trigger if exists sigs_signup_provision on auth.users;
create trigger sigs_signup_provision after insert on auth.users for each row execute function private.sigs_register_auth_user();
-- Paid requests start their billing period only when approved, rather than on signup.
create or replace function private.sigs_approve_registration_license(p_license uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare l public.licenses; code text; duration interval;
begin
 if auth.uid() is null or not private.is_super_admin() then raise exception 'Apenas o Super Admin pode aprovar'; end if;
 select * into l from public.licenses where id=p_license for update;
 if not found then raise exception 'Pedido não encontrado'; end if;
 select p.code into code from public.plans p where p.id=l.plan_id and p.active;
 if code is null or code not in ('EXPRESS','PRO','SUPREME') then raise exception 'Apenas os planos pagos requerem aprovação'; end if;
 if l.status<>'PENDING' then raise exception 'O pedido já foi tratado'; end if;
 duration:=case when l.billing_interval='YEAR' then interval '1 year' else interval '1 month' end;
 update public.licenses set status='ACTIVE',starts_at=now(),expires_at=now()+duration where id=l.id;
 insert into public.audit_logs(company_id,user_id,action,entity_type,entity_id,metadata) values(l.company_id,auth.uid(),'PAID_REGISTRATION_APPROVED','license',l.id,jsonb_build_object('plan',code));
 return l.id;
end $$;
revoke all on function private.sigs_approve_registration_license(uuid) from public,anon;
grant execute on function private.sigs_approve_registration_license(uuid) to authenticated;
create or replace function public.sigs_approve_registration_license(p_license uuid)
returns uuid language sql security invoker set search_path='' as $$
 select private.sigs_approve_registration_license(p_license)
$$;
revoke all on function public.sigs_approve_registration_license(uuid) from public,anon;
grant execute on function public.sigs_approve_registration_license(uuid) to authenticated;
