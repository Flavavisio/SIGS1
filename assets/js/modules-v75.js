/* Sidebar module shortcuts reuse the launcher icons and project entry flow. */
(function(){
'use strict';
function install(){
  var grid=document.getElementById('sigs-side-modules');
  if(!grid||grid.children.length)return;
  [['cctv','CCTV'],['alarm','Intrusão'],['fire','Incêndio'],['disk','Calculadora']].forEach(function(module){
    var source=document.querySelector('#launcher .lau-card.'+module[0]);
    if(!source)return;
    var card=document.createElement('button');
    card.type='button';card.className='sigs-module-card '+module[0];
    card.appendChild(source.querySelector('.lau-icon-wrap').cloneNode(true));
    var title=document.createElement('span');title.className='sigs-module-title';title.textContent=module[1];card.appendChild(title);
    card.addEventListener('click',function(){
      if(module[0]!=='disk'){window.sigsV6NewProject(null,module[0]);return;}
      if(!window.CLOUD||!CLOUD.user||!CLOUD.access){if(typeof notify==='function')notify('Inicia sessão primeiro.');return;}
      if(typeof window.sigsModuleAllowed==='function'&&!window.sigsModuleAllowed('disk')){if(typeof notify==='function')notify('🔒 Este módulo não está incluído na licença ativa.');return;}
      window.startModule('disk');
      document.body.classList.remove('sigs-locked');
      var gate=document.getElementById('sigs-access-gate');if(gate)gate.style.display='none';
    });
    grid.appendChild(card);
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
