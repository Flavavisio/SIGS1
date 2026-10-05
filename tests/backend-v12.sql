begin;
create temp table w12_test (uid uuid,co uuid,foreign_co uuid,pid uuid,rid uuid,sid uuid,token text);
insert into w12_test(uid,co,foreign_co,pid,token) select user_id,company_id,gen_random_uuid(),gen_random_uuid(),encode(extensions.gen_random_bytes(32),'hex') from public.company_members where active and role='ADMIN' limit 1;
grant select,update on w12_test to authenticated,anon;
select set_config('request.jwt.claim.sub',(select uid::text from w12_test),true);
insert into public.companies(id,name) select foreign_co,'SIGS isolated rollback fixture' from w12_test;
set local role authenticated;
insert into public.projects(id,company_id,created_by,name,module) select pid,co,uid,'SIGS workflow rollback fixture','CCTV' from w12_test;
insert into public.sigs_clients(company_id,name) select co,'Test client' from w12_test;
insert into public.sigs_company_preferences(company_id,settings) select co,'{"company":"Test"}' from w12_test;
insert into public.sigs_supplier_prices(company_id,reference,name,cost,pvp,stock) select co,'TEST-SIGS-12','Test',10,20,5 from w12_test;
do $$ begin
 if not exists(select 1 from public.sigs_clients where name='Test client') then raise exception 'Client write/read failed'; end if;
 begin
  insert into public.sigs_clients(company_id,name) select foreign_co,'Denied' from w12_test;
  raise exception 'Cross company write permitted';
 exception when insufficient_privilege then null; end;
end $$;
update w12_test set rid=(public.sigs_save_quote_revision(pid,'{"project":"Test","terms":"Pagamento: 50% na adjudicação; Execução: prazo a acordar","cost":999,"lines":[{"ref":"TEST","qty":1,"sale":20,"net":20,"cost":10}],"floors":[{"name":"Piso","cost":100,"fp":{"x":0,"y":0,"w":100,"h":100,"secret":"denied"},"devices":[{"x":1,"y":2,"label":"D1","cost":10}]}],"total":24.6}')).id;
update w12_test set sid=public.sigs_publish_quote(rid,token,30);
do $$ begin
 begin
  update public.sigs_quote_shares set response='ACCEPTED' where id=(select sid from w12_test);
  raise exception 'Response editable through authenticated REST';
 exception when insufficient_privilege then null; end;
end $$;
set local role anon;
do $$ declare got jsonb; begin
 if has_table_privilege('anon','public.sigs_quote_revisions','select') or has_table_privilege('anon','public.sigs_quote_shares','select') then raise exception 'Anon raw grants'; end if;
 got=public.sigs_public_quote((select token from w12_test));
 if got->'snapshot'->>'terms' not like '%50% na adjudicação%' then raise exception 'Commercial conditions lost in public snapshot'; end if;
 if got is null then raise exception 'Valid token failed'; end if;
 if got::text like '%cost%' or got::text like '%secret%' then raise exception 'Internal fields exposed'; end if;
 if public.sigs_public_quote(repeat('0',64)) is not null then raise exception 'Invalid token exposed data'; end if;
 if not public.sigs_respond_quote((select token from w12_test),'ACCEPTED','Test client','Accepted') then raise exception 'Response failed'; end if;
 if public.sigs_respond_quote((select token from w12_test),'DECLINED','Test client','Again') then raise exception 'Repeat response permitted'; end if;
end $$;
set local role authenticated;
update public.sigs_quote_shares set revoked_at=now() where id=(select sid from w12_test);
set local role anon;
do $$ begin if public.sigs_public_quote((select token from w12_test)) is not null then raise exception 'Revoked token works'; end if; end $$;
reset role;
rollback;
select 'PASS: company isolation, clients/preferences/catalog writes, revision RPC, public allowlist, token access, single response and revocation. Fixtures rolled back.' as result;
