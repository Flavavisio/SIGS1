const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const setup=fs.readFileSync('tests/device-selection-v113.test.cjs','utf8').split('// Clicking near the body')[0];
const env={require,console};vm.createContext(env);vm.runInContext(setup+'globalThis.fixture={w,dom};',env);
const {w,dom}=env.fixture;
w.sigsVisibleCatalog=rows=>rows;
const repeat=w.document.getElementById('repeat-placement');
assert.equal(w.S.repeatPlacement,true,'Continuous placement is enabled on initial load');assert.equal(repeat.checked,true);
function click(at){
 for(const type of ['pointerdown','mousedown','pointerup','mouseup','click']){
  const e=new w.MouseEvent(type,{bubbles:true,cancelable:true,button:0,clientX:at.x+70,clientY:at.y+40});
  if(type.startsWith('pointer'))Object.defineProperties(e,{pointerType:{value:'mouse'},pointerId:{value:1},isPrimary:{value:true}});
  w.cv.dispatchEvent(e);
 }
}
for(const mod of ['cctv','alarm']){
 w.S.repeatPlacement=false;repeat.checked=false;w.startModule(mod);
 assert.equal(w.S.repeatPlacement,true,'Opening a module restores the continuous default');assert.equal(repeat.checked,true);
 const d=w.S.lib.find(d=>mod==='cctv'?d.type==='bullet':d.type==='pir_indoor');assert(d);
 w.S.activeLib=d;w.setTool('place');w.S.zoom=1;w.S.pan={x:0,y:0};w.S.scale={ok:true,ppm:10,mpp:.1};
 const first=w.w2s(-200,100),second=w.w2s(100,200),third=w.w2s(300,350);
 click(first);assert.equal(w.S.placed.length,1);assert.equal(w.S.tool,'place');assert.equal(w.S.activeLib.id,d.id);
 click(second);assert.equal(w.S.placed.length,2);assert.equal(w.S.tool,'place');assert.equal(w.S.placed[1].libId,d.id);
 assert.notEqual(w.S.placed[0].label,w.S.placed[1].label);
 // Existing equipment still opens editing; a missed edit cannot place a clone.
 const existing=w.S.placed[0];click(first);assert.equal(w.S.placed.length,2);assert.equal(w.S.selId,existing.id);assert.equal(w.S.tool,null);
 click(third);assert.equal(w.S.placed.length,2);
 w.setTool('place');click(third);assert.equal(w.S.placed.length,3);assert.equal(w.S.tool,'place');
 w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(w.S.tool,null);
 click(w.w2s(500,500));assert.equal(w.S.placed.length,3,'Escape ends placement');
 // The user can still choose one equipment at a time.
 repeat.checked=false;w.S.repeatPlacement=repeat.checked;w.setTool('place');click(w.w2s(500,500));
 assert.equal(w.S.placed.length,4);assert.equal(w.S.tool,null);
}
dom.window.close();console.log('PASS: default continuous placement on load and module entry, successive real cameras and detectors, unique labels, edit precedence, no missed-edit clone, Escape and optional single placement.');
