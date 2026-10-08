begin;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
do $$
declare actor uuid; u uuid:=gen_random_uuid(); email text:='lifecycle-'||gen_random_uuid()::text||'@example.invalid'; result jsonb; cid uuid; second_id uuid; session_id uuid:=gen_random_uuid();
begin
 select id into actor from public.profiles where role='SUPER_ADMIN' and active limit 1;
 if actor is null then raise exception 'No test actor';end if;
 if has_function_privilege('anon','public.sigs_admin_customer(uuid,text,jsonb)','EXECUTE') or has_function_privilege('authenticated','public.sigs_admin_customer(uuid,text,jsonb)','EXECUTE') then raise exception 'Privileged RPC is public';end if;
 perform public.sigs_admin_customer(actor,'check_email',jsonb_build_object('email',email));
 insert into auth.users(id,email,raw_user_meta_data) values(u,email,'{"name":"Lifecycle test"}');
 insert into auth.sessions(id,user_id,created_at,updated_at) values(session_id,u,now(),now());
 begin
  perform public.sigs_admin_customer(actor,'check_email',jsonb_build_object('email',email));raise exception 'Duplicate email accepted';
 exception when unique_violation then null;end;
 begin
  perform public.sigs_admin_customer(actor,'create',jsonb_build_object('user_id',u,'email',email,'name','Test','company_name','Lifecycle invalid plan','plan_code','INVALID'));raise exception 'Invalid plan accepted';
 exception when invalid_parameter_value then null;end;
 if exists(select 1 from public.companies where name='Lifecycle invalid plan') then raise exception 'Failed provisioning left a company';end if;
 result:=public.sigs_admin_customer(actor,'create',jsonb_build_object('user_id',u,'email',email,'name','Test','company_name','Lifecycle test','plan_code','FREE','modules',jsonb_build_array('CCTV')));
 cid:=(result->'company'->>'id')::uuid;
 result:=public.sigs_admin_customer(actor,'cancel_invite',jsonb_build_object('user_id',u));
 if (result->>'cancelled')::boolean or not exists(select 1 from auth.users where id=u) then raise exception 'Cleanup deleted a linked customer';end if;
 begin perform public.sigs_admin_customer(u,'check_email',jsonb_build_object('email',email));raise exception 'Non-super caller accepted';exception when insufficient_privilege then null;end;
 if not exists(select 1 from public.company_members where company_id=cid and user_id=u and role='ADMIN') or not exists(select 1 from public.licenses where company_id=cid) then raise exception 'Incomplete customer';end if;
 insert into public.companies(name,created_by) values('Lifecycle shared',actor) returning id into second_id;
 insert into public.company_members(company_id,user_id,role,active,invited_by) values(second_id,u,'ADMIN',false,actor);
 result:=public.sigs_admin_customer(actor,'delete',jsonb_build_object('company_id',cid));
 if (result->>'users_retained')::int<>1 or not exists(select 1 from auth.users where id=u) then raise exception 'Shared account was deleted';end if;
 result:=public.sigs_admin_customer(actor,'delete',jsonb_build_object('company_id',second_id));
 if (result->>'users_deleted')::int<>1 or exists(select 1 from auth.users where id=u) or exists(select 1 from auth.sessions where id=session_id) or exists(select 1 from public.profiles where id=u) then raise exception 'Auth, profile or session retained';end if;
 perform public.sigs_admin_customer(actor,'check_email',jsonb_build_object('email',email));
 insert into auth.users(id,email,raw_user_meta_data) values(gen_random_uuid(),email,'{"name":"Recreated test"}');
end $$;
rollback;
