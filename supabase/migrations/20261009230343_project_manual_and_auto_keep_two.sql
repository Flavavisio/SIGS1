lock table public.project_versions in share row exclusive mode;
create index if not exists project_versions_manual_latest_idx on public.project_versions(project_id,version_no desc) where reason='MANUAL';
create or replace function private.sigs_keep_two_auto_versions()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.reason in ('AUTO','MANUAL') then
  -- Checkpoint RPC serialises saves with the project row lock.
  delete from public.project_versions v
  where v.project_id=new.project_id and v.reason=new.reason
   and v.id in (
    select prior.id from public.project_versions prior
    where prior.project_id=new.project_id and prior.reason=new.reason
    order by prior.version_no desc offset 2
   );
 end if;
 return new;
end $$;
revoke all on function private.sigs_keep_two_auto_versions() from public,anon,authenticated;
with ranked as (
 select id,row_number() over(partition by project_id,reason order by version_no desc) as n
 from public.project_versions where reason in ('AUTO','MANUAL')
)
delete from public.project_versions v using ranked r where v.id=r.id and r.n>2;
