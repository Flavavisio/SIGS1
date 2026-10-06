/* SIGS Design V6 — Project Management, Autosave & Version History */
(function(){
'use strict';

var V6={dirty:false,saving:false,suppress:false,lastSavedAt:null,lastFingerprint:null,autoTimer:null,autosaveMs:600000,manager:null,currentStatus:null,lastSavedMode:null,restoring:false};
window.SIGS_V6=V6;
function ge(id){return document.getElementById(id)}
function esc(v){return (typeof _esc==='function')?_esc(v==null?'':v):String(v==null?'':v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]})}
function sb(){return _sigsSbCfg()}
function h(extra){return _sigsSbHeaders(extra)}
function api(url,opts){return _sigsSbJson(url,opts).catch(function(e){
  if(e.code==='23505'&&/projects_company_name_unique/.test(e.message))throw new Error('Já existe um projeto com este nome nesta empresa. Escolhe outro nome.');
  if(e.code==='23514'&&/projects_name_required/.test(e.message))throw new Error('Indica o nome do projeto.');
  throw e;
})}
function cleanName(name){return String(name||'').replace(/\s+/g,' ').trim();}
function sameName(a,b){return cleanName(a).toLocaleLowerCase('pt-PT')===cleanName(b).toLocaleLowerCase('pt-PT');}
function projectId(){return window.CLOUD&&CLOUD.projectId||null}
function logged(){return !!(window.CLOUD&&CLOUD.user&&CLOUD.access)}
function projectCounts(){return typeof _projectCounts==='function'?_projectCounts():{cameraCount:0,detectorCount:0,fireDetectorCount:0}}
function fmtDate(v){if(!v)return '—';try{return new Date(v).toLocaleString('pt-PT',{dateStyle:'short',timeStyle:'short'});}catch(e){return String(v)}}
function fingerprint(){
  try{
    if(typeof saveCurrentFloor==='function')saveCurrentFloor();
    function fpMark(x){if(!x)return null;var d=x.imgData||'';return {x:x.x,y:x.y,w:x.w,h:x.h,opa:x.opa,locked:!!x.locked,img:d?String(d).length:0,storagePath:x.storagePath||null};}
    var floors=(window.FLOORS||[]).map(function(f){return {id:f.id,name:f.name,obstacles:f.obstacles||[],sceneTargets:f.sceneTargets||[],scene3d:f.scene3d||{},cableHub:f.cableHub||null,cabling:f.cabling||{},placed:f.placed||[],meas:f.meas||[],scale:f.scale||null,devN:f.devN||0,fp:fpMark(f.fp)};});
    return JSON.stringify({module:window.MOD,placed:window.S&&S.placed||[],meas:window.S&&S.meas||[],scale:window.S&&S.scale||null,devN:window.S&&S.devN||0,fp:fpMark(window.S&&S.fp),floors:floors,floorCur:window.FLOOR_CUR||0,commercial:window.SIGS_COMMERCIAL||null});
  }catch(e){return String(Date.now());}
}
function moduleDb(){return typeof _sigsProjectModule==='function'?_sigsProjectModule():'CCTV'}

