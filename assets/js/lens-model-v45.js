/* Lens capabilities from catalogue metadata; no optical zoom on fixed lenses. */
(function(root){'use strict';
function number(v){const n=Number(v);return Number.isFinite(n)&&n>0?n:null;}
function policy(d){d=d||{};const optics=d.optics||{},text=[d.lensType,d.lens_type,d.focalType,optics.type,d.name,d.desc,typeof d.lens==='string'?d.lens:'',typeof d.focalLength==='string'?d.focalLength:'',d.lensRange,d.focal_range].filter(Boolean).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const explicit=String(d.lensType||d.lens_type||d.focalType||optics.type||'').toLowerCase();
 const range=text.match(/(\d+(?:[.,]\d+)?)\s*(?:mm\s*)?[-–—]\s*(\d+(?:[.,]\d+)?)\s*mm/);
 let min=number(d.lensMin??d.focalMin??d.minFocalLength??d.focal_min??optics.min),max=number(d.lensMax??d.focalMax??d.maxFocalLength??d.focal_max??optics.max);
 if(range){min=min||number(range[1].replace(',','.'));max=max||number(range[2].replace(',','.'));}
 const fixed=/(fixed|fixa|fixo)/.test(explicit)||d.fixedLens===true||/(lente\s+fix[ao]|fixed\s*lens|fixed\s*focal)/.test(text);
 const adjustable=!fixed&&(String(d.type).toLowerCase()==='ptz'||d.varifocal===true||d.motorized===true||/(varifocal|variable|motoriz|motoris|motorized|motorised|speed\s*dome|\bptz\b|optical\s*zoom|zoom\s*optico)/.test(text)||(min&&max&&max>min));
 const scalar=text.match(/(?:^|\s)(\d+(?:[.,]\d+)?)\s*mm\b/);
 const focal=number(d.focalLength??d.fixedFocalLength??d.focal_length??optics.focal??(typeof d.lens==='number'?d.lens:null))||(scalar?number(scalar[1].replace(',','.')):null);
 const base=number(d.baseLens??d.refLens)||focal||2.8;
 if(!adjustable){const value=focal||min||base;return {adjustable:false,min:value,max:value,initial:value,base:number(d.baseLens??d.refLens)||value,documented:!!(focal||min||d.baseLens||d.refLens),label:'Lente fixa — ajuste bloqueado'};}
 const documented=!!(min&&max&&max>min);if(!documented){min=2.8;max=13;}
 return {adjustable:true,min,max,initial:min,base:number(d.baseLens??d.refLens)||2.8,documented,label:documented?'Lente ajustável · '+min+'–'+max+' mm':'Lente ajustável · intervalo de simulação 2,8–13 mm; limites do modelo por confirmar'};
}
function effective(p,d){const q=policy(d);return q.adjustable?Math.max(q.min,Math.min(q.max,number(p&&p.lens)||q.initial)):q.initial;}
function sync(input,p,d){if(!input)return;const q=policy(d);input.min=q.min;input.max=q.max;input.step='.1';input.value=effective(p,d);input.disabled=!q.adjustable;input.setAttribute('aria-disabled',String(!q.adjustable));input.title=q.label;return q;}
root.SIGSLensModel={policy,effective,sync};if(typeof module!=='undefined'&&module.exports)module.exports=root.SIGSLensModel;
})(typeof window!=='undefined'?window:globalThis);
