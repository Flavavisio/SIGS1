/* Module overview uses the same icons and descriptions as the launcher. */
(function(){
'use strict';
function install(){
  var button=document.getElementById('sigs-view-modules');
  if(!button)return;
  var dialog=document.createElement('dialog');
  dialog.id='sigs-modules-dialog';
  dialog.setAttribute('aria-labelledby','sigs-modules-title');
  dialog.innerHTML='<div class="sigs-modules-head"><h2 id="sigs-modules-title">Módulos SIGS Studio</h2><button type="button" class="sag-btn" aria-label="Fechar módulos">Fechar ×</button></div><div class="sigs-modules-scroll"><div class="sigs-modules-grid"></div></div>';
  document.body.appendChild(dialog);
  var grid=dialog.querySelector('.sigs-modules-grid');
  var modules=[['cctv','CCTV'],['alarm','Intrusão'],['fire','Incêndio'],['disk','Calculadora']];
  function fill(){
    grid.replaceChildren();
    modules.forEach(function(module){
      var source=document.querySelector('#launcher .lau-card.'+module[0]);
      if(!source)return;
      var card=document.createElement('article');
      card.className='sigs-module-card '+module[0];
      card.appendChild(source.querySelector('.lau-icon-wrap').cloneNode(true));
      var title=document.createElement('h3');title.textContent=module[1];card.appendChild(title);
      card.appendChild(source.querySelector('.lau-desc').cloneNode(true));
      grid.appendChild(card);
    });
  }
  button.addEventListener('click',function(){fill();if(!dialog.open)dialog.showModal();});
  dialog.querySelector('button').addEventListener('click',function(){dialog.close();});
  dialog.addEventListener('click',function(event){
    if(event.target!==dialog)return;
    var rect=dialog.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();
  });
  dialog.addEventListener('close',function(){button.focus();});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
