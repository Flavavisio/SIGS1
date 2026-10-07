const URL= Deno.env.get('SUPABASE_URL')!;
const KEY= Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const origins=new Set(['https://www.sigs-studio.pt','https://sigs-studio.pt','https://flavavisio.github.io','https://sigs-studio.flowy-mouse-8040.chatgpt.site']);
const pages=new Set(['/app-Sigs.html']);
async function db(path:string,init:RequestInit={}){const r=await fetch(URL+'/rest/v1/'+path,{...init,headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json',Prefer:'return=representation',...init.headers}});if(!r.ok)throw Error('database');return r.status===204?null:await r.json();}
function clientIP(req:Request){const ip=(req.headers.get('x-forwarded-for')||'').split(',')[0].trim();return /^[\da-f:.]{3,45}$/i.test(ip)?ip:null;}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')||'';const headers={'Content-Type':'application/json','Access-Control-Allow-Origin':origins.has(origin)?origin:'https://www.sigs-studio.pt','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin','Cache-Control':'no-store'};
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'Método não permitido'},405);
 if(origin&&!origins.has(origin))return reply({error:'Origem não permitida'},403);
 try{
  const raw=await req.text();if(raw.length>4096)return reply({error:'Pedido demasiado grande'},413);const b=JSON.parse(raw);const action=b.action;
  if(action==='visit')return reply({error:'Estatísticas de visitantes desativadas.'},410);
  let user:any=null,profile:any=null;
  {
   const token=req.headers.get('authorization')||'';if(!token.startsWith('Bearer '))return reply({error:'Sessão necessária'},401);
   const auth=await fetch(URL+'/auth/v1/user',{headers:{apikey:KEY,Authorization:token}});if(!auth.ok)return reply({error:'Sessão inválida'},401);user=await auth.json();
   profile=(await db('profiles?id=eq.'+user.id+'&select=id,name,email,role,active'))[0];if(!profile?.active)return reply({error:'Conta inativa'},403);
  }
  if(action==='dashboard'){
   if(profile.role!=='SUPER_ADMIN')return reply({error:'Acesso reservado ao Super Admin'},403);
   const offset=Math.min(100000,Math.max(0,Math.floor(Number(b.offset)||0)));
   const rows=await db('sigs_access_events?select=*&order=created_at.desc&limit=101&offset='+offset);
   const users=await db('profiles?select=id,name,email,role,active,last_login_at&order=name.asc,id.asc&limit=101&offset='+offset);
   const ids=users.slice(0,100).map((u:any)=>u.id);
   const presence=ids.length?await db('sigs_presence?select=user_id,last_seen,page,online&user_id=in.('+ids.join(',')+')&last_seen=gte.'+encodeURIComponent(new Date(Date.now()-86400000).toISOString())):[];
   return reply({rows:rows.slice(0,100),users:users.slice(0,100),presence,more:rows.length>100||users.length>100,now:new Date().toISOString()});
  }
  const page=typeof b.page==='string'?b.page:'';if(!pages.has(page))return reply({error:'Página inválida'},400);
  const ip=clientIP(req);
  if(action==='heartbeat'){
   // Identity and role always come from the validated Auth session, never the request body.
   const token=req.headers.get('authorization')!.slice(7);const payload=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(token.split('.')[1].length/4)*4,'=')));const session=payload.session_id;
   if(!/^[a-f0-9-]{36}$/i.test(session||''))return reply({error:'Sessão inválida'},401);
   if(!/^[a-f0-9-]{36}$/i.test(b.tab||''))return reply({error:'Separador inválido'},400);
   const old=(await db('sigs_presence?session_id=eq.'+session+'&tab_id=eq.'+b.tab+'&select=last_seen,user_id'))[0];
   if(old&&Date.now()-Date.parse(old.last_seen)<20000&&b.online!==false)return reply({ok:true});
   await db('sigs_presence?on_conflict=session_id,tab_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({session_id:session,tab_id:b.tab,user_id:user.id,last_seen:new Date().toISOString(),page,online:b.online!==false})});
   if(!old&&b.online!==false)await db('sigs_access_events?on_conflict=session_id',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=representation'},body:JSON.stringify({session_id:session,user_id:user.id,name:profile.name,email:profile.email,role:profile.role,page,ip})});
   return reply({ok:true});
  }
  return reply({error:'Ação inválida'},400);
 }catch{return reply({error:'Não foi possível concluir o pedido.'},500);}
});