function ensureSaveChip(){
  if(ge('sigs-v6-save-chip'))return;
  var nav=document.querySelector('.sigs-v5-nav');if(!nav)return;
  var b=document.createElement('button');b.id='sigs-v6-save-chip';b.type='button';b.className='sigs-v6-save-chip clean';b.textContent='✓ Guardado';
  b.title='Estado da gravação do projeto';b.onclick=function(){saveProject('manual').catch(function(){});};
  var audit=ge('sigs-v5-audit-chip');if(audit)nav.insertBefore(b,audit);else nav.appendChild(b);
}
function saveChip(state,msg){
  ensureSaveChip();var b=ge('sigs-v6-save-chip');if(!b)return;
  b.className='sigs-v6-save-chip '+state;
  if(msg)b.textContent=msg;
  else if(state==='dirty')b.textContent='● Por guardar';
  else if(state==='saving')b.textContent='↻ A guardar…';
  else if(state==='error')b.textContent='⚠ Erro ao guardar';
  else b.textContent='✓ Guardado';
}
function markDirty(){
  if(V6.suppress||!projectId())return;
  if(V6.currentStatus==='ARCHIVED'){saveChip('archived','🔒 Arquivado');return;}
  var fp=fingerprint();if(V6.lastFingerprint!==null&&fp===V6.lastFingerprint)return;
  V6.dirty=true;saveChip('dirty');
  if(!V6.autoTimer)armAutosave();
}
function armAutosave(){
  clearTimeout(V6.autoTimer);var pid=projectId();
  V6.autoTimer=setTimeout(function(){V6.autoTimer=null;if(pid!==projectId())return;
    saveProject('auto').catch(function(){}).finally(function(){if(pid===projectId())armAutosave();});
  },V6.autosaveMs);
}
window.sigsV6MarkDirty=markDirty;

