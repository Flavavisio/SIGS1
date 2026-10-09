/* Lens capabilities from catalogue metadata; no optical zoom on fixed lenses. */
(function(root){'use strict';
function number(v){const n=Number(v);return Number.isFinite(n)&&n>0?n:null;}
function mm(v){return String(Number(v)).replace('.',',');}
function policy(d){d=d||{};const optics=d.optics||{},text=[d.lensType,d.lens_type,d.focalType,optics.type,d.name,d.model,d.desc,typeof d.lens==='string'?d.lens:'',typeof d.focalLength==='string'?d.focalLength:'',d.lensRange,d.focal_range].filter(Boolean).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const explicit=String(d.lensType||d.lens_type||d.focalType||optics.type||'').toLowerCase();
 const range=text.match(/(\d+(?:[.,]\d+)?)\s*(?:mm\s*)?[-–—]\s*(\d+(?:[.,]\d+)?)\s*mm/);
 let min=number(d.lensMin??d.focalMin??d.minFocalLength??d.focal_min??optics.min),max=number(d.lensMax??d.focalMax??d.maxFocalLength??d.focal_max??optics.max);
 if(range){min=min||number(range[1].replace(',','.'));max=max||number(range[2].replace(',','.'));}
 const fixed=/(fixed|fixa|fixo)/.test(explicit)||d.fixedLens===true||/(lente\s+fix[ao]|fixed\s*lens|fixed\s*focal)/.test(text);
 const adjustable=!fixed&&(String(d.type).toLowerCase()==='ptz'||d.varifocal===true||d.motorized===true||/(varifocal|variable|motoriz|motoris|motorized|motorised|speed\s*dome|\bptz\b|optical\s*zoom|zoom\s*optico)/.test(text)||(min&&max&&max>min));
 const scalar=text.match(/(?:^|[\s(])(\d+(?:[.,]\d+)?)\s*mm\b/);
 const focal=number(d.focalLength??d.fixedFocalLength??d.focal_length??optics.focal??(typeof d.lens==='number'?d.lens:null))||(scalar?number(scalar[1].replace(',','.')):null);
 const base=number(d.baseLens??d.refLens)||focal||2.8;
 if(!adjustable){const value=focal||min||base,documented=!!(focal||min||d.baseLens||d.refLens);return {kind:'fixed',adjustable:false,min:value,max:value,initial:value,base:number(d.baseLens??d.refLens)||value,documented,label:documented?'Lente fixa · '+mm(value)+' mm — ajuste bloqueado':'Lente fixa · distância focal por confirmar (simulação: '+mm(value)+' mm) — ajuste bloqueado'};}
 const documented=!!(min&&max&&max>min);
 const ptz=String(d.type).toLowerCase()==='ptz'||/speed\s*dome|\bptz\b/.test(text);
 if(ptz){
  // Only optical zoom metadata or the PTZ name; never infer from model digits / digital zoom.
  const nameZoom=String(d.name||'').replace(/(?:digital\s*(?:zoom)?\s*\d+(?:[.,]\d+)?\s*[x×]|\d+(?:[.,]\d+)?\s*[x×]\s*(?:zoom\s*)?digital)/ig,'').match(/(\d+(?:[.,]\d+)?)\s*[x×]/i);
  const z=number(d.opticalZoom??d.optical_zoom??d.zoomOptical??optics.zoom)||(nameZoom?number(nameZoom[1].replace(',','.')):null)||(documented?Math.round(max/min*10)/10:null);
  const ref=number(d.baseLens??d.refLens)||min||2.8;
  if(!documented){min=ref;max=z?ref*z:ref;}
  return {kind:'ptz',zoom:z,adjustable:!!(documented||z>1),min,max,initial:min,base:ref,documented,zoomDocumented:!!z,label:z?'Zoom óptico · '+mm(z)+'×'+(!documented?' · FOV estimado':''):'Zoom óptico por confirmar — ajuste bloqueado'};
 }
 if(!documented){min=2.8;max=13;}
 return {kind:'varifocal',adjustable:true,min,max,initial:min,base:number(d.baseLens??d.refLens)||min,documented,label:documented?'Lente varifocal · '+mm(min)+'–'+mm(max)+' mm':'Lente ajustável · intervalo de simulação 2,8–13 mm; limites do modelo por confirmar'};
}
function effective(p,d){const q=policy(d);return q.adjustable?Math.max(q.min,Math.min(q.max,number(p&&p.lens)||q.initial)):q.initial;}
function fov(p,d){d=d||{};const q=policy(d),lens=effective(p,d),base=Math.max(1,Math.min(179,number(d.fov)||90));
 if(q.adjustable&&q.documented&&number(d.fovWide)&&number(d.fovTele)){const w=Math.max(0,Math.min(1,(1/lens-1/q.max)/(1/q.min-1/q.max))),wide=Math.tan(Math.min(179,d.fovWide)*Math.PI/360),tele=Math.tan(Math.min(179,d.fovTele)*Math.PI/360);return 2*Math.atan(tele+(wide-tele)*w)*180/Math.PI;}
 return 2*Math.atan(Math.tan(base*Math.PI/360)*q.base/lens)*180/Math.PI;
}
function sync(input,p,d){if(!input)return;const q=policy(d);input.min=q.min;input.max=q.max;input.step='.1';input.value=effective(p,d);input.disabled=!q.adjustable;input.setAttribute('aria-disabled',String(!q.adjustable));input.title=q.label;return q;}
function valueLabel(p,d){const q=policy(d);return q.kind==='ptz'?(q.zoomDocumented?mm(Math.round(effective(p,d)/q.min*10)/10)+'×':'—'):mm(effective(p,d))+' mm';}
function syncControl(input,p,d){const q=sync(input,p,d);if(q&&q.kind==='ptz'){input.min=1;input.max=q.zoom||1;input.value=effective(p,d)/q.min;}return q;}
function fromControl(value,d){const q=policy(d);return q.kind==='ptz'?Number(value)*q.min:Number(value);}
function filterKey(d){if(!['dome','bullet','turret','ptz','fisheye'].includes(d.type))return '';const q=policy(d);if(q.kind==='ptz')return q.zoomDocumented?'zoom:'+q.zoom:'unknown';if(!q.documented)return 'unknown';return q.kind==='fixed'?'fixed:'+q.min:'range:'+q.min+':'+q.max;}
function filterLabel(key){const v=key.split(':');return v[0]==='zoom'?'Zoom óptico '+mm(v[1])+'×':v[0]==='fixed'?'Fixa '+mm(v[1])+' mm':v[0]==='range'?'Varifocal '+mm(v[1])+'–'+mm(v[2])+' mm':'Ótica por confirmar';}
function matches(d,kind,key){const k=filterKey(d);if(!k)return !kind&&!key;const q=policy(d);return (!kind||(kind==='unknown'?k==='unknown':q.kind===kind))&&(!key||key===k);}
root.SIGSLensModel={policy,effective,sync,syncControl,fromControl,valueLabel,fov,filterKey,filterLabel,matches};if(typeof module!=='undefined'&&module.exports)module.exports=root.SIGSLensModel;
})(typeof window!=='undefined'?window:globalThis);
