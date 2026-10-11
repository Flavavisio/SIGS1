/* Ajax EN54 catalogue enhancement, keeping existing project IDs intact. */
(function(root){'use strict';
if(!Array.isArray(root.FIRE_LIB))return;
const source='https://support.ajax.systems/en/en54-line/';
const manuals={
 f01:'en54-fire-hub-jeweller',f02:'en54-fire-rex-jeweller',
 f03:'en54-internal-battery-24h',f04:'en54-internal-battery-72h',
 f05:'en54-fireprotect-smoke-jeweller',f06:'en54-fireprotect-heat-jeweller',
 f07:'en54-fireprotect-heat-smoke-jeweller',
 f08:'en54-fireprotect-smoke-sounder-jeweller',f09:'en54-fireprotect-heat-sounder-jeweller',
 f10:'en54-fireprotect-heat-smoke-sounder-jeweller',
 f11:'en54-manualcallpoint-jeweller',
 f12:'en54-fireprotect-sounder-jeweller',f13:'en54-fireprotect-sounder-vad-jeweller',
 f14:'en54-fireprotect-vad-jeweller',
 f15:'en54-i-o-module-2x2-jeweller',
 f16:'glandbox'
};
for(const d of root.FIRE_LIB){
 d.brand='ajax';d.family='en54';d.technology='Jeweller';d.imageSource='Imagem configurada no catálogo SIGS (disponibilidade por verificar)';
 d.sourceURL=source+manuals[d.id]+'/';
 d.certificationNote='Linha Ajax EN54. Validar certificados, requisitos legais e dimensionamento do projeto.';
 d.colorVariants='Consultar referência/cor na ficha oficial';
}
const existing=new Set(root.FIRE_LIB.map(d=>d.id));
const more=[
 {id:'f15',cat:'modulo',name:'EN54 I/O Module (2X2) Jeweller',model:'EN54 I/O Module (2X2) Jeweller',type:'fire_module',icon:'🔌',desc:'Módulo de entradas e saídas para integração de equipamentos de incêndio.',sourceURL:'https://support.ajax.systems/en/en54-line/'},
 {id:'f16',cat:'acessorio',name:'GlandBox',model:'GlandBox',type:'fire_accessory',icon:'🧩',desc:'Acessório de passagem e organização de cabos para a central Ajax EN54.',sourceURL:'https://support.ajax.systems/en/en54-line/'}
];
more.forEach(d=>{if(existing.has(d.id))return;root.FIRE_LIB.push({...d,brand:'ajax',family:'en54',technology:'Jeweller',fov:0,range:0,color:'#ef4444',certificationNote:'Validar compatibilidade e referência exata no fabricante.'});});

// Only explicitly verified commercial variants should appear in the colour filter.
// EN54 colour/SKU availability is not established for this catalogue, so never invent black versions.
root.FIRE_LIB.forEach(function(d){
 if(manuals[d.id])d.sourceURL=source+manuals[d.id]+'/';
 const officialNames={
  f11:'EN54 ManualCallPoint Jeweller',
  f12:'EN54 FireProtect (Sounder) Jeweller',
  f13:'EN54 FireProtect (Sounder/VAD) Jeweller',
  f14:'EN54 FireProtect (VAD) Jeweller'
 };
 if(officialNames[d.id])d.name=officialNames[d.id];
 if(d.id==='f15')d.desc='Módulo Ajax EN54 Jeweller com 2 entradas e 2 saídas para integração de equipamentos com fios.';
 d.variantColor=d.variantColor||'confirmar';
 d.photoStatus=d.imgUrl?'URL do catálogo SIGS, ainda sem verificação de carregamento':'Fotografia em falta';
 d.requiresFireHub=d.id!=='f01'&&d.id!=='f03'&&d.id!=='f04'&&d.id!=='f16';
 d.compatibilityStatus='verify';
 d.compatibilityNote=d.requiresFireHub
  ?'Confirmar compatibilidade com EN54 Fire Hub Jeweller e versão OS Malevich no verificador oficial Ajax.'
  :'Confirmar montagem, referência exata e requisitos do projeto na documentação Ajax.';
 if(d.id==='f03'||d.id==='f04')d.compatibilityNote='Bateria para EN54 Fire Hub ou EN54 Fire ReX; confirmar autonomia exigida e configuração.';
 if(d.id==='f16')d.compatibilityNote='Acessório de cablagem; confirmar aplicação na central EN54.';
 if(d.id==='f15')d.compatibilityNote='Módulo de 2 entradas/2 saídas; confirmar equipamentos associados e compatibilidade com a CIE.';
 if(d.type==='fire'&&d.range>0)d.coverageNote='Raio de cobertura ilustrativo; dimensionar segundo EN54, regras aplicáveis e características do local.';
});
root.FIRE_TYPES=[...new Set([...root.FIRE_TYPES,'fire_module','fire_accessory'])];
root.SIGSAjaxFireCatalog={source,count:root.FIRE_LIB.length};
})(window);
