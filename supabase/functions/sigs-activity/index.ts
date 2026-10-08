const URL= Deno.env.get('SUPABASE_URL')!;
const KEY= Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const origins=new Set(['https://www.sigs-studio.pt','https://sigs-studio.pt','https://flavavisio.github.io','https://sigs-studio.flowy-mouse-8040.chatgpt.site']);
const pages=new Set(['/app-Sigs.html']);
const publicPages=new Set(['/','/registo.html','/acesso.html','/privacidade.html']);
const visitBuckets=new Map<string,{start:number,count:number}>();
function allowVisit(req:Request,origin:string){
 const now=Date.now(),key=clientIP(req)||origin;
 if(visitBuckets.size>2000)for(const [k,v] of visitBuckets)if(now-v.start>=60000)visitBuckets.delete(k);
 if(visitBuckets.size>=5000&&!visitBuckets.has(key))return false;
 let bucket=visitBuckets.get(key);if(!bucket||now-bucket.start>=60000){bucket={start:now,count:0};visitBuckets.set(key,bucket);}
 return ++bucket.count<=30;
}
async function countVisits(filter:string){
 const r=await fetch(URL+'/rest/v1/sigs_visits?select=id&limit=1'+filter,{method:'HEAD',headers:{apikey:KEY,Authorization:'Bearer '+KEY,Prefer:'count=exact'}});
 if(!r.ok)throw Error('database');const count=Number((r.headers.get('content-range')||'').split('/')[1]);
 if(!Number.isFinite(count))throw Error('count');return count;
}
async function db(path:string,init:RequestInit={}){const r=await fetch(URL+'/rest/v1/'+path,{...init,headers:{apikey:KEY,Authorization:'Bearer '+KEY,'Content-Type':'application/json',Prefer:'return=representation',...init.headers}});if(!r.ok)throw Error('database');const text=await r.text();return text?JSON.parse(text):null;}
function clientIP(req:Request){const ip=(req.headers.get('x-forwarded-for')||'').split(',')[0].trim();return /^[\da-f:.]{3,45}$/i.test(ip)?ip:null;}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')||'';const headers={'Content-Type':'application/json','Access-Control-Allow-Origin':origins.has(origin)?origin:'https://www.sigs-studio.pt','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS','Vary':'Origin','Cache-Control':'no-store'};
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')return reply({error:'Método não permitido'},405);
 if(origin&&!origins.has(origin))return reply({error:'Origem não permitida'},403);
 try{
  const raw=await req.text();if(raw.length>4096)return reply({error:'Pedido demasiado grande'},413);const b=JSON.parse(raw);const action=b.action;
  if(action==='visit'){
   // Public page views only: no browser/session ID, user data, IP or geolocation stored.
   if(!origins.has(origin))return reply({error:'Origem necessária'},403);
   const page=b.page==='/index.html'?'/':b.page;
   if(typeof page!=='string'||!publicPages.has(page))return reply({error:'Página inválida'},400);
   if(!allowVisit(req,origin))return reply({error:'Demasiados pedidos. Tenta mais tarde.'},429);
   await db('sigs_visits',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({visitor_id:crypto.randomUUID(),page,consent_version:'anonymous-pageview-v57'})});
   return reply({ok:true},201);
  }
  let user:any=null,profile:any=null;
  {
   const token=req.headers.get('authorization')||'';if(!token.startsWith('Bearer '))return reply({error:'Sessão necessária'},401);
   const auth=await fetch(URL+'/auth/v1/user',{headers:{apikey:KEY,Authorization:token}});if(!auth.ok)return reply({error:'Sessão inválida'},401);user=await auth.json();
   profile=(await db('profiles?id=eq.'+user.id+'&select=id,name,email,role,active'))[0];if(!profile?.active)return reply({error:'Conta inativa'},403);
  }
  if(action==='visits'){
   if(profile.role!=='SUPER_ADMIN')return reply({error:'Acesso reservado ao Super Admin'},403);
   const offset=Math.min(100000,Math.max(0,Math.floor(Number(b.offset)||0)));
   const days=[1,7,30].includes(Number(b.days))?Number(b.days):30;
   const page=typeof b.page==='string'?b.page:'';
   if(page&&!publicPages.has(page))return reply({error:'Página inválida'},400);
   const now=new Date(),since=(d:number)=>'&created_at=gte.'+encodeURIComponent(new Date(now.getTime()-d*86400000).toISOString());
   const pageFilter=page?'&page=eq.'+encodeURIComponent(page):'';
   const [rows,total,today,week,month]=await Promise.all([
    db('sigs_visits?select=id,page,created_at&order=created_at.desc,id.desc&limit=101&offset='+offset+since(days)+pageFilter),
    countVisits(since(days)+pageFilter),countVisits(since(1)),countVisits(since(7)),countVisits(since(30))
   ]);
   return reply({rows:rows.slice(0,100),more:rows.length>100,total,summary:{day:today,week,month},now:now.toISOString()});
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
