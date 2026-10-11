/* Analytics reach: documented reference caps or an explicitly editable SIGS pixel criterion.
   Pinhole projection of the complete target includes camera height, tilt and azimuth.
   Recording resolution is a calculation reference, not a claim about the AI processing stream. */
(function(root){'use strict';
const A=root.SIGSAnalytics,N=(v,f)=>Number.isFinite(Number(v))&&Number(v)>0?Number(v):f;
const ajaxGuide='https://ajax.systems/support/posts/install-ajax-camera-better-ai-recognition/';
// Official guide updated 2026-08-10, checked 2026-10-11. Entries: recommended / maximum sensitivity.
// An absent night-vehicle entry means no standardized range published, not zero capability.
const ajaxTable={
 superiorHLVF:{label:'Superior BulletCam / TurretCam / DomeCam HLVF',people:{day:[1,41,1,55],night:[1,32,1,39]},vehicles:{day:[1,75,1,78]}},
 hlvf:{label:'BulletCam / TurretCam / DomeCam HLVF',people:{day:[1,44,1,55],night:[1,30,1,38]},vehicles:{day:[1,85,1,87]}},
 hl:{label:'BulletCam HL / TurretCam HL / DomeCam Mini HL',people:{day:[1,44,1,52],night:[1,19,1,21]},vehicles:{day:[1,65,1,71]}},
 standard:{label:'BulletCam / TurretCam / DomeCam Mini',people:{day:[1,44,1,52],night:[1,17,1,19]},vehicles:{day:[1,65,1,71]}},
 doorbell:{label:'DoorBell',people:{day:[1,21,1,25],night:[1,8,1,9]}},
 indoorcam:{label:'IndoorCam',people:{day:[1,21,1,25],night:[1,14,1,17]}}
};
const ajaxModels={'AJ-BULLETCAM-8-W':'standard','AJ-TURRETCAM-8-W':'standard','AJ-TURRETCAM-5-0400-W':'standard','AJ-BULLETCAM-8-HLVF-W':'hlvf','AJ-DOMECAM-5-HLVF-W':'hlvf','AJ-TURRETCAM-8-HLVF-S-B':'superiorHLVF'};
function ajaxFamily(d){return !d.custom?root.SIGSAjaxCCTV?.lookup?.(d)?.ajaxFamily||ajaxModels[A.key(d)]||null:null;}

const cache=new Map();
function settings(p,d){const a=p.analytics||{};return {ajaxSensitivity:a.ajaxSensitivity==='maximum'?'maximum':'default',mode:a.mode==='day'?'day':'night',minPixels:Math.max(8,Math.min(1000,N(a.minPixels,108))),peopleHeight:Math.max(.3,Math.min(3,N(a.peopleHeight,d.type==='thermal_bi'?1.8:1.75))),peopleWidth:Math.max(.15,Math.min(2,N(a.peopleWidth,.5))),vehiclesHeight:Math.max(.5,Math.min(5,N(a.vehiclesHeight,d.thermalVehicleRangeBasis==='manufacturer-vehicle-vca'?1.4:1.5))),vehiclesWidth:Math.max(.5,Math.min(5,N(a.vehiclesWidth,d.thermalVehicleRangeBasis==='manufacturer-vehicle-vca'?4:1.8))) };}
function profile(p,d,target){
 const s=settings(p,d),c=A.capabilities(d);if(!c[target])return null;
 if(d.type==='thermal_bi'&&target==='people'&&d.thermalRangeBasis==='manufacturer-human-vca')return {min:.05,max:N(d.thermalRange,0),method:'documented',label:'Referência VCA do fabricante',source:d.sourceURL,thermal:true,notes:['Alcance de referência para pessoa de 1,8 × 0,5 m; confirmar condições e tamanho do alvo.']};
 if(d.type==='thermal_bi'&&target==='vehicles'&&d.thermalVehicleRangeBasis==='manufacturer-vehicle-vca')return {min:.05,max:N(d.thermalVehicleRange,0),method:'documented',label:'Referência VCA térmica · veículos',source:d.sourceURL,thermal:true,notes:['Alvo de ensaio do fabricante: '+(d.thermalVehicleRangeTarget||'confirmar na ficha')+'. Confirmar dimensão do alvo e condições da instalação.']};
 if(d.type==='thermal_bi'&&d.analytics?.channel==='thermal')return {unavailable:'Alcance SIP térmico para '+(target==='people'?'pessoas':'carros')+' não publicado nesta ficha.',notes:['A deteção geral / DORI não substitui um alcance confirmado para a analítica. Confirmar no local.'],source:d.sourceURL};
 if((ajaxFamily(d)||String(d.brand||'').toLowerCase()==='ajax')&&!d.custom){
  const family=ajaxFamily(d),table=ajaxTable[family],r=table?.[target]?.[s.mode];
  if(!table)return {unavailable:'Alcance Ajax por confirmar para esta referência.',notes:['Sem correspondência verificada com a tabela do fabricante.'],source:ajaxGuide};
  if(!r)return {unavailable:'Ajax: alcance de '+(target==='vehicles'?'carros':'pessoas')+' à '+(s.mode==='night'?'noite':'dia')+' não publicado neste guia.',notes:['A função pode estar disponível, mas esta combinação não tem alcance medido em condições padronizadas no guia. Confirmar no local.'],source:ajaxGuide};
  const maximum=s.ajaxSensitivity==='maximum',from=r[maximum?2:0],to=r[maximum?3:1],notes=['Tabela Ajax · '+table.label+' · '+(s.mode==='day'?'dia':'noite')+'.',
   'Fabricante: '+from+'–'+to+' m · '+(maximum?'sensibilidade máxima (10)':'recomendado, sensibilidade predefinida (3)')+'.',
   'Ensaio padronizado do fabricante; o enquadramento, a altura e a iluminação podem reduzir o intervalo na planta.',
   'Alvo completo, sem obstáculos, durante pelo menos 2 s.'];
  if(maximum)notes.push('Sensibilidade máxima pode aumentar falsas deteções. Configurar e testar na aplicação Ajax.');
  if((p.instHeight||3)<3||(p.instHeight||3)>4.5)notes.push('Rever altura: o guia recomenda 3–4,5 m.');
  if((p.instTilt??30)<=0||(p.instTilt??30)>45)notes.push('Rever inclinação: o guia recomenda cerca de 30°, até 45°.');
  return {min:Math.max(from,(p.instHeight||3)/2),max:to,referenceMin:from,referenceMax:to,method:'documented',label:'Tabela Ajax · '+(s.mode==='day'?'dia':'noite')+' · sensibilidade '+(maximum?'10':'3'),source:ajaxGuide,notes};
 }
 return {min:.05,max:500,method:'estimate',label:'Estimativa geométrica · critério SIGS',notes:['Mínimo de '+s.minPixels+' px de altura do alvo. Critério de projeto ajustável; não é um limite IA publicado para este modelo.']};
}
function geometry(p,d,target,options={}){
 const s=settings(p,d),pr=profile(p,d,target);if(!pr)return null;if(pr.unavailable)return {invalid:pr.unavailable,notes:pr.notes,source:pr.source};
 const width=pr.thermal?d.thermalResW:(root.SIGSEngineeringModel?root.SIGSEngineeringModel.widthPixels(p,d):N(p.recordWidth,N(d.resW,2688)));
 const same=!p.mp||Number(p.mp)===Number(d.mp),height=pr.thermal?d.thermalResH:(same&&!p.recordWidth?N(d.resH,width*9/16):width*9/16);
 const fov=N(options.fov,pr.thermal?d.thermalFov:(root.SIGSLensModel?root.SIGSLensModel.fov(p,d):d.fov));
 if(!(fov>0&&fov<180&&width>0&&height>0))return {invalid:'Geometria panorâmica: validar no equipamento.'};
 const tanH=Math.tan(fov*Math.PI/360),tanV=pr.thermal&&d.thermalVerticalFov?Math.tan(d.thermalVerticalFov*Math.PI/360):root.SIGSLensModel?.verticalFov(p,d)?Math.tan(root.SIGSLensModel.verticalFov(p,d)*Math.PI/360):tanH*height/width;
 const tilt=Number(p.instTilt??30)*Math.PI/180,h=N(p.instHeight,3),angle=Number(options.angle||0),H=s[target+'Height'],W=s[target+'Width'];
 let max=pr.max;const notes=pr.notes.slice();
 if(!pr.thermal&&root.SIGSLensModel&&!root.SIGSLensModel.policy(d).documented)notes.push('Ótica do catálogo por confirmar: validar FOV e lente no equipamento.');
 if(s.mode==='night'&&!pr.thermal){const light=Math.max(N(d.range,0),N(d.whiteRange,0));if(!(light>0))return {invalid:'Alcance noturno de iluminação por confirmar.'};max=Math.min(max,light);notes.push('Noite: limitado também ao alcance de iluminação indicado ('+light+' m).');}
 if(N(options.rangeLimit,0))max=Math.min(max,options.rangeLimit);
 return {s,pr,width,height,fov,tanH,tanV,tilt,h,angle,H,W,min:pr.min,max,notes};
}
function projectAt(g,distance){
 const x=Math.sin(g.angle)*distance,z=Math.cos(g.angle)*distance,c=Math.cos(g.tilt),s=Math.sin(g.tilt),points=[];
 for(const y of [0,g.H])for(const side of [-1,1]){const depth=z*c+(g.h-y)*s;if(depth<=.001)return {valid:false,pixels:0};points.push({x:(x+side*g.W/2)/depth,y:((y-g.h)*c+z*s)/depth});}
 const pixels=(Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y)))*g.height/(2*g.tanV);
 const framed=points.every(p=>Math.abs(p.x)<=g.tanH&&Math.abs(p.y)<=g.tanV);
 return {valid:framed&&(g.pr.method==='documented'||pixels>=g.s.minPixels),pixels,framed};
}
function calculate(p,d,target,options={}){
 const g=geometry(p,d,target,options);if(!g)return {available:false,status:'Analítica por confirmar.'};if(g.invalid)return {available:false,status:g.invalid,notes:g.notes,source:g.source};
 const key=JSON.stringify([target,g.s,g.pr,g.width,g.height,g.fov,g.tanV,g.tilt,g.h,g.angle,g.min,g.max]);if(cache.has(key))return cache.get(key);
 // Intersect the exact linear framing inequalities and the quadratic pixel-size bound.
 let near=g.min,far=g.max,possible=far>near;const a=Math.cos(g.angle)*Math.cos(g.tilt),sin=Math.sin(g.tilt),cos=Math.cos(g.tilt);
 function bound(coefficient,right){if(Math.abs(coefficient)<1e-12){if(right<0)possible=false;}else if(coefficient>0)far=Math.min(far,right/coefficient);else near=Math.max(near,right/coefficient);}
 for(const y of [0,g.H])for(const side of [-1,1]){const b=(g.h-y)*sin,offset=side*g.W/2,vertical=(y-g.h)*cos,z=Math.cos(g.angle)*sin;
  bound(-a,b-.001);bound(Math.sin(g.angle)-g.tanH*a,g.tanH*b-offset);bound(-Math.sin(g.angle)-g.tanH*a,g.tanH*b+offset);bound(z-g.tanV*a,g.tanV*b-vertical);bound(-z-g.tanV*a,g.tanV*b+vertical);
 }
 if(g.pr.method==='estimate'){
  const b0=g.h*sin,b1=(g.h-g.H)*sin,k=g.s.minPixels,fy=g.height/(2*g.tanV),q2=k*a*a,q1=k*a*(b0+b1)-g.H*Math.cos(g.angle)*fy,q0=k*b0*b1;
  if(q2<1e-12)bound(q1,-q0);else{const discriminant=q1*q1-4*q2*q0;if(discriminant<0)possible=false;else{const delta=Math.sqrt(discriminant);near=Math.max(near,(-q1-delta)/(2*q2));far=Math.min(far,(-q1+delta)/(2*q2));}}
 }
 let result;
 if(!possible||!(far>near+1e-6))result={available:false,status:'Sem intervalo útil: rever lente, altura, inclinação ou critério.',method:g.pr.method,notes:g.notes};
 else{
  if(g.pr.method==='estimate'&&far>=499.99)g.notes.push('Limite de simulação SIGS: 500 m.');
  result={available:true,min:near,max:far,pixels:projectAt(g,far).pixels,method:g.pr.method,label:g.pr.label,source:g.pr.source,notes:g.notes,fov:g.fov,width:g.width,height:g.height,targetHeight:g.H,targetWidth:g.W,mode:g.s.mode};
 }
 if(cache.size>16384)cache.clear();cache.set(key,result);return result;
}
function outerRange(p,d,base){
 const active=A.active(p,d),fov=d.type==='thermal_bi'?d.thermalFov:(root.SIGSLensModel?root.SIGSLensModel.fov(p,d):d.fov);let max=base;
 if(!(fov>0&&fov<180))return base;
 for(const target of ['people','vehicles'])if(active[target])for(let j=0;j<=36;j++){const angle=(-fov/2+fov*j/36)*Math.PI/180,r=calculate(p,d,target,{fov,angle});if(r.available)max=Math.max(max,r.max);}
 return max;
}
function draw(ctx,p,d,fov,range){
 const active=A.active(p,d);if(p.visible===false||!root.S.scale.ok)return;
 const factor=root.S.scale.ppm*root.S.zoom,targets=['people','vehicles'].filter(t=>active[t]),half=Math.min(fov/2,89)*Math.PI/180;
 ctx.save();ctx.setLineDash([5,4]);ctx.lineWidth=1.6;
 targets.forEach((target,i)=>{
  const color=target==='people'?'#ef4444':'#facc15';ctx.strokeStyle=color;
  // Each azimuth has its own projection limit: the contour is not an assumed circular AI radius.
  const contours=Array.from({length:37},(_,j)=>{const angle=-half+half*2*j/36;return {angle,result:calculate(p,d,target,{fov,rangeLimit:range,angle})};});
  for(const boundary of ['min','max']){ctx.save();if(boundary==='min')ctx.globalAlpha*=.45;let open=false;ctx.beginPath();for(const {angle,result:r} of contours){if(!r.available){open=false;continue;}const x=Math.sin(angle)*r[boundary]*factor,y=-Math.cos(angle)*r[boundary]*factor;if(open)ctx.lineTo(x,y);else ctx.moveTo(x,y);open=true;}ctx.stroke();ctx.restore();}
  const angle=targets.length===2?(i?1:-1)*Math.min(8,fov/8)*Math.PI/180:0,r=calculate(p,d,target,{fov,rangeLimit:range,angle});if(!r.available)return;
  const radius=r.max*factor,x=Math.sin(angle)*radius,y=-Math.cos(angle)*radius,size=Math.min(22,Math.max(8,radius*Math.sin(half)*.35));
  ctx.save();ctx.translate(x,y);ctx.rotate(-(p.rotation||0)*Math.PI/180);ctx.setLineDash([]);ctx.fillStyle='rgba(8,17,35,.9)';ctx.beginPath();ctx.arc(0,0,size*.72,0,Math.PI*2);ctx.fill();A.glyph(ctx,target,size);ctx.font='bold 10px Arial';ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(r.max.toFixed(1)+' m',0,size+7);ctx.restore();
 });ctx.restore();
}
function sync(p,d){
 const host=root.document?.getElementById('analytics-reach');if(!host)return;host.textContent='';const s=settings(p,d),active=A.active(p,d),locked=root.SIGS_V6?.currentStatus==='ARCHIVED';
 root.document.querySelectorAll('[data-analytics-mode]').forEach(button=>{const selected=button.dataset.analyticsMode===s.mode;button.setAttribute('aria-pressed',String(selected));button.classList.toggle('selected',selected);button.disabled=locked;});
 const conditions=root.document.getElementById('analytics-conditions');if(conditions)conditions.textContent=d.type==='thermal_bi'&&(d.thermalRangeBasis==='manufacturer-human-vca'||d.analytics?.channel==='thermal')?'Analítica no canal térmico, de dia e de noite. Alcances SIP publicados por alvo; validar o contraste térmico e as condições de ensaio do fabricante.':s.mode==='day'?'Dia: boa iluminação, alvo completo e sem contraluz ou obstáculos.':'Noite: iluminação IR ou luz suficiente no alvo; o alcance fica limitado à iluminação indicada. Evitar reflexos e objetos próximos dos LEDs.';
 const sensitivity=root.document.getElementById('analytics-ajax-sensitivity');if(sensitivity)sensitivity.hidden=!ajaxFamily(d);
 root.document.querySelectorAll('[data-analytics-setting]').forEach(el=>{el.value=s[el.dataset.analyticsSetting];el.disabled=locked;});
 const hasEstimate=['people','vehicles'].some(t=>A.capabilities(d)[t]&&profile(p,d,t)?.method==='estimate');root.document.getElementById('analytics-pixel-row').hidden=!hasEstimate;
 const targets=['people','vehicles'].filter(t=>active[t]);if(!targets.length){host.textContent='Ative um alvo para calcular o alcance.';return;}
 if(!root.S.scale.ok){host.textContent='Defina a escala para representar os alcances em metros no FOV.';return;}
 for(const target of targets){const r=calculate(p,d,target),row=root.document.createElement('div');row.className='analytics-reach-row '+target;const title=root.document.createElement('b');title.textContent=(target==='people'?'Pessoas':'Carros')+' · '+(r.available?r.min.toFixed(1)+'–'+r.max.toFixed(1)+' m':r.status);row.appendChild(title);
  if(r.available){const detail=root.document.createElement('small');detail.textContent=r.label+' · alvo '+r.targetWidth+' × '+r.targetHeight+' m · altura projetada '+Math.round(r.pixels)+' px · imagem considerada '+Math.round(r.width)+' × '+Math.round(r.height);row.appendChild(detail);}
  for(const note of r.notes||[]){const text=root.document.createElement('small');text.textContent=note;row.appendChild(text);}if(r.source){const link=root.document.createElement('a');link.href=r.source;link.target='_blank';link.rel='noopener noreferrer';link.textContent='Fonte do alcance de referência';row.appendChild(link);}host.appendChild(row);
 }
}
root.sigsSetAnalyticsSetting=function(key,value){
 const p=root.fP(root.S.selId),d=p&&root.gD(p.libId);if(!p||root.MOD!=='cctv'||root.SIGS_V6?.currentStatus==='ARCHIVED')return;
 const limits={minPixels:[8,1000],peopleHeight:[.3,3],peopleWidth:[.15,2],vehiclesHeight:[.5,5],vehiclesWidth:[.5,5]};
 if(key==='mode'){if(!['day','night'].includes(value))return;}else if(key==='ajaxSensitivity'){if(!ajaxFamily(d)||!['default','maximum'].includes(value))return;}else{value=Number(value);if(!limits[key]||!Number.isFinite(value)||value<limits[key][0]||value>limits[key][1]){sync(p,d);return;}}
 if(settings(p,d)[key]===value)return;root.pushUndo();p.analytics={...p.analytics,[key]:value};root.saveCurrentFloor?.();root.sigsV6MarkDirty?.();A.sync(p,d);root.render();
};
root.SIGSAnalyticsRange={ajaxTable,ajaxFamily,settings,profile,geometry,projectAt,calculate,outerRange,draw,sync};A.draw=draw;
if(typeof module!=='undefined'&&module.exports)module.exports=root.SIGSAnalyticsRange;
})(typeof window!=='undefined'?window:globalThis);
