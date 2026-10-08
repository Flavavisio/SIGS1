const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync(require.resolve('../assets/js/maplibre-v56.js'),'utf8');
const dom=new JSDOM('<body><div id="mapwrap"></div><button id="mapbtn"></button><div id="leafmap"></div><input id="mapsrch"><button id="sigs-map-names"></button><div id="sigs-map-status"></div><div id="scbadge"></div></body>',{runScripts:'outside-only'});
const w=dom.window,images=[],requests=[],messages=[];let resizeCallback,canvasDraw;
Object.defineProperties(w.document.getElementById('leafmap'),{clientWidth:{value:900},clientHeight:{value:600}});
const ctx={drawImage(...args){canvasDraw=args;},measureText:t=>({width:t.length*5}),fillRect(){},fillText(){}};
w.HTMLCanvasElement.prototype.getContext=()=>ctx;w.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/jpeg;base64,test';
class Map{constructor(options){this.options=options;this.center={lat:38.87,lng:-9.07};this.zoom=17.25;this.ready=true;this.bearing=0;this.pitch=0;this.handlers={};this.touchZoomRotate={disableRotation(){}};this.canvas=w.document.createElement('canvas');this.canvas.width=1800;this.canvas.height=1200;this.canvas.style.width='900px';this.canvas.style.height='600px';}addControl(){}on(n,f){this.handlers[n]=f;}resize(){this.resizes=(this.resizes||0)+1;}getCanvas(){return this.canvas;}isStyleLoaded(){return this.ready;}areTilesLoaded(){return this.ready;}isMoving(){return false;}getPitch(){return this.pitch;}getBearing(){return this.bearing;}getCenter(){return this.center;}getZoom(){return this.zoom;}setLayoutProperty(id,key,value){this.lastVisibility=value;}jumpTo(opts){this.jumped=opts;}remove(){this.removed=true;}}
class Marker{setLngLat(p){this.point=p;return this;}addTo(map){map.marker=this;return this;}remove(){this.removed=true;}}
w.maplibregl={Map,Marker,NavigationControl:class{},ScaleControl:class{},AttributionControl:class{}};
w.ResizeObserver=class{constructor(fn){resizeCallback=fn;}observe(){}};
w.Image=class{constructor(){images.push(this);}set src(v){this.data=v;}};
w.S={fp:null};w.FLOORS=[{}];w.FLOOR_CUR=0;let fallback=0;
w.openMap=()=>fallback++;w.closeMap=()=>{w.S.mapOpen=false;w.document.getElementById('mapwrap').classList.remove('show');};w.doSearch=()=>{};w.captureMapTiles=()=>{};w._applyMapLock=()=>{};
w.notify=t=>messages.push(t);w.sigsSetPlantLocked=b=>{w.S.mapLocked=b;w.S.fp.locked=b;};w.fitView=()=>{};w.updateStats=()=>{};w.requestAnimationFrame=f=>f();w.fetch=()=>new Promise(resolve=>requests.push(resolve));
vm.runInContext(source,dom.getInternalVMContext());
(async()=>{
  w.openMap();const map=w.S.mlmap;assert.equal(map.options.canvasContextAttributes.preserveDrawingBuffer,true);assert.equal(map.options.dragRotate,false);assert.equal(fallback,0);
  const priorSize=map.resizes||0;resizeCallback();assert.equal(map.resizes,priorSize+1,'map resizes when the layout/focus area changes');
  for(const lat of [0,38.87,70])for(const z of [13,17.25,18])assert.ok(Math.abs(w.SIGSMapV56.metersPerPixel(lat,z)/(156543.03392804097*Math.cos(lat*Math.PI/180)/2**(z+1))-1)<1e-12,'MapLibre 512px world scale equals Leaflet at one zoom higher');
  map.ready=false;w.captureMapTiles();assert.equal(images.length,0);map.ready=true;
  w.captureMapTiles();assert.deepEqual(canvasDraw.slice(1),[0,0,900,600],'DPR=2 source is resized to CSS pixels, so saved scale matches capture geometry');
  images.at(-1).onload();assert.equal(w.S.fp.w,900);assert.equal(w.S.fp.h,600);assert.equal(w.S.fp.locked,true);assert.equal(w.S.mapOpen,false);assert.ok(Math.abs(w.S.scale.ppm*w.S.scale.mpp-1)<1e-12);
  w.openMap();const saved=w.S.fp;w.sigsMapToggleNames();assert.equal(map.lastVisibility,'none');
  w.captureMapTiles();w.closeMap();w.openMap();images.at(-1).onload();assert.equal(w.S.fp,saved,'a delayed capture cannot overwrite a reopened viewer');
  w.captureMapTiles();w.FLOOR_CUR=1;images.at(-1).onload();assert.equal(w.S.fp,saved,'a delayed capture cannot overwrite another floor');
  w.document.getElementById('mapsrch').value='Vialonga';w.doSearch();w.document.getElementById('mapsrch').value='Cascais';w.doSearch();
  requests[1]({ok:true,json:async()=>[{lat:'38.7',lon:'-9.4',display_name:'Cascais'}]});await new Promise(r=>setImmediate(r));assert.deepEqual(Array.from(map.jumped.center),[-9.4,38.7]);
  requests[0]({ok:true,json:async()=>[{lat:'38.87',lon:'-9.07',display_name:'Vialonga'}]});await new Promise(r=>setImmediate(r));assert.deepEqual(Array.from(map.jumped.center),[-9.4,38.7],'late search does not override newer search');
  w.closeMap();w.document.getElementById('mapsrch').value='Vialonga';w.doSearch();w.closeMap();requests[2]({ok:true,json:async()=>[{lat:'38.87',lon:'-9.07',display_name:'Vialonga'}]});await new Promise(r=>setImmediate(r));assert.deepEqual(Array.from(map.jumped.center),[-9.4,38.7]);
  console.log('PASS MapLibre: CSS-pixel geometry/scale, capture readiness/lock, focus resize, names toggle, floor/view capture races and stale search protection.');dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1;dom.window.close();});
