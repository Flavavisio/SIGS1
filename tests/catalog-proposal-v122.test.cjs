const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const pricing=require('../assets/js/commercial-model-v8.js'),recommend=require('../assets/js/recommendation-model-v24.js');
const dom=new JSDOM('<div id="m-bom" class="hide"></div><div id="tc-budget"></div><div id="cctv-system-content"></div>');
const w=dom.window;Object.defineProperty(w.document,'readyState',{value:'complete'});
const noop=()=>{},ctx={console,document:w.document,Math,Date,JSON,Map,Set,Number,Array,URL,
 setTimeout:f=>f(),setInterval:noop,SIGSCommercialModel:pricing,SIGSRecommendationModel:recommend,
 MOD:'cctv',FLOORS:[{placed:[],scale:{ok:false}}],FLOOR_CUR:0,S:{placed:[],lib:[],scale:{ok:false}},NVR_POS:null,
 SIGS_V6:{currentStatus:'ACTIVE'},BUDGET:{prices:{}},SIGS_PRICES:{},CLOUD:{projectName:'Teste'},
 saveCurrentFloor:noop,gD:()=>({type:'bullet',model:'AJ-CAM',brand:'Ajax',mp:4}),
 calcStorage:()=>({gb:100}),cameraNetworkMbps:()=>8,calcPoE:()=>({requiredPorts:3,totalWithMargin:20,maxSingle:8,uplink:{design:20},cameraPorts:1}),
 buildSystemTab:noop,notify:noop,sigsV6MarkDirty:noop,openM:id=>w.document.getElementById(id).classList.remove('hide'),
 _buildProjectData:()=>({module:'cctv',floors:[]}),_restoreProjectData:noop,startModule:noop,
 HDD_SIZES:[1,4,8,16,24],sigsHddCatalogRef:t=>'HDD-'+t};ctx.window=ctx;vm.createContext(ctx);
const run=file=>vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
for(const file of ['assets/data/poe-network-catalog.js','assets/data/ajax-nvr-v102.js','assets/js/commercial-v8.js','assets/js/recommendations-v24.js'])run(file);
const input={cameras:[{brand:'Ajax'}],count:1,wiredCount:1,maxMP:4,bandwidth:10,storageGB:100,
 requiredPorts:3,requiredWatts:20,maxPortW:8,requiredUplink:20,maxCameraMbps:10,
 nvrs:ctx.NVR_DB,switches:ctx.POE_SWITCH_DB,hdds:[{reference:'HDD4',capacityTB:4}]};
let rec=recommend.design(input);assert.equal(rec.nvr.reference,'AJ-NVR208-HAC2G-AI-S-B');
assert.equal(recommend.design({...input,selectedNvr:'AJ-NVR208-HAC2G-AI-S-W'}).nvr.colour,'Branco');
assert.equal(recommend.design({...input,count:9}).nvr.ch,16);
assert(!recommend.design({...input,bandwidth:400}).nvr);
assert(!recommend.design({...input,powerMode:'integrated'}).nvr);
assert(!recommend.design({...input,storageGB:50000}).nvr);
const uv=ctx.POE_SWITCH_DB.find(d=>d.reference==='UV-NSW3000-8T2GT-POE-IN');
assert.equal(uv.accessMbps,100);assert.equal(uv.uplinkMbps,1000);assert.equal(uv.budget,120);assert.equal(uv.ports,8);assert.equal(uv.uplinkPorts,2);
for(const networkBrand of ['Reyee','Uniview']){
 rec=recommend.design({...input,networkBrand});assert.equal(rec.nvr.brand,'Ajax');assert.equal(rec.switch.brand,networkBrand);assert(rec.switches.every(d=>d.brand===networkBrand));
}
rec=recommend.design({...input,networkBrand:'Uniview',selectedSwitch:uv.reference});assert.equal(rec.switch.reference,uv.reference);
assert(!recommend.design({...input,switches:[uv],maxCameraMbps:101}).switch);
assert(!recommend.design({...input,switches:[uv],maxPortW:31}).switch);
assert(!recommend.design({...input,switches:[uv],requiredPorts:9}).switch);
// Loading a populated remote catalogue must retain the verified models, without duplicates.
const catalog=fs.readFileSync('assets/js/catalog-supabase.js','utf8');ctx.clone=v=>JSON.parse(JSON.stringify(v));
vm.runInContext(catalog.slice(catalog.indexOf('  function productToDevice('),catalog.indexOf('  window.sigsCatalogLoadRemote=')),ctx);
const remote=[{reference:'REMOTE-NVR',name:'Remote',category:'CCTV',device_type:'nvr',brand:{name:'Uniview'},specifications:{channels:8,max_mp:8,bandwidth_mbps:80,hdd_bays:1}},
 {reference:'REMOTE-SW',name:'Remote switch',category:'NETWORK',device_type:'switch',brand:{name:'Reyee'},specifications:{ports:8,poe_budget_w:120,uplink_mbps:1000}}];
