/* Ajax NVR catalogue — verified classic and Superior H2G models. */
(function(root){'use strict';
const source8='https://s3-eu-west-1.amazonaws.com/files.visiotech.es/files/pdf/AJ-NVR108-W_EN.pdf';
const source16='https://www.visiotechsecurity.com/en/products/ip-cctv-1/professional-nvrs-12/ajax-738/aj-nvr116-w-detail';
const series=[
 {channels:8,suffix:'108',sourceURL:source8},
 {channels:16,suffix:'116',sourceURL:source16}
];
const rows=[];
for(const s of series)for(const [code,color] of [['W','Branco'],['B','Preto']]){
 const reference='AJ-NVR'+s.suffix+'-'+code;
 rows.push({name:'Ajax NVR '+s.channels+' canais · '+color,reference,brand:'Ajax',ch:s.channels,
 maxMP:8,bw:100,hdd:1,maxDiskTB:16,poePorts:0,poeBudget:0,poeMaxPortW:0,
 hdmi:false,externalPoE:true,recording:'H.264 / H.265',colour:color,
 sourceURL:s.sourceURL,photoURL:null,
 note:'NVR Ajax clássico sem PoE integrado; requer switch PoE ou alimentação individual. Confirma ONVIF/RTSP e eventos de IA antes de encomendar.'});
}
// Preferred model requested for Ajax cameras. No integrated PoE: use an external switch.
for(const [code,color] of [['B','Preto'],['W','Branco']]){
 const reference='AJ-NVR208-HAC2G-AI-S-'+code;
 rows.push({name:reference,reference,description:'Ajax Superior NVR · 8 canais · '+color,brand:'Ajax',
  ch:8,maxMP:12,bw:384,hdd:2,maxDiskTB:24,poePorts:0,poeBudget:0,poeMaxPortW:0,
  hdmi:true,ai:true,lanPorts:2,lanMbps:1000,externalPoE:true,colour:color,recommendationPriority:10,
  recording:'H.264 / H.265',
  sourceURL:'https://www.visiotechsecurity.com/pt/produtos/intrus%C3%A3o-8/ajax-cctv-740/nvrs-739/'+reference.toLowerCase()+'-detail',
  note:'Superior com IA e HDMI, 2 × HDD até 24 TB por disco e 2 × RJ45 Gigabit. Requer switch PoE externo ou alimentação individual.'});
}
function merge(catalog){const byRef=new Map((catalog||[]).map(d=>[String(d.reference||d.name).toUpperCase(),d]));
 rows.forEach(d=>{const key=d.reference.toUpperCase();byRef.set(key,{...byRef.get(key),...d});});return [...byRef.values()];}
root.NVR_DB=merge(root.NVR_DB);
// NVR H family references (manufacturer documentation). These are shown in the
// catalogue but NOT eligible for automatic sizing until per-SKU bandwidth,
// resolution and, for Superior, PoE budget have been verified.
const nvrH=[];
for(const ch of [8,16])for(const power of ['HAC','HDC']){
 nvrH.push({name:'Ajax NVR '+power+' ('+ch+'-ch)',reference:'NVR '+power+' ('+ch+'-ch)',brand:'Ajax',family:'NVR H',
  ch,hdmi:true,hdd:1,maxDiskTB:16,poePorts:0,externalPoE:true,
  sourceURL:'https://support.ajax.systems/en/manuals/nvr-h/',
  verified:['HDMI','1 disco SATA até 16 TB','Canais '+ch],
  pending:['Banda de entrada','Resolução de gravação','Código comercial/cor'],
  status:'specs-pending'});
}
nvrH.push({name:'Superior NVR H2DAI16PAC (32-ch)',reference:'Superior NVR H2DAI16PAC (32-ch)',
 brand:'Ajax',family:'Superior NVR H',ch:32,hdmi:true,hdd:2,poePorts:16,
 ai:true,dualGigabit:false,ac:true,
 sourceURL:'https://support.ajax.systems/en/faqs/how-to-read-nvr-model-names/',
 verified:['HDMI','32 canais','2 discos','16 portas PoE','IA','Alimentação AC'],
 pending:['Capacidade máxima por disco','Banda de entrada','Resolução','Orçamento PoE','Código comercial/cor'],
 status:'specs-pending'});
root.SIGSAjaxNVR={rows,nvrH,merge,seriesGuide:'https://support.ajax.systems/en/video-surveillance/nvr-h/',classicGuide:'https://support.ajax.systems/en/manuals/nvr/'};
if(typeof module!=='undefined'&&module.exports)module.exports=root.SIGSAjaxNVR;
})(typeof window!=='undefined'?window:globalThis);
