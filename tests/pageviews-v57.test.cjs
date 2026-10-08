const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),{stripTypeScriptTypes}=require('node:module'),{JSDOM}=require('jsdom');
const root=require('node:path').resolve(__dirname,'..'),read=p=>fs.readFileSync(root+'/'+p,'utf8'),flush=()=>new Promise(r=>setImmediate(r));
(async()=>{
 for(const config of [{path:'/?token=secret#reset',expected:1},{path:'/registo.html?email=secret',expected:1},{path:'/SIGS1/index.html?token=secret',expected:1},{path:'/app-Sigs.html',expected:0},{path:'/',dnt:'1',expected:0},{path:'/',gpc:true,expected:0},{path:'/',hidden:true,expected:1}]){
  const dom=new JSDOM('',{url:'https://www.sigs-studio.pt'+config.path,runScripts:'outside-only'}),w=dom.window,calls=[];let hidden=!!config.hidden;
  Object.defineProperty(w.document,'visibilityState',{get:()=>hidden?'hidden':'visible'});Object.defineProperty(w.navigator,'doNotTrack',{value:config.dnt});Object.defineProperty(w.navigator,'globalPrivacyControl',{value:config.gpc});
  w.fetch=async(url,o)=>{calls.push(o);throw Error('offline');};w.eval(read('assets/js/pageviews-v57.js'));if(hidden)assert.equal(calls.length,0);hidden=false;w.document.dispatchEvent(new w.Event('visibilitychange'));w.document.dispatchEvent(new w.Event('visibilitychange'));await flush();assert.equal(calls.length,config.expected);
  if(calls.length){assert.deepEqual(Object.keys(JSON.parse(calls[0].body)).sort(),['action','page']);assert(!calls[0].body.includes('secret'));assert.equal(calls[0].credentials,'omit');assert.equal(calls[0].referrerPolicy,'no-referrer');assert(!calls[0].headers.Authorization);assert.equal(w.localStorage.length,0);assert.equal(w.sessionStorage.length,0);assert.equal(w.document.cookie,'');}dom.window.close();
 }
 // Real modal: views and access history remain in one Super Admin dashboard, with isolated pagination and races.
 const dom=new JSDOM('<button id="w12-portal-launch">Workspace</button>',{runScripts:'outside-only'}),w=dom.window,pending=[];
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.setInterval=()=>1;w.CLOUD={user:{id:'super',role:'SUPER_ADMIN'},access:'test-token'};
 w.fetch=(url,o)=>new Promise(resolve=>pending.push({body:JSON.parse(o.body),resolve}));w.eval(read('assets/js/activity-v42.js'));w.SIGSActivity.dashboard();
 const dialog=w.document.querySelector('dialog');dialog.querySelector('[data-section=visits]').click();const first=pending.findLast(x=>x.body.action==='visits');assert.equal(first.body.days,30);
 first.resolve({ok:true,json:async()=>({rows:[{created_at:'2026-10-09T12:00:00Z',page:'/'},{created_at:'2026-10-09T12:00:00Z',page:'<img src=x onerror=alert(1)>'}],total:102,more:true,summary:{day:2,week:20,month:102}})});await flush();assert(dialog.textContent.includes('Histórico de visitas ao site'));assert.equal(dialog.querySelectorAll('[data-results] img').length,0);assert(dialog.textContent.includes('102 visualização'));
 dialog.querySelector('[data-next]').click();assert.equal(pending.at(-1).body.offset,100);const old=pending.at(-1);
 const days=dialog.querySelector('[data-days]');days.value='7';days.dispatchEvent(new w.Event('change'));assert.equal(pending.at(-1).body.days,7);assert.equal(pending.at(-1).body.offset,0);
 pending.at(-1).resolve({ok:true,json:async()=>({rows:[],total:0,more:false,summary:{day:0,week:0,month:0}})});await flush();old.resolve({ok:true,json:async()=>({rows:[{page:'/',created_at:'2026-10-09'}],total:999,more:true,summary:{month:999}})});await flush();assert(!dialog.textContent.includes('999'));assert(dialog.textContent.includes('Ainda não existem visitas'));
 dialog.querySelector('[data-section=access]').click();assert.equal(pending.at(-1).body.action,'dashboard');assert.equal(pending.at(-1).body.offset,0);assert(dialog.querySelector('[data-filters]').hidden);dom.window.close();
 // Real Edge handler: public writes cannot carry identity fields and only a validated Super Admin can read.
 let handler,role='ADMIN';const writes=[],queries=[];
 const context={Deno:{env:{get:k=>k==='SUPABASE_URL'?'https://backend.test':'secret-test'},serve:f=>handler=f},Request,Response,Headers,Map,Set,Date,JSON,atob,crypto:globalThis.crypto,fetch:async(url,o)=>{
  queries.push(url);if(url.endsWith('/auth/v1/user'))return Response.json({id:'u'});if(url.includes('/profiles?'))return Response.json([{id:'u',role,active:true}]);
  if(o?.method==='HEAD')return new Response(null,{headers:{'content-range':'0-0/123'}});
  if(o?.method==='POST'){writes.push(JSON.parse(o.body));return new Response(null,{status:204});}
  if(url.includes('/sigs_visits?'))return Response.json(Array.from({length:101},(_,i)=>({id:i,page:'/',created_at:'2026-10-09'})));return Response.json([]);
 }};
 vm.createContext(context);vm.runInContext(stripTypeScriptTypes(read('supabase/functions/sigs-activity/index.ts')),context);
 const req=(body,headers={})=>handler(new Request('https://backend.test',{method:'POST',headers:{origin:'https://www.sigs-studio.pt','content-type':'application/json',...headers},body:JSON.stringify(body)}));
 assert.equal((await req({action:'visit',page:'/',ip:'1.2.3.4',visitor_id:'visitor',email:'secret',created_at:'2000-01-01'})).status,201);assert.deepEqual(Object.keys(writes[0]).sort(),['consent_version','page','visitor_id']);assert.notEqual(writes[0].visitor_id,'visitor');
 for(const page of ['/app-Sigs.html','/proposta.html','/?token=secret','/unknown'])assert.equal((await req({action:'visit',page})).status,400);
 assert.equal((await req({action:'visit',page:'/'},{origin:'https://attacker.test'})).status,403);assert.equal((await req({action:'visit',page:'/'},{origin:''})).status,403);
 assert.equal((await req({action:'visits'})).status,401);assert.equal((await req({action:'visits'},{authorization:'Bearer token'})).status,403);
 role='SUPER_ADMIN';const result=await req({action:'visits',days:7,offset:100,page:'/registo.html'},{authorization:'Bearer token'});assert.equal(result.status,200);const data=await result.json();assert.equal(data.rows.length,100);assert.equal(data.more,true);assert.equal(data.total,123);assert(queries.some(q=>q.includes('offset=100')&&q.includes('page=eq.%2Fregisto.html')&&q.includes('created_at=gte.')));
 for(let i=0;i<30;i++){const response=await req({action:'visit',page:'/'},{'x-forwarded-for':'192.0.2.10'});assert.equal(response.status,201);}assert.equal((await req({action:'visit',page:'/'},{'x-forwarded-for':'192.0.2.10'})).status,429);
 console.log('PASS public views: safe URLs/no identifiers, DNT/GPC/visibility, modal filters/pagination/races, XSS escaping, 401/403, allowlist and write limits.');
})().catch(e=>{console.error(e);process.exitCode=1;});
