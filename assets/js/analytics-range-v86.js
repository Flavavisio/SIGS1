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
 if(d.type==='thermal_bi'&&d.analytics?.channel==='thermal')return {unavailable:'Alcance de analítica térmica para '+(target==='people'?'pessoas':'carros')+' não publicado nesta ficha.',notes:['A deteção geral / DORI não substitui um alcance confirmado para a analítica. Confirmar no local.'],source:d.sourceURL};
 if((ajaxFamily(d)||String(d.brand||'').toLowerCase()==='ajax')&&!d.custom){
  const family=ajaxFamily(d),table=ajaxTable[family],r=table?.[target]?.[s.mode];
  if(!table)return {unavailable:'Alcance Ajax por confirmar para esta referência.',notes:['Sem correspondência verificada com a tabela do fabricante.'],source:ajaxGuide};
  if(!r&&target==='vehicles'&&s.mode==='night'){
   const i=s.ajaxSensitivity==='maximum'?3:1,day=table.vehicles?.day?.[i],personDay=table.people?.day?.[i],personNight=table.people?.night?.[i];
   if(day&&personDay&&personNight){const max=day*personNight/personDay;return {min:Math.max(1,(p.instHeight||3)/2),max,referenceMax:max,method:'proportional',label:'Estimativa SIGS · proporção dia/noite Ajax',source:ajaxGuide,notes:['Ajax: alcance de carros à noite não publicado para esta família. Estimativa por proporção, não um valor certificado Ajax.','Carro à noite = carro de dia × pessoa à noite ÷ pessoa de dia: '+day+' × '+personNight+' ÷ '+personDay+' = '+max.toFixed(1)+' m.','Usa os valores da mesma família e sensibilidade; alvo completo, sem obstáculos e iluminação suficiente.']};}
  }
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
 return {min:.05,max:500,method:'estimate',label:'Estimativa geométrica · critério SIGS',notes:['Mínimo de '+s.minPixels+' px equivalentes, pelo mesmo critério de área projetada para pessoas e carros. Critério de projeto ajustável; não é um limite IA publicado para este modelo.','A pessoa usa altura e largura; o carro usa altura e largura frontal. O enquadramento completo e a iluminação podem limitar ambos antes do alcance estimado.']};
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
 if(pr.thermal&&d.thermalSourceNote)notes.push(d.thermalSourceNote);
 let method=pr.method,label=pr.label;
 // SIGS assumption: apply the family reference at the initial catalogue focal setting.
 // Optical magnification beyond it is a SIGS estimate, never another Ajax measurement.
 if(ajaxFamily(d)&&root.SIGSLensModel){const L=root.SIGSLensModel,q=L.policy(d);
  if(q.adjustable){const baseP={...p,lens:q.initial},baseV=L.verticalFov(baseP,d),baseF=L.fov(baseP,d),baseTan=baseV?Math.tan(baseV*Math.PI/360):Math.tan(baseF*Math.PI/360)*height/width,factor=baseTan/tanV;
   if(Math.abs(factor-1)>1e-6){max=Math.min(500,max*factor);method='optical';label='Estimativa SIGS · zoom ótico sobre referência Ajax';notes.push('Hipótese SIGS: referência da família aplicada na focal inicial '+q.initial+' mm; extensão pelo aumento ótico vertical ('+factor.toFixed(2)+'×), não medida pelo fabricante. O alvo completo tem de continuar dentro da imagem.');}
  }
 }
 const effectiveProfile={...pr,method,label};
 if(!pr.thermal&&root.SIGSLensModel&&!root.SIGSLensModel.policy(d).documented)notes.push('Ótica do catálogo por confirmar: validar FOV e lente no equipamento.');
 if(s.mode==='night'&&!pr.thermal){const light=Math.max(N(d.range,0),N(d.whiteRange,0));if(ajaxFamily(d)){notes.push('Iluminação integrada: '+light+' m. Para usar o alcance estimado além desta distância, é necessária luz suficiente no alvo; validar no local.');}else{if(!(light>0))return {invalid:'Alcance noturno de iluminação por confirmar.'};max=Math.min(max,light);notes.push('Noite: limitado também ao alcance de iluminação indicado ('+light+' m).');}}
 if(N(options.rangeLimit,0))max=Math.min(max,options.rangeLimit);
 let pixelThreshold=pr.method==='estimate'?s.minPixels:0;
 const ref=pr.thermal&&d.thermalVcaReference?.[target];
 if(ref&&ref.height>0&&ref.width>0&&pr.max>0){
  // Calibrate each target against its OWN published thermal VCA reference.
  // Projected size may reduce the useful interval but never extend that cap.
  pixelThreshold=Math.sqrt(width*ref.width/(2*tanH*pr.max)*height*ref.height/(2*tanV*pr.max)*3.5);
  effectiveProfile.label='Referência VCA · projeção SIGS';
  notes.push('Alvo de referência: '+ref.height+' × '+ref.width+' m. A projeção SIGS reduz o alcance se o alvo for menor ou perder dimensão projetada; nunca ultrapassa a referência VCA publicada. Não é um novo ensaio do fabricante.');
  if(target==='vehicles')notes.push('Os 4 m do alvo de ensaio são a dimensão horizontal projetada. Para um carro de frente, ajuste esta dimensão à largura efetivamente visível.');
 }
 return {s,pr:effectiveProfile,target,width,height,fov,tanH,tanV,tilt,h,angle,H,W,pixelThreshold,min:pr.min,max,notes};
}
function projectAt(g,distance){
 const x=Math.sin(g.angle)*distance,z=Math.cos(g.angle)*distance,c=Math.cos(g.tilt),s=Math.sin(g.tilt),points=[];
 for(const y of [0,g.H])for(const side of [-1,1]){const depth=z*c+(g.h-y)*s;if(depth<=.001)return {valid:false,pixels:0};points.push({x:(x+side*g.W/2)/depth,y:((y-g.h)*c+z*s)/depth});}
 const verticalPixels=(Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y)))*g.height/(2*g.tanV);
 const horizontalPixels=(Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)))*g.width/(2*g.tanH);
 // One projected-area criterion for BOTH targets. The reference aspect 1.75/.5
 // calibrates the equivalent-pixel scale to the previous frontal person default.
 // This is a SIGS planning assumption, never a manufacturer AI threshold.
 const pixelArea=verticalPixels*horizontalPixels,pixels=Math.sqrt(pixelArea*3.5);
 const framed=points.every(p=>Math.abs(p.x)<=g.tanH&&Math.abs(p.y)<=g.tanV);
 const threshold=g.pixelThreshold??(g.pr.method==='estimate'?g.s.minPixels:0);
 return {valid:framed&&pixels>=threshold,pixels,verticalPixels,horizontalPixels,pixelArea,framed};
}
function calculate(p,d,target,options={}){
 const g=geometry(p,d,target,options);if(!g)return {available:false,status:'Analítica por confirmar.'};if(g.invalid)return {available:false,status:g.invalid,notes:g.notes,source:g.source};
 const key=JSON.stringify([target,g.W,g.H,g.s,g.pr,g.width,g.height,g.fov,g.tanV,g.tilt,g.h,g.angle,g.pixelThreshold,g.min,g.max]);if(cache.has(key))return cache.get(key);
 // Intersect exact framing inequalities, then the common projected-area size bound.
 let near=g.min,far=g.max,possible=far>near;const a=Math.cos(g.angle)*Math.cos(g.tilt),sin=Math.sin(g.tilt),cos=Math.cos(g.tilt);
 function bound(coefficient,right){if(Math.abs(coefficient)<1e-12){if(right<0)possible=false;}else if(coefficient>0)far=Math.min(far,right/coefficient);else near=Math.max(near,right/coefficient);}
 for(const y of [0,g.H])for(const side of [-1,1]){const b=(g.h-y)*sin,offset=side*g.W/2,vertical=(y-g.h)*cos,z=Math.cos(g.angle)*sin;
  bound(-a,b-.001);bound(Math.sin(g.angle)-g.tanH*a,g.tanH*b-offset);bound(-Math.sin(g.angle)-g.tanH*a,g.tanH*b+offset);bound(z-g.tanV*a,g.tanV*b-vertical);bound(-z-g.tanV*a,g.tanV*b+vertical);
 }
 if(g.pixelThreshold>0&&possible&&far>near){
  // Projection size can grow first near a steeply tilted camera, then shrink.
  // Locate its maximum before bracketing BOTH threshold crossings; do not reject
  // the whole interval merely because the closest framed target is too small.
  const size=distance=>projectAt(g,distance).pixels,ratio=(Math.sqrt(5)-1)/2;
  let lo,hi,peak=near;
  if(size(near)<g.pixelThreshold){
   lo=near;hi=far;let x1=hi-ratio*(hi-lo),x2=lo+ratio*(hi-lo),v1=size(x1),v2=size(x2);
   for(let i=0;i<42;i++){
    if(v1<v2){lo=x1;x1=x2;v1=v2;x2=lo+ratio*(hi-lo);v2=size(x2);}
    else{hi=x2;x2=x1;v2=v1;x1=hi-ratio*(hi-lo);v1=size(x1);}
   }
   peak=[near,far,(lo+hi)/2].reduce((best,x)=>size(x)>size(best)?x:best,near);
  }
  if(size(peak)<g.pixelThreshold)possible=false;
  else{
   if(size(near)<g.pixelThreshold){lo=near;hi=peak;for(let i=0;i<35;i++){const mid=(lo+hi)/2;if(size(mid)>=g.pixelThreshold)hi=mid;else lo=mid;}near=hi;}
   if(size(far)<g.pixelThreshold){lo=peak;hi=far;for(let i=0;i<35;i++){const mid=(lo+hi)/2;if(size(mid)>=g.pixelThreshold)lo=mid;else hi=mid;}far=lo;}
  }
 }
 let result;
 const referenceMax=g.pr.thermal?g.pr.max:null;
 if(!possible||!(far>near+1e-6))result={available:false,status:'Sem intervalo útil: rever lente, altura, inclinação ou critério.',method:g.pr.method,referenceMax,notes:g.notes};
 else{
  if(g.pr.method!=='documented'&&far>=499.99)g.notes.push('Limite de simulação SIGS: 500 m.');
  const projected=projectAt(g,far);
  result={available:true,min:near,max:far,referenceMax,pixels:projected.pixels,verticalPixels:projected.verticalPixels,horizontalPixels:projected.horizontalPixels,pixelArea:projected.pixelArea,pixelMetric:'projected-area',method:g.pr.method,label:g.pr.label,source:g.pr.source,notes:g.notes,fov:g.fov,width:g.width,height:g.height,targetHeight:g.H,targetWidth:g.W,mode:g.s.mode};
 }
 if(cache.size>16384)cache.clear();cache.set(key,result);return result;
}
function thermalAim(p,d,target){
 if(d?.type!=='thermal_bi')return null;
 const s=settings(p,d),enabled=A.active(p,d),selected=target?[target]:['people','vehicles'].filter(t=>enabled[t]);
 const targets=selected.length?selected:['people','vehicles'];
 const candidates=targets.map(t=>({target:t,pr:profile(p,d,t)})).filter(c=>c.pr?.thermal&&c.pr.max>0&&!c.pr.unavailable);
 if(!candidates.length)return null;
 // Aim at the centre of the furthest documented target on level ground. This
 // is a starting orientation, never a change to the manufacturer's VCA range.
 const best=candidates.sort((a,b)=>b.pr.max-a.pr.max)[0],height=s[best.target+'Height'];
 const tilt=Math.max(0,Math.min(90,Math.atan2(N(p.instHeight,d.height||3)-height/2,best.pr.max)*180/Math.PI));
 return {tilt:Math.round(tilt*10)/10,target:best.target,distance:best.pr.max};
}
function outerRange(p,d,base){
 const active=A.active(p,d),fov=d.type==='thermal_bi'?d.thermalFov:(root.SIGSLensModel?root.SIGSLensModel.fov(p,d):d.fov);let max=base;
 if(!(fov>0&&fov<180))return base;
 for(const target of ['people','vehicles'])if(active[target])for(let j=0;j<=36;j++){const angle=(-fov/2+fov*j/36)*Math.PI/180,r=calculate(p,d,target,{fov,angle});if(r.available)max=Math.max(max,r.max);}
 return max;
}
// Draggable analytics targets belong to each camera and are distinct from 3D scene objects.
function markerPosition(p,target,r,fov,activeCount,index){
 const factor=root.S.scale.ppm,stored=p.analytics?.markerPositions?.[target];
 if(stored&&Number.isFinite(stored.x)&&Number.isFinite(stored.y))return {x:stored.x,y:stored.y,custom:true};
 const angle=(activeCount===2?(index?1:-1)*Math.min(8,fov/8):0)*Math.PI/180;
 const dist=r?.available?r.max:0,rot=(Number(p.rotation)||0)*Math.PI/180;
 return {x:Number(p.x)+Math.sin(rot+angle)*dist*factor,y:Number(p.y)-Math.cos(rot+angle)*dist*factor,custom:false};
}
function markerLayout(p,d,target,fov,range,count,index){
 const angle=(count===2?(index?1:-1)*Math.min(8,fov/8):0)*Math.PI/180;
 const result=calculate(p,d,target,{fov,rangeLimit:range,angle});
 return {result,position:markerPosition(p,target,result,fov,count,index)};
}
function markerCoverage(p,d){
 if(d.type==='thermal_bi')return {fov:d.thermalFov||d.fov||30,range:outerRange(p,d,d.thermalRange||d.thermalDetectionRange||d.range||100)};
 const L=root.SIGSLensModel,lens=L?L.effective(p,d):p.lens||2.8;
 const fov=typeof root.lFOV==='function'?root.lFOV(d.fov,lens,L?L.policy(d).base:undefined,d):L?L.fov(p,d):d.fov||90;
 const base=typeof root.lRange==='function'?root.lRange(d.range,lens,p,d):d.range||0;
 return {fov,range:outerRange(p,d,base)};
}
function markerAssessment(p,d,target,position,fov,range){
 const ppm=root.S.scale.ppm,dx=(position.x-p.x)/ppm,dy=(position.y-p.y)/ppm;
 const distance=Math.hypot(dx,dy),bearing=Math.atan2(dx,-dy),rotation=(Number(p.rotation)||0)*Math.PI/180;
 const rel=Math.atan2(Math.sin(bearing-rotation),Math.cos(bearing-rotation));
 if(Math.abs(rel)>fov*Math.PI/360+1e-7)return {ok:false,reason:'FORA DO FOV',distance};
 const r=calculate(p,d,target,{angle:rel,fov,rangeLimit:range});
 if(!r.available)return {ok:null,reason:'POR CONFIRMAR',distance};
 if(distance<r.min||distance>r.max)return {ok:false,reason:'FORA DO ALCANCE',distance,max:r.max};
 const floor=root.FLOORS?.[root.FLOOR_CUR];
 const geo=root.SIGSSiteGeometry,segments=geo?.segments,intersection=geo?.intersection;
 if(floor?.obstacles?.length&&typeof segments==='function'&&typeof intersection==='function'){
  const total=Math.hypot(position.x-p.x,position.y-p.y);
  const hit=(floor.obstacles||[]).some(o=>segments([o]).some(([a,b])=>{
   const d=intersection({x:p.x,y:p.y},{x:(position.x-p.x)/total,y:(position.y-p.y)/total},a,b);
   return d!==null&&d>0&&d<total;
  }));
  if(hit)return {ok:false,reason:'OBSTÁCULO',distance,max:r.max};
 }
 return {ok:true,reason:'OK · estimativa',distance,max:r.max};
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
  const {result:r,position}=markerLayout(p,d,target,fov,range,targets.length,i);if(!r.available)return;
  const dx=(position.x-p.x)*root.S.zoom,dy=(position.y-p.y)*root.S.zoom,rot=(Number(p.rotation)||0)*Math.PI/180;
  const x=dx*Math.cos(rot)+dy*Math.sin(rot),y=-dx*Math.sin(rot)+dy*Math.cos(rot);
  const a=markerAssessment(p,d,target,position,fov,range);
  const size=22;
  ctx.save();ctx.translate(x,y);ctx.rotate(-(p.rotation||0)*Math.PI/180);ctx.setLineDash([]);ctx.fillStyle='rgba(8,17,35,.9)';ctx.beginPath();ctx.arc(0,0,size*.72,0,Math.PI*2);ctx.fill();A.glyph(ctx,target,size);ctx.font='bold 10px Arial';ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(a.distance.toFixed(1)+' m'+(d.type==='thermal_bi'?(position.custom?' · posicionado':r.referenceMax>0?' · atual':''):''),0,size+7);
  if(position.custom){ctx.font='bold 10px Arial';ctx.fillStyle=a.ok===true?'#4ade80':a.ok===false?'#fb7185':'#fde68a';ctx.fillText(a.reason,0,size+20);}ctx.restore();
 });ctx.restore();
}
function sync(p,d){
 const reset=root.document?.getElementById('analytics-reset-targets');if(reset){reset.hidden=!p.analytics?.markerPositions||!Object.keys(p.analytics.markerPositions).length;reset.disabled=root.SIGS_V6?.currentStatus==='ARCHIVED';}
 const host=root.document?.getElementById('analytics-reach');if(!host)return;host.textContent='';const s=settings(p,d),active=A.active(p,d),locked=root.SIGS_V6?.currentStatus==='ARCHIVED';
 const aim=thermalAim(p,d),aimButton=root.document.getElementById('analytics-thermal-aim');
 if(aimButton){aimButton.hidden=!aim;aimButton.disabled=locked;aimButton.textContent=aim?'Apontar para alcance VCA · '+aim.tilt.toFixed(1)+'°':'Apontar para alcance VCA';}
 root.document.querySelectorAll('[data-analytics-mode]').forEach(button=>{const selected=button.dataset.analyticsMode===s.mode;button.setAttribute('aria-pressed',String(selected));button.classList.toggle('selected',selected);button.disabled=locked;});
 const conditions=root.document.getElementById('analytics-conditions');if(conditions)conditions.textContent=d.type==='thermal_bi'&&(d.thermalRangeBasis==='manufacturer-human-vca'||d.analytics?.channel==='thermal')?'Canal térmico, de dia e de noite. Referências VCA por alvo; validar contraste térmico, dimensão e orientação do alvo e condições de instalação. O IR e o zoom do canal visível não aumentam o alcance térmico.':s.mode==='day'?'Dia: boa iluminação, alvo completo e sem contraluz ou obstáculos.':ajaxFamily(d)?'Noite: referências Ajax e estimativa dos carros pela proporção dia/noite. Além da iluminação IR integrada, é necessária luz suficiente no alvo.':'Noite: iluminação IR ou luz suficiente no alvo; o alcance fica limitado à iluminação indicada. Evitar reflexos e objetos próximos dos LEDs.';
 const sensitivity=root.document.getElementById('analytics-ajax-sensitivity');if(sensitivity)sensitivity.hidden=!ajaxFamily(d);
 root.document.querySelectorAll('[data-analytics-setting]').forEach(el=>{el.value=s[el.dataset.analyticsSetting];el.disabled=locked;});
 const hasEstimate=['people','vehicles'].some(t=>A.capabilities(d)[t]&&profile(p,d,t)?.method==='estimate');root.document.getElementById('analytics-pixel-row').hidden=!hasEstimate;
 const targets=['people','vehicles'].filter(t=>active[t]);if(!targets.length){host.textContent='Ative um alvo para calcular o alcance.';return;}
 if(!root.S.scale.ok){host.textContent='Defina a escala para representar os alcances em metros no FOV.';return;}
 for(const target of targets){const r=calculate(p,d,target),row=root.document.createElement('div');row.className='analytics-reach-row '+target;const title=root.document.createElement('b');title.textContent=(target==='people'?'Pessoas':'Carros')+' · '+(r.referenceMax>0?'Referência VCA: '+r.referenceMax.toFixed(1)+' m':r.available?r.min.toFixed(1)+'–'+r.max.toFixed(1)+' m':r.status);row.appendChild(title);
  if(r.referenceMax>0){const current=root.document.createElement('small');current.textContent=r.available?'Orientação atual: '+r.min.toFixed(1)+'–'+r.max.toFixed(1)+' m · altura '+(p.instHeight||3)+' m · inclinação '+(p.instTilt??30)+'°.':'Orientação atual: sem enquadramento completo do alvo. Reveja a inclinação ou use «Apontar para alcance VCA».';row.appendChild(current);if(!r.available||r.max<r.referenceMax*.9){const reason=root.document.createElement('small');reason.textContent='O valor atual é limitado pelo enquadramento e pela dimensão projetada do alvo; não altera o alcance VCA publicado para a câmara.';row.appendChild(reason);}}
  if(r.available){const detail=root.document.createElement('small');detail.textContent=r.label+' · alvo '+r.targetWidth+' × '+r.targetHeight+' m · alvo na imagem '+Math.round(r.horizontalPixels)+' × '+Math.round(r.verticalPixels)+' px'+(r.method==='estimate'?' · detalhe equivalente '+Math.round(r.pixels)+' px':'')+' · imagem considerada '+Math.round(r.width)+' × '+Math.round(r.height);row.appendChild(detail);}
  for(const note of r.notes||[]){const text=root.document.createElement('small');text.textContent=note;row.appendChild(text);}if(r.source){const link=root.document.createElement('a');link.href=root.SIGSProductLinks?root.SIGSProductLinks.resolve(d,r.source):r.source;link.target='_blank';link.rel='noopener noreferrer';link.textContent=root.SIGSProductLinks?root.SIGSProductLinks.label(link.href):'Fonte do alcance de referência';row.appendChild(link);}host.appendChild(row);
 }
}
root.sigsAimThermalVCA=function(){
 const p=root.fP(root.S.selId),d=p&&root.gD(p.libId);if(!p||root.MOD!=='cctv'||root.SIGS_V6?.currentStatus==='ARCHIVED')return;
 const aim=thermalAim(p,d);if(!aim||p.instTilt===aim.tilt)return;
 root.pushUndo();p.instTilt=aim.tilt;root.saveCurrentFloor?.();root.sigsV6MarkDirty?.();root.syncP?.();root.render();
};
// Direct dragging of the person/car markers printed at the analytical range limits.
// Pointer capture enables both mouse and touch; positions are persisted with the camera.
let markerDrag=null,ignoreClickUntil=0;
function markerHit(event){
 if(!root.S?.scale?.ok||root.MOD!=='cctv'||root.S.mapOpen||(root.S.layers&&!root.S.layers.cov)||(root.S.tool&&root.S.tool!=='place')||root.SIGS_V6?.currentStatus==='ARCHIVED')return null;
 const pt=root.ep(event),cameras=[...root.S.placed].reverse();
 for(const p of cameras){
  const d=root.gD(p.libId);if(!d||p.visible===false)continue;
  const active=A.active(p,d),targets=['people','vehicles'].filter(t=>active[t]);
  const {fov,range}=markerCoverage(p,d);
  for(let i=targets.length-1;i>=0;i--){
   const target=targets[i],{result:r,position}=markerLayout(p,d,target,fov,range,targets.length,i);
   if(!r.available)continue;
   const point=root.w2s(position.x,position.y);
   if(Math.hypot(pt.x-point.x,pt.y-point.y)<=23)return {p,target,position};
  }
 }
 return null;
}
function registerMarkerDragging(){
 const cv=root.cv;if(!cv||cv.dataset.analyticsMarkersDrag==='1')return;
 cv.dataset.analyticsMarkersDrag='1';
 cv.addEventListener('pointerdown',e=>{
  if(e.button!==0||e.altKey||e.isPrimary===false||e.defaultPrevented||markerDrag)return;const hit=markerHit(e);if(!hit)return;
  e.preventDefault();e.stopImmediatePropagation();root.SIGSCanvasGesture?.claimPointer();
  root.pushUndo?.();
  hit.p.analytics=hit.p.analytics||{};
  hit.p.analytics.markerPositions=hit.p.analytics.markerPositions||{};
  hit.p.analytics.markerPositions[hit.target]={x:hit.position.x,y:hit.position.y};
  markerDrag={p:hit.p,target:hit.target,pointerId:e.pointerId};
  try{cv.setPointerCapture(e.pointerId)}catch(_){}
  cv.style.touchAction='none';cv.style.cursor='grabbing';
 },true);
 cv.addEventListener('pointermove',e=>{
  if(!markerDrag||markerDrag.pointerId!==e.pointerId)return;
  e.preventDefault();e.stopImmediatePropagation();
  const at=root.ep(e),w=root.s2w(at.x,at.y);
  markerDrag.p.analytics.markerPositions[markerDrag.target]={x:w.x,y:w.y};
  root.render?.();
 },true);
 function finish(e){
  if(!markerDrag||markerDrag.pointerId!==e.pointerId)return;
  e.preventDefault();e.stopImmediatePropagation();
  const p=markerDrag.p;markerDrag=null;ignoreClickUntil=Date.now()+250;
  try{cv.releasePointerCapture(e.pointerId)}catch(_){}
  cv.style.touchAction='';cv.style.cursor='';
  root.saveCurrentFloor?.();root.sigsV6MarkDirty?.();if(root.S.selId===p.id)A.sync(p,root.gD(p.libId));root.render?.();
 }
 cv.addEventListener('pointerup',finish,true);
 cv.addEventListener('pointercancel',finish,true);
 cv.addEventListener('lostpointercapture',finish,true);
 // The canvas parent still handles legacy mouse events for camera editing.
 // Consume compatibility events for this gesture so they cannot place another camera.
 for(const name of ['mousedown','mousemove','mouseup','click'])cv.addEventListener(name,e=>{
  if(!root.SIGSCanvasGesture&&(markerDrag||Date.now()<ignoreClickUntil)){e.preventDefault();e.stopImmediatePropagation();}
 },true);
}
if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',registerMarkerDragging);else registerMarkerDragging();}
root.sigsSetAnalyticsSetting=function(key,value){
 const p=root.fP(root.S.selId),d=p&&root.gD(p.libId);if(!p||root.MOD!=='cctv'||root.SIGS_V6?.currentStatus==='ARCHIVED')return;
 const limits={minPixels:[8,1000],peopleHeight:[.3,3],peopleWidth:[.15,2],vehiclesHeight:[.5,5],vehiclesWidth:[.5,5]};
 if(key==='mode'){if(!['day','night'].includes(value))return;}else if(key==='ajaxSensitivity'){if(!ajaxFamily(d)||!['default','maximum'].includes(value))return;}else{value=Number(value);if(!limits[key]||!Number.isFinite(value)||value<limits[key][0]||value>limits[key][1]){sync(p,d);return;}}
 if(settings(p,d)[key]===value)return;root.pushUndo();p.analytics={...p.analytics,[key]:value};root.saveCurrentFloor?.();root.sigsV6MarkDirty?.();A.sync(p,d);root._calcBlindSpot?.(p.instHeight||3,p.instTilt??30);root.render();
};
root.sigsResetAnalyticsTargets=function(){
 const p=root.fP(root.S.selId);if(!p||root.MOD!=='cctv'||root.SIGS_V6?.currentStatus==='ARCHIVED'||!p.analytics?.markerPositions)return;
 root.pushUndo();delete p.analytics.markerPositions;root.saveCurrentFloor?.();root.sigsV6MarkDirty?.();A.sync(p,root.gD(p.libId));root.render();
};
root.SIGSAnalyticsRange={ajaxTable,ajaxFamily,settings,profile,geometry,projectAt,calculate,thermalAim,outerRange,draw,sync,markerHit};A.draw=draw;
if(typeof module!=='undefined'&&module.exports)module.exports=root.SIGSAnalyticsRange;
})(typeof window!=='undefined'?window:globalThis);
