begin;
create temp table email_fixture(co uuid,lid uuid,uid uuid,lease uuid,job uuid);
insert into email_fixture(co,lid,uid) values(gen_random_uuid(),gen_random_uuid(),gen_random_uuid());
insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data,created_at,updated_at) select uid,'email-fixture-'||uid::text||'@example.invalid','{}'::jsonb,'{}'::jsonb,now(),now() from email_fixture;
update public.profiles set role='ADMIN',active=true where id=(select uid from email_fixture);
insert into public.companies(id,name,email) select co,'SIGS email rollback fixture','fixture@example.invalid' from email_fixture;
insert into public.licenses(id,company_id,plan_id,license_key,status,starts_at,expires_at) select lid,co,(select id from public.plans where code='PRO'), 'EMAIL-ROLLBACK-FIXTURE','ACTIVE',now(),now()+interval '7 days' from email_fixture;
do $$declare n integer;begin
 if not exists(select 1 from private.sigs_email_outbox where company_id=(select co from email_fixture) and event='license_activated') then raise exception 'Activation not queued';end if;
 perform private.sigs_schedule_license_emails();select count(*) into n from private.sigs_email_outbox where company_id=(select co from email_fixture) and event='license_expiring';
 perform private.sigs_schedule_license_emails();if n<>1 or n<>(select count(*) from private.sigs_email_outbox where company_id=(select co from email_fixture) and event='license_expiring') then raise exception 'Reminder deduplication failed';end if;
end$$;
update public.licenses set expires_at=expires_at+interval '1 month' where id=(select lid from email_fixture);
do $$begin if not exists(select 1 from private.sigs_email_outbox where company_id=(select co from email_fixture) and event='license_renewed' and status='pending') then raise exception 'Renewal not queued';end if;end$$;
update public.licenses set status='SUSPENDED' where id=(select lid from email_fixture);
update public.licenses set status='ACTIVE' where id=(select lid from email_fixture);
insert into public.company_members(company_id,user_id,role,active) select co,uid,'ADMIN',true from email_fixture;
do $$begin
 if not exists(select 1 from private.sigs_email_outbox where company_id=(select co from email_fixture) and event='welcome') then raise exception 'Welcome missing';end if;
 if has_function_privilege('authenticated','public.sigs_email_claim(integer)','execute') or has_function_privilege('anon','public.sigs_email_status()','execute') or has_function_privilege('authenticated','private.sigs_email_complete(uuid,uuid,boolean,text)','execute') or has_table_privilege('authenticated','private.sigs_email_outbox','select') then raise exception 'Email access leak';end if;
 if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='private' and c.relname='sigs_email_outbox' and c.relrowsecurity) then raise exception 'RLS missing';end if;
end$$;
-- Restrict due rows to the rollback fixture to exercise the real claim/lease completion path.
update private.sigs_email_outbox set available_at=now()+interval '1 day' where company_id<>(select co from email_fixture) and status='pending';
update email_fixture set job=q.id,lease=q.lease_id from(select * from private.sigs_email_claim(1)) q;
do $$begin
 if private.sigs_email_complete((select job from email_fixture),gen_random_uuid(),true) then raise exception 'Foreign lease completed';end if;
 if not private.sigs_email_complete((select job from email_fixture),(select lease from email_fixture),true) then raise exception 'Delivery completion failed';end if;
 if private.sigs_email_complete((select job from email_fixture),(select lease from email_fixture),true) then raise exception 'Delivery completed twice';end if;
end$$;
select set_config('request.jwt.claim.sub',(select uid::text from email_fixture),true);
set local role authenticated;
do $$begin
 begin perform public.sigs_email_status();raise exception 'Company Admin read global email status';exception when insufficient_privilege then null;end;
end$$;
reset role;
select 'PASS: activation, renewal, reactivation, welcome, reminder deduplication, role grants, RLS and delivery lease isolation. Fixtures rolled back.' as result;
rollback;
