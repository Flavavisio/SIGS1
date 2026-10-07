const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<body><aside class="studio-rail"><div class="studio-rail-foot"></div></aside><section id="lp"><div id="lib-search-wrap"><input id="lib-search"></div><div id="dlist"></div></section></body>',{url:'https://example.test',runScripts:'outside-only'}),w=dom.window;
Object.defineProperty(w.document,'readyState',{value:'complete'});w.setTimeout=f=>f();w.requestAnimationFrame=f=>f();w.resize=()=>{};w.S={lib:[]};w.MOD='cctv';w.sLib=()=>{};let saves=[],loads=0,resolveSave,notices=[];w.notify=s=>notices.push(s);w.sigsV6SaveProject=mode=>{saves.push(mode);return new Promise(r=>resolveSave=r);};w.openCloud=()=>{loads++;};
vm.runInContext(fs.readFileSync('assets/js/sidebar-v13.js','utf8'),dom.getInternalVMContext());
(async()=>{
 const save=w.document.getElementById('s13-save-project'),load=w.document.getElementById('s13-load-project');assert(save&&load);assert.equal(save.getAttribute('aria-label'),'Guardar projeto');assert.equal(load.title,'Carregar projeto');
 save.click();save.click();await Promise.resolve();assert.deepEqual(saves,['manual']);assert(save.disabled);resolveSave({id:'p'});await new Promise(r=>setImmediate(r));assert(!save.disabled);
 load.click();await new Promise(r=>setImmediate(r));assert.equal(loads,1);assert(!load.disabled);
 w.document.getElementById('s13-collapse').click();assert.equal(w.document.querySelector('.studio-rail').dataset.collapsed,'true');load.click();await new Promise(r=>setImmediate(r));assert.equal(loads,2);
 w.sigsV6SaveProject=()=>Promise.reject(Error('Falha de rede'));save.click();await new Promise(r=>setImmediate(r));assert.deepEqual(notices,['Falha de rede']);assert(!save.disabled);
 dom.window.close();console.log('PASS: visible project actions, cloud list opening, manual save, duplicate-click prevention, collapsed accessible labels and save failure recovery.');
})().catch(e=>{console.error(e);process.exitCode=1;dom.window.close();});
