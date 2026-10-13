const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
// Use the real HTML, full base renderer and pointer controller, with native canvas.
let setup=fs.readFileSync('tests/ptz-render-integration-v111.test.cjs','utf8').split('const models=')[0];
setup=setup.replace("Object.defineProperties(w.document.getElementById('cw')", "Object.defineProperty(w.document,'readyState',{value:'complete'});Object.defineProperties(w.document.getElementById('cw')");
const env={require,console};vm.createContext(env);vm.runInContext(setup+'globalThis.fixture={w,dom};',env);
const {w,dom}=env.fixture;
w.eval(fs.readFileSync('assets/js/analytics-v85.js','utf8'));w.eval(fs.readFileSync('assets/js/analytics-range-v86.js','utf8'));
w.sigsCatalogDeviceAllowed=()=>true;w.updateStats=()=>{};w.notify=()=>{};
w.cv.getBoundingClientRect=()=>({left:70,top:40,width:1600,height:1400});w.cv.setPointerCapture=()=>{};w.cv.releasePointerCapture=()=>{};
for(const [type,name] of [['mousedown','onDown'],['mouseup','onUp'],['mousemove','onMove'],['click','onClick']])w.cw.addEventListener(type,e=>w[name](e));
let time=10000,dirty=0;w.Date.now=()=>time;w.sigsV6MarkDirty=()=>dirty++;
const d=w.SIGSHikvisionCCTV92.rows.find(d=>d.type==='bullet'&&d.analytics?.people&&d.analytics?.vehicles);assert(d);
function seed(zoom=1,scaled=true){
 time+=1000;const p={id:'original',libId:d.id,label:'CAM01',x:0,y:0,lens:w.SIGSLensModel.policy(d).initial,rotation:0,instHeight:3,instTilt:5,color:d.color,opacity:.22};
 Object.assign(w.S,{placed:[p],lib:[d],selId:null,multiSel:[],activeLib:d,tool:'place',repeatPlacement:false,pointerType:'mouse',scale:{ok:scaled,ppm:10,mpp:.1},zoom,pan:{x:30,y:20},layers:{dev:1,cov:1,fp:0,grid:0,meas:0},drag:false,panning:false,dragFP:false,rubberBand:null,undoStack:[],redoStack:[],mapOpen:false});
 w.FLOORS=[{id:'floor',placed:w.S.placed,scale:w.S.scale}];w.FLOOR_CUR=0;w.SIGS_V6={currentStatus:'DRAFT'};
 // Each fixture starts with a fresh physical gesture, independent of a prior
 // marker drag whose compatibility click was deliberately omitted.
 w.cw.dispatchEvent(new w.MouseEvent('pointerdown',{bubbles:true,button:0}));return p;
}
function event(type,at,pointerType){
 const e=new w.MouseEvent(type,{bubbles:true,cancelable:true,button:0,clientX:at.x+70,clientY:at.y+40});
 if(pointerType)Object.defineProperties(e,{pointerType:{value:pointerType},pointerId:{value:1},isPrimary:{value:true}});
 w.cv.dispatchEvent(e);return e;
}
function tap(at,type='mouse',jitter=0){
 time+=400;event('pointerdown',at,type);event('mousedown',at);
 if(jitter){event('pointermove',{x:at.x+jitter,y:at.y},type);event('mousemove',{x:at.x+jitter,y:at.y});}
 event('pointerup',{x:at.x+jitter,y:at.y},type);event('mouseup',{x:at.x+jitter,y:at.y});event('click',{x:at.x+jitter,y:at.y});
}
// Clicking near the body or on CAM01 always edits, at every zoom and with/without scale.
let selections=0;
for(const zoom of [.08,.5,1,4])for(const scaled of [false,true])for(const pointer of ['mouse','touch','pen'])for(const label of [false,true]){
 const p=seed(zoom,scaled),at=w.w2s(0,0);at.x+=label?44:0;at.y+=label?0:25;
 const before={x:p.x,y:p.y},beforeDirty=dirty;tap(at,pointer,2);
 assert.equal(w.S.placed.length,1);assert.equal(w.S.selId,p.id);assert.equal(w.S.tool,null);
 assert.deepEqual({x:p.x,y:p.y},before,'A configuration tap must not move the camera');assert.equal(w.S.undoStack.length,0,'Configuration tap does not add a movement undo');assert.equal(dirty,beforeDirty);
 tap(at,pointer);assert.equal(w.S.placed.length,1,'Repeated attempts must not create duplicate cameras');selections++;
}
// Legacy mouse fallback and click-only access also prioritise selection over placement.
let p=seed(),at=w.w2s(0,0);at.x+=44;for(const type of ['mousedown','mouseup','click'])event(type,at);assert.equal(w.S.placed.length,1);assert.equal(w.S.selId,p.id);
p=seed();at=w.w2s(0,0);at.y+=25;event('click',at);assert.equal(w.S.placed.length,1);assert.equal(w.S.tool,null);
// Place one, then safely configure; rearming is explicit. Continuous placement is opt-in.
p=seed();const center=w.w2s(0,0),free={x:center.x+180,y:center.y+140};event('click',free);assert.equal(w.S.placed.length,2);assert.equal(w.S.tool,null);assert.equal(w.S.activeLib.id,d.id);
event('click',{x:free.x+100,y:free.y});assert.equal(w.S.placed.length,2,'A missed edit click cannot create another device');
w.setTool('place');event('click',{x:free.x-100,y:free.y+100});assert.equal(w.S.placed.length,3);
p=seed();w.S.repeatPlacement=true;event('click',free);assert.equal(w.S.tool,'place');event('click',{x:free.x+100,y:free.y});assert.equal(w.S.placed.length,3,'Intentional continuous placement works without alternate-click skips');
event('click',{x:center.x,y:center.y+25});assert.equal(w.S.placed.length,3);assert.equal(w.S.selId,p.id);assert.equal(w.S.tool,null,'An existing device always exits continuous placement to edit');
// Nearest body wins over another device’s label or a later item in the array.
p=seed();const other={...p,id:'other',label:'CAM02',x:35};w.S.placed.push(other);assert.equal(w.hitT(1,0).id,p.id);assert.equal(w.hitT(34,0).id,other.id);
w.S.layers.dev=0;assert.equal(w.hitT(0,0),null);w.S.layers.dev=1;
// Real movement begins after the tap threshold, can be undone, and never places a clone.
p=seed();at=w.w2s(0,0);time+=400;event('pointerdown',at,'touch');
w.cv.getBoundingClientRect=()=>({left:140,top:40,width:1600,height:1400});event('pointermove',at,'touch');event('pointerup',at,'touch');assert.equal(p.x,0,'Opening a properties panel cannot turn a stationary finger into a camera move');assert.equal(w.S.undoStack.length,0);
w.cv.getBoundingClientRect=()=>({left:70,top:40,width:1600,height:1400});
p=seed();at=w.w2s(0,0);time+=400;event('pointerdown',at,'touch');event('pointermove',{x:at.x+30,y:at.y+15},'touch');event('pointerup',{x:at.x+30,y:at.y+15},'touch');event('click',{x:at.x+30,y:at.y+15});assert.equal(w.S.placed.length,1);assert.equal(p.x,30);assert.equal(p.y,15);assert.equal(JSON.parse(w.S.undoStack[0]).placed[0].x,0);
// Nearby analytics glyphs still own their drag, even when they overlap the camera label.
p=seed();p.analytics={people:true,vehicles:false,mode:'day',markerPositions:{people:{x:44,y:0}}};at=w.w2s(44,0);time+=400;event('pointerdown',at,'touch');event('pointermove',{x:at.x+20,y:at.y+10},'touch');event('pointerup',{x:at.x+20,y:at.y+10},'touch');assert.equal(p.x,0);assert.equal(p.analytics.markerPositions.people.x,64);assert.equal(w.S.placed.length,1);
// Measurement/calibration, map mode and archived projects retain their own restrictions.
p=seed();w.S.tool='meas';event('click',w.w2s(0,0));assert(w.S.mp1);assert.equal(w.S.placed.length,1);
p=seed();w.SIGS_V6.currentStatus='ARCHIVED';event('click',free);assert.equal(w.S.placed.length,1);event('click',w.w2s(0,0));assert.equal(w.S.selId,p.id);assert.equal(w.S.undoStack.length,0);
p=seed();w.S.mapOpen=true;event('click',free);assert.equal(w.S.placed.length,1);
dom.window.close();console.log(`PASS: ${selections} real icon/label mouse/touch/pen selections across zoom/calibration, no duplicate placement or jitter moves, explicit repeat placement, nearest hit, movement undo, analytics priority and tool/map/archive guards.`);
