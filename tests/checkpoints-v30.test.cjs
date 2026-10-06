const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const nodes={},timeouts=new Map(),listeners={};let serial=0,calls=[],pending=null;
function node(id){
 const n={id,value:'ALL',disabled:false,isConnected:true,style:{},dataset:{},focus(){},remove(){n.isConnected=false;if(id)delete nodes[id];},getAttribute(k){return this[k];},querySelector(sel){if(sel==='.sigs-v6-x')return n.x||(n.x=node());return nodes[sel.slice(1)]||null;},querySelectorAll(){return [];},getClientRects(){return [1];}};
 Object.defineProperty(n,'innerHTML',{set(v){n.html=v;for(const m of v.matchAll(/id="([^"]+)"/g))nodes[m[1]]=node(m[1]);},get(){return n.html||'';}});return n;
}
const env={document:{readyState:'loading',getElementById:id=>nodes[id]||null,createElement:()=>node(),body:{appendChild(n){nodes[n.id]=n;},classList:{contains:()=>false}},querySelector:()=>null,querySelectorAll:()=>[],addEventListener(k,fn){listeners[k]=fn;},removeEventListener(k,fn){if(listeners[k]===fn)delete listeners[k];}},CLOUD:{projectId:'p1',projectName:'Project',user:{id:'u1'},access:'token'},S:{placed:[],meas:[],scale:{}},FLOORS:[],MOD:'cctv',_sigsSbCfg:()=>({url:'https://example.test'}),_sigsSbHeaders:()=>({}),_buildProjectData:()=>({placed:JSON.parse(JSON.stringify(env.S.placed))}),notify(){},setTimeout(fn,ms){timeouts.set(++serial,{fn,ms});return serial;},clearTimeout(id){timeouts.delete(id);},setInterval(){},addEventListener(){},saveCurrentFloor(){}};
env._sigsSbJson=async(url,opts)=>{calls.push({url,body:opts?.body&&JSON.parse(opts.body)});if(pending)return pending;return url.includes('project_versions?')?[]:{id:'p1'};};env.window=env;vm.createContext(env);vm.runInContext(fs.readFileSync('assets/js/projects-v6.js','utf8'),env);
(async()=>{
 env.sigsV6MarkDirty();const timer=[...timeouts.values()].find(t=>t.ms===600000);assert(timer,'10-minute timer missing');const timerId=env.SIGS_V6.autoTimer;
 env.S.placed.push({id:'a'});env.sigsV6MarkDirty();assert.equal(env.SIGS_V6.autoTimer,timerId,'Changes must not postpone timer');
 timer.fn();await new Promise(r=>setImmediate(r));assert.equal(calls.at(-1).body.p_reason,'AUTO');assert.equal(env.SIGS_V6.dirty,false);
 await env.sigsV6SaveProject('manual');assert.equal(calls.at(-1).body.p_reason,'MANUAL');assert.equal(env.SIGS_V6.lastSavedMode,'manual');
 let resolve;pending=new Promise(r=>resolve=r);env.S.placed.push({id:'b'});env.sigsV6MarkDirty();const inFlight=env.sigsV6SaveProject('manual');env.S.placed.push({id:'c'});env.sigsV6MarkDirty();resolve({id:'p1'});await inFlight;assert.equal(env.SIGS_V6.dirty,true,'Edits during save must remain dirty');pending=null;
 pending=new Promise(()=>{});env.sigsV6OpenVersions();let overlay=nodes['sigs-v6-versions'];assert.equal(typeof overlay.x.onclick,'function');overlay.x.onclick();assert.equal(overlay.isConnected,false);
 env.sigsV6OpenVersions();overlay=nodes['sigs-v6-versions'];listeners.keydown({key:'Escape',preventDefault(){}});assert.equal(overlay.isConnected,false);
 env.sigsV6OpenVersions();overlay=nodes['sigs-v6-versions'];overlay.onclick({target:overlay});assert.equal(overlay.isConnected,false);pending=null;
 env._sigsSbJson=async()=>{throw Error('network failure');};await assert.rejects(()=>env.sigsV6SaveProject('manual'));assert.equal(env.SIGS_V6.dirty,true);assert.equal(env.SIGS_V6.saving,false);
 console.log('PASS: 10-minute autosave without debounce starvation, independent manual checkpoint, edits during save, modal close/Escape/backdrop while loading, save-error recovery.');
})().catch(e=>{console.error(e);process.exitCode=1;});
