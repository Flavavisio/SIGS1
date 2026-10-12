/* Product destinations: exact Visiotech reference first, manufacturer otherwise.
 * Technical sourceURL/analytics.source remain unchanged as evidence for the specs. */
(function(root){'use strict';
const key=v=>String(v||'').trim().toUpperCase();
function safe(v){try{const u=new URL(v);return u.protocol==='https:'?u.href:'';}catch(e){return '';}}
function supplier(v){try{return new URL(v).hostname==='www.visiotechsecurity.com'&&/-detail$/.test(new URL(v).pathname);}catch(e){return false;}}
function brand(d){
 const b=String(d.brand||'').toLowerCase(),ref=key(d.model||d.reference||d.ref);
 if(['ajax','hikvision','uniview'].includes(b))return b;
 if(/^(AJ-|AJAX\.|FIBRA-)/.test(ref))return 'ajax';
 if(/^DS-/.test(ref))return 'hikvision';
 if(/^UV-|^IPC\d/.test(ref))return 'uniview';
 return '';
}
function manufacturer(v,b){try{const h=new URL(v).hostname;return {ajax:/^(?:support\.)?ajax\.systems$/,hikvision:/^(?:www\.)?hikvision\.com$/,uniview:/^(?:www\.)?uniview\.com$/}[b]?.test(h)?safe(v):'';}catch(e){return '';}}
function catalogs(){return [root.S?.lib,root.CCTV_LIB,root.AJAX_LIB,root.FIRE_LIB,root.NVR_DB,root.SIGSAjaxNVR?.nvrH,root.SIGS_CATALOG?.products].flatMap(x=>Array.isArray(x)?x:[]);}
function resolve(device,fallback){
 const input=typeof device==='string'?{ref:device}:device||{},ref=key(input.model||input.reference||input.ref||input.name);
 const current=catalogs().find(x=>(key(x.model||x.reference||x.ref||x.name)===ref||key(x.name)===ref)&&!x.custom);
 const d={...current,...input},b=brand(d);
 const source=safe(d.productURL||d.sourceURL||d.sourceUrl||fallback);
 if(d.custom||!b)return source;
 const match=root.SIGSProductDestinations106?.[key(d.model||d.reference||d.ref||d.name)];
 if(match&&supplier(match.url))return safe(match.url);
 if(supplier(source))return source;
 const official=[d.manufacturerURL,d.manufacturerUrl,d.sourceURL,d.sourceUrl,fallback,d.analytics?.source,current?.sourceURL].map(v=>manufacturer(v,b)).find(Boolean);
 return official||{ajax:'https://ajax.systems/pt/products/',hikvision:'https://www.hikvision.com/en/products/',uniview:'https://www.uniview.com/Products/'}[b];
}
function label(url){return supplier(url)?'Ver na Visiotech ↗':'Ver no fabricante ↗';}
function escape(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function markup(device,fallback){const url=resolve(device,fallback);return url?'<a class="sigs-product-link" href="'+escape(url)+'" target="_blank" rel="noopener noreferrer">'+label(url)+'</a>':'';}
function anchor(device,fallback){const url=resolve(device,fallback);if(!url||!root.document)return null;const a=root.document.createElement('a');a.className='sigs-product-link';a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label(url);a.addEventListener('click',e=>e.stopPropagation());return a;}
root.SIGSProductLinks={resolve,label,markup,anchor,brand};
if(typeof module!=='undefined'&&module.exports)module.exports=root.SIGSProductLinks;
})(typeof window!=='undefined'?window:globalThis);