ctx.applyRemote(remote);ctx.applyRemote(remote);
assert.equal(ctx.NVR_DB.filter(d=>d.reference==='AJ-NVR208-HAC2G-AI-S-B').length,1);
assert.equal(ctx.POE_SWITCH_DB.filter(d=>d.reference===uv.reference).length,1);
// Real UI: independent networking selection, quote SKU, persistence and manual override.
ctx.FLOORS[0].placed=[{libId:'cam',mp:4}];ctx.buildSystemTab();
const select=(id,value)=>{const el=w.document.getElementById(id);assert(el,id);el.value=value;el.onchange();};
select('v24-network-brand','Uniview');select('v24-switch',uv.reference);select('v24-nvr','AJ-NVR208-HAC2G-AI-S-W');
let q=ctx.sigsV8Quote();assert(q.lines.some(r=>r.ref==='AJ-NVR208-HAC2G-AI-S-W'));assert(q.lines.some(r=>r.ref===uv.reference));
let saved=JSON.parse(JSON.stringify(ctx._buildProjectData()));ctx._restoreProjectData(saved);
assert.equal(ctx.SIGS_COMMERCIAL.recommendationNetworkBrand,'Uniview');assert.equal(ctx.SIGS_COMMERCIAL.recommendationNvr,'AJ-NVR208-HAC2G-AI-S-W');
// Real budget input events, same reference on separate lines, reference rename and installation.
ctx.FLOORS[0].placed=[];ctx.openBOM();
const edit=(i,key,value)=>{const el=w.document.querySelector('[data-extra="'+i+'"][data-field="'+key+'"]');assert(el,key);el.focus();el.value=value;el.dispatchEvent(new w.Event('input',{bubbles:true}));};
const click=id=>w.document.getElementById(id).click();
click('v8-add');edit(0,'ref','CLIENTE-1');edit(0,'name','Artigo <especial>');edit(0,'qty','2');edit(0,'cost','31.19');edit(0,'sale','100.25');
const stable=ctx.SIGS_COMMERCIAL.extras[0].priceKey;edit(0,'ref','CLIENTE-2');
assert.equal(ctx.sigsV8Quote().lines[0].sale,100.25);assert.equal(ctx.sigsV8Quote().lines[0].ref,'CLIENTE-2');
click('v8-add');edit(1,'ref','CLIENTE-2');edit(1,'sale','10');
click('v8-add-installation');edit(2,'sale','150');
ctx.SIGS_COMMERCIAL.discount=10;q=ctx.sigsV8Quote();
assert.equal(q.lines.length,3);assert.equal(q.sub,324.45);assert.equal(q.iva,74.62);assert.equal(q.total,399.07);
assert.equal(q.lines.find(r=>r.type==='instalacao').ref,'INSTALACAO');
saved=JSON.parse(JSON.stringify(ctx._buildProjectData()));ctx._restoreProjectData(saved);assert.equal(ctx.SIGS_COMMERCIAL.extras[0].priceKey,stable);assert.equal(ctx.sigsV8Quote().total,399.07);
// Public proposal, shared snapshot and alternatives keep sales; exclude internal prices/keys.
ctx.SIGSAccessoryModel=require('../assets/js/accessory-model-v10.js');ctx.SIGSProposalOptics=require('../assets/js/proposal-optics-v27.js');run('assets/js/proposal-v10.js');
const c={...ctx.SIGS_COMMERCIAL,module:'cctv'};
const html=ctx.sigsV10ProposalMarkup(q,c,[],[]);assert(html.includes('CLIENTE-2'));assert(html.includes('Instalação e configuração'));assert(html.includes('Artigo &lt;especial&gt;'));assert(!html.includes(stable));assert(!html.includes('31.19'));assert(!html.includes('31,19'));
const wf=require('../assets/js/workflow-model-v12.js');const share=wf.publicSnapshot(q,c,[],[],'Teste');assert.equal(share.total,399.07);assert(!JSON.stringify(share).includes(stable));
const alt=require('../assets/js/alternatives-model-v26.js'),option=alt.capture('a','A',q,c,saved);assert.equal(alt.publicOptions([option],pricing.calculate)[0].total,399.07);
// Removing and archived editing; old reference-keyed extras retain their price on rename.
ctx.openBOM();w.document.querySelector('[data-remove="1"]').click();assert.equal(ctx.sigsV8Quote().lines.length,2);
ctx._restoreProjectData({commercial:{extras:[{ref:'OLD',name:'Legacy',qty:1}],prices:{OLD:{cost:5,sale:25}}}});ctx.openBOM();edit(0,'ref','NEW');assert.equal(ctx.sigsV8Quote().lines[0].sale,25);
ctx.SIGS_V6.currentStatus='ARCHIVED';ctx.openBOM();const before=JSON.stringify(ctx.SIGS_COMMERCIAL);assert(w.document.getElementById('v8-add-installation').disabled);w.document.getElementById('v8-add').onclick();w.document.querySelector('[data-remove="0"]').onclick();assert.equal(JSON.stringify(ctx.SIGS_COMMERCIAL),before);
console.log('PASS: Ajax Superior recommendation/capacity/colour, independent networking brands and exact UV switch, remote reload retention, real budget edits/prices/installation/tax, save/restore, public PDF/privacy, alternatives and archive protection.');
