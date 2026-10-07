-- Only the two newest AUTO checkpoints survive per project.
-- Manual saves and PRE_RESTORE safety copies are independent.
lock table public.project_versions in share row exclusive mode;

create index if not exists project_versions_auto_latest_idx
  on public.project_versions(project_id, version_no desc)
  where reason='AUTO';

create or replace function private.sigs_keep_two_auto_versions()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if new.reason='AUTO' then
    -- The checkpoint RPC holds the project row FOR UPDATE, serialising saves.
    delete from public.project_versions v
    where v.project_id=new.project_id and v.reason='AUTO'
      and v.id in (
        select prior.id from public.project_versions prior
        where prior.project_id=new.project_id and prior.reason='AUTO'
        order by prior.version_no desc
        offset 2
      );
  end if;
  return new;
end $$;
revoke all on function private.sigs_keep_two_auto_versions() from public,anon,authenticated;

drop trigger if exists sigs_keep_two_auto_versions on public.project_versions;
create trigger sigs_keep_two_auto_versions
  after insert on public.project_versions
  for each row execute function private.sigs_keep_two_auto_versions();

-- Apply the same retention policy to existing automatic copies.
with ranked as (
  select id,row_number() over(partition by project_id order by version_no desc) as n
  from public.project_versions where reason='AUTO'
)
delete from public.project_versions v using ranked r
where v.id=r.id and v.reason='AUTO' and r.n>2;
