(function(){
'use strict';
const model=SIGSRecommendationModel,originalPoE=window.calcPoE,originalSystem=window.buildSystemTab;
const types=['dome','bullet','turret','ptz','fisheye','thermal_bi'];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function cameras(){saveCurrentFloor();return FLOORS.flatMap(f=>f.placed||[]).filter(p=>types.includes(gD(p.libId)?.type));}
function disks(){return window.SIGS_HDD_DB?.length?SIGS_HDD_DB:(typeof HDD_SIZES!=='undefined'?HDD_SIZES:[]).map(tb=>({name:'Disco '+tb+' TB — confirmar modelo',reference:sigsHddCatalogRef(tb),capacityTB:tb,generic:true}));}
function input(cams){const c=window.SIGS_COMMERCIAL||{},poe=originalPoE(cams);let gb=0,bw=0,mp=0;cams.forEach(p=>{const d=gD(p.libId)||{},res=p.mp||d.mp||4;gb+=calcStorage(res,p.codec||'ultra265b',p.days||30).gb;bw+=cameraNetworkMbps(p);mp=Math.max(mp,res);});return {cameras:cams.map(p=>gD(p.libId)||{}),count:cams.length,storageGB:gb,bandwidth:bw,maxMP:mp,preferred:c.recommendationBrand||'auto',selectedNvr:c.recommendationNvr,selectedSwitch:c.recommendationSwitch,nvrs:NVR_DB,switches:POE_SWITCH_DB,hdds:disks(),requiredPorts:poe.requiredPorts,requiredWatts:poe.totalWithMargin,requiredUplink:poe.uplink.design,maxPortW:poe.maxSingle};}
window.sigsSystemRecommendation=function(overrides){return model.design(Object.assign(input(cameras()),overrides||{}));};
window.suggestNVR=function(count,mp,bw){const r=sigsSystemRecommendation({count,maxMP:mp,bandwidth:bw});return r.nvr?[r.nvr,...r.nvrs.filter(d=>d!==r.nvr)]:r.nvrs;};
window.calcPoE=function(cams){const base=originalPoE(cams),design=model.design(input(cams));base.suggested=(design.switch?[design.switch,...design.switches.filter(d=>d!==design.switch)]:design.switches).slice(0,3);return base;};
function panel(){
 const host=document.getElementById('cctv-system-content');if(!host)return;
 let el=document.getElementById('v24-system');if(MOD!=='cctv'){if(el)el.remove();return;}
 if(!el){el=document.createElement('section');el.id='v24-system';el.className='v24-system';host.insertBefore(el,host.firstChild);}
 const c=window.SIGS_COMMERCIAL||{},cams=cameras(),r=sigsSystemRecommendation(),brands=[...new Set([...r.profile.brands,...NVR_DB.map(model.brand)].filter(Boolean))].sort();
 const archived=window.SIGS_V6?.currentStatus==='ARCHIVED';
 const select=(id,title,items,value)=>'<label>'+title+'<select id="'+id+'" '+(archived?'disabled':'')+'>'+items.map(([v,t])=>'<option value="'+esc(v)+'" '+(v===value?'selected':'')+'>'+esc(t)+'</option>').join('')+'</select></label>';
 el.innerHTML='<h3>Sistema sugerido</h3><p>'+esc(r.profile.brands.map(b=>b+' · '+r.profile.counts[b]).join(' / ')||'Coloca câmaras para obter recomendações.')+'</p>'+select('v24-brand','Marca preferida',[['auto','Automática — marca das câmaras'],...brands.map(b=>[b,b])],c.recommendationBrand||'auto')+(cams.length?select('v24-nvr','Gravador',[['','Recomendação automática'],...r.nvrs.map(d=>[d.reference||d.name,model.brand(d)+' · '+d.name])],c.recommendationNvr||'')+select('v24-switch','Switch PoE',[['','Recomendação automática'],...r.switches.map(d=>[d.reference||d.name,model.brand(d)+' · '+d.name])],c.recommendationSwitch||'')+'<div class="v24-parts"><b>Gravador</b><span>'+esc(r.nvr?.name||'Por dimensionar')+'</span><b>Armazenamento</b><span>'+esc(r.disk?r.disk.qty+' × '+(r.disk.device.reference||r.disk.device.name)+' · '+r.disk.capacityTB+' TB / disco':'Por dimensionar')+'</span><b>Alimentação / rede</b><span>'+esc(r.switch?.name||'Por dimensionar')+'</span><b>Materiais</b><span>Cabos e acessórios acompanham o orçamento do projeto.</span></div><button class="btn ba bfw" id="v24-budget">Ver materiais e orçamento</button>':'')+r.warnings.map(w=>'<p class="v24-note">'+esc(w)+'</p>').join('')+'<small>Recomendação por marca e capacidade de projeto. Confirma funções, referências e compatibilidade nas fichas dos fabricantes.</small>';
 for(const [id,key] of [['v24-brand','recommendationBrand'],['v24-nvr','recommendationNvr'],['v24-switch','recommendationSwitch']]){const node=document.getElementById(id);if(node)node.onchange=()=>{if(window.SIGS_V6?.currentStatus==='ARCHIVED')return;c[key]=node.value;if(key==='recommendationBrand'){c.recommendationNvr='';c.recommendationSwitch='';}if(typeof sigsV6MarkDirty==='function')sigsV6MarkDirty();buildSystemTab();if(typeof _refreshBudgetTotals==='function')_refreshBudgetTotals();};}
 const b=document.getElementById('v24-budget');if(b)b.onclick=()=>openBOM();
}
window.buildSystemTab=function(){const result=originalSystem.apply(this,arguments);panel();return result;};
})();
