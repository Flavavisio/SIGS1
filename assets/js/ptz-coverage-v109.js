/* Full PTZ movement potential, underneath the current directional field of view. */
(function(w){'use strict';
let opacityEdit=null;
function opacity(p){return Number.isFinite(p.ptz360Opacity)?Math.max(0,Math.min(1,p.ptz360Opacity)):.12;}
function isPTZ(d){
 const type=String(d?.type||'').toLowerCase();
 return type==='ptz'||['thermal_bi','dome','bullet','turret','cube'].includes(type)&&w.SIGSLensModel?.policy(d).kind==='ptz';
}
function geometry(p,d){
 if(w.MOD!=='cctv'||!isPTZ(d)||p.visible===false||!w.S?.layers?.cov||!(w.S.scale?.ppm>0))return null;
 // A PTZ can pan AND tilt. The potential disk spans its optical range; current
 // inclination and blind-zone clipping belong only to the foreground cone.
 const g=w.SIGSCameraFOV.optics(p,d),range=g.range;
 if(!(range>0)||!Number.isFinite(range))return null;
 const factor=w.S.scale.ppm*w.S.zoom;
 return {center:w.w2s(p.x,p.y),radius:range*factor,blind:0};
}
w.sigsDrawPTZOverview=function(p,d){
 const g=geometry(p,d);if(!g)return;
 const ctx=w.ctx,alpha=opacity(p),color=p.color||d.color||'#8b5cf6';if(alpha<=0)return;
 ctx.save();ctx.translate(g.center.x,g.center.y);ctx.beginPath();
 ctx.arc(0,0,g.radius,0,Math.PI*2);
 ctx.fillStyle=w.hr(color,alpha);ctx.fill();
 ctx.beginPath();ctx.arc(0,0,g.radius,0,Math.PI*2);
 ctx.strokeStyle=w.hr(color,Math.min(.65,alpha*3.5));ctx.lineWidth=1.5;ctx.setLineDash([5,6]);ctx.stroke();
 if(w.S.selId===p.id&&g.radius>28){
  const distance=Math.min(g.radius*.75,84),angle=((p.rotation||0)+180)*Math.PI/180;
  ctx.setLineDash([]);ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.fillStyle=w.hr(color,Math.min(.9,alpha*7));ctx.fillText('360°',Math.sin(angle)*distance,-Math.cos(angle)*distance);
 }
 ctx.restore();
};
w.SIGSPTZOverview={geometry,isPTZ,opacity};
w.sigsSetPTZOpacity=function(value){
 const p=w.S?.placed?.find(p=>p.id===w.S.selId),d=p&&w.gD(p.libId);
 value=Number(value);if(!p||w.MOD!=='cctv'||!isPTZ(d)||w.SIGS_V6?.currentStatus==='ARCHIVED'||!Number.isFinite(value)||value<0||value>1)return;
 if(opacity(p)===value)return;
 if(opacityEdit!==p){w.pushUndo?.();opacityEdit=p;}
 p.ptz360Opacity=value;w.saveCurrentFloor?.();w.sigsV6MarkDirty?.();w.syncP();w.render();
};
w.sigsFinishPTZOpacity=function(){opacityEdit=null;};
const sync=w.syncP;
w.syncP=function(){
 const result=sync.apply(this,arguments),panel=document.getElementById('cctv-install');
 const p=w.S.placed.find(p=>p.id===w.S.selId),ptz=w.MOD==='cctv'&&p&&isPTZ(w.gD(p.libId));
 if(opacityEdit&&opacityEdit!==p)opacityEdit=null;
 const row=document.getElementById('ptz360-opacity-row'),input=document.getElementById('ptz360-opacity');
 if(row)row.style.display=ptz?'':'none';
 if(input&&ptz){input.value=Math.round(opacity(p)*100);input.disabled=w.SIGS_V6?.currentStatus==='ARCHIVED';document.getElementById('ptz360-opacity-value').textContent=input.value+'%';}
 if(panel){
  let note=document.getElementById('sigs-ptz-note');
  if(!note){note=document.createElement('p');note.id='sigs-ptz-note';note.style.cssText='font-size:11px;color:#a5b4fc;line-height:1.5';panel.appendChild(note);}
  note.textContent='PTZ · O círculo completo a 360° mostra a área potencial ao orientar a câmara. O cone mostra a direção e inclinação atuais. Ajusta a transparência de cada área em Aparência. A área potencial não é cobertura simultânea.';note.hidden=!ptz;
 }
 return result;
};
})(window);
