/* Potential PTZ pan sweep, underneath the current directional field of view. */
(function(w){'use strict';
function geometry(p,d){
 if(w.MOD!=='cctv'||d?.type!=='ptz'||p.visible===false||!w.S?.scale?.ok||!w.S.layers?.cov)return null;
 const g=w.SIGSCameraFOV.optics(p,d),range=Math.min(g.range,g.ground.reach);
 if(!(range>g.ground.blind)||!Number.isFinite(range))return null;
 const factor=w.S.scale.ppm*w.S.zoom;
 return {center:w.w2s(p.x,p.y),radius:range*factor,blind:g.ground.blind*factor};
}
w.sigsDrawPTZOverview=function(p,d){
 const g=geometry(p,d);if(!g)return;
 const ctx=w.ctx,opacity=p.opacity??.22,color=p.color||d.color||'#8b5cf6';
 ctx.save();ctx.translate(g.center.x,g.center.y);ctx.beginPath();
 ctx.arc(0,0,g.radius,0,Math.PI*2);
 if(g.blind>0){ctx.moveTo(g.blind,0);ctx.arc(0,0,g.blind,0,Math.PI*2,true);}
 ctx.fillStyle=w.hr(color,Math.min(.055,opacity*.22));ctx.fill('evenodd');
 ctx.beginPath();ctx.arc(0,0,g.radius,0,Math.PI*2);
 ctx.strokeStyle=w.hr(color,Math.min(.28,opacity*.9));ctx.lineWidth=1;ctx.setLineDash([5,6]);ctx.stroke();
 ctx.restore();
};
w.SIGSPTZOverview={geometry};
const sync=w.syncP;
w.syncP=function(){
 const result=sync.apply(this,arguments),panel=document.getElementById('cctv-install');
 if(panel){
  let note=document.getElementById('sigs-ptz-note');
  if(!note){note=document.createElement('p');note.id='sigs-ptz-note';note.style.cssText='font-size:11px;color:#a5b4fc;line-height:1.5';note.textContent='PTZ · O círculo suave mostra a área potencial de rotação a 360°. O FOV mais forte mostra a direção atual. A área potencial não é cobertura simultânea e depende dos obstáculos.';panel.appendChild(note);}
  const p=w.S.placed.find(p=>p.id===w.S.selId);note.hidden=!p||w.gD(p.libId)?.type!=='ptz';
 }
 return result;
};
})(window);
