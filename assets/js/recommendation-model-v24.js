(function(root){
'use strict';
const n=v=>Number.isFinite(Number(v))?Math.max(0,Number(v)):0;
function brand(d){const raw=String(d?.brand||'').trim().toLowerCase();const aliases={hikvision:'Hikvision',hik:'Hikvision',uniview:'Uniview',unv:'Uniview',dahua:'Dahua',safire:'Safire',reyee:'Reyee'};if(aliases[raw])return aliases[raw];if(raw&&!['generic','generico','—','storage'].includes(raw))return raw[0].toUpperCase()+raw.slice(1);const ref=String(d?.model||d?.reference||d?.name||'').toUpperCase();if(/^DS-/.test(ref))return 'Hikvision';if(/^(?:UV-)?(?:NVR|IPC|NSW)/.test(ref))return 'Uniview';if(/^SF-/.test(ref))return 'Safire';return '';}
function profile(cameras,preferred){const counts={};let unknown=0;for(const d of cameras){const b=brand(d);if(b)counts[b]=(counts[b]||0)+1;else unknown++;}const brands=Object.keys(counts).sort((a,b)=>counts[b]-counts[a]||a.localeCompare(b));return {counts,brands,unknown,mixed:brands.length>1,preferred:preferred&&preferred!=='auto'?brand({brand:preferred}):(brands[0]||''),explicit:!!preferred&&preferred!=='auto'};}
function diskOptions(gb,recorder,hdds){if(!recorder||!n(recorder.hdd))return [];return hdds.filter(h=>n(h.capacityTB)>0&&(!n(recorder.maxDiskTB)||n(h.capacityTB)<=n(recorder.maxDiskTB))).map(h=>({device:h,qty:Math.max(1,Math.ceil(n(gb)/(n(h.capacityTB)*(1e12/Math.pow(1024,3))))),capacityTB:n(h.capacityTB)})).filter(h=>h.qty<=n(recorder.hdd)).sort((a,b)=>a.qty-b.qty||(a.qty*a.capacityTB-b.qty*b.capacityTB)||String(a.device.reference||a.device.name).localeCompare(String(b.device.reference||b.device.name)));}
function design(input){
 const mode=input.powerMode==='integrated'?'integrated':'external';
 const p=profile(input.cameras||[],input.preferred),warnings=[],count=n(input.count??input.cameras?.length),gb=n(input.storageGB);
 if(!count)return {profile:p,nvrs:[],switches:[],nvr:null,switch:null,disk:null,warnings};
 if(p.mixed)warnings.push('Projeto com várias marcas. Confirma ONVIF, eventos inteligentes, áudio e funções proprietárias entre câmaras e gravador.');
 if(p.unknown)warnings.push(p.unknown+' câmara(s) sem marca identificada. Confirma a marca antes de encomendar.');
 const capacity=(input.nvrs||[]).filter(d=>n(d.ch)>=count&&n(d.maxMP)>=n(input.maxMP)&&n(d.bw)>=n(input.bandwidth));
 let nvrs=capacity.filter(d=>diskOptions(gb,d,input.hdds||[]).length&&(!p.preferred||brand(d)===p.preferred)&&(mode!=='integrated'||(n(d.poePorts)>=count&&n(d.poeBudget)>=n(input.requiredWatts)&&n(d.poeMaxPortW)>=n(input.maxPortW))));
 nvrs.sort((a,b)=>(brand(a)===p.preferred?0:1)-(brand(b)===p.preferred?0:1)||n(a.ch)-n(b.ch)||n(a.bw)-n(b.bw)||String(a.name).localeCompare(String(b.name)));
 if(!nvrs.length)warnings.push('Sem solução dimensionada '+(p.preferred||'da marca escolhida')+(mode==='integrated'?' com PoE integrado':'')+' no catálogo. Revê canais, banda, discos'+(mode==='integrated'?', portas e potência PoE':'')+' ou escolhe outra configuração. Não foi recomendada outra marca automaticamente.');
 else if(p.preferred&&brand(nvrs[0])!==p.preferred)warnings.push('Sem solução dimensionada '+p.preferred+' no catálogo. A alternativa de outra marca precisa de confirmação de compatibilidade.');
 let recorder=nvrs.find(d=>(d.reference||d.name)===input.selectedNvr)||nvrs[0]||null;
 if(input.selectedNvr&&!nvrs.some(d=>(d.reference||d.name)===input.selectedNvr))warnings.push('O gravador escolhido deixou de cumprir o dimensionamento. Revê a seleção para a marca e configuração atuais.');
 if(recorder&&p.brands.some(b=>b!==brand(recorder))&&!p.mixed)warnings.push('A marca do gravador difere das câmaras. Confirma compatibilidade e funções antes da encomenda.');
 if(recorder&&!n(recorder.maxDiskTB))warnings.push('Confirma a capacidade máxima por disco e a lista de discos suportados pelo gravador.');
 const switches=(mode==='integrated'?[]:input.switches||[]).filter(d=>n(d.ports)>=n(input.requiredPorts)&&n(d.budget)>=n(input.requiredWatts)&&n(d.uplinkMbps)>=n(input.requiredUplink)&&(!n(d.maxPortW)||n(d.maxPortW)>=n(input.maxPortW))).sort((a,b)=>(brand(a)===p.preferred?0:1)-(brand(b)===p.preferred?0:1)||n(a.budget)-n(b.budget)||n(a.ports)-n(b.ports)||String(a.name).localeCompare(String(b.name)));
 const sw=switches.find(d=>(d.reference||d.name)===input.selectedSwitch)||switches[0]||null;
 if(mode==='integrated'){if(recorder?.poePortSource)warnings.push(recorder.poePortSource);if(recorder&&n(input.requiredPorts)>n(recorder.poePorts))warnings.push('O PoE do gravador cobre as câmaras atuais, mas não todas as portas de reserva pedidas.');}
 else if(!sw)warnings.push('Nenhum switch do catálogo satisfaz portas, potência com reserva e uplink. Dimensiona alimentação alternativa ou vários switches.');
 else {if(p.preferred&&brand(sw)!==p.preferred)warnings.push('Switch de outra marca: confirma normas PoE e potência por porta; a marca não substitui essa verificação.');if(!n(sw.maxPortW))warnings.push('Potência por porta não indicada no catálogo. Confirma PoE/PoE+/PoE++ para cada equipamento.');}
 if(mode==='external'&&input.selectedSwitch&&!switches.some(d=>(d.reference||d.name)===input.selectedSwitch))warnings.push('O switch escolhido deixou de cumprir o dimensionamento. Revê a seleção para a marca e configuração atuais.');
 return {powerMode:mode,profile:p,nvrs,switches,nvr:recorder,switch:sw,disk:diskOptions(gb,recorder,input.hdds||[])[0]||null,warnings};
}
root.SIGSRecommendationModel={brand,profile,diskOptions,design};if(typeof module!=='undefined'&&module.exports)module.exports=root.SIGSRecommendationModel;
})(typeof window!=='undefined'?window:globalThis);
