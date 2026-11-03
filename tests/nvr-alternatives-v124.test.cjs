const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const M=require('../assets/js/recommendation-model-v24.js');
const dom=new JSDOM('<div id="m-bom" class="hide"></div><div id="tc-budget"></div><div id="cctv-system-content"></div><div id="poe-summary"></div><div id="net-diagram"></div><div id="bw-summary"></div>'),w=dom.window;
const noop=()=>{},c={document:w.document,console,Math,Date,JSON,Map,Set,Number,Array,URL,setTimeout:f=>f(),setInterval:noop,
SIGSCommercialModel:require('../assets/js/commercial-model-v8.js'),SIGSRecommendationModel:M,MOD:'cctv',FLOORS:[{placed:[{libId:'cam',mp:4}],scale:{ok:false}}],FLOOR_CUR:0,S:{placed:[],lib:[],scale:{ok:false}},NVR_POS:null,SIGS_V6:{currentStatus:'ACTIVE'},BUDGET:{prices:{}},SIGS_PRICES:{},CLOUD:{projectName:'Teste'},saveCurrentFloor:noop,
gD:()=>({type:'bullet',model:'CAM',brand:'Ajax',mp:4}),calcStorage:()=>({gb:100}),cameraNetworkMbps:()=>8,
calcPoE:()=>({requiredPorts:3,totalWithMargin:20,maxSingle:8,uplink:{design:20},cameraPorts:1}),buildSystemTab:noop,notify:noop,sigsV6MarkDirty:noop,openM:id=>w.document.getElementById(id).classList.remove('hide'),_buildProjectData:()=>({module:'cctv',floors:[]}),_restoreProjectData:noop,startModule:noop,HDD_SIZES:[1,4,8,16,24],sigsHddCatalogRef:t=>'HDD-'+t};c.window=c;vm.createContext(c);
const run=f=>vm.runInContext(fs.readFileSync(f,'utf8'),c);
run('assets/data/poe-network-catalog.js');
c.NVR_DB=[{name:'HK-NOPOE',reference:'HK-NOPOE',brand:'Hikvision',ch:8,maxMP:12,bw:100,hdd:2,maxDiskTB:16,poePorts:0}];
for(const f of ['assets/data/ajax-nvr-v102.js','assets/data/nvr-poe-v55.js','assets/data/nvr-alternatives-v124.js','assets/js/commercial-v8.js','assets/js/recommendations-v24.js'])run(f);
const input={cameras:[{brand:'Ajax'}],count:1,wiredCount:1,maxMP:4,bandwidth:10,storageGB:100,requiredPorts:3,requiredWatts:20,maxPortW:8,requiredUplink:20,maxCameraMbps:10,nvrs:c.NVR_DB,switches:c.POE_SWITCH_DB,hdds:[{reference:'HDD4',capacityTB:4}]};
let r=M.design(input);assert.equal(r.nvr.reference,'AJ-NVR208-HAC2G-AI-S-B');
const groups=new Set(r.alternatives.map(o=>M.brand(o.device)+':'+o.powerMode));for(const b of ['Hikvision','Uniview'])for(const p of ['external','integrated'])assert(groups.has(b+':'+p));
assert.equal(new Set(r.alternatives.map(o=>o.device.reference)).size,r.alternatives.length);
// Every native brand is ranked first, while manual choices from another brand remain valid.
for(const b of ['Ajax','Hikvision','Uniview']){r=M.design({...input,cameras:[{brand:b}]});assert.equal(M.brand(r.nvr),b);for(const other of ['Ajax','Hikvision','Uniview']){const target=r.nvrs.find(d=>M.brand(d)===other);assert(target);assert.equal(M.design({...input,cameras:[{brand:b}],selectedNvr:target.reference}).nvr.reference,target.reference);}}
for(const change of [{bandwidth:1000},{maxMP:32},{storageGB:1e6},{count:33}]){r=M.design({...input,...change});assert.equal(r.nvr,null);assert.equal(r.recorderOptions.length,0);assert.equal(r.alternatives.length,0);}
r=M.design({...input,requiredWatts:241,maxPortW:31});assert(r.recorderOptions.every(o=>o.powerMode==='external'));assert(r.alternatives.every(o=>o.powerMode==='external'));
const original=JSON.stringify(c.NVR_DB);M.design(input);assert.equal(JSON.stringify(c.NVR_DB),original);
// Real cards: three highlighted alternatives; fourth category available in the expandable list.
c.buildSystemTab();let panel=w.document.getElementById('v24-system');assert.equal(panel.querySelector('.v124-grid').children.length,3);assert(panel.querySelector('.v124-alternatives details'));assert(panel.textContent.includes('ONVIF'));
const hkPoe=c.NVR_DB.find(d=>d.brand==='Hikvision'&&d.poePorts);let button=[...panel.querySelectorAll('[data-v124-recorder]')].find(b=>b.dataset.v124Recorder===hkPoe.reference);assert(button);button.click();
assert.equal(c.SIGS_COMMERCIAL.recommendationNvr,hkPoe.reference);assert.equal(c.SIGS_COMMERCIAL.recommendationPower,'integrated');assert(!w.document.getElementById('v24-switch'));
let quote=c.sigsV8Quote();assert(quote.lines.some(l=>l.type==='nvr'&&l.ref===hkPoe.reference));assert(!quote.lines.some(l=>l.type==='switch'));
let saved=JSON.parse(JSON.stringify(c._buildProjectData()));c._restoreProjectData(saved);assert.equal(c.sigsSystemRecommendation().nvr.reference,hkPoe.reference);assert.equal(c.SIGS_COMMERCIAL.recommendationPower,'integrated');
// The recorder selector crosses brands and power modes in one change and updates the same quote.
c.buildSystemTab();const select=w.document.getElementById('v24-nvr');select.value='UV-NVR301-08B-IQ';select.onchange();assert.equal(c.SIGS_COMMERCIAL.recommendationPower,'external');assert(w.document.getElementById('v24-switch'));quote=c.sigsV8Quote();assert(quote.lines.some(l=>l.ref==='UV-NVR301-08B-IQ'));assert(quote.lines.some(l=>l.type==='switch'));
c.gD=()=>({type:'bullet',model:'CAM',brand:'Uniview',mp:4});c.SIGS_COMMERCIAL.recommendationNvr='';c.SIGS_COMMERCIAL.recommendationBrand='auto';c.buildSystemTab();assert.equal(c.sigsSystemRecommendation().nvr.brand,'Uniview');assert(c.sigsSelectRecommendedRecorder('AJ-NVR208-HAC2G-AI-S-B'));assert(c.sigsV8Quote().lines.some(l=>l.ref==='AJ-NVR208-HAC2G-AI-S-B'));
c.SIGS_COMMERCIAL.recommendationSwitch='MY-MANUAL-SWITCH';assert(c.sigsSelectRecommendedRecorder('UV-NVR301-08B-IQ'));assert.equal(c.SIGS_COMMERCIAL.recommendationSwitch,'MY-MANUAL-SWITCH');
// Archive protection applies to both cards and direct selection handler.
c.SIGS_V6.currentStatus='ARCHIVED';c.buildSystemTab();const before=JSON.stringify(c.SIGS_COMMERCIAL);assert([...w.document.querySelectorAll('[data-v124-recorder]')].every(b=>b.disabled));assert.equal(c.sigsSelectRecommendedRecorder(hkPoe.reference),false);assert.equal(JSON.stringify(c.SIGS_COMMERCIAL),before);
// A populated remote infrastructure catalogue cannot remove the non-PoE models.
const catalog=fs.readFileSync('assets/js/catalog-supabase.js','utf8');vm.runInContext(catalog.slice(catalog.indexOf('  function productToDevice('),catalog.indexOf('  window.sigsCatalogLoadRemote=')),c);const remote=[{reference:'REMOTE',category:'CCTV',device_type:'nvr',brand:{name:'Uniview'},specifications:{channels:4,max_mp:4,bandwidth_mbps:40,hdd_bays:1}}];c.applyRemote(remote);c.applyRemote(remote);for(const ref of ['UV-NVR301-08B-IQ','UV-NVR302-16B-IQ'])assert.equal(c.NVR_DB.filter(d=>d.reference===ref).length,1);
dom.window.close();console.log('PASS: native-brand ranking for Ajax/Hikvision/Uniview; manual cross-brand choices; four brand/PoE combinations with 3 highlighted cards; capacity/PoE filtering; live selector/cards, quote/switch changes, restore/archive protection and remote retention.');
