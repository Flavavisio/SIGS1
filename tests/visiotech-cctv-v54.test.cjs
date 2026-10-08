const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Lens=require('../assets/js/lens-model-v45.js'),V=require('../assets/data/visiotech-cctv-v54.js');
assert.equal(V.rows.length,77);assert.equal(V.rows.filter(d=>d.brand==='hikvision').length,37);assert.equal(V.rows.filter(d=>d.brand==='uniview').length,40);
assert.equal(new Set(V.rows.map(V.key)).size,77,'Colour/lens suffixes must not inflate the number of hardware models');
const c={};vm.createContext(c);for(const path of ['assets/data/equipment-catalog.js','assets/data/ajax-cctv-v47.js','assets/data/cctv-expansion-v52.js','assets/data/visiotech-cctv-v53.js'])vm.runInContext(fs.readFileSync(path,'utf8'),c);
const hw=d=>V.key(d).replace(/((?:AD)?[FN]?F)\d{2}(?=K)/g,'$1##');const priorHardware=new Set(c.CCTV_LIB.map(hw));for(const d of V.rows)assert(!priorHardware.has(hw(d)),'Lens-only variant: '+d.model);assert.equal(new Set(V.rows.map(hw)).size,77);
const before=c.CCTV_LIB,keys=new Set(before.map(V.key));for(const d of V.rows){
 assert(!keys.has(V.key(d)),'Existing reference repeated: '+d.model);
 assert.match(d.sourceURL,/^https:\/\/www\.visiotechsecurity\.com\/pt\/produtos\/.+-detail$/);assert.match(d.imgUrl,/^https:\/\//);assert.equal(d.sourceChecked,'2026-10-08');
 assert(d.resW>=1920&&d.resH>=1080);assert(d.fov>0&&d.fov<180);assert(d.range>0);
 const q=Lens.policy(d);assert(q.documented);if(q.adjustable){assert.equal(q.min,d.lensMin);assert.equal(q.max,d.lensMax);assert(Math.abs(Lens.fov({lens:q.min},d)-d.fovWide)<1e-8);assert(Math.abs(Lens.fov({lens:q.max},d)-d.fovTele)<1e-8);let prev=180;for(let n=q.min;n<=q.max;n+=.1){const f=Lens.fov({lens:n},d);assert(f<=prev+1e-8);prev=f;}}
 else{assert.equal(Lens.effective({lens:13.5},d),d.focalLength);assert(Math.abs(Lens.fov({lens:13.5},d)-d.fov)<1e-8);}
}
const combined=V.merge(before);assert.equal(combined.length,before.length+77);assert.deepEqual(V.merge(combined),combined);for(const d of before)assert.equal(combined.find(x=>x.id===d.id).model,d.model,'Saved project IDs stay valid');
const sample=V.rows.find(d=>d.brand==='uniview');const remote={...sample,id:'existing-remote-id',model:sample.model.replace(/^UV-/,''),focalLength:4,baseLens:4,fov:80};const merged=V.merge([remote]);assert.equal(merged.length,77);assert.equal(merged[0].id,remote.id);assert.equal(merged[0].focalLength,4);assert.equal(merged[0].fov,80);
assert.equal(V.merge([{...remote,custom:true,name:'Modelo personalizado'}])[0].name,'Modelo personalizado');
assert.equal(V.key({model:'DS-2CD1343G2-LIU(2.8mm)(BLACK)'}),V.key({model:'DS-2CD1343G2-LIU'}));
// Exercise the real catalogue mapping/load with server rows, then local supplementation.
const source=fs.readFileSync('assets/js/catalog-supabase.js','utf8'),start=source.indexOf('  function productToDevice('),end=source.indexOf('  window.sigsCatalogLoadRemote=');
const runtime={SIGSCCTVVisiotech100:V,SIGSCCTVVisiotech:c.SIGSCCTVVisiotech,SIGSCCTVExpansion:c.SIGSCCTVExpansion,SIGSAjaxCCTV:c.SIGSAjaxCCTV,MOD:'cctv',S:{lib:[{id:'custom',custom:true}]},clone:v=>JSON.parse(JSON.stringify(v)),renderDevList(){}};runtime.window=runtime;vm.createContext(runtime);vm.runInContext(source.slice(start,end),runtime);
const server=V.rows.map(d=>({id:'db-'+d.id,reference:d.model,name:d.name,category:'CCTV',family:'cctv',device_type:d.type,image_url:d.imgUrl,description:d.desc,specifications:{...d,source_id:d.id},brand:{name:d.brand,slug:d.brand}}));runtime.applyRemote(server);
assert.equal(runtime.CCTV_LIB.filter(d=>V.rows.some(x=>V.key(x)===V.key(d))).length,77);assert(runtime.S.lib.some(d=>d.id==='custom'));assert.equal(new Set(runtime.CCTV_LIB.map(d=>d.id)).size,runtime.CCTV_LIB.length);
runtime.applyRemote(server);assert.equal(runtime.CCTV_LIB.filter(d=>V.rows.some(x=>V.key(x)===V.key(d))).length,77,'Reload must not duplicate cameras');
const restore=fs.readFileSync('assets/js/block-03.js','utf8');assert.equal((restore.match(/S\.lib=SIGSCCTVVisiotech100\.merge\(S\.lib\)/g)||[]).length,2,'Both JSON import and cloud restore include the expansion');
for(const b of ['hikvision','uniview'])assert(new Set(combined.filter(d=>d.brand===b).map(hw)).size>=100);
console.log('PASS: 37 Hikvision + 40 Uniview; at least 100 each, no repeated hardware; documented optics and images; FOV endpoints; ID preservation; actual remote catalogue mapping and repeated loads; both project restore paths.');
