begin;
do $$
declare co uuid; lid uuid; super_id uuid; u uuid:=gen_random_uuid(); data jsonb; result jsonb; demo public.plans;
begin
 select id into super_id from public.profiles where role='SUPER_ADMIN' and active limit 1;
 if super_id is null then raise exception 'No active Super Admin';end if;
 select * into demo from public.plans where code='DEMO';
 if demo.max_projects<>10 or demo.max_items_per_project<>50 or demo.monthly_price<>0 then raise exception 'Wrong demo entitlements';end if;
 if exists((select pm.module_code,pm.enabled from public.plan_modules pm join public.plans p on p.id=pm.plan_id where p.code='EXPRESS') except (select pm.module_code,pm.enabled from public.plan_modules pm where pm.plan_id=demo.id)) then raise exception 'Missing demo modules';end if;
 insert into public.companies(name,email) values('V58 rollback fixture','v58-fixture@example.invalid') returning id into co;
 insert into public.licenses(company_id,plan_id,license_key,status,billing_interval,starts_at,expires_at)
 select co,id,'SIGS-TEST-'||gen_random_uuid(),'ACTIVE','MONTH',now(),now()+interval '1 month' from public.plans where code='EXPRESS' returning id into lid;
 select payload into data from private.sigs_email_outbox where license_id=lid and event='license_activated';
 if data->>'amount'<>'4,99 €' or data->>'vat'<>'Não incluído' or data->>'expires' is null or data->>'duration' is null then raise exception 'Missing paid email details: %',data;end if;
 update public.licenses set plan_id=demo.id,expires_at=now()+interval '14 days' where id=lid;
 select payload into data from private.sigs_email_outbox where license_id=lid and event='license_updated' and status='pending';
 if data->>'amount'<>'0,00 €' or data->>'duration'<>'14 dias' then raise exception 'Missing demo email details: %',data;end if;
 -- Exercise actual signup trigger and approval with transactional fixtures; no Auth hook sends mail.
 insert into auth.users(id,email,raw_user_meta_data) values(u,'v58-signup@example.invalid',jsonb_build_object('sigs_registration',jsonb_build_object('kind','PERSON','contact_name','V58 Test','plan','PRO')));
 select l.id into lid from public.licenses l join public.company_members m on m.company_id=l.company_id where m.user_id=u;
 select payload into data from private.sigs_email_outbox where license_id=lid and event='license_requested';
 if data->>'amount'<>'9,99 €' or data->>'expires'<>'A definir na aprovação' then raise exception 'Missing signup request email: %',data;end if;
 perform set_config('request.jwt.claim.sub',super_id::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',super_id,'role','authenticated')::text,true);
 perform public.sigs_approve_registration_license(lid);
 if not exists(select 1 from private.sigs_email_outbox where license_id=lid and event='license_activated' and status='pending' and payload->>'expires'<>'A definir na aprovação' and payload->>'amount'='9,99 €') then raise exception 'Missing approval email';end if;
 -- Attempt a forged public self-registration for DEMO. Must fail.
 begin
  insert into auth.users(id,email,raw_user_meta_data) values(gen_random_uuid(),'v58-demo-forged@example.invalid',jsonb_build_object('sigs_registration',jsonb_build_object('kind','PERSON','contact_name','V58 Test','plan','DEMO')));
  raise exception 'PUBLIC DEMO WAS ALLOWED';
 exception when others then
  if sqlerrm='PUBLIC DEMO WAS ALLOWED' then raise;end if;
  if sqlerrm not like '%Plano indisponível%' then raise;end if;
 end;
 -- Exercise Super Admin demo provisioning RPC, including custom validity.
 u:=gen_random_uuid();insert into auth.users(id,email) values(u,'v58-admin-demo@example.invalid');
 perform set_config('request.jwt.claims',jsonb_build_object('sub',super_id,'role','service_role')::text,true);
 result:=public.sigs_admin_customer(super_id,'create',jsonb_build_object('user_id',u,'email','v58-admin-demo@example.invalid','name','V58 Demo','company_name','V58 Demo Fixture','plan_code','DEMO','demo_days',14));
 lid:=(result->'license'->>'id')::uuid;
 if not exists(select 1 from public.licenses where id=lid and expires_at-starts_at=interval '14 days') then raise exception 'Custom demo validity failed';end if;
 select payload into data from private.sigs_email_outbox where license_id=lid and event='license_activated';
 if data->>'amount'<>'0,00 €' then raise exception 'Demo charged money';end if;
end $$;
select 'PASS: issued paid/demo license emails, public paid request and approval emails, demo validity, modules and forbidden self-registration' as result;
rollback;
