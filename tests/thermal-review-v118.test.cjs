const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const sources=['assets/data/equipment-catalog.js','assets/data/thermal-cctv-v69.js','assets/data/uniview-cctv-v91.js','assets/data/hikvision-cctv-v92.js','assets/data/hikvision-perimeter-v116.js','assets/data/thermal-review-v118.js','assets/js/lens-model-v45.js','assets/js/analytics-v85.js','assets/js/analytics-range-v86.js'];
const e={};e.window=e;vm.createContext(e);for(const f of sources)vm.runInContext(fs.readFileSync(f,'utf8'),e);
const rows=e.CCTV_LIB.filter(d=>d.type==='thermal_bi'),R=e.SIGSAnalyticsRange,L=e.SIGSLensModel;
const evidence=JSON.parse(fs.readFileSync('tests/fixtures/thermal-review-v118.json','utf8'));
const close=(a,b)=>assert(Math.abs(a-b)<1e-5,`${a} != ${b}`);
assert.equal(rows.length,54);assert.equal(new Set(rows.map(d=>d.id)).size,54);assert.equal(new Set(rows.map(d=>d.model)).size,54);
const known=rows.filter(d=>d.thermalRangeBasis==='manufacturer-human-vca');assert.equal(known.length,46);
assert.equal(known.filter(d=>d.thermalVehicleRangeBasis==='manufacturer-vehicle-vca').length,46);
function oracle(g,r){
 const points=[];
 for(const h of [0,g.H])for(const side of [-1,1]){
  const x=r*Math.sin(g.angle)+side*g.W/2,z=r*Math.cos(g.angle),depth=z*Math.cos(g.tilt)+(g.h-h)*Math.sin(g.tilt);
  if(depth<=.001)return false;points.push({x:x/depth,y:((h-g.h)*Math.cos(g.tilt)+z*Math.sin(g.tilt))/depth});
 }
 if(points.some(p=>Math.abs(p.x)>g.tanH||Math.abs(p.y)>g.tanV))return false;
 const px=(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)))*g.width/(2*g.tanH);
 const py=(Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y)))*g.height/(2*g.tanV);
 return px*py*3.5>=g.pixelThreshold**2;
}
let samples=0;
for(const d of rows){
 const reference=evidence.records.find(x=>x.model===d.model);assert(reference);close(d.thermalFov,reference.thermalFov);
 if(!known.includes(d)){
  for(const target of ['people','vehicles'])assert.equal(R.calculate({instHeight:4,instTilt:0,analytics:{people:true,vehicles:true}},d,target).available,false,`${d.model} must not acquire an invented VCA/optical reach`);
  assert.equal(R.thermalAim({instHeight:4},d),null);continue;
 }
 const aim=R.thermalAim({instHeight:4},d);assert(aim);assert(aim.tilt>=0&&aim.tilt<15,'Long-range thermals must not inherit the generic 30 degree tilt');
 for(const target of ['people','vehicles']){
  const cap=target==='people'?d.thermalRange:d.thermalVehicleRange;
  close(cap,target==='people'?reference.thermalRange:reference.thermalVehicleRange);
  const p={instHeight:4,instTilt:aim.tilt,lens:L.policy(d).initial,analytics:{people:true,vehicles:true,mode:'day'}};
  const useful=R.calculate(p,d,target);assert(useful.available,d.model+' '+target);assert(useful.max>cap*.95&&useful.max<=cap+1e-6);close(useful.referenceMax,cap);assert.equal(useful.width,d.thermalResW);assert.equal(useful.height,d.thermalResH);
  const night=R.calculate({...p,lens:L.policy(d).max,mp:8,recordWidth:8192,analytics:{...p.analytics,mode:'night'}},d,target);close(night.max,useful.max);
  const thin=R.calculate({...p,analytics:{...p.analytics,[target+'Width']:target==='people'?.25:1.8}},d,target);assert(!thin.available||thin.max<useful.max,'Smaller projected targets cannot inherit the full reference range');
  for(const height of [3,6])for(const tilt of [0,aim.tilt,30,60]){
   const q={...p,instHeight:height,instTilt:tilt},angle=Math.min(8,d.thermalFov/8)*Math.PI/180;
   const g=R.geometry(q,d,target,{angle}),r=R.calculate(q,d,target,{angle});
   for(let i=0;i<75;i++){
    const distance=.05*Math.pow(cap/.05,i/74);
    if(Math.abs(distance-(r.max||-1))<1e-5||Math.abs(distance-(r.min||-1))<1e-5)continue;
    assert.equal(!!(r.available&&distance>=r.min&&distance<=r.max),oracle(g,distance),JSON.stringify({model:d.model,target,height,tilt,distance,r}));samples++;
   }
  }
 }
}
// Independent primary tables for the newly enabled /P and Uniview references.
for(const [model,human,car] of [['DS-2TD2637-10/P',71,200],['DS-2TD2637-15/P',110,309],['DS-2TD2637-25/P',184,515],['TIC2A32SA-F3-4F4AC-I1',30,60],['TIC2A32SA-F7-4F6AC-I1',70,140],['TIC2A32SA-F10-4F8AC-I1',100,200],['TIC2624S-F10-4F6AC-I3',100,200],['TIC2624S-F25-4F12AC-I3',250,750],['TIC2624S-F35-4F12AC-I3',350,1050]]){
 const d=rows.find(d=>d.model===model);close(d.thermalRange,human);close(d.thermalVehicleRange,car);assert(d.analytics.people&&d.analytics.vehicles);
}
const safire=rows.find(d=>d.model==='SF-IPTB256A-3D5');assert.equal(safire.mp,5);close(safire.thermalFov,56);close(safire.visibleFov,81);close(safire.thermalDetectionRange,133);assert.equal(safire.thermalRange,0);assert(safire.analytics.people&&safire.analytics.vehicles);
const conflicting=rows.find(d=>d.model==='HM-TD2668-35/G1/T3Y');close(conflicting.thermalRange,435);assert(conflicting.thermalSourceNote.includes('455'));
// Local/remote merge stays idempotent and preserves custom equipment/prices.
const saved={...known[0],id:'saved-id',cost:123,_supabaseId:'cloud-id',instTilt:30},custom={...saved,id:'custom-id',custom:true,thermalRange:999};
const merged=e.SIGSThermalCatalog.merge([saved,custom]);assert.equal(merged[0].id,'saved-id');assert.equal(merged[0].instTilt,30);assert.equal(merged[0].cost,123);assert.equal(merged[1].thermalRange,999);assert.equal(merged.filter(d=>!d.custom&&d.type==='thermal_bi').length,54);assert.equal(e.SIGSThermalCatalog.merge(merged).length,merged.length);
// Use the actual placement, panel and native canvas renderer for every thermal.
let setup=fs.readFileSync('tests/ptz-render-integration-v111.test.cjs','utf8').split('const models=')[0];
setup=setup.replace("'assets/js/optics-v13.js'","'assets/data/thermal-cctv-v69.js','assets/data/uniview-cctv-v91.js','assets/data/hikvision-perimeter-v116.js','assets/data/thermal-review-v118.js','assets/js/optics-v13.js'");
const fixture={require,console};vm.createContext(fixture);vm.runInContext(setup+'globalThis.fixture={w,dom};',fixture);const {w,dom}=fixture.fixture;
w.eval(fs.readFileSync('assets/js/analytics-v85.js','utf8'));w.eval(fs.readFileSync('assets/js/analytics-range-v86.js','utf8'));
w.sigsCatalogDeviceAllowed=()=>true;w.notify=()=>{};w.updateStats=()=>{};w.SIGS_V6={currentStatus:'DRAFT'};w.MOD='cctv';
const full=w.CCTV_LIB.filter(d=>d.type==='thermal_bi');assert.equal(full.length,54);
for(const d of full){
 Object.assign(w.S,{placed:[],lib:[d],activeLib:d,tool:'place',selId:null,undoStack:[],redoStack:[],scale:{ok:true,ppm:10,mpp:.1},zoom:.2,pan:{x:0,y:0},layers:{cov:1,dev:1,fp:0,grid:0,meas:0}});
 w.FLOORS=[{id:'floor'}];w.FLOOR_CUR=0;w.placeDevice(0,0);const p=w.S.placed[0];assert.equal(w.S.placed.length,1);assert.equal(p.instTilt,w.SIGSAnalyticsRange.thermalAim({instHeight:d.height||3},d)?.tilt??0);
 p.analytics={people:true,vehicles:true,mode:'night'};w.syncP();w.render();
 const text=w.document.getElementById('analytics-reach').textContent;
 if(d.thermalRangeBasis==='manufacturer-human-vca'){assert(text.includes('Referência VCA:'));assert(text.includes('Orientação atual:'));assert.equal(w.document.getElementById('analytics-thermal-aim').hidden,false);}else assert.equal(w.document.getElementById('analytics-thermal-aim').hidden,true);
 if(d.visibleCoverageUnavailable){const exported=w.SIGSProposalOptics.capture(p,d);assert.equal(exported.fov,0);assert.equal(exported.range,0);assert.equal(exported.thermalRangeBasis,'manufacturer-johnson-dori');const svg=w.SIGSProposalOptics.sector({...exported,x:0,y:0},10,[]);assert(svg.includes('#e06042'));assert(!svg.includes('#3869e8'));}
}
// Reproduce the screenshot: 30 degrees is a framing restriction, not the
// camera's intrinsic VCA. Correct the aim explicitly, with undo and persistence.
const d=full.find(d=>d.model==='DS-2TD2628-3/QA'),p={id:'screenshot',libId:d.id,label:'THM02',x:0,y:0,instHeight:3.5,instTilt:30,lens:d.visibleLens,rotation:0,analytics:{people:true,vehicles:true,markerPositions:{people:{x:30,y:-40}}}};
Object.assign(w.S,{placed:[p],lib:[d],selId:p.id,undoStack:[],redoStack:[]});w.syncP();
close(w.SIGSAnalyticsRange.calculate(p,d,'people').referenceMax,28.8);assert(w.SIGSAnalyticsRange.calculate(p,d,'people').max<9);
assert.equal(p.instTilt,30,'Opening the panel must not silently overwrite an existing orientation');
const html=w.document.getElementById('analytics-reach').textContent;assert(html.includes('Referência VCA: 28.8 m'));assert(html.includes('inclinação 30°'));
w.sigsAimThermalVCA();assert.equal(p.instTilt,2.1);assert.equal(w.S.undoStack.length,1);assert.equal(JSON.parse(w.S.undoStack[0]).placed[0].instTilt,30);assert.equal(w.FLOORS[0].placed[0].instTilt,2.1);assert.equal(p.analytics.markerPositions.people.y,-40,'Manual markers remain user-owned');
assert(w.SIGSAnalyticsRange.calculate(p,d,'people').max>28.5);assert(w.SIGSAnalyticsRange.calculate(p,d,'vehicles').max>75);
// A manually positioned target remains visible with its out-of-range feedback,
// even when its ground point lies in the thermal blind zone.
w.S.zoom=1;p.analytics.markerPositions.people={x:0,y:-50};w.render();const marker=w.w2s(0,-50);assert(w.ctx.getImageData(Math.round(marker.x),Math.round(marker.y),1,1).data[3]>0);
w.sigsAimThermalVCA();assert.equal(w.S.undoStack.length,1,'Same aim does not add another undo');w.SIGS_V6.currentStatus='ARCHIVED';p.instTilt=30;w.sigsAimThermalVCA();assert.equal(p.instTilt,30);
dom.window.close();console.log(`PASS: all 54 thermals audited (46 documented VCA pairs, 8 unconfirmed), ${samples} projection checks, correct source distances/optics, long-range defaults, screenshot replay, explicit aim/undo/save/archive guards, existing orientations/customs/markers preserved, day/night/IR/recording/optical-zoom isolation and native placement/rendering.`);
