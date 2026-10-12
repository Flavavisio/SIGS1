const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
// Reuse the native-canvas pointer fixture that verifies the person/car controls.
const source=fs.readFileSync('tests/analytics-marker-drag-v107.test.cjs','utf8').split('const f=fixture()')[0];
const env={require,console};vm.createContext(env);vm.runInContext(source+';globalThis.make=fixture;',env);
const f=env.make(),{w,p,d,stats}=f;w.S.layers.dev=1;
w.eval(fs.readFileSync('assets/js/optics-v13.js','utf8'));
let sync=0;w.syncP=()=>sync++;w.select=id=>w.S.selId=id;
w.eval(fs.readFileSync('assets/js/camera-fov-v108.js','utf8'));
const F=w.SIGSCameraFOV;
const move=(x,y,kind='mouse')=>{f.pointer('pointermove',w.w2s(x,y),kind);f.pointer('pointerup',w.w2s(x,y),kind);};
for(const pointer of ['mouse','touch','pen']){
 f.advance();p.rotation=0;p.instTilt=30;p.lens=2.8;
 const aim=F.layout(p,d).find(h=>h.kind==='aim'),at=w.w2s(aim.x,aim.y),before={x:p.x,y:p.y};
 assert(f.pointer('pointerdown',at,pointer).defaultPrevented);
 const target={x:p.x+80,y:p.y};move(target.x,target.y,pointer);
 assert(Math.abs(p.rotation-90)<1e-6);assert.equal(p.x,before.x);assert.equal(p.y,before.y);
 const metres=80/w.S.scale.ppm-aim.distanceOffset;assert(Math.abs(p.instTilt-Math.atan2(3,metres)*180/Math.PI)<.051);
 assert.equal(w.S.tool,'place');assert(sync>0);assert(stats.saves>0);assert(stats.dirty>0);
}
assert(stats.undos.length===3,'One undo snapshot per complete gesture');
// Optical inversion follows the documented nonlinear FOV model, within each SKU's bounds.
for(const lens of [d.lensMin,4,7,d.lensMax]){
 const desired=w.SIGSLensModel.fov({lens},d),angle=p.rotation*Math.PI/180+desired*Math.PI/360;
 F.update(p,d,'zoom-right',{x:p.x+Math.sin(angle)*150,y:p.y-Math.cos(angle)*150});
 assert(Math.abs(p.lens-lens)<.001);assert(p.lens>=d.lensMin&&p.lens<=d.lensMax);
}
const fixed={...d,lensType:'fixed',focalLength:4,lensMin:undefined,lensMax:undefined};f.model(fixed);
assert.equal(F.layout(p,fixed).filter(h=>h.kind.startsWith('zoom')).length,0);const oldLens=p.lens;F.update(p,fixed,'zoom-left',{x:p.x,y:p.y});assert.equal(p.lens,oldLens);
f.model(d);f.advance();p.instTilt=20;const left=F.layout(p,d).find(h=>h.kind==='zoom-left');assert(f.pointer('pointerdown',w.w2s(left.x,left.y),'touch').defaultPrevented);const start=p.lens;f.pointer('pointermove',w.w2s(p.x+3,p.y-70),'touch');f.pointer('pointercancel',w.w2s(p.x,p.y),'touch');assert.equal(p.lens,start,'Cancel restores the original optics');
// Touch camera movement does not alter aim, inclination or lens.
f.advance();const before={rotation:p.rotation,instTilt:p.instTilt,lens:p.lens},pos=w.w2s(p.x,p.y);assert(f.pointer('pointerdown',pos,'touch').defaultPrevented);move(p.x+40,p.y+25,'touch');assert.deepEqual({rotation:p.rotation,instTilt:p.instTilt,lens:p.lens},before);
// The visible FOV handle owns a hit even when an analytics target overlaps it.
f.advance();const aim=F.layout(p,d)[0];p.analytics.markerPositions={people:{x:aim.x,y:aim.y}};const mark=JSON.stringify(p.analytics.markerPositions);assert(f.pointer('pointerdown',w.w2s(aim.x,aim.y)).defaultPrevented);move(p.x+70,p.y-15);assert.equal(JSON.stringify(p.analytics.markerPositions),mark);
f.advance();w.SIGS_V6.currentStatus='ARCHIVED';const n=stats.undos.length;f.pointer('pointerdown',w.w2s(p.x,p.y));assert.equal(stats.undos.length,n);w.SIGS_V6.currentStatus='DRAFT';w.S.tool='geometry';f.advance();f.pointer('pointerdown',w.w2s(p.x,p.y));assert.equal(stats.undos.length,n);
w.S.tool=null;f.advance();const h=F.layout(p,d)[0];f.pointer('pointerdown',w.w2s(h.x,h.y));const previous=p.rotation;w.FLOORS=[{id:'different'}];f.pointer('pointermove',w.w2s(p.x+50,p.y));assert.equal(p.rotation,previous,'Switching floors cancels a pending gesture');
const html=fs.readFileSync('app-Sigs.html','utf8');assert(html.indexOf('camera-fov-v108.js')>html.indexOf('analytics-range-v86.js'));assert(html.includes('maplibre-v56.js'));assert(html.includes('step="0.1" value="30"'));
f.dom.window.close();console.log('PASS: direct aim/tilt for mouse/touch/pen, exact nonlinear zoom and SKU limits, fixed-lens guard, cancellation, camera movement, pointer priority, undo/persistence and archive/tool/floor guards.');
