/* Direct camera aiming and optical zoom. Geometry remains owned by the lens/catalogue models. */
(function(root){'use strict';
const cameraTypes=['bullet','dome','turret','ptz','thermal_bi','cube','doorbell'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rad=Math.PI/180;
let drag=null,suppressUntil=0,hideControls=false;
function editable(){return root.MOD==='cctv'&&root.S?.scale?.ok&&!root.S.mapOpen&&(!root.S.tool||root.S.tool==='place')&&root.SIGS_V6?.currentStatus!=='ARCHIVED';}
function eligible(d){return d&&cameraTypes.includes(d.type);}
function optics(p,d){
 const L=root.SIGSLensModel,q=L.policy(d),lens=L.effective(p,d),fov=L.fov(p,d),vertical=L.verticalFov(p,d);
 const thermal=d.type==='thermal_bi'&&!q.adjustable;
 const hfov=thermal?d.thermalFov||fov:fov,vfov=thermal?d.thermalVerticalFov:vertical;
 const ground=root.sigsGroundGeometry(p.instHeight||3,p.instTilt??30,hfov,null,vfov);
 let range=thermal?d.thermalRange||d.range:typeof root.lRange==='function'?root.lRange(d.range,lens,p,d):root.SIGSProposalOptics.capture(p,d).range;
 if(root.SIGSAnalyticsRange)range=root.SIGSAnalyticsRange.outerRange(p,d,range);
 return {q,lens,fov:hfov,vertical:vfov,ground,range:Math.max(0,range||0)};
}
function layout(p,d){
 if(!eligible(d)||!root.S?.scale?.ok||p.visible===false||!root.S.layers?.cov)return [];
 const g=optics(p,d),ppm=root.S.scale.ppm,zoom=root.S.zoom||1,rotation=(p.rotation||0)*rad;
 if(!(g.fov>0&&g.fov<180&&ppm>0))return [];
 const limit=Math.max(60,Math.min(root.cv?.width||800,root.cv?.height||600)*.32)/(ppm*zoom);
 const raw=(p.instTilt??30)>0?(p.instHeight||3)/Math.tan((p.instTilt??30)*rad):Infinity;
 const aim=Number.isFinite(raw)?raw:Math.min(g.range||limit,limit);
 const shown=clamp(aim,42/(ppm*zoom),limit);
 function point(kind,angle,distance){return {kind,x:p.x+Math.sin(rotation+angle)*distance*ppm,y:p.y-Math.cos(rotation+angle)*distance*ppm};}
 const handles=[{...point('aim',0,shown),distanceOffset:shown-aim}];
 if(g.q.adjustable){
  const far=Math.min(g.range,g.ground.reach),side=clamp(Number.isFinite(far)&&far>0?far:limit,64/(ppm*zoom),limit);
  handles.push(point('zoom-left',-g.fov*rad/2,side),point('zoom-right',g.fov*rad/2,side));
 }
 return handles;
}
function update(p,d,kind,point,offset=0){
 const dx=point.x-p.x,dy=point.y-p.y;
 if(kind==='aim'){
  const metres=Math.max(.01,Math.hypot(dx,dy)/root.S.scale.ppm-offset);
  p.rotation=(Math.atan2(dx,-dy)/rad+360)%360;
  p.instTilt=Math.round(clamp(Math.atan2(p.instHeight||3,metres)/rad,0,90)*10)/10;
 }else if(kind.startsWith('zoom')){
  const L=root.SIGSLensModel,q=L.policy(d);if(!q.adjustable)return;
  const bearing=Math.atan2(dx,-dy)-(p.rotation||0)*rad;
  const angle=Math.abs(Math.atan2(Math.sin(bearing),Math.cos(bearing)))/rad;
  const desired=clamp(angle*2,L.fov({lens:q.max},d),L.fov({lens:q.min},d));
  let lo=q.min,hi=q.max;
  for(let i=0;i<30;i++){const mid=(lo+hi)/2;if(L.fov({lens:mid},d)>desired)lo=mid;else hi=mid;}
  p.lens=clamp(Math.round((lo+hi)*5000)/10000,q.min,q.max);
 }
}
function selected(){const p=root.S?.placed?.find(p=>p.id===root.S.selId),d=p&&root.gD(p.libId);return p&&eligible(d)?{p,d}:null;}
function draw(){
 if(hideControls||!editable())return;const s=selected();if(!s)return;
 const handles=layout(s.p,s.d),ctx=root.ctx;if(!ctx)return;
 ctx.save();ctx.setLineDash([4,4]);ctx.lineWidth=1;ctx.strokeStyle='rgba(255,255,255,.65)';
 const origin=root.w2s(s.p.x,s.p.y);
 handles.forEach(h=>{
  const at=root.w2s(h.x,h.y);ctx.beginPath();ctx.moveTo(origin.x,origin.y);ctx.lineTo(at.x,at.y);ctx.stroke();
  ctx.save();ctx.setLineDash([]);ctx.beginPath();ctx.arc(at.x,at.y,h.kind==='aim'?9:7,0,Math.PI*2);ctx.fillStyle=h.kind==='aim'?'#ec4899':'#38bdf8';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();ctx.restore();
 });
 if(drag&&drag.kind!=='move'){
  const p=drag.p,at=root.w2s(p.x,p.y);ctx.setLineDash([]);ctx.font='bold 11px Arial';ctx.fillStyle='#fff';ctx.textAlign='left';
  ctx.fillText('Direção '+(p.rotation||0).toFixed(1)+'° · Inclinação '+(p.instTilt??30).toFixed(1)+'° · '+root.SIGSLensModel.valueLabel(p,drag.d),at.x+26,at.y-26);
 }
 ctx.restore();
}
function install(){
 const cv=root.cv;if(!cv||cv.dataset.cameraFovDrag==='1')return;cv.dataset.cameraFovDrag='1';
 const owner=root.cw||cv;
 const render=root.render;root.render=function(){const r=render.apply(this,arguments);draw();return r;};
 const png=root.exportPNG;if(typeof png==='function')root.exportPNG=function(){hideControls=true;try{return png.apply(this,arguments);}finally{hideControls=false;root.render();}};
 owner.addEventListener('pointerdown',e=>{
  if(e.target!==cv||!editable()||e.button!==0||e.isPrimary===false||e.altKey||e.ctrlKey||e.metaKey||e.defaultPrevented||drag)return;
  const pos=root.ep(e),s=selected();let candidate=null;
  if(s)candidate=layout(s.p,s.d).map(h=>({...h,...s})).find(h=>{const at=root.w2s(h.x,h.y);return Math.hypot(at.x-pos.x,at.y-pos.y)<=17;});
  if(!candidate&&root.S.layers?.dev!==0&&!(root.S.multiSel?.length>1)){
   const p=[...root.S.placed].reverse().find(p=>eligible(root.gD(p.libId))&&Math.hypot(root.w2s(p.x,p.y).x-pos.x,root.w2s(p.x,p.y).y-pos.y)<=20);
   if(p)candidate={kind:'move',p,d:root.gD(p.libId)};
  }
  if(!candidate)return;e.preventDefault();e.stopImmediatePropagation();root.pushUndo?.();
  const world=root.s2w(pos.x,pos.y),p=candidate.p;
  drag={...candidate,pointerId:e.pointerId,floor:root.FLOORS?.[root.FLOOR_CUR],before:{x:p.x,y:p.y,rotation:p.rotation,instTilt:p.instTilt,lens:p.lens},offset:{x:world.x-p.x,y:world.y-p.y}};
  root.select?.(p.id);try{cv.setPointerCapture(e.pointerId);}catch(_){}cv.style.cursor='grabbing';root.render();
 },true);
 function current(){return drag&&editable()&&root.S.placed.includes(drag.p)&&root.FLOORS?.[root.FLOOR_CUR]===drag.floor;}
 function finish(e,cancel=false){
  if(!drag||e.pointerId!==drag.pointerId)return;e.preventDefault();e.stopImmediatePropagation();
  const valid=current(),old=drag;drag=null;
  if(cancel||!valid)Object.keys(old.before).forEach(k=>{if(old.before[k]===undefined)delete old.p[k];else old.p[k]=old.before[k];});
  suppressUntil=Date.now()+300;try{cv.releasePointerCapture(e.pointerId);}catch(_){}cv.style.cursor='';
  if(valid){root.syncP?.();root.saveCurrentFloor?.();root.sigsV6MarkDirty?.();}root.render();
 }
 owner.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pointerId)return;if(!current()){finish(e,true);return;}e.preventDefault();e.stopImmediatePropagation();
  const pos=root.ep(e),point=root.s2w(pos.x,pos.y);
  if(drag.kind==='move'){drag.p.x=point.x-drag.offset.x;drag.p.y=point.y-drag.offset.y;}
  else update(drag.p,drag.d,drag.kind,point,drag.distanceOffset||0);
  root.syncP?.();root.render();
 },true);
 owner.addEventListener('pointerup',e=>finish(e),true);owner.addEventListener('pointercancel',e=>finish(e,true),true);owner.addEventListener('lostpointercapture',e=>finish(e),true);
 for(const name of ['mousedown','mousemove','mouseup','click'])cv.addEventListener(name,e=>{if(drag||Date.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
 root.document.addEventListener('keydown',e=>{if(drag&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();finish({pointerId:drag.pointerId,preventDefault(){},stopImmediatePropagation(){}},true);}},true);
 const panel=root.document.getElementById('cctv-install');if(panel&&!root.document.getElementById('fov-drag-help')){
  const help=root.document.createElement('p');help.id='fov-drag-help';help.className='fov-drag-help';help.textContent='Na planta: arrasta o ponto rosa para rodar e inclinar. Nas lentes ajustáveis, arrasta os pontos azuis para alterar o zoom.';panel.appendChild(help);
 }
}
root.SIGSCameraFOV={layout,update,optics};
if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',install);else install();}
})(typeof window!=='undefined'?window:globalThis);
