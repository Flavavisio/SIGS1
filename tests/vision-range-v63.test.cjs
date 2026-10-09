const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{createCanvas}=require('@napi-rs/canvas');
const canvas=createCanvas(1000,1000),ctx=canvas.getContext('2d'),source=fs.readFileSync('assets/js/block-03.js','utf8');
const env={console,Math,Number,MOD:'cctv',S:{scale:{ok:true,ppm:2},zoom:1},ctx,cv:canvas,w2s:()=>({x:500,y:500}),SIGSImageProfile:()=>env.profile,profile:'2025',hr:()=> 'rgba(40,120,230,.4)',doriCalc:()=>({i:0,r:0,o:0,d:0})};env.window=env;vm.createContext(env);
for(const file of ['optics-v13','lens-model-v45','engineering-model-v39','proposal-optics-v27','engineering-advanced-model-v43'])vm.runInContext(fs.readFileSync('assets/js/'+file+'.js','utf8'),env);
for(const name of ['sigsClipBlind','lFOV','lRange','drawCov']){const a=source.indexOf('function '+name+'('),b=source.indexOf('\n}',a)+2;vm.runInContext(name==='lRange'?source.slice(a,source.indexOf('\n',a)):source.slice(a,b),env);}
const d={type:'bullet',fov:90,range:30,mp:4,lensMin:2.8,lensMax:12,color:'#3869e8'},p={x:0,y:0,rotation:0,instHeight:3,instTilt:0,lens:2.8};
const wide=env.SIGSProposalOptics.capture(p,d),tele=env.SIGSProposalOptics.capture({...p,lens:6},d);
assert(Math.abs(wide.range-67.2)<1e-8);assert(Math.abs(tele.range-wide.range*6/2.8)<1e-8);assert.equal(tele.illuminationRange,30);
assert(Math.abs(tele.range-env.SIGSAdvancedModel.distances({...p,lens:6},d,'2025').at(-1).distance)<1e-8);
assert.equal(env.lRange(d.range,6,p,d),tele.range);
env.drawCov(p,d);assert.equal(ctx.getImageData(500,300,1,1).data[3],0,'100m lies beyond wide-angle overview');ctx.clearRect(0,0,1000,1000);
env.drawCov({...p,lens:6},d);assert(ctx.getImageData(500,300,1,1).data[3]>0,'Focal increase extends visible coverage beyond IR range');ctx.clearRect(0,0,1000,1000);
env.drawCov({...p,lens:6,instTilt:60},d);assert.equal(ctx.getImageData(500,300,1,1).data[3],0,'Ground reach still clips the extended vision');
env.profile='2014';const old=env.SIGSProposalOptics.capture({...p,lens:6},d);assert(Math.abs(old.range-tele.range*.8)<1e-8);assert.equal(old.illuminationRange,30);
assert(env.SIGSProposalOptics.capture({...p,lens:6,mp:8},d).range>old.range);
assert.equal(env.SIGSProposalOptics.capture(p,{...d,type:'fisheye'}).range,30);
assert.equal(env.SIGSProposalOptics.capture(p,{...d,type:'thermal_bi',visibleRange:45}).range,45);
const snapshot={...p,...tele};const svg=env.SIGSProposalOptics.sector(snapshot,2,[]),m=svg.match(/d="M0 0 L([^ ]+) ([^ ]+)/);assert(m);assert(Math.abs(Math.hypot(+m[1],+m[2])-tele.range*2)<1e-8);
console.log('PASS: 2025 overview / 2014 detection range, focal and resolution response, actual canvas extent beyond IR, ground clipping and export parity.');
