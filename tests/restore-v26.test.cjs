const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../assets/js/block-03.js'),'utf8');const start=source.indexOf('function _restoreProjectData(d)'),fn=source.slice(start,source.indexOf('\n}',start)+2);const images=[];
class Image{constructor(){images.push(this);}set src(v){this.url=v;}}
const ctx={MOD:'cctv',S:{scale:{}},FLOORS:[],FLOOR_CUR:0,Image,uid:()=>1,document:{getElementById:()=>({})},renderFloorBar(){},renderDevList(){},deselect(){},render(){},updateStats(){}};vm.createContext(ctx);vm.runInContext(fn,ctx);
function data(name){const fp={imgData:'data:'+name,x:1,y:2,w:100,h:50,locked:true,opa:1};return {module:'cctv',fp,floors:[{fp,placed:[]}],scale:{ok:true,ppm:10},placed:[]};}
const first=data('A');ctx._restoreProjectData(first);assert.equal(ctx.S.fp.img,null);assert.equal(ctx.S.fp.imgData,'data:A');assert.equal(ctx.S.fp.locked,true);
// A budget refresh saving the floor before the image loads must retain its metadata.
ctx.FLOORS[0].fp={...ctx.S.fp};assert.equal(ctx.FLOORS[0].fp.imgData,'data:A');
ctx._restoreProjectData(data('B'));images[0].onload();assert.equal(ctx.S.fp.imgData,'data:B');assert.equal(ctx.S.fp.img,null);images[1].onload();assert.equal(ctx.S.fp.img,images[1]);assert.equal(ctx.S.fp.locked,true);
const stored={module:'cctv',floors:[{fp:{storagePath:'company/project/plan',w:200,h:100,locked:true},placed:[]}],placed:[]};ctx._restoreProjectData(stored);assert.equal(ctx.S.fp.storagePath,'company/project/plan');assert.equal(ctx.S.fp.locked,true);
console.log('PASS: plan metadata survives restore while images load; stale image callbacks cannot replace the current scenario.');
