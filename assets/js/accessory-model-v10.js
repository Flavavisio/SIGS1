(function(root){
'use strict';
function suggest(devices){
 var cams=devices.filter(function(d){return ['dome','bullet','turret','ptz','fisheye'].includes(d.type);}),items=[];
 if(cams.length){
  items.push({key:'camera-box',ref:'GEN-CAIXA-CCTV',name:'Caixa de ligação para câmara',qty:cams.length,unit:'un.',reason:'Uma por câmara; confirmar necessidade, dimensões, ambiente e compatibilidade antes de encomendar.'});
  items.push({key:'network-termination',ref:'GEN-TERMINACAO-REDE',name:'Terminação de rede',qty:cams.length*2,unit:'un.',reason:'Duas terminações por ligação; escolher ficha, tomada ou patch panel conforme a instalação.'});
  items.push({key:'rack-management',ref:'GEN-ORGANIZACAO-CABOS',name:'Organização e identificação de cablagem',qty:1,unit:'conj.',reason:'Conjunto de projeto a definir conforme o armário, os percursos e a quantidade de ligações.'});
 }
 var alarm=devices.filter(function(d){return /^(pir_|door|glass|keypad|siren)/.test(d.type||'');});
 if(alarm.length)items.push({key:'alarm-fixing',ref:'GEN-FIXACAO-INTRUSAO',name:'Material de fixação para intrusão',qty:alarm.length,unit:'conj.',reason:'Conjunto por dispositivo; confirmar os acessórios já incluídos e o tipo de superfície.'});
 var fire=devices.filter(function(d){return ['fire','fire_mcp','fire_siren'].includes(d.type);});
 if(fire.length)items.push({key:'fire-identification',ref:'GEN-IDENTIFICACAO-INCENDIO',name:'Identificação dos dispositivos de incêndio',qty:fire.length,unit:'un.',reason:'Identificação de projeto a confirmar na instalação. Não substitui a seleção de acessórios certificados do fabricante.'});
 return items;
}
function accept(extras,item){
 var hit=extras.find(function(r){return r.suggestionKey===item.key;});
 if(hit)return hit;
 hit={ref:item.ref,name:item.name,qty:item.qty,unit:item.unit,suggestionKey:item.key,autoQuantity:true,note:item.reason};extras.push(hit);return hit;
}
function sync(extras,items){
 extras.forEach(function(r){if(r.suggestionKey&&r.autoQuantity){var item=items.find(function(i){return i.key===r.suggestionKey;});r.qty=item?item.qty:0;}});
}
var m={suggest:suggest,accept:accept,sync:sync};root.SIGSAccessoryModel=m;if(typeof module!=='undefined'&&module.exports)module.exports=m;
})(typeof window!=='undefined'?window:globalThis);
