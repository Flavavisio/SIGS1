const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const fixture=fs.readFileSync(require.resolve('./geometry-tools-v28.test.cjs'),'utf8').split('const click=')[0];
const sandbox={require,console};vm.createContext(sandbox);vm.runInContext(fixture+';globalThis.fixtureEnv=env;',sandbox);
const e=sandbox.fixtureEnv,nodes={},timers=[];
function node(){return {id:'',open:false,style:{},listeners:{},children:[],html:'',addEventListener(type,fn){this.listeners[type]=fn;},prepend(child){nodes[child.id]=child;this.children.unshift(child);},set innerHTML(html){this.html=html;this.children=[];for(const m of html.matchAll(/<button\s+([^>]+)>/g)){const b=node();b.dataset={};for(const a of m[1].matchAll(/data-([a-z-]+)="([^"]+)"/g))b.dataset[a[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=a[2];this.children.push(b);}if(html.includes('geometry-content'))this.content=node();if(html.includes('scene-content'))this.content=node();},get innerHTML(){return this.html;},querySelector(){return this.content;},querySelectorAll(selector){const key=selector.slice(6,-1).replace(/-([a-z])/g,(_,c)=>c.toUpperCase());return [...this.children,...(this.content?.children||[])].filter(b=>Object.hasOwn(b.dataset||{},key));}};}
nodes.lp=node();e.document.getElementById=id=>nodes[id]||null;e.document.createElement=()=>node();e.document.querySelector=()=>null;e.setTimeout=fn=>timers.push(fn);
e.SIGSSceneModel=require('../assets/js/scene-model-v29.js');
const original=e.FLOORS[0];e.FLOORS=[];
vm.runInContext(fs.readFileSync(require.resolve('../assets/js/site-geometry-v28.js'),'utf8'),e);
vm.runInContext(fs.readFileSync(require.resolve('../assets/js/scene-v29.js'),'utf8'),e);
timers.forEach(fn=>fn());
assert.match(nodes['scene-v29'].content.innerHTML,/Abre ou cria/);assert.match(nodes['geometry-v28'].content.innerHTML,/Abre ou cria/);
// The app may create/restore the floor after panels install; opening must populate working controls.
e.FLOORS=[original];e.ctx.translate=e.ctx.rotate=e.ctx.fillRect=e.ctx.strokeRect=e.ctx.arc=e.ctx.fillText=()=>{};
for(const id of ['scene-v29','geometry-v28']){nodes[id].open=true;nodes[id].listeners.toggle();}
const person=nodes['scene-v29'].content.children.find(b=>b.dataset.scene==='person');const car=nodes['scene-v29'].content.children.find(b=>b.dataset.scene==='car');assert(person&&car);
person.onclick();e.onClick({button:0,x:100,y:50});assert.equal(original.sceneTargets[0].kind,'person');
car.onclick();e.onClick({button:0,x:200,y:50});assert.equal(original.sceneTargets[1].kind,'car');
const wall=nodes['geometry-v28'].content.children.find(b=>b.dataset.geo==='wall');assert(wall);wall.onclick();e.onClick({button:0,x:20,y:20,detail:1});e.onClick({button:0,x:20,y:80,detail:2});assert.equal(original.obstacles.length,1);
// Reopening reflects changed floor contents, never retaining controls from the previous floor.
e.FLOORS=[{id:'f2',scale:original.scale,obstacles:[],sceneTargets:[]}];nodes['scene-v29'].listeners.toggle();assert(!nodes['scene-v29'].content.innerHTML.includes('Pessoa 1'));
console.log('PASS: panels installed before a project populate on opening; real buttons place person/car and complete walls; reopening reflects current floor.');
