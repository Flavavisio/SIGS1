const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes={},calls=[],timers=[];
let context={company:{id:'company-a'},license:{status:'ACTIVE',maxProjects:10},projects:[]},failure=null,locked=true;
function node(id){
 const n={id,value:'',style:{},dataset:{},textContent:'',isConnected:true,disabled:false,
 classList:{add(){},remove(){},contains(){return false;}},
 focus(){},addEventListener(){},getClientRects(){return [1];},querySelector(){return node();},querySelectorAll(){return [];},
 remove(){delete nodes[this.id];},appendChild(child){if(child.id)nodes[child.id]=child;},insertBefore(child){this.appendChild(child);}};
 Object.defineProperty(n,'innerHTML',{set(html){this.html=html;for(const m of html.matchAll(/id="([^"]+)"([^>]*)/g)){
  const el=nodes[m[1]]=node(m[1]);const v=m[2].match(/value="([^"]*)"/);if(v)el.value=v[1];
 }},get(){return this.html||'';}});
 return n;
}
const body=node('body');body.classList={contains(c){return c==='sigs-locked'&&locked;},remove(c){if(c==='sigs-locked')locked=false;},add(c){if(c==='sigs-locked')locked=true;}};
nodes['sigs-access-gate']=node('sigs-access-gate');nodes.launcher=node('launcher');
const env={console,document:{body,readyState:'loading',getElementById:id=>nodes[id]||null,createElement:()=>node(),addEventListener(){},querySelector(){return null;},querySelectorAll(){return [];},contains(){return false;}},
 CLOUD:{user:{id:'user',role:'ADMIN'},access:'test-token',projectId:null},
 MOD:'cctv',S:{placed:[],meas:[],scale:{}},FLOORS:[],
 _sigsSbCfg:()=>({url:'https://example.com'}),_sigsSbHeaders:()=>({}),
 _sigsSbJson:async(url,opts)=>{calls.push(JSON.parse(opts.body));if(failure)throw failure;return [{id:'p1',name:calls.at(-1).name,module:'CCTV'}];},
 _sigsEnsureContext:async()=>context,startModule:m=>calls.push({started:m}),
 notify(){},setTimeout(fn){timers.push(fn);return 1;},clearTimeout(){},setInterval(){},ge:id=>nodes[id]||null};
