const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(require.resolve('../assets/js/block-03.js'),'utf8');
const draw=src.slice(src.indexOf('function drawCov('),src.indexOf('function _drawSector('));
for(const fov of [60,90,120,360])for(const rotation of [0,45,90,180,270,359])for(const zoom of [.5,2]){
 let t={x:0,y:0,a:0},stack=[],labels=[];
 const ctx={save(){stack.push({...t});},restore(){t=stack.pop();},translate(x,y){t.x+=Math.cos(t.a)*x-Math.sin(t.a)*y;t.y+=Math.sin(t.a)*x+Math.cos(t.a)*y;},rotate(a){t.a+=a;},fillText(text,x,y){labels.push({text,x:t.x+Math.cos(t.a)*x-Math.sin(t.a)*y,y:t.y+Math.sin(t.a)*x+Math.cos(t.a)*y,a:t.a});}};
 for(const k of ['setLineDash','beginPath','arc','fill','stroke','moveTo','closePath'])ctx[k]=()=>{};
 const env={ctx,MOD:'cctv',S:{scale:{ok:true,ppm:10},zoom},w2s:()=>({x:100,y:200}),lFOV:()=>fov,lRange:()=>40,hr:()=>'',doriCalc:()=>({i:4,r:8,o:16,d:32})};env.window=env;vm.createContext(env);vm.runInContext(draw,env);
 env.drawCov({x:0,y:0,rotation,lens:2.8,instTilt:-1},{type:'bullet',fov,range:40});
 assert.equal(labels.length,4);
 labels.forEach((p,i)=>{const a=(fov>=355?-90:-90-fov/4)*Math.PI/180+rotation*Math.PI/180,r=[4,8,16,32][i]*10*zoom;assert(Math.abs(p.x-(100+Math.cos(a)*r+2))<1e-8);assert(Math.abs(p.y-(200+Math.sin(a)*r-2))<1e-8);assert(Math.abs(p.a)<1e-8,'Text stays upright');});
}
console.log('PASS: DORI anchors follow camera rotation at 6 angles, 4 FOVs and 2 zoom levels; text stays upright.');
