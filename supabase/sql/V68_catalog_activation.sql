-- Company-scoped catalogue activation. The code itself is never shipped to clients.
create table if not exists private.company_catalog_activations (
 company_id uuid not null references public.companies(id) on delete cascade,
 brand text not null check (brand = 'dahua'),
 activated_by uuid references auth.users(id) on delete set null,
 activated_at timestamptz not null default now(),
 primary key (company_id, brand)
);
alter table private.company_catalog_activations enable row level security;
create policy catalog_activation_no_direct_access on private.company_catalog_activations for all to authenticated using(false) with check(false);
revoke all on private.company_catalog_activations from public, anon, authenticated;

create or replace function private.catalog_brand_allowed(p_brand text)
returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and (lower(coalesce(p_brand,'')) <> 'dahua'
 or private.is_super_admin() or exists (
 select 1 from private.company_catalog_activations a
 where a.company_id = private.current_company_id() and a.brand = 'dahua'));
$$;
create or replace function private.activate_catalog(p_company_id uuid, p_code text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null or not exists (
 select 1 from public.company_members m join public.profiles p on p.id=m.user_id
 join public.companies c on c.id=m.company_id
 where m.user_id=auth.uid() and m.company_id=p_company_id and m.active and p.active
 and m.role='ADMIN' and c.status='ACTIVE') then
 raise exception 'Sem permissão para ativar equipamentos nesta empresa.' using errcode='42501';
 end if;
 if md5(btrim(coalesce(p_code,''))) <> '27e1209c876827c86bf9f497f773edc5' then
 raise exception 'Código de ativação inválido.' using errcode='22023';
 end if;
 insert into private.company_catalog_activations(company_id,brand,activated_by)
 values(p_company_id,'dahua',auth.uid()) on conflict(company_id,brand) do nothing;
 return true;
end;
$$;
create or replace function public.sigs_activate_catalog(p_company_id uuid, p_code text)
returns boolean language sql security invoker set search_path = '' as $$
 select private.activate_catalog(p_company_id,p_code);
$$;
create or replace function public.sigs_catalog_access()
returns boolean language sql stable security invoker set search_path = '' as $$
 select private.catalog_brand_allowed('dahua');
$$;
revoke all on function private.catalog_brand_allowed(text), private.activate_catalog(uuid,text), public.sigs_activate_catalog(uuid,text), public.sigs_catalog_access() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.catalog_brand_allowed(text), private.activate_catalog(uuid,text), public.sigs_activate_catalog(uuid,text), public.sigs_catalog_access() to authenticated;

-- Restrictive policies also cover direct catalogue API requests.
create policy catalog_activation_brands on public.product_brands as restrictive for select to authenticated
using (private.catalog_brand_allowed(slug));
create policy catalog_activation_products on public.products as restrictive for select to authenticated
using (brand_id is null or exists (select 1 from public.product_brands b where b.id=brand_id));
notify pgrst, 'reload schema';
