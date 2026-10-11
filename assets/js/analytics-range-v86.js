/* Analytics reach: documented reference caps or an explicitly editable SIGS pixel criterion.
   Pinhole projection of the complete target includes camera height, tilt and azimuth.
   Recording resolution is a calculation reference, not a claim about the AI processing stream. */
(function(root){'use strict';
const A=root.SIGSAnalytics,N=(v,f)=>Number.isFinite(Number(v))&&Number(v)>0?Number(v):f;
const ajaxGuide='https://support.ajax.systems/en/install-ajax-camera-better-ai-recognition/';
const cache=new Map();
function settings(p,d){const a=p.analytics||{};return {mode:a.mode==='day'?'day':'night',minPixels:Math.max(8,Math.min(1000,N(a.minPixels,108))),peopleHeight:Math.max(.3,Math.min(3,N(a.peopleHeight,d.type==='thermal_bi'?1.8:1.75))),peopleWidth:Math.max(.15,Math.min(2,N(a.peopleWidth,.5))),vehiclesHeight:Math.max(.5,Math.min(5,N(a.vehiclesHeight,1.5))),vehiclesWidth:Math.max(.5,Math.min(5,N(a.vehiclesWidth,1.8))) };}
function profile(p,d,target){
 const s=settings(p,d),c=A.capabilities(d);if(!c[target])return null;
 if(d.type==='thermal_bi'&&target==='people'&&d.thermalRangeBasis==='manufacturer-human-vca')return {min:.05,max:N(d.thermalRange,0),method:'documented',label:'Referência VCA do fabricante',source:d.sourceURL,thermal:true,notes:['Alcance de referência para pessoa de 1,8 × 0,5 m; confirmar condições e tamanho do alvo.']};
 if(d.brand==='ajax'){
  const ranges=s.mode==='day'?{people:[2,25],vehicles:[4,35]}:{people:[2,21],vehicles:[4,26]},r=ranges[target],notes=['Guia geral Ajax, sensibilidade predefinida. Permanência do alvo: pelo menos 2 s.'];
  if((p.instHeight||3)<3||(p.instHeight||3)>4.5)notes.push('Rever altura: o guia recomenda 3–4,5 m.');
  if((p.instTilt??30)<=0||(p.instTilt??30)>45)notes.push('Rever inclinação: o guia recomenda cerca de 30°, até 45°.');
  return {min:Math.max(r[0],(p.instHeight||3)/2),max:r[1],method:'documented',label:'Referência recomendada Ajax · '+(s.mode==='day'?'dia':'noite'),source:ajaxGuide,notes};
 }
 return {min:.05,max:500,method:'estimate',label:'Estimativa geométrica · critério SIGS',notes:['Mínimo de '+s.minPixels+' px de altura do alvo. Critério de projeto ajustável; não é um limite IA publicado para este modelo.']};
}
function geometry(p,d,target,options={}){
 const s=settings(p,d),pr=profile(p,d,target);if(!pr)return null;
 const width=pr.thermal?d.thermalResW:(root.SIGSEngineeringModel?root.SIGSEngineeringModel.widthPixels(p,d):N(p.recordWidth,N(d.resW,2688)));
 const same=!p.mp||Number(p.mp)===Number(d.mp),height=pr.thermal?d.thermalResH:(same&&!p.recordWidth?N(d.resH,width*9/16):width*9/16);
 const fov=N(options.fov,pr.thermal?d.thermalFov:(root.SIGSLensModel?root.SIGSLensModel.fov(p,d):d.fov));
 if(!(fov>0&&fov<180&&width>0&&height>0))return {invalid:'Geometria panorâmica: validar no equipamento.'};
 const tanH=Math.tan(fov*Math.PI/360),tanV=pr.thermal&&d.thermalVerticalFov?Math.tan(d.thermalVerticalFov*Math.PI/360):tanH*height/width;
 const tilt=Number(p.instTilt??30)*Math.PI/180,h=N(p.instHeight,3),angle=Number(options.angle||0),H=s[target+'Height'],W=s[target+'Width'];
 let max=pr.max;const notes=pr.notes.slice();
 if(!pr.thermal&&root.SIGSLensModel&&!root.SIGSLensModel.policy(d).documented)notes.push('Ótica do catálogo por confirmar: validar FOV e lente no equipamento.');
 if(s.mode==='night'&&!pr.thermal){const light=N(d.range,0);if(!(light>0))return {invalid:'Alcance noturno de iluminação por confirmar.'};max=Math.min(max,light);notes.push('Noite: limitado também ao alcance de iluminação indicado ('+light+' m).');}
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
 const g=geometry(p,d,target,options);if(!g)return {available:false,status:'Analítica por confirmar.'};if(g.invalid)return {available:false,status:g.invalid};
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
 if(key==='mode'){if(!['day','night'].includes(value))return;}else{value=Number(value);if(!limits[key]||!Number.isFinite(value)||value<limits[key][0]||value>limits[key][1]){sync(p,d);return;}}
 if(settings(p,d)[key]===value)return;root.pushUndo();p.analytics={...p.analytics,[key]:value};root.saveCurrentFloor?.();root.sigsV6MarkDirty?.();A.sync(p,d);root.render();
};
root.SIGSAnalyticsRange={settings,profile,geometry,projectAt,calculate,outerRange,draw,sync};A.draw=draw;
if(typeof module!=='undefined'&&module.exports)module.exports=root.SIGSAnalyticsRange;
})(typeof window!=='undefined'?window:globalThis);
