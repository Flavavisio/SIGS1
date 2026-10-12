const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),{createCanvas}=require('@napi-rs/canvas');
const dom=new JSDOM(fs.readFileSync('app-Sigs.html','utf8'),{url:'https://sigs.test',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;
// Retain the same context across HTML canvas resizes, as a real browser does.
for(const key of ['width','height']){
 const prop=Object.getOwnPropertyDescriptor(w.HTMLCanvasElement.prototype,key);
 Object.defineProperty(w.HTMLCanvasElement.prototype,key,{get:prop.get,set(value){prop.set.call(this,value);if(this.native)this.native[key]=this[key];}});
}
w.HTMLCanvasElement.prototype.getContext=function(){if(!this.native)this.native=createCanvas(this.width,this.height);return this.native.getContext('2d');};
w.fetch=async()=>({ok:true,json:async()=>[],text:async()=>''});
Object.defineProperties(w.document.getElementById('cw'),{clientWidth:{value:1600},clientHeight:{value:1400}});
for(const file of ['assets/js/block-01.js','assets/js/block-02.js','assets/data/equipment-catalog.js','assets/data/uniview-cctv-v91.js','assets/data/hikvision-cctv-v92.js','assets/js/optics-v13.js','assets/js/lens-model-v45.js','assets/js/engineering-model-v39.js','assets/js/proposal-optics-v27.js','assets/js/block-03.js','assets/js/camera-fov-v108.js','assets/js/ptz-coverage-v109.js'])w.eval(fs.readFileSync(file,'utf8'));
const models=[w.CCTV_LIB.find(d=>d.id==='uv22'),w.SIGSHikvisionCCTV92.rows.find(d=>d.model==='DS-2DE4425IWG1-E'),w.SIGSUniviewCCTV91.rows.find(d=>d.model==='TIC7626EL-GAF75-4X56-VH1')];
let cases=0;
for(const d of models){
 assert(d);assert(w.SIGSPTZOverview.isPTZ(d),d.model+' must show potential pan coverage');
 w.S.lib=[d];const q=w.SIGSLensModel.policy(d);
 for(const calibrated of [false,true])for(const lens of [q.initial,q.max]){
  const p={id:'camera',libId:d.id,label:'CAM01',x:0,y:0,lens,rotation:0,instHeight:5,instTilt:30,opacity:.22,color:d.color};
  w.S.placed=[p];w.S.selId=null;w.S.scale={ok:calibrated,ppm:20};w.S.zoom=.8;w.S.layers={cov:1,dev:1,fp:0,meas:0,grid:0};
  const g=w.SIGSPTZOverview.geometry(p,d);assert(g,d.model+' '+lens+' '+calibrated);
  w.render();
  // Sample behind the camera, outside both forward cones and the equipment icon.
  const distance=calibrated?(g.radius+g.blind)/2:Math.min(350,g.radius*.7),offset=distance/Math.sqrt(2);
  const pixel=w.ctx.getImageData(Math.round(g.center.x-offset),Math.round(g.center.y+offset),1,1).data;
  assert(pixel[3]>0,`Missing native 360° pixels: ${d.model}, focal ${lens}, scale ${calibrated}`);
  w.S.layers.cov=0;w.render();assert.equal(w.ctx.getImageData(Math.round(g.center.x-offset),Math.round(g.center.y+offset),1,1).data[3],0,'Coverage toggle hides the potential circle too');
  cases++;
 }
}
const stationary={...models[2],name:'Thermal fixed camera',model:'STATIC',lensType:'fixed',fixedLens:true,lensMin:6,lensMax:6};assert(!w.SIGSPTZOverview.isPTZ(stationary),'Static thermal cameras do not gain PTZ coverage');
dom.window.close();console.log(`PASS: actual complete canvas renderer, ${cases} real Hikvision/Uniview/thermal speed-dome cases, calibrated/unscaled plans, optical wide/tele and coverage toggle.`);