function buildPatch(){
  var c=projectCounts();
  return {total_budget:typeof sigsV8Quote==='function'?sigsV8Quote().total:0,project_data:_buildProjectData(),module:moduleDb(),camera_count:c.cameraCount||0,detector_count:c.detectorCount||0,fire_detector_count:c.fireDetectorCount||0,floor_count:(window.FLOORS&&FLOORS.length)||1,updated_at:new Date().toISOString(),updated_by:CLOUD.user.id};
}
function rpc(name,body){
  var cfg=sb();return api(cfg.url+'/rest/v1/rpc/'+name,{method:'POST',headers:h(),body:JSON.stringify(body||{})});
}
function saveProject(mode){
  mode=mode||'manual';
  if(!logged()){if(mode!=='auto'&&typeof notify==='function')notify('Inicia sessão primeiro.');return Promise.resolve(null);}
  if(!projectId()){
    if(mode==='auto')return Promise.resolve(null);
    openNewProjectWizard();return Promise.resolve(null);
  }
  if(V6.currentStatus==='ARCHIVED'){if(mode!=='auto'&&typeof notify==='function')notify('Projeto arquivado. Altere o estado para Rascunho ou Ativo antes de guardar.');saveChip('archived','🔒 Arquivado');return Promise.resolve(null);}
  if(V6.saving||V6.restoring)return Promise.resolve(null);
  if(mode==='auto'&&!V6.dirty)return Promise.resolve(null);
  V6.saving=true;saveChip('saving');
  var patch,pid=projectId(),savedFingerprint;try{patch=buildPatch();savedFingerprint=fingerprint();}catch(e){V6.saving=false;V6.dirty=true;saveChip('error');return Promise.reject(e);}
  return rpc('sigs_save_project_checkpoint',{p_project:pid,p_patch:patch,p_reason:mode==='auto'?'AUTO':'MANUAL'})
    .then(function(result){
      var row=Array.isArray(result)?result[0]:result;if(!row)throw new Error('Gravação não autorizada ou projeto indisponível.');
      if(pid!==projectId())return row;
      V6.lastSavedAt=new Date();V6.lastSavedMode=mode;V6.lastFingerprint=savedFingerprint;V6.dirty=fingerprint()!==savedFingerprint;
      saveChip(V6.dirty?'dirty':'clean',V6.dirty?null:(mode==='auto'?'✓ Cópia automática ':'✓ Gravação manual ')+V6.lastSavedAt.toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'}));
      return row;
    })
    .then(function(p){
      if(mode==='manual'&&p&&typeof notify==='function')notify('✓ Projeto guardado: '+(CLOUD.projectName||p.name||'Projeto'));
      if(typeof loadContext==='function')loadContext().catch(function(){});
      return p;
    })
    .catch(function(e){if(pid===projectId()){V6.dirty=true;saveChip('error');}if(mode!=='auto'&&typeof notify==='function')notify('Erro ao guardar: '+e.message);throw e;})
    .finally(function(){V6.saving=false;});
}
window.sigsV6SaveProject=saveProject;
window.cloudSaveCurrent=function(){return saveProject('manual');};

function emptyProjectData(mod){
  var key=mod==='INTRUSION'?'alarm':mod==='FIRE'?'fire':'cctv';
  var lib=key==='cctv'?window.CCTV_LIB:key==='fire'?window.FIRE_LIB:window.AJAX_LIB;
  return {v:9,module:key,lib:JSON.parse(JSON.stringify(lib||[])),placed:[],meas:[],scale:{ok:false,ppm:10,mpp:.1},devN:0,floors:[],floorCur:0};
}
function closeOverlay(id){var x=ge(id);if(x){if(x.__close)x.__close();else x.remove();}}
function openNewProjectWizard(companyId,module){
  companyId=typeof companyId==='string'?companyId:null;
  if(!logged()){if(typeof notify==='function')notify('Inicia sessão primeiro.');return;}
  closeOverlay('sigs-v6-new-project');
  var o=document.createElement('div');o.id='sigs-v6-new-project';o.className='sigs-v6-overlay';
  o.innerHTML='<div class="sigs-v6-dialog"><div class="sigs-v6-dialog-head"><div><div class="sigs-v6-dialog-title">Novo Projeto</div><div class="sigs-v6-dialog-sub">Crie o projeto primeiro. A partir daí o autosave fica ativo.</div></div><button class="sigs-v6-x">✕</button></div>'+
    (CLOUD.user.role==='SUPER_ADMIN'?'<label style="display:block;margin-bottom:16px">Empresa do projeto<select id="v6-p-owner" required><option value="">Seleciona uma empresa…</option></select></label>':'')+
    '<div class="sigs-v6-grid2"><label>Nome do projeto<input id="v6-p-name" required autocomplete="off" placeholder="Ex.: Moradia Cascais"></label><label>Módulo<select id="v6-p-module"><option value="CCTV">CCTV</option><option value="INTRUSION">Intrusão</option><option value="FIRE">Incêndio</option></select></label><label>Cliente<input id="v6-p-client" placeholder="Nome do cliente"></label><label>Empresa do cliente<input id="v6-p-company" placeholder="Empresa / condomínio"></label><label>Email<input id="v6-p-email" type="email" placeholder="cliente@empresa.pt"></label><label>Telefone<input id="v6-p-phone" placeholder="Contacto"></label></div>'+
    '<div class="sigs-v6-dialog-foot"><button class="sag-btn" id="v6-p-cancel">Cancelar</button><button class="sag-btn" id="v6-p-open">Abrir projetos</button><button class="sag-btn primary" id="v6-p-create">Criar projeto</button></div><div id="v6-p-status" class="sigs-v6-status"></div></div>';
  document.body.appendChild(o);
  ge('v6-p-name').focus();
  var current=String(module||window.MOD||'cctv').toUpperCase();if(current==='ALARM')current='INTRUSION';if(current==='DISK')current='CCTV';var sel=ge('v6-p-module');if(sel)sel.value=current;
  ge('v6-p-open').onclick=function(){o.remove();openProjectManager(module);};
  o.querySelector('.sigs-v6-x').onclick=function(){o.remove()};ge('v6-p-cancel').onclick=function(){o.remove()};
  if(CLOUD.user.role==='SUPER_ADMIN')loadLicenseContext().then(function(context){
    var owner=ge('v6-p-owner');if(!owner||!o.isConnected)return;
    (context.companies||[]).forEach(function(co){var option=document.createElement('option');option.value=co.id;option.textContent=co.name+' · '+(co.license&&co.license.plan||'Sem licença');owner.appendChild(option);});
    if(companyId)owner.value=companyId;
  }).catch(function(e){if(ge('v6-p-status'))ge('v6-p-status').textContent=e.message;});
  ge('v6-p-create').onclick=function(){
    var name=cleanName(ge('v6-p-name').value),mod=ge('v6-p-module').value,st=ge('v6-p-status');if(!name){st.textContent='Indica o nome do projeto.';ge('v6-p-name').focus();return;}
    var owner=ge('v6-p-owner');if(owner&&!owner.value){st.textContent='Seleciona a empresa do projeto.';return;}
    var create=ge('v6-p-create');create.disabled=true;
    st.textContent='A criar projeto…';
    _sigsEnsureContext(owner&&owner.value).then(function(ctx){
      var co=ctx.company||{},lic=ctx.license||{},projects=ctx.projects||[];
      if(projects.some(function(p){return sameName(p.name,name);}))throw new Error('Já existe um projeto com este nome nesta empresa. Escolhe outro nome.');
      if(!co.id)throw new Error('Empresa não encontrada.');if(lic.status!=='ACTIVE')throw new Error('Licença inativa.');if(lic.maxProjects!=null&&projects.length>=lic.maxProjects)throw new Error('Limite de projetos atingido.');
      var row={company_id:co.id,created_by:CLOUD.user.id,updated_by:CLOUD.user.id,name:name,module:mod,status:'DRAFT',customer_name:(ge('v6-p-client').value||'').trim()||null,customer_company:(ge('v6-p-company').value||'').trim()||null,customer_email:(ge('v6-p-email').value||'').trim()||null,customer_phone:(ge('v6-p-phone').value||'').trim()||null,project_data:emptyProjectData(mod),camera_count:0,detector_count:0,fire_detector_count:0,floor_count:1,last_saved_at:new Date().toISOString()};
      var cfg=sb();return api(cfg.url+'/rest/v1/projects',{method:'POST',headers:h({'Prefer':'return=representation'}),body:JSON.stringify(row)});
    }).then(function(rows){
      var p=rows&&rows[0];if(!p)throw new Error('Projeto não criado.');CLOUD.projectId=p.id;CLOUD.projectName=p.name;V6.currentStatus='DRAFT';armAutosave();V6.dirty=false;V6.lastSavedAt=new Date();V6.lastFingerprint=fingerprint();
      var ui=p.module==='INTRUSION'?'alarm':p.module==='FIRE'?'fire':'cctv';if(document.body.classList.contains('sigs-locked')&&typeof sigsPortalOpenDesigner==='function')sigsPortalOpenDesigner({projectReady:true});V6.suppress=true;startModule(ui);if(module==='disk')startModule('disk');setTimeout(function(){V6.suppress=false;V6.lastFingerprint=fingerprint();saveChip('clean');if(typeof sigsV5UpdateFlow==='function')sigsV5UpdateFlow();},100);
      o.remove();if(typeof notify==='function')notify('✓ Projeto criado em Rascunho: '+p.name);if(typeof loadContext==='function')loadContext().catch(function(){});
    }).catch(function(e){st.textContent='Erro: '+e.message;}).finally(function(){create.disabled=false;});
  };
}
window.sigsV6NewProject=openNewProjectWizard;window.cloudNewProject=openNewProjectWizard;

function loadProject(id,name){
  var cfg=sb();return api(cfg.url+'/rest/v1/projects?select=id,name,module,status,project_data,last_saved_at,version_no&id=eq.'+encodeURIComponent(id),{headers:h()}).then(function(rows){
    var p=rows&&rows[0];if(!p||!p.project_data)throw new Error('Projeto sem dados guardados.');CLOUD.projectId=p.id;CLOUD.projectName=p.name;if(document.body.classList.contains('sigs-locked')&&typeof sigsPortalOpenDesigner==='function')sigsPortalOpenDesigner({projectReady:true});V6.suppress=true;startModule(p.module==='INTRUSION'?'alarm':p.module==='FIRE'?'fire':'cctv');_restoreProjectData(p.project_data);V6.currentStatus=p.status||'ACTIVE';armAutosave();V6.dirty=false;V6.lastSavedAt=p.last_saved_at?new Date(p.last_saved_at):new Date();V6.lastFingerprint=fingerprint();setTimeout(function(){V6.suppress=false;V6.lastFingerprint=fingerprint();saveChip(V6.currentStatus==='ARCHIVED'?'archived':'clean',V6.currentStatus==='ARCHIVED'?'🔒 Arquivado':null);if(typeof sigsV5UpdateFlow==='function')sigsV5UpdateFlow();},180);return p;
  });
}
window.cloudOpenProject=function(id,name){return loadProject(id,name).then(function(p){closeCloud();if(typeof notify==='function')notify('✓ Projeto aberto: '+(name||p.name));}).catch(function(e){if(typeof notify==='function')notify('Erro ao abrir: '+e.message);});};
window.sigsAdminOpenProject=function(id,name){return window.cloudOpenProject(id,name);};

function duplicateProject(id){
  if(!logged())return;
  var cfg=sb();id=id||projectId();if(!id){if(typeof notify==='function')notify('Abra um projeto primeiro.');return;}
  return api(cfg.url+'/rest/v1/projects?select=*&id=eq.'+encodeURIComponent(id),{headers:h()}).then(function(rows){
    var p=rows&&rows[0];if(!p)throw new Error('Projeto não encontrado.');return _sigsEnsureContext(p.company_id).then(function(ctx){
      var lic=ctx.license||{},projects=ctx.projects||[];if(lic.maxProjects!=null&&projects.length>=lic.maxProjects)throw new Error('Limite de projetos atingido.');
      var baseName=cleanName(p.name)+' — Cópia',copyName=baseName,n=2;
      while(projects.some(function(x){return sameName(x.name,copyName);}))copyName=baseName+' '+(n++);
      var copy={company_id:p.company_id,created_by:CLOUD.user.id,updated_by:CLOUD.user.id,assigned_to:null,name:copyName,customer_name:p.customer_name,customer_company:p.customer_company,customer_email:p.customer_email,customer_phone:p.customer_phone,module:p.module,status:'DRAFT',project_data:p.project_data,camera_count:p.camera_count,detector_count:p.detector_count,fire_detector_count:p.fire_detector_count,floor_count:p.floor_count,total_budget:p.total_budget,currency:p.currency||'EUR'};
      return api(cfg.url+'/rest/v1/projects',{method:'POST',headers:h({'Prefer':'return=representation'}),body:JSON.stringify(copy)});
    });
  }).then(function(rows){var p=rows&&rows[0];if(typeof notify==='function')notify('✓ Projeto duplicado: '+(p?p.name:'Cópia'));if(typeof loadContext==='function')loadContext().catch(function(){});return p;}).catch(function(e){if(typeof notify==='function')notify('Erro ao duplicar: '+e.message);});
}
window.sigsV6DuplicateProject=duplicateProject;

function setStatus(id,status){
  var cfg=sb();return api(cfg.url+'/rest/v1/projects?id=eq.'+encodeURIComponent(id),{method:'PATCH',headers:h({'Prefer':'return=representation'}),body:JSON.stringify({status:status,archived_at:status==='ARCHIVED'?new Date().toISOString():null,updated_at:new Date().toISOString(),updated_by:CLOUD.user.id})}).then(function(rows){if(id===projectId()){V6.currentStatus=status;V6.dirty=false;saveChip(status==='ARCHIVED'?'archived':'clean',status==='ARCHIVED'?'🔒 Arquivado':null);}if(typeof notify==='function')notify('Estado: '+statusLabel(status));return rows&&rows[0];});
}
window.sigsV6SetStatus=setStatus;
function statusLabel(s){return s==='DRAFT'?'Rascunho':s==='ARCHIVED'?'Arquivado':'Ativo'}
function statusPill(s){var c=s==='ACTIVE'?'ok':s==='ARCHIVED'?'muted':'warn';return '<span class="sigs-v6-status-pill '+c+'">'+statusLabel(s)+'</span>'}

function openVersions(){
  var pid=projectId();if(!pid){notify('Abre um projeto primeiro.');return;}
  closeOverlay('sigs-v6-versions');var o=document.createElement('div');o.id='sigs-v6-versions';o.className='sigs-v6-overlay';
  o.innerHTML='<div class="sigs-v6-dialog wide" role="dialog" aria-modal="true" aria-label="Gravações do projeto"><div class="sigs-v6-dialog-head"><div><div class="sigs-v6-dialog-title">Gravações do projeto</div><div class="sigs-v6-dialog-sub">Cópias automáticas a cada 10 minutos enquanto trabalhas na app. As gravações manuais ficam separadas e são preservadas.</div></div><button class="sigs-v6-x" aria-label="Fechar">✕</button></div><div class="sigs-v6-dialog-foot"><button class="sag-btn primary" id="v6-save-now">Gravar manualmente</button><select id="v6-save-filter" aria-label="Tipo de gravação"><option value="ALL">Todas</option><option value="MANUAL">Manuais</option><option value="AUTO">Automáticas</option></select></div><div id="v6-version-list" class="sigs-v6-list"><div class="sigs-v6-loading">A carregar gravações…</div></div></div>';
  document.body.appendChild(o);var closed=false,rows=[];
  function close(){closed=true;o.remove();document.removeEventListener('keydown',keys);}
  function keys(e){if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){var ns=[...o.querySelectorAll('button:not(:disabled),select')];if(e.shiftKey&&document.activeElement===ns[0]){e.preventDefault();ns.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===ns.at(-1)){e.preventDefault();ns[0].focus();}}}
  o.__close=close;o.querySelector('.sigs-v6-x').onclick=close;o.onclick=function(e){if(e.target===o)close();};document.addEventListener('keydown',keys);o.querySelector('.sigs-v6-x').focus();
  var host=o.querySelector('#v6-version-list'),filter=o.querySelector('#v6-save-filter'),save=o.querySelector('#v6-save-now');
  function label(reason){return reason==='MANUAL'?'Gravação manual':reason==='AUTO'?'Cópia automática':reason==='PRE_RESTORE'?'Cópia de segurança antes de retomar':reason;}
  function paint(){if(closed||pid!==projectId())return;var visible=rows.filter(function(v){return filter.value==='ALL'||v.reason===filter.value;});host.innerHTML=visible.length?visible.map(function(v){return '<div class="sigs-v6-version"><div><b>'+esc(label(v.reason))+' · '+fmtDate(v.created_at)+'</b><div>Versão '+v.version_no+'</div></div><button class="sag-btn" data-restore="'+esc(v.id)+'" '+(V6.currentStatus==='ARCHIVED'?'disabled':'')+'>Retomar</button></div>';}).join(''):'<div class="sigs-v6-empty">Ainda não existem gravações deste tipo.</div>';
    host.querySelectorAll('[data-restore]').forEach(function(button){button.onclick=async function(){if(pid!==projectId()||V6.saving||V6.restoring){notify('Aguarda a gravação em curso.');return;}if(!confirm('Retomar esta gravação? O trabalho atual fica numa cópia de segurança, disponível em Todas.'))return;
      V6.restoring=true;button.disabled=true;try{await rpc('sigs_resume_project_version',{p_version:button.getAttribute('data-restore'),p_patch:buildPatch()});if(pid===projectId()){await loadProject(pid,CLOUD.projectName);close();notify('Gravação retomada.');}}catch(e){notify('Erro ao retomar: '+e.message);}finally{V6.restoring=false;button.disabled=false;}
    };});
  }
  async function refresh(){try{var cfg=sb();rows=await api(cfg.url+'/rest/v1/project_versions?select=id,version_no,reason,saved_by,created_at&project_id=eq.'+encodeURIComponent(pid)+'&order=version_no.desc',{headers:h()});paint();}catch(e){if(!closed)host.innerHTML='<div class="sigs-v6-empty">Erro: '+esc(e.message)+'</div>';}}
  filter.onchange=paint;save.onclick=async function(){if(pid!==projectId())return;save.disabled=true;try{var result=await saveProject('manual');if(result)await refresh();}catch(e){}finally{save.disabled=false;}};refresh();
}
window.sigsV6OpenVersions=openVersions;

