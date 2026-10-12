const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
function environment(){const e={};e.window=e;vm.createContext(e);for(const f of ['assets/data/equipment-catalog.js','assets/data/ajax-cctv-v90.js','assets/data/uniview-cctv-v91.js','assets/data/hikvision-cctv-v92.js','assets/js/lens-model-v45.js','assets/js/engineering-model-v39.js','assets/js/analytics-v85.js','assets/js/analytics-range-v86.js'])vm.runInContext(fs.readFileSync(f,'utf8'),e);return e;}
const e=environment(),R=e.SIGSAnalyticsRange,L=e.SIGSLensModel,close=(a,b)=>assert(Math.abs(a-b)<1e-5,`${a} != ${b}`);
const camera={brand:'test',model:'fixture',type:'bullet',analytics:{people:true,vehicles:true},lensType:'fixed',focalLength:2.8,fov:90,verticalFov:2*Math.atan(1080/1920)*180/Math.PI,resW:1920,resH:1080,range:200};
const p={x:0,y:0,instHeight:3,instTilt:0,rotation:0,analytics:{people:true,vehicles:true,mode:'day'}};
// Independent closed-form oracle: both targets use the same projected pixel area.
const person=R.calculate(p,camera,'people'),vehicle=R.calculate(p,camera,'vehicles');
close(person.max,960*Math.sqrt(1.75*.5*3.5)/108);close(vehicle.max,960*Math.sqrt(1.5*1.8*3.5)/108);
close(vehicle.max/person.max,Math.sqrt((1.5*1.8)/(1.75*.5)));
const doubleWidth=R.calculate({...p,analytics:{...p.analytics,vehiclesWidth:3.6}},camera,'vehicles');close(doubleWidth.max/vehicle.max,Math.sqrt(2));
const smallVehicle=R.calculate({...p,analytics:{...p.analytics,vehiclesWidth:.5,vehiclesHeight:.5}},camera,'vehicles');assert(smallVehicle.max<person.max,'Dimensions determine the result; do not artificially force vehicles to exceed people');
const strict=R.calculate({...p,analytics:{...p.analytics,minPixels:216}},camera,'vehicles');close(strict.max,vehicle.max/2);
// Compare the algebraic interval to a separate direct projection of all four target corners.
function oracle(g,distance){
 const points=[];for(const y of [0,g.H])for(const side of [-1,1]){
  const x=Math.sin(g.angle)*distance+side*g.W/2,z=Math.cos(g.angle)*distance,depth=z*Math.cos(g.tilt)+(g.h-y)*Math.sin(g.tilt);
  if(depth<=.001)return false;
  points.push({x:x/depth,y:((y-g.h)*Math.cos(g.tilt)+z*Math.sin(g.tilt))/depth});
 }
 if(points.some(q=>Math.abs(q.x)>g.tanH||Math.abs(q.y)>g.tanV))return false;
 const wp=(Math.max(...points.map(q=>q.x))-Math.min(...points.map(q=>q.x)))*g.width/(2*g.tanH),hp=(Math.max(...points.map(q=>q.y))-Math.min(...points.map(q=>q.y)))*g.height/(2*g.tanV);
 return wp*hp*3.5>=g.s.minPixels**2;
}
for(const height of [1,3,8])for(const tilt of [-10,0,30,60,80])for(const target of ['people','vehicles']){
 const q={...p,instHeight:height,instTilt:tilt},g=R.geometry(q,camera,target),r=R.calculate(q,camera,target);
 for(let i=0;i<180;i++){
  const distance=.05*Math.pow(500/.05,i/179),expected=oracle(g,distance),actual=r.available&&distance>=r.min&&distance<=r.max;
  assert.equal(!!actual,expected,JSON.stringify({height,tilt,target,distance,r}));
 }
 if(r.available)assert(oracle(g,(r.min+r.max)/2));
}
// Audit the actual catalogues, including their own optics, resolutions and documented ranges.
const catalogues=[e.SIGSUniviewCCTV91.rows,e.SIGSHikvisionCCTV92.rows,e.SIGSAjaxCCTV.rows];
let comparisons=0,documented=0,illuminationLimited=0;
for(const rows of catalogues)for(const d of rows){
 if(!e.SIGSAnalytics.capabilities(d).people||!e.SIGSAnalytics.capabilities(d).vehicles)continue;
 const policy=L.policy(d),lenses=[...new Set([policy.initial,policy.adjustable?policy.max:policy.initial])];
 for(const mode of ['day','night'])for(const tilt of [0,5,30,60])for(const height of [3,5])for(const lens of lenses){
  const q={...p,instHeight:height,instTilt:tilt,lens,analytics:{...p.analytics,mode}},angle=Math.min(8,L.fov(q,d)/8)*Math.PI/180;
  const a=R.calculate(q,d,'people',{angle:-angle}),b=R.calculate(q,d,'vehicles',{angle});
  for(const [t,r,azimuth] of [['people',a,-angle],['vehicles',b,angle]])if(r.available){const g=R.geometry(q,d,t,{angle:azimuth});assert(R.projectAt(g,(r.min+r.max)/2).framed);assert(Number.isFinite(r.max));}
  if(a.available&&b.available){comparisons++;assert(b.max+1e-5>=a.max,`${d.model} ${mode} ${tilt} ${height} ${lens}: person ${a.max} > car ${b.max}`);}
  if(a.method==='documented'||b.method==='documented')documented++;
  if(mode==='night'&&b.available&&b.method==='estimate'){assert(b.max<=Math.max(d.range||0,d.whiteRange||0)+1e-5);illuminationLimited++;}
 }
}
assert(comparisons>2000);assert(documented>100);assert(illuminationLimited>100);
// Manual positions stay manual; explicit reset has undo/persistence and archive protection.
const dom=new JSDOM(fs.readFileSync('app-Sigs.html','utf8'),{url:'https://sigs.test',runScripts:'outside-only'}),w=dom.window;
for(const f of ['lens-model-v45','engineering-model-v39','analytics-v85','analytics-range-v86'])w.eval(fs.readFileSync('assets/js/'+f+'.js','utf8'));
const placed={...p,id:'selected',analytics:{...p.analytics,markerPositions:{people:{x:1,y:2},vehicles:{x:4,y:5}}}};
w.MOD='cctv';w.S={placed:[placed],selId:placed.id,scale:{ok:true,ppm:10},zoom:1};w.fP=()=>placed;w.gD=()=>camera;w.SIGS_V6={currentStatus:'ACTIVE'};
let undo=0,saves=0,dirty=0;w.pushUndo=()=>undo++;w.saveCurrentFloor=()=>saves++;w.sigsV6MarkDirty=()=>dirty++;w.render=()=>{};
w.SIGSAnalytics.sync(placed,camera);const reset=w.document.getElementById('analytics-reset-targets');assert(!reset.hidden);assert(w.document.getElementById('analytics-reach').textContent.includes('alvo na imagem'));
w.SIGS_V6.currentStatus='ARCHIVED';w.sigsResetAnalyticsTargets();assert(placed.analytics.markerPositions);assert.equal(undo,0);
w.SIGS_V6.currentStatus='ACTIVE';w.sigsResetAnalyticsTargets();assert(!placed.analytics.markerPositions);assert(reset.hidden);assert.equal(undo,1);assert.equal(saves,1);assert.equal(dirty,1);
dom.window.close();console.log(`PASS: common-area closed-form oracle, real target dimensions (no forced ordering), full projection/tilt interval oracle, ${comparisons} catalogue target comparisons, ${documented} documented cases, ${illuminationLimited} night limits and safe manual-marker reset.`);
