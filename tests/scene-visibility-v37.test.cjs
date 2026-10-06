const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
global.SIGSSiteGeometry=require('../assets/js/site-geometry-model-v28.js');global.SIGSProposalOptics=require('../assets/js/proposal-optics-v27.js');const M=require('../assets/js/scene-model-v29.js');
const scale={ok:true,ppm:10},p={x:0,y:0,rotation:0,instHeight:4,instTilt:30,lens:2.8},d={type:'bullet',fov:94.4,range:30};
for(const kind of ['car','person']){const t={kind,x:0,y:-100,height:2};const vertices=M.mesh(t,10).flatMap(f=>f.vertices);assert(Math.abs(Math.max(...vertices.map(v=>v[1]))-2)<1e-10);assert(Math.abs(Math.min(...vertices.map(v=>v[1])))<1e-10);}
const original=JSON.stringify(p);const demo=M.demo(p,scale);assert.equal(JSON.stringify(p),original);assert.equal(demo.obstacles.length,0);
for(const target of demo.sceneTargets){const a=M.assessment(target,p,d,demo);assert(a.visibleSamples>0);assert.equal(a.visibleSamples,a.framedSamples);}
const low=M.demo(p,scale,'low'),high=M.demo(p,scale,'high'),side=M.demo(p,scale,'side');const person=demo.sceneTargets[0];
const partial=M.assessment(person,p,d,low);assert(partial.visibleSamples>0);assert(partial.visibleSamples<partial.framedSamples);assert.match(partial.status,/Parcialmente oculto/);
assert.equal(M.assessment(person,p,d,high).visibleSamples,0);
assert.equal(M.assessment(person,p,d,side).visibleSamples,M.assessment(person,p,d,demo).visibleSamples);
assert.equal(M.wallSegments(low.obstacles,20)[0].height,1.8,'Own wall height overrides floor default');
const rotated=M.demo({...p,rotation:90},scale);assert.equal(rotated.sceneTargets[0].x,80);assert(Math.abs(rotated.sceneTargets[0].y+15)<1e-10);
function faces(f){return [...f.sceneTargets.flatMap(t=>M.mesh(t,scale.ppm)),...M.wallSegments(f.obstacles).map(({a,b,height})=>({vertices:[[a.x/10,0,a.y/10],[b.x/10,0,b.y/10],[b.x/10,height,b.y/10],[a.x/10,height,a.y/10]],color:'#7e909f'}))];}
const c=M.camera(p,d,scale),base=M.rasterize(faces(demo),c,320,180),blocked=M.rasterize(faces(high),c,320,180),unaffected=M.rasterize(faces(side),c,320,180);assert.deepEqual(base,unaffected);assert.notDeepEqual(base,blocked);
// Exercise actual drawing handlers and coverage clip while a wall is being created.
const fixture=fs.readFileSync(require.resolve('./geometry-tools-v28.test.cjs'),'utf8').split('const click=')[0];const sandbox={require,console};vm.createContext(sandbox);vm.runInContext(fixture+';globalThis.fixtureEnv=env;',sandbox);const e=sandbox.fixtureEnv;e.ctx.clip=()=>{clips++};let clips=0;const cam={...p,rotation:90};const dev={type:'dome',fov:90,range:30};
e.SIGSGeometryTools.start('wall');e.onClick({x:-50,y:-50,button:0,detail:1});e.onClick({x:-50,y:50,button:0,detail:1});e.drawCov(cam,dev);assert.equal(clips,0,'An unfinished wall behind the camera must not clip coverage');e.SIGSGeometryTools.finish();e.drawCov(cam,dev);assert.equal(clips,0,'Finishing a wall behind the camera must not clip coverage');
e.SIGSGeometryTools.start('wall');e.onClick({x:50,y:-50,button:0,detail:1});e.onClick({x:50,y:50,button:0,detail:1});e.drawCov(cam,dev);assert.equal(clips,1,'Draft wall must preview its FOV effect before commit');e.SIGSGeometryTools.cancel();e.drawCov(cam,dev);assert.equal(clips,1,'Cancel removes draft clipping');
e.SIGSGeometryTools.start('wall');e.onClick({x:50,y:-50,button:0,detail:1});e.onClick({x:50,y:50,button:0,detail:1});e.SIGSGeometryTools.finish();assert.equal(e.FLOORS[0].obstacles.at(-1).height,2.7);e.drawCov(cam,dev);assert.equal(clips,2);
e.SIGSSceneModel=M;vm.runInContext(fs.readFileSync(require.resolve('../assets/js/scene-v29.js'),'utf8'),e);e.FLOORS[0].scene3d={wallHeight:1.2};const saved=e.snapShot();e.FLOORS[0].scene3d.wallHeight=4;e.applySnap(saved);assert.equal(e.FLOORS[0].scene3d.wallHeight,1.2);
console.log('PASS: mesh dimensions, individual wall heights, partial/full 3D visibility, real rendering, harmless lateral walls, draft FOV preview/cancel, persisted height and undo.');
