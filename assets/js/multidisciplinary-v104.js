/* SIGS cross-discipline project workspace: snapshot each module without overwriting others. */
(function(root){'use strict';
const kinds=['cctv','alarm','fire'],names={cctv:'CCTV',alarm:'Intrusão',fire:'Incêndio'};
let snapshots={},enabled=false,switching=false,restoreInProgress=false;
const copy=x=>JSON.parse(JSON.stringify(x));
const originalBuild=root._buildProjectData,originalRestore=root._restoreProjectData,originalStart=root.startModule;
if(typeof originalBuild!=='function'||typeof originalRestore!=='function'||typeof originalStart!=='function')return;
function sharedFloors(d){return (d?.floors||[]).map(f=>({id:f.id,name:f.name,fp:f.fp?copy(f.fp):null,scale:f.scale?copy(f.scale):null,meas:f.meas?copy(f.meas):[]}));}
function saveModule(){if(!enabled||switching||!kinds.includes(root.MOD))return;const d=originalBuild();snapshots[root.MOD]=copy(d);}
function available(){return Object.keys(snapshots).filter(x=>kinds.includes(x));}
function load(kind){
 if(switching||!kinds.includes(kind)||root.SIGS_V6?.currentStatus==='ARCHIVED')return;
 switching=true;
 try{
  if(enabled){const active=originalBuild();snapshots[root.MOD]=copy(active);}
  else{snapshots={[root.MOD]:copy(originalBuild())};enabled=true;}
  const previous=root.MOD;
  const next=snapshots[kind];
  if(next){originalStart(kind);originalRestore(copy(next));}
  else{
   const source=snapshots[root.MOD]||Object.values(snapshots)[0];
   originalStart(kind);
   const floors=sharedFloors(source);
   if(floors.length){
    const base=root.FLOORS?.[0];
    root.FLOORS=floors.map((f,i)=>({...base,id:f.id,name:f.name,placed:[],meas:f.meas,scale:f.scale||{ok:false,ppm:10,mpp:.1},fp:f.fp,devN:0}));
    root.FLOOR_CUR=Math.min(Number(source.floorCur)||0,root.FLOORS.length-1);
    root.renderFloorBar?.();
    root.loadFloor?.(root.FLOOR_CUR);
   }
  }
  root.SIGS_V6&&(root.SIGS_V6.lastFingerprint=null);
  root.sigsV6MarkDirty?.();
 }finally{switching=false;draw();}
}
root._buildProjectData=function(){
 const d=originalBuild();
 if(enabled&&!switching){snapshots[root.MOD]=copy(d);d.sigsMultidisciplinary={version:1,modules:copy(snapshots),active:root.MOD};}
 return d;
};
root._restoreProjectData=function(d){
 restoreInProgress=true;try{
  if(d?.sigsMultidisciplinary?.version===1){
   enabled=true;snapshots=copy(d.sigsMultidisciplinary.modules||{});
   const kind=d.sigsMultidisciplinary.active||d.module||'cctv';
   const active=snapshots[kind]||d;
   if(!kinds.includes(kind))throw new Error('Especialidade do projeto inválida');
   if(root.MOD!==kind)originalStart(kind);
   originalRestore.call(this,copy(active));
  }else{
   enabled=false;snapshots={};originalRestore.call(this,d);
  }
 }finally{restoreInProgress=false;draw();}
};
root.startModule=function(mod){
 if(!switching&&!restoreInProgress){enabled=false;snapshots={};}
 const r=originalStart.apply(this,arguments);draw();return r;
};
function draw(){
 const host=document.getElementById('sigs-multi');if(!host)return;
 host.hidden=!kinds.includes(root.MOD);
 host.querySelectorAll('[data-kind]').forEach(b=>{b.classList.toggle('on',b.dataset.kind===root.MOD);b.disabled=root.SIGS_V6?.currentStatus==='ARCHIVED';});
 const info=host.querySelector('small');if(info)info.textContent=enabled?'Projeto multidisciplinar · '+available().map(x=>names[x]).join(' + '):'Adicionar especialidades sem substituir o projeto atual';
}
function install(){
 if(document.getElementById('sigs-multi'))return;
 const toolbar=document.getElementById('top');if(!toolbar)return;
 const ui=document.createElement('div');ui.id='sigs-multi';ui.className='sigs-multi';ui.innerHTML='<span>Especialidades</span>'+kinds.map(k=>'<button type="button" data-kind="'+k+'">'+names[k]+'</button>').join('')+'<small></small>';
 toolbar.appendChild(ui);ui.addEventListener('click',e=>{const button=e.target.closest('[data-kind]');if(button&&button.dataset.kind!==root.MOD)load(button.dataset.kind);});
 const style=document.createElement('style');style.textContent='.sigs-multi{display:flex;align-items:center;gap:5px;margin-left:8px;flex-wrap:wrap}.sigs-multi span{font-size:10px;color:#94a3b8}.sigs-multi button{border:1px solid #475569;border-radius:7px;padding:6px 8px;background:#172335;color:#cbd5e1;cursor:pointer}.sigs-multi button.on{background:#144b68;border-color:#38bdf8;color:white}.sigs-multi small{font-size:9px;color:#94a3b8;max-width:200px}';document.head.appendChild(style);draw();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
root.SIGSMultidisciplinary={switchTo:load,isEnabled:()=>enabled,modules:()=>available(),snapshot:()=>enabled?copy(snapshots):null};
})(window);
