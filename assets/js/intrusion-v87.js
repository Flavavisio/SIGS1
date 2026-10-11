/* Intrusion design: detector geometry and installation organisation, independent of CCTV optics. */
(function(root){'use strict';
const $=id=>root.document?.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const source='https://support.ajax.systems/en/manuals/dualcurtain-outdoor/';
const labels={hub:'Hub / central',repeater:'Repetidor rádio',pir_indoor:'Movimento interior',pir_outdoor:'Movimento exterior',door:'Abertura',glass:'Quebra de vidro',combi:'Movimento e vidro',siren_int:'Sirene interior',siren_ext:'Sirene exterior',keypad:'Teclado',remote:'Comando / pânico',relay:'Automação',integration:'Integração',psu:'Alimentação',case:'Caixa'};
function profile(d={}){
 const k=String(d.model||'').toUpperCase();
 if(!d.custom&&root.SIGSIntrusionCatalog88?.profiles[k])return root.SIGSIntrusionCatalog88.profiles[k];
 // Exact models also cover remote catalogues and old projects with the incorrect 30 m single cone.
 const known={
  'AJAX.DUALCURTAIN-OUT':{kind:'dual',fov:4.5,max:15,steps:[4,5,7,12,15],height:1,heightNote:'0,8–1,3 m sobre o chão no perímetro. Para janelas, consultar a instalação acima do peitoril.',source},
  'AJAX.CURTAIN-OUT':{kind:'motion',fov:8,max:12,source:'https://support.ajax.systems/en/outdoor-security/dualcurtain-outdoor/'},
  'AJAX.CURTAIN-OUT-MINI':{kind:'motion',fov:15,max:5,source:'https://support.ajax.systems/en/outdoor-security/dualcurtain-outdoor/'},
  'AJAX.MOTCURTAIN':{kind:'motion',fov:6,max:15,source:'https://support.ajax.systems/en/indoor-security/motionprotect-curtain/'},
  'AJAX.GLASSPROT':{kind:'glass',fov:180,max:9,source:'https://support.ajax.systems/en/manuals/glassprotect/'},
  'AJAX.COMBIPROT':{kind:'combi',fov:88.5,max:12,glassFov:180,glassMax:9,source:'https://support.ajax.systems/en/manuals/combiprotect/'}
 };
 if(!d.custom&&known[k])return known[k];
 const motion=['pir_indoor','pir_outdoor','combi'].includes(d.type),glass=d.type==='glass';
 return {kind:motion?'motion':glass?'glass':'point',fov:Number(d.fov)||0,max:Math.max(0,Number(d.range)||0),source:d.sourceURL||'',custom:!!d.custom};
}
const clamp=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):fallback;
function limit(q,a){if(q.modes)return q.modes[a.detectionMode]?.max||q.max;if(q.correlationRanges)return q.correlationRanges[a.correlation?'on':'off'][['low','normal','high'].indexOf(a.sensitivity)]||q.max;return q.max;}
function settings(p={},d={}){
 const a=p.intrusion||{},q=profile(d),side=k=>{const s=a[k]||{},r=Number(s.range);return {enabled:s.enabled!==false,range:q.steps?.includes(r)?r:15};};
 const modes=q.modes||{},detectionMode=modes[a.detectionMode]?a.detectionMode:q.defaultMode||'',sensitivity=['low','normal','high'].includes(a.sensitivity)?a.sensitivity:'high',correlation=a.correlation===true,max=limit(q,{detectionMode,sensitivity,correlation});
 return {detectionMode,sensitivity,correlation,prealarm:a.prealarm===true,room:String(a.room||''),group:String(a.group||''),hubId:String(a.hubId||''),height:clamp(a.height,.1,20,modes[detectionMode]?.height||q.height||(d.type==='pir_outdoor'?1:2.4)),left:side('left'),right:side('right'),range:clamp(a.range??p.arange,0,max,max),glassRange:clamp(a.glassRange,0,q.glassMax||9,q.glassMax||9),motion:a.motion!==false,glass:a.glass!==false};
}
function sectors(p,d){
 const q=profile(d),a=settings(p,d),r=Number(p.rotation)||0;
 if(q.kind==='dual')return [['left',-90,'Esquerda'],['right',90,'Direita']].filter(([key])=>a[key].enabled).map(([key,angle,label])=>({key,label,range:a[key].range,fov:q.fov,rotation:r+angle,acoustic:false}));
 if(q.kind==='point'||!q.fov)return [];
 const out=[];if(q.kind!=='combi'||a.motion)out.push({key:q.kind==='glass'?'glass':'motion',label:q.kind==='glass'?'Vidro':'Movimento',range:a.range,fov:q.fov,rotation:r,acoustic:q.kind==='glass'});
 if(q.kind==='combi'&&a.glass)out.push({key:'glass',label:'Vidro',range:a.glassRange,fov:q.glassFov,rotation:r,acoustic:true});
 if(q.prealarmFov&&a.prealarm)out.unshift({key:'prealarm',label:'Pré-alarme (sem alarme)',range:a.range,fov:q.prealarmFov,rotation:r,acoustic:false,prealarm:true});
 return out.filter(s=>s.range>0);
}
function polygon(p,s,ppm,obstacles=[]){
 const spec={x:p.x,y:p.y,range:s.range,fov:s.fov,rotation:s.rotation};
 // PIR is blocked by opaque plan obstacles; microphone coverage remains an acoustic reference.
 if(root.SIGSSiteGeometry)return SIGSSiteGeometry.coverage(spec,ppm,s.acoustic?[]:obstacles);
 const origin={x:p.x,y:p.y},a=(s.rotation-90)*Math.PI/180,h=s.fov*Math.PI/360,r=s.range*ppm,steps=Math.max(4,Math.ceil(s.fov/2));
 return [origin,...Array.from({length:steps+1},(_,i)=>({x:p.x+Math.cos(a-h+2*h*i/steps)*r,y:p.y+Math.sin(a-h+2*h*i/steps)*r}))];
}
function draw(ctx,p,d){
 if(!root.S.scale.ok||p.visible===false)return;
 const obstacles=root.FLOORS?.[root.FLOOR_CUR||0]?.obstacles||[],opa=p.opacity??.22;
 for(const s of sectors(p,d)){
  const points=polygon(p,s,S.scale.ppm,obstacles).map(function(v){return w2s(v.x,v.y);});if(points.length<3)continue;
  ctx.save();ctx.beginPath();points.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.closePath();ctx.fillStyle=hr(p.color||d.color||'#f97316',opa*(s.prealarm?.35:s.acoustic?.6:1));ctx.strokeStyle=p.color||d.color||'#f97316';ctx.lineWidth=1.5;ctx.setLineDash(s.acoustic||s.prealarm?[5,4]:[]);ctx.fill();ctx.stroke();ctx.setLineDash([]);
  const angle=(s.rotation-90)*Math.PI/180,anchor=w2s(p.x+Math.cos(angle)*s.range*S.scale.ppm,p.y+Math.sin(angle)*s.range*S.scale.ppm);ctx.font='bold 10px sans-serif';ctx.fillStyle=p.color||d.color||'#f97316';ctx.fillText(s.label+' · '+s.range+' m',anchor.x+4,anchor.y-(s.prealarm?20:5));ctx.restore();
 }
}
function svg(p,ppm,obstacles){if(p.visible===false)return '';return sectors(p,p.detector||p).map(s=>'<polygon data-intrusion-side="'+s.key+'" points="'+polygon(p,s,ppm,obstacles).map(v=>v.x+','+v.y).join(' ')+'" fill="#ea580c" fill-opacity="'+(s.prealarm?'.06':'.18')+'" stroke="#ea580c" stroke-width="1" vector-effect="non-scaling-stroke"'+(s.acoustic||s.prealarm?' stroke-dasharray="5 4"':'')+'/>').join('');}
function devices(){return (root.FLOORS||[]).flatMap((f,i)=>(i===(root.FLOOR_CUR||0)?root.S.placed:f.placed||[]).map(p=>({p,d:root.gD(p.libId)||{},floor:f.name})));}
const hubs=()=>devices().filter(x=>x.d.type==='hub');
function hubFor(p){const hs=hubs(),id=p.intrusion?.hubId;return id?hs.find(x=>x.p.id===id):hs.length===1?hs[0]:null;}
function field(label,body){return '<label class="intrusion-field"><span>'+label+'</span>'+body+'</label>';}
function number(key,value,min,max,step=1){return '<input type="number" data-intrusion="'+key+'" value="'+value+'" min="'+min+'" max="'+max+'" step="'+step+'">';}
function check(key,value,label){return '<label class="intrusion-check"><input type="checkbox" data-intrusion="'+key+'" '+(value?'checked':'')+'>'+label+'</label>';}
function sync(p,d){
 const box=$('alarm-zone');if(!box)return;box.style.display=root.MOD==='alarm'?'':'none';if(root.MOD!=='alarm')return;
 const q=profile(d),a=settings(p,d),hs=hubs(),detector=q.kind!=='point',select=(key,value,opts)=>'<select data-intrusion="'+key+'">'+opts.map(([v,l])=>'<option value="'+esc(v)+'" '+(String(value)===String(v)?'selected':'')+'>'+esc(l)+'</option>').join('')+'</select>';
 let body='';const photo=root.SIGSIntrusionCatalog88?.image(d);if(photo)body+='<figure class="intrusion-product"><img src="'+esc(photo)+'" alt="'+esc(d.name)+'"><figcaption>'+esc(d.name)+'</figcaption></figure>';
 body+='<div class="stl">Instalação de intrusão</div>'+field('Divisão / local','<input data-intrusion="room" maxlength="80" value="'+esc(a.room)+'" placeholder="Ex.: Entrada">')+field('Grupo / área','<input data-intrusion="group" maxlength="80" value="'+esc(a.group)+'" placeholder="Ex.: Perímetro">');
 if(d.type!=='hub')body+=field('Hub',select('hubId',a.hubId,[['',hs.length===1?'Automático · '+hs[0].p.label:'Por atribuir'],...hs.map(x=>[x.p.id,x.floor+' · '+x.p.label])]))+field('Zona / identificação no projeto',number('zone',p.zone||1,1,999));
 if(detector){body+='<div class="stl">'+(q.kind==='dual'?'Cortina bilateral':'Área de deteção')+'</div>';
 if(q.modes)body+=field('Modo de deteção',select('detectionMode',a.detectionMode,Object.entries(q.modes).map(([k,v])=>[k,v.label])));
 if(q.correlationRanges)body+=check('correlation',a.correlation,'Correlação de sinais')+field('Sensibilidade',select('sensitivity',a.sensitivity,[['low','Baixa'],['normal','Normal'],['high','Alta']]));
 if(q.prealarmFov)body+=check('prealarm',a.prealarm,'Mostrar pré-alarme · '+q.prealarmFov+'° (sem alarme)');
 if(q.kind==='dual')for(const [key,label] of [['left','Esquerda'],['right','Direita']])body+='<div class="intrusion-side">'+check(key+'.enabled',a[key].enabled,label+' ativa')+field('Alcance '+label.toLowerCase(),select(key+'.range',a[key].range,q.steps.map(v=>[v,v+' m'])))+'</div>';
 else{if(q.kind==='combi')body+=check('motion',a.motion,'Deteção de movimento')+check('glass',a.glass,'Quebra de vidro');body+=field(q.kind==='glass'?'Alcance acústico (m)':'Alcance de projeto (m)',number('range',a.range,0,limit(q,a),.5));if(q.kind==='combi')body+=field('Alcance do vidro (m)',number('glassRange',a.glassRange,0,q.glassMax,.5));}
 body+=field('Ângulo horizontal de deteção','<output>'+q.fov+'°'+(q.kind==='dual'?' por lado':'')+'</output>')+field('Altura de instalação (m)',number('height',a.height,.1,20,.1));
 body+=field('Alcance máximo neste modo','<output>'+limit(q,a)+' m'+(q.kind==='dual'?' por lado':'')+'</output>');
 if(q.vertical)body+=field('Ângulo vertical de deteção','<output>'+esc(q.vertical)+'</output>');
 if(q.prealarmVertical)body+=field('Pré-alarme vertical','<output>'+q.prealarmVertical+'°</output>');
 if(q.cameraFov)body+=field('Campo da fotografia','<output>'+esc(q.cameraFov)+'</output>');
 if(q.heightNote)body+='<p class="intrusion-note">'+q.heightNote+'</p>';
 body+='<p class="intrusion-note">'+(S.scale.ok?'':'Defina a escala para mostrar as áreas em metros. ')+(q.kind==='glass'||q.kind==='combi'?'Área acústica tracejada: móveis, cortinas e ruído podem alterar a deteção. ':'')+'A área é uma referência de projeto; confirme a montagem e faça o teste da zona de deteção no local.</p>';

 }else body+='<p class="intrusion-note">Este equipamento é representado pela posição. Não tem cone de visão nem alcance de deteção volumétrica.</p>';
 if(q.technology){body+='<details class="intrusion-details"><summary>Ficha verificada do detetor</summary>'+field('Tecnologia','<output>'+esc(q.technology)+'</output>')+(q.ip?field('Proteção','<output>'+esc(q.ip)+'</output>'):'')+(typeof q.antiMask==='boolean'?field('Anti-mascaramento','<output>'+(q.antiMask?'Sim':'Não')+'</output>'):'')+(q.pet?'<p class="intrusion-note">Animais: '+esc(q.pet)+'</p>':'')+(q.photo?'<p class="intrusion-note">'+esc(q.photo)+'</p>':'')+(q.notes?'<p class="intrusion-note">'+esc(q.notes)+'</p>':'')+'<p class="intrusion-note">Dados consultados: '+esc(q.verifiedOn)+'.</p></details>';}
 if(/^https:\/\//.test(q.source))body+='<a class="intrusion-note" href="'+esc(q.source)+'" target="_blank" rel="noopener">Manual do fabricante ↗</a>';
 body+='<p class="intrusion-note">Divisão, grupo, Hub e zona organizam o projeto SIGS. Confirmar a compatibilidade e configurar os equipamentos na aplicação Ajax.</p>';
 box.innerHTML=body;box.querySelectorAll('[data-intrusion]').forEach(el=>{el.disabled=root.SIGS_V6?.currentStatus==='ARCHIVED';el.onchange=()=>set(el.dataset.intrusion,el.type==='checkbox'?el.checked:el.value);});
 const directed=detector&&q.fov<355;for(const id of ['rot-row','rot-btns'])if($(id))$(id).style.display=directed?'':'none';
 for(const [id,label] of [['pcol','Cor da área'],['pvis','Área de deteção']]){const span=$(id)?.closest('.fr')?.querySelector('.fl');if(span)span.textContent=label;}
 for(const id of ['pcol','popa','pvis'])if($(id)?.closest('.fr'))$(id).closest('.fr').style.display=detector?'':'none';
 if($('pinfo'))$('pinfo').textContent=(labels[d.type]||d.type)+' · '+(detector?sectors(p,d).map(s=>s.label+': '+s.range+' m').join(' / '):d.desc||'');
}
function set(key,value){
 if(root.MOD!=='alarm'||root.SIGS_V6?.currentStatus==='ARCHIVED')return;
 const p=root.fP(S.selId),d=p&&root.gD(p.libId);if(!d)return;const q=profile(d),a=settings(p,d);
 if(['room','group'].includes(key))value=String(value).slice(0,80);
 else if(key==='hubId'){if(value&&!hubs().some(x=>x.p.id===value))return;}
 else if(key==='zone'){value=Number(value);if(!Number.isInteger(value)||value<1||value>999)return;}
 else if(key==='detectionMode'){if(!q.modes?.[value])return;}
 else if(key==='sensitivity'){if(!q.correlationRanges||!['low','normal','high'].includes(value))return;}
 else if(['left.enabled','right.enabled','motion','glass','prealarm','correlation'].includes(key)){if(typeof value!=='boolean')return;}
 else{value=Number(value);if(!Number.isFinite(value))return;if(key.endsWith('.range')){if(q.kind!=='dual'||!q.steps.includes(value))return;}else if(key==='height'){if(value<.1||value>20)return;}else if(key==='range'||key==='glassRange'){if(value<0||value>(key==='range'?limit(q,a):q.glassMax||9))return;}else return;}
 root.pushUndo();if(key==='zone')p.zone=value;else if(key.includes('.')){const [side,name]=key.split('.');a[side]={...a[side],[name]:value};p.intrusion=a;}else{a[key]=value;p.intrusion=a;}
 if(['detectionMode','sensitivity','correlation'].includes(key)){p.intrusion.range=Math.min(a.range,limit(q,p.intrusion));if(key==='detectionMode'){p.intrusion.height=q.modes[value].height;p.instHeight=p.intrusion.height;}}
 if(key==='height')p.instHeight=value;
 root.saveCurrentFloor();root.sigsV6MarkDirty?.();sync(p,d);root.render();root.updateStats();
}
function summary(){
 const list=devices(),hs=list.filter(x=>x.d.type==='hub'),det=list.filter(x=>['pir_indoor','pir_outdoor','door','glass','combi'].includes(x.d.type)),sirens=list.filter(x=>['siren_int','siren_ext'].includes(x.d.type));
 return '<div class="stl">Sistema de intrusão</div><div class="intrusion-kpis">'+[[hs.length,'Hubs'],[det.length,'Detetores'],[sirens.length,'Sirenes']].map(([n,l])=>'<div><b>'+n+'</b><span>'+l+'</span></div>').join('')+'<p class="intrusion-note">'+list.length+' equipamentos · '+new Set(list.map(x=>x.p.intrusion?.group).filter(Boolean)).size+' grupos / áreas</p>'+(list.length?'<div class="intrusion-inventory">'+list.map(x=>'<div><b>'+esc(x.p.label)+'</b> · '+esc(x.d.name)+'<small>'+esc(x.floor+' · '+(x.p.intrusion?.room||'Local por definir'))+' · '+(x.d.type==='hub'?'Central':esc(hubFor(x.p)?.p.label||'Hub por atribuir'))+'</small></div>').join('')+'</div>':'<p class="intrusion-note">Coloque um Hub e os detetores na planta para organizar a proteção.</p>')+'<p class="intrusion-note">Validar cobertura de deteção, sinal Jeweller / Wings ou ligação Fibra, alimentação e autonomia no local. A área de deteção não representa o alcance rádio.</p>';
}
function audit(add){
 for(const {p,d} of devices()){
  if(d.type!=='hub'&&!hubFor(p))add('warning','Hub · '+esc(p.label),'Atribua este equipamento a um Hub existente.');
  const q=profile(d),a=settings(p,d);if(q.kind==='dual'&&!a.left.enabled&&!a.right.enabled)add('warning','DualCurtain · '+esc(p.label),'Ambos os lados estão desativados no projeto.');
  if(q.kind!=='dual'&&q.heightMin&&(a.height<q.heightMin||a.height>q.heightMax))add('info','Montagem · '+esc(p.label),esc(q.heightNote));
  if(q.kind==='dual'&&(a.height<.8||a.height>1.3))add('info','Montagem · '+esc(p.label),'Altura fora da referência de perímetro (0,8–1,3 m). Confirme a montagem de janela ou outra configuração no manual.');
 }
 add('info','Ensaios de intrusão','Confirmar a zona de deteção, o sinal rádio / ligação Fibra e a autonomia. As áreas na planta não garantem deteção ou comunicação.');
}
function mode(){
 if(!root.document)return;const alarm=root.MOD==='alarm',cctv=root.MOD==='cctv';document.body.dataset.sigsModule=root.MOD||'cctv';
 if($('proj-summary-panel'))$('proj-summary-panel').style.display=cctv?'':'none';
 const specialty=$('specialty-project-summary');if(specialty){specialty.style.display=cctv?'none':'';specialty.innerHTML=alarm?summary():'<div class="stl">Sistema de incêndio</div><p class="intrusion-note">'+devices().length+' equipamentos no projeto. Consulte o separador Sistema.</p>';}
 if($('v7-engineering-note'))$('v7-engineering-note').style.display=cctv?'':'none';
 if($('eng-open')){$('eng-open').textContent=alarm?'Sistema de intrusão':root.MOD==='fire'?'Sistema de incêndio':'Engenharia';}
 if(!alarm)for(const [id,label] of [['pcol','Cor cone'],['pvis','Cone']]){const span=$(id)?.closest('.fr')?.querySelector('.fl');if(span)span.textContent=label;}
 if(!alarm)for(const id of ['pcol','popa','pvis'])if($(id)?.closest('.fr'))$(id).closest('.fr').style.display='';
 const scenario=document.querySelector('[data-sidebar-view="scene"]');if(scenario)scenario.title=alarm?'Paredes, obstáculos e cablagem de intrusão':'Paredes, cabos, pessoas e vista 3D';
}
root.SIGSIntrusion={profile,settings,limit,sectors,polygon,draw,svg,sync,set,summary,audit,mode,hubFor,labels};
})(typeof window!=='undefined'?window:globalThis);
