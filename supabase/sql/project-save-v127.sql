-- Compatibility for already-open clients carrying large inline plans. New clients
-- move plans to private Storage before calling the checkpoint RPC.
alter function public.sigs_save_project_checkpoint(uuid,jsonb,text) set statement_timeout='45s';
alter function public.sigs_resume_project_version(uuid,jsonb) set statement_timeout='45s';

-- Super Admin already reads/manages customer projects. Permit their plan uploads
-- only under an existing project's actual company/project prefix.
create policy "project plans superadmin insert" on storage.objects for insert to authenticated
with check (bucket_id='project-files' and private.is_super_admin() and exists(
 select 1 from public.projects p where p.company_id=private.path_company_id(storage.objects.name)
 and p.id::text=(storage.foldername(storage.objects.name))[2] and (storage.foldername(storage.objects.name))[3]='floorplans'
));
create policy "project plans superadmin update" on storage.objects for update to authenticated
using (bucket_id='project-files' and private.is_super_admin() and exists(
 select 1 from public.projects p where p.company_id=private.path_company_id(storage.objects.name)
 and p.id::text=(storage.foldername(storage.objects.name))[2] and (storage.foldername(storage.objects.name))[3]='floorplans'
))
with check (bucket_id='project-files' and private.is_super_admin() and exists(
 select 1 from public.projects p where p.company_id=private.path_company_id(storage.objects.name)
 and p.id::text=(storage.foldername(storage.objects.name))[2] and (storage.foldername(storage.objects.name))[3]='floorplans'
));
notify pgrst,'reload schema';
