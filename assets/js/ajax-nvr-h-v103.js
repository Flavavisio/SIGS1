/* Ajax NVR H and Superior catalogue panel for CCTV System tab. No invented sizing. */
(function(root){'use strict';
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
function render(){
 const host=root.document.getElementById('cctv-system-content');let box=root.document.getElementById('sigs-ajax-nvr-h');
 if(root.MOD!=='cctv'||!host){box?.remove();return;}
 if(!box){box=root.document.createElement('section');box.id='sigs-ajax-nvr-h';box.className='sigs-ajax-nvr-h';host.appendChild(box);}
 const rows=root.SIGSAjaxNVR?.nvrH||[];
 const proj=root.SIGS_COMMERCIAL||{};
 const brand=String(proj.recommendationBrand||'auto').toLowerCase();
 box.innerHTML='<details><summary>Gravadores Ajax NVR H e Superior <small>('+rows.length+' modelos)</small></summary>'+
 '<p>Referências oficiais para consulta. Modelos com limites técnicos por confirmar não entram ainda na recomendação automática e não são adicionados automaticamente ao orçamento.</p>'+
 rows.map(d=>'<article><div class="nvr-h-icon">▣</div><div class="nvr-h-body"><strong>'+escape(d.name)+'</strong><span>'+escape(d.verified.join(' · '))+'</span>'+
 '<small>Por confirmar: '+escape(d.pending.join(', '))+'.</small>'+(root.SIGSProductLinks?root.SIGSProductLinks.markup(d):'<a href="'+escape(d.sourceURL)+'" target="_blank" rel="noopener noreferrer">Ficha Ajax ↗</a>')+'</div></article>').join('')+
 '<p class="nvr-h-warning">Para dimensionar os modelos Superior com PoE, confirmar o orçamento total em watts, a potência por porta e a largura de banda. A indicação «16 PoE» não significa 16 câmaras alimentadas com qualquer consumo.</p></details>';
}
function install(){
 if(root.document.getElementById('sigs-nvr-h-style'))return;
 const style=root.document.createElement('style');style.id='sigs-nvr-h-style';
 style.textContent='.sigs-ajax-nvr-h{margin-top:12px;border:1px solid #475569;border-radius:12px;padding:10px}.sigs-ajax-nvr-h summary{cursor:pointer;font-weight:700}.sigs-ajax-nvr-h p{font-size:12px;line-height:1.5}.sigs-ajax-nvr-h article{display:flex;align-items:center;gap:10px;padding:9px 2px;border-top:1px solid #47556945}.sigs-ajax-nvr-h .nvr-h-icon{background:#e9eef6;color:#1e293b;border-radius:8px;padding:12px}.sigs-ajax-nvr-h .nvr-h-body{display:flex;flex-direction:column;gap:4px;min-width:0}.sigs-ajax-nvr-h .nvr-h-body strong{font-size:12px}.sigs-ajax-nvr-h .nvr-h-body span,.sigs-ajax-nvr-h .nvr-h-body small{font-size:11px}.sigs-ajax-nvr-h .nvr-h-body a{font-size:11px;color:#60a5fa}.sigs-ajax-nvr-h .nvr-h-warning{color:#eab308}';
 root.document.head.appendChild(style);
 const old=root.buildSystemTab;
 if(typeof old==='function')root.buildSystemTab=function(){const result=old.apply(this,arguments);render();return result;};
 const observer=new MutationObserver(()=>{if(root.MOD==='cctv'&&root.document.getElementById('cctv-system-content')&&!root.document.getElementById('sigs-ajax-nvr-h'))render();});
 observer.observe(root.document.getElementById('app')||root.document.body,{childList:true,subtree:true});
 render();
}
if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',install);else install();
})(window);
