/* SIGS CCTV planning assistant v98 — illustrative analysis, never certification. */
(function(root){'use strict';
const $=id=>document.getElementById(id);
let mode='coverage', overlay=false, placement=false, suggested=null, mapCache=null, compareIds=[];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const floor=()=>root.FLOORS?.[root.FLOOR_CUR];
const cameras=()=>root.S?.placed?.filter(p=>{const d=root.gD(p.libId);return d&&['bullet','dome','turret','ptz','fisheye','thermal_bi','cube','doorbell'].includes(d.type)&&p.visible!==false})||[];
function fov(p,d){return root.SIGSLensModel?.fov(p,d)||d.fov||90;}
function range(p,d){const L=root.SIGSAnalyticsRange;return L?.outerRange(p,d,Number(d.range)||50)||Number(d.range)||50;}
function hitWall(p,x,y){const geo=root.SIGSSiteGeometry,ob=floor()?.obstacles||[],length=Math.hypot(x-p.x,y-p.y);if(!length||!geo?.intersection||!geo?.segments)return false;
 return geo.segments(ob).some(([a,b])=>{const t=geo.intersection({x:p.x,y:p.y},{x:(x-p.x)/length,y:(y-p.y)/length},a,b);return t!==null&&t>0&&t<length-1e-5;});}
function at(p,x,y,analytic=false){
 const d=root.gD(p.libId),scale=root.S.scale;if(!d||!scale?.ok||!scale.ppm)return {visible:false,reason:'Sem escala'};
 const dx=x-p.x,dy=y-p.y,meters=Math.hypot(dx,dy)/scale.ppm,rotation=(Number(p.rotation)||0)*Math.PI/180;
 const angle=Math.atan2(dx,-dy),relative=Math.atan2(Math.sin(angle-rotation),Math.cos(angle-rotation));
 if(Math.abs(relative)>fov(p,d)*Math.PI/360)return {visible:false,meters,reason:'Fora do FOV'};
 if(hitWall(p,x,y))return {visible:false,meters,reason:'Obstáculo'};
 if(analytic){const key=root.SIGSAnalytics?.active(p,d),api=root.SIGSAnalyticsRange;
  if(!key?.people||!api)return {visible:false,meters,reason:'Sem analítica de pessoas'};
  const r=api.calculate(p,d,'people',{angle:relative,fov:fov(p,d)});
  return {visible:!!r.available&&meters>=r.min&&meters<=r.max,meters,reason:r.available?'Limite analítico':'Por confirmar',limit:r.max,method:r.method};
 }
 return {visible:meters<=range(p,d),meters,reason:'Fora do alcance'};
}
function coverage(){
 const fp=root.S.fp,s=root.S.scale;
 if(!fp||!s?.ok||!s.ppm)return null;
 const step=Math.max(7,Math.ceil(Math.max(fp.w,fp.h)/90)),cells=[],cams=cameras();
 for(let y=fp.y+step/2;y<fp.y+fp.h;y+=step)for(let x=fp.x+step/2;x<fp.x+fp.w;x+=step){
  let n=0,a=0;
  for(const p of cams){if(at(p,x,y).visible)n++;if(at(p,x,y,true).visible)a++;}
  cells.push({x,y,n,a});
 }
 return {step,cells,uncovered:cells.filter(c=>!c.n).length,overlap:cells.filter(c=>c.n>1).length,analytic:cells.filter(c=>c.a>0).length,total:cells.length};
}
function drawOverlay(){
 if(!overlay||root.MOD!=='cctv'||!root.S?.scale?.ok)return;
 const data=coverage();if(!data)return;mapCache=data;
 const ctx=root.ctx;if(!ctx)return;
 ctx.save();
 data.cells.forEach(c=>{const s=root.w2s(c.x-data.step/2,c.y-data.step/2),w=data.step*root.S.zoom;
 ctx.fillStyle=c.n===0?'rgba(239,68,68,.25)':c.n>1?'rgba(59,130,246,.23)':c.a?'rgba(34,197,94,.22)':'rgba(245,158,11,.16)';
 ctx.fillRect(s.x,s.y,w+1,w+1);});ctx.restore();
}
function selected(){const p=root.fP(root.S.selId);return p&&cameras().find(c=>c.id===p.id)?p:cameras()[0];}
function compare(){
 const ids=compareIds.length?compareIds:[...document.querySelectorAll('#sigs-intel [data-cmp]')].map(x=>x.value),rows=ids.map(id=>cameras().find(p=>String(p.id)===id)).filter(Boolean);
 if(rows.length!==2)return 'Seleciona duas câmaras.';
 const fmt=p=>{const d=root.gD(p.libId),L=root.SIGSAnalyticsRange;
 const person=L?.calculate(p,d,'people'),car=L?.calculate(p,d,'vehicles');
 return [d.model||d.name||p.label||'Câmara',fov(p,d).toFixed(1)+'°',range(p,d).toFixed(1)+' m',person?.available?person.max.toFixed(1)+' m ('+person.method+')':'Por confirmar',car?.available?car.max.toFixed(1)+' m ('+car.method+')':'Por confirmar',root.SIGSLensModel?.effective(p,d)||p.lens||'—'];};
 const a=fmt(rows[0]),b=fmt(rows[1]);
 return '<table class="sigs-i-table"><thead><tr><th>Critério</th><th>Câmara A</th><th>Câmara B</th></tr></thead><tbody>'+['Modelo','FOV horizontal','Alcance ótico','Analítica pessoa','Analítica carro','Focal'].map((name,i)=>'<tr><th>'+name+'</th><td>'+esc(a[i])+'</td><td>'+esc(b[i])+'</td></tr>').join('')+'</tbody></table><small>Alcances estimados ou documentados conforme o modelo; a analítica não equivale a DORI.</small>';
}
function preview(){
 const p=selected(),d=p&&root.gD(p.libId);if(!d)return '<p>Seleciona uma câmara CCTV.</p>';
 const H=fov(p,d),V=root.SIGSLensModel?.verticalFov(p,d)||H*9/16,h=Number(p.instHeight)||3,tilt=Number(p.instTilt??30);
 return '<div class="sigs-preview"><div class="sigs-preview-sky"></div><div class="sigs-preview-ground"></div><div class="sigs-preview-target">♟</div><div class="sigs-preview-cross">+</div></div><p><b>'+esc(d.model||d.name||'Câmara')+'</b></p><small>FOV H '+H.toFixed(1)+'° · V '+Number(V).toFixed(1)+'° · altura '+h.toFixed(1)+' m · inclinação '+tilt.toFixed(1)+'°</small><p><small>Pré-visualização esquemática: não reproduz imagem, IR, IA ou qualidade real do sensor. Para projeção 3D utiliza também «Pessoa, carro e vista 3D».</small></p>';
}
function placeSuggestion(x,y){
 const options=cameras().map(p=>{const d=root.gD(p.libId),a=at(p,x,y,true),v=at(p,x,y);return {p,d,a,v};}).sort((a,b)=>(Number(b.a.visible)-Number(a.a.visible))||(Number(b.v.visible)-Number(a.v.visible))||(a.v.meters-b.v.meters));
 const best=options[0];return best?{x,y,best,covered:options.filter(v=>v.v.visible).length,analytic:options.filter(v=>v.a.visible).length}:null;
}
function update(){
 const panel=$('sigs-intel');if(!panel||!panel.open)return;
 const body=$('sigs-intel-body');if(!body)return;
 let html='<div class="sigs-i-actions">'+[['coverage','Mapa inteligente'],['preview','Imagem estimada'],['suggest','Posicionamento'],['compare','Comparar câmaras']].map(([id,label])=>'<button type="button" data-tab="'+id+'" class="'+(mode===id?'chosen':'')+'">'+label+'</button>').join('')+'</div>';
 if(mode==='coverage'){const data=coverage();html+='<p><label><input type="checkbox" id="sigs-i-overlay" '+(overlay?'checked':'')+'> Ver mapa de cobertura na planta</label></p>';
  html+=data?'<p><b>Área analisada:</b> '+data.total+' células · <b>Sem cobertura:</b> '+(100*data.uncovered/data.total).toFixed(0)+'% · <b>Sobreposição:</b> '+(100*data.overlap/data.total).toFixed(0)+'% · <b>Analítica de pessoas:</b> '+(100*data.analytic/data.total).toFixed(0)+'%</p>':'<p>Adiciona uma planta e define a escala.</p>';
  html+='<small>Verde: analítica; azul: sobreposição; laranja: visível; vermelho: sem cobertura. Amostragem geométrica em 2D; paredes desenhadas são opacas.</small>';
 }else if(mode==='preview')html+=preview();
 else if(mode==='suggest'){html+='<button type="button" id="sigs-i-choose">Selecionar ponto na planta</button><p>Escolhe um portão, entrada ou zona de interesse. O SIGS avalia as câmaras já instaladas e apresenta uma recomendação.</p>';
 if(suggested){const v=suggested.best;html+='<p><b>Zona escolhida:</b> '+suggested.covered+' câmaras com visibilidade · '+suggested.analytic+' com analítica de pessoas.</p><p><b>Melhor câmara existente:</b> '+esc(v.d.model||v.d.name||v.p.label||'Câmara')+' · '+v.v.meters.toFixed(1)+' m · '+(v.a.visible?'Analítica estimada OK':v.v.visible?'Visível, sem analítica confirmada':'Sem cobertura')+'.</p>';} }
 else if(mode==='compare'){const cams=cameras();if(!compareIds.length)compareIds=cams.slice(0,2).map(c=>String(c.id));html+='<div class="sigs-i-compare">'+[0,1].map((j)=>'<select data-cmp="'+j+'">'+cams.map((p,i)=>'<option value="'+esc(p.id)+'" '+(String(p.id)===compareIds[j]?'selected':'')+'>'+esc(root.gD(p.libId)?.model||p.label||'Câmara '+(i+1))+'</option>').join('')+'</select>').join('')+'</div><div id="sigs-i-results">'+compare()+'</div>';}
 body.innerHTML=html;
 body.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{mode=b.dataset.tab;update();});
 const check=$('sigs-i-overlay');if(check)check.onchange=e=>{overlay=e.target.checked;root.render();update();};
 const button=$('sigs-i-choose');if(button)button.onclick=()=>{placement=true;root.hint?.('Clica no ponto a proteger na planta. Escape para cancelar.');};
 body.querySelectorAll('[data-cmp]').forEach((el,i)=>el.onchange=()=>{compareIds[i]=el.value;$('sigs-i-results').innerHTML=compare();});
}
function install(){
 if($('sigs-intel')||!$('lp')||!root.cv)return;
 const st=document.createElement('style');st.textContent='#sigs-intel{margin:9px 0;color:#d9e5f5}#sigs-intel summary{cursor:pointer;font-weight:700;padding:10px}#sigs-intel-body{padding:8px 10px;font-size:12px} .sigs-i-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px} .sigs-i-actions button,#sigs-i-choose{background:#172b44;color:#cbd5e1;border:1px solid #355473;border-radius:7px;padding:8px;cursor:pointer}.sigs-i-actions button.chosen{border-color:#50b8ff;color:white;background:#1e3c63}.sigs-i-table{width:100%;border-collapse:collapse;font-size:11px}.sigs-i-table th,.sigs-i-table td{border-bottom:1px solid #34465b;padding:6px 3px;text-align:left}.sigs-i-compare{display:flex;gap:5px;margin:10px 0}.sigs-i-compare select{min-width:0;width:50%;background:#172b44;color:white}.sigs-preview{height:150px;position:relative;overflow:hidden;border-radius:8px;margin-top:10px;background:linear-gradient(#718ea2 0 43%,#76846a 43%);border:1px solid #4b6075}.sigs-preview-ground{position:absolute;inset:43% 0 0;background:repeating-linear-gradient(95deg,transparent 0 33px,#566a55 34px 36px)}.sigs-preview-target{position:absolute;left:60%;top:38%;font-size:50px;color:#1e293b}.sigs-preview-cross{position:absolute;left:49%;top:45%;font:24px monospace;color:#fff}';document.head.append(st);
 const el=document.createElement('details');el.id='sigs-intel';el.innerHTML='<summary>✦ Análise inteligente CCTV</summary><div id="sigs-intel-body"></div>';($('s13-scene-panel')||$('lp')).prepend(el);el.addEventListener('toggle',update);
 root.cv.addEventListener('click',e=>{if(!placement)return;placement=false;e.preventDefault();e.stopImmediatePropagation();if(!root.S?.scale?.ok){root.notify?.('Define primeiro a escala.');return;}const pos=root.ep(e),w=root.s2w(pos.x,pos.y);suggested=placeSuggestion(w.x,w.y);update();},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')placement=false;});
 const oldRender=root.render;if(typeof oldRender==='function')root.render=function(){oldRender.apply(this,arguments);drawOverlay();};
}
root.SIGSCCTVIntelligence={coverage,at,placeSuggestion,compare,preview,install};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,1200));else setTimeout(install,1200);
})(window);
