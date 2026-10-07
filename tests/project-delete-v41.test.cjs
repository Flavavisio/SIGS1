const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(require.resolve('../assets/js/projects-v6.js'),'utf8');
const code=src.slice(src.indexOf('async function deleteProject('),src.indexOf('function projectManagerShell('));
(async()=>{
let calls=0,refresh=0,confirmed=true,result=[{id:'p1'}],message='';
const env={V6:{autoTimer:123,dirty:true},CLOUD:{projectId:'p1',projectName:'Teste'},confirm:()=>confirmed,sb:()=>({url:'https://example.test'}),h:x=>x,api:async(url,opts)=>{calls++;assert.equal(opts.method,'DELETE');assert.equal(opts.headers.Prefer,'return=representation');assert(url.endsWith('id=eq.p1&select=id'));if(result instanceof Error)throw result;return result;},notify:m=>message=m,clearTimeout(){},closeOverlay(){},saveChip(){},renderProjectManager(){refresh++;},sigsPortalOpenProjects(){},sigsPortalRender(){refresh++;}};env.window=env;vm.createContext(env);vm.runInContext(code,env);
confirmed=false;assert.equal(await env.cloudDeleteProject('p1','Teste'),false);assert.equal(calls,0);
confirmed=true;result=[];assert.equal(await env.cloudDeleteProject('p1','Teste'),false);assert.equal(env.CLOUD.projectId,'p1');assert(message.includes('sem permissão'));
result=new Error('Rede indisponível');assert.equal(await env.cloudDeleteProject('p1','Teste'),false);assert.equal(env.V6.deleting,null);assert.equal(env.CLOUD.projectId,'p1');
env.V6.saving=true;const before=calls;await env.cloudDeleteProject('p1','Teste');assert.equal(calls,before);env.V6.saving=false;
result=[{id:'p1'}];const button={disabled:false,dataset:{deleteProject:'p1',projectName:'Teste'}};await env.sigsPortalDeleteProject(button);assert.equal(env.CLOUD.projectId,null);assert.equal(env.V6.autoTimer,null);assert.equal(env.V6.dirty,false);assert.equal(button.disabled,false);assert(refresh>=2);
const html=fs.readFileSync(require.resolve('../app-Sigs.html'),'utf8');assert(!html.includes('SUPER ADMIN →'));assert(html.includes('mailto:geral.sigs.studio@gmail.com'));
console.log('PASS: cancel, denied/empty deletion, network failure, save guard, confirmed deletion and portal refresh.');
})().catch(e=>{console.error(e);process.exitCode=1;});
