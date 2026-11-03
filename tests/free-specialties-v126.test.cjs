const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const read=p=>fs.readFileSync(p,'utf8'),tick=()=>new Promise(setImmediate);
async function fixture(role='ADMIN',planCode='FREE'){
 const dom=new JSDOM('<div id="license-body"></div>',{url:'https://sigs.test/app-Sigs.html',runScripts:'outside-only'}),w=dom.window;
 const ctx={company:{id:'company'},license:{planCode,status:'ACTIVE',maxProjects:planCode==='FREE'?1:10,modules:{cctv:true,alarm:true,fire:true,cloud:true}},projects:[]},writes=[],notices=[],started=[];
 w.setTimeout=()=>0;w.setInterval=()=>0;w.CLOUD={user:{id:'user',role},access:'token'};w._esc=String;w.notify=m=>notices.push(m);w.startModule=m=>{w.MOD=m;started.push(m);};w._restoreProjectData=data=>{w.restored=data;};w.closeCloud=()=>{};
 w.MOD='cctv';w.S={placed:[],meas:[],scale:{}};w.FLOORS=[];w.SIGS_COMMERCIAL={};w._sigsSbCfg=()=>({url:'https://sigs.test'});w._sigsSbHeaders=()=>({});w._sigsEnsureContext=async()=>ctx;
 w._sigsSbJson=async(url,opts={})=>{
  if(opts.method==='POST'){const row={id:'project',...JSON.parse(opts.body)};writes.push(row);ctx.projects.push(row);return [row];}
  return ctx.projects;
 };
 w.eval(read('assets/js/block-04.js'));w.SIGS_LICENSE.ctx=ctx;w.eval(read('assets/js/projects-v6.js'));
 const q=id=>w.document.getElementById(id);
 async function create(module,name){w.sigsV6NewProject(null,module);assert(q('sigs-v6-new-project'));q('v6-p-name').value=name;q('v6-p-create').click();await tick();}
 return {w,dom,ctx,writes,notices,started,q,create};
}
(async()=>{
 for(const role of ['ADMIN','SALES'])for(const [ui,db] of [['cctv','CCTV'],['alarm','INTRUSION'],['fire','FIRE']]){
  const f=await fixture(role);
  for(const m of ['cctv','alarm','fire','disk'])assert(f.w.sigsModuleAllowed(m));
  await f.create(ui,'Primeiro '+ui);assert.equal(f.writes.length,1);assert.equal(f.writes[0].module,db);assert.equal(f.started.at(-1),ui);
  for(const next of ['cctv','alarm','fire']){
   await f.create(next,'Segundo '+next);assert.equal(f.writes.length,1,'One total project across specialties and company users');assert.match(f.q('v6-p-status').textContent,/Limite de projetos/);
  }
  f.ctx.projects[0].status='ARCHIVED';await f.create(ui,'Depois de arquivar');assert.equal(f.writes.length,1,'Archiving does not release a project slot');
  await f.w.sigsV6DuplicateProject('project');assert.equal(f.writes.length,1);assert.match(f.notices.at(-1),/Limite de projetos/);
  const opened=await f.w.cloudOpenProject('project','Existente');assert(opened);assert.equal(f.started.at(-1),ui);assert(f.w.restored);assert.equal(f.writes.length,1,'Opening the existing project does not use another slot');f.dom.window.close();
 }
 const e=await fixture('ADMIN','EXPRESS');assert(!e.w.sigsModuleAllowed('alarm'));assert(!e.w.sigsModuleAllowed('fire'));assert(e.w.sigsModuleAllowed('cctv'));e.dom.window.close();
 const denied=await fixture();denied.ctx.license.modules.fire=false;assert(!denied.w.sigsModuleAllowed('fire'));denied.ctx.license.status='SUSPENDED';assert(!denied.w.sigsModuleAllowed('alarm'));denied.dom.window.close();
 const free=JSON.parse(read('assets/data/plans-v11.json')).plans.find(p=>p.code==='FREE');assert.equal(free.max_projects,1);assert.equal(free.max_items_per_project,15);assert.deepEqual(free.included_modules,['CCTV','Intrusão','Incêndio','Armazenamento']);
 const landing=new JSDOM(read('index.html'));assert.match(landing.window.document.getElementById('plan-free').textContent,/Intrusão, Incêndio/);assert.doesNotMatch(landing.window.document.getElementById('plan-express').textContent,/Intrusão/);landing.window.close();
 console.log('PASS FREE specialties: Admin/Sales create/open CCTV, Intrusion or Fire; one shared slot, archived/duplicate limits, module/status guards, Express unchanged and 15-item public plan.');
})().catch(e=>{console.error(e);process.exitCode=1;});
