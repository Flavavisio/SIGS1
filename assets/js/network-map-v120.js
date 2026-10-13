/* Direct topology editing on the calibrated plant, exclusive to the Supreme licence. */
(function(root){'use strict';
const N=root.SIGSNetwork,M=root.SIGSNetworkMapModel,$=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>v==null?'Por medir':Number(v).toLocaleString('pt-PT',{maximumFractionDigits:1});
let mode=false,placing=null,source=null,selected=null,drag=null,popup=null,hideControls=false;
const locked=()=>root.SIGS_V6?.currentStatus==='ARCHIVED',net=()=>N.getNetwork(),floor=()=>root.FLOORS?.[root.FLOOR_CUR];
const editable=()=>N.allowed()&&!locked()&&!root.S.mapOpen&&root.S.scale?.ok&&!!floor();
const busy=()=>N.isDraft();
const visibleNodes=()=>net().nodes.filter(n=>n.floor===root.FLOOR_CUR&&Number.isFinite(n.x)&&Number.isFinite(n.y));
function camera(id,all=false){let fi=root.FLOOR_CUR,p=root.S.placed.find(p=>p.id===id);if(!p&&all)for(let i=0;i<root.FLOORS.length;i++){p=(root.FLOORS[i].placed||[]).find(p=>p.id===id);if(p){fi=i;break;}}const d=p&&root.gD(p.libId);return p&&['bullet','dome','turret','ptz','thermal_bi','fisheye','cube','doorbell'].includes(d?.type)?{...p,kind:'camera',floor:fi,name:p.label||p.id,device:d}:null;}
function entity(hit){return hit?.kind==='camera'?camera(hit.id,true):net().nodes.find(n=>n.id===hit?.id);}
function hitAt(e,includeCameras=mode){
 const at=root.ep(e),body=[],labels=[];
 for(const n of visibleNodes()){
  const p=root.w2s(n.x,n.y),distance=Math.hypot(at.x-p.x,at.y-p.y);if(distance<=27)body.push({id:n.id,kind:n.kind,distance});
  const width=Math.min(240,Math.max(40,String(n.name||'').length*7));if(at.x>=p.x+17&&at.x<=p.x+25+width&&Math.abs(at.y-p.y)<=15)labels.push({id:n.id,kind:n.kind,distance});
 }
 if(includeCameras&&root.S.layers?.dev!==0)for(const p of root.S.placed){const c=camera(p.id);if(!c||p.visible===false)continue;const atC=root.w2s(p.x,p.y),distance=Math.hypot(at.x-atC.x,at.y-atC.y);if(distance<=27)body.push({id:p.id,kind:'camera',distance});}
 return body.sort((a,b)=>a.distance-b.distance)[0]||labels.sort((a,b)=>a.distance-b.distance)[0]||null;
}
function clearPopup(){popup?.remove();popup=null;}
function clearSelection(){selected=null;$('net120-inspector')?.remove();}
function stop(){cancelDrag();mode=false;placing=null;source=null;clearPopup();clearSelection();$('net120-toolbar')?.remove();if(root.S.tool==='network-map')root.S.tool=null;root.cv.style.touchAction='';root.cw.style.cursor='default';}
function open(){
 if(!N.allowed())return;if(!editable()){root.notify(locked()?'Projeto arquivado.':'Define a escala e captura o mapa antes de editar a rede.');return;}
 stop();N.cancel();N.close();root.SIGSGeometryTools?.cancel();root.SIGSSceneTools?.cancel();root.SIGSEngineering?.cancel?.();root.sigsExitPlacementForEdit?.();root.deselect?.();mode=true;root.S.tool='network-map';root.render();
}
function select(hit){if(!N.allowed())return;selected=hit;placing=null;source=null;root.sigsExitPlacementForEdit?.();if(hit.kind==='camera')root.select?.(hit.id);else root.deselect?.();renderPanel();root.render();}
function startPlace(kind){if(!editable()||!mode||!['switch','nvr'].includes(kind))return;clearPopup();clearSelection();source=null;placing=kind;root.S.tool='network-map';root.render();}
function startConnect(hit=null){if(!editable()||!mode)return;clearPopup();placing=null;source=hit||'choose';root.S.tool='network-map';root.render();}
function place(q){
 if(!editable()||!placing)return;const kind=placing,id=root.uid(),n=net(),used=new Set(n.nodes.map(x=>x.name));let index=1;while(used.has((kind==='switch'?'SW':'NVR')+'-'+index))index++;
 const node={id,kind,name:(kind==='switch'?'SW':'NVR')+'-'+index,reference:'',floor:root.FLOOR_CUR,floorId:floor().id,x:q.x,y:q.y,spec:{}};
 if(N.update(n=>{n.nodes.push(node);n.enabled=true;})){placing=null;selected={id,kind};renderPanel();}
}
function directRoute(a,b){return a.floor===b.floor?[{floor:a.floor,floorId:root.FLOORS[a.floor]?.id,anchor:'a',points:[{x:a.x,y:a.y},{x:b.x,y:b.y}]}]:[];}
function inferredDestinations(n){for(const a of Object.values(n.assignments)){if(a.nvrId)continue;const candidates=M.recorders(n,a.switchId);if(candidates.length===1)a.nvrId=candidates[0].id;}}
function options(items,current){return items.map(([value,label])=>'<option value="'+esc(value)+'" '+(String(value)===String(current)?'selected':'')+'>'+esc(label)+'</option>').join('');}
function spec(n){return root.SIGSNetworkModel.spec(n,n.kind==='switch'?N.catalogs().switches:N.catalogs().nvrs);}
function newConnection(aHit,bHit){
 if(!editable())return;let a=entity(aHit),b=entity(bHit);if(!a||!b||a.id===b.id){root.notify('Escolhe dois equipamentos diferentes.');return;}
 if(b.kind==='camera'){[a,b]=[b,a];}
 const isCamera=a.kind==='camera';if(b.kind==='camera'||(!isCamera&&a.kind==='nvr'&&b.kind==='nvr')){root.notify('Liga a câmara a um switch ou gravador, ou um switch a outro equipamento.');return;}
 if(isCamera&&a.device?.connection==='wifi'){root.notify('Esta câmara liga por Wi-Fi. Configura o ponto de acesso em Rede → Câmaras.');return;}
 const n=net(),existing=isCamera?n.assignments[a.id]:n.links.find(l=>(l.a===a.id&&l.b===b.id)||(l.a===b.id&&l.b===a.id));
 if(!isCamera&&M.path(n,a.id,b.id,existing?.id)){root.notify('Já existe um caminho entre estes equipamentos. Revê a topologia antes de criar um ciclo.');return;}
 if(!isCamera&&existing&&existing.a!==a.id){[a,b]=[b,a];}
if(existing?.members>1){root.notify('Esta ligação usa LACP. Edita as portas em Rede → Ligações.');return;}
 clearPopup();popup=document.createElement('dialog');popup.id='net120-connection';popup.className='net120-connection';
 const sameExisting=isCamera?existing?.switchId===b.id:!!existing;
 const oldLink=isCamera?(sameExisting?existing.link||{}:{}):existing||{},medium=oldLink.medium||'copper';
 popup.innerHTML='<form><header><h3>'+esc(a.name)+' → '+esc(b.name)+'</h3><button type="button" data-cancel class="btn bg bsm">Cancelar</button></header><p>Escolhe as portas. O percurso inicial é direto; podes traçá-lo pelas paredes depois.</p><div class="net60-fields">'+
 '<label>Tipo de cabo<select name="medium">'+options([['copper','Cobre'],['fiber','Fibra']],medium)+'</select></label>'+(!isCamera?'<label>Grupo de portas · '+esc(a.name)+'<select name="poolA"></select></label>':'')+
 '<label>Grupo de portas · '+esc(b.name)+'<select name="poolB"></select></label>'+(!isCamera?'<label>Porta · '+esc(a.name)+'<input name="portA" type="number" min="1" step="1" required></label>':'')+
 '<label>Porta · '+esc(b.name)+'<input name="portB" type="number" min="1" step="1" required></label>'+ (isCamera?'<label>Gravador de destino<select name="nvrId"></select></label><label class="net60-check"><input name="externalPower" type="checkbox" '+(existing?.externalPower?'checked':'')+'>Alimentação local / externa</label>':'')+
 '</div><p data-ports></p><p data-error role="alert"></p><footer><button type="submit" class="btn ba">Guardar ligação</button></footer></form>';
 document.body.appendChild(popup);if(popup.showModal)popup.showModal();else popup.setAttribute('open','');
 const form=popup.querySelector('form'),field=name=>form.elements.namedItem(name),exclude=isCamera?{cameraId:a.id}:{linkId:existing?.id};
 const oldPool=end=>isCamera?existing?.pool||(b.kind==='nvr'?'poe':'shared'):existing?.[(existing.a===a.id?end:end==='A'?'B':'A')==='A'?'poolA':'poolB']||'shared';
 const oldPort=end=>isCamera?existing?.port:existing?.[(existing.a===a.id?end:end==='A'?'B':'A')==='A'?'portA':'portB'];
 function groups(node,cam){if(field('medium').value==='fiber')return [['shared','SFP / SFP+']];if(node.kind==='nvr')return cam?[['poe','PoE integrado'],['shared','LAN']]:[['shared','LAN']];return cam?[['shared','RJ45 / PoE']]:[['shared','RJ45'],['uplink','Uplink dedicado']];}
 function refresh(reset){const notices=[];for(const [node,end] of isCamera?[[b,'B']]:[[a,'A'],[b,'B']]){
   const pool=field('pool'+end),ports=field('port'+end),choices=groups(node,isCamera);if(reset){const preferred=sameExisting?oldPool(end):!isCamera&&node.kind==='switch'&&spec(node).uplinkPorts>0?'uplink':choices[0][0];pool.innerHTML=options(choices,preferred);if(!pool.value)pool.selectedIndex=0;}
   const free=M.freePorts(net(),node,spec(node),field('medium').value,pool.value,exclude);ports.removeAttribute('max');if(free.limit!==null)ports.max=String(free.limit);
   ports.value=String(reset&&sameExisting&&oldPort(end)||free.ports[0]||'');
   notices.push(node.name+': '+(free.unconfirmed?'numeração/capacidade por confirmar; indica a porta utilizada.':free.ports.length+' portas livres neste grupo.'));
  }form.querySelector('[data-ports]').textContent=notices.join(' ');
 }
 if(isCamera){const candidates=M.recorders(n,b.id),items=[['','Por atribuir — ligar a rede ao gravador'],...candidates.map(x=>[x.id,x.name])];if(existing?.nvrId&&!items.some(x=>x[0]===existing.nvrId)){const dst=n.nodes.find(x=>x.id===existing.nvrId);if(dst)items.push([dst.id,dst.name+' · sem caminho atual']);}field('nvrId').innerHTML=options(items,existing?.nvrId|| (candidates.length===1?candidates[0].id:''));}
 refresh(true);field('medium').onchange=()=>refresh(true);for(const name of ['poolA','poolB'])if(field(name))field(name).onchange=()=>refresh(false);
 popup.querySelector('[data-cancel]').onclick=clearPopup;popup.addEventListener('cancel',clearPopup);
 form.onsubmit=e=>{e.preventDefault();if(!editable()||!form.checkValidity())return;const current=net(),aNow=isCamera?camera(a.id,true):current.nodes.find(x=>x.id===a.id),bNow=current.nodes.find(x=>x.id===b.id);const error=form.querySelector('[data-error]');
  if(!aNow||!bNow){error.textContent='Um dos equipamentos já não existe.';return;}const medium=field('medium').value;
  for(const [node,end] of isCamera?[[bNow,'B']]:[[aNow,'A'],[bNow,'B']]){const message=M.portError(current,node,spec(node),medium,field('pool'+end).value,field('port'+end).value,exclude);if(message){error.textContent=node.name+': '+message;return;}}
  if(!isCamera&&M.path(current,a.id,b.id,existing?.id)){error.textContent='Esta ligação criaria um ciclo na rede.';return;}
  const link={...oldLink,medium,routes:sameExisting?oldLink.routes||directRoute(aNow,bNow):directRoute(aNow,bNow),lengthM:sameExisting?oldLink.lengthM??null:null,patchM:oldLink.patchM??2,slackPercent:oldLink.slackPercent??10};
  if(N.update(data=>{
   data.enabled=true;if(isCamera){data.assignments[a.id]={...existing,switchId:b.id,nvrId:field('nvrId').value,port:field('portB').value,pool:field('poolB').value,externalPower:field('externalPower').checked,link:{...link,verticalM:sameExisting&&link.verticalM!=null?link.verticalM:aNow.floor===bNow.floor?aNow.instHeight||3:null}};}
   else {const item={...link,id:existing?.id||root.uid(),name:existing?.name||a.name+' → '+b.name,a:a.id,b:b.id,members:1,poolA:field('poolA').value,poolB:field('poolB').value,portA:field('portA').value,portB:field('portB').value};if(existing){const index=data.links.findIndex(l=>l.id===existing.id);data.links[index]=item;}else data.links.push(item);}
   inferredDestinations(data);
  })){clearPopup();source=null;selected={id:a.id,kind:a.kind};root.render();}
 };
}
function tap(e){
 if(!N.allowed()||root.S.mapOpen||busy())return false;const hit=hitAt(e);
 if(mode){if(!editable())return true;if(source){if(hit){if(source==='choose'){source=hit;placing=null;root.render();}else newConnection(source,hit);}else root.notify('Clica na câmara, switch ou gravador de destino.');return true;}
  if(hit){select(hit);return true;}if(placing){const pos=root.ep(e);place(root.s2w(pos.x,pos.y));return true;}clearSelection();root.render();return true;
 }if(hit&&hit.kind!=='camera'&&(!root.S.tool||root.S.tool==='place')){select(hit);return true;}return false;
}
function renderPanel(){
 $('net120-toolbar')?.remove();$('net120-inspector')?.remove();if(!N.allowed()){if(mode||selected||drag)stop();return;}if(busy())return;
 if(mode){const bar=document.createElement('div');bar.id='net120-toolbar';bar.innerHTML='<b>Rede na planta</b><button data-place="switch" class="btn bg bsm">+ Switch</button><button data-place="nvr" class="btn bg bsm">+ Gravador</button><button data-connect class="btn ba bsm">Ligar equipamentos</button><button data-exit class="btn bg bsm">Sair</button><small>'+esc(placing?'Clica num ponto livre para colocar '+(placing==='switch'?'o switch.':'o gravador.'):source?source==='choose'?'Escolhe o primeiro equipamento.':'Agora escolhe o destino.':'Seleciona um equipamento para configurar ou arrasta-o para mover.')+'</small>';document.body.appendChild(bar);bar.querySelectorAll('[data-place]').forEach(b=>b.onclick=()=>startPlace(b.dataset.place));bar.querySelector('[data-connect]').onclick=()=>startConnect();bar.querySelector('[data-exit]').onclick=()=>{stop();root.render();};if(locked())bar.querySelectorAll('button:not([data-exit])').forEach(b=>b.disabled=true);}
 const item=entity(selected);if(!item){selected=null;return;}const panel=document.createElement('aside');panel.id='net120-inspector';panel.setAttribute('aria-label','Equipamento de rede');
 const analysis=N.snapshot(),row=item.kind==='camera'?analysis.cameras.find(x=>x.id===item.id):analysis.nodes.find(x=>x.id===item.id),trace=item.kind==='camera'?M.trace(net(),item.id):null;
 const destination=item.kind==='camera'?net().nodes.find(n=>n.id===row?.assignment.switchId):null,crossFloor=destination&&destination.floor!==item.floor;
const pathLabel=trace?[item.name,...trace.nodes.map(id=>net().nodes.find(n=>n.id===id)?.name||id)].join(' → '):'Caminho até ao gravador por completar.';
 const linked=item.kind==='camera'?[]:net().links.filter(l=>l.a===item.id||l.b===item.id);
 panel.innerHTML='<header><h3>'+esc(item.name)+'</h3><button data-close class="btn bg bsm" aria-label="Fechar equipamento">×</button></header><small>'+esc(item.kind==='camera'?'Câmara':item.kind==='switch'?'Switch':'Gravador')+' · '+esc(root.FLOORS[item.floor]?.name||'')+'</small>'+
 (item.kind==='camera'?'<p>'+esc(pathLabel)+'</p><p>Porta no destino: '+esc(row?.assignment?.port||'Por atribuir')+'</p><p>'+fmt(row?.length.total)+' m de cabo até ao primeiro equipamento</p>':'<p>'+esc(item.reference||'Seleciona o modelo para confirmar as capacidades.')+'</p><label>Modelo<select data-model>'+options([['','Selecionar modelo'],...([...N.catalogs()[item.kind==='switch'?'switches':'nvrs']].map(d=>[d.reference||d.name,d.reference||d.name])),...(!item.reference||N.catalogs()[item.kind==='switch'?'switches':'nvrs'].some(d=>(d.reference||d.name)===item.reference)?[]:[[item.reference,item.reference+' · fora do catálogo']])],item.reference)+'</select></label><p>'+esc(item.kind==='switch'?(row?.cameras.length||0)+' câmaras · '+fmt(row?.watts)+' W':(row?.recordings.length||0)+' câmaras gravadas · '+fmt(row?.bandwidth)+' Mbps')+'</p>')+
 '<div class="net60-actions"><button data-link class="btn ba bsm">Ligar a…</button><button data-config class="btn bg bsm">Configurar</button>'+(item.kind==='camera'&&net().assignments[item.id]?'<button data-route-camera class="btn bg bsm">Traçar cabo</button>'+(crossFloor?'<button data-route-destination class="btn bg bsm">Traçar no destino</button>':''):'')+'</div>'+linked.map(l=>'<div class="net120-link"><span>'+esc(l.name)+'<small>'+fmt(analysis.links.find(x=>x.id===l.id)?.length.total)+' m · '+esc(l.medium==='fiber'?'Fibra':'Cobre')+' · portas '+esc(l.portA||'?')+' ↔ '+esc(l.portB||'?')+'</small></span><button data-route="'+esc(l.id)+'" class="btn bg bsm">Percurso</button></div>').join('')+
 (crossFloor?'<label>Vertical entre pisos (m)<input data-vertical type="number" min="0" step="0.1" value="'+esc(row.assignment.link?.verticalM??'')+'"></label>':'')+'<p class="net120-status">'+esc(row?.status==='error'?'Rever portas, capacidade e caminho na validação da rede.':row?.status==='unknown'?'Existem capacidades ou medidas por confirmar.':row?.status==='warn'?'Rever as condições indicadas na validação.':'Dimensionamento sem erros detetados.')+'</p>';
 document.body.appendChild(panel);panel.querySelector('[data-close]').onclick=()=>{clearSelection();root.render();};panel.querySelector('[data-link]').onclick=()=>{if(!mode){open();selected={id:item.id,kind:item.kind};}startConnect(selected);};
 panel.querySelector('[data-config]').onclick=()=>{if(item.kind==='camera')N.open('cameras');else N.editNode(item.id);};
 const model=panel.querySelector('[data-model]');if(model){model.disabled=locked();model.onchange=()=>{N.update(n=>{const node=n.nodes.find(x=>x.id===item.id);node.reference=model.value;node.spec={};});};}
 function route(kind,id){if(!editable())return;clearSelection();N.begin(kind,id);root.render();}
 panel.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>route('route-link',b.dataset.route));const routeCam=panel.querySelector('[data-route-camera]');if(routeCam)routeCam.onclick=()=>route('route-camera',item.id);const destRoute=panel.querySelector('[data-route-destination]');if(destRoute)destRoute.onclick=()=>route('route-camera-destination',item.id);const vertical=panel.querySelector('[data-vertical]');if(vertical){vertical.disabled=locked();vertical.onchange=()=>{if(!vertical.checkValidity())return;const value=vertical.value===''?null:Number(vertical.value);N.update(n=>{n.assignments[item.id].link.verticalM=value;});};}
 if(locked())panel.querySelectorAll('[data-link],[data-route],[data-route-camera],[data-route-destination]').forEach(b=>b.disabled=true);
}
function cancelDrag(){if(!drag)return;const d=drag;drag=null;const n=root.SIGS_COMMERCIAL.network?.nodes.find(n=>n.id===d.hit.id);if(n){n.x=d.before.x;n.y=d.before.y;}try{root.cv.releasePointerCapture(d.pointerId);}catch(_){}root.cv.style.touchAction='';}
function start(e,pointer){
 if(![root.cv,root.bgcv,root.cw].includes(e.target)||e.button!==0||e.isPrimary===false||e.altKey||e.ctrlKey||e.metaKey||!N.allowed()||root.S.mapOpen||busy()||popup||drag)return;
 if(!mode&&root.S.tool&&root.S.tool!=='place')return;const hit=hitAt(e);
 if(!mode&&!hit)return;if(!mode&&hit?.kind==='camera')return;
 e.preventDefault();e.stopImmediatePropagation();if(pointer)root.SIGSCanvasGesture?.claimPointer();root.sigsExitPlacementForEdit?.();
 drag={pointerId:pointer?e.pointerId:null,pointer,hit,down:{x:e.clientX,y:e.clientY},zoom:root.S.zoom,floorRef:floor(),before:hit&&hit.kind!=='camera'?{x:entity(hit).x,y:entity(hit).y}:null,started:false,threshold:e.pointerType==='touch'?8:5};
 if(pointer)try{root.cv.setPointerCapture(e.pointerId);}catch(_){}root.cv.style.touchAction='none';
}
function move(e,pointer){if(!drag||drag.pointer!==pointer||pointer&&e.pointerId!==drag.pointerId)return;e.preventDefault();e.stopImmediatePropagation();
 if(!editable()||floor()!==drag.floorRef){cancelDrag();root.render();return;}
 if(source||placing||!drag.before)return;const dx=e.clientX-drag.down.x,dy=e.clientY-drag.down.y;
 if(!drag.started&&Math.hypot(dx,dy)<=drag.threshold)return;
 if(!drag.started){root.pushUndo();drag.started=true;selected=drag.hit;}
 const node=root.SIGS_COMMERCIAL.network?.nodes.find(n=>n.id===drag.hit.id);if(!node){cancelDrag();return;}node.x=drag.before.x+dx/drag.zoom;node.y=drag.before.y+dy/drag.zoom;root.cw.style.cursor='grabbing';root.render();
}
function end(e,pointer,cancel=false){if(!drag||drag.pointer!==pointer||pointer&&e.pointerId!==drag.pointerId)return;e.preventDefault();e.stopImmediatePropagation();const d=drag;
 if(cancel||!N.allowed()||locked()||floor()!==d.floorRef){cancelDrag();root.render();return;}
 drag=null;try{root.cv.releasePointerCapture(d.pointerId);}catch(_){}root.cv.style.touchAction='';root.cw.style.cursor='default';
 if(d.started){root.saveCurrentFloor();root.sigsV6MarkDirty?.();root.render();}else if(Math.hypot(e.clientX-d.down.x,e.clientY-d.down.y)<=d.threshold)tap(e);
 if(!pointer)root.SIGSCanvasGesture?.claimPointer();
}
function anchored(routes,a,b){return (routes||[]).map(r=>{const points=r.points.map(p=>({...p}));if(points.length&&r.anchor==='b'&&b?.floor===r.floor)points[0]={x:b.x,y:b.y};else if(points.length&&a?.floor===r.floor)points[0]={x:a.x,y:a.y};if(points.length&&a?.floor===r.floor&&b?.floor===r.floor)points[points.length-1]={x:b.x,y:b.y};return {...r,points};});}
function draw(){
 if(!N.allowed()||root.S.mapOpen)return;const n=net(),trace=selected?.kind==='camera'?M.trace(n,selected.id):null,context=root.ctx;
 const stroke=(routes,color,width)=>{context.strokeStyle=color;context.lineWidth=width;for(const r of routes){if(r.floor!==root.FLOOR_CUR)continue;context.beginPath();r.points.forEach((p,i)=>{const q=root.w2s(p.x,p.y);if(i)context.lineTo(q.x,q.y);else context.moveTo(q.x,q.y);});context.stroke();}};
 context.save();context.setLineDash([]);
 if(trace&&!hideControls){const c=camera(trace.cameraId),a=n.assignments[trace.cameraId],sw=n.nodes.find(x=>x.id===a.switchId);stroke(anchored(a.link?.routes,c,sw),'#facc15',4);for(const id of trace.links){const l=n.links.find(l=>l.id===id);stroke(anchored(l.routes,n.nodes.find(x=>x.id===l.a),n.nodes.find(x=>x.id===l.b)),'#facc15',4);}}
 if(!hideControls)for(const item of visibleNodes())if(item.id===selected?.id||trace?.nodes.includes(item.id)||source?.id===item.id){const q=root.w2s(item.x,item.y);context.strokeStyle='#facc15';context.lineWidth=3;context.strokeRect(q.x-19,q.y-15,38,30);}
 context.restore();if(!hideControls&&!drag?.started)renderPanel();
}
const owner=root.cw;owner.addEventListener('pointerdown',e=>start(e,true),true);owner.addEventListener('mousedown',e=>start(e,false),true);
 root.addEventListener('pointermove',e=>move(e,true),true);root.addEventListener('mousemove',e=>move(e,false),true);
 root.addEventListener('pointerup',e=>end(e,true),true);root.addEventListener('mouseup',e=>end(e,false),true);root.addEventListener('pointercancel',e=>end(e,true,true),true);root.addEventListener('blur',()=>{cancelDrag();root.render();});root.cv.addEventListener('lostpointercapture',e=>{if(drag?.pointerId===e.pointerId)end(e,true,true);},true);
 const click=root.onClick;root.onClick=function(e){if(root.SIGSCanvasGesture?.consumeClick(e))return;if(tap(e))return;if(!mode&&!busy())clearSelection();return click.apply(this,arguments);};
 const render=root.render;root.render=function(){const result=render.apply(this,arguments);draw();if(!N.allowed())renderPanel();return result;};
 const selectCamera=root.select;root.select=function(id){if(selected&&!(mode&&selected.kind==='camera'&&selected.id===id))clearSelection();return selectCamera.apply(this,arguments);};
const apply=root.applySnap;root.applySnap=function(){stop();return apply.apply(this,arguments);};
 for(const name of ['setTool','startModule','_restoreProjectData']){const old=root[name];root[name]=function(){stop();return old.apply(this,arguments);};}
 const switchFloor=root.switchFloor;root.switchFloor=function(){cancelDrag();clearSelection();clearPopup();placing=null;const result=switchFloor.apply(this,arguments);if(mode)root.S.tool='network-map';root.render();return result;};
 const png=root.exportPNG;if(typeof png==='function')root.exportPNG=function(){hideControls=true;try{return png.apply(this,arguments);}finally{hideControls=false;root.render();}};
 document.addEventListener('sigs-license-changed',()=>{if(!N.allowed()){stop();root.render();}},true);
 document.addEventListener('keydown',e=>{if(/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)||popup||busy())return;if(e.key==='Escape'&&(mode||selected)){e.preventDefault();e.stopImmediatePropagation();if(source||placing){source=null;placing=null;}else stop();root.render();}},true);
 root.SIGSNetworkMap={open,close:()=>{stop();root.render();},startPlace,startConnect,connect:newConnection,hitAt,select,trace:id=>N.allowed()?M.trace(net(),id):null,state:()=>({mode,placing,source,selected,dragging:!!drag})};
})(window);
