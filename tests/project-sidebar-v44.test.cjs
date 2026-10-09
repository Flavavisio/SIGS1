const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<body class="sigs-premium"><aside class="studio-rail"><nav class="sigs-v5-nav"><div id="sigs-v5-report-menu">Relatório técnico</div><div id="present">Apresentar</div></nav><div class="studio-rail-foot"></div></aside><section id="lp"><div id="lib-search-wrap"><input id="lib-search"></div><div id="dlist"></div></section></body>',{url:'https://example.test',runScripts:'outside-only'}),w=dom.window;
const css=w.document.createElement('style');css.textContent=fs.readFileSync('assets/css/sidebar-v13.css','utf8');w.document.head.appendChild(css);
Object.defineProperty(w.document,'readyState',{value:'complete'});w.setTimeout=f=>f();w.requestAnimationFrame=f=>f();w.resize=()=>{};w.S={lib:[]};w.MOD='cctv';w.sLib=()=>{};w.CLOUD={user:{id:'u'}};w.SIGS_V6={dirty:false};let saves=[],loads=0,opened=[],resolveSave,notices=[];w.notify=s=>notices.push(s);w.sigsV6SaveProject=mode=>{saves.push(mode);return new Promise(r=>resolveSave=r);};w.openCloud=()=>{throw Error('Must not redirect to portal');};w.sigsV6ListProjects=async()=>{loads++;return [{id:'a',name:'Entrada <script>',module:'CCTV',status:'ACTIVE',last_saved_at:'2026-10-08T05:47:00Z'},{id:'b',name:'Armazém',module:'FIRE',status:'DRAFT'}];};w.cloudOpenProject=async(id,name)=>{opened.push(id);return {id};};
vm.runInContext(fs.readFileSync('assets/js/sidebar-v13.js','utf8'),dom.getInternalVMContext());
const flush=()=>new Promise(r=>setImmediate(r));
(async()=>{
 const save=w.document.getElementById('s13-save-project'),load=w.document.getElementById('s13-load-project'),actions=save.parentElement;
 assert(save&&load);assert.equal(w.document.getElementById('sigs-v5-report-menu').nextElementSibling,actions);assert.equal(w.getComputedStyle(actions).display,'none');
 w.document.querySelector('[data-sidebar-view="menu"]').click();assert.notEqual(w.getComputedStyle(actions).display,'none');
 save.click();save.click();await Promise.resolve();assert.deepEqual(saves,['manual']);assert(save.disabled);resolveSave({id:'p'});await flush();assert(!save.disabled);
 // Loading never queries other projects and requires a saved current identity.
 w.sigsV6ListProjects=()=>{throw Error('Must not list other projects');};
 load.click();await flush();assert.deepEqual(opened,[]);assert(notices.pop().includes('Guarda o projeto atual'));assert(!load.disabled);
 w.CLOUD.projectId='current-1';w.CLOUD.projectName='Projeto atual';let calls=[];
 w.cloudOpenProject=async(id,name)=>{calls.push([id,name]);return {id};};
 load.click();load.click();await flush();assert.deepEqual(calls,[['current-1','Projeto atual']]);assert.equal(loads,0);assert(!w.document.getElementById('s13-saved-projects'));
 w.SIGS_V6.dirty=true;w.confirm=()=>false;load.click();await flush();assert.equal(calls.length,1,'Cancel preserves unsaved work');
 w.confirm=()=>true;load.click();await flush();assert.equal(calls.length,2);
 w.SIGS_V6.dirty=false;w.SIGS_V6.saving=true;load.click();await flush();assert.equal(calls.length,2);assert(notices.pop().includes('Aguarda'));w.SIGS_V6.saving=false;
 w.CLOUD.projectId='current-2';w.CLOUD.projectName='Outro atual';load.click();await flush();assert.deepEqual(calls.at(-1),['current-2','Outro atual'],'Uses the current project at click time');
 w.cloudOpenProject=()=>Promise.reject(Error('Falha de rede'));load.click();await flush();assert.equal(notices.pop(),'Falha de rede');assert(!load.disabled);
 w.sigsV6SaveProject=()=>Promise.reject(Error('Falha ao guardar'));save.click();await flush();assert.equal(notices.pop(),'Falha ao guardar');assert(!save.disabled);
 dom.window.close();console.log('PASS: Tools-only actions, current project reload, no other-project list, double-click guard, unsaved cancellation, save-in-progress guard and failure recovery');
})().catch(e=>{console.error(e);process.exitCode=1;dom.window.close();});
