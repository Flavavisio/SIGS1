const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const setup=fs.readFileSync('tests/device-selection-v113.test.cjs','utf8').split('// Clicking near the body')[0];
const env={require,console};vm.createContext(env);
vm.runInContext(setup+'globalThis.fixture={w,dom,d,seed,advance(){time+=60000;}};',env);
const {w,dom,d,seed,advance}=env.fixture;
function send(type,at,target=w.cv,extra={}){
 const e=new w.MouseEvent(type,{bubbles:true,cancelable:true,button:0,clientX:at.x+70,clientY:at.y+40,...extra});
 if(type.startsWith('pointer'))Object.defineProperties(e,{pointerId:{value:1},isPrimary:{value:true},pointerType:{value:extra.pointerType||'mouse'}});
 target.dispatchEvent(e);return e;
}
function freshPlace(at,target=w.cv){
 send('pointerdown',at,target);send('mousedown',at,target);send('pointerup',at,target);send('mouseup',at,target);send('click',at,target);
}
function releaseClickMustNotPlace(target,free){
 // Even when placement is rearmed, release must not become a new placement.
 w.S.repeatPlacement=true;w.setTool('place');advance();
 const count=w.S.placed.length;
 const click=send('click',free,target);assert(click.defaultPrevented);
 assert.equal(w.S.placed.length,count,'Delayed release click must never place a camera');
 freshPlace(free,target);assert.equal(w.S.placed.length,count+1,'The next deliberate click still places exactly one camera');
 assert.equal(w.S.tool,'place','Continuous placement remains available');
}
let cases=0;
for(const pointerType of ['mouse','touch','pen'])for(const zoom of [.1,1,4])for(const target of [w.cv,w.bgcv,w.cw]){
 const p=seed(zoom),at=w.w2s(0,0),end={x:at.x+60,y:at.y+40},free={x:at.x+420,y:at.y+300};
 send('pointerdown',at,w.cv,{pointerType});
 assert(send('mousedown',at,target).defaultPrevented,'Parent compatibility down must not start a second drag');
 send('pointermove',end,w.cv,{pointerType});send('pointerup',end,w.cv,{pointerType});
 assert(send('mouseup',end,target).defaultPrevented);
 assert.equal(p.x,60/zoom);assert.equal(p.y,40/zoom);assert.equal(w.S.placed.length,1);
 assert.equal(w.S.undoStack.length,1);assert.equal(JSON.parse(w.S.undoStack[0]).placed[0].x,0);
 releaseClickMustNotPlace(target,free);cases++;
}
// Mouse fallback: fisheye cameras, multi-selection, movement undo and release
// outside the canvas. Group members must move once, by the same displacement.
for(const group of [false,true])for(const outside of [false,true]){
 const p=seed(),at=w.w2s(0,0),end={x:at.x+70,y:at.y+30},free={x:at.x+450,y:at.y+350};
 w.S.lib=[{...d,type:'fisheye'}];
 const other={...p,id:'second',x:120};
 if(group){w.S.placed.push(other);w.S.multiSel=[p.id,other.id];w.S.selId=other.id;}
 send('mousedown',at);send('mousemove',end,outside?w.document.body:w.cv);send('mouseup',end,outside?w.document.body:w.cw);
 assert.equal(p.x,70);assert.equal(p.y,30);assert.equal(w.S.drag,false);
 if(group){assert.equal(other.x,190);assert.equal(other.y,30);}
 assert.equal(w.S.undoStack.length,1);assert.equal(JSON.parse(w.S.undoStack[0]).placed[0].x,0);
 releaseClickMustNotPlace(w.cw,free);cases++;
}
// Legacy taps retain the tap threshold and produce no movement/undo.
let p=seed(),at=w.w2s(0,0);w.S.lib=[{...d,type:'fisheye'}];
send('mousedown',at);send('mousemove',{x:at.x+2,y:at.y});send('mouseup',at);send('click',at);
assert.equal(p.x,0);assert.equal(w.S.undoStack.length,0);assert.equal(w.S.selId,p.id);
// Other map gestures must also consume the release click.
for(const kind of ['pan','floor','selection']){
 seed();w.S.tool=null;at=w.w2s(200,200);const end={x:at.x+60,y:at.y+35};
 if(kind==='floor')w.S.fp={x:150,y:150,w:300,h:300,locked:false};else w.S.fp=null;
 send('mousedown',at,w.cv,{altKey:kind==='pan'});send('mousemove',end);send('mouseup',end,w.cw);
 assert.equal(w.S.dragFP,false);assert.equal(w.S.panning,false);assert.equal(w.S.rubberBand,null);
 if(kind==='floor'){assert.equal(w.S.fp.x,210);assert.equal(w.S.fp.y,185);}
 releaseClickMustNotPlace(w.bgcv,{x:at.x+500,y:at.y+400});cases++;
}
w.S.fp=null;
// Aiming the selected camera owns its release just like moving its body.
p=seed();w.select(p.id);const aim=w.SIGSCameraFOV.layout(p,d).find(h=>h.kind==='aim');at=w.w2s(aim.x,aim.y);
send('pointerdown',at);send('pointermove',{x:at.x+50,y:at.y});send('pointerup',{x:at.x+50,y:at.y});
assert(p.rotation>0);releaseClickMustNotPlace(w.cw,{x:at.x+420,y:at.y+300});cases++;
// Cancelling a pointer drag restores its camera and still blocks its click.
p=seed();at=w.w2s(0,0);send('pointerdown',at);send('pointermove',{x:at.x+60,y:at.y});send('pointercancel',at);
assert.equal(p.x,0);releaseClickMustNotPlace(w.cw,{x:at.x+420,y:at.y+300});cases++;
// Analytics markers share the parent-wide gesture guard.
p=seed();p.analytics={people:true,vehicles:false,mode:'day',markerPositions:{people:{x:44,y:0}}};at=w.w2s(44,0);
send('pointerdown',at);send('pointermove',{x:at.x+20,y:at.y+10});send('pointerup',{x:at.x+20,y:at.y+10});
assert.equal(p.x,0);assert.equal(p.analytics.markerPositions.people.x,64);
releaseClickMustNotPlace(w.cw,{x:at.x+420,y:at.y+300});cases++;
// Direct callers also cannot interpret a mouse release as a placement.
p=seed();w.S.lib=[{...d,type:'fisheye'}];at=w.w2s(0,0);
send('mousedown',at);send('mousemove',{x:at.x+40,y:at.y});send('mouseup',at);w.setTool('place');advance();
w.onClick(new w.MouseEvent('click',{button:0,clientX:at.x+570,clientY:at.y+340}));assert.equal(w.S.placed.length,1);
// Losing window focus ends and persists a fallback drag without a stuck button.
p=seed();w.S.lib=[{...d,type:'fisheye'}];at=w.w2s(0,0);send('mousedown',at);send('mousemove',{x:at.x+40,y:at.y});
w.dispatchEvent(new w.Event('blur'));assert.equal(w.S.drag,false);assert.equal(w.FLOORS[0].placed[0].x,40);
releaseClickMustNotPlace(w.cw,{x:at.x+420,y:at.y+300});cases++;
dom.window.close();console.log(`PASS: ${cases} delayed drag-release cases across canvas/background/parent, mouse/touch/pen and zoom; legacy/group/outside releases, tap threshold, undo, pan/floor/selection, cancellation, marker and direct-call guards; deliberate next placement works.`);
