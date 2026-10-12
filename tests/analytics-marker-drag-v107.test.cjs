const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),{createCanvas}=require('@napi-rs/canvas');
const read=p=>fs.readFileSync(p,'utf8');
function fixture(){
 const dom=new JSDOM('<div id="cw"><canvas id="maincv" width="1200" height="900"></canvas></div>',{url:'https://sigs.test',runScripts:'outside-only'}),w=dom.window;
 Object.defineProperty(w.document,'readyState',{value:'complete'});
 w.cv=w.document.getElementById('maincv');w.cw=w.document.getElementById('cw');
 w.cv.getBoundingClientRect=()=>({left:70,top:40,width:1200,height:900});
 w.cv.setPointerCapture=()=>{};w.cv.releasePointerCapture=()=>{};
 for(const file of ['assets/data/ajax-cctv-images-v90.js','assets/data/ajax-cctv-v90.js','assets/js/lens-model-v45.js','assets/js/engineering-model-v39.js','assets/js/proposal-optics-v27.js','assets/js/analytics-v85.js'])w.eval(read(file));
 const d=w.SIGSAjaxCCTV.rows.find(d=>d.model==='AJ-TURRETCAM-8-HLVF-S-B');assert(d);
 const p={id:'p',libId:d.id,x:12,y:30,rotation:0,lens:2.8,mp:8,instHeight:3,instTilt:29,analytics:{people:true,vehicles:false,mode:'night'}};
 w.S={placed:[p],selId:p.id,tool:'place',scale:{ok:true,ppm:8},zoom:1,pan:{x:10,y:40},layers:{cov:1}};
 w.MOD='cctv';w.SIGS_V6={currentStatus:'DRAFT'};w.FLOORS=[{id:'f',placed:w.S.placed,scale:w.S.scale}];w.FLOOR_CUR=0;
 let model=d;w.gD=()=>model;
 w.w2s=(x,y)=>({x:x*w.S.zoom+w.S.pan.x+w.cv.width/2,y:y*w.S.zoom+w.S.pan.y+w.cv.height/2});
 w.s2w=(x,y)=>({x:(x-w.cv.width/2-w.S.pan.x)/w.S.zoom,y:(y-w.cv.height/2-w.S.pan.y)/w.S.zoom});
 w.ep=e=>({x:e.clientX-70,y:e.clientY-40});w.lRange=(base,lens,p,d)=>w.SIGSProposalOptics.capture({...p,lens},d).range;
 const stats={undos:[],saves:0,dirty:0,legacy:0},ctx=createCanvas(1200,900).getContext('2d');let markers=[];
 w.pushUndo=()=>stats.undos.push(JSON.stringify(w.S.placed));w.saveCurrentFloor=()=>stats.saves++;w.sigsV6MarkDirty=()=>stats.dirty++;
 for(const name of ['mousedown','mousemove','mouseup','click'])w.cw.addEventListener(name,()=>stats.legacy++);
 const glyph=w.SIGSAnalytics.glyph;w.SIGSAnalytics.glyph=(ctx,target,size)=>{const m=ctx.getTransform();markers.push({target,x:m.e,y:m.f});glyph(ctx,target,size);};
 w.eval(read('assets/js/analytics-range-v86.js'));
 w.render=()=>{markers=[];ctx.resetTransform();const d=model,fov=d.type==='thermal_bi'?d.thermalFov:w.SIGSLensModel.fov(p,d),base=d.type==='thermal_bi'?d.thermalRange:w.lRange(d.range,p.lens,p,d),range=w.SIGSAnalyticsRange.outerRange(p,d,base),at=w.w2s(p.x,p.y);ctx.save();ctx.translate(at.x,at.y);ctx.rotate(p.rotation*Math.PI/180);w.SIGSAnalyticsRange.draw(ctx,p,d,fov,range);ctx.restore();};
 let time=1000;w.Date.now=()=>time;
 function pointer(name,at,type='mouse',id=1){const ev=new w.MouseEvent(name,{bubbles:true,cancelable:true,button:0,clientX:at.x+70,clientY:at.y+40});Object.defineProperties(ev,{pointerType:{value:type},pointerId:{value:id},isPrimary:{value:true}});w.cv.dispatchEvent(ev);return ev;}
 function mouse(name,at){const ev=new w.MouseEvent(name,{bubbles:true,cancelable:true,button:0,clientX:at.x+70,clientY:at.y+40});w.cv.dispatchEvent(ev);return ev;}
 return {dom,w,p,d,stats,pointer,mouse,markers:()=>{w.render();return markers;},model:d=>model=d,advance:()=>time+=500};
}
const f=fixture(),{w,p,stats}=f;
let at=f.markers().find(m=>m.target==='people');assert(at,'Screenshot marker is drawn');
let start={x:p.x,y:p.y},to={x:at.x+35,y:at.y+18};
assert(f.pointer('pointerdown',at).defaultPrevented,'A drawn marker must remain draggable in camera placement mode');
f.mouse('mousedown',at);f.pointer('pointermove',to);f.mouse('mousemove',to);f.pointer('pointerup',to);f.mouse('mouseup',to);f.mouse('click',to);
assert.equal(stats.legacy,0,'Dragging a marker must not place, select or move cameras through legacy mouse handlers');
assert.deepEqual({x:p.x,y:p.y},start,'The camera stays in place');assert.equal(w.S.tool,'place','Placement mode is retained');
let dest=w.s2w(to.x,to.y);assert(Math.abs(p.analytics.markerPositions.people.x-dest.x)<1e-7);assert(Math.abs(p.analytics.markerPositions.people.y-dest.y)<1e-7);
assert.equal(stats.undos.length,1);assert.equal(stats.saves,1);assert.equal(stats.dirty,1);
assert.equal(JSON.parse(JSON.stringify(p)).analytics.markerPositions.people.x,dest.x,'Position survives project serialization');
assert.equal(JSON.parse(stats.undos[0])[0].analytics.markerPositions,undefined,'Undo restores the previous marker position');
f.advance();f.mouse('mousedown',{x:10,y:10});assert.equal(stats.legacy,1,'Canvas editing resumes after the drag');
// Test the actual glyph transform, rather than independently assuming a hit position.
for(const type of ['mouse','touch','pen'])for(const rotation of [0,73,180])for(const zoom of [.6,2]){
 f.advance();p.analytics.markerPositions={};p.analytics.vehicles=true;p.rotation=rotation;p.lens=6;p.instTilt=5;w.S.zoom=zoom;w.S.pan={x:-23,y:91};
 const markers=f.markers();assert.equal(markers.length,2);
 for(const target of ['people','vehicles']){
  f.advance();const at=f.markers().find(m=>m.target===target),to={x:at.x+30,y:at.y-15};
  assert(f.pointer('pointerdown',at,type).defaultPrevented,`${target}: ${type}, rotation ${rotation}, zoom ${zoom}`);
  f.pointer('pointermove',to,type);f.pointer('pointerup',to,type);
  const pos=w.s2w(to.x,to.y);assert(Math.abs(p.analytics.markerPositions[target].x-pos.x)<1e-7);assert(Math.abs(p.analytics.markerPositions[target].y-pos.y)<1e-7);
 }
}
f.advance();at=f.markers()[0];let saved=stats.saves;assert(f.pointer('pointerdown',at,'touch').defaultPrevented);f.pointer('pointermove',{x:at.x+20,y:at.y+10},'touch');f.pointer('lostpointercapture',at,'touch');assert.equal(stats.saves,saved+1);f.pointer('pointerup',at,'touch');assert.equal(stats.saves,saved+1,'Losing capture finishes the drag exactly once');
for(const tool of ['meas','scale','geometry','scene','cable','nvr']){f.advance();w.S.tool=tool;const at=f.markers()[0],before=stats.undos.length;assert(!f.pointer('pointerdown',at).defaultPrevented);assert.equal(stats.undos.length,before);}
w.S.tool=null;w.SIGS_V6.currentStatus='ARCHIVED';f.advance();at=f.markers()[0];assert(!f.pointer('pointerdown',at).defaultPrevented);w.SIGS_V6.currentStatus='DRAFT';w.S.layers.cov=0;assert(!f.pointer('pointerdown',at).defaultPrevented,'Hidden coverage cannot capture input');w.S.layers.cov=1;
// A live thermal marker uses the thermal channel FOV, not the visible lens.
const thermal={id:'t',model:'DS-TEST',type:'thermal_bi',brand:'hikvision',thermalFov:30,thermalVerticalFov:22,thermalResW:640,thermalResH:512,thermalRange:120,thermalRangeBasis:'manufacturer-human-vca',visibleFov:90,range:50,analytics:{people:true,vehicles:false,channel:'thermal'}};
f.model(thermal);p.rotation=50;p.instTilt=3;p.analytics={people:true,vehicles:false,mode:'night'};f.advance();at=f.markers()[0];assert(at);assert(f.pointer('pointerdown',at,'touch').defaultPrevented);f.pointer('pointermove',{x:at.x+20,y:at.y+12},'touch');f.pointer('pointerup',{x:at.x+20,y:at.y+12},'touch');assert(p.analytics.markerPositions.people);
assert.match(read('assets/css/sigs.css'),/#maincv\s*\{[^}]*touch-action:\s*none/,'Touch policy is set before the gesture begins');
f.dom.window.close();console.log('PASS: screenshot marker, placement-mode dragging, mouse/touch/pen, drawn-position hit testing under optical zoom/rotation/pan, both targets, thermal channel, camera isolation, persistence/undo, tool/archive/hidden-layer guards and touch policy.');
