const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const M=require('../assets/js/lens-model-v45.js');
const fixed={type:'bullet',name:'Bullet 6mm',fov:65,range:30},vf={type:'dome',name:'Varifocal',lensMin:2.8,lensMax:12,fov:100,range:50},ptz={type:'ptz',lensMin:4.8,lensMax:120,baseLens:4.8,fov:60,range:100};
assert(!M.policy(fixed).adjustable);assert.equal(M.effective({lens:12},fixed),6);assert.equal(M.policy(fixed).base,6);
assert(M.policy(vf).adjustable);assert.equal(M.effective({lens:99},vf),12);assert.equal(M.effective({lens:1},vf),2.8);
assert.equal(M.policy(ptz).max,120);assert.equal(M.effective({lens:120},ptz),120);
assert(M.policy({name:'Lente motorizada 2,7–13,5 mm'}).adjustable);assert.equal(M.policy({name:'Lente motorizada 2,7–13,5 mm'}).max,13.5);
assert(!M.policy({type:'ptz',lensType:'fixed',focalLength:4}).adjustable,'Explicit fixed metadata wins over type/name');
assert(!M.policy({name:'Speed Dome'}).documented);assert(M.policy({name:'Speed Dome'}).label.includes('por confirmar'));
assert(!M.policy({name:'Fisheye 1.4mm',type:'fisheye'}).adjustable);
// Run the actual property panel and input handler, including camera selection transitions.
const source=fs.readFileSync('assets/js/block-03.js','utf8');function fn(n){const s=source.indexOf('function '+n+'(');return source.slice(s,source.indexOf('\n}',s)+2);}
const nodes={};function node(id){return nodes[id]||(nodes[id]={style:{},setAttribute(k,v){this[k]=v;}});}
let p={libId:'fixed',lens:12,rotation:0},d=fixed,rendered=0;const c={SIGSLensModel:M,MOD:'cctv',S:{selId:'x'},document:{getElementById:node},fP:()=>p,gD:()=>d,render:()=>rendered++,updateDoriPanel(){},_calcBlindSpot(){},lDesc:()=>''};c.window=c;vm.createContext(c);for(const n of ['lFOV','lRange','syncP','updP'])vm.runInContext(fn(n),c);
c.syncP();assert(nodes.plens.disabled);assert.equal(nodes.plens.value,6);assert(nodes.plensinfo.textContent.includes('bloqueado'));c.updP('lens',8);assert.equal(p.lens,12,'Fixed lens update must be rejected without altering the saved project');assert.equal(rendered,0);
p={libId:'vf',lens:2.8};d=vf;c.syncP();assert(!nodes.plens.disabled);assert.equal(nodes.plens.max,12);c.updP('lens',8);assert.equal(p.lens,8);assert(nodes.pinfo.textContent.includes('FOV:'));c.updP('lens',999);assert.equal(p.lens,12);c.updP('lens',NaN);assert.equal(p.lens,12);
d=ptz;p={libId:'ptz',lens:4.8};c.syncP();assert(!nodes.plens.disabled);assert.equal(nodes.plens.max,120);c.updP('lens',120);assert.equal(p.lens,120);
d=fixed;c.syncP();assert(nodes.plens.disabled,'Switching back must lock the control');
global.SIGSLensModel=M;const O=require('../assets/js/proposal-optics-v27.js');assert.equal(O.capture({lens:12},fixed).fov,65);assert(O.capture({lens:12},vf).fov<O.capture({lens:2.8},vf).fov);assert(O.capture({lens:120},ptz).fov<O.capture({lens:4.8},ptz).fov);assert(Math.abs(O.capture({lens:4.8},ptz).fov-60)<1e-9);
console.log('PASS: fixed, varifocal, motorized and PTZ policies; documented limits; camera selection locking; update rejection/clamping; unchanged saved fixed values; shared FOV consistency.');
