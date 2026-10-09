/* Company catalogue activation: server-authoritative and reset on account changes. */
(function(){
'use strict';
var allowed=false, owner='', generation=0;
function identity(){var c=window.SIGS_LICENSE&&SIGS_LICENSE.ctx;return (window.CLOUD&&CLOUD.user&&CLOUD.user.id||'')+':'+(c&&c.company&&c.company.id||'');}
function enabled(){return owner===identity()&&allowed;}
window.sigsCatalogDeviceAllowed=function(d){var b=d&&d.brand;return String(b&&typeof b==='object'?(b.slug||b.name):b||'').toLowerCase()!=='dahua'||enabled();};
window.sigsVisibleCatalog=function(rows){return (rows||[]).filter(sigsCatalogDeviceAllowed);};
function paint(){
 document.querySelectorAll('.dc-brand-tile[data-brand="dahua"]').forEach(function(e){e.hidden=!enabled();e.style.display=enabled()?'':'none';});
 var s=document.getElementById('catalog-activation-status');if(s&&enabled()){s.textContent='Equipamentos Dahua ativados para a empresa.';s.style.color='#10b981';}
 if(window.S&&S.activeLib&&!sigsCatalogDeviceAllowed(S.activeLib)){S.activeLib=null;var b=document.getElementById('pbtn');if(b)b.disabled=true;}
 if(typeof renderDevList==='function'&&document.getElementById('dlist'))renderDevList();
}
function rpc(name,body){return _sigsSbJson(_sigsSbCfg().url+'/rest/v1/rpc/'+name,{method:'POST',headers:_sigsSbHeaders(),body:JSON.stringify(body||{})});}
window.sigsCatalogRefreshAccess=function(){
 var id=identity(),seq=++generation;owner=id;allowed=false;paint();
 if(!window.CLOUD||!CLOUD.access||!CLOUD.user)return Promise.resolve(false);
 return rpc('sigs_catalog_access').then(function(v){if(seq!==generation||id!==identity())return false;allowed=v===true;paint();return allowed;}).catch(function(){return false;});
};
window.sigsSubmitCatalogActivation=async function(){
 var input=document.getElementById('catalog-activation-code'),button=document.getElementById('catalog-activation-submit'),status=document.getElementById('catalog-activation-status');
 var code=input&&input.value.trim(),ctx=window.SIGS_LICENSE&&SIGS_LICENSE.ctx,cid=ctx&&ctx.company&&ctx.company.id,id=identity();
 if(!code){status.textContent='Introduza o código de ativação.';return;}
 if(!cid){status.textContent='Empresa não encontrada.';return;}
 button.disabled=true;status.textContent='A validar…';
 try{await rpc('sigs_activate_catalog',{p_company_id:cid,p_code:code});if(id!==identity())return;input.value='';await sigsCatalogRefreshAccess();if(typeof sigsCatalogLoadRemote==='function')await sigsCatalogLoadRemote(true);status.textContent='Equipamentos Dahua ativados para a empresa.';status.style.color='#10b981';}
 catch(e){status.textContent=e.message||'Não foi possível validar o código. Tente novamente.';status.style.color='#ef4444';}
 finally{button.disabled=false;}
};
document.addEventListener('sigs-license-changed',function(){sigsCatalogRefreshAccess();});
document.addEventListener('DOMContentLoaded',function(){sigsCatalogRefreshAccess();});
})();
