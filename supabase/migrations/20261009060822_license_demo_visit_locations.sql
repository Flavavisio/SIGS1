create index if not exists sigs_visits_ip_recent on public.sigs_visits(ip,created_at desc) where ip is not null;
create index if not exists sigs_access_ip_recent on public.sigs_access_events(ip,created_at desc) where ip is not null;
alter table public.sigs_access_events add column if not exists city text, add column if not exists region text, add column if not exists country text;
-- Demo is issued by Super Admin only; public registration still allowlists paid/Free plans.
insert into public.plans(code,name,description,monthly_price,yearly_price,currency,active,sort_order,max_projects,max_items_per_project,default_max_sales_users)
select 'DEMO','Demo Express','Demo gratuita com os limites e módulos do Express',0,0,currency,true,15,max_projects,max_items_per_project,default_max_sales_users from public.plans where code='EXPRESS'
on conflict(code) do update set name=excluded.name,description=excluded.description,monthly_price=0,yearly_price=0,max_projects=excluded.max_projects,max_items_per_project=excluded.max_items_per_project,active=true;
insert into public.plan_modules(plan_id,module_code,enabled)
select d.id,m.module_code,m.enabled from public.plan_modules m join public.plans e on e.id=m.plan_id and e.code='EXPRESS' cross join public.plans d where d.code='DEMO'
on conflict(plan_id,module_code) do update set enabled=excluded.enabled;
alter table private.sigs_email_outbox drop constraint if exists sigs_email_outbox_event_check;
alter table private.sigs_email_outbox add constraint sigs_email_outbox_event_check check(event in ('welcome','license_activated','license_renewed','license_expiring','license_expired','license_suspended','license_reactivated','license_requested','license_updated'));
create or replace function private.sigs_queue_license_email(lid uuid, kind text, discriminator text, days_left integer default null)
returns integer language plpgsql security definer set search_path='' as $$
declare l record; r record; n integer:=0; added integer; data jsonb;
begin
 select x.*,c.name as company_name,c.email as company_email,p.name as plan_name,p.code as plan_code,p.monthly_price,p.yearly_price,p.currency,p.max_projects,p.max_items_per_project
 into l from public.licenses x join public.companies c on c.id=x.company_id join public.plans p on p.id=x.plan_id where x.id=lid;
 if not found then return 0; end if;
 data:=jsonb_build_object('company',l.company_name,'plan',l.plan_name,
  'reference','SIGS-'||upper(left(l.id::text,8)),
  'billing',case when l.plan_code='DEMO' then 'Demo gratuita' when l.billing_interval='YEAR' then 'Anual' else 'Mensal' end,
  'starts',case when l.status='PENDING' then 'Após aprovação' else to_char(l.starts_at at time zone 'Europe/Lisbon','DD/MM/YYYY HH24:MI') end,
  'expires',case when l.status='PENDING' then 'A definir na aprovação' when l.expires_at is null then 'Sem vencimento' else to_char(l.expires_at at time zone 'Europe/Lisbon','DD/MM/YYYY HH24:MI') end,
  'duration',case when l.status='PENDING' then case when l.billing_interval='YEAR' then '1 ano após aprovação' else '1 mês após aprovação' end when l.expires_at is null then 'Sem limite de tempo' else greatest(0,ceil(extract(epoch from (l.expires_at-l.starts_at))/86400))::text||' dias' end,
  'amount',case when l.plan_code in ('DEMO','FREE') then '0,00 €' when (case when l.billing_interval='YEAR' then coalesce(l.yearly_price,l.monthly_price*12) else l.monthly_price end) is null then 'Sob consulta' else replace(to_char(case when l.billing_interval='YEAR' then coalesce(l.yearly_price,l.monthly_price*12) else l.monthly_price end,'FM999999990.00'),'.',',')||' '||case when l.currency='EUR' then '€' else l.currency end end,
  'vat',case when l.plan_code in ('DEMO','FREE') then 'Sem valor a pagar' else 'Não incluído' end,
  'payment',case when l.plan_code='DEMO' then 'Demo gratuita · sem cobrança nem conversão automática' when l.plan_code='FREE' then 'Plano gratuito' when l.status='PENDING' then 'Pedido pendente · sem cobrança pelo formulário' else 'Contacta o SIGS Studio para pagamento. Este email não comprova um pagamento.' end,
  'maxProjects',l.max_projects,'maxItems',l.max_items_per_project,'days',days_left);
 for r in select distinct lower(u.email) as email from public.company_members m join auth.users u on u.id=m.user_id join public.profiles p on p.id=m.user_id where m.company_id=l.company_id and m.role='ADMIN' and m.active and p.active and u.email is not null
 union select lower(l.company_email) where l.company_email is not null and not exists(select 1 from public.company_members m join public.profiles p on p.id=m.user_id where m.company_id=l.company_id and m.role='ADMIN' and m.active and p.active)
 loop
  insert into private.sigs_email_outbox(company_id,license_id,event,recipient,payload,dedupe_key)
  values(l.company_id,l.id,kind,r.email,data,l.id::text||':'||kind||':'||discriminator||':'||r.email) on conflict(dedupe_key) do nothing;
  get diagnostics added=row_count;n:=n+added;
 end loop;
 return n;
