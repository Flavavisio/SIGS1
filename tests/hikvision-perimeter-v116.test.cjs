const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const e={URL};e.window=e;vm.createContext(e);
for(const f of ['assets/data/equipment-catalog.js','assets/data/thermal-cctv-v69.js','assets/data/hikvision-cctv-v92.js'])vm.runInContext(fs.readFileSync(f,'utf8'),e);
const before=new Set(e.CCTV_LIB.map(d=>d.model));
for(const f of ['assets/data/hikvision-perimeter-v116.js','assets/js/lens-model-v45.js','assets/js/analytics-v85.js','assets/js/analytics-range-v86.js','assets/js/product-links-v106.js'])vm.runInContext(fs.readFileSync(f,'utf8'),e);
const C=e.SIGSHikvisionPerimeter116,R=e.SIGSAnalyticsRange,L=e.SIGSLensModel;
const evidence=JSON.parse(fs.readFileSync('tests/fixtures/hikvision-perimeter-v116.json','utf8'));
assert.equal(C.rows.length,22);assert.equal(C.rows.filter(d=>!before.has(d.model)).length,17);assert.equal(new Set(C.rows.map(C.key)).size,22);
let checks=0;
const close=(a,b)=>assert(Math.abs(a-b)<1e-5,`${a} != ${b}`);
function oracle(g,distance){
 const corners=[];
 for(const y of [0,g.H])for(const side of [-1,1]){
  const x=Math.sin(g.angle)*distance+side*g.W/2,z=Math.cos(g.angle)*distance;
  const depth=z*Math.cos(g.tilt)+(g.h-y)*Math.sin(g.tilt);
  if(depth<=.001)return false;
  corners.push({x:x/depth,y:((y-g.h)*Math.cos(g.tilt)+z*Math.sin(g.tilt))/depth});
 }
 if(corners.some(p=>Math.abs(p.x)>g.tanH||Math.abs(p.y)>g.tanV))return false;
 const wp=(Math.max(...corners.map(p=>p.x))-Math.min(...corners.map(p=>p.x)))*g.width/(2*g.tanH);
 const hp=(Math.max(...corners.map(p=>p.y))-Math.min(...corners.map(p=>p.y)))*g.height/(2*g.tanV);
 return wp*hp*3.5>=g.pixelThreshold*g.pixelThreshold;
}
for(const d of C.rows){
 const source=evidence.find(r=>r.model===d.model);assert(source);assert.equal(source.url,d.sourceURL);
 const dims=source.specs['Resolução do sensor térmico'].match(/(\d+)x(\d+)/);assert.equal(d.thermalResW,Number(dims[1]));assert.equal(d.thermalResH,Number(dims[2]));
 if(source.manufacturerOverrides)assert.equal(d.visibleLens,source.manufacturerOverrides.visibleLens);
 const b=fs.readFileSync(d.photoURL);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),d.imageSHA256);assert.equal(b.readUInt32BE(16),d.imageWidth);assert.equal(b.readUInt32BE(20),d.imageHeight);
 assert.equal(e.SIGSProductLinks.resolve(d),new URL(d.sourceURL).href);assert(e.CCTV_LIB.some(x=>x.model===d.model));assert.equal(e.SIGSHikvisionCCTV92.lookup(d).thermalFov,d.thermalFov);
 assert(e.SIGSThermalCatalog.label(d).includes('nativo'));
 const q=L.policy(d);assert.equal(q.adjustable,!!d.opticalZoom);close(L.fov({lens:q.initial},d),d.visibleFov);if(q.adjustable){close(L.fov({lens:q.max},d),d.fovTele);assert.equal(q.zoom,d.opticalZoom);}
 if(d.thermalCoverageUnavailable){
  assert.equal(d.analytics.people,false);assert.equal(d.analytics.vehicles,false);assert.equal(R.calculate({analytics:{people:true,vehicles:true}},d,'people').available,false);assert.equal(d.thermalRange,0);continue;
 }
 const vca=source.specs['Intervalos VCA'];assert(vca);close(d.thermalRange,Number(vca.match(/Pessoa:\s*([\d.]+)/)[1]));close(d.thermalVehicleRange,Number(vca.match(/Veiculo:\s*([\d.]+)/)[1]));
 for(const target of ['people','vehicles']){
  const cap=target==='people'?d.thermalRange:d.thermalVehicleRange;
  const base={x:0,y:0,instHeight:1.8,instTilt:0,rotation:0,lens:q.initial,analytics:{people:true,vehicles:true,mode:'day'}};
  const reference=R.calculate(base,d,target);assert(reference.available);close(reference.max,cap);assert.equal(reference.width,d.thermalResW);assert.equal(reference.height,d.thermalResH);
  const shrink={...base,analytics:{...base.analytics,[target+'Width']:target==='people'?.25:1.8}};
  const reduced=R.calculate(shrink,d,target);assert(reduced.available,JSON.stringify({model:d.model,target,reduced,g:R.geometry(shrink,d,target)}));assert(reduced.max<cap);close(reduced.max/cap,Math.sqrt((target==='people'?.25:1.8)/d.thermalVcaReference[target].width));
  const night=R.calculate({...base,mp:8,recordWidth:8192,lens:q.max,analytics:{...base.analytics,mode:'night'}},d,target);
  close(night.max,cap);assert.equal(night.width,d.thermalResW,'Upscaling/recording resolution and optical zoom cannot extend thermal VCA');
  for(const height of [2,5])for(const tilt of [-10,0,20,50])for(const width of [target==='people'?.3:1.8,target==='people'?.5:4]){
   const p={...base,instHeight:height,instTilt:tilt,analytics:{...base.analytics,[target+'Width']:width}};
   const angle=(target==='people'?-1:1)*Math.min(8,d.thermalFov/8)*Math.PI/180;
   const g=R.geometry(p,d,target,{angle}),r=R.calculate(p,d,target,{angle});
   if(r.available){assert(r.max<=cap+1e-6);assert(r.min>=.05);assert(oracle(g,(r.min+r.max)/2));}
   for(let i=0;i<65;i++){
    const distance=.05*Math.pow(cap/.05,i/64),expected=oracle(g,distance);
    if(Math.abs(distance-(r.max||-1))<1e-5||Math.abs(distance-(r.min||-1))<1e-5)continue;
    assert.equal(!!(r.available&&distance>=r.min&&distance<=r.max),expected,JSON.stringify({model:d.model,target,height,tilt,width,distance,r}));checks++;
   }
  }
 }
}
// Preserve saved IDs, internal fields and user-created equipment on local and
// remote merges; a second merge must not introduce another copy of any model.
const d=C.rows[0],saved={...d,id:'saved-id',cost:123,_supabaseId:'cloud-id',thermalFov:999},custom={...saved,id:'custom',custom:true};
const merged=e.SIGSThermalCatalog.merge([saved,custom]);assert.equal(merged[0].id,'saved-id');assert.equal(merged[0].cost,123);assert.equal(merged[0]._supabaseId,'cloud-id');assert.equal(merged[0].thermalFov,d.thermalFov);assert.equal(merged[1].thermalFov,999);
assert.equal(C.merge(C.merge([])).length,22);assert.equal(C.lookup(custom),null);
// Integrate with the actual full renderer and sidebar, including PTZ optics.
let setup=fs.readFileSync('tests/ptz-render-integration-v111.test.cjs','utf8').split('const models=')[0];
setup=setup.replace("'assets/js/optics-v13.js'","'assets/data/thermal-cctv-v69.js','assets/data/hikvision-perimeter-v116.js','assets/js/optics-v13.js'");
const fixture={require,console};vm.createContext(fixture);vm.runInContext(setup+'globalThis.fixture={w,dom};',fixture);const {w,dom}=fixture.fixture;
w.eval(fs.readFileSync('assets/js/analytics-v85.js','utf8'));w.eval(fs.readFileSync('assets/js/analytics-range-v86.js','utf8'));
for(const model of C.rows){
 const d=w.CCTV_LIB.find(d=>d.model===model.model),p={id:'test-camera',libId:d.id,label:'THM01',x:0,y:0,lens:w.SIGSLensModel.policy(d).initial,rotation:0,instHeight:3,instTilt:0,color:d.color,opacity:.22,analytics:{people:true,vehicles:true,mode:'night'}};
 Object.assign(w.S,{placed:[p],lib:[d],selId:p.id,scale:{ok:true,ppm:10,mpp:.1},zoom:1,pan:{x:0,y:0},layers:{cov:1,dev:1,fp:0,grid:0,meas:0}});w.MOD='cctv';w.syncP();w.render();
 if(d.opticalZoom){assert(w.SIGSPTZOverview.isPTZ(d));assert.notEqual(w.document.getElementById('cctv-lens').style.display,'none');assert(w.document.getElementById('plensv').textContent.includes('×'));p.lens=d.lensMax;w.render();close(w.SIGSAnalyticsRange.calculate(p,d,'vehicles').max,d.thermalVehicleRange);}
 if(d.thermalCoverageUnavailable){const at=w.w2s(0,0);assert.equal(w.ctx.getImageData(Math.round(at.x),Math.round(at.y-80),1,1).data[3],0,'No invented 100 m thermal cone for thermometry-only references');}
}
const rail=w.document.createElement('aside');rail.className='studio-rail';rail.innerHTML='<nav class="sigs-v5-nav"></nav><div class="studio-rail-foot"></div>';w.document.body.appendChild(rail);
Object.defineProperty(w.document,'readyState',{value:'complete'});w.S.lib=w.SIGSHikvisionPerimeter116.rows;w.resize=()=>{};w.sLib=d=>w.S.activeLib=d;w.setTimeout=(f,ms)=>ms===900?f():0;w.requestAnimationFrame=()=>0;w.eval(fs.readFileSync('assets/js/sidebar-v13.js','utf8'));
assert.equal(w.document.querySelectorAll('.s13-device img').length,22);assert(w.document.getElementById('dlist').textContent.includes('VCA carros:'));assert(!w.document.getElementById('dlist').textContent.includes('Pessoas: 0 m'));
const img=[...w.document.querySelectorAll('.s13-device')].find(b=>b.textContent.includes('DS-2TD4228T-7/S2'));img.click();assert.equal(w.S.activeLib.model,'DS-2TD4228T-7/S2');
dom.window.close();console.log(`PASS: all 22 exact references (17 new), verified native sensors/photos/VCA tables, ${checks} independent projection checks, day/night, target size/orientation, IR/recording/zoom isolation, 3 optical PTZs, 2 unconfirmed thermometry models, native rendering/sidebar and saved/custom/remote merge preservation.`);
