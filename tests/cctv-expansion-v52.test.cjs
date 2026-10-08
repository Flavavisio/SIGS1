const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const Lens=require('../assets/js/lens-model-v45.js'),Catalog=require('../assets/data/cctv-expansion-v52.js');
assert.equal(Catalog.rows.length,10);
for(const brand of ['hikvision','uniview'])assert.equal(Catalog.rows.filter(d=>d.brand===brand).length,5);
assert.equal(new Set(Catalog.rows.map(d=>d.model)).size,10);
for(const d of Catalog.rows){
 assert.match(d.sourceURL,/https:\/\/(?:[^/]+\.)?(?:hikvision|uniview)\.com\//);
 assert.equal(d.sourceChecked,'2026-10-08');assert(d.resW*d.resH>0);
 const q=Lens.policy(d);assert(q.documented);
 if(q.adjustable){assert(Math.abs(Lens.fov({lens:q.min},d)-d.fovWide)<1e-8);assert(Math.abs(Lens.fov({lens:q.max},d)-d.fovTele)<1e-8);let last=180;for(let mm=q.min;mm<=q.max;mm+=.1){const fov=Lens.fov({lens:mm},d);assert(fov<=last+1e-8);last=fov;}}
 else{assert.equal(Lens.effective({lens:12},d),2.8);assert.equal(Lens.fov({lens:12},d),d.fov);}
}
const seed={id:'hk11',model:'DS-2CD2643G2-IZS',name:'Varifocal',fov:38,dori:{i:7}};
const merged=Catalog.merge([seed]);assert.deepEqual(seed,{id:'hk11',model:'DS-2CD2643G2-IZS',name:'Varifocal',fov:38,dori:{i:7}});
assert.equal(merged[0].id,'hk11');assert.equal(merged[0].fov,95.8);assert.equal(merged[0].lensMax,12);assert(!merged[0].dori);
assert.deepEqual(Catalog.merge(merged),merged,'Repeated remote loads or project restores must be idempotent');
assert.equal(Catalog.merge([{...seed,custom:true}])[0].fov,38);
assert.equal(Catalog.merge([{...seed,lensType:'motorized',lensMin:3,lensMax:9}])[0].lensMax,9,'Keep explicit catalogue edits');
assert.equal(Catalog.merge([{id:'remote-id',model:Catalog.rows[0].model}])[0].id,'remote-id');
assert.match(Lens.policy({lensType:'fixed',focalLength:2.8}).label,/2,8 mm/);
assert.match(Lens.policy({lensType:'motorized',lensMin:2.7,lensMax:13.5}).label,/2,7–13,5 mm/);
assert.match(Lens.policy({name:'Unknown fixed lens'}).label,/por confirmar/);
// Exercise the actual sidebar renderer and search with verified camera metadata.
const dom=new JSDOM('<input id="lib-search"><select id="s13-brand"></select><select id="s13-type"></select><div id="s13-count"></div><div id="dlist"></div><div id="ph-title"></div>',{runScripts:'outside-only'});
const w=dom.window;w.S={lib:Catalog.rows,activeLib:null};w.MOD='cctv';w.SIGSLensModel=Lens;w.sLib=d=>w.S.activeLib=d;w.openCtxLib=()=>{};
const src=fs.readFileSync('assets/js/sidebar-v13.js','utf8');
w.eval(src.slice(0,src.indexOf('function closeProjectList()'))+'window.renderLibrary=renderLibrary;})();');w.renderLibrary();
assert.equal(w.document.querySelectorAll('.sigs-lens-label').length,10);
assert.match(w.document.querySelector('#dlist').textContent,/2,7–13,5 mm/);
w.document.getElementById('lib-search').value='Wise-ISP';w.renderLibrary();assert.equal(w.document.querySelectorAll('.s13-device').length,1);assert.match(w.document.querySelector('.sigs-lens-label').textContent,/2,8 mm/);
w.document.getElementById('lib-search').value='2,7–13,5';w.renderLibrary();assert.equal(w.document.querySelectorAll('.s13-device').length,1);w.document.querySelector('.s13-device').click();assert.equal(w.S.activeLib.model,'DS-2CD3666G2-IZS');
w.MOD='alarm';w.S.lib=[{id:'alarm',name:'Intrusão',type:'pir_indoor'}];w.document.getElementById('lib-search').value='';w.renderLibrary();assert.equal(w.document.querySelectorAll('.sigs-lens-label').length,0);
dom.window.close();
console.log('PASS: ten verified references; fixed/varifocal limits and FOV endpoints; merge/restore preserves IDs and custom optics; lens labels, focal search and sidebar selection.');
