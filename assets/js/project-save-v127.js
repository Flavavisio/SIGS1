/* Move inline floor-plan images out of project JSON before an atomic checkpoint.
   Files are immutable by content; snapshots and in-flight edits keep their own image. */
(function(root){'use strict';
const completed=new Map();
function plans(value,visit,seen=new Set()){
 if(!value||typeof value!=='object'||seen.has(value))return;seen.add(value);
 for(const [key,child] of Object.entries(value)){
  if(key==='fp'&&child&&typeof child==='object')visit(child);
  if(child&&typeof child==='object')plans(child,visit,seen);
 }
}
function active(context){return root.CLOUD?.projectId===context.projectId&&root.CLOUD?.user?.id===context.userId;}
async function prepare(patch,context){
 const images=new Map();
 plans(patch.project_data,fp=>{if(fp.storagePath){delete fp.imgData;return;}
  if(typeof fp.imgData==='string'&&fp.imgData.startsWith('data:image/')){
   if(!images.has(fp.imgData))images.set(fp.imgData,[]);images.get(fp.imgData).push(fp);
  }
 });
 if(!images.size)return {patch,commit(){}};
 const cfg=root._sigsSbCfg();
 const owners=await root._sigsSbJson(cfg.url+'/rest/v1/projects?select=company_id&id=eq.'+encodeURIComponent(context.projectId),{headers:root._sigsSbHeaders()});
 const companyId=owners?.[0]?.company_id;if(!companyId)throw Error('Não foi possível confirmar a empresa do projeto para guardar as plantas.');
 const stored=new Map();
 for(const [data,targets] of images){
  if(!active(context))throw Error('O projeto ou a sessão mudou durante a gravação.');
   const match=/^data:(image\/(?:png|jpeg|webp));base64,([\s\S]+)$/.exec(data);
   if(!match)throw Error('Formato da planta não suportado. Usa PNG, JPEG ou WebP.');
   const binary=root.atob(match[2]),bytes=new Uint8Array(binary.length);
   for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
   if(!root.crypto?.subtle)throw Error('Abre o SIGS por HTTPS para guardar as plantas com segurança.');
   const digest=await root.crypto.subtle.digest('SHA-256',bytes);
   const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
   const cacheKey=context.userId+'/'+context.projectId+'/'+hash;
   let meta=completed.get(cacheKey);
   if(!meta){
   const extension=match[1]==='image/jpeg'?'jpg':match[1].split('/')[1];
   const path=companyId+'/'+context.projectId+'/floorplans/'+hash+'.'+extension;
   await root._sigsSbJson(cfg.url+'/storage/v1/object/project-files/'+path,{method:'POST',headers:root._sigsSbHeaders({'Content-Type':match[1],'x-upsert':'true'}),body:new root.Blob([bytes],{type:match[1]})});
   meta={storagePath:path,mimeType:match[1],sizeBytes:bytes.length};
   completed.set(cacheKey,meta);if(completed.size>16)completed.delete(completed.keys().next().value);
  }
  stored.set(data,meta);
  for(const fp of targets){Object.assign(fp,meta);delete fp.imgData;}
 }
 return {patch,commit(){
  if(!active(context))return;
  function adopt(fp){const meta=stored.get(fp.imgData);if(meta){Object.assign(fp,meta);fp.imgData=null;}}
  // Only replace matching images. A newly imported plant or changed geometry stays intact.
  plans(root.FLOORS,adopt);if(root.S?.fp)adopt(root.S.fp);plans(root.SIGS_COMMERCIAL,adopt);
 }};
}
root.SIGSProjectSave={prepare};
})(window);
