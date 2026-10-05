(function(root){
'use strict';
function imageKey(value){value=String(value||'');let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619);}return value.length+':'+(h>>>0);}
function signature(floors){return JSON.stringify((floors||[]).map(f=>({id:f.id,fp:f.fp?{x:f.fp.x,y:f.fp.y,w:f.fp.w,h:f.fp.h,image:imageKey(f.fp.storagePath||f.fp.imgData)}:null,scale:f.scale,placed:(f.placed||[]).map(p=>({id:p.id,libId:p.libId,x:p.x,y:p.y,rotation:p.rotation,lens:p.lens,afov:p.afov,arange:p.arange,instHeight:p.instHeight,instTilt:p.instTilt,mp:p.mp}))})));}
function collect(input,technical){const list=[],floors=input.floors||[],c=input.commercial||{},add=(id,level,title,text,action,extra={})=>list.push({id,level,title,text,action,...extra});
 floors.forEach((f,i)=>{if(!f.fp)add('plant-'+i,'warning','Planta · '+f.name,'Adiciona uma planta ou captura o mapa deste piso.','plant',{floor:i});if(!f.scale?.ok)add('scale-'+i,'warning','Escala · '+f.name,'Define a escala para calcular distâncias e cobertura.','scale',{floor:i});});
 for(const [field,title] of [['company','Empresa'],['client','Cliente'],['reference','Referência da proposta']])if(!String(c[field]||'').trim())add(field,'warning',title+' por preencher','Completa este dado antes de enviar a proposta.','budget',{field});
 if(![c.terms,c.paymentTerms,c.executionTerms].some(v=>String(v||'').trim()))add('terms','warning','Condições comerciais por definir','Indica o âmbito, condições de pagamento e execução.','budget',{field:'terms'});
 const count=floors.reduce((t,f)=>t+(f.placed||[]).length,0),ready=count>0&&floors.filter(f=>f.placed?.length).every(f=>f.fp&&f.scale?.ok),reviewed=c.coverageReviewSignature===signature(floors);
 if(input.module==='cctv'&&count&&!reviewed)add('coverage','warning','Cobertura por rever','Confirma as zonas críticas, campos de visão, zonas cegas e objetivos DORI na planta. A app não certifica cobertura sem revisão no local.','coverage');
 (technical||[]).filter(x=>!['Planta por adicionar','Escala por definir'].includes(x.title)).forEach((x,i)=>add('technical-'+i,x.level,x.title,x.text,x.title==='Preços por completar'?'budget':x.title==='Sem equipamentos'||x.title==='Referência indisponível'?'equipment':'system'));
 const seen=new Set();return {items:list.filter(x=>{const key=x.title+'|'+x.text;if(seen.has(key))return false;seen.add(key);return true;}).sort((a,b)=>({error:0,warning:1,info:2}[a.level]??2)-({error:0,warning:1,info:2}[b.level]??2)),coverageReady:ready,coverageReviewed:reviewed,signature:signature(floors)};
}
root.SIGSPendingModel={signature,collect};if(typeof module!=='undefined'&&module.exports)module.exports=root.SIGSPendingModel;
})(typeof window!=='undefined'?window:globalThis);
