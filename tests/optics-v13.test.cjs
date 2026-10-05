const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {ground}=require('../assets/js/optics-v13.js');
const source=fs.readFileSync(require.resolve('../assets/js/block-03.js'),'utf8');
function fn(name){const start=source.indexOf('function '+name+'(');assert.ok(start>=0);const end=source.indexOf('\n}',start)+2;return source.slice(start,end);}
const nodes={};for(const id of ['plensv','pinfo','plensinfo','bs-ground','bs-reach','bs-hint'])nodes[id]={style:{}};
const pc={libId:'cam',instHeight:3,instTilt:30},dev={fov:90,range:30};let diagram;
const ctx={S:{selId:'cam'},MOD:'cctv',fP:()=>pc,gD:()=>dev,document:{getElementById:id=>nodes[id]},sigsGroundGeometry:ground,updateDoriPanel(){},render(){},_drawBlindSpotDiagram(...args){diagram=args;}};
vm.createContext(ctx);for(const name of ['lFOV','lRange','lDesc','_calcBlindSpot','updP'])vm.runInContext(fn(name),ctx);
ctx.updP('lens',2.8);const wideBlind=parseFloat(nodes['bs-ground'].textContent),wideHalf=diagram[3];
ctx.updP('lens',12);const teleBlind=parseFloat(nodes['bs-ground'].textContent);assert.ok(teleBlind>wideBlind);assert.ok(diagram[3]<wideHalf);assert.equal(pc.lens,12);assert.equal(nodes['bs-ground'].textContent,ground(3,30,ctx.lFOV(90,12)).blind.toFixed(2)+' m');assert.ok(nodes['bs-hint'].textContent.includes('16:9'));
assert.equal(ctx.lRange(30,12),30);assert.equal(ctx.lFOV(90,2.8),90);
const g=ground(3,30,90);assert.ok(Math.abs(ground(6,30,90).blind-g.blind*2)<1e-9);assert.ok(ground(3,45,90).blind<g.blind);assert.equal(ground(3,90,90).blind,0);assert.equal(ground(3,0,90).reach,Infinity);assert.ok(Number.isFinite(ground(3,0,90).blind));assert.equal(ground(3,10,90).reach,Infinity);assert.ok(Number.isFinite(ground(3,45,90).reach));
console.log('PASS: live focal updates panel and diagram; lens, height, tilt and horizon geometry; catalogue range unchanged.');
