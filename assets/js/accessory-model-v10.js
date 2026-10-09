(function(root){
'use strict';
function suggest(devices,options){
 options=options||{};
 var cams=devices.filter(function(d){return ['dome','bullet','turret','ptz','fisheye','thermal_bi'].includes(d.type);}),items=[];
 if(cams.length){
  items.push({key:'camera-box',ref:'GEN-CAIXA-CCTV',name:'Caixa de ligação para câmara',qty:cams.length,unit:'un.',reason:'Uma por câmara; confirmar necessidade, dimensões, ambiente e compatibilidade antes de encomendar.'});
  items.push({key:'network-termination',ref:'GEN-TERMINACAO-REDE',name:'Fichas de RJ45',qty:cams.length*2,unit:'un.',reason:'Duas fichas RJ45 por ligação direta; confirmar categoria, blindagem e compatibilidade com o cabo. Ajustar a quantidade se houver tomadas ou patch panel.'});
  var u=options.ups,models=[{ref:'UPS600VA-6',va:600,w:360,rack:false},{ref:'UPS1000VA-ON-2-RACK',va:1000,w:900,rack:true},{ref:'UPS1500VA-ON-2-RACK',va:1500,w:1350,rack:true},{ref:'UPS2000VA-ON-2-RACK',va:2000,w:1800,rack:true}];
  var selected=u&&Number(u.watts)>0&&Number(u.va)>0?models.find(function(m){return m.w>=u.watts&&m.va>=u.va;}):null;
  var upsReason=u?'Carga '+Math.ceil(u.load)+' W; mínimo com reserva '+Math.ceil(u.watts)+' W / '+Math.ceil(u.va)+' VA. Autonomia pretendida '+u.minutes+' min: confirmar na curva do fabricante.':'Dimensionar a potência AC e a autonomia na engenharia do sistema antes de selecionar o modelo.';
  if(selected)upsReason+=' '+(selected.rack?'Online, onda sinusoidal pura; kit de montagem em rack vendido à parte.':'Line-interactive, onda sinusoidal simulada; confirmar compatibilidade das fontes.');
  if(u&&!selected)upsReason+=' Sem modelo adequado entre as referências verificadas; dimensionar outra UPS ou dividir por armário.';
  items.push({key:'system-ups',ref:selected?selected.ref:'GEN-UPS-CCTV',name:selected?'UPS '+selected.va+' VA / '+selected.w+' W':'UPS para o sistema CCTV',qty:1,unit:'un.',reason:upsReason,sourceUrl:selected?'https://www.visiotechsecurity.com/pt/produtos/'+(selected.rack?'acessorios-5/upss-429/':'')+selected.ref.toLowerCase()+'-detail':''});
  var units=Math.max(9,Math.ceil(Number(options.rackUnits)||9)),rack=units<=9?'RACK-9UN-6D':units<=12?'RACK-12UN':null;
  items.push({key:'system-rack',ref:rack||'GEN-RACK-CCTV',name:rack?'Armário rack 19” · '+(units<=9?'9U':'12U')+' · profundidade 600 mm':'Armário rack 19” a dimensionar',qty:1,unit:'un.',reason:'Estimativa de espaço: '+units+'U incluindo reserva. Confirmar unidades reais, profundidade útil, peso, ventilação, bandejas e fixação à parede. A UPS de rack tem 430 mm de profundidade; prever espaço para conectores. Rede distribuída: rever um armário e uma UPS por local.',sourceUrl:rack?'https://www.visiotechsecurity.com/pt/produtos/acessorios-5/racks-441/'+rack.toLowerCase()+'-detail':''});
  if(selected&&selected.rack)items.push({key:'ups-rack-kit',ref:'UPS-RACK-KIT',name:'Kit de montagem da UPS em rack',qty:1,unit:'conj.',reason:'Vendido à parte; confirmar compatibilidade com a UPS escolhida e apoio mecânico no armário.',sourceUrl:'https://www.visiotechsecurity.com/pt/produtos/acessorios-5/upss-429/ups-rack-kit-detail'});
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
 hit={ref:item.ref,name:item.name,qty:item.qty,unit:item.unit,suggestionKey:item.key,autoQuantity:true,note:item.reason,sourceUrl:item.sourceUrl||''};extras.push(hit);return hit;
}
function sync(extras,items){
 extras.forEach(function(r){if(r.suggestionKey&&r.autoQuantity){var item=items.find(function(i){return i.key===r.suggestionKey;});r.qty=item?item.qty:0;if(item&&r.suggestionKey==='network-termination'&&r.name==='Terminação de rede'){r.name=item.name;r.note=item.reason;}}});
}
var m={suggest:suggest,accept:accept,sync:sync};root.SIGSAccessoryModel=m;if(typeof module!=='undefined'&&module.exports)module.exports=m;
})(typeof window!=='undefined'?window:globalThis);
