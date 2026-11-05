const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
let setup=fs.readFileSync('tests/checkpoints-v30.test.cjs','utf8').split('(async()=>{')[0];
const sandbox={require,console};vm.createContext(sandbox);vm.runInContext(setup+';globalThis.fixture={env,timeouts};',sandbox);
const {env,timeouts}=sandbox.fixture;let requests=[],failUpload=false,holdUpload=null;
env._sigsSbHeaders=extra=>({...extra});
Object.assign(env,{atob:s=>Buffer.from(s,'base64').toString('binary'),Blob,Uint8Array,crypto:webcrypto});
vm.runInContext(fs.readFileSync('assets/js/project-save-v127.js','utf8'),env);
env._sigsSbJson=async(url,opts)=>{
 requests.push({url,opts,body:typeof opts?.body==='string'?JSON.parse(opts.body):null});
 if(url.includes('?select=company_id'))return [{company_id:'company'}];
 if(url.includes('/storage/')){if(holdUpload)await holdUpload;if(failUpload)throw Error('storage offline');return {Key:'ok'};}
 return {id:'p1'};
};
const image='data:image/png;base64,'+Buffer.alloc(6*1024*1024,139).toString('base64');
const fp=()=>({imgData:image,x:3,y:4,w:500,h:400});
function seed(){env.S.fp=fp();env.FLOORS=[{id:'f',placed:[],fp:fp()}];env.SIGS_COMMERCIAL={workflow:{options:[{project:{fp:fp(),floors:[{fp:fp()}]}}]}};
 env._buildProjectData=()=>({module:'cctv',placed:env.S.placed,fp:env.S.fp,floors:env.FLOORS,commercial:env.SIGS_COMMERCIAL,sigsMultidisciplinary:{modules:{fire:{fp:fp()}}}});env.sigsV6MarkDirty();}
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
 seed();const originalSize=JSON.stringify(env._buildProjectData()).length;assert(originalSize>16000000);
 await env.sigsV6SaveProject('manual');
 const uploads=requests.filter(r=>r.url.includes('/storage/'));assert.equal(uploads.length,1,'Same image in floors/current/alternatives/specialties is uploaded once');
 assert.equal(uploads[0].opts.body.size,6*1024*1024);assert.equal(uploads[0].opts.headers['x-upsert'],'true');
 let checkpoint=requests.find(r=>r.url.includes('/rpc/'));assert(checkpoint);assert(JSON.stringify(checkpoint.body).length<10000,'Checkpoint contains only plan metadata');assert.equal(checkpoint.body.p_reason,'MANUAL');assert(!JSON.stringify(checkpoint.body).includes('base64'));
 assert.equal(checkpoint.body.p_patch.project_data.fp.x,3);assert(checkpoint.body.p_patch.project_data.fp.storagePath.includes('/p1/floorplans/'));assert.equal(env.S.fp.imgData,null);assert.equal(env.SIGS_V6.dirty,false);
 // Automatic saves use the same preparation and reuse the confirmed upload.
 requests=[];env.S.placed.push({id:'automatic'});env.sigsV6MarkDirty();await env.sigsV6SaveProject('auto');assert.equal(requests.filter(r=>r.url.includes('/storage/')).length,0);assert.equal(requests.find(r=>r.url.includes('/rpc/')).body.p_reason,'AUTO');
 // A failed upload never sends a checkpoint or clears the inline image/dirty state.
 const other='data:image/png;base64,'+Buffer.from('different plan').toString('base64');env.S.fp={...fp(),imgData:other};env.FLOORS[0].fp=env.S.fp;requests=[];failUpload=true;
 await assert.rejects(()=>env.sigsV6SaveProject('manual'),/storage offline/);assert.equal(requests.filter(r=>r.url.includes('/rpc/')).length,0);assert.equal(env.S.fp.imgData,other);assert(env.SIGS_V6.dirty);assert(!env.SIGS_V6.saving);failUpload=false;
 // Snapshot capture is immutable while Storage is slow. Later edits stay pending.
 let release;holdUpload=new Promise(r=>release=r);requests=[];const saving=env.sigsV6SaveProject('manual');while(!requests.some(r=>r.url.includes('/storage/')))await tick();
 env.S.placed.push({id:'during-upload'});env.S.fp.imgData='data:image/png;base64,'+Buffer.from('replacement').toString('base64');env.sigsV6MarkDirty();release();await saving;holdUpload=null;
 checkpoint=requests.find(r=>r.url.includes('/rpc/'));assert(!checkpoint.body.p_patch.project_data.placed.some(p=>p.id==='during-upload'));assert(env.SIGS_V6.dirty);assert(env.S.fp.imgData.endsWith(Buffer.from('replacement').toString('base64')),'Never replace a newer plant with the uploaded older plant');
 // Expired-session retry reuses the same request body and a newly refreshed token.
 const core=fs.readFileSync('assets/js/block-03.js','utf8'),start=core.indexOf('function _sigsSbJson('),end=core.indexOf('function _sigsProjectItems(',start);
 const network={CLOUD:{access:'expired'},fetch:async(url,opts)=>{network.seen.push(opts);return {status:network.seen.length===1?401:200,ok:network.seen.length>1,text:async()=>'{"id":"saved"}'};},seen:[],_cloudTryRefresh:async()=>{network.CLOUD.access='renewed';return true;}};
 vm.createContext(network);vm.runInContext(core.slice(start,end),network);const body='{"snapshot":"unchanged"}';assert.equal((await network._sigsSbJson('https://example.test',{method:'POST',headers:{Authorization:'Bearer expired'},body})).id,'saved');assert.equal(network.seen.length,2);assert.equal(network.seen[1].headers.Authorization,'Bearer renewed');assert.equal(network.seen[1].body,body);
 network.seen=[];network._cloudTryRefresh=async()=>false;await assert.rejects(()=>network._sigsSbJson('https://example.test'),/Sessão expirada/);assert.equal(network.seen.length,1);
 // Concurrent requests share one refresh; transient Auth outages keep the session.
 const authSource=fs.readFileSync('assets/js/block-05.js','utf8'),authEnd=authSource.indexOf('\n})();')+6;
 const storage=new Map([['sigs_sb_access','old'],['sigs_sb_refresh','refresh']]);let refreshCalls=0,releaseRefresh,status=200;
 const auth={CLOUD:{access:'old',user:{id:'u1'}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},document:{getElementById:()=>null},fetch:async()=>{refreshCalls++;if(releaseRefresh===undefined)await new Promise(r=>releaseRefresh=r);return {ok:status===200,status,json:async()=>({access_token:'fresh',refresh_token:'next'})};}};auth.window=auth;
 vm.createContext(auth);vm.runInContext(authSource.slice(0,authEnd),auth);const a=auth._cloudTryRefresh(),b=auth._cloudTryRefresh();assert.equal(refreshCalls,1);releaseRefresh();assert(await a);assert(await b);assert.equal(auth.CLOUD.access,'fresh');
 status=503;assert.equal(await auth._cloudTryRefresh(),false);assert.equal(auth.CLOUD.user.id,'u1');assert.equal(auth.CLOUD.access,'fresh');
 console.log('PASS: large inline plans become small manual/automatic checkpoints, nested-image deduplication and reuse, upload failure preserves edits, immutable snapshots during upload, newer plant protection and expired-session retry.');
})().catch(e=>{console.error(e);process.exitCode=1;});
