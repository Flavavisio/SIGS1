const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../assets/js/block-03.js'),'utf8');
function fn(name){const start=source.indexOf('function '+name+'(');assert(start>=0);return source.slice(start,source.indexOf('\n}',start)+2);}
const nodes={fplock:{},maplockbtn:{style:{}},scbadge:{},leafmap:{clientWidth:600,clientHeight:400,getBoundingClientRect:()=>({left:0,top:0}),querySelectorAll:()=>[{complete:true,naturalWidth:256,src:'tile',getBoundingClientRect:()=>({left:0,top:0,width:256,height:256})}]}},messages=[];let fail=false,draws=0,closed=0;
class Image {constructor(){this.width=600;this.height=400;}set src(v){this._src=v;if(fail&&v==='tile')this.onerror?.();else this.onload?.();}get src(){return this._src;}}
const canvas={getContext:()=>({fillRect(){},drawImage(){draws++;}}),toDataURL:()=> 'data:image/jpeg;base64,abc'};
const handlers=Object.fromEntries(['dragging','scrollWheelZoom','doubleClickZoom','touchZoom','keyboard','boxZoom'].map(k=>[k,{enabled:true,disable(){this.enabled=false;},enable(){this.enabled=true;}}]));
const ctx={S:{lmap:{...handlers,getZoom:()=>18,getCenter:()=>({lat:40})}},document:{getElementById:id=>nodes[id],createElement:()=>canvas,querySelector:()=>null,querySelectorAll:()=>[]},Image,notify:v=>messages.push(v),closeMap(){closed++;},fitView(){},updateStats(){}};vm.createContext(ctx);for(const name of ['_applyMapLock','sigsSetPlantLocked','toggleMapLock','captureMapTiles'])vm.runInContext(fn(name),ctx);
ctx.captureMapTiles();assert.equal(draws,1);assert.equal(closed,1);assert.equal(ctx.S.fp.locked,true);assert.equal(ctx.S.mapLocked,true);assert.equal(nodes.fplock.checked,true);assert.equal(handlers.dragging.enabled,false);assert(Math.abs(ctx.S.scale.ppm-1/(156543.03392*Math.cos(40*Math.PI/180)/2**18))<1e-10);
ctx.toggleMapLock();assert.equal(ctx.S.fp.locked,false);assert.equal(handlers.dragging.enabled,true);ctx.toggleMapLock();assert.equal(ctx.S.fp.locked,true);
const fp=ctx.S.fp;fail=true;ctx.captureMapTiles();assert.equal(ctx.S.fp,fp);assert.equal(closed,1);assert(messages.some(x=>x.includes('Não foi possível capturar')));
nodes.leafmap.clientWidth=0;fail=false;ctx.captureMapTiles();assert.equal(ctx.S.fp,fp);assert.equal(closed,1);
console.log('PASS: real capture function with cached images, automatic scale and lock, explicit unlock, failed tiles and hidden-map protection.');
