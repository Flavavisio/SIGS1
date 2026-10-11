/* CCTV analytics planning. Exact documented models only; no brand-wide inference.
   A marker identifies the requested target, never a guaranteed detection distance. */
(function(root){'use strict';
const cameras=['bullet','dome','turret','ptz','fisheye','thermal_bi'];
const checked='2026-10-11',registry={};
function key(d){return String(d?.model||'').trim().toUpperCase().replace(/^UV-/,'').replace(/\([^)]*\)/g,'').trim();}
function add(models,label,source){models.forEach(model=>registry[model]={people:true,vehicles:true,label,source,checked});}
const hik='https://pro-av.hikvision.com/mena-en/products/IP-Products/Network-Cameras/Pro-Series-EasyIP-/';
add(['DS-2CD2043G2-I','DS-2CD2043G2-IU'],'AcuSense', 'https://hsrc.hikvision.com/en/products/IP-Products/Network-Cameras/Pro-Series-EasyIP-/ds-2cd2043g2-i-u-/');
add(['DS-2CD2143G2-I','DS-2CD2143G2-IS'],'AcuSense',hik+'ds-2cd2143g2-i-s-/');
add(['DS-2CD2143G2-LIS2U'],'AcuSense','https://www.hikvision.com/content/dam/hikvision/pt-br/DS-2CD2143G2-LIS2U_Datasheet_20250716.pdf');
add(['DS-2CD2086G2-I','DS-2CD2086G2-IU'],'AcuSense','https://pro-av.hikvision.com/mena-en/products/IP-Products/Network-Cameras/acusense-series/ds-2cd2086g2-i-u-/');
add(['DS-2CD2186G2-I','DS-2CD2186G2-ISU'],'AcuSense','https://hsrc.hikvision.com/en/products/IP-Products/Network-Cameras/Pro-Series-EasyIP-/ds-2cd2186g2-i-su-/');
add(['DS-2CD2386G2-I','DS-2CD2386G2-IU'],'AcuSense','https://www.hikvision.com/content/dam/hikvision/products/S000000001/S000000002/S000000003/S000000025/OFR000041/M000008199/SM000059270/Data_Sheet/DS-2CD2386G2-IU-C_Datasheet_V5.5.112_20230217.pdf');
add(['DS-2CD2386G2-ISU/SL'],'AcuSense',hik+'ds-2cd2386g2-isu-sl/');
add(['DS-2CD2643G2-IZS'],'AcuSense',hik+'ds-2cd2643g2-izs/');
add(['DS-2CD2686G2-IZSU/SL'],'AcuSense',hik+'ds-2cd2686g2-izsu-sl/');
add(['DS-2CD2143G2-IU'],'AcuSense','https://www.hikvision.com/content/dam/hikvision/usa/data-sheet/acusense-series/Datasheet-for-DS-2CD2143G2-IU.pdf');
add(['DS-2CD2686G2-IZS'],'AcuSense','https://assets.hikvision.com/prd/public/all/doc/sm000059136/DS-2CD2686G2-IZS-C_Datasheet_V5.5.112_20230218.pdf');
add(['DS-2CD2387G2H-LIU'],'Classificação de pessoas e veículos','https://assets.hikvision.com/prd/public/all/doc/sm000052163/DS-2CD2387G2H-LIU_Datasheet_20230719.pdf');
add(['DS-2CD2347G2H-LIU'],'Classificação de pessoas e veículos','https://www.hikvision.com/vn/products/IP-Products/Network-Cameras/Pro-Series-EasyIP-/ds-2cd2347g2h-liu/');
const unv='https://www.uniview.com/Products/Network_Cameras/Prime_Series/PRIMEI_Series/';
['IPC3638SB-ADZK-I0','IPC2328SB-DZK-I0','IPC3238SB-ADZK-I0','IPC3618SB-ADF28KMC-I0','IPC3618SB-ADF28KMC-I1','IPC3618SB-ADF28KM-I0','IPC3618SB-ADF28KM-I1','IPC3618SB-ADF28KM-DL-I1'].forEach(m=>add([m],'SIP · classificação de alvos',unv+m+'/'));
add(['AJ-BULLETCAM-8-W'],'AI · reconhecimento de objetos','https://support.ajax.systems/en/manuals/bulletcam/');
add(['AJ-TURRETCAM-8-W','AJ-TURRETCAM-5-0400-W'],'AI · reconhecimento de objetos','https://support.ajax.systems/en/manuals/turretcam/');
add(['AJ-BULLETCAM-8-HLVF-W'],'AI · reconhecimento de objetos','https://support.ajax.systems/en/install-ajax-camera-better-ai-recognition/');
add(['AJ-DOMECAM-5-HLVF-W'],'AI · reconhecimento de objetos','https://support.ajax.systems/en/install-ajax-camera-better-ai-recognition/');
add(['AJ-TURRETCAM-8-HLVF-S-B'],'AI · reconhecimento de objetos','https://support.ajax.systems/en/install-ajax-camera-better-ai-recognition/');
function capabilities(d){
 if(!d||!cameras.includes(d.type))return {people:false,vehicles:false};
 // Explicit catalogue data, including false, takes precedence over reference defaults.
 if(d.analytics&&typeof d.analytics==='object')return {...d.analytics,people:d.analytics.people===true,vehicles:d.analytics.vehicles===true};
 if(d.custom)return {people:false,vehicles:false};
 if(d.type==='thermal_bi'&&d.thermalRangeBasis==='manufacturer-human-vca')return {people:true,vehicles:false,label:'VCA térmica · pessoas',source:d.sourceURL,checked:d.sourceChecked};
 return registry[key(d)]||{people:false,vehicles:false};
}
function active(p,d){const c=capabilities(d);return {people:c.people&&p?.analytics?.people===true,vehicles:c.vehicles&&p?.analytics?.vehicles===true};}
function matches(d,filter){const c=capabilities(d);return !filter||(filter==='any'&&(c.people||c.vehicles))||(filter==='people'&&c.people)||(filter==='vehicles'&&c.vehicles)||(filter==='both'&&c.people&&c.vehicles);}
function glyph(ctx,target,size){
 ctx.strokeStyle=target==='people'?'#ef4444':'#facc15';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=Math.max(1.5,size/12);ctx.lineCap='round';ctx.lineJoin='round';
 ctx.beginPath();
 if(target==='people'){ctx.arc(0,-size*.31,size*.13,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(0,-size*.1);ctx.lineTo(0,size*.2);ctx.moveTo(-size*.22,size*.02);ctx.lineTo(0,-size*.08);ctx.lineTo(size*.22,size*.02);ctx.moveTo(-size*.18,size*.45);ctx.lineTo(0,size*.2);ctx.lineTo(size*.18,size*.45);ctx.stroke();}
 else{ctx.moveTo(-size*.43,size*.2);ctx.lineTo(-size*.43,-size*.02);ctx.lineTo(-size*.28,-size*.08);ctx.lineTo(-size*.18,-size*.3);ctx.lineTo(size*.18,-size*.3);ctx.lineTo(size*.3,-size*.08);ctx.lineTo(size*.43,-size*.02);ctx.lineTo(size*.43,size*.2);ctx.closePath();ctx.stroke();ctx.beginPath();ctx.arc(-size*.25,size*.23,size*.08,0,Math.PI*2);ctx.arc(size*.25,size*.23,size*.08,0,Math.PI*2);ctx.fill();}
}
function draw(ctx,p,d,fov,range){
 const a=active(p,d),targets=['people','vehicles'].filter(t=>a[t]);if(!targets.length||p.visible===false||!(range>0&&fov>0))return;
 const factor=root.S.scale.ppm*root.S.zoom,ground=(p.instTilt??30)<0?{blind:0,reach:Infinity}:root.sigsGroundGeometry(p.instHeight||3,p.instTilt??30,fov);
 const blind=Math.max(0,ground.blind||0)*factor,far=Math.min(range,Number.isFinite(ground.reach)&&fov<180?ground.reach:range)*factor;
 if(!(far>blind+4))return;
 const r=blind+(far-blind)*.55,angle=Math.min(fov/6,12)*Math.PI/180;
 const size=Math.min(22,(far-blind)*.4,Math.max(3,r*Math.sin(Math.min(fov/2,80)*Math.PI/180)*.75));if(size<5)return;
 ctx.save();ctx.setLineDash([]);
 targets.forEach((target,i)=>{const ang=-Math.PI/2+(targets.length===2?(i?angle:-angle):0);ctx.save();ctx.translate(Math.cos(ang)*r,Math.sin(ang)*r);ctx.rotate(-(p.rotation||0)*Math.PI/180);ctx.fillStyle='rgba(8,17,35,.88)';ctx.beginPath();ctx.arc(0,0,size*.72,0,Math.PI*2);ctx.fill();glyph(ctx,target,size);ctx.restore();});ctx.restore();
}
function sync(p,d){
 const panel=root.document?.getElementById('cctv-analytics');if(!panel)return;panel.hidden=root.MOD!=='cctv';if(panel.hidden)return;
 const c=capabilities(d),a=active(p,d),locked=root.SIGS_V6?.currentStatus==='ARCHIVED';
 ['people','vehicles'].forEach(t=>{const el=root.document.getElementById('p-analytics-'+t);el.checked=a[t];el.disabled=!c[t]||locked;el.closest('label').classList.toggle('unavailable',!c[t]);});
 const status=root.document.getElementById('analytics-model');status.textContent=c.people||c.vehicles?(c.label||'Analítica documentada'):'Analítica de pessoas/carros por confirmar para este modelo.';
 const source=root.document.getElementById('analytics-source');source.hidden=!/^https:\/\//.test(c.source||'');if(!source.hidden){source.href=c.source;source.textContent='Ficha / guia do fabricante';}
 if(root.SIGSAnalyticsRange)root.SIGSAnalyticsRange.sync(p,d);
}
root.sigsSetAnalytics=function(target,value){
 const p=root.fP(root.S.selId),d=p&&root.gD(p.libId);if(root.MOD!=='cctv'||!p||!['people','vehicles'].includes(target))return;
 if(root.SIGS_V6?.currentStatus==='ARCHIVED'||!capabilities(d)[target]){sync(p,d);return;}
 const next=value===true;if(active(p,d)[target]===next)return;
 root.pushUndo();p.analytics={...p.analytics,[target]:next};root.saveCurrentFloor?.();root.sigsV6MarkDirty?.();sync(p,d);root.render();
};
root.SIGSAnalytics={registry,key,capabilities,active,matches,glyph,draw,sync};
if(typeof module!=='undefined'&&module.exports)module.exports=root.SIGSAnalytics;
})(typeof window!=='undefined'?window:globalThis);
