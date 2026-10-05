/* Product signature remains separate from the installing company's identity. */
(function(){
'use strict';
const logoURL=new URL('assets/brand/sigs-studio-logo.png',document.baseURI).href;
const image='<img class="sigs-brand-image" src="'+logoURL+'" alt="SIGS Studio">';
window.SIGSBrand={name:'SIGS Studio',slogan:'Segurança bem projetada.',logoURL,
 signatureHTML(){return '<div class="sigs-product-signature">'+image+'<span>by SIGS Studio<br><small>Segurança bem projetada.</small></span></div>';}};
function install(){
 const gate=document.querySelector('.sag-brand');if(gate)gate.innerHTML=image;
 const gateMark=document.querySelector('.sag-mark');if(gateMark)gateMark.hidden=true;
 const launcher=document.querySelector('.lau-brand-name');if(launcher)launcher.innerHTML=image;
 const launcherMark=document.querySelector('.lau-brand-icon');if(launcherMark)launcherMark.hidden=true;
 const top=document.querySelector('#top .logo');if(top&&!top.querySelector('.sigs-brand-image'))top.insertAdjacentHTML('afterbegin',image);
 const copy=document.querySelector('.sag-copy');if(copy)copy.textContent='Segurança bem projetada. Da planta ao dimensionamento, dos materiais à proposta.';
 const foot=document.querySelector('.studio-rail-foot');if(foot)foot.textContent='SIGS Studio\nSegurança bem projetada.';
 const title=document.querySelector('.lau-logo');if(title)title.textContent='Segurança bem projetada.';
 const present=document.getElementById('present-logo-wrap');if(present){present.innerHTML=image;present.classList.add('sigs-present-brand');}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
