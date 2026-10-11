const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const e={};e.window=e;vm.createContext(e);
for(const file of ['assets/data/ajax-cctv-v90.js','assets/js/lens-model-v45.js','assets/js/engineering-model-v39.js','assets/js/analytics-v85.js','assets/js/analytics-range-v86.js'])vm.runInContext(fs.readFileSync(file,'utf8'),e);
const R=e.SIGSAnalyticsRange,L=e.SIGSLensModel,near=(a,b)=>assert(Math.abs(a-b)<1e-6,`${a} != ${b}`);
// Each catalogue variant uses its own family and the selected sensitivity, not a generic pixel threshold.
let variants=0;
for(const d of e.SIGSAjaxCCTV.rows){
 for(const ajaxSensitivity of ['default','maximum']){
  const p={instHeight:3,instTilt:3,lens:L.policy(d).initial,analytics:{mode:'night',ajaxSensitivity,people:true,vehicles:true,minPixels:1000}};
  const t=R.ajaxTable[d.ajaxFamily],i=ajaxSensitivity==='maximum'?3:1,pr=R.profile(p,d,'vehicles');
  if(t.vehicles?.day){variants++;near(pr.max,t.vehicles.day[i]*t.people.night[i]/t.people.day[i]);assert.equal(pr.method,'proportional');assert(pr.notes.some(n=>n.includes('não um valor certificado')));
   const r=R.calculate(p,d,'vehicles');assert(r.available);near(r.max,pr.max);
   const lo=R.calculate({...p,analytics:{...p.analytics,minPixels:8}},d,'vehicles');near(lo.max,r.max);
  }else assert(pr.unavailable,'No vehicle day basis: do not invent a night distance');
 }
}
const d=e.SIGSAjaxCCTV.rows.find(d=>d.ajaxFamily==='superiorHLVF'&&d.mp===8),p={instHeight:3,instTilt:3,lens:2.8,analytics:{mode:'day',people:true,vehicles:true}};
near(R.profile({...p,analytics:{...p.analytics,mode:'night'}},d,'vehicles').max,75*32/41);
const wide=R.calculate(p,d,'people'),tele=R.calculate({...p,lens:12},d,'people');assert(wide.available&&tele.available);assert(wide.min<30&&wide.max>30);assert(tele.min<30&&tele.max>30,'Person at 30 m remains fully framed with shallow downward tilt and optical zoom');assert(tele.max>wide.max);assert.equal(tele.method,'optical');assert(tele.notes.some(n=>n.includes('não medida pelo fabricante')));
const g=R.geometry({...p,lens:12},d,'people');assert(R.projectAt(g,30).valid);assert(R.projectAt(g,tele.max-.001).valid);assert(!R.projectAt(g,tele.max+.001).valid || tele.max===g.max);
// At a fixed steep tilt, zoom can crop distant targets out; never paint impossible analytics.
const steep=R.calculate({...p,lens:12,instTilt:29},d,'people');assert(!steep.available||steep.max<30);
assert(!R.projectAt(R.geometry({...p,lens:12,instTilt:29},d,'people'),30).framed);
const nightZoom=R.calculate({...p,lens:12,analytics:{...p.analytics,mode:'night'}},d,'vehicles');assert(nightZoom.max>d.range);assert(nightZoom.notes.some(n=>n.includes('é necessária luz suficiente')));
assert(R.outerRange({...p,lens:12},d,10)>=tele.max);
assert(L.policy(e.SIGSAjaxCCTV.rows.find(d=>d.ajaxFamily==='standard')).adjustable===false);
console.log(`PASS: ${variants} variant/sensitivity proportional cases, 58.5m example, pixel independence, optical zoom extends analytics with a 30m target framed, steep-tilt cropping, night illumination condition and outer contour.`);
