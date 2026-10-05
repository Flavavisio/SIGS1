const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('assets/js/block-03.js','utf8');
const fn=source.slice(source.indexOf('function buildSystemTab(){'),source.indexOf('function buildNetworkDiagram(cams){'));
const nodes={};
for(const id of ['cctv-system-content','specialty-system-summary'])nodes[id]={style:{},innerHTML:''};
let networkCalls=0,poeCalls=0;
const context={
 MOD:'alarm',saveCurrentFloor(){},FLOORS:[{placed:[{libId:'hub'},{libId:'detector'}]}],
 gD(id){return {type:id};},document:{getElementById(id){return nodes[id]||null;}},
 buildNetworkDiagram(){networkCalls++;},buildPoESection(){poeCalls++;},
 NVR_POS:null,S:{scale:{ok:false}}
};
vm.createContext(context);vm.runInContext(fn,context);
context.buildSystemTab();
assert.equal(networkCalls,0);assert.equal(poeCalls,0);
assert.equal(nodes['cctv-system-content'].style.display,'none');
assert.match(nodes['specialty-system-summary'].innerHTML,/1 central · 2 equipamentos/);
context.MOD='fire';context.FLOORS=[{placed:[{libId:'fire_central'},{libId:'smoke'}]}];
context.buildSystemTab();
assert.match(nodes['specialty-system-summary'].innerHTML,/Sistema de incêndio/);
assert.equal(networkCalls,0);
context.MOD='cctv';context.FLOORS=[{placed:[]}];context.buildSystemTab();
assert.equal(nodes['cctv-system-content'].style.display,'flex');
assert.equal(nodes['specialty-system-summary'].style.display,'none');
assert.equal(networkCalls,1);assert.equal(poeCalls,1);
context.MOD='alarm';context.FLOORS=[{placed:[]}];context.buildSystemTab();
assert.match(nodes['specialty-system-summary'].innerHTML,/Coloca uma central/);
assert.equal(networkCalls,1);
console.log('PASS: alarm/fire skip CCTV calculations, count centrals and devices, empty guidance and switching back to CCTV.');
