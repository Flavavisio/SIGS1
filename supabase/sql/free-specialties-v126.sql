-- One FREE project per company, shared across CCTV, Intrusion and Fire.
-- Existing project quota/RLS rules and the 15-item limit remain authoritative.
begin;

update public.plans set max_projects=1
where code='FREE' and max_projects is distinct from 1;

insert into public.plan_modules(plan_id,module_code,enabled)
select p.id,m.code,true from public.plans p cross join public.modules m
where p.code='FREE' and m.active and m.code in ('CCTV','INTRUSION','FIRE','CLOUD')
on conflict(plan_id,module_code) do update set enabled=excluded.enabled;

-- Apply the same entitlement to existing licenses; new ones inherit plan_modules.
insert into public.license_modules(license_id,module_code,enabled)
select l.id,pm.module_code,pm.enabled
from public.licenses l join public.plans p on p.id=l.plan_id
join public.plan_modules pm on pm.plan_id=p.id
where p.code='FREE'
on conflict(license_id,module_code) do update set enabled=excluded.enabled;

create or replace function private.company_has_module(target_company uuid, requested_module text)
returns boolean
language sql stable security definer
set search_path to ''
as $function$
  select private.is_super_admin() or exists(
    select 1 from public.licenses l
    join public.license_modules lm on lm.license_id=l.id
    where l.id=private.active_license_id(target_company)
      and lm.module_code=requested_module and lm.enabled=true
      and not (requested_module in ('INTRUSION','FIRE') and exists(
        select 1 from public.plans p where p.id=l.plan_id and p.code='EXPRESS'
      ))
  )
$function$;

commit;
