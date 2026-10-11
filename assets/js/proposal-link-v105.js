/* Proposal link for authorised clients; project RLS still decides access. */
(function(root){'use strict';
function install(){
 if(document.getElementById('sigs-proposal-link'))return;
 const top=document.getElementById('top');if(!top)return;
 const button=document.createElement('button');button.type='button';button.id='sigs-proposal-link';button.className='tb';button.textContent='🔗 Proposta cliente';button.title='Link de consulta com autenticação. Não concede permissões automaticamente.';
 button.onclick=async()=>{
  const id=root.CLOUD?.projectId;
  if(!id){root.notify?.('Guarda primeiro o projeto na tua conta.');return;}
  if(root.SIGS_V6?.dirty){root.notify?.('Guarda as alterações antes de enviar a proposta.');return;}
  const url=new URL('proposta-cliente.html',location.href);url.searchParams.set('project',id);
  try{await navigator.clipboard.writeText(url.href);root.notify?.('Ligação copiada. O cliente precisa de permissão e autenticação para consultar.');}
  catch(e){root.prompt('Copiar ligação de consulta privada:',url.href);}
 };
 top.appendChild(button);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})(window);