function deleteProject(id,name){if(!confirm('Apagar definitivamente "'+name+'"?'))return;var cfg=sb();return api(cfg.url+'/rest/v1/projects?id=eq.'+encodeURIComponent(id),{method:'DELETE',headers:h()}).then(function(){if(CLOUD.projectId===id){CLOUD.projectId=null;CLOUD.projectName=null;V6.currentStatus=null;V6.dirty=false;}if(typeof notify==='function')notify('Projeto apagado.');renderProjectManager();if(typeof loadContext==='function')loadContext().catch(function(){});});}
window.cloudDeleteProject=deleteProject;

function projectManagerShell(){
  return '<div class="sigs-v6-project-head"><div><div class="sigs-v6-dialog-title">Projetos da empresa</div><div class="sigs-v6-dialog-sub">Rascunhos, projetos ativos, arquivo, duplicação e histórico.</div></div><div class="sigs-v6-project-actions"><button class="sag-btn" id="v6-close-projects">Fechar</button><button class="sag-btn primary" id="v6-new-project-btn">＋ Novo projeto</button></div></div><div class="sigs-v6-filters"><input id="v6-project-search" placeholder="Pesquisar projeto ou cliente…"><select id="v6-project-status"><option value="">Todos os estados</option><option value="DRAFT">Rascunho</option><option value="ACTIVE">Ativo</option><option value="ARCHIVED">Arquivado</option></select></div><div id="v6-project-list" class="sigs-v6-list"><div class="sigs-v6-loading">A carregar projetos…</div></div>';
}
function openProjectManager(module){
  V6.managerModule=module==='alarm'?'INTRUSION':module==='fire'?'FIRE':module==='cctv'||module==='disk'?'CCTV':'';
  var modal=ge('m-cloud'),body=ge('cloud-body');if(!modal||!body)return;modal.style.display='flex';body.innerHTML=projectManagerShell();
  ge('v6-close-projects').onclick=closeCloud;ge('v6-new-project-btn').onclick=function(){closeCloud();openNewProjectWizard(null,V6.managerModule);};
  ge('v6-project-search').oninput=renderManagerRows;ge('v6-project-status').onchange=renderManagerRows;renderProjectManager();
}
window.openCloud=openProjectManager;
function renderProjectManager(){
  var cfg=sb(),host=ge('v6-project-list');if(!host)return;host.innerHTML='<div class="sigs-v6-loading">A carregar projetos…</div>';
  _sigsEnsureContext().then(function(ctx){var co=ctx.company&&ctx.company.id;return api(cfg.url+'/rest/v1/projects?select=id,name,customer_name,customer_company,module,status,camera_count,detector_count,fire_detector_count,floor_count,created_by,assigned_to,updated_at,last_saved_at,version_no&order=updated_at.desc'+(co?'&company_id=eq.'+encodeURIComponent(co):'')+(V6.managerModule?'&module=eq.'+V6.managerModule:''),{headers:h()});}).then(function(rows){V6.manager=rows||[];renderManagerRows();}).catch(function(e){host.innerHTML='<div class="sigs-v6-empty">Erro: '+esc(e.message)+'</div>';});
}
function renderManagerRows(){
  var host=ge('v6-project-list');if(!host)return;var q=((ge('v6-project-search')||{}).value||'').toLowerCase(),st=((ge('v6-project-status')||{}).value||'');var rows=(V6.manager||[]).filter(function(p){if(st&&p.status!==st)return false;var t=[p.name,p.customer_name,p.customer_company,p.module].join(' ').toLowerCase();return !q||t.indexOf(q)>=0;});
  if(!rows.length){host.innerHTML='<div class="sigs-v6-empty">Nenhum projeto encontrado.</div>';return;}
  host.innerHTML=rows.map(function(p){var n=(p.camera_count||0)+(p.detector_count||0)+(p.fire_detector_count||0),cur=p.id===projectId();return '<div class="sigs-v6-project-row '+(cur?'current':'')+'"><div class="main"><div class="name">'+esc(p.name)+(cur?' <span>• atual</span>':'')+'</div><div class="meta">'+esc(p.module)+' · '+n+' itens · '+(p.floor_count||1)+' piso(s) · '+fmtDate(p.updated_at)+'</div><div class="client">'+esc(p.customer_name||p.customer_company||'Sem cliente definido')+'</div></div><div>'+statusPill(p.status)+'</div><div class="actions"><button data-open="'+p.id+'" class="sag-btn">Abrir</button><button data-dup="'+p.id+'" class="sag-btn">Duplicar</button><select data-status="'+p.id+'"><option value="DRAFT" '+(p.status==='DRAFT'?'selected':'')+'>Rascunho</option><option value="ACTIVE" '+(p.status==='ACTIVE'?'selected':'')+'>Ativo</option><option value="ARCHIVED" '+(p.status==='ARCHIVED'?'selected':'')+'>Arquivado</option></select><button data-del="'+p.id+'" data-name="'+esc(p.name).replace(/\"/g,'&quot;')+'" class="sag-btn danger">Apagar</button></div></div>';}).join('');
  host.querySelectorAll('[data-open]').forEach(function(b){b.onclick=function(){var p=(V6.manager||[]).find(function(x){return x.id===b.getAttribute('data-open')});cloudOpenProject(b.getAttribute('data-open'),p&&p.name);};});
  host.querySelectorAll('[data-dup]').forEach(function(b){b.onclick=function(){duplicateProject(b.getAttribute('data-dup')).then(renderProjectManager);};});
  host.querySelectorAll('[data-status]').forEach(function(s){s.onchange=function(){setStatus(this.getAttribute('data-status'),this.value).then(renderProjectManager);};});
  host.querySelectorAll('[data-del]').forEach(function(b){b.onclick=function(){deleteProject(this.getAttribute('data-del'),this.getAttribute('data-name'));};});
}

function closeCloud(){var m=ge('m-cloud');if(m)m.style.display='none';}
window.closeCloud=closeCloud;

function injectProjectMenu(){
  var menus=document.querySelectorAll('.sigs-v5-menu');if(!menus.length)return;var proj=menus[0]&&menus[0].querySelector('.sigs-v5-dropdown');if(!proj||proj.dataset.v6)return;proj.dataset.v6='1';
  var sep=document.createElement('div');sep.className='sigs-v5-sep';var vers=document.createElement('button');vers.type='button';vers.className='sigs-v5-item';vers.innerHTML='<span style="width:17px;text-align:center">🕘</span><span>Histórico de versões</span>';vers.onclick=function(){document.querySelectorAll('.sigs-v5-menu.open').forEach(function(m){m.classList.remove('open')});openVersions();};
  var dup=document.createElement('button');dup.type='button';dup.className='sigs-v5-item';dup.innerHTML='<span style="width:17px;text-align:center">⧉</span><span>Duplicar projeto atual</span>';dup.onclick=function(){document.querySelectorAll('.sigs-v5-menu.open').forEach(function(m){m.classList.remove('open')});duplicateProject();};
  proj.appendChild(sep);proj.appendChild(vers);proj.appendChild(dup);
}

function hookDirty(){
  if(window.__sigsV6DirtyHooked)return;window.__sigsV6DirtyHooked=true;
  if(typeof window.updateStats==='function'){var old=window.updateStats;window.updateStats=function(){var r=old.apply(this,arguments);setTimeout(markDirty,0);return r;};}
  if(typeof window._restoreProjectData==='function'){var restore=window._restoreProjectData;window._restoreProjectData=function(){V6.suppress=true;var r=restore.apply(this,arguments);setTimeout(function(){V6.suppress=false;V6.dirty=false;saveChip('clean');},250);return r;};}
  window.addEventListener('beforeunload',function(e){if(V6.dirty){e.preventDefault();e.returnValue='';}});
}
function init(){ensureSaveChip();injectProjectMenu();hookDirty();setInterval(function(){ensureSaveChip();injectProjectMenu();if(projectId()&&!V6.autoTimer)armAutosave();},30000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(init,120)});else setTimeout(init,120);
})();
