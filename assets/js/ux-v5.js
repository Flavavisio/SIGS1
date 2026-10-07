
(function(){
'use strict';

var V5={ready:false,orig:{},audit:[]};

function el(id){return document.getElementById(id);}
function safeCall(name,args){
  try{
    var fn=window[name];
    if(typeof fn==='function')return fn.apply(window,args||[]);
  }catch(err){console.error('[SIGS V5]',name,err);if(typeof notify==='function')notify('Erro: '+err.message);}
}
function role(){
  return (window.CLOUD&&CLOUD.user&&CLOUD.user.role)||'SALES';
}
function canManageCatalog(){return role()==='ADMIN'||role()==='SUPER_ADMIN';}
function allPlaced(){
  try{
    if(typeof saveCurrentFloor==='function')saveCurrentFloor();
    if(window.FLOORS&&FLOORS.length){
      var a=[];FLOORS.forEach(function(f){a=a.concat(f.placed||[]);});return a;
    }
  }catch(e){}
  return (window.S&&S.placed)||[];
}
function deviceOf(p){try{return typeof gD==='function'?gD(p.libId):null;}catch(e){return null;}}
function isCam(d){return d&&['dome','bullet','ptz','fisheye','turret','thermal_bi'].indexOf(d.type)>=0;}

function menu(icon,label,items,cls){
  var wrap=document.createElement('div');wrap.className='sigs-v5-menu '+(cls||'');
  var b=document.createElement('button');b.type='button';b.className='sigs-v5-menu-btn';
  b.innerHTML='<span>'+icon+'</span><span class="menu-text">'+label+'</span><span style="font-size:7px;opacity:.6">▾</span>';
  var dd=document.createElement('div');dd.className='sigs-v5-dropdown';
  items.forEach(function(it){
    if(it.sep){var s=document.createElement('div');s.className='sigs-v5-sep';dd.appendChild(s);return;}
    if(it.labelOnly){var l=document.createElement('div');l.className='sigs-v5-label';l.textContent=it.labelOnly;dd.appendChild(l);return;}
    var x=document.createElement('button');x.type='button';x.className='sigs-v5-item';
    if(it.cctvOnly)x.dataset.cctvOnly='true';
    if(it.systemEntry)x.dataset.systemEntry='true';
    x.innerHTML='<span style="width:17px;text-align:center">'+(it.icon||'•')+'</span><span>'+it.label+'</span>';
    x.addEventListener('click',function(ev){ev.stopPropagation();closeMenus();if(it.fn)it.fn();});
    if(it.adminOnly&&!canManageCatalog())x.style.display='none';
    dd.appendChild(x);
  });
  b.addEventListener('click',function(ev){ev.stopPropagation();var was=wrap.classList.contains('open');closeMenus();if(!was)wrap.classList.add('open');});
  wrap.appendChild(b);wrap.appendChild(dd);return wrap;
}
function closeMenus(){document.querySelectorAll('.sigs-v5-menu.open').forEach(function(m){m.classList.remove('open');});}

function smartSave(){
  if(window.CLOUD&&CLOUD.user&&typeof cloudSaveCurrent==='function')cloudSaveCurrent();
  else if(typeof saveProj==='function')saveProj();
}
function newProject(){
  if(window.SIGS_V6&&SIGS_V6.dirty&&!confirm('O projeto atual tem alterações por guardar. Criar um novo projeto?'))return;
  try{if(typeof cloudNewProject==='function')cloudNewProject();}catch(e){}
  setTimeout(updateFlow,120);
}
function focusLibrary(){
  var s=el('lib-search');if(s){s.scrollIntoView({block:'center'});s.focus();}
  safeCall('setTool',['place']);
}
function openBudget(){safeCall('tab',['budget']);}
function openProjectSummary(){safeCall('tab',['stats']);}
function advancedCustom(){
  if(!canManageCatalog()){if(typeof notify==='function')notify('Equipamentos personalizados estão disponíveis apenas para Admin.');return;}
  safeCall('openAddDevice');
}
function toggleMapSmart(){
  var mw=el('mapwrap');
  if(mw&&getComputedStyle(mw).display!=='none')safeCall('closeMap');
  else safeCall('toggleMap');
}
function workflowAction(key){
  var map={
    project:function(){openProjectSummary();},
    plant:function(){safeCall('importFP');},
    scale:function(){safeCall('setTool',['scale']);},
    devices:function(){focusLibrary();},
    coverage:function(){openProjectSummary();},
    system:function(){safeCall('tab',['system']);},
    material:function(){safeCall('openBOM');},
    report:function(){safeCall('openPrintModal');}
  };
  if(map[key])map[key]();
}

function buildTopNav(){
  var top=el('top');if(!top||top.classList.contains('sigs-v5-ready'))return;
  top.classList.add('sigs-v5-ready');
  var nav=document.createElement('div');nav.className='sigs-v5-nav';

  nav.appendChild(menu('📁','Projeto',[
    {icon:'＋',label:'Novo projeto',fn:newProject},
    {icon:'☁️',label:'Guardar projeto',fn:smartSave},
    {sep:true},
    {icon:'🏢',label:'Pisos',fn:function(){safeCall('openFloorOverview');}},
    {icon:'🏗️',label:'Templates',fn:function(){safeCall('openTemplates');}},
    {sep:true},
    {labelOnly:'Backup / compatibilidade'},
    {icon:'⬇️',label:'Exportar cópia local',fn:function(){safeCall('saveProj');}},
    {icon:'⬆️',label:'Importar cópia local',fn:function(){var f=el('fi-proj');if(f)f.click();}}
  ],'primary'));

  nav.appendChild(menu('🗺️','Planta',[
    {icon:'🖼️',label:'Importar planta',fn:function(){safeCall('importFP');}},
    {icon:'🌍',label:'Mapa',fn:toggleMapSmart},
    {icon:'⛶',label:'Ajustar à vista',fn:function(){safeCall('fitView');}},
    {sep:true},
    {labelOnly:'Avançado'},
    {icon:'🔗',label:'URL / Clipboard',fn:function(){safeCall('openUrlImport');}},
    {icon:'⊞',label:'Snap to Grid',fn:function(){safeCall('toggleSnap');}},
    {icon:'🟢',label:'Google Maps API',fn:function(){safeCall('setGoogleMapKey');}}
  ]));

  nav.appendChild(menu('📐','Medições',[
    {icon:'📏',label:'Medir distância',fn:function(){safeCall('setTool',['meas']);}},
    {icon:'⚖️',label:'Definir escala',fn:function(){safeCall('setTool',['scale']);}},
    {icon:'🔌',cctvOnly:true,label:'Traçar rota de cabo',fn:function(){safeCall('startCableRoute');}},
    {sep:true},
    {icon:'↩',label:'Desfazer',fn:function(){safeCall('doUndo');}},
    {icon:'↪',label:'Refazer',fn:function(){safeCall('doRedo');}}
  ]));

  nav.appendChild(menu('🧠','Sistema',[
    {icon:'🖥️',systemEntry:true,label:'NVR / PoE / Rede',fn:function(){safeCall('tab',['system']);}},
    {icon:'🛡️',label:'Verificador técnico',fn:openAudit},
    {icon:'📊',label:'Resumo do projeto',fn:openProjectSummary}
  ]));

  nav.appendChild(menu('📋','Material & Orçamento',[
    {icon:'📋',label:'Lista de material (BOM)',fn:function(){safeCall('openBOM');}},
    {icon:'💶',label:'Orçamento',fn:openBudget}
  ]));

  nav.appendChild(menu('📄','Relatório técnico',[
    {icon:'🖨️',label:'Dossier técnico / PDF',fn:function(){safeCall('openPrintModal');}},
    {icon:'🖼️',label:'Exportar PNG',fn:function(){safeCall('exportPNG');}}
  ]));

  var present=document.createElement('div');present.className='sigs-v5-menu';
  var pb=document.createElement('button');pb.type='button';pb.className='sigs-v5-menu-btn';
  pb.innerHTML='<span>▶</span><span class="menu-text">Apresentar</span>';
  pb.addEventListener('click',function(){safeCall('enterPresentMode');});
  present.appendChild(pb);nav.appendChild(present);

  var audit=document.createElement('button');audit.type='button';audit.id='sigs-v5-audit-chip';audit.className='sigs-v5-audit-chip';
  audit.textContent='🛡 Verificar';audit.addEventListener('click',openAudit);nav.appendChild(audit);

  var theme=document.createElement('button');theme.type='button';theme.className='sigs-v5-theme sigs-theme-toggle';theme.title='Modo Dia / Noite';theme.textContent='◐';
  theme.addEventListener('click',function(){safeCall('toggleTheme');});nav.appendChild(theme);

  top.appendChild(nav);
  document.addEventListener('click',closeMenus);
}

function buildFlow(){
  var app=el('app'),top=el('top');if(!app||!top||el('sigs-v5-flow'))return;
  app.classList.add('sigs-v5-flow-on');
  var f=document.createElement('div');f.id='sigs-v5-flow';
  var steps=[
    ['project','Projeto'],['plant','Planta'],['scale','Escala'],['devices','Equipamentos'],
    ['coverage','Cobertura'],['system','Sistema'],['material','Material'],['report','Relatório']
  ];
  steps.forEach(function(s,i){
    if(i){var ar=document.createElement('span');ar.className='sigs-flow-arrow';ar.textContent='›';f.appendChild(ar);}
    var b=document.createElement('button');b.type='button';b.className='sigs-flow-step';b.dataset.key=s[0];
    b.innerHTML='<span class="num">'+(i+1)+'</span><span class="txt">'+s[1]+'</span>';
    b.addEventListener('click',function(){workflowAction(s[0]);});
    f.appendChild(b);
  });
  top.parentNode.insertBefore(f,top.nextSibling);
  updateFlow();
}

function currentFlowState(){
  var placed=allPlaced(),hasDevices=placed.length>0;
  var fp=!!(window.S&&S.fp);
  var scale=!!(window.S&&S.scale&&S.scale.ok);
  var sys=true;
  if((window.MOD||'cctv')==='cctv')sys=!!window.NVR_POS;
  if((window.MOD||'')==='alarm')sys=placed.some(function(p){var d=deviceOf(p);return d&&d.type==='hub';});
  if((window.MOD||'')==='fire')sys=placed.some(function(p){var d=deviceOf(p);return d&&d.type==='fire_central';});
  return {project:true,plant:fp,scale:scale,devices:hasDevices,coverage:hasDevices,system:sys,material:hasDevices,report:hasDevices};
}
function updateSpecialtyMenus(){
  var mod=window.MOD||'cctv',cctv=mod==='cctv';
  document.querySelectorAll('[data-cctv-only]').forEach(function(el){el.style.display=cctv?'':'none';});
  document.querySelectorAll('[data-system-entry]').forEach(function(el){
    el.lastElementChild.textContent=cctv?'NVR / PoE / Rede':mod==='fire'?'Sistema de incêndio':'Sistema de intrusão';
  });
  ['rpt-storage','rpt-nvr','rpt-poe','rpt-cable'].forEach(function(id){
    var el=document.getElementById(id);if(el){el.parentElement.style.display=cctv?'':'none';}
  });
}
function updateFlow(){
  updateSpecialtyMenus();
  var st=currentFlowState();
  var order=['project','plant','scale','devices','coverage','system','material','report'];
  var firstPending=null;
  order.forEach(function(k){if(firstPending===null&&!st[k])firstPending=k;});
  document.querySelectorAll('.sigs-flow-step').forEach(function(b){
    b.classList.remove('done','current');
    var k=b.dataset.key;if(st[k])b.classList.add('done');else if(k===firstPending)b.classList.add('current');
  });
  updateAuditChip();
}
window.sigsV5UpdateFlow=updateFlow;

function reorganizeRightPanel(){
  var tabs=document.querySelectorAll('#rp .tabs .tab');
  if(tabs.length>=4){
    tabs[0].textContent='Equipamento';
    tabs[1].textContent='Sistema';
    tabs[2].textContent='Projeto';
    tabs[3].textContent='Camadas';
  }
  var stats=el('tc-stats'),summary=el('proj-summary-panel'),nosel=el('nosel');
  if(stats&&summary&&!stats.dataset.v5){
    stats.dataset.v5='1';
    stats.innerHTML='';
    var head=document.createElement('div');head.className='sigs-project-tab-head';
    head.innerHTML='<div class="sigs-project-tab-title">📊 Resumo do Projeto</div><div class="sigs-project-tab-sub">Uma única vista com o estado técnico e os principais números.</div>';
    stats.appendChild(head);stats.appendChild(summary);
    var actions=document.createElement('div');actions.className='sigs-project-actions';
    actions.innerHTML='<button type="button" id="v5-go-system">🧠 Sistema</button><button type="button" id="v5-go-audit">🛡 Verificar</button><button type="button" id="v5-go-bom">📋 Material</button><button type="button" id="v5-go-report">📄 Relatório</button>';
    stats.appendChild(actions);
    var note=document.createElement('div');note.className='sigs-v5-note';note.textContent='Os detalhes de configuração ficam em Equipamento e Sistema. Esta área concentra apenas o resumo do projeto.';
    stats.appendChild(note);
    el('v5-go-system').onclick=function(){safeCall('tab',['system']);};
    el('v5-go-audit').onclick=openAudit;
    el('v5-go-bom').onclick=function(){safeCall('openBOM');};
    el('v5-go-report').onclick=function(){safeCall('openPrintModal');};
    if(nosel){
      Array.from(nosel.children).forEach(function(ch){
        if(ch.classList&&ch.classList.contains('stl')&&/Resumo/.test(ch.textContent))ch.style.display='none';
      });
    }
  }
}

function removeCrime(){
  document.querySelectorAll('.lau-card.crime').forEach(function(n){n.remove();});
  var v=document.querySelector('.lau-version');if(v)v.textContent='v5.0 · SIGS Studio · Workflow Técnico';
}

function restrictCatalogEditing(){
  if(V5.orig.openAddDevice)return;
  ['openAddDevice','openEditDevice','ctxLibEdit','ctxLibDup','ctxLibDel','openCtxLib'].forEach(function(n){V5.orig[n]=window[n];});
  if(V5.orig.openAddDevice)window.openAddDevice=function(){if(!canManageCatalog()){if(typeof notify==='function')notify('A biblioteca técnica só pode ser alterada por Admin.');return;}return V5.orig.openAddDevice.apply(this,arguments);};
  if(V5.orig.openEditDevice)window.openEditDevice=function(){if(!canManageCatalog()){if(typeof notify==='function')notify('A biblioteca técnica só pode ser alterada por Admin.');return;}return V5.orig.openEditDevice.apply(this,arguments);};
  ['ctxLibEdit','ctxLibDup','ctxLibDel'].forEach(function(n){if(V5.orig[n])window[n]=function(){if(!canManageCatalog()){if(typeof notify==='function')notify('Catálogo em modo só de leitura.');return;}return V5.orig[n].apply(this,arguments);};});
  if(V5.orig.openCtxLib)window.openCtxLib=function(){if(!canManageCatalog())return;return V5.orig.openCtxLib.apply(this,arguments);};
  document.querySelectorAll('[onclick*="openAddDevice"]').forEach(function(n){if(!canManageCatalog())n.style.display='none';});
}

function buildAuditModal(){
  if(el('sigs-audit-modal'))return;
  var m=document.createElement('div');m.id='sigs-audit-modal';
  m.innerHTML='<div class="sigs-audit-card">'+
    '<div class="sigs-audit-head"><div style="font-size:22px">🛡️</div><div><div class="title">Verificador Técnico do Projeto</div><div class="sub">Escala · catálogo · DORI · NVR · cabos · PoE · rede · armazenamento · Ajax · EN54</div></div><button class="sigs-audit-close" id="sigs-audit-close">✕</button></div>'+
    '<div class="sigs-audit-summary" id="sigs-audit-summary"></div>'+
    '<div class="sigs-audit-list" id="sigs-audit-list"></div>'+
  '</div>';
  document.body.appendChild(m);
  el('sigs-audit-close').onclick=function(){m.style.display='none';};
  m.addEventListener('click',function(e){if(e.target===m)m.style.display='none';});
}

function auditProject(){
  var out=[],placed=allPlaced(),cams=placed.filter(function(p){return isCam(deviceOf(p));});
  function add(sev,title,msg){out.push({sev:sev,title:title,msg:msg});}
  function floorStates(){
    if(!window.FLOORS||!FLOORS.length)return [];
    return FLOORS.map(function(f,i){return {name:f.name||('Piso '+i),scale:!!(f.scale&&f.scale.ok),plan:!!(f.fp&&(f.fp.imgData||f.fp.storagePath)),storage:!!(f.fp&&f.fp.storagePath)};});
  }
  function customCount(){return placed.filter(function(p){var d=deviceOf(p);return d&&d.custom;}).length;}

  if(!placed.length)add('info','Projeto','Ainda não existem equipamentos colocados.');
  var fs=floorStates();
  if(fs.length){
    fs.forEach(function(f){
      if(!f.plan)add('warning','Planta · '+f.name,'Não existe planta associada a este piso.');
      if(!f.scale)add('warning','Escala · '+f.name,'Escala não definida; distâncias, cabos e validações métricas ficam incompletos.');
      if(f.plan&&!f.storage&&window.CLOUD&&CLOUD.projectId)add('info','Storage · '+f.name,'A planta está incorporada no projeto. Reimporte-a na V7 para a guardar no Supabase Storage e reduzir o tamanho do JSON.');
    });
  } else {
    if(!window.S||!S.fp)add('warning','Planta','Não existe planta importada. Em projetos exteriores pode utilizar o mapa.');
    if(!window.S||!S.scale||!S.scale.ok)add('warning','Escala','Escala não definida. Cabos e distâncias não podem ser validados corretamente.');
  }
  var custom=customCount();if(custom)add('info','Catálogo técnico',custom+' equipamento(s) personalizado(s) não são validados contra a base técnica Supabase.');

  if((window.MOD||'cctv')==='cctv'&&cams.length){
    if(!window.NVR_POS)add('warning','NVR','Posição do NVR não definida; não é possível validar os percursos de cabo.');
    var poeEstimated=[],bitrateEstimated=[],doriMissing=[];
    if(window.S&&S.scale&&S.scale.ok&&window.NVR_POS&&typeof cableForCam==='function'){
      cams.forEach(function(p){
        var c=cableForCam(p);
        if(c&&c.cable>90)add('error','Cabo '+p.label,'Percurso estimado de '+c.cable.toFixed(1)+' m. Ultrapassa 90 m; considere fibra, extensor ou equipamento intermédio.');
        else if(c&&c.cable>80)add('warning','Cabo '+p.label,'Percurso de '+c.cable.toFixed(1)+' m. Está próximo do limite prático de Ethernet em cobre.');
      });
    }

    var maxMP=0,totalBW=0,totalGB=0;
    cams.forEach(function(p){
      var d=deviceOf(p)||{},mp=Number(p.mp||d.mp)||0,codec=p.codec||'ultra265b';maxMP=Math.max(maxMP,mp);
      var br=4;try{br=(typeof cameraNetworkMbps==='function')?cameraNetworkMbps(p):((BITRATE_TABLE[codec]||BITRATE_TABLE.h265)[mp]||4);}catch(e){}totalBW+=br;
      var days=Number(p.days)||30;if(days<30)add('warning','Retenção '+p.label,'Configurada para '+days+' dias, abaixo do objetivo de 30 dias deste projeto.');
      try{if(typeof calcStorage==='function')totalGB+=calcStorage(mp||4,codec,days,p).gb;}catch(e){}
      if(!p.netMbps)bitrateEstimated.push(p.label);
      try{if(typeof poeDeviceWatts==='function'&&poeDeviceWatts(p,d).source==='estimated')poeEstimated.push(p.label);}catch(e){}
      try{var lens=Number(p.lens||d.baseLens||2.8),dr=typeof doriCalc==='function'?doriCalc(d,lens):null;if(!dr||!isFinite(dr.i)||dr.i<=0||!Number(d.fov)||!mp)doriMissing.push(p.label);}catch(e){doriMissing.push(p.label);}
    });
    if(doriMissing.length)add('warning','DORI / Ótica',doriMissing.length+' câmara(s) sem dados suficientes para validar DORI: '+doriMissing.slice(0,5).join(', ')+(doriMissing.length>5?'…':''));
    else add('ok','DORI / Ótica','Todas as câmaras têm resolução e FOV suficientes para cálculo DORI.');
    if(poeEstimated.length)add('warning','Dados PoE',poeEstimated.length+' câmara(s) usam potência estimada por tipo, não consumo específico do modelo.');
    if(bitrateEstimated.length)add('info','Bitrate',bitrateEstimated.length+' câmara(s) usam bitrate automático. Para dimensionamento final pode definir o bitrate real do stream.');

    if(typeof suggestNVR==='function'){
      var nv=suggestNVR(cams.length,maxMP,totalBW);
      if(!nv.length)add('error','NVR','Nenhum NVR do catálogo atual suporta simultaneamente canais, resolução e largura de banda deste projeto.');
      else{
        var n=nv[0],reserve=n.ch-cams.length;
        if(reserve<2)add('warning','Reserva NVR','O '+n.name+' deixa apenas '+reserve+' canal/canais livres. Considere margem de expansão.');
        if(totalBW/n.bw>.80)add('warning','Largura de banda NVR','O tráfego estimado utiliza '+Math.round(totalBW/n.bw*100)+'% da largura de banda de entrada do '+n.name+'.');
        else add('ok','NVR','Recomendação do catálogo: '+n.name+' · '+reserve+' canais de reserva.');
        var hdds=window.SIGS_HDD_DB||[],maxHdd=hdds.reduce(function(m,x){return Math.max(m,Number(x.capacityTB)||0);},0);
        if(totalGB&&maxHdd&&n.hdd){
          var maxCap=n.hdd*maxHdd*1024;
          if(totalGB>maxCap)add('error','Armazenamento','O volume estimado '+fmtGB(totalGB)+' excede a capacidade máxima catalogada do '+n.name+' ('+n.hdd+' × '+maxHdd+' TB).');
          else add('ok','Armazenamento',fmtGB(totalGB)+' estimados · '+n.hdd+' baía(s) disponíveis no '+n.name+'.');
        }
      }
    }
    if(typeof calcPoE==='function'){
      try{
        var poe=calcPoE(cams);
        if(!poe.suggested||!poe.suggested.length)add('error','PoE','Nenhum switch do catálogo cumpre portas + potência com a margem configurada.');
        else{
          var sw=poe.suggested[0],occ=poe.totalWithMargin/sw.budget;
          if(occ>.85)add('warning','PoE','O switch '+sw.name+' fica a '+Math.round(occ*100)+'% do budget PoE.');
          else add('ok','PoE','Budget recomendado '+poe.totalWithMargin+' W · '+sw.name+' compatível.');
          if(poe.uplink&&poe.uplink.status==='warn')add('warning','Uplink','Tráfego agregado recomenda '+poe.uplink.name+'.');
          else if(poe.uplink)add('ok','Rede','Uplink recomendado: '+poe.uplink.name+'.');
        }
      }catch(e){add('info','PoE','Não foi possível executar a validação PoE completa: '+e.message);}
    }
  }

  if((window.MOD||'')==='alarm'&&placed.length){
    var hubs=placed.filter(function(p){var d=deviceOf(p);return d&&d.type==='hub';});
    var repeaters=placed.filter(function(p){var d=deviceOf(p);return d&&d.type==='repeater';});
    var sirens=placed.filter(function(p){var d=deviceOf(p);return d&&(d.type==='siren_int'||d.type==='siren_ext');});
    if(!hubs.length)add('error','Hub Ajax','O projeto de intrusão não contém um Hub.');
    else{
      add('ok','Hub Ajax',hubs.length+' Hub(s) presente(s) no projeto.');
      if(hubs.length===1){var hd=deviceOf(hubs[0])||{},m=String(hd.desc||'').match(/até\s+(\d+)\s+disp/i);if(m){var cap=Number(m[1]),used=placed.length-hubs.length;if(used>cap)add('error','Capacidade Hub',used+' dispositivos para uma capacidade catalogada de '+cap+'.');else if(used/cap>.85)add('warning','Capacidade Hub',used+'/'+cap+' dispositivos ('+Math.round(used/cap*100)+'%).');else add('ok','Capacidade Hub',used+'/'+cap+' dispositivos.');}else add('info','Capacidade Hub','O limite de dispositivos deste modelo ainda não está estruturado no catálogo técnico.');}
    }
    if(!sirens.length)add('warning','Sinalização de alarme','Não existe sirene interior ou exterior colocada no projeto.');
    if(repeaters.length)add('info','Repetidores Ajax',repeaters.length+' ReX/repetidor(es) colocado(s). A V7 ainda não calcula cobertura rádio por obstáculos.');
  }

  if((window.MOD||'')==='fire'&&placed.length){
    var central=placed.filter(function(p){var d=deviceOf(p);return d&&d.type==='fire_central';});
    var bat=placed.filter(function(p){var d=deviceOf(p);return d&&d.type==='fire_bat';});
    var mcp=placed.filter(function(p){var d=deviceOf(p);return d&&d.type==='fire_mcp';});
    var snd=placed.filter(function(p){var d=deviceOf(p);return d&&d.type==='fire_siren';});
    var det=placed.filter(function(p){var d=deviceOf(p);return d&&d.type==='fire';});
    if(!central.length)add('error','Central EN54','O projeto de incêndio não contém uma central.');
    else{add('ok','Central EN54',central.length+' central/centrais presente(s).');var cd=deviceOf(central[0])||{};if(/40 zonas/i.test(cd.desc||''))add('info','Zonas EN54','A central está catalogada com até 40 zonas; a atribuição de dispositivos por zona ainda não é modelada automaticamente.');}
    if(!bat.length)add('warning','Autonomia EN54','Não foi selecionada bateria 24 h ou 72 h no projeto.');else add('ok','Autonomia EN54',bat.map(function(p){return (deviceOf(p)||{}).name||p.label;}).join(', '));
    if(!mcp.length)add('warning','Botões manuais','Não existe botão de alarme manual colocado no projeto.');
    if(!snd.length)add('warning','Sinalização EN54','Não existe sirene/VAD colocada no projeto.');
    if(det.length)add('ok','Deteção EN54',det.length+' detetor(es) colocado(s).');
  }

  if(out.length&&!out.some(function(x){return x.sev==='error'||x.sev==='warning';})&&!out.some(function(x){return x.sev==='info';}))add('ok','Projeto','Sem alertas técnicos detetados nas verificações automáticas atuais.');
  V5.audit=out;return out;
}

function renderAudit(){
  var a=auditProject(),sum=el('sigs-audit-summary'),list=el('sigs-audit-list');
  var counts={error:0,warning:0,ok:0,info:0};a.forEach(function(x){counts[x.sev]++;});
  if(sum)sum.innerHTML=
    '<div class="sigs-audit-kpi"><div class="v" style="color:#ef4444">'+counts.error+'</div><div class="l">Críticos</div></div>'+
    '<div class="sigs-audit-kpi"><div class="v" style="color:#f59e0b">'+counts.warning+'</div><div class="l">Avisos</div></div>'+
    '<div class="sigs-audit-kpi"><div class="v" style="color:#10b981">'+counts.ok+'</div><div class="l">Conformes</div></div>'+
    '<div class="sigs-audit-kpi"><div class="v">'+allPlaced().length+'</div><div class="l">Equipamentos</div></div>';
  if(list){
    if(!a.length)list.innerHTML='<div class="sigs-audit-empty">✓ Sem alertas técnicos detetados.</div>';
    else list.innerHTML=a.map(function(x){
      var ico=x.sev==='error'?'⛔':x.sev==='warning'?'⚠️':x.sev==='ok'?'✓':'ℹ️';
      var lab=x.sev==='error'?'CRÍTICO':x.sev==='warning'?'AVISO':x.sev==='ok'?'OK':'INFO';
      return '<div class="sigs-audit-row"><div style="font-size:15px">'+ico+'</div><div><span class="sigs-audit-sev '+x.sev+'">'+lab+'</span></div><div class="sigs-audit-msg"><b>'+x.title+'</b><br>'+x.msg+'</div></div>';
    }).join('');
  }
  updateAuditChip(a);
}
function openAudit(){buildAuditModal();renderAudit();el('sigs-audit-modal').style.display='flex';}
window.sigsOpenTechnicalAudit=openAudit;

function updateAuditChip(existing){
  var c=el('sigs-v5-audit-chip');if(!c)return;
  var a=existing||auditProject(),err=a.filter(function(x){return x.sev==='error';}).length,w=a.filter(function(x){return x.sev==='warning';}).length;
  c.classList.remove('ok','warn','bad');
  if(err){c.classList.add('bad');c.textContent='🛡 '+err+' crítico'+(err>1?'s':'');}
  else if(w){c.classList.add('warn');c.textContent='🛡 '+w+' aviso'+(w>1?'s':'');}
  else{c.classList.add('ok');c.textContent='🛡 OK';}
}

function renameCloud(){
  var m=el('m-cloud');if(!m)return;
  var title=Array.from(m.querySelectorAll('div')).find(function(x){return x.childElementCount===0&&x.textContent.trim()==='Cloud SIGS Studio';});
  if(title)title.textContent='Projetos SIGS';
  var sub=Array.from(m.querySelectorAll('div')).find(function(x){return x.childElementCount===0&&/Projetos sincronizados/.test(x.textContent||'');});
  if(sub)sub.textContent='Guardar, abrir e gerir projetos da empresa';
}

function hookUpdates(){
  if(typeof window.updateStats==='function'&&!V5.orig.updateStats){
    V5.orig.updateStats=window.updateStats;
    window.updateStats=function(){
      var r=V5.orig.updateStats.apply(this,arguments);
      setTimeout(function(){updateFlow();},0);
      return r;
    };
  }
  if(typeof window.startModule==='function'&&!V5.orig.startModule){
    V5.orig.startModule=window.startModule;
    window.startModule=function(){
      var r=V5.orig.startModule.apply(this,arguments);
      setTimeout(function(){removeCrime();reorganizeRightPanel();restrictCatalogEditing();updateFlow();},100);
      return r;
    };
  }
}

function init(){
  if(V5.ready)return;V5.ready=true;
  removeCrime();
  buildTopNav();
  buildFlow();
  reorganizeRightPanel();
  buildAuditModal();
  restrictCatalogEditing();
  renameCloud();
  hookUpdates();
  updateFlow();
  setInterval(function(){if(el('app')&&getComputedStyle(el('app')).display!=='none'){updateFlow();restrictCatalogEditing();}},3500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(init,50);});
else setTimeout(init,50);

})();
