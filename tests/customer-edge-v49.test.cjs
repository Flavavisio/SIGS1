const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{stripTypeScriptTypes}=require('node:module');
const source=stripTypeScriptTypes(fs.readFileSync('supabase/functions/sigs-admin/index.ts','utf8').replace(/^import .*;\n/gm,''));
async function run(action,options={}){
 const calls=[];let handler;
 const chain=table=>{const c={select(){return c;},eq(){return c;},single:async()=>({data:{id:'caller',role:options.role||'SUPER_ADMIN',active:true}}),maybeSingle:async()=>({data:null})};return c;};
 const admin={from:chain,rpc:async(_,a)=>{calls.push(a.p_action);if(options.fail===a.p_action)return {error:{code:a.p_action==='check_email'?'23505':'XX000',message:'Failure'}};return {data:a.p_action==='delete_preview'?{objects:options.objects||[]}:{ok:true,company:{id:'co'},license:{id:'lic'},activation_email_sent:true}};},auth:{getUser:async()=>({data:{user:{id:'caller'}}}),admin:{inviteUserByEmail:async()=>{calls.push('invite');return options.fail==='invite'?{error:{status:422,message:'Duplicate'}}:{data:{user:{id:'invited'}}};},deleteUser:async id=>{calls.push('cleanup:'+id);return {error:null};}}},storage:{from:bucket=>({remove:async paths=>{calls.push(['storage',bucket,paths]);return options.fail==='storage'?{error:{message:'Storage failure'}}:{error:null};}})}};
 vm.runInNewContext(source,{Deno:{env:{get:()=> 'test'},serve:f=>handler=f},createClient:()=>admin,Request,Response,crypto:globalThis.crypto,console:{error(){}}});
 const response=await handler(new Request('https://edge.test',{method:'POST',headers:{Authorization:'Bearer caller-token'},body:JSON.stringify({action,email:'client@example.com',name:'Client',company_name:'Client Lda',company_id:'co'})}));return {calls,status:response.status,data:await response.json()};
}
(async()=>{
 let r=await run('provision_customer');assert.equal(r.status,200);assert.deepEqual(r.calls,['check_email','invite','create']);
 r=await run('provision_customer',{fail:'check_email'});assert.equal(r.status,409);assert.deepEqual(r.calls,['check_email']);
 r=await run('provision_customer',{fail:'invite'});assert.equal(r.status,409);assert.deepEqual(r.calls,['check_email','invite']);
 r=await run('provision_customer',{fail:'create'});assert.equal(r.status,500);assert.deepEqual(r.calls,['check_email','invite','create','cancel_invite']);
 for(const action of ['provision_customer','delete_company']){r=await run(action,{role:'ADMIN'});assert.equal(r.status,403);assert.equal(r.calls.length,0);}
 const objects=Array.from({length:1001},(_,i)=>({bucket:'plans',path:'co/'+i}));r=await run('delete_company',{objects});assert.equal(r.status,200);assert.equal(r.calls[0],'delete_preview');assert.equal(r.calls[1][2].length,1000);assert.equal(r.calls[2][2].length,1);assert.equal(r.calls.at(-1),'delete');
 r=await run('delete_company',{fail:'storage',objects:objects.slice(0,1)});assert.equal(r.status,502);assert(!r.calls.includes('delete'));
 r=await run('delete_company',{fail:'delete_preview'});assert.equal(r.status,409);assert.deepEqual(r.calls,['delete_preview']);
 console.log('PASS: duplicate email before writes, invitation errors, provisioning rollback, Super Admin restrictions, Storage batching and deletion failure handling.');
})().catch(e=>{console.error(e);process.exitCode=1;});
