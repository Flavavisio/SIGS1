const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const geometry=require('../assets/js/site-geometry-model-v28.js');global.SIGSSiteGeometry=geometry;
global.SIGSProposalOptics=require('../assets/js/proposal-optics-v27.js');const scene=require('../assets/js/scene-model-v29.js');
// Execute the real canvas renderer, rather than duplicate its angle calculation.
const source=fs.readFileSync('assets/js/block-03.js','utf8'),start=source.indexOf('function sigsClipBlind('),end=source.indexOf('function drawIcon(',start);let rotation=0,arcs=[],stack=[];
const ctx={save(){stack.push(rotation)},restore(){rotation=stack.pop()},translate(){},rotate(a){rotation+=a},beginPath(){},moveTo(){},arc(x,y,r,a,b){if(b-a<6)arcs.push((a+b)/2+rotation)},closePath(){},fill(){},stroke(){},setLineDash(){},fillText(){}};
const env={ctx,MOD:'cctv',S:{scale:{ok:false,ppm:10},zoom:1},w2s:(x,y)=>({x,y}),lFOV:b=>b,lRange:b=>b,hr:()=>'',sigsGroundGeometry:()=>({blind:0}),doriCalc:()=>({i:0,r:0,o:0,d:0})};vm.createContext(env);vm.runInContext(source.slice(start,end),env);
for(const angle of [0,45,90,180,270])for(const type of ['bullet','thermal_bi']){rotation=0;arcs=[];const p={x:0,y:0,rotation:angle,lens:2.8},d={type,fov:60,range:30,thermalFov:60,thermalRange:30,visibleFov:60,visibleRange:30};env.drawCov(p,d);assert(arcs.length);for(const a of arcs){assert(Math.abs(Math.atan2(Math.sin(a-(angle-90)*Math.PI/180),Math.cos(a-(angle-90)*Math.PI/180)))<1e-9,'Canvas FOV, wall rays and 3D must face the same direction');}}
const p={x:0,y:0,rotation:90,fov:60,range:30};
const behind={points:[{x:-5,y:-100},{x:-5,y:100}]},outside={points:[{x:5,y:50},{x:20,y:50}]};
for(const wall of [behind,outside]){const rays=geometry.coverage(p,10,[wall]).slice(1);assert(rays.every(v=>Math.abs(Math.hypot(v.x,v.y)-300)<1e-7),'A wall outside the FOV must not shorten any ray');}
const scale={ok:true,ppm:10},cam={...p,instHeight:3,instTilt:15},target={kind:'person',x:100,y:0},floor={scale,obstacles:[{points:[{x:50,y:-30},{x:50,y:30}]}]};
assert.equal(scene.assessment(target,cam,{type:'bullet',fov:60},floor,2.7).blocked,true);
assert.equal(scene.assessment(target,cam,{type:'bullet',fov:60},floor,1).blocked,false,'A low wall must not occlude a ray above its top');
assert.equal(scene.assessment(target,cam,{type:'bullet',fov:60},{scale,obstacles:[behind]},2.7).blocked,false);
// Sloping overlapping surfaces defeat average-depth sorting. Visibility must be
// independent of draw order and select the nearest surface at each sample.
const c={x:0,z:0,height:0,hfov:90,right:[1,0,0],up:[0,1,0],forward:[0,0,1]};
const crossing={vertices:[[-2,-2,2],[12,-12,12],[12,12,12],[-2,2,2]],color:'#ff0000'},flat={vertices:[[-5,-5,5],[5,-5,5],[5,5,5],[-5,5,5]],color:'#00ff00'};
const a=scene.rasterize([crossing,flat],c,80,80),b=scene.rasterize([flat,crossing],c,80,80);assert.deepEqual(a,b);const color=x=>Array.from(a.slice((40*80+x)*4,(40*80+x)*4+3));assert.deepEqual(color(10),[255,0,0]);assert.deepEqual(color(70),[0,255,0]);
console.log('PASS: real canvas FOV alignment, unaffected walls behind/outside cone, 3D wall height and per-pixel depth independent of draw order.');
