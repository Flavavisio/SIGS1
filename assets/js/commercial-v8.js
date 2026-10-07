/* SIGS V8: one project-owned material and commercial source. */
(function(){
'use strict';
var M=SIGSCommercialModel,C=M.defaults(),legacy=true,shownSignature='';
window.SIGS_COMMERCIAL=C;
function el(id){return document.getElementById(id);}
function e(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function money(n){return Number(n).toLocaleString('pt-PT',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';}
function clone(x){return JSON.parse(JSON.stringify(x));}
function archived(){return window.SIGS_V6&&SIGS_V6.currentStatus==='ARCHIVED';}
function changed(){if(typeof sigsV6MarkDirty==='function')sigsV6MarkDirty();}
function price(ref,key){
 if(Object.prototype.hasOwnProperty.call(C.prices,ref))return;
 var old=legacy&&window.SIGS_PRICES&&SIGS_PRICES[ref];
 if(old!==undefined&&old!==false)C.prices[ref]={cost:M.num(old),sale:null};
 else if(legacy&&window.BUDGET){
  var sale=key==='hdd'?BUDGET.hddPrice:key==='cable'?BUDGET.cablePrice:BUDGET.prices[key];
  if(sale!==undefined)C.prices[ref]={cost:0,sale:M.num(sale)};
 }
}
function rows(){
 saveCurrentFloor();var grouped=new Map(),cams=[],warnings=[];
 function add(r,key){
  if(grouped.has(r.ref)){grouped.get(r.ref).qty+=r.qty;return;}
  grouped.set(r.ref,r);price(r.ref,key);
 }
 FLOORS.forEach(function(fl){(fl.placed||[]).forEach(function(p){
  var d=gD(p.libId);if(!d){warnings.push('Equipamento sem referência no catálogo: '+p.libId);return;}
  add({ref:d.model||d.name,name:d.name,type:d.type,qty:1,unit:'un.',system:false},p.libId);
  if(['dome','bullet','ptz','fisheye','turret','thermal_bi'].indexOf(d.type)>=0)cams.push({p:p,fl:fl});
 });});
 if(cams.length){
  var bw=0,mp=0,gb=0,cable=0,estimated=0;
  cams.forEach(function(x){var p=x.p,cod=p.codec||'ultra265b',res=p.mp||4;
   bw+=typeof cameraNetworkMbps==='function'?cameraNetworkMbps(p):((BITRATE_TABLE[cod]||BITRATE_TABLE.h265)[res]||4);mp=Math.max(mp,res);gb+=calcStorage(res,cod,p.days||30,p).gb;
   var len=null;
   if(window.SIGSSiteGeometry&&p.cableRoute&&p.cableRoute.length>=2){
    var route=SIGSSiteGeometry.cable(p,x.fl.scale,x.fl.cabling);if(route)len=route.total;
   }else if(x.fl===FLOORS[FLOOR_CUR]&&S.scale.ok&&NVR_POS){var cd=cableForCam(p);if(cd)len=cd.cable;}
   if(len===null){len=15;estimated++;}cable+=len;
  });
  var rec=typeof sigsSystemRecommendation==='function'?sigsSystemRecommendation():null;
  var nvr=rec?rec.nvr:suggestNVR(cams.length,mp,bw)[0],poe=calcPoE(cams.map(function(x){return x.p;})),sw=rec?rec.switch:poe.suggested[0];
  if(rec)warnings=warnings.concat(rec.warnings);
  var values=Array.from(grouped.values());
  if(nvr&&!values.some(function(r){return r.type==='nvr'||r.ref===nvr.name;}))add({ref:nvr.name,name:'NVR recomendado',type:'nvr',qty:1,unit:'un.',system:true},'__nvr__');
  if(sw&&!values.some(function(r){return r.type==='switch'||r.ref===sw.name;}))add({ref:sw.name,name:'Switch PoE recomendado',type:'switch',qty:1,unit:'un.',system:true},'__switch__');
  var tb=rec&&rec.disk?rec.disk.capacityTB:nearestHDD(gb),qty=rec&&rec.disk?rec.disk.qty:Math.max(1,Math.ceil(gb/(tb*1024)));
  if(!rec||rec.disk)add({ref:rec&&rec.disk?(rec.disk.device.reference||rec.disk.device.name):sigsHddCatalogRef(tb),name:'Disco '+tb+' TB (capacidade técnica)',type:'hdd',qty:qty,unit:'un.',system:true},'hdd');
  if(nvr&&qty>nvr.hdd)warnings.push('A quantidade de discos calculada excede as baias do NVR recomendado. Reveja o dimensionamento.');
  add({ref:'Cabo UTP Cat6',name:'Cabo de rede Cat6',type:'cabo',qty:Math.ceil(cable),unit:'m',system:true},'cable');
  if(estimated)warnings.push('Cabo estimado a 15 m para '+estimated+' câmara(s). Defina escala e traçado para confirmar.');
 }
 FLOORS.forEach(function(fl){(fl.placed||[]).filter(function(p){return p.cableRoute&&p.cableRoute.length>1&&!cams.some(function(x){return x.p===p;});}).forEach(function(p){if(!window.SIGSSiteGeometry)return;var measured=SIGSSiteGeometry.cable(p,fl.scale,fl.cabling);if(!measured){warnings.push('Percurso sem escala: '+(p.label||p.id)+' · '+fl.name);return;}var ref=p.cableRef||'Cabo de instalação (a confirmar)';add({ref:ref,name:ref,type:'cabo',qty:Math.ceil(measured.total),unit:'m',system:true},ref==='Cabo UTP Cat6'?'cable':ref);});});
 if(typeof sigsV10SyncAccessories==='function')sigsV10SyncAccessories();
 C.extras.filter(function(r){return M.num(r.qty)>0;}).forEach(function(r){add({ref:r.ref,name:r.name,type:'adicional',qty:M.num(r.qty),unit:r.unit||'un.',system:false});});
 var result=Array.from(grouped.values());window._bomRows=result;return {rows:result,warnings:warnings};
}
function quote(){var r=rows(),t=M.calculate(r.rows,C);t.warnings=r.warnings;return t;}
window.sigsV8Quote=quote;
function input(field,value,label,extra){return '<label>'+label+'<input data-setting="'+field+'" value="'+e(value)+'" '+(extra||'type="number" min="0" step="0.01"')+'></label>';}
function footer(t){return '<div class="v8-summary"><span>Custo interno <b>'+money(t.cost)+'</b></span><span>Resultado <b>'+money(t.profit)+' · '+t.margin+'%</b></span><span>Desconto <b>'+money(t.discount)+'</b></span><span>Subtotal <b>'+money(t.sub)+'</b></span><span>IVA '+e(C.iva)+'% <b>'+money(t.iva)+'</b></span><span class="v8-grand">Total <b>'+money(t.total)+'</b></span></div>'+(t.missing?'<p class="v8-warning">'+t.missing+' linha(s) sem preço de venda. Complete os preços antes de enviar.</p>':'')+t.warnings.map(function(w){return '<p class="v8-warning">'+e(w)+'</p>';}).join('');}
function draw(){
 var host=el('m-bom');if(!host)return;var t=quote();
 shownSignature=JSON.stringify(t.lines.map(function(r){return [r.ref,r.qty];}));
 host.innerHTML='<div class="modal v8-modal"><div class="mh">Materiais e orçamento</div><p>As quantidades acompanham os equipamentos de todos os pisos. Custos e condições ficam guardados com o projeto.</p>'+
 '<div class="v8-settings">'+input('company',C.company,'Empresa','type="text"')+input('client',C.client,'Cliente','type="text"')+input('reference',C.reference,'Referência da proposta','type="text"')+input('validity',C.validity,'Validade (dias)')+'</div>'+
 '<div class="v8-settings">'+input('margin',C.margin,'Percentagem padrão')+'<label>Cálculo<select data-setting="marginMode"><option value="markup"'+(C.marginMode==='markup'?' selected':'')+'>Acréscimo sobre custo</option><option value="margin"'+(C.marginMode==='margin'?' selected':'')+'>Margem sobre venda</option></select></label>'+input('discount',C.discount,'Desconto (%)')+input('iva',C.iva,'IVA (%)')+'</div>'+
 '<p>O preço de venda vazio é calculado a partir do custo. Um preço de venda preenchido substitui esse cálculo.</p><div class="v8-table"><table><thead><tr><th>Referência / descrição</th><th>Quantidade</th><th>Custo un.</th><th>Venda un.</th><th>Total s/ IVA</th></tr></thead><tbody>'+t.lines.filter(function(r){return r.ref!=='MAO-DE-OBRA';}).map(function(r){var p=C.prices[r.ref]||{};return '<tr><td><b>'+e(r.ref)+'</b><small>'+e(r.name)+'</small></td><td>'+r.qty+' '+e(r.unit)+'</td><td><input data-ref="'+e(r.ref)+'" data-price="cost" type="number" min="0" step="0.01" value="'+M.num(p.cost)+'"></td><td><input data-ref="'+e(r.ref)+'" data-price="sale" type="number" min="0" step="0.01" placeholder="'+r.sale.toFixed(2)+'" value="'+e(p.sale==null?'':p.sale)+'"></td><td data-total-ref="'+e(r.ref)+'">'+money(r.net)+'</td></tr>';}).join('')+'</tbody></table></div>'+
 '<div class="v8-settings">'+input('laborHours',C.laborHours,'Mão de obra (horas)')+input('laborCost',C.laborCost,'Custo interno / hora')+input('laborSale',C.laborSale,'Venda / hora')+'</div>'+
 '<details><summary>Materiais adicionais e acessórios</summary><div id="v8-extras">'+C.extras.map(function(r,i){return '<div class="v8-extra"><input data-extra="'+i+'" data-field="ref" aria-label="Referência" value="'+e(r.ref)+'"><input data-extra="'+i+'" data-field="name" aria-label="Descrição" value="'+e(r.name)+'"><input data-extra="'+i+'" data-field="qty" aria-label="Quantidade" type="number" min="0" step="0.01" value="'+r.qty+'"><button data-remove="'+i+'">Remover</button></div>';}).join('')+'</div><button id="v8-add">Adicionar material</button></details>'+
 '<label class="v8-terms">Condições comerciais<textarea data-setting="terms" rows="3">'+e(C.terms)+'</textarea></label><div id="v8-totals">'+footer(t)+'</div><div class="ma"><button class="btn ba bsm" id="v8-print">Proposta / PDF</button><button class="btn ba bsm" id="v8-csv">CSV para cliente</button><button class="btn bsm" onclick="closeM(\'m-bom\')">Fechar</button></div></div>';
 host.querySelectorAll('[data-setting],[data-price],[data-extra]').forEach(function(node){node.disabled=archived();node.addEventListener('input',function(){
  if(archived())return;
  if(node.dataset.setting){var k=node.dataset.setting;C[k]=['company','client','reference','terms','marginMode'].indexOf(k)>=0?node.value:M.num(node.value);if(k==='discount'||k==='iva')C[k]=Math.min(100,C[k]);if(k==='marginMode')C.margin=Math.min(C.marginMode==='margin'?99:500,C.margin);if(k==='margin')C[k]=Math.min(C.marginMode==='margin'?99:500,C[k]);}
  if(node.dataset.price){var ref=node.dataset.ref;C.prices[ref]=C.prices[ref]||{cost:0,sale:null};C.prices[ref][node.dataset.price]=node.dataset.price==='sale'&&node.value===''?null:M.num(node.value);}
  if(node.dataset.extra){var r=C.extras[Number(node.dataset.extra)];r[node.dataset.field]=node.dataset.field==='qty'?M.num(node.value):node.value;if(node.dataset.field==='qty'&&r.suggestionKey)r.autoQuantity=false;}
  changed();refresh();
 });});
 host.querySelectorAll('[data-remove]').forEach(function(b){b.disabled=archived();b.onclick=function(){C.extras.splice(Number(b.dataset.remove),1);changed();draw();};});
 el('v8-add').disabled=archived();el('v8-add').onclick=function(){C.extras.push({ref:'EXTRA-'+Date.now(),name:'Material adicional',qty:1,unit:'un.'});changed();draw();};
 el('v8-print').onclick=function(){window.sigsV8PrintQuote();};el('v8-csv').onclick=function(){exportBOM('csv');};if(typeof sigsV10EnhanceBudget==='function')sigsV10EnhanceBudget();
}
function refresh(){var t=quote(),host=el('m-bom');if(host&&!host.classList.contains('hide')&&!host.contains(document.activeElement)&&shownSignature!==JSON.stringify(t.lines.map(function(r){return [r.ref,r.qty];}))){draw();return;}if(el('v8-totals'))el('v8-totals').innerHTML=footer(t);if(host)host.querySelectorAll('[data-total-ref]').forEach(function(n){var r=t.lines.find(function(x){return x.ref===n.dataset.totalRef;});n.textContent=r?money(r.net):'—';});panel(t);}
function panel(t){var n=el('tc-budget');if(n)n.innerHTML='<div style="padding:12px;overflow:auto"><div class="stl">Orçamento do projeto</div><p>'+t.lines.length+' referências · todos os pisos</p>'+footer(t)+'<button class="btn ba bfw" onclick="openBOM()">Editar materiais e orçamento</button><button class="btn ba bfw" style="margin-top:8px" onclick="sigsV8PrintQuote()">Proposta / PDF</button></div>';}
function download(txt,name,type){var url=URL.createObjectURL(new Blob([txt],{type:type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(function(){URL.revokeObjectURL(url);},1000);}
function csv(v){v=String(v);if(/^[=+@\-\t\r]/.test(v))v="'"+v;return '"'+v.replace(/"/g,'""')+'"';}
window.exportBOM=function(fmt){var t=quote();if(!t.lines.length){notify('Adicione equipamentos ou materiais primeiro.');return;}var lines=[['Referência','Descrição','Quantidade','Unidade','Venda unitária EUR','Desconto %','Total sem IVA EUR']];t.lines.forEach(function(r){lines.push([r.ref,r.name,r.qty,r.unit,r.sale.toFixed(2),Math.min(100,C.discount),r.net.toFixed(2)]);});lines.push(['Subtotal','','','','','',t.sub.toFixed(2)],['IVA '+C.iva+'%','','','','','',t.iva.toFixed(2)],['TOTAL','','','','','',t.total.toFixed(2)]);download('\ufeff'+lines.map(function(r){return r.map(csv).join(';');}).join('\r\n'),'SIGS_Proposta.'+(fmt==='txt'?'txt':'csv'),'text/csv;charset=utf-8');};
function printQuote(){
 var t=quote();if(!t.lines.length){notify('Adicione equipamentos ou materiais primeiro.');return;}
 var w=window.open('','_blank');if(!w){notify('Permita a abertura da proposta neste navegador.');return;}
 w.document.write('<!doctype html><html lang="pt"><meta charset="utf-8"><title>Proposta '+e(C.reference)+'</title><style>body{font:14px Arial;color:#172c44;margin:40px}h1{color:#2563eb}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{padding:10px;text-align:left;border-bottom:1px solid #ddd}th{background:#eef4ff}td:last-child{text-align:right}small{display:block;color:#667}.totals{text-align:right;line-height:1.8}.terms{white-space:pre-wrap}tr{break-inside:avoid}@media print{button{display:none}body{margin:10mm}@page{size:A4;margin:12mm}}</style><button onclick="window.print()">Imprimir / Guardar PDF</button><h1>'+e(C.company||'Proposta comercial')+'</h1><h2>Orçamento '+e(C.reference)+'</h2><p>Cliente: '+e(C.client||'Por preencher')+'<br>Projeto: '+e(window.CLOUD&&CLOUD.projectName||'SIGS')+'<br>Data: '+new Date().toLocaleDateString('pt-PT')+' · Validade: '+e(C.validity)+' dias</p>'+(t.missing?'<p>RASCUNHO — existem linhas sem preço de venda.</p>':'')+'<table><thead><tr><th>Equipamento / serviço</th><th>Qtd.</th><th>Preço unit.</th><th>Total s/ IVA</th></tr></thead><tbody>'+t.lines.map(function(r){return '<tr><td>'+e(r.name)+'<small>'+e(r.ref)+'</small></td><td>'+r.qty+' '+e(r.unit)+'</td><td>'+money(r.sale)+'</td><td>'+money(r.net)+'</td></tr>';}).join('')+'</tbody></table><div class="totals">Valor antes de desconto: '+money(t.gross)+'<br>Desconto ('+e(Math.min(100,C.discount))+'%): '+money(t.discount)+'<br>Subtotal: '+money(t.sub)+'<br>IVA ('+e(C.iva)+'%): '+money(t.iva)+'<br><strong>Total: '+money(t.total)+'</strong></div><h3>Condições comerciais</h3><p class="terms">'+e(C.terms||'A definir com o cliente.')+'</p>'+t.warnings.map(function(v){return '<p>'+e(v)+'</p>';}).join('')+'</html>');w.document.close();
}
window.sigsV8PrintQuote=printQuote;
window.openBOM=function(){draw();openM('m-bom');};
window.buildBudget=function(){panel(quote());};window._refreshBudgetTotals=refresh;
window.bomGetPrice=function(ref){var r=quote().lines.find(function(x){return x.ref===ref;});return r?r.sale:0;};
window.bomTotals=function(){var t=quote();return {sub:t.sub,grand:t.total,ivaVal:t.iva,margin:0,marginVal:0,ivaOn:C.iva>0};};
window.bomRecalc=refresh;
function install(){
 var build=window._buildProjectData,restore=window._restoreProjectData,start=window.startModule;
 window._buildProjectData=function(){var d=build.apply(this,arguments);rows();d.commercial=clone(C);d.v=11;return d;};
 window._restoreProjectData=function(d){var result=restore.apply(this,arguments);C=Object.assign(M.defaults(),clone(d.commercial||{}));C.prices=C.prices||{};C.extras=C.extras||[];legacy=false;window.SIGS_COMMERCIAL=C;refresh();return result;};
 window.startModule=function(){C=M.defaults();legacy=false;window.SIGS_COMMERCIAL=C;return start.apply(this,arguments);};
 window.saveProj=function(){download(JSON.stringify(_buildProjectData(),null,2),'projeto_'+MOD+'.vdp','application/json');notify('Projeto e orçamento guardados.');};
 window.doLoadProj=function(ev){var f=ev.target.files&&ev.target.files[0];if(!f)return;var r=new FileReader();r.onload=function(){try{var d=JSON.parse(r.result);if(!d||!Array.isArray(d.placed)||!Array.isArray(d.lib))throw new Error('Ficheiro de projeto inválido');_restoreProjectData(d);notify('Projeto e orçamento carregados.');}catch(err){notify('Erro ao carregar: '+err.message);}};r.readAsText(f);ev.target.value='';};
 setInterval(function(){var modal=el('m-bom'),budget=el('tc-budget');if((modal&&!modal.classList.contains('hide'))||(budget&&budget.classList.contains('on')))refresh();},1500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(install,350);});else setTimeout(install,350);
})();
