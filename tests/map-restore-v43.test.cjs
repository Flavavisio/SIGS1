const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const base=fs.readFileSync(require.resolve('../assets/js/block-03.js'),'utf8');
function extract(source,name){const start=source.indexOf('function '+name+'(');assert.ok(start>=0);return source.slice(start,source.indexOf('\n}',start)+2);}
assert.ok(!extract(base,'startModule').includes('openMap()'),'module startup must not open a live map over a saved capture');
const images=[],node={};class Image{constructor(){images.push(this);}set src(s){this.source=s;}}
const ctx={S:{scale:{}},MOD:'cctv',FLOORS:[],FLOOR_CUR:0,Image,document:{getElementById:()=>node},closeMap(){ctx.S.mapOpen=false;},renderFloorBar(){},renderDevList(){},deselect(){},render(){},updateStats(){},updateUndoUI(){},fitView(){},sigsSetPlantLocked(v){ctx.lock=v;},uid:()=>1};vm.createContext(ctx);
vm.runInContext(extract(base,'_restoreProjectData'),ctx);vm.runInContext(extract(base,'loadFloor'),ctx);
const fp=n=>({imgData:'data:'+n,w:400,h:250,x:-200,y:-125,locked:true});
const floors=[{fp:fp('A'),placed:[],meas:[],scale:{ok:true,ppm:12.3,mpp:1/12.3}},{fp:fp('B'),placed:[],meas:[],scale:{ok:true,ppm:8,mpp:.125}}];
ctx.S.mapOpen=true;ctx._restoreProjectData({module:'cctv',floors,floorCur:1,fp:fp('stale'),scale:floors[1].scale});images.at(-1).onload();assert.equal(ctx.S.mapOpen,false);assert.equal(ctx.S.fp.imgData,'data:B');assert.equal(ctx.S.scale.ppm,8);assert.equal(ctx.lock,true);
ctx.FLOOR_CUR=0;ctx.loadFloor(0);const old=images.at(-1);ctx.FLOOR_CUR=1;ctx.loadFloor(1);old.onload();assert.equal(ctx.S.fp.imgData,'data:B');images.at(-1).onload();assert.equal(ctx.S.fp.img,images.at(-1));
// Storage URLs and image callbacks must retain the same project/floor context.
const storage=fs.readFileSync(require.resolve('../assets/js/engineering-v7.js'),'utf8');ctx.floor=()=>ctx.FLOORS[ctx.FLOOR_CUR];ctx.cv={width:800,height:600};ctx.notifyV7=()=>{};ctx.dirty=0;ctx.sigsV6MarkDirty=()=>ctx.dirty++;
vm.runInContext('function loadContext(){return {floor:floor(),id:S.floorPlanLoadId,fp:S.fp};}\nfunction isCurrent(c){return !c||(floor()===c.floor&&S.floorPlanLoadId===c.id&&S.fp===c.fp);}',ctx);
vm.runInContext(extract(storage,'setFloorImage'),ctx);
const context=ctx.loadContext();ctx.setFloorImage('signed-old',{storagePath:'old',w:400,h:250},true,context,true);const late=images.at(-1);ctx._restoreProjectData({module:'cctv',floors:[{...floors[0],fp:fp('C')}],scale:floors[0].scale});late.onload();assert.equal(ctx.S.fp.imgData,'data:C');
ctx.setFloorImage('signed-current',{storagePath:'current',w:400,h:250,locked:true},true,ctx.loadContext(),true);images.at(-1).onload();assert.equal(ctx.S.fp.storagePath,'current');assert.equal(ctx.dirty,0);assert.equal(ctx.lock,true);
console.log('PASS: saved capture wins over live map/stale metadata; floor/project image races and Storage restore remain isolated and clean.');
