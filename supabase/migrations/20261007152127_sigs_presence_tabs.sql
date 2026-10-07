alter table public.sigs_presence add column tab_id uuid not null default gen_random_uuid();
alter table public.sigs_presence drop constraint sigs_presence_pkey;
alter table public.sigs_presence add primary key(session_id,tab_id);
alter table public.sigs_access_events add column session_id uuid unique;