end $$;
revoke all on function private.sigs_queue_license_email(uuid,text,text,integer) from public,anon,authenticated;

create or replace function private.sigs_license_email_event() returns trigger language plpgsql security definer set search_path='' as $$
declare kind text;
begin
 if tg_op='INSERT' then
  if new.status='ACTIVE' then kind:='license_activated';elsif new.status='PENDING' then kind:='license_requested';elsif new.status='SUSPENDED' then kind:='license_suspended';else return new;end if;
 else
  if new.status='SUSPENDED' and old.status is distinct from new.status then kind:='license_suspended';
  elsif new.status='EXPIRED' and old.status is distinct from new.status then kind:='license_expired';
  elsif new.status='ACTIVE' and old.status='PENDING' then kind:='license_activated';
  elsif new.status='ACTIVE' and (new.plan_id is distinct from old.plan_id or new.billing_interval is distinct from old.billing_interval) then kind:='license_updated';
  elsif new.status='ACTIVE' and new.expires_at>old.expires_at then kind:='license_renewed';
  elsif new.status='ACTIVE' and old.status is distinct from new.status then kind:='license_reactivated';
  elsif new.status='ACTIVE' and (new.expires_at is distinct from old.expires_at or new.starts_at is distinct from old.starts_at) then kind:='license_updated';
  else return new;end if;
  update private.sigs_email_outbox set status='cancelled' where license_id=new.id and status='pending' and event<>'welcome';
 end if;
 perform private.sigs_queue_license_email(new.id,kind,case when kind='license_expired' then new.expires_at::text else new.updated_at::text end);
 return new;
end $$;
revoke all on function private.sigs_license_email_event() from public,anon,authenticated;
drop trigger if exists sigs_license_email_event on public.licenses;
create trigger sigs_license_email_event after insert or update on public.licenses for each row execute function private.sigs_license_email_event();

-- Internal service-only administration. The Edge Function verifies the caller JWT.
create or replace function private.sigs_admin_customer(p_caller uuid,p_action text,p_data jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
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
  insert into public.license_modules(license_id,module_code,enabled) select lic.id,code,true from public.modules where code=any(wanted_modules) and active;
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
end $$;
revoke all on function private.sigs_admin_customer(uuid,text,jsonb) from public,anon,authenticated;
grant usage on schema private to service_role;
grant execute on function private.sigs_admin_customer(uuid,text,jsonb) to service_role;
create or replace function public.sigs_admin_customer(p_caller uuid,p_action text,p_data jsonb default '{}'::jsonb) returns jsonb language sql security invoker set search_path='' as $$ select private.sigs_admin_customer(p_caller,p_action,p_data); $$;
revoke all on function public.sigs_admin_customer(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.sigs_admin_customer(uuid,text,jsonb) to service_role;
