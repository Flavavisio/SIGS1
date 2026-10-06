const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let fixture=fs.readFileSync('tests/checkpoints-v30.test.cjs','utf8').split('(async()=>{')[0];
fixture=fixture.replace("readyState:'loading'","readyState:'complete'");
fixture=fixture.replace('env.window=env;',"env.updateStats=function(){};env._restoreProjectData=function(d){env.S.placed=d.placed||[];env.updateStats();};env.startModule=function(){};env.window=env;");
const sandbox={require,console};vm.createContext(sandbox);vm.runInContext(fixture+';globalThis.fixture={env,timeouts,nodes,node};',sandbox);const {env,timeouts,nodes,node}=sandbox.fixture;
[...timeouts.values()].find(t=>t.ms===120).fn();
(async()=>{
 env._restoreProjectData({placed:[]});assert.equal(env.SIGS_V6.suppress,false);
 env.S.placed.push({id:'quick-edit'});env.sigsV6MarkDirty();assert.equal(env.SIGS_V6.dirty,true);
 for(const t of [...timeouts.values()].filter(t=>t.ms===0||t.ms===250))t.fn();assert.equal(env.SIGS_V6.dirty,true,'Restore must not clear subsequent edits');
 env._sigsSbJson=async()=>[{id:'p2',name:'Second',module:'CCTV',status:'DRAFT',project_data:{placed:[]}}];await env.cloudOpenProject('p2','Second');
 assert.equal(env.SIGS_V6.suppress,false);env.S.placed.push({id:'edit-after-open'});env.sigsV6MarkDirty();
 for(const t of [...timeouts.values()].filter(t=>t.ms===180||t.ms===250||t.ms===0))t.fn();assert.equal(env.SIGS_V6.dirty,true,'Opening callbacks must not replace the saved baseline');
 // Run the actual legacy-title migration with nested containers. Replacing a
 // parent textContent destroys the project manager's cloud-body in a browser.
 const ux=fs.readFileSync('assets/js/ux-v5.js','utf8'),a=ux.indexOf('function renameCloud(){'),b=ux.indexOf('\nfunction hookUpdates()',a);
 const leaf={childElementCount:0,textContent:'Projetos sincronizados'},title={childElementCount:0,textContent:'Cloud SIGS Studio'},body={id:'cloud-body',childElementCount:0,textContent:''};
 const parent={childElementCount:3,textContent:'Cloud SIGS Studio Projetos sincronizados',querySelectorAll:()=>[parent,title,leaf,body]};
 const renameEnv={el:()=>parent};vm.createContext(renameEnv);vm.runInContext(ux.slice(a,b),renameEnv);renameEnv.renameCloud();
 assert.equal(parent.childElementCount,3);assert.equal(parent.textContent,'Cloud SIGS Studio Projetos sincronizados');assert.equal(leaf.textContent,'Guardar, abrir e gerir projetos da empresa');assert.equal(title.textContent,'Projetos SIGS');
 const core=fs.readFileSync('assets/js/block-03.js','utf8'),restoreStart=core.indexOf('function _restoreProjectData(d){'),restoreEnd=core.indexOf('// ── Guardar / abrir na cloud',restoreStart);
 const restoreEnv={MOD:'cctv',S:{},FLOORS:[],FLOOR_CUR:0,uid:()=>1,renderFloorBar(){},renderDevList(){},deselect(){},render(){},updateStats(){},document:{getElementById:()=>null}};vm.createContext(restoreEnv);vm.runInContext(core.slice(restoreStart,restoreEnd),restoreEnv);restoreEnv._restoreProjectData({module:'cctv',placed:[{id:'camera'}],meas:[],scale:{ok:true,ppm:10}});assert.equal(restoreEnv.S.placed[0].id,'camera','Real restore must work when the obsolete scale badge is absent');
 const statsStart=core.indexOf('function updateStats(){'),statsEnd=core.indexOf('function updateProjSummary(){',statsStart);restoreEnv.gD=()=>({type:'bullet'});let summaries=0;restoreEnv.updateProjSummary=()=>summaries++;vm.runInContext(core.slice(statsStart,statsEnd),restoreEnv);restoreEnv.updateStats();assert.equal(summaries,1,'Missing legacy stats must not abort project refresh');
 const html=fs.readFileSync('app-Sigs.html','utf8'),css=fs.readFileSync('assets/css/sigs.css','utf8');assert(Number(html.match(/id="m-cloud"[^>]*z-index:(\d+)/)[1])>Number(css.match(/#sigs-access-gate\{[^}]*z-index:(\d+)/)[1]));
 nodes['m-cloud']=node('m-cloud');nodes['cloud-body']=node('cloud-body');nodes['m-cloud'].parentNode={hidden:true};
 env.document.body.appendChild=function(n){n.parentNode=this;nodes[n.id]=n;};env._sigsEnsureContext=async()=>({});env._sigsSbJson=async()=>[];env.openCloud();assert.equal(nodes['m-cloud'].parentNode,env.document.body,'Project manager must escape the hidden editor');assert.equal(nodes['m-cloud'].style.display,'flex');
 console.log('PASS: edits immediately after restore/open remain dirty, nested title update preserves manager, project modal above portal.');
})().catch(e=>{console.error(e);process.exitCode=1;});
