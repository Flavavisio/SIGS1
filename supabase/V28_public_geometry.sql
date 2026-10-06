-- Only public geometry; no internal cable prices or commercial settings.
create or replace function private.sigs_public_quote(p_token text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare s public.sigs_quote_shares; snap jsonb;
begin
 if p_token !~ '^[0-9a-f]{64}$' then return null; end if;
 select * into s from public.sigs_quote_shares where token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and revoked_at is null and expires_at>now();
 if s.id is null then return null; end if;
 select public_snapshot into snap from public.sigs_quote_revisions where id=s.revision_id;
 -- A strict public field allowlist; internal project/commercial data is never read.
 snap=jsonb_build_object('project',snap->'project','company',snap->'company','client',snap->'client','reference',snap->'reference','description',snap->'description','terms',snap->'terms','validity',snap->'validity','date',snap->'date','logo',snap->'logo','color',snap->'color','contacts',snap->'contacts','alternative',snap->'alternative','sub',snap->'sub','tax',snap->'tax','total',snap->'total','taxRate',snap->'taxRate','discount',snap->'discount','floors',(select coalesce(jsonb_agg(jsonb_build_object('name',f->'name','obstacles',(select coalesce(jsonb_agg(jsonb_build_object('closed',o->'closed','points',(select coalesce(jsonb_agg(jsonb_build_object('x',v->'x','y',v->'y')),'[]'::jsonb) from jsonb_array_elements(coalesce(o->'points','[]'::jsonb)) v))),'[]'::jsonb) from jsonb_array_elements(coalesce(f->'obstacles','[]'::jsonb)) o),'scale',case when jsonb_typeof(f->'scale')='object' then jsonb_build_object('ok',f->'scale'->'ok','ppm',f->'scale'->'ppm') else null end,'fp',case when jsonb_typeof(f->'fp')='object' then jsonb_build_object('x',f->'fp'->'x','y',f->'fp'->'y','w',f->'fp'->'w','h',f->'fp'->'h','image',f->'fp'->'image') else null end,'devices',(select coalesce(jsonb_agg(jsonb_build_object('x',d->'x','y',d->'y','label',d->'label','ref',d->'ref','name',d->'name','cableAnchor',d->'cableAnchor','cableRoute',(select coalesce(jsonb_agg(jsonb_build_object('x',v->'x','y',v->'y')),'[]'::jsonb) from jsonb_array_elements(coalesce(d->'cableRoute','[]'::jsonb)) v),'type',d->'type','lens',d->'lens','rotation',d->'rotation','fov',d->'fov','range',d->'range','thermalFov',d->'thermalFov','thermalRange',d->'thermalRange')),'[]'::jsonb) from jsonb_array_elements(coalesce(f->'devices','[]'::jsonb)) d))),'[]'::jsonb) from jsonb_array_elements(coalesce(snap->'floors','[]'::jsonb)) f),'lines',(select coalesce(jsonb_agg(jsonb_build_object('ref',x->'ref','name',x->'name','qty',x->'qty','unit',x->'unit','sale',x->'sale','net',x->'net')),'[]'::jsonb) from jsonb_array_elements(coalesce(snap->'lines','[]'::jsonb)) x));
 return jsonb_build_object('snapshot',snap,'response',s.response,'responded_at',s.responded_at,'expires_at',s.expires_at);
end $$;

notify pgrst, 'reload schema';
