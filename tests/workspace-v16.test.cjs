const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../assets/js/block-03.js'),'utf8');const start=source.indexOf('function _sigsEnsureContext(');const end=source.indexOf('\nfunction cloudSaveCurrent()',start);const fn=source.slice(start,end);
async function run(){
 let context={company:{id:'own'},license:{status:'ACTIVE'},projects:[]};const calls=[];const ctx={CLOUD:{user:{id:'u',role:'ADMIN'},projectId:null},_sigsSbCfg:()=>({url:'https://example.com'}),_sigsSbHeaders:()=>({}),_sigsSbJson:async url=>{calls.push(url);return url.includes('select=company_id')?[{company_id:'b'}]:[{id:'p'}];},loadLicenseContext:async()=>context};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fn,ctx);
 assert.equal((await ctx._sigsEnsureContext()).company.id,'own');assert.equal(calls.length,0);
 ctx.CLOUD.user.role='SUPER_ADMIN';context={companies:[{id:'a',name:'A',license:{status:'ACTIVE'}},{id:'b',name:'B',license:{status:'ACTIVE'}}]};assert.equal((await ctx._sigsEnsureContext()).companies.length,2);assert.equal(calls.length,0);
 assert.equal((await ctx._sigsEnsureContext('a')).company.id,'a');assert.ok(calls.at(-1).includes('company_id=eq.a'));await assert.rejects(()=>ctx._sigsEnsureContext('foreign'),/Empresa não disponível/);
 ctx.CLOUD.projectId='p';assert.equal((await ctx._sigsEnsureContext()).company.id,'b');assert.equal((await ctx._sigsEnsureContext('a')).company.id,'a');ctx.CLOUD.user=null;await assert.rejects(()=>ctx._sigsEnsureContext(),/sessão/);
 const workflow=fs.readFileSync(require.resolve('../assets/js/workflow-v12.js'),'utf8');assert.ok(workflow.includes('function chooseCompany()'));assert.ok(workflow.includes('Criar projeto'));assert.ok(workflow.includes('Novo projeto'));
 const portal=fs.readFileSync(require.resolve('../assets/js/block-05.js'),'utf8');assert.ok(!portal.includes('sigsOpenEmailCenter()'));
 console.log('PASS: Admin company resolution, Super Admin initial chooser, explicit company, project company inference and session isolation.');
}run().catch(e=>{console.error(e);process.exitCode=1});