env.window=env;vm.createContext(env);
const portal=fs.readFileSync('assets/js/block-05.js','utf8');
vm.runInContext(portal.slice(portal.indexOf('function openDesigner('),portal.indexOf('  function logout()',portal.indexOf('function openDesigner('))),env);
env.sigsPortalOpenDesigner=env.openDesigner;
vm.runInContext(fs.readFileSync('assets/js/projects-v6.js','utf8'),env);
async function flush(){await new Promise(setImmediate);}
(async()=>{
 env.openDesigner();assert.ok(nodes['sigs-v6-new-project']);assert.equal(nodes['v6-p-name'].value,'');assert.equal(locked,true);
 nodes['v6-p-create'].onclick();assert.match(nodes['v6-p-status'].textContent,/nome/);assert.equal(calls.length,0);
 nodes['v6-p-name'].value='  Moradia   Cascais ';
 context.projects=[{name:'moradia cascais'}];nodes['v6-p-create'].onclick();await flush();
 assert.match(nodes['v6-p-status'].textContent,/Já existe/);assert.equal(calls.length,0);assert.equal(locked,true);
 context.projects=[];nodes['v6-p-create'].onclick();await flush();
 assert.equal(calls[0].name,'Moradia Cascais');assert.equal(env.CLOUD.projectName,'Moradia Cascais');assert.equal(locked,false);assert.equal(calls[1].started,'cctv');
 // Database race and projects hidden by RLS must still show the helpful duplicate-name message.
 locked=true;env.sigsV6NewProject();nodes['v6-p-name'].value='Moradia Cascais';
 failure=Object.assign(new Error('duplicate key violates projects_company_name_unique'),{code:'23505'});
 nodes['v6-p-create'].onclick();await flush();assert.match(nodes['v6-p-status'].textContent,/Já existe/);assert.equal(locked,true);
 failure=null;context.company.id='company-b';env.sigsV6NewProject();nodes['v6-p-name'].value='Moradia Cascais';nodes['v6-p-create'].onclick();await flush();
 assert.equal(calls.at(-2).company_id,'company-b');assert.equal(locked,false);
 // Every explicit portal entry requires a new name, even with a current project.
 locked=true;env.openDesigner();assert.equal(nodes['v6-p-name'].value,'');assert.equal(locked,true);
 nodes['v6-p-cancel'].onclick();assert.equal(locked,true);
 const css=fs.readFileSync('assets/css/sigs.css','utf8'),workflowCss=fs.readFileSync('assets/css/workflow-v12.css','utf8');
 const gate=Number(css.match(/#sigs-access-gate\{[^}]*z-index:(\d+)/)[1]);
 assert.ok(Number(css.match(/\.sigs-v6-overlay\{[^}]*z-index:(\d+)/)[1])>gate);
 assert.ok(Number(workflowCss.match(/\.w12-backdrop\{[^}]*z-index:(\d+)/)[1])>gate);
 // Open existing projects from each specialty without creating a blank project.
 nodes['m-cloud']=node('m-cloud');nodes['cloud-body']=node('cloud-body');const projectRequests=[];
 env._sigsSbJson=async(url)=>{projectRequests.push(url);return [];};
 for(const [mod,expected] of [['cctv','CCTV'],['alarm','INTRUSION'],['fire','FIRE'],['disk','CCTV']]){
  env.sigsV6NewProject(null,mod);assert.equal(nodes['v6-p-module'].value,expected);
  nodes['v6-p-open'].onclick();await flush();assert(!nodes['sigs-v6-new-project']);
  assert(projectRequests.at(-1).includes('module=eq.'+expected));assert(projectRequests.at(-1).includes('company_id=eq.company-b'));
 nodes['v6-close-projects'].onclick();
 }
 // Admin and Sales now go straight to the company portal, preserving the active project and edits.
 let portalRenders=0,workspaceClosed=0;env.sigsPortalRender=()=>portalRenders++;
 env.sigsWorkflowClose=()=>workspaceClosed++;
 const routeStart=portal.indexOf('  window.sigsPortalOpenProjects=function');
 vm.runInContext(portal.slice(routeStart,portal.indexOf('  function renderLogin(',routeStart)),env);
 env.SIGS_V6.dirty=true;const currentProject=env.CLOUD.projectId;
 for(const role of ['ADMIN','SALES']){
  env.CLOUD.user.role=role;locked=false;
  env.sigsV6NewProject(null,'fire');nodes['v6-p-open'].onclick();await flush();
  assert.equal(locked,true);assert.equal(nodes['sigs-access-gate'].style.display,'flex');
  assert.equal(env.CLOUD.projectId,currentProject);assert.equal(env.SIGS_V6.dirty,true);
  assert(!nodes['sigs-v6-new-project']);
 }
 assert.equal(portalRenders,2);assert.equal(workspaceClosed,2);env.CLOUD.user.role='ADMIN';
 // Actual portal Workspace button opens the actual modal.
 nodes['sigs-gate-main']=node('sigs-gate-main');env.SIGSWorkflowModel={n:Number,check:()=>[]};
 env.SIGS_COMMERCIAL={};env.sigsV8Quote=()=>({lines:[],total:0});env.saveCurrentFloor=()=>{};
 env._sigsSbJson=async()=>[];env.uid=()=>'';env.gD=()=>null;
 const before=timers.length;vm.runInContext(fs.readFileSync('assets/js/workflow-v12.js','utf8'),env);timers[before]();
 assert.equal(nodes['w12-portal-launch'].textContent,'SIGS WORKSPACE');
 nodes['w12-portal-launch'].onclick();assert.ok(nodes['sigs-workflow']);await flush();
 console.log('PASS: portal creation, blank names, normalization, duplicates, database race, different companies, cancel, modal stacking and Workspace click.');
})().catch(e=>{console.error(e);process.exitCode=1;});
