const fs=require('node:fs'),assert=require('node:assert/strict');
const {JSDOM,VirtualConsole}=require('jsdom');
const source=fs.readFileSync('assets/js/app-update-v109.js','utf8');
const html=version=>`<meta name="sigs-release" content="${version}"><script src="assets/js/block-03.js?v=same"></script><link rel="stylesheet" href="assets/css/sigs.css"><div id="app" class="show"></div>`;
const tick=()=>new Promise(r=>setImmediate(r));
async function fixture(options={}){
 let tag='old',content='old',version='v1',offline=false,reloadFailures=false,navigations=0,saves=0;
 const serverHTML=()=>options.realPage?fs.readFileSync('app-Sigs.html','utf8'):html(version);
 const requests=[],vc=new VirtualConsole();vc.on('jsdomError',e=>{if(e.message.includes('navigation'))navigations++;else throw e;});
 const dom=new JSDOM(serverHTML(),{url:'https://sigs.test/app-Sigs.html'+(options.afterInstall?'?sigs_update=123':''),runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc}),w=dom.window;
 const trailing=options.realPage?[...w.document.querySelectorAll('script[src]')].slice(-1):[];trailing.forEach(n=>n.remove());
 Object.defineProperty(w.document,'readyState',{value:options.realPage?'loading':'complete'});w.AbortController=AbortController;w.setInterval=()=>0;
 Object.defineProperty(w.crypto,'subtle',{value:{digest:async(_,bytes)=>require('node:crypto').createHash('sha256').update(Buffer.from(bytes)).digest()}});
 w.fetch=async(url,requestOptions)=>{
  requests.push({url,options:requestOptions});if(offline||reloadFailures&&requestOptions.cache==='reload'&&url.includes('.css'))throw new Error('Ligação indisponível. Tenta novamente.');
  return {ok:true,headers:{get:name=>name==='etag'?(options.headTags&&requestOptions.method==='HEAD'?'W/"'+tag+'"':tag):null},body:{cancel:async()=>{}},text:async()=>serverHTML(),arrayBuffer:async()=>Buffer.from(content)};
 };
 w.CLOUD={projectId:'p1',projectName:'Projeto',user:{id:'u1'},access:'present'};w.SIGS_V6={dirty:true,currentStatus:'DRAFT'};
 w.sigsV6SaveProject=async()=>{saves++;w.SIGS_V6.dirty=false;return {id:'p1'};};
 w.eval(source);trailing.forEach(n=>w.document.body.appendChild(n));for(let i=0;i<30;i++)await tick();
 return {w,dom,requests,changeAsset:()=>{tag='new';content='new';},changeHeaders:()=>tag='headers-only',changeVersion:()=>version='v2',offline:b=>offline=b,reloadFailures:b=>reloadFailures=b,navigations:()=>navigations,saves:()=>saves};
}
(async()=>{
 for(const afterInstall of [false,true]){
  const p=await fixture({realPage:true,afterInstall});for(let i=0;i<3;i++)await p.w.SIGSAppUpdate.check();assert(!p.w.document.getElementById('sigs-app-update'),'The actual page must include scripts parsed after the updater, including after installation');assert.equal(p.navigations(),0);p.dom.window.close();
 }
 const h=await fixture({headTags:true});assert(!h.w.document.getElementById('sigs-app-update'),'GET/HEAD validator differences are not updates');h.changeHeaders();for(let i=0;i<3;i++)await h.w.SIGSAppUpdate.check();assert(!h.w.document.getElementById('sigs-app-update'),'Changed cache headers with identical bytes must not repeat the update prompt');h.changeAsset();await h.w.SIGSAppUpdate.check();assert(h.w.document.getElementById('sigs-app-update'),'A real unversioned asset change is still detected');h.dom.window.close();
 const f=await fixture(),{w}=f;assert(!w.document.getElementById('sigs-app-update'));assert.equal(f.saves(),0);
 f.offline(true);await w.SIGSAppUpdate.check();assert(!w.document.getElementById('sigs-app-update'));f.offline(false);
 f.changeAsset();await w.SIGSAppUpdate.check();const banner=w.document.getElementById('sigs-app-update');assert(banner);assert.equal(banner.querySelector('button').textContent,'Instalar');assert.equal(f.navigations(),0,'Detection does not reload');assert.equal(f.saves(),0,'Detection does not write projects');
 w.SIGS_V6.saving=true;await w.SIGSAppUpdate.install();assert.equal(f.navigations(),0);assert.equal(f.saves(),0);w.SIGS_V6.saving=false;
 f.reloadFailures(true);await w.SIGSAppUpdate.install();assert.equal(f.navigations(),0);assert.equal(f.saves(),0);assert.equal(w.document.getElementById('app').inert,undefined,'Download failure unlocks the original app');f.reloadFailures(false);
 w.sigsV6SaveProject=async()=>null;await w.SIGSAppUpdate.install();assert.equal(f.navigations(),0,'Save failure cannot discard a project');assert(!w.sessionStorage.getItem('sigs-update-resume-v109'));
 w.sigsV6SaveProject=async()=>{w.SIGS_V6.dirty=false;return {id:'p1'};};await w.SIGSAppUpdate.install();assert.equal(f.navigations(),1);
 const record=JSON.parse(w.sessionStorage.getItem('sigs-update-resume-v109'));assert.equal(record.id,'p1');assert.equal(record.owner,'u1');assert(f.requests.some(r=>r.options.cache==='reload'&&r.url.includes('.css')),'Installation refreshes caches even for assets with unchanged URLs');
 let opened=0;w.cloudOpenProject=async(id,name)=>{assert.equal(id,'p1');opened++;return {id};};await w.SIGSAppUpdate.resume();assert.equal(opened,1);assert(!w.sessionStorage.getItem('sigs-update-resume-v109'));
 w.sessionStorage.setItem('sigs-update-resume-v109',JSON.stringify({...record,owner:'someone-else'}));await w.SIGSAppUpdate.resume();assert.equal(opened,1,'Recovery never opens another account’s project');f.dom.window.close();
 const g=await fixture();g.changeVersion();await g.w.SIGSAppUpdate.check();assert(g.w.document.getElementById('sigs-app-update'),'An HTML release change is detected independently of cached asset headers');
 g.w.CLOUD.projectId=null;g.w._buildProjectData=()=>({placed:[{id:'local'}]});g.w.MOD='cctv';await g.w.SIGSAppUpdate.install();assert.equal(JSON.parse(g.w.sessionStorage.getItem('sigs-update-resume-v109')).data.placed[0].id,'local','An uncreated local project survives installation');g.dom.window.close();
 console.log('PASS app updates: release and unversioned asset detection, offline/busy/download/save guards, explicit installation/cache refresh, authenticated project recovery and local draft preservation.');
})().catch(e=>{console.error(e);process.exitCode=1;});
