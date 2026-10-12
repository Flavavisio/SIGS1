/* Published update detection without reloading a project while it is being edited. */
(function(w){'use strict';
const entry=new URL(w.location.href);entry.search='';entry.hash='';
const resumeKey='sigs-update-resume-v109',baseline=new Map();
let checking=false,available=false,installing=false,ready=false;
function assets(doc){return [...new Set([...doc.querySelectorAll('script[src],link[rel="stylesheet"][href]')].map(n=>new URL(n.getAttribute('src')||n.getAttribute('href'),entry).href).filter(u=>new URL(u).origin===entry.origin))].sort();}
const loadedAssets=assets(document),release=document.querySelector('meta[name="sigs-release"]')?.content||'';
function revision(doc){return doc.querySelector('meta[name="sigs-release"]')?.content||'';}
function validator(response){return [response.headers.get('etag'),response.headers.get('last-modified')].filter(Boolean).join('|');}
async function request(url,options){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{const r=await fetch(url,{credentials:'same-origin',...options,signal:controller.signal});if(!r.ok)throw new Error('Ligação indisponível. Tenta novamente.');return r;}finally{clearTimeout(timer);}
}
async function batch(items,action){
 let index=0;const results=await Promise.allSettled(Array.from({length:Math.min(6,items.length)},async()=>{while(index<items.length)await action(items[index++]);}));
 const failed=results.find(r=>r.status==='rejected');if(failed)throw failed.reason;
}
async function current(){const r=await request(entry.href,{cache:'no-store'});return new DOMParser().parseFromString(await r.text(),'text/html');}
function banner(){
 let n=document.getElementById('sigs-app-update');if(n)return n;
 n=document.createElement('section');n.id='sigs-app-update';n.setAttribute('aria-label','Atualização da aplicação');
 n.innerHTML='<strong>Nova atualização</strong><p role="status" aria-live="polite">Está disponível uma nova versão da app.</p><button type="button">Instalar</button>';
 n.querySelector('button').addEventListener('click',install);document.body.appendChild(n);return n;
}
function announce(){available=true;banner();}
async function seed(){
 // Cache metadata belongs to the resources this tab loaded, rather than a later release.
 await batch([entry.href,...loadedAssets],async url=>{try{const r=await request(url,{cache:'force-cache'});const tag=validator(r);if(tag)baseline.set(url,tag);if(r.body)await r.body.cancel();}catch(_){}});
 ready=true;await check();
}
async function check(){
 if(!ready||checking||available||installing||document.hidden||w.navigator.onLine===false)return;
 checking=true;
 try{
  const doc=await current();
  if(revision(doc)!==release||JSON.stringify(assets(doc))!==JSON.stringify(loadedAssets)){announce();return;}
  await batch([...baseline.keys()],async url=>{const tag=validator(await request(url,{method:'HEAD',cache:'no-store'}));if(tag&&tag!==baseline.get(url))announce();});
 }catch(_){/* Offline checks leave the current app and project untouched. */}finally{checking=false;}
}
function activeProject(){return document.getElementById('app')?.classList.contains('show')||document.getElementById('disk-calc-app')?.classList.contains('visible');}
function busy(){const v=w.SIGS_V6;return v&&(v.saving||v.restoring||v.deleting);}
async function preserve(){
 if(!activeProject()){w.sessionStorage.removeItem(resumeKey);return;}
 if(busy())throw new Error('Aguarda a gravação ou abertura do projeto e volta a instalar.');
 const cloud=w.CLOUD||{},pid=cloud.projectId,owner=cloud.user?.id||null;
 const record={owner,id:pid||null,name:cloud.projectName||'',time:Date.now(),module:w.MOD};
 if(pid){
  if(w.SIGS_V6?.currentStatus!=='ARCHIVED'){
   const saved=await w.sigsV6SaveProject('manual');
   if(!saved||w.SIGS_V6?.dirty||cloud.projectId!==pid||cloud.user?.id!==owner)throw new Error('O projeto ainda não ficou guardado. Guarda-o antes de instalar.');
  }
 }else{
  if(typeof w._buildProjectData!=='function')throw new Error('Guarda o projeto antes de instalar.');
  w.saveCurrentFloor?.();record.data=w._buildProjectData();
 }
 try{w.sessionStorage.setItem(resumeKey,JSON.stringify(record));}catch(_){throw new Error('Guarda e fecha o projeto antes de instalar a atualização.');}
}
async function install(){
 if(installing)return;if(busy()){banner().querySelector('p').textContent='Aguarda a gravação ou abertura do projeto e volta a instalar.';return;}
 installing=true;const n=banner(),button=n.querySelector('button'),message=n.querySelector('p');
 button.disabled=true;button.textContent='A instalar…';message.textContent='A descarregar a atualização…';
 const surfaces=['app','disk-calc-app'].map(id=>document.getElementById(id)).filter(Boolean),inert=surfaces.map(s=>s.inert);
 surfaces.forEach(s=>s.inert=true);
 try{
  const r=await request(entry.href,{cache:'reload'}),doc=new DOMParser().parseFromString(await r.text(),'text/html');
  if(!doc.querySelector('script[src*="block-03.js"]'))throw new Error('Atualização indisponível. Tenta novamente.');
  await batch(assets(doc),async url=>{const r=await request(url,{cache:'reload'});await r.arrayBuffer();});
  message.textContent='A guardar o projeto…';await preserve();
  const next=new URL(w.location.href);next.searchParams.set('sigs_update',Date.now().toString());w.location.replace(next.href);
 }catch(e){
  installing=false;button.disabled=false;button.textContent='Instalar';message.textContent=e.message||'Não foi possível instalar. Tenta novamente.';
  surfaces.forEach((s,i)=>s.inert=inert[i]);
 }
}
let resuming=false,lastResumeAttempt=0;
async function resume(){
 if(resuming||Date.now()-lastResumeAttempt<30000)return;let record;
 try{record=JSON.parse(w.sessionStorage.getItem(resumeKey)||'null');}catch(_){return;}
 if(!record)return;
 if(Date.now()-record.time>3600000){w.sessionStorage.removeItem(resumeKey);return;}
 const owner=w.CLOUD?.user?.id||null;
 if(record.owner&&!owner)return;
 if(record.owner!==owner){w.sessionStorage.removeItem(resumeKey);return;}
 if(!w.CLOUD?.access&&document.body.classList.contains('sigs-locked'))return;
 resuming=true;lastResumeAttempt=Date.now();
 try{
  if(record.id){if(!await w.cloudOpenProject(record.id,record.name))return;}
  else if(record.data){
   w.sigsPortalOpenDesigner?.({projectReady:true});w.startModule(record.module||'cctv');w._restoreProjectData(record.data);w.sigsV6MarkDirty?.();
  }
  w.sessionStorage.removeItem(resumeKey);
 }catch(_){/* Keep the recovery record for a later successful authenticated retry. */}finally{resuming=false;}
}
w.SIGSAppUpdate={check,install,resume};
function start(){seed();resume();setInterval(check,120000);setInterval(resume,5000);}
w.addEventListener('online',check);w.addEventListener('focus',check);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){check();resume();}});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})(window);
