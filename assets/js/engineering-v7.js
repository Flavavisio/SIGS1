/* SIGS Design V7 — Engineering catalogue + floor-plan Storage */
(function(){
'use strict';
var V7={signed:{},orig:{},infra:null};
window.SIGS_V7=V7;
function cfg(){return typeof _sigsSbCfg==='function'?_sigsSbCfg():null;}
function hdr(extra){return typeof _sigsSbHeaders==='function'?_sigsSbHeaders(extra||{}):Object.assign({},extra||{});}
function pid(){return window.CLOUD&&CLOUD.projectId||null;}
function logged(){return !!(window.CLOUD&&CLOUD.user&&CLOUD.access);}
function floor(){return window.FLOORS&&FLOORS[window.FLOOR_CUR||0]||null;}
function cleanFile(s){return String(s||'planta').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9._-]+/g,'_');}
function extOf(file){var x=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');return x||'jpg';}
function notifyV7(m){try{if(typeof notify==='function')notify(m);}catch(e){}}

function companyId(){
  if(window.LIC&&LIC.ctx&&LIC.ctx.company&&LIC.ctx.company.id)return Promise.resolve(LIC.ctx.company.id);
  if(typeof _sigsEnsureContext==='function')return _sigsEnsureContext().then(function(x){return x&&x.company&&x.company.id;});
  return Promise.reject(new Error('Contexto da empresa indisponível.'));
}

window.sigsV7SignedProjectFile=function(path){
  path=String(path||'');if(!path)return Promise.reject(new Error('Caminho da planta inválido.'));
  var hit=V7.signed[path];if(hit&&hit.expires>Date.now()+60000)return Promise.resolve(hit.url);
  var c=cfg();if(!c)return Promise.reject(new Error('Supabase indisponível.'));
  return fetch(c.url+'/storage/v1/object/sign/project-files/'+encodeURI(path),{
    method:'POST',headers:hdr(),body:JSON.stringify({expiresIn:3600})
  }).then(function(r){return r.text().then(function(t){var b={};try{b=t?JSON.parse(t):{};}catch(e){}if(!r.ok)throw new Error(b.message||b.error||('HTTP '+r.status));return b;});})
    .then(function(b){var u=b.signedURL||b.signedUrl||b.url;if(!u)throw new Error('URL assinada não devolvida.');if(/^\//.test(u))u=c.url+'/storage/v1'+u;V7.signed[path]={url:u,expires:Date.now()+3500000};return u;});
};

function setFloorImage(src,meta,doFit){
  var img=new Image();img.crossOrigin='anonymous';
  img.onload=function(){
    var iw=img.naturalWidth||800,ih=img.naturalHeight||600;
    var fw=meta.w,fh=meta.h;
    if(!fw||!fh){var sc=Math.min(1,(cv.width*.88/S.zoom)/iw,(cv.height*.88/S.zoom)/ih);fw=Math.round(iw*sc);fh=Math.round(ih*sc);}
    S.fp={img:img,imgData:meta.imgData||null,storagePath:meta.storagePath||null,fileName:meta.fileName||null,mimeType:meta.mimeType||null,sizeBytes:meta.sizeBytes||null,x:meta.x!=null?meta.x:-fw/2,y:meta.y!=null?meta.y:-fh/2,w:fw,h:fh,opa:meta.opa!=null?meta.opa:1,locked:!!meta.locked};
    var fl=floor();if(fl)fl.fp={x:S.fp.x,y:S.fp.y,w:S.fp.w,h:S.fp.h,opa:S.fp.opa,locked:S.fp.locked,imgData:S.fp.imgData,storagePath:S.fp.storagePath,fileName:S.fp.fileName,mimeType:S.fp.mimeType,sizeBytes:S.fp.sizeBytes};
    var lk=document.getElementById('fplock');if(lk)lk.checked=!!S.fp.locked;
    if(doFit&&typeof fitView==='function')fitView();
    try{render();updateStats();if(typeof sigsV6MarkDirty==='function')sigsV6MarkDirty();}catch(e){}
  };
  img.onerror=function(){notifyV7('Erro ao carregar a planta do Storage.');};
  img.src=src;
}

window.sigsV7LoadStoredFloorPlan=function(meta,doFit){
  if(!meta)return Promise.resolve();
  if(meta.imgData){setFloorImage(meta.imgData,meta,doFit);return Promise.resolve();}
  if(meta.storagePath)return sigsV7SignedProjectFile(meta.storagePath).then(function(url){setFloorImage(url,meta,doFit);});
  return Promise.resolve();
};

function uploadFloorPlan(file){
  if(!file)return Promise.reject(new Error('Selecione uma imagem.'));
  if(!logged()||!pid())return Promise.reject(new Error('Guarde/crie o projeto antes de enviar a planta para a cloud.'));
  if(window.SIGS_V6&&SIGS_V6.currentStatus==='ARCHIVED')return Promise.reject(new Error('Projeto arquivado.'));
  var fl=floor();if(!fl)return Promise.reject(new Error('Piso atual não encontrado.'));
  return companyId().then(function(cid){
    if(!cid)throw new Error('Empresa não encontrada.');
    var path=cid+'/'+pid()+'/floorplans/'+cleanFile(fl.id)+'-floorplan.'+extOf(file),c=cfg();
    notifyV7('☁ A enviar planta para o Storage…');
    return fetch(c.url+'/storage/v1/object/project-files/'+encodeURI(path),{
      method:'POST',headers:hdr({'Content-Type':file.type||'application/octet-stream','x-upsert':'true'}),body:file
    }).then(function(r){if(!r.ok)return r.text().then(function(t){throw new Error(t||('HTTP '+r.status));});return {cid:cid,path:path};});
  }).then(function(x){
    var row={project_id:pid(),company_id:x.cid,uploaded_by:CLOUD.user.id,file_type:'FLOORPLAN',floor_id:String(floor().id),file_name:file.name,storage_path:x.path,mime_type:file.type||null,size_bytes:file.size||null,metadata:{source:'SIGS_V7'}};
    return fetch(cfg().url+'/rest/v1/project_files',{method:'POST',headers:hdr({'Prefer':'return=minimal'}),body:JSON.stringify(row)}).then(function(r){if(!r.ok)return r.text().then(function(t){throw new Error(t||('HTTP '+r.status));});return x.path;});
  }).then(function(path){
    return sigsV7SignedProjectFile(path).then(function(url){
      setFloorImage(url,{storagePath:path,fileName:file.name,mimeType:file.type,sizeBytes:file.size},true);
      notifyV7('✓ Planta guardada no Supabase Storage.');return path;
    });
  });
}
window.sigsV7UploadFloorPlan=uploadFloorPlan;

function installFloorPlanStorage(){
  if(V7.orig.floorInstalled)return;V7.orig.floorInstalled=true;
  V7.orig.doImportFP=window.doImportFP;
  window.doImportFP=function(e){
    var file=e&&e.target&&e.target.files&&e.target.files[0];if(!file)return;
    if(logged()&&pid()){
      uploadFloorPlan(file).catch(function(err){notifyV7('Storage indisponível: '+err.message+' · a usar cópia incorporada.');if(V7.orig.doImportFP)V7.orig.doImportFP({target:{files:[file],value:''}});});
      if(e.target)e.target.value='';return;
    }
    if(V7.orig.doImportFP)V7.orig.doImportFP(e);
  };

  V7.orig.saveCurrentFloor=window.saveCurrentFloor;
  if(V7.orig.saveCurrentFloor)window.saveCurrentFloor=function(){
    var r=V7.orig.saveCurrentFloor.apply(this,arguments),fl=floor();
    if(fl&&S.fp){fl.fp=fl.fp||{};fl.fp.storagePath=S.fp.storagePath||null;fl.fp.fileName=S.fp.fileName||null;fl.fp.mimeType=S.fp.mimeType||null;fl.fp.sizeBytes=S.fp.sizeBytes||null;if(S.fp.storagePath)fl.fp.imgData=null;}
    return r;
  };

  V7.orig.loadFloor=window.loadFloor;
  if(V7.orig.loadFloor)window.loadFloor=function(idx){
    var meta=window.FLOORS&&FLOORS[idx]&&FLOORS[idx].fp?JSON.parse(JSON.stringify(FLOORS[idx].fp)):null;
    var r=V7.orig.loadFloor.apply(this,arguments);
    if(meta&&meta.storagePath&&!meta.imgData)setTimeout(function(){sigsV7LoadStoredFloorPlan(meta,true).catch(function(){});},20);
    return r;
  };

  V7.orig.restoreProjectData=window._restoreProjectData;
  if(V7.orig.restoreProjectData)window._restoreProjectData=function(d){
    var r=V7.orig.restoreProjectData.apply(this,arguments);
    var meta=(d&&d.floors&&d.floors[d.floorCur||0]&&d.floors[d.floorCur||0].fp)||(d&&d.fp)||null;
    if(meta&&meta.storagePath&&!meta.imgData)setTimeout(function(){sigsV7LoadStoredFloorPlan(meta,true).catch(function(){});},60);
    return r;
  };

  // Cloud serializer: keep floor-plan metadata in JSON, not megabytes of base64.
  window._buildProjectData=function(){
    if(typeof saveCurrentFloor==='function')saveCurrentFloor();
    var floors=JSON.parse(JSON.stringify(window.FLOORS||[]));
    floors.forEach(function(f){if(f.fp&&f.fp.storagePath)delete f.fp.imgData;});
    var data={v:10,module:MOD,lib:S.lib,placed:S.placed,meas:S.meas,scale:S.scale,devN:S.devN,floors:floors,floorCur:FLOOR_CUR};
    if(S.fp&&S.fp.img){
      var fp={x:S.fp.x,y:S.fp.y,w:S.fp.w,h:S.fp.h,opa:S.fp.opa,locked:S.fp.locked,storagePath:S.fp.storagePath||null,fileName:S.fp.fileName||null,mimeType:S.fp.mimeType||null,sizeBytes:S.fp.sizeBytes||null};
      if(!fp.storagePath){
        try{fp.imgData=S.fp.imgData||null;if(!fp.imgData){var oc=document.createElement('canvas');oc.width=S.fp.img.naturalWidth||S.fp.img.width;oc.height=S.fp.img.naturalHeight||S.fp.img.height;oc.getContext('2d').drawImage(S.fp.img,0,0);fp.imgData=oc.toDataURL('image/jpeg',0.82);}}catch(e){fp.imgData=null;}
      }
      data.fp=fp;
    }
    return data;
  };
}

window.sigsV7InfraLoaded=function(infra){
  V7.infra=infra||null;
  try{if(typeof buildSystemTab==='function'&&document.getElementById('nvr-suggestion'))buildSystemTab();}catch(e){}
};

function addStorageIndicator(){
  var host=document.getElementById('tc-system');if(!host||document.getElementById('v7-engineering-note'))return;
  var d=document.createElement('div');d.id='v7-engineering-note';d.className='sigs-v7-engineering-note';
  d.innerHTML='<b>V7 Engenharia</b> · NVR, switches e HDD carregados do catálogo Supabase quando a sessão está online. Plantas de projetos cloud são guardadas no Storage.';
  host.insertBefore(d,host.firstChild);
}

function init(){
  installFloorPlanStorage();addStorageIndicator();
  if(window.SIGS_CATALOG&&SIGS_CATALOG.products&&SIGS_CATALOG.products.length&&typeof sigsCatalogLoadRemote==='function')sigsCatalogLoadRemote(true).catch(function(){});
  setInterval(addStorageIndicator,3000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(init,180);});else setTimeout(init,180);
})();
