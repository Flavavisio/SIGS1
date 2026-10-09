
// ════════════════════════════════════════
// MODULE DATA
// ════════════════════════════════════════
var MOD = 'cctv';
var SIGS_PRODUCT_STORAGE_BASE = 'https://kbihedvyykjlbnipdgfm.supabase.co/storage/v1/object/public/product-images/';


// DORI: Detection/Observation/Recognition/Identification distances at base 2.8mm lens
// Calculated per EN 62676-4: D=PPF≥0.025, O≥0.125, R≥0.25, I≥0.5 px/mm of target height (1.8m person)


// Ajax product images — ajax.systems official transparent PNG CDN
// SIGS reference prefix: AJ-* (same product, SIGS distributes Ajax)
var AX_IMG = {
  hub2plus:       'https://kbihedvyykjlbnipdgfm.supabase.co/storage/v1/object/public/product-images/ajax/hub-2-plus.png',
  hub2:           'https://kbihedvyykjlbnipdgfm.supabase.co/storage/v1/object/public/product-images/ajax/hub-2.png',
  rex2:           'https://kbihedvyykjlbnipdgfm.supabase.co/storage/v1/object/public/product-images/ajax/rex-2.png',
  motioncam_out:  'https://kbihedvyykjlbnipdgfm.supabase.co/storage/v1/object/public/product-images/ajax/motioncam-outdoor.png',
  motprot_out:    'https://kbihedvyykjlbnipdgfm.supabase.co/storage/v1/object/public/product-images/ajax/motionprotect-outdoor.png',
  motprot_plus:   'https://kbihedvyykjlbnipdgfm.supabase.co/storage/v1/object/public/product-images/ajax/motionprotect-plus.png',
  motprot:        'https://kbihedvyykjlbnipdgfm.supabase.co/storage/v1/object/public/product-images/ajax/motionprotect.png',
  doorprot_plus:  'https://kbihedvyykjlbnipdgfm.supabase.co/storage/v1/object/public/product-images/ajax/doorprotect-plus.png',
  doorprot:       'https://kbihedvyykjlbnipdgfm.supabase.co/storage/v1/object/public/product-images/ajax/doorprotect.png',
  glassprot:      'https://kbihedvyykjlbnipdgfm.supabase.co/storage/v1/object/public/product-images/ajax/glassprotect.png',
  combiprot:      'https://kbihedvyykjlbnipdgfm.supabase.co/storage/v1/object/public/product-images/ajax/combiprotect.png',
  streetsiren:    'https://kbihedvyykjlbnipdgfm.supabase.co/storage/v1/object/public/product-images/ajax/streetsiren-solo.png',
  homesiren:      'https://kbihedvyykjlbnipdgfm.supabase.co/storage/v1/object/public/product-images/ajax/homesiren.png',
  keypadplus:     'https://kbihedvyykjlbnipdgfm.supabase.co/storage/v1/object/public/product-images/ajax/keypad-plus.png',
  keypadtouch:    'https://kbihedvyykjlbnipdgfm.supabase.co/storage/v1/object/public/product-images/ajax/keypad-touchscreen.png',
  button:         'https://kbihedvyykjlbnipdgfm.supabase.co/storage/v1/object/public/product-images/ajax/button.png',
  wallswitch:     'https://kbihedvyykjlbnipdgfm.supabase.co/storage/v1/object/public/product-images/ajax/wallswitch.png'
};
// Pre-load Ajax images. Two attempts: crossOrigin first (for canvas), then without (for <img> only).
// corsOk[key] = true means image loaded WITH crossOrigin and can be drawn on canvas
var AX_LOADED = {};
var AX_CORS_OK = {};
(function(){
  Object.keys(AX_IMG).forEach(function(k){
    var i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = function(){ AX_CORS_OK[k] = true; render(); };
    i.onload = function(){ AX_LOADED[k] = i; AX_CORS_OK[k] = true; render(); };
    i.onerror = function(){
      var i2 = new Image();
      i2.onload = function(){ AX_LOADED[k] = i2; AX_CORS_OK[k] = false; render(); };
      i2.src = AX_IMG[k];
    };
    i.src = AX_IMG[k];
  });
})();









// External technical equipment catalogue
if(typeof CCTV_LIB==='undefined'||typeof AJAX_LIB==='undefined'||typeof FIRE_LIB==='undefined'){
  throw new Error('SIGS equipment catalogue not loaded: assets/data/equipment-catalog.js');
}

// ════════════════════════════════════════
// STATE
// ════════════════════════════════════════
var S = {
  lib:[], placed:[], meas:[],
  selId:null, multiSel:[], tool:null, activeLib:null,
  scale:{ok:false,ppm:10,mpp:0.1},
  fp:null, pan:{x:0,y:0}, zoom:1,
  layers:{fp:1,dev:1,cov:1,meas:1,grid:1},
  sp1:null, mp1:null, tmpLine:null,
  drag:false, dragFP:false, dragOff:{x:0,y:0}, justPlaced:false,
  panning:false, panStart:null,
  devN:0, editId:null, pendPx:0,
  logoURL:null, mapOpen:false, lmap:null, lmapInited:false, mapLocked:false,
  undoStack:[], redoStack:[]
};

// ════════════════════════════════════════
// MODULE START
// ════════════════════════════════════════
function startModule(mod) {
  if(S.mapOpen) closeMap();
  S.floorPlanLoadId=(S.floorPlanLoadId||0)+1;
  MOD = mod;
  document.getElementById('launcher').classList.add('gone');
  document.getElementById('app').classList.add('show');
  document.getElementById('app').style.display='';
  var _dkA=document.getElementById('disk-calc-app'); if(_dkA) _dkA.classList.remove('visible');
  // Start with base lib + merge persisted custom devices
  var base = mod==='cctv' ? JSON.parse(JSON.stringify(CCTV_LIB))
           : mod==='fire' ? JSON.parse(JSON.stringify(FIRE_LIB))
           : JSON.parse(JSON.stringify(AJAX_LIB));
  var customs = loadCustomLib(mod);
  // Merge: update existing custom entries or append new ones
  customs.forEach(function(cd){
    var idx = base.findIndex(function(d){ return d.id===cd.id; });
    if(idx>=0) base[idx]=cd; else base.push(cd);
  });
  S.lib = base;
  S.placed=[]; S.meas=[]; S.selId=null; S.multiSel=[]; S.activeLib=null; S.devN=0;
  S.fp=null; S.scale={ok:false,ppm:10,mpp:0.1}; S.zoom=1; S.pan={x:0,y:0};
  S.undoStack=[]; S.redoStack=[]; updateUndoUI();
  initFloors();
  S.mapLocked=false;
  var _lb=document.getElementById('maplockbtn');if(_lb){_lb.style.display='none';_lb.textContent='🔓 Fixar Mapa';}

  if(mod==='alarm'){
    document.getElementById('logo-mark').textContent='🔴';
    document.getElementById('logo-mark').className='logo-mark logo-alarm';
    document.getElementById('logo-text').innerHTML='Intrusão <span style="color:var(--acc2)">Ajax</span><em id="logo-em">Design</em>';
    document.getElementById('ph-dot').className='dot dot-r';
    document.getElementById('ph-title').textContent='Ajax Systems';
    document.getElementById('pbtn').className='place-btn pb-alarm';
    document.getElementById('nosel-icon').textContent='🔴';
    document.getElementById('ll-dev').textContent='🔴 Dispositivos Ajax';
    document.getElementById('ll-cov').textContent='🟠 Zonas de Deteção';
    document.getElementById('prop-type-label').textContent='Dispositivo Ajax';
    // populate type select
    var sel=document.getElementById('mc-type'); sel.innerHTML='';
    ALARM_TYPES.forEach(function(t){var o=document.createElement('option');o.value=t;o.textContent=t;sel.appendChild(o);});
    document.getElementById('mc-cctv').style.display='none';
    document.getElementById('mc-alarm').style.display='';
  } else if(mod==='fire'){
    document.getElementById('logo-mark').textContent='🔥';
    document.getElementById('logo-mark').className='logo-mark logo-alarm';
    document.getElementById('logo-text').innerHTML='Incêndio <span style="color:var(--acc2)">Ajax</span><em id="logo-em">Design</em>';
    document.getElementById('ph-dot').className='dot dot-r';
    document.getElementById('ph-title').textContent='EN54 Line';
    document.getElementById('pbtn').className='place-btn pb-alarm';
    document.getElementById('nosel-icon').textContent='🔥';
    document.getElementById('ll-dev').textContent='🔥 Equipamentos EN54';
    document.getElementById('ll-cov').textContent='🟠 Áreas de Deteção';
    document.getElementById('prop-type-label').textContent='Equipamento EN54';
    var selF=document.getElementById('mc-type'); selF.innerHTML='';
    FIRE_TYPES.forEach(function(t){var o=document.createElement('option');o.value=t;o.textContent=t;selF.appendChild(o);});
    document.getElementById('mc-cctv').style.display='none';
    document.getElementById('mc-alarm').style.display='';
  } else {
    document.getElementById('logo-mark').textContent='📹';
    document.getElementById('logo-mark').className='logo-mark logo-cctv';
    document.getElementById('logo-text').innerHTML='CCTV <span>SIGS</span><em id="logo-em">Design</em>';
    document.getElementById('ph-dot').className='dot dot-b';
    document.getElementById('ph-title').textContent='Biblioteca';
    document.getElementById('pbtn').className='place-btn pb-cctv';
    document.getElementById('nosel-icon').textContent='📷';
    document.getElementById('ll-dev').textContent='📷 Câmaras';
    document.getElementById('ll-cov').textContent='🔵 Coberturas';
    document.getElementById('prop-type-label').textContent='Câmara';
    var sel2=document.getElementById('mc-type'); sel2.innerHTML='';
    CCTV_TYPES.forEach(function(t){var o=document.createElement('option');o.value=t;o.textContent={dome:'Dome',bullet:'Bullet',ptz:'Speed Dome/PTZ',fisheye:'Fisheye',radar:'Radar Perimetral',thermal_bi:'Térmica Bi-Spectrum'}[t]||t;sel2.appendChild(o);});
    document.getElementById('mc-cctv').style.display='';
    document.getElementById('mc-alarm').style.display='none';
  }
  document.getElementById('pbtn').disabled=true;
  renderDevList(); deselect(); updateStats(); render(); _preloadAllPhotos();
  setTimeout(resize,80);
  hint(mod==='cctv'?'CCTV: selecione câmara → clique na planta. Arraste diretamente com rato esq.':'Ajax: selecione detetor → clique na planta. Ajuste zona e alcance nas propriedades.');
  // A base do projeto é escolhida pelo utilizador; abrir um projeto conserva a captura guardada.
}

function backToLauncher(){
  document.getElementById('app').classList.remove('show');
  document.getElementById('launcher').classList.remove('gone');
  if(S.mapOpen) closeMap();
}

// ════════════════════════════════════════
// CANVAS
// ════════════════════════════════════════
var cw=document.getElementById('cw');
var bgcv=document.getElementById('bgcv');
var cv=document.getElementById('maincv');
var bg=bgcv.getContext('2d');
var ctx=cv.getContext('2d');

function resize(){
  var w=cw.clientWidth||800, h=cw.clientHeight||600;
  bgcv.width=cv.width=w; bgcv.height=cv.height=h; render();
}
window.addEventListener('resize',resize);
resize();

function w2s(x,y){return{x:x*S.zoom+S.pan.x+cv.width/2,y:y*S.zoom+S.pan.y+cv.height/2};}
function s2w(x,y){return{x:(x-cv.width/2-S.pan.x)/S.zoom,y:(y-cv.height/2-S.pan.y)/S.zoom};}
function ep(e){var r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
function d2(x1,y1,x2,y2){var dx=x2-x1,dy=y2-y1;return Math.sqrt(dx*dx+dy*dy);}

// ════════════════════════════════════════
// RENDER
// ════════════════════════════════════════
function render(){
  var W=cv.width,H=cv.height;
  ctx.clearRect(0,0,W,H); bg.clearRect(0,0,W,H);
  bg.fillStyle='#101824'; bg.fillRect(0,0,W,H);
  if(S.layers.grid)drawGrid();
  if(S.fp&&S.fp.img&&S.layers.fp)drawFP();
  if(S.layers.cov)S.placed.forEach(function(p){var d=gD(p.libId);if(d&&p.visible!==false)drawCov(p,d);});
  if(S.layers.dev)S.placed.forEach(function(p){var d=gD(p.libId);if(d)drawIcon(p,d);});
  if(S.layers.meas)drawMeas();
  if(S.tmpLine)drawTmp();
  if(S.rubberBand&&S.rubberBand.active){
    var rb=S.rubberBand,rs1=w2s(rb.x1,rb.y1),rs2=w2s(rb.x2,rb.y2);
    ctx.save();
    ctx.fillStyle='rgba(59,130,246,.07)';ctx.strokeStyle='rgba(59,130,246,.7)';
    ctx.lineWidth=1.2;ctx.setLineDash([4,3]);
    ctx.fillRect(rs1.x,rs1.y,rs2.x-rs1.x,rs2.y-rs1.y);
    ctx.strokeRect(rs1.x,rs1.y,rs2.x-rs1.x,rs2.y-rs1.y);
    ctx.restore();
  }
}
function drawGrid(){
  var step=S.scale.ok?S.scale.ppm*5*S.zoom:60*S.zoom;
  if(step<14)return;
  var W=cv.width,H=cv.height;
  var ox=((S.pan.x+W/2)%step+step)%step, oy=((S.pan.y+H/2)%step+step)%step;
  bg.strokeStyle='rgba(26,32,53,0.85)'; bg.lineWidth=0.5;
  bg.beginPath();
  for(var x=ox-step;x<W+step;x+=step){bg.moveTo(x,0);bg.lineTo(x,H);}
  for(var y=oy-step;y<H+step;y+=step){bg.moveTo(0,y);bg.lineTo(W,y);}
  bg.stroke();
  var o=w2s(0,0);
  bg.strokeStyle='rgba(59,130,246,0.1)'; bg.lineWidth=1;
  bg.beginPath();bg.moveTo(o.x,0);bg.lineTo(o.x,H);bg.moveTo(0,o.y);bg.lineTo(W,o.y);bg.stroke();
}
function drawFP(){
  var fp=S.fp,s=w2s(fp.x,fp.y),sw=fp.w*S.zoom,sh=fp.h*S.zoom;
  ctx.save(); ctx.globalAlpha=fp.opa;
  ctx.drawImage(fp.img,s.x,s.y,sw,sh);
  ctx.globalAlpha=1;
  ctx.strokeStyle='rgba(0,200,240,0.2)'; ctx.lineWidth=1; ctx.setLineDash([5,4]);
  ctx.strokeRect(s.x,s.y,sw,sh); ctx.setLineDash([]); ctx.restore();
}
function sigsClipBlind(context,p,fov){
  if(!S.scale.ok)return;
  var tilt=p.instTilt!==undefined?p.instTilt:30;if(tilt<0)return;
  var ground=sigsGroundGeometry(p.instHeight||3,tilt,fov),factor=S.scale.ppm*S.zoom;
  // Apply the far ground limit before removing the near blind zone; both clips affect only this overlay.
  if(fov<180&&Number.isFinite(ground.reach)){
    var reach=Math.max(0,ground.reach*factor);
    context.beginPath();context.arc(0,0,reach,0,Math.PI*2);context.clip();
  }
  var radius=ground.blind*factor;
  if(!(radius>0)||!Number.isFinite(radius))return;
  // Coordinates are local to this camera. Clip only its overlay, preserving underlying pixels.
  var origin=w2s(p.x,p.y);
  var outer=Math.max(radius+1,(cv.width+cv.height+Math.abs(origin.x)+Math.abs(origin.y))*2);
  context.beginPath();context.rect(-outer,-outer,outer*2,outer*2);
  context.moveTo(radius,0);context.arc(0,0,radius,0,Math.PI*2);context.closePath();context.clip('evenodd');
}
function drawCov(p,dev){
  var s=w2s(p.x,p.y);
  var fov,range;
  if(MOD==='cctv'){
    // Special types
    if(dev.type==='radar'){
      _drawRadarCov(p,dev,s); return;
    }
    if(dev.type==='thermal_bi'){
      _drawThermalBiCov(p,dev,s); return;
    }
    fov=lFOV(dev.fov,(typeof SIGSLensModel!=='undefined'?SIGSLensModel.effective(p,dev):(p.lens||2.8)),typeof SIGSLensModel!=='undefined'?SIGSLensModel.policy(dev).base:undefined,dev); range=lRange(dev.range,(typeof SIGSLensModel!=='undefined'?SIGSLensModel.effective(p,dev):(p.lens||2.8)));
  }
  else{
    // Ajax: only PIR types show a coverage zone; others are point devices
    var hasCov=['pir_indoor','pir_outdoor','glass','combi','fire'].indexOf(dev.type)>=0;
    if(!hasCov) return;
    fov=p.afov!==undefined?p.afov:dev.fov;
    range=p.arange!==undefined?p.arange:dev.range;
  }
  if(!range||range<=0)return;
  var rPx=range*S.scale.ppm*S.zoom, hf=fov/2, rot=p.rotation*Math.PI/180;
  var opa=p.opacity!==undefined?p.opacity:0.22, col=p.color||dev.color;
  ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(rot);
  var fill=hr(col,opa), stk=hr(col,Math.min(opa*2.8,0.75));

  if(MOD==='cctv')sigsClipBlind(ctx,p,fov);

  // Draw main coverage zone
  function drawSector(r,fc,sc,lw){
    if(r<=0)return;
    if(fov>=355){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fillStyle=fc;ctx.fill();ctx.strokeStyle=sc;ctx.lineWidth=lw;ctx.stroke();}
    else if(fov>0){var sa=(-hf-90)*Math.PI/180,ea=(hf-90)*Math.PI/180;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,sa,ea);ctx.closePath();ctx.fillStyle=fc;ctx.fill();ctx.strokeStyle=sc;ctx.lineWidth=lw;ctx.stroke();}
  }
  drawSector(rPx, fill, stk, 1.5);

  // Draw DORI rings for CCTV (only when scale is set)
  if(MOD==='cctv' && S.scale.ok && p.visible!==false && range>0){
    var lens=(typeof SIGSLensModel!=='undefined'?SIGSLensModel.effective(p,dev):(p.lens||2.8));
    var dr=doriCalc(window.SIGSEngineeringModel&&typeof p!=='undefined'?Object.assign({},dev,{resW:SIGSEngineeringModel.widthPixels(p,dev)}):dev,lens);
    var pairs=[
      [dr.i*S.scale.ppm*S.zoom, 'rgba(240,48,80,0.55)',  'rgba(240,48,80,0.9)'],
      [dr.r*S.scale.ppm*S.zoom, 'rgba(240,160,0,0.45)', 'rgba(240,160,0,0.85)'],
      [dr.o*S.scale.ppm*S.zoom, 'rgba(0,232,136,0.35)', 'rgba(0,232,136,0.8)'],
      [dr.d*S.scale.ppm*S.zoom, 'rgba(0,200,240,0.18)', 'rgba(0,200,240,0.55)']
    ];
    var labels=[['I','#f03050'],['R','#f0a000'],['O','#00e888'],['D','#3b82f6']];
    var modernProfile=!!(window.SIGSAdvancedModel&&window.SIGSImageProfile&&SIGSImageProfile()==='2025'&&dev.type!=='fisheye'&&fov<180);
    if(modernProfile){
      var operational=SIGSAdvancedModel.distances(p,dev,'2025');
      pairs=operational.map(function(l){return [l.distance*S.scale.ppm*S.zoom,l.color,l.color];});
      labels=operational.map(function(l){return [l.short,l.color];});
    }
    ctx.setLineDash([4,3]);
    pairs.forEach(function(pp,idx){
      var r2=pp[0]; if(!Number.isFinite(r2)||r2<=0||(!modernProfile&&r2>rPx*3))return;
      if(modernProfile){
        var outer=Math.min(r2,rPx),inner=Math.min(idx?pairs[idx-1][0]:0,rPx),saBand=(-hf-90)*Math.PI/180,eaBand=(hf-90)*Math.PI/180;
        if(outer>inner){ctx.save();ctx.globalAlpha=.1;ctx.fillStyle=pp[2];ctx.beginPath();ctx.moveTo(Math.cos(saBand)*outer,Math.sin(saBand)*outer);ctx.arc(0,0,outer,saBand,eaBand);ctx.lineTo(Math.cos(eaBand)*inner,Math.sin(eaBand)*inner);if(inner>0)ctx.arc(0,0,inner,eaBand,saBand,true);else ctx.lineTo(0,0);ctx.closePath();ctx.fill();ctx.restore();}
      }
      ctx.strokeStyle=pp[2]; ctx.lineWidth=1.2;
      if(fov>=355){ctx.beginPath();ctx.arc(0,0,r2,0,Math.PI*2);ctx.stroke();}
      else if(fov>0){var sa2=(-hf-90)*Math.PI/180,ea2=(hf-90)*Math.PI/180;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r2,sa2,ea2);ctx.closePath();ctx.stroke();}
      // Label at edge of arc
      if(r2>12){
        ctx.setLineDash([]);
        var ang=fov>=355?(-Math.PI/2):(((-hf-90)+hf/2)*Math.PI/180);
        var lx=Math.cos(ang)*r2, ly=Math.sin(ang)*r2;
        ctx.save(); ctx.translate(lx,ly); ctx.rotate(-rot);
        // Anchor on the rotated arc, then keep only the text upright.
        ctx.font='bold 8px sans-serif';
        ctx.fillStyle=labels[idx][1];
        ctx.fillText(labels[idx][0], 2, -2);
        ctx.restore();
        ctx.setLineDash([4,3]);
      }
    });
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function _drawSector(ctx,rPx,fov,fill,stk,lw){
  if(rPx<=0)return;
  var hf=fov/2;
  if(fov>=355){ctx.beginPath();ctx.arc(0,0,rPx,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stk;ctx.lineWidth=lw;ctx.stroke();}
  else if(fov>0){var sa=(-hf-90)*Math.PI/180,ea=(hf-90)*Math.PI/180;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,rPx,sa,ea);ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stk;ctx.lineWidth=lw;ctx.stroke();}
}

function _drawRadarCov(p,dev,s){
  var fov=dev.radarFov||dev.fov||100;
  var range=dev.radarRange||dev.range||100;
  if(!range)return;
  var rPx=range*S.scale.ppm*S.zoom;
  if(rPx<=0&&!S.scale.ok) rPx=range*2;
  var rot=p.rotation*Math.PI/180;
  var opa=p.opacity!==undefined?p.opacity:0.18;

  // Radar cone colour = p.color (user-editable), default green
  var radarHex = p.color || dev.color || '#10b981';
  function hexToRgb(h){
    var r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);
    return r+','+g+','+b;
  }
  var rRgb = hexToRgb(radarHex);

  ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(rot);

  sigsClipBlind(ctx,p,fov);

  // Main sector
  _drawSector(ctx,rPx,fov,'rgba('+rRgb+','+opa+')','rgba('+rRgb+',0.75)',2);

  // Range rings
  if(S.scale.ok){
    ctx.setLineDash([5,4]);
    [0.33,0.66,1].forEach(function(f,i){
      var r2=rPx*f;
      var hf=fov/2;
      ctx.strokeStyle='rgba('+rRgb+','+(0.2+i*0.15)+')'; ctx.lineWidth=1;
      if(fov>=355){ctx.beginPath();ctx.arc(0,0,r2,0,Math.PI*2);ctx.stroke();}
      else{var sa=(-hf-90)*Math.PI/180,ea=(hf-90)*Math.PI/180;ctx.beginPath();ctx.arc(0,0,r2,sa,ea);ctx.stroke();}
      if(r2>14){
        ctx.setLineDash([]);
        var ang=((-hf/2)-90)*Math.PI/180;
        var lx=Math.cos(ang)*r2*0.95, ly=Math.sin(ang)*r2*0.95;
        ctx.save();ctx.rotate(-rot+(p.rotation-90)*Math.PI/180);
        ctx.font='bold 8px sans-serif'; ctx.fillStyle='rgba('+rRgb+',.9)';
        ctx.fillText(Math.round(range*f)+'m',lx+2,ly-2);
        ctx.restore();
        ctx.setLineDash([5,4]);
      }
    });
    ctx.setLineDash([]);

  }
  ctx.restore();
}

function _drawThermalBiCov(p,dev,s){
  var thermalFov=dev.thermalFov||dev.fov||30;
  var thermalRange=dev.thermalRange||dev.range||100;
  var visibleFov=dev.visibleFov||dev.fov||30;
  var visibleRange=dev.visibleRange||dev.range||150;
  var rot=p.rotation*Math.PI/180;
  var opa=p.opacity!==undefined?p.opacity:0.22;

  // Thermal cone colour = p.color (user-editable), default red
  var thermalHex = p.color || dev.color || '#ef4444';
  // Parse hex to rgb for rgba()
  function hexToRgb(h){
    var r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);
    return r+','+g+','+b;
  }
  var tRgb = hexToRgb(thermalHex);
  // Visible cone is always blue (fixed — represents optical sensor)
  var vRgb = '59,130,246';

  var tRpx=thermalRange*S.scale.ppm*S.zoom;
  var vRpx=visibleRange*S.scale.ppm*S.zoom;
  if(tRpx<=0&&!S.scale.ok){tRpx=thermalRange*2; vRpx=visibleRange*2;}

  ctx.save(); ctx.translate(s.x,s.y); ctx.rotate(rot);

  // ── Visible (blue) drawn first, behind ──
  ctx.save();sigsClipBlind(ctx,p,visibleFov);
  _drawSector(ctx,vRpx,visibleFov,'rgba('+vRgb+','+opa+')','rgba('+vRgb+',0.75)',1.5);ctx.restore();

  // ── Thermal cone (user colour) on top ──
  sigsClipBlind(ctx,p,thermalFov);
  _drawSector(ctx,tRpx,thermalFov,'rgba('+tRgb+','+(opa*1.2)+')','rgba('+tRgb+',0.88)',2);



  // ── Distance labels ──
  if(S.scale.ok && tRpx>14){
    ctx.save(); ctx.rotate(-rot+(p.rotation-90)*Math.PI/180);
    var hfTL=thermalFov/2;
    var angTL=((-hfTL/2)-90)*Math.PI/180;
    var lxT=Math.cos(angTL)*tRpx*0.75, lyT=Math.sin(angTL)*tRpx*0.75;
    ctx.font='bold 8px sans-serif'; ctx.fillStyle='rgba('+tRgb+',.95)';
    ctx.fillText('🌡'+thermalRange+'m',lxT+2,lyT-2);
    if(vRpx>tRpx+10){
      var hfVL=visibleFov/2;
      var angVL=((-hfVL/2)-90)*Math.PI/180;
      var lxV=Math.cos(angVL)*vRpx*0.75, lyV=Math.sin(angVL)*vRpx*0.75;
      ctx.fillStyle='rgba('+vRgb+',.9)';
      ctx.fillText('📷'+visibleRange+'m',lxV+2,lyV-2);
    }
    ctx.restore();
  }
  ctx.restore();
}
function drawIcon(p,dev){
  var s=w2s(p.x,p.y), col=p.color||dev.color;
  var inMulti=S.multiSel.indexOf(p.id)>=0;
  var isPrimary=p.id===S.selId;
  var isSel=isPrimary||inMulti;
  var isAlarm = MOD==='alarm';
  var sz = isAlarm ? 22 : 13;

  ctx.save(); ctx.translate(s.x,s.y);
  // Ajax devices never rotate — always upright
  if(!isAlarm) ctx.rotate((p.rotation-90)*Math.PI/180);

  // Selection ring
  if(isSel){
    ctx.beginPath();ctx.arc(0,0,sz+6,0,Math.PI*2);
    // All selected → red dashed ring
    ctx.strokeStyle='rgba(239,68,68,.95)';ctx.lineWidth=2.5;ctx.setLineDash([5,3]);ctx.stroke();ctx.setLineDash([]);
    // Primary also gets outer glow ring
    if(isPrimary&&inMulti){
      ctx.beginPath();ctx.arc(0,0,sz+10,0,Math.PI*2);
      ctx.strokeStyle='rgba(239,68,68,.4)';ctx.lineWidth=1.5;ctx.stroke();
    }
  }

  // Try draw photo (custom upload OR imgUrl) from preloaded cache
  var _photoKey='__photo__'+dev.id;
  if(AX_LOADED[_photoKey]){
    var photoObj=AX_LOADED[_photoKey];
    ctx.beginPath();ctx.arc(0,0,sz,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,0.95)';ctx.fill();
    ctx.strokeStyle=hr(col,.8);ctx.lineWidth=2;ctx.stroke();
    var d2=sz*1.75;
    try{ ctx.drawImage(photoObj,-d2/2,-d2/2,d2,d2); }catch(e){}
    ctx.restore(); drawDevLabels(p,dev,s,sz,col); return;
  }
  // Try draw Ajax product photo if CORS-loaded successfully
  if(isAlarm && AX_CORS_OK[dev.imgKey] && AX_LOADED[dev.imgKey]){
    var imgObj = AX_LOADED[dev.imgKey];
    // White circle bg
    ctx.beginPath();ctx.arc(0,0,sz,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,0.95)';ctx.fill();
    ctx.strokeStyle=hr(col,.8);ctx.lineWidth=2;ctx.stroke();
    // Draw product image inside circle
    var d=sz*1.75;
    try{ ctx.drawImage(imgObj,-d/2,-d/2,d,d); }catch(e){}
    ctx.restore();
    // Labels outside transform
    drawDevLabels(p,dev,s,sz,col);
    return;
  }

  // Ajax fallback geometric OR CCTV shapes
  ctx.fillStyle=col; ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=1.5;
  var t=dev.type;
  if(t==='turret'){
    // Turret: circle top + flat rectangle base
    ctx.beginPath();ctx.arc(0,-sz*.2,sz*.75,Math.PI,0);ctx.lineTo(sz*.75,sz*.8);ctx.lineTo(-sz*.75,sz*.8);ctx.closePath();
    ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.arc(0,-sz*.2,sz*.28,0,Math.PI*2);ctx.fill();
  } else if(t==='bullet'){
    ctx.beginPath();ctx.rect(-sz*.4,-sz*1.1,sz*.8,sz*1.8);ctx.fill();ctx.stroke();
    ctx.fillStyle='#111';ctx.beginPath();ctx.arc(0,-sz+3,2.5,0,Math.PI*2);ctx.fill();
  } else if(t==='ptz'||t==='hub'||t==='repeater'){
    ctx.beginPath();ctx.arc(0,0,sz,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle=hr(col,.5);ctx.lineWidth=1.5;
    for(var wi=1;wi<=2;wi++){ctx.beginPath();ctx.arc(0,0,sz+wi*5,-.6,.6);ctx.stroke();ctx.beginPath();ctx.arc(0,0,sz+wi*5,Math.PI-.6,Math.PI+.6);ctx.stroke();}
  } else if(t==='pir_outdoor'||t==='pir_indoor'){
    ctx.beginPath();ctx.moveTo(0,-sz);ctx.lineTo(sz,sz*.7);ctx.lineTo(-sz,sz*.7);ctx.closePath();ctx.fill();ctx.stroke();
  } else if(t==='door'){
    ctx.beginPath();ctx.roundRect(-sz*.6,-sz,sz*1.2,sz*2,3);ctx.fill();ctx.stroke();
  } else if(t==='glass'||t==='combi'){
    ctx.beginPath();ctx.arc(0,0,sz,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1.5;ctx.setLineDash([2,2]);
    ctx.beginPath();ctx.arc(0,0,sz*.55,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  } else if(t==='siren_ext'||t==='siren_int'){
    ctx.beginPath();ctx.arc(0,0,sz,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.strokeStyle=hr(col,.8);ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(0,0,sz+5,-1,1);ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,sz+9,-1.2,1.2);ctx.stroke();
  } else if(t==='keypad'){
    ctx.beginPath();ctx.roundRect(-sz,-sz*.8,sz*2,sz*1.6,4);ctx.fill();ctx.stroke();
  } else if(t==='radar'){
    // Radar dish shape: arc + stem
    ctx.beginPath();ctx.arc(0,-sz*.2,sz*.9,-Math.PI*.7,Math.PI*.7);ctx.lineTo(0,sz*.7);ctx.closePath();
    ctx.fill();ctx.stroke();
    // radar beam lines
    ctx.strokeStyle='rgba(16,185,129,.7)';ctx.lineWidth=1.2;
    for(var ri=1;ri<=3;ri++){ctx.beginPath();ctx.arc(0,-sz*.2,sz*.3+ri*sz*.18,-Math.PI*.5,Math.PI*.5);ctx.stroke();}
  } else if(t==='thermal_bi'){
    // Bi-spectrum: two overlapping lens circles (red + blue)
    ctx.fillStyle='rgba(59,130,246,.8)';ctx.strokeStyle='rgba(59,130,246,.9)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(sz*.3,0,sz*.65,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(239,68,68,.85)';ctx.strokeStyle='rgba(239,68,68,.95)';
    ctx.beginPath();ctx.arc(-sz*.3,0,sz*.65,0,Math.PI*2);ctx.fill();ctx.stroke();
    // Center dot
    ctx.fillStyle='rgba(255,255,255,.9)';ctx.beginPath();ctx.arc(0,0,3,0,Math.PI*2);ctx.fill();
  } else {
    ctx.beginPath();ctx.arc(0,0,sz,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.88)';ctx.beginPath();ctx.arc(0,0,4,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
  drawDevLabels(p,dev,s,sz,col);
}
function drawDevLabels(p,dev,s,sz,col){
  if(p.label){
    ctx.save();ctx.font='bold 10px sans-serif';
    var tw=ctx.measureText(p.label).width;
    ctx.fillStyle='rgba(0,0,0,.78)';ctx.fillRect(s.x+sz+4,s.y-9,tw+8,15);
    ctx.fillStyle='#fff';ctx.fillText(p.label,s.x+sz+8,s.y+3);ctx.restore();
  }
  if(MOD==='cctv'&&(typeof SIGSLensModel!=='undefined'?SIGSLensModel.effective(p,dev):(p.lens||0))>2.9){
    ctx.save();ctx.font='9px monospace';ctx.fillStyle='rgba(240,160,0,.9)';
    var lb=typeof SIGSLensModel!=='undefined'?SIGSLensModel.valueLabel(p,dev):p.lens.toFixed(1)+'mm',tw2=ctx.measureText(lb).width;
    ctx.fillText(lb,s.x-sz-tw2-3,s.y+4);ctx.restore();
  }
  if(MOD==='alarm'&&p.zone){
    ctx.save();ctx.font='bold 9px monospace';
    var zl='Z'+p.zone,tw3=ctx.measureText(zl).width;
    ctx.fillStyle='rgba(0,0,0,.72)';ctx.fillRect(s.x-sz-tw3-7,s.y-8,tw3+7,13);
    ctx.fillStyle=col;ctx.fillText(zl,s.x-sz-tw3-3,s.y+2);ctx.restore();
  }
}
function drawMeas(){
  S.meas.forEach(function(m){
    var s1=w2s(m.x1,m.y1),s2=w2s(m.x2,m.y2);
    ctx.save();ctx.strokeStyle='#FFD700';ctx.lineWidth=2;ctx.setLineDash([]);
    ctx.beginPath();ctx.moveTo(s1.x,s1.y);ctx.lineTo(s2.x,s2.y);ctx.stroke();
    [s1,s2].forEach(function(p){ctx.fillStyle='#FFD700';ctx.beginPath();ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fill();});
    if(m.label){var mx=(s1.x+s2.x)/2,my=(s1.y+s2.y)/2;ctx.font='bold 11px monospace';var tw=ctx.measureText(m.label).width;ctx.fillStyle='rgba(0,0,0,.8)';ctx.fillRect(mx-tw/2-4,my-16,tw+8,16);ctx.fillStyle='#FFD700';ctx.textAlign='center';ctx.fillText(m.label,mx,my-3);}
    ctx.restore();
  });
}
function drawTmp(){
  var t=S.tmpLine,s1=w2s(t.x1,t.y1),s2=w2s(t.x2,t.y2);
  ctx.save();ctx.strokeStyle=t.col||'#3b82f6';ctx.lineWidth=2;ctx.setLineDash([6,4]);
  ctx.beginPath();ctx.moveTo(s1.x,s1.y);ctx.lineTo(s2.x,s2.y);ctx.stroke();
  ctx.setLineDash([]);ctx.fillStyle=t.col||'#3b82f6';ctx.beginPath();ctx.arc(s1.x,s1.y,4,0,Math.PI*2);ctx.fill();ctx.restore();
}

// ════════════════════════════════════════
// MOUSE — cameras always draggable
// ════════════════════════════════════════
function onDown(e){
  if(S.mapOpen)return;
  var pos=ep(e);
  if(e.button===1||(e.button===0&&e.altKey)){S.panning=true;S.panStart={x:e.clientX,y:e.clientY};cw.style.cursor='grabbing';e.preventDefault();return;}
  if(e.button!==0)return;
  if(S.tool==='meas'||S.tool==='scale'||S.tool==='nvr')return;
  var w=s2w(pos.x,pos.y);
  var hit=hitT(w.x,w.y);
  if(hit){
    if(e.ctrlKey||e.metaKey){
      // Ctrl+click: toggle item in multiSel
      var idx=S.multiSel.indexOf(hit.id);
      if(idx>=0){S.multiSel.splice(idx,1);}else{S.multiSel.push(hit.id);if(S.selId&&S.multiSel.indexOf(S.selId)<0)S.multiSel.push(S.selId);}
      S.selId=hit.id;
      updateMultiSelPanel(); render(); return;
    }
    // If clicking an already-multi-selected item — drag all
    if(S.multiSel.length>1&&S.multiSel.indexOf(hit.id)>=0){
      S.drag=true; S.dragOff={x:w.x-hit.x,y:w.y-hit.y}; S.dragAnchor={x:hit.x,y:hit.y};
      cw.style.cursor='grabbing'; e.preventDefault(); return;
    }
    // Normal single select + drag
    if(!e.ctrlKey&&!e.metaKey)S.multiSel=[];
    select(hit.id);S.drag=true;S.dragOff={x:w.x-hit.x,y:w.y-hit.y};cw.style.cursor='grabbing';e.preventDefault();return;
  }
  if(S.tool!=='place'){
    // Floor plan drag — only if click lands strictly inside the fp image
    if(S.fp&&!S.fp.locked){
      var fp=S.fp,fs=w2s(fp.x,fp.y);
      var fpOnFP=pos.x>=fs.x&&pos.x<=fs.x+fp.w*S.zoom&&pos.y>=fs.y&&pos.y<=fs.y+fp.h*S.zoom;
      if(fpOnFP){S.dragFP=true;S.dragOff={x:w.x-fp.x,y:w.y-fp.y};return;}
    }
    // No hit and not on FP — start rubber-band
    if(!e.ctrlKey&&!e.metaKey){S.multiSel=[];deselect();}
    S.rubberBand={x1:w.x,y1:w.y,x2:w.x,y2:w.y,active:true};
    cw.style.cursor='crosshair';
  }
}
function onUp(e){
  if(S.panning){S.panning=false;cw.style.cursor=tCur();}
  if(S.drag){cw.style.cursor=tCur();pushUndo();}
  if(S.dragFP)pushUndo();
  // Finish rubber-band
  if(S.rubberBand&&S.rubberBand.active){
    var rb=S.rubberBand;
    var x1=Math.min(rb.x1,rb.x2),x2=Math.max(rb.x1,rb.x2);
    var y1=Math.min(rb.y1,rb.y2),y2=Math.max(rb.y1,rb.y2);
    if(x2-x1>5||y2-y1>5){
      var hits=S.placed.filter(function(p){return p.x>=x1&&p.x<=x2&&p.y>=y1&&p.y<=y2;});
      if(hits.length){
        S.multiSel=hits.map(function(p){return p.id;});
        S.selId=hits[hits.length-1].id;
        updateMultiSelPanel();
      }
    }
    S.rubberBand=null; render();
  }
  cw.style.cursor=tCur();
  S.drag=false;S.dragFP=false;updateStats();
}
function onMove(e){
  if(S.mapOpen)return;
  var pos=ep(e),w=s2w(pos.x,pos.y);
  if(S.scale.ok)document.getElementById('cpill').textContent='X:'+(w.x*S.scale.mpp).toFixed(1)+'m Y:'+(w.y*S.scale.mpp).toFixed(1)+'m';
  else document.getElementById('cpill').textContent='X:'+Math.round(w.x)+' Y:'+Math.round(w.y);
  if(S.panning){S.pan.x+=e.clientX-S.panStart.x;S.pan.y+=e.clientY-S.panStart.y;S.panStart={x:e.clientX,y:e.clientY};render();return;}
  // Move group if multi-selected
  if(S.drag&&S.multiSel.length>1){
    var anchor=fP(S.selId);
    if(anchor){
      var dx=(w.x-S.dragOff.x)-anchor.x, dy=(w.y-S.dragOff.y)-anchor.y;
      S.multiSel.forEach(function(id){var p=fP(id);if(p){p.x+=dx;p.y+=dy;}});
      anchor.x+=dx;anchor.y+=dy;
    }
    render();return;
  }
  if(S.drag&&S.selId){var pc=fP(S.selId);if(pc){pc.x=w.x-S.dragOff.x;pc.y=w.y-S.dragOff.y;render();return;}}
  if(S.dragFP&&S.fp){S.fp.x=w.x-S.dragOff.x;S.fp.y=w.y-S.dragOff.y;render();return;}
  // Update rubber-band
  if(S.rubberBand&&S.rubberBand.active){S.rubberBand.x2=w.x;S.rubberBand.y2=w.y;render();return;}
  if(!S.drag&&!S.panning&&S.tool!=='meas'&&S.tool!=='scale')cw.style.cursor=hitT(w.x,w.y)?'grab':tCur();
  var p1=S.tool==='meas'?S.mp1:(S.tool==='scale'?S.sp1:null);
  if(p1){S.tmpLine={x1:p1.x,y1:p1.y,x2:w.x,y2:w.y,col:S.tool==='scale'?'#00e888':'#FFD700'};hint(S.scale.ok?(d2(p1.x,p1.y,w.x,w.y)*S.scale.mpp).toFixed(2)+' m':d2(p1.x,p1.y,w.x,w.y).toFixed(0)+' px');render();}
}
function onClick(e){
  if(S.mapOpen)return;
  if(e.button!==0||S.panning||S.drag||S.dragFP)return;
  // If we just placed a device this mousedown cycle, skip — prevents double placement
  if(S.justPlaced){S.justPlaced=false;return;}
  var pos=ep(e),w=s2w(pos.x,pos.y);
  if(S.tool==='place'&&S.activeLib){placeDevice(w.x,w.y);return;}
  if(S.tool==='meas'){handleMeas(w);return;}
  if(S.tool==='scale'){handleScale(w);return;}
  if(!hitT(w.x,w.y))deselect();
}
function onCtxMenu(e){e.preventDefault();if(S.mapOpen)return;var pos=ep(e),w=s2w(pos.x,pos.y),hit=hitT(w.x,w.y);if(hit){select(hit.id);var m=document.getElementById('ctx');m.style.left=e.clientX+'px';m.style.top=e.clientY+'px';m.style.display='block';}}
document.addEventListener('click',function(){document.getElementById('ctx').style.display='none';document.getElementById('ctx-lib').style.display='none';});
function onWheel(e){
  if(S.mapOpen)return;e.preventDefault();
  var pos=ep(e),w=s2w(pos.x,pos.y);
  if(S.selId){var pc=fP(S.selId);if(pc&&d2(w.x,w.y,pc.x,pc.y)<28/S.zoom){var step=e.shiftKey?1:5,delta=e.deltaY>0?step:-step;pc.rotation=((pc.rotation+delta)%360+360)%360;syncP();render();return;}}
  var f=e.deltaY<0?1.12:(1/1.12);
  S.zoom=Math.max(0.03,Math.min(25,S.zoom*f));
  S.pan.x=pos.x-cv.width/2-w.x*S.zoom; S.pan.y=pos.y-cv.height/2-w.y*S.zoom;
  document.getElementById('zpill').textContent=Math.round(S.zoom*100)+'%'; render();
}

// ════════════════════════════════════════
// TOOLS
// ════════════════════════════════════════
function setTool(t){
  S.tool=t; S.mp1=null; S.sp1=null; S.tmpLine=null;
  ['place','meas','scale'].forEach(function(n){var el=document.getElementById('t-'+n);if(el)el.classList.toggle('on',n===t);});
  cw.style.cursor=tCur();
  var msgs={place:S.activeLib?'Clique na planta para posicionar: '+S.activeLib.name:'Selecione primeiro da lista','meas':'Clique ponto inicial da medição','scale':'Clique 1.º ponto de referência'};
  if(msgs[t])hint(msgs[t]); render();
}
function tCur(){return{place:'crosshair',meas:'crosshair',scale:'crosshair'}[S.tool]||'default';}

// ════════════════════════════════════════
// MEASURE / SCALE
// ════════════════════════════════════════
function handleMeas(w){
  if(!S.mp1){S.mp1=w;hint('Clique no ponto final');return;}
  var dv=d2(S.mp1.x,S.mp1.y,w.x,w.y),lbl;
  if(S.scale.ok){lbl=(dv*S.scale.mpp).toFixed(2)+' m';}else lbl=dv.toFixed(0)+' px';
  pushUndo();
  S.meas.push({id:uid(),x1:S.mp1.x,y1:S.mp1.y,x2:w.x,y2:w.y,label:lbl});
  S.mp1=null; S.tmpLine=null; render(); updateStats();
}
function handleScale(w){
  if(!S.sp1){S.sp1=w;hint('Clique no 2.º ponto');return;}
  var dv=d2(S.sp1.x,S.sp1.y,w.x,w.y);
  if(dv<10){notify('Pontos muito próximos');S.sp1=null;S.tmpLine=null;return;}
  S.pendPx=dv; document.getElementById('ms-px').textContent=dv.toFixed(1)+' px';
  document.getElementById('ms-m').value=10; updSP(); openM('m-scale');
  S.sp1=null; S.tmpLine=null; render();
}
document.getElementById('ms-m').addEventListener('input',updSP);
function updSP(){var m=+document.getElementById('ms-m').value;if(m>0&&S.pendPx>0)document.getElementById('ms-prev').textContent=(S.pendPx/m).toFixed(2)+' px/m';}
function applyScale(){
  var m=+document.getElementById('ms-m').value; if(m<=0)return;
  S.scale={ok:true,ppm:S.pendPx/m,mpp:m/S.pendPx};
  document.getElementById('scbadge').textContent=S.scale.ppm.toFixed(1)+' px/m';
  closeM('m-scale'); S.tool=null;
  ['place','meas','scale'].forEach(function(n){var el=document.getElementById('t-'+n);if(el)el.classList.remove('on');});
  cw.style.cursor='default'; render(); updateStats(); notify('Escala: '+S.scale.ppm.toFixed(1)+' px/m');
}

// ════════════════════════════════════════
// DEVICE PLACEMENT
// ════════════════════════════════════════
// Returns the lowest free number for a given prefix (e.g. 'CAM')
// so deleting CAM02 and adding a new one reuses 02 instead of 03
function nextNum(pre){
  var used=new Set();
  S.placed.forEach(function(p){
    var m=p.label.match(new RegExp('^'+pre+'(\\d+)$'));
    if(m)used.add(parseInt(m[1],10));
  });
  for(var n=1;n<=999;n++){if(!used.has(n))return n;}
  return used.size+1;
}
function placeDevice(x,y){
  var dev=S.activeLib; if(!dev)return;
  var prefixes={dome:'CAM',bullet:'CAM',ptz:'CAM',fisheye:'CAM',radar:'RAD',thermal_bi:'THM',hub:'HUB',repeater:'REX',pir_outdoor:'PIR',pir_indoor:'PIR',door:'DR',glass:'GL',combi:'CB',siren_ext:'SIR',siren_int:'SIR',keypad:'KP',remote:'BTN',relay:'RLY'};
  var pre=(prefixes[dev.type]||'DEV');
  var n=nextNum(pre);
  S.devN++; // keep for save-format compatibility
  var pc={id:uid(),libId:dev.id,x:x,y:y,rotation:0,label:pre+(n<10?'0':'')+n,color:dev.color,opacity:0.22,visible:true,lens:typeof SIGSLensModel!=='undefined'?SIGSLensModel.policy(dev).initial:2.8,afov:dev.fov,arange:dev.range,zone:1,mp:dev.mp||4,codec:(String(dev.brand||'').toLowerCase().includes('unv')||String(dev.brand||'').toLowerCase().includes('uniview'))?'ultra265b':'h265',days:30,instHeight:dev.height||3,instTilt:30};
  pushUndo();
  S.placed.push(pc);
  S.justPlaced=true; // block next onClick from placing another
  select(pc.id); render(); updateStats();
  hint(S.activeLib.name+' → clique para colocar outro | Esc para sair');
  notify(pc.label+' colocado ✓');
}
function hitT(wx,wy){for(var i=S.placed.length-1;i>=0;i--){var p=S.placed[i];if(d2(wx,wy,p.x,p.y)<20/S.zoom)return p;}return null;}
function gD(id){for(var i=0;i<S.lib.length;i++)if(S.lib[i].id===id)return S.lib[i];return null;}
function fP(id){for(var i=0;i<S.placed.length;i++)if(S.placed[i].id===id)return S.placed[i];return null;}

function select(id){
  S.selId=id; var pc=fP(id); if(!pc)return;
  var dev=gD(pc.libId);
  document.getElementById('nosel').style.display='none';
  document.getElementById('cpanel').style.display='block';
  document.getElementById('rpill').style.display='';
  document.getElementById('pname').textContent=dev?dev.name:'—';
  document.getElementById('pmodel').textContent=dev?(dev.model||'—'):'—';
  if(MOD==='cctv'&&dev&&['dome','bullet','ptz','fisheye','turret'].indexOf(dev.type)>=0&&typeof SIGSLensModel!=='undefined')document.getElementById('pmodel').textContent+=' · '+SIGSLensModel.policy(dev).label;
  document.getElementById('cctv-lens').style.display=(MOD==='cctv'&&dev&&dev.type!=='radar'&&dev.type!=='thermal_bi')?'':'none';
  var installPanel=document.getElementById('cctv-install');
  if(installPanel) installPanel.style.display=(MOD==='cctv')?'':'none';
  document.getElementById('alarm-zone').style.display=MOD==='alarm'?'':'none';
  // Ajax devices have no rotation
  var rotRow=document.getElementById('rot-row'), rotBtns=document.getElementById('rot-btns');
  if(rotRow)  rotRow.style.display  = MOD==='alarm'?'none':'';
  if(rotBtns) rotBtns.style.display = MOD==='alarm'?'none':'';
  // Ajax: hide rotation controls
  var rotRow=document.getElementById('rot-row'), rotBtns=document.getElementById('rot-btns');
  if(rotRow) rotRow.style.display=MOD==='alarm'?'none':'';
  if(rotBtns) rotBtns.style.display=MOD==='alarm'?'none':'';
  syncP(); tab('props'); render();
}
function syncP(){
  var pc=fP(S.selId); if(!pc)return;
  var dev=gD(pc.libId), lens=typeof SIGSLensModel!=='undefined'?SIGSLensModel.effective(pc,dev):(pc.lens||2.8);
  document.getElementById('plbl').value=pc.label;
  document.getElementById('prot').value=pc.rotation;
  document.getElementById('pcol').value=pc.color||(dev?dev.color:'#3b82f6');
  var op=pc.opacity!==undefined?pc.opacity:0.22;
  document.getElementById('popa').value=Math.round(op*100);
  document.getElementById('popav').textContent=Math.round(op*100)+'%';
  document.getElementById('pvis').checked=pc.visible!==false;
  if(MOD==='cctv'&&dev){
    var isRadar=dev.type==='radar', isThermal=dev.type==='thermal_bi';
    var lensPanel=document.getElementById('cctv-lens');
    var doriPanel=document.getElementById('cctv-dori');
    if(isRadar||isThermal){
      if(lensPanel) lensPanel.style.display='none';
      if(doriPanel) doriPanel.style.display='none';
      if(isRadar){
        document.getElementById('pinfo').textContent='Radar · '+dev.radarFov+'° · '+dev.radarRange+'m';
      } else {
        document.getElementById('pinfo').innerHTML='<span style="color:#ef4444">🌡 Térmica: '+dev.thermalRange+'m · '+dev.thermalFov+'°</span>  <span style="color:#3b82f6">📷 Visível: '+dev.visibleRange+'m · '+dev.visibleFov+'°</span>';
      }
    } else {
      if(lensPanel) lensPanel.style.display='';
      if(typeof SIGSLensModel!=='undefined')SIGSLensModel.syncControl(document.getElementById('plens'),pc,dev);
      if(typeof SIGSLensModel==='undefined')document.getElementById('plens').value=lens;
      document.getElementById('plensv').textContent=typeof SIGSLensModel!=='undefined'?SIGSLensModel.valueLabel(pc,dev):lens.toFixed(1)+'mm';
      var zoomUI=typeof SIGSLensModel!=='undefined'&&SIGSLensModel.policy(dev).kind==='ptz';
      if(document.getElementById('plens-title'))document.getElementById('plens-title').textContent=zoomUI?'Zoom óptico':'Lente Focal';
      if(document.getElementById('plens-unit'))document.getElementById('plens-unit').textContent=zoomUI?'Zoom (×)':'Focal (mm)';
      var ef=lFOV(dev.fov,lens,typeof SIGSLensModel!=='undefined'?SIGSLensModel.policy(dev).base:undefined,dev),er=lRange(dev.range,lens);
      document.getElementById('pinfo').textContent='FOV: '+ef.toFixed(0)+'°  Alcance: '+er.toFixed(0)+' m';
      document.getElementById('plensinfo').textContent='FOV: '+ef.toFixed(0)+'°  |  Alcance: '+er.toFixed(0)+' m\n'+(typeof SIGSLensModel!=='undefined'?SIGSLensModel.policy(dev).label:lDesc(lens));
      updateDoriPanel(dev,lens);
    }
  } else {
    var dp=document.getElementById('cctv-dori'); if(dp)dp.style.display='none';
  }
  if(MOD==='alarm'&&dev){
    document.getElementById('p-arange').value=pc.arange!==undefined?pc.arange:(dev.range||0);
    document.getElementById('p-afov').value=pc.afov!==undefined?pc.afov:(dev.fov||0);
    document.getElementById('p-zone').value=pc.zone||1;
    document.getElementById('pinfo').textContent=(dev.desc||'')+'  |  Zona '+(pc.zone||1);
  }
  // Sync install height & tilt for CCTV
  if(MOD==='cctv'){
    var hEl=document.getElementById('p-instH');
    var tEl=document.getElementById('p-tilt');
    if(hEl&&tEl){
      var h=pc.instHeight!==undefined?pc.instHeight:3;
      var t=pc.instTilt!==undefined?pc.instTilt:30;
      hEl.value=h; tEl.value=t;
      document.getElementById('p-tiltv').textContent=t+'°';
      _calcBlindSpot(h,t);
    }
  }
}
function deselect(){S.selId=null;S.multiSel=[];document.getElementById('nosel').style.display='';document.getElementById('cpanel').style.display='none';document.getElementById('rpill').style.display='none';document.getElementById('multi-sel-bar').style.display='none';render();}

// ════════════════════════════════════════
// INSTALLATION HEIGHT & BLIND SPOT
// ════════════════════════════════════════
function updInstall(){
  var pc=fP(S.selId); if(!pc) return;
  var h=parseFloat(document.getElementById('p-instH').value)||3;
  var tilt=parseFloat(document.getElementById('p-tilt').value);if(!Number.isFinite(tilt))tilt=30;
  document.getElementById('p-tiltv').textContent=tilt+'°';
  pc.instHeight=h; pc.instTilt=tilt;
  _calcBlindSpot(h,tilt);
  render();
}

function _calcBlindSpot(h,tilt){
  var bsEl=document.getElementById('bs-ground'),reachEl=document.getElementById('bs-reach'),hintEl=document.getElementById('bs-hint');
  if(!bsEl)return;
  var p=fP(S.selId),dev=p&&gD(p.libId),hfov=dev?lFOV(dev.fov,(typeof SIGSLensModel!=='undefined'?SIGSLensModel.effective(p,dev):(p.lens||2.8)),typeof SIGSLensModel!=='undefined'?SIGSLensModel.policy(dev).base:undefined,dev):60;
  if(dev&&dev.type==='thermal_bi')hfov=p.thermalFov||dev.thermalFov||hfov;
  var ground=sigsGroundGeometry(h,tilt,hfov);
  bsEl.textContent=ground.blind.toFixed(2)+' m';bsEl.style.color='#a855f7';
  reachEl.textContent=Number.isFinite(ground.reach)?ground.reach.toFixed(1)+' m':'sem limite geométrico';
  hintEl.textContent='Estimativa 16:9 · FOV vertical '+ground.verticalFov.toFixed(1)+'° · zona cega = '+h+' m ÷ tan('+tilt+'° + '+ground.verticalHalf.toFixed(1)+'°). A cobertura na planta é recortada entre a zona cega e o limite no chão, até ao alcance indicado.';
  _drawBlindSpotDiagram(h,tilt,ground.blind,ground.verticalHalf);
}

function _drawBlindSpotDiagram(h, tilt, blindDist, verticalHalf){
  var c=document.getElementById('bs-diagram'); if(!c) return;
  var ctx2=c.getContext('2d');
  var W=c.width, H=c.height; // 440x160
  ctx2.clearRect(0,0,W,H);

  // Background gradient
  var bg2=ctx2.createLinearGradient(0,0,0,H);
  bg2.addColorStop(0,'#060a14'); bg2.addColorStop(1,'#0a1020');
  ctx2.fillStyle=bg2; ctx2.fillRect(0,0,W,H);

  var padL=36, padR=16, padT=16, padB=28;
  var areaW=W-padL-padR, areaH=H-padT-padB;
  var wallX=padL;
  var groundY=H-padB;

  // Scale: show wall→blindDist→reach
  var vFovHalf=verticalHalf===undefined?15:verticalHalf;
  var lowerAngle=tilt-vFovHalf;
  var reach = lowerAngle>0 ? (h/Math.tan(lowerAngle*Math.PI/180)) : null;
  var maxX = reach ? Math.min(reach*1.15, blindDist*3.5) : blindDist*3;
  maxX = Math.max(maxX, blindDist*2, h*2);
  var scaleX = areaW / maxX;
  var scaleY = areaH / (h * 1.35);

  var camX = wallX;
  var camY = groundY - h*scaleY;

  // ── Grid lines ──
  ctx2.strokeStyle='rgba(255,255,255,.05)'; ctx2.lineWidth=0.5;
  // Vertical grid at each meter
  for(var gx=1; gx<=Math.ceil(maxX); gx++){
    var gxPx=wallX+gx*scaleX; if(gxPx>W-padR) break;
    ctx2.beginPath(); ctx2.moveTo(gxPx,padT); ctx2.lineTo(gxPx,groundY); ctx2.stroke();
  }

  // ── Ground ──
  ctx2.strokeStyle='rgba(255,255,255,.25)'; ctx2.lineWidth=1.5;
  ctx2.beginPath(); ctx2.moveTo(wallX,groundY); ctx2.lineTo(W-padR,groundY); ctx2.stroke();

  // ── Wall ──
  var wallGrad=ctx2.createLinearGradient(0,0,wallX,0);
  wallGrad.addColorStop(0,'rgba(59,130,246,.0)'); wallGrad.addColorStop(1,'rgba(59,130,246,.35)');
  ctx2.fillStyle=wallGrad; ctx2.fillRect(0,padT,wallX,groundY-padT);
  ctx2.strokeStyle='rgba(59,130,246,.5)'; ctx2.lineWidth=2;
  ctx2.beginPath(); ctx2.moveTo(wallX,padT); ctx2.lineTo(wallX,groundY+2); ctx2.stroke();

  // ── Blind zone fill ──
  var blindPx = Math.min(blindDist*scaleX, areaW);
  // Blind zone stays unfilled; retain the distance marker below.

  // ── Reach zone fill (green) ──
  if(reach){
    var reachPx = Math.min(reach*scaleX, areaW);
    var rGrad=ctx2.createLinearGradient(wallX+blindPx,0,wallX+reachPx,0);
    rGrad.addColorStop(0,'rgba(16,185,129,.25)'); rGrad.addColorStop(1,'rgba(16,185,129,.05)');
    ctx2.fillStyle=rGrad;
    ctx2.fillRect(wallX+blindPx, groundY-5, reachPx-blindPx, 5);
  }

  // ── Height dimension line ──
  ctx2.strokeStyle='rgba(255,255,255,.2)'; ctx2.lineWidth=1; ctx2.setLineDash([2,3]);
  ctx2.beginPath(); ctx2.moveTo(wallX-6,camY); ctx2.lineTo(wallX-6,groundY); ctx2.stroke();
  ctx2.setLineDash([]);
  // Arrow tips
  [[wallX-6,camY,1],[wallX-6,groundY,-1]].forEach(function(a){
    ctx2.fillStyle='rgba(255,255,255,.3)';
    ctx2.beginPath(); ctx2.moveTo(a[0],a[1]); ctx2.lineTo(a[0]-3,a[1]+a[2]*5); ctx2.lineTo(a[0]+3,a[1]+a[2]*5); ctx2.fill();
  });
  ctx2.fillStyle='rgba(255,255,255,.6)'; ctx2.font='bold 9px monospace'; ctx2.textAlign='right'; ctx2.textBaseline='middle';
  ctx2.fillText(h+'m', wallX-10, (camY+groundY)/2);

  // ── FOV cone ──
  var tiltRad=tilt*Math.PI/180;
  var vHalfRad=vFovHalf*Math.PI/180;
  // ângulo no canvas: 0 = horizontal, +PI/2 = a apontar para baixo (= graus abaixo da horizontal)
  var upperAngle = Math.max(0.001, tiltRad - vHalfRad);        // bordo mais horizontal → alcance
  var lowerAngleRad = Math.min(Math.PI/2, tiltRad + vHalfRad); // bordo mais inclinado → zona cega

  function rayEndOnCanvas(angle){
    // angle from camera going right
    var dx=Math.cos(angle), dy=Math.sin(angle);
    if(Math.abs(dx)<0.0001) return null;
    var t1 = (W-padR-camX)/dx;
    var t2 = dy>0 ? (groundY-camY)/dy : (padT-camY)/dy;
    var t = Math.min(t1>0?t1:1e9, t2>0?t2:1e9);
    return {x:camX+dx*t, y:camY+dy*t};
  }

  var ep1=rayEndOnCanvas(upperAngle);
  var ep2=rayEndOnCanvas(lowerAngleRad);
  var mainRay=rayEndOnCanvas(tiltRad);

  // Cone fill
  if(ep1&&ep2){
    ctx2.save();
    ctx2.beginPath(); ctx2.moveTo(camX,camY);
    ctx2.lineTo(ep1.x,ep1.y); ctx2.lineTo(ep2.x,ep2.y); ctx2.closePath();
    var coneFill=ctx2.createLinearGradient(camX,camY,ep2.x,ep2.y);
    coneFill.addColorStop(0,'rgba(59,130,246,.3)'); coneFill.addColorStop(1,'rgba(59,130,246,.05)');
    ctx2.fillStyle=coneFill; ctx2.fill();
    ctx2.restore();
  }
  // Cone edges
  ctx2.strokeStyle='rgba(59,130,246,.5)'; ctx2.lineWidth=1; ctx2.setLineDash([5,4]);
  if(ep1){ctx2.beginPath();ctx2.moveTo(camX,camY);ctx2.lineTo(ep1.x,ep1.y);ctx2.stroke();}
  if(ep2){ctx2.beginPath();ctx2.moveTo(camX,camY);ctx2.lineTo(ep2.x,ep2.y);ctx2.stroke();}
  ctx2.setLineDash([]);
  // Main axis ray
  if(mainRay){
    ctx2.strokeStyle='rgba(59,130,246,.85)'; ctx2.lineWidth=1.5;
    ctx2.beginPath(); ctx2.moveTo(camX,camY); ctx2.lineTo(mainRay.x,mainRay.y); ctx2.stroke();
  }

  // ── Tilt angle arc ──
  var arcR=22;
  ctx2.strokeStyle='rgba(245,158,11,.7)'; ctx2.lineWidth=1.5;
  ctx2.beginPath(); ctx2.arc(camX,camY,arcR, 0, tiltRad); ctx2.stroke();
  ctx2.fillStyle='rgba(245,158,11,.9)'; ctx2.font='bold 8px monospace'; ctx2.textAlign='left'; ctx2.textBaseline='middle';
  var _midA=tiltRad/2;
  ctx2.fillText(tilt+'°', camX+Math.cos(_midA)*(arcR+8), camY+Math.sin(_midA)*(arcR+8));

  // ── Camera icon ──
  ctx2.fillStyle='#3b82f6'; ctx2.strokeStyle='rgba(255,255,255,.9)'; ctx2.lineWidth=1.5;
  ctx2.beginPath(); ctx2.arc(camX,camY,6,0,Math.PI*2); ctx2.fill(); ctx2.stroke();
  // Lens dot
  ctx2.fillStyle='rgba(255,255,255,.9)';
  ctx2.beginPath(); ctx2.arc(camX,camY,2.5,0,Math.PI*2); ctx2.fill();

  // ── Blind spot marker & label ──
  ctx2.fillStyle='rgba(168,85,247,.95)';
  ctx2.beginPath(); ctx2.arc(wallX+blindPx, groundY, 4, 0, Math.PI*2); ctx2.fill();
  // Blind dist label
  ctx2.fillStyle='#a855f7'; ctx2.font='bold 9px monospace'; ctx2.textAlign='center'; ctx2.textBaseline='bottom';
  ctx2.fillText(blindDist.toFixed(1)+'m', wallX+blindPx/2, groundY-8);
  // Purple arrow on ground
  ctx2.strokeStyle='rgba(168,85,247,.7)'; ctx2.lineWidth=1.5; ctx2.setLineDash([4,3]);
  ctx2.beginPath(); ctx2.moveTo(wallX,groundY+10); ctx2.lineTo(wallX+blindPx,groundY+10); ctx2.stroke();
  ctx2.setLineDash([]);

  // ── Reach marker & label ──
  if(reach){
    var reachPx=Math.min(reach*scaleX, areaW);
    ctx2.fillStyle='rgba(16,185,129,.9)';
    ctx2.beginPath(); ctx2.arc(wallX+reachPx, groundY, 4, 0, Math.PI*2); ctx2.fill();
    ctx2.fillStyle='#10b981'; ctx2.font='bold 9px monospace'; ctx2.textAlign='center'; ctx2.textBaseline='bottom';
    ctx2.fillText(reach.toFixed(1)+'m', wallX+reachPx, groundY-8);
  }

  // ── Ground labels ──
  ctx2.fillStyle='rgba(255,255,255,.2)'; ctx2.font='8px monospace'; ctx2.textAlign='center'; ctx2.textBaseline='top';
  for(var gx2=1; gx2<=Math.ceil(maxX); gx2++){
    var gxPx2=wallX+gx2*scaleX; if(gxPx2>W-padR+5) break;
    ctx2.fillText(gx2+'m', gxPx2, groundY+4);
  }
}
function updOptics(value){
  var p=fP(S.selId),d=p&&gD(p.libId);if(!d)return;
  updP('lens',typeof SIGSLensModel!=='undefined'?SIGSLensModel.fromControl(value,d):value);
}
function updP(key,val){
  var pc=fP(S.selId); if(!pc)return; var dev=gD(pc.libId);
  if(key==='label')pc.label=val;
  else if(key==='rotation'){pc.rotation=((+val)%360+360)%360;document.getElementById('prot').value=pc.rotation;}
  else if(key==='color')pc.color=val;
  else if(key==='opacity'){pc.opacity=val;document.getElementById('popav').textContent=Math.round(val*100)+'%';}
  else if(key==='visible')pc.visible=val;
  else if(key==='lens'&&MOD==='cctv'){if(!Number.isFinite(val)||val<=0)return;if(typeof SIGSLensModel!=='undefined'){if(!SIGSLensModel.policy(dev).adjustable)return;val=SIGSLensModel.effective({lens:val},dev);}pc.lens=val;document.getElementById('plensv').textContent=typeof SIGSLensModel!=='undefined'?SIGSLensModel.valueLabel(pc,dev):val.toFixed(1)+'mm';if(dev){var ef=lFOV(dev.fov,val,typeof SIGSLensModel!=='undefined'?SIGSLensModel.policy(dev).base:undefined,dev),er=lRange(dev.range,val);document.getElementById('pinfo').textContent='FOV: '+ef.toFixed(0)+'°  Alcance: '+er.toFixed(0)+' m';document.getElementById('plensinfo').textContent='FOV: '+ef.toFixed(0)+'°  |  Alcance: '+er.toFixed(0)+' m\n'+(typeof SIGSLensModel!=='undefined'?SIGSLensModel.policy(dev).label:lDesc(val));updateDoriPanel(dev,val);_calcBlindSpot(pc.instHeight||3,pc.instTilt!==undefined?pc.instTilt:30);}}
  else if(key==='arange'){pc.arange=val;if(dev)document.getElementById('pinfo').textContent=(dev.desc||'')+'  |  Zona '+(pc.zone||1);}
  else if(key==='afov')pc.afov=val;
  else if(key==='zone'){pc.zone=val;if(dev)document.getElementById('pinfo').textContent=(dev.desc||'')+'  |  Zona '+val;}
  render();
}
function delSel(){
  var ids=S.multiSel.length>1?S.multiSel:(S.selId?[S.selId]:[]);
  if(!ids.length)return;
  pushUndo();
  S.placed=S.placed.filter(function(p){return ids.indexOf(p.id)<0;});
  deselect();render();updateStats();
  notify('🗑 '+ids.length+' dispositivo(s) removido(s)');
}
function dupSel(){
  var ids=S.multiSel.length>1?S.multiSel:(S.selId?[S.selId]:[]);
  if(!ids.length)return;
  pushUndo();
  var lastId=null;
  ids.forEach(function(id){
    var pc=fP(id);if(!pc)return;
    var cl=JSON.parse(JSON.stringify(pc));cl.id=uid();cl.x+=30;cl.y+=30;
    var m=pc.label.match(/^([A-Z]+)/);var pre=m?m[1]:'DEV';var n=nextNum(pre);
    cl.label=pre+(n<10?'0':'')+n;S.placed.push(cl);lastId=cl.id;
  });
  if(lastId)select(lastId);render();updateStats();
  notify('⧉ '+ids.length+' dispositivo(s) duplicado(s)');
}
function ctxR(d){updP('rotation',d);}
function clearDevs(){if(!confirm('Remover todos?'))return;pushUndo();S.placed=[];deselect();render();updateStats();}

// ════════════════════════════════════════
// DEVICE LIBRARY LIST
// ════════════════════════════════════════
// Family open/closed state
var _libFamilyOpen = {cctv:false, hikvision:false, dahua:false, uniview:false, radar:false, thermal:false, custom:false};

function _makeDevItem(dev){
  var d=document.createElement('div');
  var isSel=S.activeLib&&S.activeLib.id===dev.id;
  d.className='di'+(isSel?(MOD==='alarm'?' sel-r':' sel'):'');
  var typeLabel={dome:'Dome',bullet:'Bullet',ptz:'Speed Dome',fisheye:'Fisheye',turret:'Turret',radar:'Radar Perimetral',thermal_bi:'Térmica Bi-Spectrum'}[dev.type]||dev.type;
  var meta;
  if(dev.type==='radar'){
    meta='Radar · '+dev.radarFov+'° · '+dev.radarRange+'m';
  } else if(dev.type==='thermal_bi'){
    meta='<span style="color:#ef4444">🌡'+dev.thermalRange+'m</span> <span style="color:#3b82f6">📷'+dev.visibleRange+'m</span>';
  } else if(MOD==='cctv'){
    meta=dev.name+' · '+dev.fov+'° · '+dev.range+'m';
  } else {
    meta=dev.desc||dev.type;
  }
  var iconHtml;
  var imgSrc=dev.photoURL||dev.imgUrl||(dev.imgKey&&AX_IMG[dev.imgKey]?AX_IMG[dev.imgKey]:null);
  if(imgSrc){
    iconHtml='<div class="dico sigs-product-photo" style="background:#fff;border:1px solid '+hr(dev.color,.3)+';overflow:hidden;padding:1px">'
      +'<img src="'+imgSrc+'" style="width:28px;height:28px;object-fit:contain;display:block;margin:auto" onerror="this.parentNode.innerHTML=\'<span style=font-size:16px>'+dev.icon+'</span>\'">'
      +'</div>';
  } else if(dev.type==='radar'){
    iconHtml='<div class="dico" style="background:rgba(16,185,129,.13);border:1px solid rgba(16,185,129,.35);display:flex;align-items:center;justify-content:center;font-size:16px">📡</div>';
  } else if(dev.type==='thermal_bi'){
    iconHtml='<div class="dico" style="background:linear-gradient(135deg,rgba(239,68,68,.2),rgba(59,130,246,.2));border:1px solid rgba(239,68,68,.35);display:flex;align-items:center;justify-content:center;font-size:16px">🌡</div>';
  } else {
    var em=dev.icon||'📦';
    iconHtml='<div class="dico" style="background:'+hr(dev.color,.13)+';border:1px solid '+hr(dev.color,.3)+'">'+em+'</div>';
  }
  var _camType=['dome','bullet','ptz','fisheye','turret'].indexOf(dev.type)>=0;
  var _titleTxt=(MOD==='cctv'&&_camType&&dev.model)?dev.model:dev.name;
  d.innerHTML=iconHtml
    +'<div class="din"><div class="dname">'+_titleTxt+'</div><div class="dmeta">'+meta+'</div></div>'
    +(dev.custom?'<span style="font-size:8px;padding:1px 4px;border-radius:3px;background:rgba(240,160,0,.12);color:#f0a000;border:1px solid rgba(240,160,0,.25)">+</span>':'');
  if(MOD==='cctv'&&_camType&&typeof SIGSLensModel!=='undefined'){
    var lensLabel=document.createElement('div');lensLabel.className='dmeta sigs-lens-label';
    lensLabel.textContent=SIGSLensModel.policy(dev).label;
    d.querySelector('.din').appendChild(lensLabel);
  }
  d.onclick=function(e){e.stopPropagation();sLib(dev);};
  d.ondblclick=function(e){
    e.stopPropagation();
    var family=S.placed.filter(function(p){var d2=gD(p.libId); return d2&&d2.type===dev.type;});
    if(!family.length){notify('Nenhum dispositivo deste tipo na planta');return;}
    S.multiSel=family.map(function(p){return p.id;});
    S.selId=S.multiSel[S.multiSel.length-1];
    updateMultiSelPanel(); tab('props'); render();
    notify('Família '+typeLabel+' — '+family.length+' selecionados');
  };
  d.oncontextmenu=function(e){e.preventDefault();e.stopPropagation();openCtxLib(dev,e);};
  return d;
}

function renderDevList(){
  var el=document.getElementById('dlist'); el.innerHTML='';
  if(MOD!=='cctv'){
    // Módulos Ajax (intrusão / incêndio): agrupar por família
    var axFamilies = MOD==='fire' ? [
      {key:'fr_cen', label:'Centrais', icon:'🧯', cls:'lib-family-cctv',    filter:function(d){return d.cat==='central';}},
      {key:'fr_bat', label:'Bateria',  icon:'🔋', cls:'lib-family-thermal', filter:function(d){return d.cat==='bateria';}},
      {key:'fr_det', label:'Detetores',icon:'🔥', cls:'lib-family-radar',   filter:function(d){return d.cat==='detetor';}},
      {key:'fr_sir', label:'Sirenes',  icon:'🔔', cls:'lib-family-custom',  filter:function(d){return d.cat==='sirene';}}
    ] : [
      {key:'ax_int', label:'Detetores Interiores', icon:'🏠', cls:'lib-family-cctv',    filter:function(d){return d.cat==='int';}},
      {key:'ax_ext', label:'Detetores Exteriores', icon:'🌳', cls:'lib-family-radar',   filter:function(d){return d.cat==='ext';}},
      {key:'ax_acc', label:'Acessórios',           icon:'🧩', cls:'lib-family-thermal', filter:function(d){return d.cat==='acc'||!d.cat;}}
    ];
    axFamilies.forEach(function(fam){
      var devs=S.lib.filter(fam.filter);
      if(!devs.length) return;
      var hdr=document.createElement('div');
      hdr.className='lib-family-header '+fam.cls;
      var isOpen=_libFamilyOpen[fam.key]!==false;
      hdr.innerHTML='<span class="lib-family-arrow'+(isOpen?' open':'')+'">▶</span>'
        +'<span style="font-size:13px">'+fam.icon+'</span>'
        +'<span class="lib-family-name">'+fam.label+'</span>'
        +'<span class="lib-family-count">'+devs.length+'</span>';
      var body=document.createElement('div');
      body.className='lib-family-body'+(isOpen?'':' collapsed');
      body.style.maxHeight=isOpen?'6000px':'0px';
      devs.forEach(function(dev){body.appendChild(_makeDevItem(dev));});
      hdr.onclick=function(){
        var open=_libFamilyOpen[fam.key]!==false;
        _libFamilyOpen[fam.key]=!open;
        var arrow=hdr.querySelector('.lib-family-arrow');
        if(!open){arrow.classList.add('open');body.classList.remove('collapsed');body.style.maxHeight='6000px';}
        else{arrow.classList.remove('open');body.style.maxHeight='0px';body.classList.add('collapsed');}
      };
      el.appendChild(hdr);
      el.appendChild(body);
    });
    return;
  }
  // CCTV module: group by family
  var families=[
    {key:'cctv',    label:'Câmaras CCTV',          icon:'📹', cls:'lib-family-cctv',    filter:function(d){return !d.brand&&(d.family==='cctv'||(!d.family&&['dome','bullet','ptz','fisheye','turret'].indexOf(d.type)>=0));}},
    {key:'hikvision',label:'Hikvision', icon:'🔴', cls:'lib-family-hik',     filter:function(d){return d.brand==='hikvision';}},
    {key:'dahua',   label:'Dahua · 30 +vendidas',  icon:'🟠', cls:'lib-family-dahua',   filter:function(d){return d.brand==='dahua';}},
    {key:'uniview', label:'Uniview', icon:'🔵', cls:'lib-family-uniview', filter:function(d){return d.brand==='uniview';}},
    {key:'radar',   label:'Radares Perimetrais',    icon:'📡', cls:'lib-family-radar',   filter:function(d){return d.family==='radar'||d.type==='radar';}},
    {key:'thermal', label:'Térmicas Bi-Spectrum',   icon:'🌡', cls:'lib-family-thermal', filter:function(d){return d.family==='thermal'||d.type==='thermal_bi';}},
    {key:'custom',  label:'Personalizadas',         icon:'⚙',  cls:'lib-family-custom',  filter:function(d){return d.custom&&d.family!=='cctv'&&d.family!=='radar'&&d.family!=='thermal';}}
  ];
  families.forEach(function(fam){
    var devs=S.lib.filter(fam.filter);
    if(!devs.length) return;
    // Header
    var hdr=document.createElement('div');
    hdr.className='lib-family-header '+fam.cls;
    var isOpen=_libFamilyOpen[fam.key]!==false;
    hdr.innerHTML='<span class="lib-family-arrow'+(isOpen?' open':'')+'">▶</span>'
      +'<span style="font-size:13px">'+fam.icon+'</span>'
      +'<span class="lib-family-name">'+fam.label+'</span>'
      +'<span class="lib-family-count">'+devs.length+'</span>';
    // Body
    var body=document.createElement('div');
    body.className='lib-family-body'+(isOpen?'':' collapsed');
    body.style.maxHeight=isOpen?'6000px':'0px';
    devs.forEach(function(dev){body.appendChild(_makeDevItem(dev));});
    // Toggle
    hdr.onclick=function(){
      var open=_libFamilyOpen[fam.key]!==false;
      _libFamilyOpen[fam.key]=!open;
      var arrow=hdr.querySelector('.lib-family-arrow');
      if(!open){arrow.classList.add('open');body.classList.remove('collapsed');body.style.maxHeight='6000px';}
      else{arrow.classList.remove('open');body.style.maxHeight='0px';body.classList.add('collapsed');}
    };
    el.appendChild(hdr);
    el.appendChild(body);
  });
}
function sLib(dev){
  S.activeLib=dev;
  document.getElementById('pbtn').disabled=false;
  renderDevList();
  // Single click = enter place mode immediately
  setTool('place');
}
var _mcPhotoURL = null; // temp storage while modal open

function mcLoadPhoto(e){
  var file=e.target.files[0]; if(!file)return;
  var r=new FileReader();
  r.onload=function(ev){
    _mcPhotoURL=ev.target.result;
    var prev=document.getElementById('mc-photo-prev');
    prev.innerHTML='<img src="'+ev.target.result+'" style="width:68px;height:68px;object-fit:contain;border-radius:7px">';
    var clrBtn=document.getElementById('mc-photo-clear-btn');
    if(clrBtn) clrBtn.style.display='';
  };
  r.readAsDataURL(file);
  e.target.value='';
}
function mcClearPhoto(){
  _mcPhotoURL=null;
  document.getElementById('mc-photo-prev').innerHTML='📷';
  var clrBtn=document.getElementById('mc-photo-clear-btn');
  if(clrBtn) clrBtn.style.display='none';
}

function openAddDevice(){
  S.editId=null; _mcPhotoURL=null;
  document.getElementById('m-dev-h').textContent='Nova '+(MOD==='cctv'?'Câmara CCTV':'Dispositivo');
  document.getElementById('mc-name').value=''; document.getElementById('mc-model').value='';
  document.getElementById('mc-color').value=MOD==='cctv'?'#3b82f6':'#00aaff';
  document.getElementById('mc-cctv').style.display=MOD==='cctv'?'':'none';
  document.getElementById('mc-alarm').style.display=MOD==='alarm'?'':'none';
  var photoRow=document.getElementById('mc-photo-row');
  if(photoRow){
    photoRow.style.display=''; // always show for both modes
    var photoLabel=photoRow.querySelector('.stl');
    if(photoLabel) photoLabel.textContent=(MOD==='cctv'?'📷 Foto da Câmara':'📷 Foto do Produto');
  }
  document.getElementById('mc-photo-prev').innerHTML='📷';
  openM('m-dev');
}

// Library list right-click menu
var _ctxLibDev=null;
function openCtxLib(dev,e){
  _ctxLibDev=dev;
  document.getElementById('ctx-lib-name').textContent=dev.name+(dev.model?' — '+dev.model:'');
  var m=document.getElementById('ctx-lib');
  m.style.left=e.clientX+'px'; m.style.top=e.clientY+'px'; m.style.display='block';
}
function ctxLibEdit(){
  if(!_ctxLibDev)return;
  document.getElementById('ctx-lib').style.display='none';
  openEditDevice(_ctxLibDev);
}
function ctxLibDup(){
  if(!_ctxLibDev)return;
  document.getElementById('ctx-lib').style.display='none';
  var cl=JSON.parse(JSON.stringify(_ctxLibDev));
  cl.id=uid(); cl.name=cl.name+' (cópia)'; cl.custom=true;
  S.lib.push(cl); persistLib(); renderDevList(); notify('"'+cl.name+'" duplicado');
}
function ctxLibDel(){
  if(!_ctxLibDev)return;
  document.getElementById('ctx-lib').style.display='none';
  if(!confirm('Remover "'+_ctxLibDev.name+'" da biblioteca?'))return;
  S.lib=S.lib.filter(function(d){return d.id!==_ctxLibDev.id;});
  if(S.activeLib&&S.activeLib.id===_ctxLibDev.id){S.activeLib=null;document.getElementById('pbtn').disabled=true;}
  _ctxLibDev=null; persistLib(); renderDevList(); notify('Removido da biblioteca');
}

// Open edit modal prefilled with existing device data
function openEditDevice(dev){
  S.editId=dev.id; _mcPhotoURL=dev.photoURL||null;
  document.getElementById('m-dev-h').textContent='Editar — '+dev.name;
  document.getElementById('mc-name').value=dev.name||'';
  document.getElementById('mc-model').value=dev.model||'';
  document.getElementById('mc-color').value=dev.color||'#00aaff';
  document.getElementById('mc-cctv').style.display=MOD==='cctv'?'':'none';
  document.getElementById('mc-alarm').style.display=MOD==='alarm'?'':'none';
  var photoRow=document.getElementById('mc-photo-row');
  if(photoRow) photoRow.style.display='';
  var prev=document.getElementById('mc-photo-prev');
  if(prev) prev.innerHTML=dev.photoURL?'<img src="'+dev.photoURL+'" style="width:68px;height:68px;object-fit:contain;border-radius:7px">':'📷';
  var clrBtn=document.getElementById('mc-photo-clear-btn');
  if(clrBtn) clrBtn.style.display=dev.photoURL?'':'none';
  var typeEl=document.getElementById('mc-type');
  for(var i=0;i<typeEl.options.length;i++){if(typeEl.options[i].value===dev.type){typeEl.selectedIndex=i;break;}}
  if(MOD==='cctv'){
    document.getElementById('mc-fov').value=dev.fov||90;
    document.getElementById('mc-range').value=dev.range||20;
    document.getElementById('mc-height').value=dev.height||3;
  } else {
    document.getElementById('mc-afov').value=dev.fov||90;
    document.getElementById('mc-arange').value=dev.range||10;
  }
  openM('m-dev');
}
// ── Custom device library persistence ──
function persistLib(){
  // Save only custom devices for the current module
  var customs = S.lib.filter(function(d){ return d.custom; });
  try{ localStorage.setItem('sigs_lib_'+MOD, JSON.stringify(customs)); }catch(e){}
}
function loadCustomLib(mod){
  try{ return JSON.parse(localStorage.getItem('sigs_lib_'+mod)||'[]'); }catch(e){ return []; }
}

function saveDevice(){
  var name=document.getElementById('mc-name').value.trim(); if(!name){alert('Nome obrigatório');return;}
  var dev={id:S.editId||uid(),name:name,model:document.getElementById('mc-model').value.trim(),type:document.getElementById('mc-type').value,color:document.getElementById('mc-color').value,custom:true};
  if(_mcPhotoURL) dev.photoURL=_mcPhotoURL;
  if(MOD==='cctv'){
    dev.fov=+document.getElementById('mc-fov').value;
    dev.range=+document.getElementById('mc-range').value;
    dev.height=+document.getElementById('mc-height').value;
    dev.dori=autoDori(dev.fov,dev.range);
  } else {
    dev.fov=+document.getElementById('mc-afov').value;
    dev.range=+document.getElementById('mc-arange').value;
    dev.height=2;
    dev.desc=(dev.name+(dev.range>0?' · '+dev.range+'m':''));
  }
  if(S.editId){var idx=S.lib.findIndex(function(d){return d.id===S.editId;});if(idx>=0)S.lib[idx]=dev;}else S.lib.push(dev);
  _mcPhotoURL=null;
  persistLib();
  _preloadDevPhoto(dev);
  closeM('m-dev'); renderDevList(); notify('"'+dev.name+'" guardado');
}

function _preloadDevPhoto(dev){
  var key='__photo__'+dev.id;
  if(AX_LOADED[key]) return;
  var src = dev.photoURL || dev.imgUrl; if(!src) return;
  // Try with crossOrigin first (needed for canvas drawImage)
  var img=new Image();
  img.crossOrigin='anonymous';
  img.onload=function(){ AX_LOADED[key]=img; render(); };
  img.onerror=function(){
    // CORS blocked — load without crossOrigin (works for <img> in sidebar only)
    var img2=new Image();
    img2.onload=function(){ AX_LOADED[key]=img2; };
    img2.src=src;
  };
  img.src=src;
}
// Preload photos for all lib entries on startup
function _preloadAllPhotos(){
  S.lib.forEach(function(dev){ _preloadDevPhoto(dev); });
}

// ════════════════════════════════════════
// FLOOR PLAN
// ════════════════════════════════════════
function importFP(){document.getElementById('fi-fp').click();}
function doImportFP(e){
  var file=e.target.files[0]; if(!file)return;
  var reader=new FileReader();
  reader.onload=function(ev){
    var dataURL=ev.target.result;
    var img=new Image();
    img.onload=function(){
      var iw=img.naturalWidth||800, ih=img.naturalHeight||600;
      var sc=Math.min(1,(cv.width*.88/S.zoom)/iw,(cv.height*.88/S.zoom)/ih);
      var fw=Math.round(iw*sc), fh=Math.round(ih*sc);
      S.fp={img:img,imgData:dataURL,x:-fw/2,y:-fh/2,w:fw,h:fh,opa:1.0,locked:true};
      sigsSetPlantLocked(true);fitView(); notify('Planta: '+file.name+' ('+iw+'×'+ih+'px)'); updateStats();
    };
    img.onerror=function(){notify('Erro ao carregar imagem');};
    img.src=dataURL;
  };
  reader.readAsDataURL(file); e.target.value='';
}
function setFPopa(v){if(S.fp){S.fp.opa=v;render();}}

// ════════════════════════════════════════
// LEAFLET MAP — OpenStreetMap + Satellite
// ════════════════════════════════════════
function toggleMap(){if(S.mapOpen)closeMap();else openMap();}
function _applyMapLock(){
  if(!S.lmap) return;
  var locked = S.mapLocked;
  // Leaflet interaction handlers
  if(locked){
    S.lmap.dragging.disable();
    S.lmap.scrollWheelZoom.disable();
    S.lmap.doubleClickZoom.disable();
    S.lmap.touchZoom.disable();
    S.lmap.keyboard.disable();
    S.lmap.boxZoom.disable();
  } else {
    S.lmap.dragging.enable();
    S.lmap.scrollWheelZoom.enable();
    S.lmap.doubleClickZoom.enable();
    S.lmap.touchZoom.enable();
    S.lmap.keyboard.enable();
    S.lmap.boxZoom.enable();
  }
  // CSS pointer-events on the tile pane as extra lock
  var tp = document.querySelector('.leaflet-tile-pane');
  if(tp) tp.style.pointerEvents = locked ? 'none' : '';
  var ip = document.querySelector('.leaflet-interactive, .leaflet-control-zoom');
  var ctrls = document.querySelectorAll('.leaflet-control-zoom a, .leaflet-control-layers');
  ctrls.forEach(function(el){ el.style.pointerEvents = locked ? 'none' : ''; });
  // Update button
  var btn = document.getElementById('maplockbtn');
  if(btn){
    btn.textContent = locked ? '🔒 Planta bloqueada' : '🔓 Bloquear planta';
    btn.style.background = locked ? 'rgba(245,158,11,.25)' : '';
    btn.style.fontWeight  = locked ? '700' : '';
  }
}


// ─────────────────────────── Google Maps (opcional) ───────────────────────────
// Usa a Google Maps JavaScript API (requer chave própria + faturação ativa no
// Google Cloud; há um nível gratuito mensal). A chave fica guardada localmente.
function _getGmapsKey(){ try{ return localStorage.getItem('sigs_gmaps_key')||''; }catch(e){ return ''; } }
function setGoogleMapKey(){
  var cur=_getGmapsKey();
  var k=prompt('Cola a tua chave da Google Maps API\n(no Google Cloud: ativar "Maps JavaScript API").\nDeixa vazio para remover.', cur);
  if(k===null) return;
  k=(k||'').trim();
  try{ if(k) localStorage.setItem('sigs_gmaps_key',k); else localStorage.removeItem('sigs_gmaps_key'); }catch(e){}
  if(!k){ notify('Chave Google removida. Recarrega a página para limpar as camadas.'); return; }
  if(!S.mapOpen) openMap();
  _addGoogleLayers(true);
}
var _gmapsLoading=false, _gmapsReady=false;
function _loadGoogleMaps(key, cb){
  if(_gmapsReady){ cb&&cb(true); return; }
  if(_gmapsLoading){ return; }
  _gmapsLoading=true;
  var s=document.createElement('script');
  s.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(key)+'&v=quarterly';
  s.async=true; s.defer=true;
  s.onload=function(){ _gmapsReady=true; _gmapsLoading=false; cb&&cb(true); };
  s.onerror=function(){ _gmapsLoading=false; notify('Falha ao carregar a Google Maps API (verifica a chave e a faturação).'); cb&&cb(false); };
  document.head.appendChild(s);
}
function _addGoogleLayers(announce){
  var key=_getGmapsKey();
  if(!key){ if(announce) setGoogleMapKey(); return; }
  if(!S.lmap || !S.layerControl) return;
  if(S._googleAdded){ if(announce) notify('Camadas Google já estão no seletor (canto superior direito).'); return; }
  _loadGoogleMaps(key, function(ok){
    if(!ok) return;
    if(!window.L || !L.gridLayer || !L.gridLayer.googleMutant){ notify('Plugin Google indisponível.'); return; }
    try{
      var gRoad=L.gridLayer.googleMutant({type:'roadmap'});
      var gSat =L.gridLayer.googleMutant({type:'satellite'});
      var gHyb =L.gridLayer.googleMutant({type:'hybrid'});
      S.layerControl.addBaseLayer(gRoad,'🟢 Google Mapa');
      S.layerControl.addBaseLayer(gSat ,'🟢 Google Satélite');
      S.layerControl.addBaseLayer(gHyb ,'🟢 Google Híbrido');
      S._googleAdded=true;
      S.mapBaseLayers=(S.mapBaseLayers||[]).concat([gRoad,gSat,gHyb]);
      S.satelliteLayer=gSat;
      _showSatelliteMap();
      var b=document.getElementById('gmapsbtn'); if(b){ b.style.color='var(--ok,#10b981)'; b.textContent='🟢 Google ✓'; }
      if(announce) notify('Google Maps ativo — escolhe a camada no seletor (canto sup. direito).');
    }catch(e){ notify('Erro ao criar camadas Google: '+e.message); }
  });
}

function _showSatelliteMap(){
  if(!S.lmap||!S.satelliteLayer)return;
  (S.mapBaseLayers||[]).forEach(function(layer){if(layer!==S.satelliteLayer&&S.lmap.hasLayer(layer))S.lmap.removeLayer(layer);});
  if(!S.lmap.hasLayer(S.satelliteLayer))S.satelliteLayer.addTo(S.lmap);
}

function openMap(){
  S.mapOpen=true;
  var mw=document.getElementById('mapwrap');
  mw.classList.add('show');
  document.getElementById('mapbtn').classList.add('on');
  document.getElementById('mapbtn').textContent='✕ Fechar Mapa';
  if(!S.lmapInited){
    S.lmapInited=true;
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        var mapDiv=document.getElementById('leafmap');
        S.lmap=L.map(mapDiv,{zoomControl:true,attributionControl:true}).setView([38.7166,-9.1392],14);
        var osm=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'});
        var sat=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'© Esri World Imagery'});
        var hybrid=L.layerGroup([
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19}),
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:19})
        ]);
        S.mapBaseLayers=[osm,sat,hybrid];
        S.satelliteLayer=sat;
        _showSatelliteMap();
        S.layerControl=L.control.layers({'🗺 Mapa':osm,'🛰 Satélite':sat,'🛰+Nomes':hybrid},{},{position:'topright'}).addTo(S.lmap);
        _addGoogleLayers(false); // adiciona camadas Google se já houver chave guardada
        // Re-apply lock state after init
        setTimeout(function(){ _applyMapLock(); }, 200);
      });
    });
  } else if(S.lmap){
    _showSatelliteMap();
    setTimeout(function(){
      S.lmap.invalidateSize();
      _applyMapLock(); // re-apply every time map opens
    },120);
  }
}
function closeMap(){
  S.mapOpen=false;
  document.getElementById('mapwrap').classList.remove('show');
  document.getElementById('mapbtn').classList.remove('on');
  document.getElementById('mapbtn').textContent='🌍 Mapa';
}
function sigsSetPlantLocked(locked){
  S.mapLocked=!!locked;
  if(S.fp)S.fp.locked=!!locked;
  var cb=document.getElementById('fplock');if(cb)cb.checked=!!locked;
  var lb=document.getElementById('maplockbtn');
  if(lb){lb.style.display=S.fp?'':'none';lb.textContent=locked?'🔒 Planta bloqueada':'🔓 Bloquear planta';lb.style.background=locked?'rgba(16,185,129,.12)':'rgba(245,158,11,.1)';}
  _applyMapLock();
}
function toggleMapLock(){
  sigsSetPlantLocked(!S.mapLocked);
  notify(S.mapLocked?'🔒 Planta bloqueada':'🔓 Planta desbloqueada');
}
function doSearch(){
  var q=document.getElementById('mapsrch').value.trim(); if(!q)return;
  if(!S.lmap){notify('Mapa ainda a carregar, aguarde...');return;}
  notify('A pesquisar...');
  fetch('https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(q)+'&limit=1',{headers:{'Accept-Language':'pt'}})
    .then(function(r){return r.json();})
    .then(function(data){
      if(data&&data.length>0){
        var lat=+data[0].lat, lng=+data[0].lon;
        S.lmap.setView([lat,lng],17);
        L.marker([lat,lng]).addTo(S.lmap).bindPopup('<b>'+data[0].display_name.split(',')[0]+'</b><br><small>'+data[0].display_name+'</small>').openPopup();
        notify('✓ '+data[0].display_name.slice(0,60));
      } else notify('Local não encontrado: '+q);
    }).catch(function(err){notify('Erro de ligação na pesquisa');});
}
document.getElementById('mapsrch').addEventListener('keydown',function(e){if(e.key==='Enter')doSearch();});

function captureMapTiles(){
  if(!S.lmap){notify('Mapa não disponível');return;}
  var mapDiv=document.getElementById('leafmap');
  var W=mapDiv.clientWidth, H=mapDiv.clientHeight;
  if(!W||!H){notify('Abre o mapa antes de capturar.');return;}
  // Calculate scale BEFORE capture: Leaflet metersPerPixel formula
  var zoom=S.lmap.getZoom();
  var lat=S.lmap.getCenter().lat;
  // Web Mercator: metersPerPixel = (156543.03392 * cos(lat*PI/180)) / 2^zoom
  var mpp=156543.03392*Math.cos(lat*Math.PI/180)/Math.pow(2,zoom);
  // At screen resolution (96dpi default): 1 CSS pixel = 1 device pixel at zoom=1
  var ppm=1/mpp; // pixels per meter in world coords
  var offcan=document.createElement('canvas'); offcan.width=W; offcan.height=H;
  var octx=offcan.getContext('2d');
  octx.fillStyle='#1a2a3a'; octx.fillRect(0,0,W,H);
  var tiles=mapDiv.querySelectorAll('img.leaflet-tile');
  if(tiles.length===0){notify('Aguarde os tiles do mapa carregarem');return;}
  var loaded=0, drawn=0, total=tiles.length;
  tiles.forEach(function(tile){
    if(!tile.complete||tile.naturalWidth===0){loaded++;if(loaded===total)finishCapture();return;}
    var proxy=new Image(); proxy.crossOrigin='anonymous';
    proxy.onload=function(){
      var rect=tile.getBoundingClientRect(), mRect=mapDiv.getBoundingClientRect();
      var px=rect.left-mRect.left, py=rect.top-mRect.top;
      if(rect.width>0&&rect.height>0){octx.drawImage(proxy,px,py,rect.width,rect.height);drawn++;}
      loaded++;if(loaded===total)finishCapture();
    };
    proxy.onerror=function(){loaded++;if(loaded===total)finishCapture();};
    proxy.src=tile.src;
  });
  function finishCapture(){
    if(!drawn){notify('Não foi possível capturar o mapa. Aguarda o carregamento ou tenta outra camada.');return;}
    var dataURL;
    try{ dataURL=offcan.toDataURL('image/jpeg',0.85); }catch(e){ dataURL=null; }
    var img=new Image();
    img.onload=function(){
      S.fp={img:img,imgData:dataURL,x:-img.width/2,y:-img.height/2,w:img.width,h:img.height,opa:1.0,locked:true};
      S.scale={ok:true,ppm:ppm,mpp:mpp};
      document.getElementById('scbadge').textContent=ppm.toFixed(2)+' px/m';
      // Show lock button now that we have a captured map
      var lb=document.getElementById('maplockbtn');
      sigsSetPlantLocked(true);
      closeMap(); fitView();
      notify('Mapa capturado e planta bloqueada. Escala automática: '+ppm.toFixed(2)+' px/m');
      updateStats();
      if(drawn<total)notify('Captura parcial: verifica a planta antes de continuar.');
    };
    img.onerror=function(){notify('Não foi possível gerar a planta do mapa. Tenta outra camada.');};
    dataURL=dataURL||(function(){try{return offcan.toDataURL('image/png');}catch(e){return '';}})();
    if(!dataURL){notify('Não foi possível gerar a planta do mapa. Tenta outra camada.');return;}
    img.src=dataURL;
  }
}

// ════════════════════════════════════════
// LAYERS
// ════════════════════════════════════════
function togL(n){
  S.layers[n]=S.layers[n]?0:1;
  var el=document.getElementById('l-'+n);
  if(el){el.classList.toggle('on',!!S.layers[n]);el.textContent=S.layers[n]?'✓':'';}
  render();
}
function fitView(){
  if(S.fp){var fp=S.fp,sx=(cv.width*.88)/fp.w,sy=(cv.height*.88)/fp.h;S.zoom=Math.min(sx,sy);S.pan.x=-(fp.x+fp.w/2)*S.zoom;S.pan.y=-(fp.y+fp.h/2)*S.zoom;}
  else if(S.placed.length){
    var xs=S.placed.map(function(p){return p.x;}),ys=S.placed.map(function(p){return p.y;});
    var minX=Math.min.apply(null,xs),maxX=Math.max.apply(null,xs);
    var minY=Math.min.apply(null,ys),maxY=Math.max.apply(null,ys);
    var pw=Math.max(maxX-minX,100),ph=Math.max(maxY-minY,100);
    S.zoom=Math.min((cv.width*.8)/pw,(cv.height*.8)/ph,4);
    S.pan.x=-((minX+maxX)/2)*S.zoom; S.pan.y=-((minY+maxY)/2)*S.zoom;
  } else{S.zoom=1;S.pan={x:0,y:0};}
  document.getElementById('zpill').textContent=Math.round(S.zoom*100)+'%'; render();
}
function clearMeas(){S.meas=[];render();updateStats();}
function exportPNG(){render();var a=document.createElement('a');a.download='projeto.png';a.href=cv.toDataURL('image/png');a.click();notify('PNG exportado!');}

// ════════════════════════════════════════
// LOGO
// ════════════════════════════════════════
function doLoadLogo(e){var file=e.target.files[0];if(!file)return;var r=new FileReader();r.onload=function(ev){S.logoURL=ev.target.result;document.getElementById('logo-prev').innerHTML='<img src="'+ev.target.result+'" style="max-width:100%;max-height:100%;object-fit:contain">';notify('Logo carregado!');};r.readAsDataURL(file);e.target.value='';}
function clearLogo(){S.logoURL=null;document.getElementById('logo-prev').innerHTML='Sem<br>logo';}

// ════════════════════════════════════════
// PRINT — CORRECT: hide entire #app, show only #printdoc
// The key was making #app use display:flex not display:grid
// and ensuring @media print hides it completely
// ════════════════════════════════════════
function rptCheckAll(val){
  ['rpt-plant','rpt-camlist','rpt-storage','rpt-cable','rpt-bom','rpt-nvr','rpt-poe','rpt-client','rpt-budget'].forEach(function(id){
    var el=document.getElementById(id); if(el) el.checked=val;
  });
}
function rptOn(id){ var el=document.getElementById(id); return el?el.checked:true; }

function openPrintModal(){
  document.getElementById('pr-date').value=new Date().toISOString().slice(0,10);
  // Compute total storage preview
  saveCurrentFloor();
  var allP=[]; FLOORS.forEach(function(fl){allP=allP.concat(fl.placed);});
  var CAMTYPES=['dome','bullet','ptz','fisheye','turret','thermal_bi'];
  var cams=allP.filter(function(p){var d=gD(p.libId);return d&&CAMTYPES.indexOf(d.type)>=0;});
  var totalGB=0, lines=[];
  cams.forEach(function(p){
    var mp=p.mp||4, codec=p.codec||'ultra265b', days=p.days||30;
    var st=calcStorage(mp,codec,days,p);
    totalGB+=st.gb;
    lines.push(p.label+': '+mp+'MP · '+codecLabel(codec)+' · '+days+'d → '+fmtGB(st.gb));
  });
  var prevEl=document.getElementById('pr-storage-preview');
  var detEl=document.getElementById('pr-storage-detail');
  if(prevEl) prevEl.textContent = cams.length ? fmtGB(totalGB)+' total ('+cams.length+' câmaras)' : 'Sem câmaras no projeto';
  if(detEl)  detEl.textContent  = lines.slice(0,4).join(' | ')+(lines.length>4?' +mais '+(lines.length-4)+'…':'');
  openM('m-print');
}
function doPrint(){
  closeM('m-print');
  _fillPrintDoc();

  // ── Collect all devices across floors ──
  saveCurrentFloor();
  var allPlaced=[];
  FLOORS.forEach(function(fl){allPlaced=allPlaced.concat(fl.placed);});
  var CAMTYPES=['dome','bullet','ptz','fisheye','turret','thermal_bi'];
  var cams=allPlaced.filter(function(p){var d=gD(p.libId);return d&&CAMTYPES.indexOf(d.type)>=0;});

  // ── Device list (simple) ──
  var dl=allPlaced.map(function(p,i){
    var dev=gD(p.libId); var info='';
    if(MOD==='cctv'&&dev){var ef=lFOV(dev.fov,(typeof SIGSLensModel!=='undefined'?SIGSLensModel.effective(p,dev):(p.lens||2.8)),typeof SIGSLensModel!=='undefined'?SIGSLensModel.policy(dev).base:undefined,dev),er=lRange(dev.range,(typeof SIGSLensModel!=='undefined'?SIGSLensModel.effective(p,dev):(p.lens||2.8)));info=' — '+dev.name+' | '+((typeof SIGSLensModel!=='undefined'?SIGSLensModel.effective(p,dev):(p.lens||2.8))).toFixed(1)+'mm | FOV '+ef.toFixed(0)+'° | '+er.toFixed(0)+'m';}
    else if(dev){info=' — '+dev.name+(p.zone?' | Zona '+p.zone:'')+(p.arange?' | '+p.arange+'m':'');}
    return (i+1)+'. '+p.label+info;
  }).join('\n');
  document.getElementById('pd-devlist').textContent=dl||'Nenhum dispositivo colocado';

  // ── Canvas ──
  var pdcanvas=document.getElementById('pd-canvas');
  if(rptOn('rpt-plant')){
    render();
    var img=document.createElement('img');
    img.src=cv.toDataURL('image/png');
    img.style.cssText='max-width:100%;height:auto;display:block;margin:0 auto';
    pdcanvas.innerHTML=''; pdcanvas.appendChild(img);
    pdcanvas.style.display='';
  } else {
    pdcanvas.innerHTML=''; pdcanvas.style.display='none';
  }

  // ── Camera detail table ──
  var camSec=document.getElementById('pd-cam-section');
  var grandStorTotal=0;
  if(rptOn('rpt-camlist')&&MOD==='cctv'&&cams.length){
    camSec.style.display='';
    var tbody='';
    cams.forEach(function(p,i){
      var dev=gD(p.libId); if(!dev)return;
      var lens=(typeof SIGSLensModel!=='undefined'?SIGSLensModel.effective(p,dev):(p.lens||2.8));
      var fov=lFOV(dev.fov,lens,typeof SIGSLensModel!=='undefined'?SIGSLensModel.policy(dev).base:undefined,dev).toFixed(0)+'°';
      var range=lRange(dev.range,lens).toFixed(0)+'m';
      var dr=doriCalc(window.SIGSEngineeringModel&&typeof p!=='undefined'?Object.assign({},dev,{resW:SIGSEngineeringModel.widthPixels(p,dev)}):dev,lens);
      var mp=p.mp||dev.mp||8, codec=p.codec||'ultra265b', days=p.days||30;
      var st=calcStorage(mp,codec,days,p);
      grandStorTotal+=st.gb;
      tbody+='<tr><td>'+(i+1)+'</td><td><b>'+p.label+'</b></td><td style="font-size:8.5px">'+(dev.model||'—')+'</td><td>'+dev.type+'</td><td>'+lens.toFixed(1)+'mm</td><td>'+fov+'</td><td>'+range+'</td><td>'+dr.d.toFixed(0)+'m</td><td>'+dr.i.toFixed(0)+'m</td><td>'+mp+'MP</td><td>'+fmtGB(st.gb)+'</td></tr>';
    });
    document.getElementById('pd-cam-tbody').innerHTML=tbody;
  } else { camSec.style.display='none'; }

  // ── Storage summary with TOTAL ──
  var storSec=document.getElementById('pd-storage-section');
  if(rptOn('rpt-storage')&&MOD==='cctv'&&cams.length){
    storSec.style.display='';
    var storRows=''; var grandTotal=0;
    cams.forEach(function(p){
      var mp=p.mp||4,codec=p.codec||'ultra265b',days=p.days||30;
      var st=calcStorage(mp,codec,days,p); grandTotal+=st.gb;
      storRows+='<b>'+p.label+'</b>: '+mp+'MP · '+codecLabel(codec)+' · '+days+' dias → <b>'+fmtGB(st.gb)+'</b><br>';
    });
    // Total disco em destaque
    storRows+='<div style="margin-top:8px;padding:6px 10px;background:#fff3d0;border-left:3px solid #c06000;border-radius:0 4px 4px 0">' +
      '<span style="font-size:11px;color:#804000">💾 <b>TOTAL ARMAZENAMENTO: '+fmtGB(grandTotal)+'</b></span>' +
      '<br><span style="font-size:9px;color:#a06000">'+cams.length+' câmara(s) · '+FLOORS.length+' piso(s) · incluindo redundância 0%</span>' +
    '</div>';
    document.getElementById('pd-storage-content').innerHTML=storRows;
  } else { storSec.style.display='none'; }

  // ── Cable table ──
  var cableSec=document.getElementById('pd-cable-section');
  if(rptOn('rpt-cable')&&NVR_POS&&S.scale.ok&&allPlaced.length){
    cableSec.style.display='';
    var totalCable=0; var ctbody='';
    allPlaced.forEach(function(p){
      var d=gD(p.libId);if(!d)return;
      var cd=cableForCam(p);if(!cd)return;
      totalCable+=cd.cable;
      ctbody+='<tr><td><b>'+p.label+'</b></td><td>'+cd.planDist.toFixed(1)+' m</td><td>'+(p.instHeight||3)+' m</td><td><b>'+cd.cable.toFixed(1)+' m</b></td></tr>';
    });
    document.getElementById('pd-cable-tbody').innerHTML=ctbody;
    document.getElementById('pd-cable-total').innerHTML='<b>Total estimado de cabo: '+totalCable.toFixed(0)+' m</b> &nbsp;|&nbsp; Distância planta + altura + 5m folga/câmara';
  } else { cableSec.style.display='none'; }

  // ── BOM ──
  var bomSec=document.getElementById('pd-bom-section');
  if(rptOn('rpt-bom')&&allPlaced.length){
    bomSec.style.display='';
    var groups={};
    allPlaced.forEach(function(p){var dev=gD(p.libId);if(!dev)return;var k=p.libId;if(!groups[k])groups[k]={dev:dev,count:0};groups[k].count++;});
    var bomRows=Object.values(groups).sort(function(a,b){return b.count-a.count;}).map(function(g){
      return '<tr><td><b>'+(g.dev.model||g.dev.name)+'</b></td><td>'+g.dev.name+'</td><td>'+g.dev.type+'</td><td style="text-align:center;font-weight:700">'+g.count+'</td></tr>';
    }).join('');
    document.getElementById('pd-bom-tbody').innerHTML=bomRows;
  } else { bomSec.style.display='none'; }

  // ── NVR + PoE ──
  var nvrSec=document.getElementById('pd-nvr-section');
  if((rptOn('rpt-nvr')||rptOn('rpt-poe'))&&MOD==='cctv'&&cams.length){
    nvrSec.style.display='';
    var totalBW2=0,maxMP2=0,totalGB3=0;
    cams.forEach(function(p){var mp=p.mp||4,codec=p.codec||'ultra265b',days=p.days||30;var br=cameraNetworkMbps(p);totalBW2+=br;totalGB3+=calcStorage(mp,codec,days,p).gb;if(mp>maxMP2)maxMP2=mp;});
    var nvrHtml='<b>Projeto:</b> '+cams.length+' câmaras · '+totalBW2.toFixed(1)+' Mbps BW total · 💾 '+fmtGB(totalGB3)+'<br><br>';
    if(rptOn('rpt-nvr')){
      var matches2=suggestNVR(cams.length,maxMP2,totalBW2);
      if(matches2.length){
        nvrHtml+='<b style="color:#0a2a4a">🖥 NVR Recomendado: '+matches2[0].name+'</b> ('+matches2[0].brand+' · '+matches2[0].ch+' canais · '+matches2[0].maxMP+'MP · '+matches2[0].hdd+' HDD)<br>';
        if(matches2[1]) nvrHtml+='Alternativa: '+matches2[1].name+' ('+matches2[1].brand+' · '+matches2[1].ch+' canais)<br>';
      } else { nvrHtml+='⚠ Nenhum NVR encontrado para esta configuração.<br>'; }
    }
    if(rptOn('rpt-poe')){
      var poe2=calcPoE(cams);
      nvrHtml+='<br><b style="color:#1a4a2a">⚡ Switch PoE: ';
      if(poe2.suggested[0]) nvrHtml+=poe2.suggested[0].name+' ('+poe2.suggested[0].budget+'W · '+poe2.suggested[0].ports+' portas)';
      else nvrHtml+='Sem modelo disponível para '+poe2.totalWithMargin+'W';
      nvrHtml+='</b><br>PoE total: '+poe2.totalW+'W + '+poe2.marginPct+'% margem = '+poe2.totalWithMargin+'W · Uplink '+poe2.uplink.name;
    }
    document.getElementById('pd-nvr-content').innerHTML=nvrHtml;
  } else { nvrSec.style.display='none'; }

  // ── Client data ──
  var clientRow=document.getElementById('pd-client-row');
  if(clientRow){
    var hasClient=document.getElementById('pr-client-name').value.trim()||document.getElementById('pr-client-company').value.trim();
    clientRow.style.display=(rptOn('rpt-client')&&hasClient)?'':'none';
  }

  document.getElementById('pd-modsummary').textContent=allPlaced.length+' dispositivo(s) · '+FLOORS.length+' piso(s) · Escala: '+(S.scale.ok?S.scale.ppm.toFixed(1)+' px/m':'n/d');
  document.getElementById('pd-ts').textContent='Gerado: '+new Date().toLocaleString('pt-PT');
  setTimeout(function(){window.print();},300);
}

// ════════════════════════════════════════
// SAVE / LOAD
// ════════════════════════════════════════
// ═══════════════════════════════════════════════════════════
// CLOUD STATE — Supabase only (V6)
// ═══════════════════════════════════════════════════════════
var CLOUD = {access:null,user:null,projectId:null,projectName:null,inited:false};
function _esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function _cloudBtn(){var b=document.getElementById('cloudbtn');if(!b)return;b.textContent=CLOUD.user?'☁ Projetos ✓':'☁ Projetos';b.style.color=CLOUD.user?'var(--ok,#10b981)':'';}

// ── Contagens do projeto (todos os pisos) ──
function _projectCounts(){
  if(typeof saveCurrentFloor==='function') saveCurrentFloor();
  var CT=['dome','bullet','ptz','fisheye','turret','radar','thermal_bi'];
  var DT=['pir_indoor','pir_outdoor','door','glass','combi'];
  var FT=['fire'];
  var cam=0,det=0,fire=0;
  var floors=(typeof FLOORS!=='undefined'&&FLOORS&&FLOORS.length)?FLOORS:[{placed:S.placed}];
  floors.forEach(function(fl){ (fl.placed||[]).forEach(function(p){ var d=gD(p.libId); if(!d)return;
    if(CT.indexOf(d.type)>=0)cam++; else if(DT.indexOf(d.type)>=0)det++; else if(FT.indexOf(d.type)>=0)fire++; }); });
  return {cameraCount:cam, detectorCount:det, fireDetectorCount:fire};
}

// ── Serialização (igual à do saveProj) ──
function _buildProjectData(){
  if(typeof saveCurrentFloor==='function') saveCurrentFloor();
  var data={v:8,module:MOD,lib:S.lib,placed:S.placed,meas:S.meas,scale:S.scale,devN:S.devN,floors:FLOORS,floorCur:FLOOR_CUR};
  if(S.fp&&S.fp.img){
    try{
      var imgData=S.fp.imgData||null;
      if(!imgData){ var oc=document.createElement('canvas'); oc.width=S.fp.img.naturalWidth||S.fp.img.width; oc.height=S.fp.img.naturalHeight||S.fp.img.height; oc.getContext('2d').drawImage(S.fp.img,0,0); imgData=oc.toDataURL('image/jpeg',0.82); }
      data.fp={x:S.fp.x,y:S.fp.y,w:S.fp.w,h:S.fp.h,opa:S.fp.opa,locked:S.fp.locked,imgData:imgData};
    }catch(e){ data.fp={x:S.fp.x,y:S.fp.y,w:S.fp.w,h:S.fp.h,opa:S.fp.opa,locked:S.fp.locked,imgData:null}; }
  }
  return data;
}
function _restoreProjectData(d){
  if(typeof closeMap==='function') closeMap();
  S.floorPlanLoadId=(S.floorPlanLoadId||0)+1;
  if(d.module&&d.module!==MOD) startModule(d.module);
  if(d.lib)S.lib=d.lib; if(MOD==='cctv'&&typeof SIGSAjaxCCTV!=='undefined')S.lib=SIGSAjaxCCTV.merge(S.lib); if(MOD==='cctv'&&typeof SIGSCCTVExpansion!=='undefined')S.lib=SIGSCCTVExpansion.merge(S.lib); if(MOD==='cctv'&&typeof SIGSCCTVVisiotech!=='undefined')S.lib=SIGSCCTVVisiotech.merge(S.lib);
if(MOD==='cctv'&&typeof SIGSCCTVVisiotech100!=='undefined')S.lib=SIGSCCTVVisiotech100.merge(S.lib); if(d.placed)S.placed=d.placed; if(d.meas)S.meas=d.meas;
  if(d.scale)S.scale=d.scale; if(d.devN)S.devN=d.devN;
  if(d.floors&&d.floors.length){ FLOORS=d.floors; FLOOR_CUR=d.floorCur||0; renderFloorBar(); }
  else { FLOORS[0]={id:uid(),name:'Piso 0',placed:d.placed||[],meas:d.meas||[],fp:null,scale:d.scale||S.scale,devN:d.devN||0}; FLOOR_CUR=0; renderFloorBar(); }
  var scaleBadge=document.getElementById('scbadge');if(scaleBadge&&S.scale&&S.scale.ok)scaleBadge.textContent=Number(S.scale.ppm).toFixed(1)+' px/m';
  var meta=(d.floors&&d.floors[FLOOR_CUR]&&d.floors[FLOOR_CUR].fp)||d.fp||null;
  S.fp=meta?Object.assign({},meta,{img:null}):null;
  if(meta&&meta.imgData){ var target=S.fp,img=new Image(); img.onload=function(){ if(S.fp!==target)return; target.img=img; var fl=document.getElementById('fplock'); if(fl)fl.checked=!!target.locked; if(typeof sigsSetPlantLocked==='function')sigsSetPlantLocked(!!target.locked); if(typeof fitView==='function')fitView(); render(); updateStats(); }; img.src=meta.imgData; }
  renderDevList(); deselect(); render(); updateStats();
}

// ── Guardar / abrir na cloud ──
function _sigsSbCfg(){
  return {url:'https://kbihedvyykjlbnipdgfm.supabase.co',key:'sb_publishable_7iaBGJr6qS-YO1HOySsKUQ_vCxOU52o'};
}
function _sigsSbHeaders(extra){
  var c=_sigsSbCfg(),token=CLOUD.access||localStorage.getItem('sigs_sb_access')||'';
  return Object.assign({'apikey':c.key,'Authorization':'Bearer '+token,'Content-Type':'application/json'},extra||{});
}
function _sigsSbJson(url,opts){
  return fetch(url,opts||{}).then(function(r){return r.text().then(function(tx){var b={};try{b=tx?JSON.parse(tx):{};}catch(e){b={message:tx};}if(!r.ok){var er=new Error((b&&b.message)||(b&&b.error)||('Erro '+r.status));er.status=r.status;er.code=b&&b.code;throw er;}return b;});});
}
function _sigsProjectItems(counts){return (counts.cameraCount||0)+(counts.detectorCount||0)+(counts.fireDetectorCount||0);}
function _sigsProjectModule(){return String(MOD||'CCTV').toUpperCase()==='ALARM'?'INTRUSION':String(MOD||'CCTV').toUpperCase();}
function _sigsEnsureContext(companyId){
  if(!CLOUD.user)return Promise.reject(new Error('Inicia sessão primeiro.'));
  var userId=CLOUD.user.id;
  if(typeof window.loadLicenseContext!=='function')return Promise.reject(new Error('Não foi possível consultar a empresa.'));
  return window.loadLicenseContext().then(function(context){
    if(!context||!CLOUD.user||CLOUD.user.id!==userId)throw new Error('A sessão mudou. Volta a abrir o espaço de trabalho.');
    if(CLOUD.user.role!=='SUPER_ADMIN')return context;
    var selected=companyId||null;
    var infer=!selected&&CLOUD.projectId?_sigsSbJson(_sigsSbCfg().url+'/rest/v1/projects?select=company_id&id=eq.'+encodeURIComponent(CLOUD.projectId),{headers:_sigsSbHeaders()}).then(function(rows){return rows[0]&&rows[0].company_id;}):Promise.resolve(selected);
    return infer.then(function(id){
      var co=(context.companies||[]).find(function(x){return x.id===id;});
      if(!co){if(companyId)throw new Error('Empresa não disponível.');return context;}
      return _sigsSbJson(_sigsSbCfg().url+'/rest/v1/projects?select=id,name,module,status&company_id=eq.'+encodeURIComponent(co.id),{headers:_sigsSbHeaders()}).then(function(projects){
        return {company:co,license:co.license,projects:projects,companies:context.companies};
      });
    });
  });
}

function cloudSaveCurrent(){
  if(!CLOUD.user){ notify('Entra primeiro.'); return; }
  var counts=_projectCounts(),data=_buildProjectData(),items=_sigsProjectItems(counts);
  _sigsEnsureContext().then(function(ctx){
    var co=ctx.company||{},lic=ctx.license||{},projects=ctx.projects||[];
    if(!co.id)throw new Error('Empresa não encontrada.');
    if(lic.status!=='ACTIVE')throw new Error('A licença da empresa não está ativa.');
    if(lic.maxItems!=null && items>lic.maxItems)throw new Error('O plano permite até '+lic.maxItems+' itens por projeto. Este projeto tem '+items+'.');
    var cfg=_sigsSbCfg();
    if(!CLOUD.projectId){
      if(lic.maxProjects!=null && projects.length>=lic.maxProjects)throw new Error('Limite de '+lic.maxProjects+' projetos atingido neste plano.');
      var name=prompt('Nome do projeto:', 'Projeto '+(MOD||'').toUpperCase());
      if(name===null)throw {silent:true};
      var row={company_id:co.id,created_by:CLOUD.user.id,name:name||('Projeto '+MOD),module:_sigsProjectModule(),status:'ACTIVE',project_data:data,camera_count:counts.cameraCount||0,detector_count:counts.detectorCount||0,fire_detector_count:counts.fireDetectorCount||0,floor_count:(typeof FLOORS!=='undefined'&&FLOORS?FLOORS.length:1)};
      return _sigsSbJson(cfg.url+'/rest/v1/projects',{method:'POST',headers:_sigsSbHeaders({'Prefer':'return=representation'}),body:JSON.stringify(row)}).then(function(rows){var p=rows&&rows[0];if(!p)throw new Error('Projeto não criado.');CLOUD.projectId=p.id;CLOUD.projectName=p.name;return p;});
    }
    var patch={project_data:data,module:_sigsProjectModule(),camera_count:counts.cameraCount||0,detector_count:counts.detectorCount||0,fire_detector_count:counts.fireDetectorCount||0,floor_count:(typeof FLOORS!=='undefined'&&FLOORS?FLOORS.length:1),updated_at:new Date().toISOString()};
    return _sigsSbJson(cfg.url+'/rest/v1/projects?id=eq.'+encodeURIComponent(CLOUD.projectId),{method:'PATCH',headers:_sigsSbHeaders({'Prefer':'return=representation'}),body:JSON.stringify(patch)}).then(function(rows){return rows&&rows[0];});
  }).then(function(p){
    if(!p)return; notify('☁ Projeto guardado: '+(CLOUD.projectName||p.name||'Projeto'));
    if(typeof loadContext==='function')loadContext().catch(function(){});
  }).catch(function(e){if(e&&e.silent)return;notify('Erro ao guardar: '+(e&&e.message?e.message:e));});
}
function cloudNewProject(){ CLOUD.projectId=null; CLOUD.projectName=null; notify('Novo projeto — usa "Guardar atual" para criar.'); }
function cloudOpenProject(id,name){
  var cfg=_sigsSbCfg();
  _sigsSbJson(cfg.url+'/rest/v1/projects?select=id,name,project_data&id=eq.'+encodeURIComponent(id),{headers:_sigsSbHeaders()}).then(function(rows){
    var p=rows&&rows[0];if(!p||!p.project_data){notify('Projeto sem dados guardados.');return;}
    _restoreProjectData(p.project_data);CLOUD.projectId=p.id;CLOUD.projectName=p.name;
    try{closeCloud();}catch(e){} notify('☁ Projeto aberto: '+(name||p.name));
  }).catch(function(e){notify('Erro ao abrir: '+e.message);});
}
function cloudDeleteProject(id,name){
  if(!confirm('Apagar "'+name+'"?'))return;
  var cfg=_sigsSbCfg();
  _sigsSbJson(cfg.url+'/rest/v1/projects?id=eq.'+encodeURIComponent(id),{method:'DELETE',headers:_sigsSbHeaders()}).then(function(){if(CLOUD.projectId===id){CLOUD.projectId=null;CLOUD.projectName=null;}notify('Projeto apagado.');if(typeof loadContext==='function')loadContext().catch(function(){});}).catch(function(e){notify('Erro: '+e.message);});
}

window.sigsAdminOpenProject=function(id,name){
  var cfg=_sigsSbCfg();
  _sigsSbJson(cfg.url+'/rest/v1/projects?select=id,name,project_data&id=eq.'+encodeURIComponent(id),{headers:_sigsSbHeaders()}).then(function(rows){
    var p=rows&&rows[0];if(!p||!p.project_data)throw new Error('Projeto sem dados guardados.');
    if(typeof sigsPortalOpenDesigner==='function')sigsPortalOpenDesigner();
    setTimeout(function(){_restoreProjectData(p.project_data);CLOUD.projectId=p.id;CLOUD.projectName=p.name;notify('Projeto aberto para verificação: '+(name||p.name));},60);
  }).catch(function(e){notify('Erro ao abrir projeto: '+e.message);});
};

// Project management UI is provided by projects-v6.js

function saveProj(){
  saveCurrentFloor();
  var data={v:8,module:MOD,lib:S.lib,placed:S.placed,meas:S.meas,scale:S.scale,devN:S.devN,floors:FLOORS,floorCur:FLOOR_CUR};
  // Serialize floor plan image as base64 data URL
  if(S.fp&&S.fp.img){
    try{
      // Prefer the imgData stored at capture time (avoids CORS re-export issues)
      var imgData=S.fp.imgData||null;
      if(!imgData){
        var oc=document.createElement('canvas');
        oc.width=S.fp.img.naturalWidth||S.fp.img.width;
        oc.height=S.fp.img.naturalHeight||S.fp.img.height;
        oc.getContext('2d').drawImage(S.fp.img,0,0);
        imgData=oc.toDataURL('image/jpeg',0.82);
      }
      data.fp={x:S.fp.x,y:S.fp.y,w:S.fp.w,h:S.fp.h,opa:S.fp.opa,locked:S.fp.locked,imgData:imgData};
    }catch(e){
      data.fp={x:S.fp.x,y:S.fp.y,w:S.fp.w,h:S.fp.h,opa:S.fp.opa,locked:S.fp.locked,imgData:null};
    }
  }
  var b=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='projeto_'+MOD+'.vdp';a.click();notify('Projeto guardado!');
}
function doLoadProj(e){
  var f=e.target.files[0]; if(!f)return;
  var r=new FileReader();
  r.onload=function(ev){
    try{
      var d=JSON.parse(ev.target.result);
      if(d.module&&d.module!==MOD)startModule(d.module);
      if(d.lib)S.lib=d.lib; if(MOD==='cctv'&&typeof SIGSAjaxCCTV!=='undefined')S.lib=SIGSAjaxCCTV.merge(S.lib); if(MOD==='cctv'&&typeof SIGSCCTVExpansion!=='undefined')S.lib=SIGSCCTVExpansion.merge(S.lib); if(MOD==='cctv'&&typeof SIGSCCTVVisiotech!=='undefined')S.lib=SIGSCCTVVisiotech.merge(S.lib);
if(MOD==='cctv'&&typeof SIGSCCTVVisiotech100!=='undefined')S.lib=SIGSCCTVVisiotech100.merge(S.lib); if(d.placed)S.placed=d.placed; if(d.meas)S.meas=d.meas;
      if(d.scale)S.scale=d.scale; if(d.devN)S.devN=d.devN;
      // Restore floors
      if(d.floors&&d.floors.length){FLOORS=d.floors;FLOOR_CUR=d.floorCur||0;renderFloorBar();}else{FLOORS[0]={id:uid(),name:'Piso 0',placed:d.placed||[],meas:d.meas||[],fp:null,scale:d.scale||S.scale,devN:d.devN||0};FLOOR_CUR=0;renderFloorBar();}
      if(S.scale.ok)document.getElementById('scbadge').textContent=S.scale.ppm.toFixed(1)+' px/m';
      // Restore floor plan
      S.fp=null;
      if(d.fp&&d.fp.imgData){
        var img=new Image();
        img.onload=function(){
          S.fp={img:img,x:d.fp.x,y:d.fp.y,w:d.fp.w,h:d.fp.h,opa:d.fp.opa!==undefined?d.fp.opa:1,locked:!!d.fp.locked};
          document.getElementById('fplock').checked=!!d.fp.locked;
          render(); updateStats();
        };
        img.src=d.fp.imgData;
      } else if(d.fp){
        notify('⚠ Imagem da planta não guardada (CORS). Recapture o mapa.');
      }
      renderDevList(); deselect(); render(); updateStats(); notify('Projeto carregado!');
    }catch(err){notify('Erro ao carregar ficheiro');}
  };
  r.readAsText(f); e.target.value='';
}

// ════════════════════════════════════════
// STATS
// ════════════════════════════════════════
function updateStats(){
  var values={'s-devs':S.placed.length,'s-scale':S.scale.ok?Number(S.scale.ppm).toFixed(1)+' px/m':'—','s-fp':S.fp?'Importada':'—','s-meas':S.meas.length};
  Object.keys(values).forEach(function(id){var el=document.getElementById(id);if(el)el.textContent=values[id];});
  var t={};S.placed.forEach(function(p){var d=gD(p.libId);if(d)t[d.type]=(t[d.type]||0)+1;});
  var html='';for(var k in t)html+='<div class="si"><span class="sk">'+k+'</span><span class="sv">'+t[k]+'</span></div>';
  var types=document.getElementById('s-types');if(types)types.innerHTML=html||'<div style="color:var(--txt3);font-size:11px">Nenhum dispositivo</div>';
  updateProjSummary();
}

function updateProjSummary(){
  var CAMTYPES=['dome','bullet','ptz','fisheye','turret','thermal_bi'];
  var cams=S.placed.filter(function(p){var d=gD(p.libId);return d&&CAMTYPES.indexOf(d.type)>=0;});
  var el=document.getElementById('proj-summary-panel'); if(!el) return;
  var nodata=document.getElementById('ps-nodata');

  if(!cams.length){
    if(nodata) nodata.style.display='';
    ['ps-cams','ps-storage','ps-days','ps-cable','ps-nvr'].forEach(function(id){
      var e=document.getElementById(id); if(e) e.textContent='—';
    });
    return;
  }
  if(nodata) nodata.style.display='none';

  // Camera count
  var camsEl=document.getElementById('ps-cams');
  if(camsEl) camsEl.textContent=cams.length+' câmara'+(cams.length!==1?'s':'');

  // Storage & days — use each camera's own settings
  var totalGB=0, minDays=999, maxDays=0;
  cams.forEach(function(p){
    var mp=p.mp||4, codec=p.codec||'ultra265b', days=p.days||30;
    var br=cameraNetworkMbps(p);
    var gb=br*3600*24*days/8/(1024*1024*1024)*1e6;
    totalGB+=Math.ceil(gb);
    if(days<minDays) minDays=days;
    if(days>maxDays) maxDays=days;
  });
  var storEl=document.getElementById('ps-storage');
  if(storEl) storEl.textContent=fmtGB(totalGB);
  var daysEl=document.getElementById('ps-days');
  if(daysEl) daysEl.textContent=(minDays===maxDays?minDays+' dias':minDays+'–'+maxDays+' dias');

  // Cable total
  var cableEl=document.getElementById('ps-cable');
  if(cableEl){
    if(!S.scale.ok){
      cableEl.textContent='(sem escala)';
    } else {
      var totalCable=0, hasCable=false;
      S.placed.forEach(function(p){
        var cd=cableForCam(p); if(!cd) return;
        totalCable+=cd.cable; hasCable=true;
      });
      cableEl.textContent=hasCable?totalCable.toFixed(0)+' m':'(sem NVR)';
    }
  }

  // NVR status
  var nvrEl=document.getElementById('ps-nvr');
  if(nvrEl) nvrEl.textContent=NVR_POS?'✅ Definido':'Não definido';
}

// ════════════════════════════════════════
// TABS & MODALS
// ════════════════════════════════════════
function tab(n){
  var names=['props','system','budget','stats','layers'];
  document.querySelectorAll('.tab').forEach(function(t,i){t.classList.toggle('on',names[i]===n);});
  document.querySelectorAll('.tc').forEach(function(tc){tc.classList.toggle('on',tc.id==='tc-'+n);});
}
function openM(id){document.getElementById(id).classList.remove('hide');}
function closeM(id){document.getElementById(id).classList.add('hide');}

// ════════════════════════════════════════
// KEYBOARD
// ════════════════════════════════════════
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT'||e.target.tagName==='TEXTAREA'||e.target.isContentEditable)return;
  if((e.ctrlKey||e.metaKey)&&e.key==='a'){e.preventDefault();selectAll();return;}
  if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();doUndo();return;}
  if((e.ctrlKey||e.metaKey)&&(e.key==='y'||e.key==='Z')){e.preventDefault();doRedo();return;}
  if(e.key==='c'||e.key==='C'){if(S.activeLib)setTool('place');}
  if(e.key==='m'||e.key==='M')setTool('meas');
  if(e.key==='s'||e.key==='S')setTool('scale');
  if(e.key==='f'||e.key==='F')fitView();
  if(e.key==='g'||e.key==='G')toggleSnap();
  if(e.key==='Escape'){S.tool=null;['place','meas','scale'].forEach(function(n){var el=document.getElementById('t-'+n);if(el)el.classList.remove('on');});cw.style.cursor='default';S.tmpLine=null;S.mp1=null;S.sp1=null;deselect();render();}
  if((e.key==='Delete'||e.key==='Backspace')&&(S.selId||S.multiSel.length))delSel();
  if(e.key==='['&&S.selId){var pc=fP(S.selId);if(pc){pc.rotation=((pc.rotation-5)+360)%360;syncP();render();}}
  if(e.key===']'&&S.selId){var pc2=fP(S.selId);if(pc2){pc2.rotation=(pc2.rotation+5)%360;syncP();render();}}
});

// ════════════════════════════════════════
// LENS MATH
// ════════════════════════════════════════
// Effective horizontal FOV from the catalogue FOV at the reference focal length.
// The previous version scaled FOV linearly; optics follow atan geometry.
function lFOV(baseFov,mm,baseMm,device){
  if(device&&typeof SIGSLensModel!=='undefined'&&device.fovWide&&device.fovTele)return SIGSLensModel.fov({lens:mm},device);
  if(!baseFov)return 90;
  mm=Number(mm)||2.8;
  baseMm=Number(baseMm)||2.8;
  if(mm<=0)return baseFov;
  var baseRad=Math.max(1,Math.min(179,Number(baseFov)))*Math.PI/180;
  var halfSensorFactor=Math.tan(baseRad/2)*baseMm;
  var fov=2*Math.atan(halfSensorFactor/mm)*180/Math.PI;
  return Math.max(1,Math.min(179,fov));
}

// Catalogue range is the manufacturer's illumination / practical range.
// It must not grow artificially when focal length changes.
function lRange(b,mm){return Number(b)||0;}

function lDesc(mm){
  if(mm<=2.9)return'Grande angular — visão ampla';
  if(mm<=4.1)return'Angular — entradas e corredores';
  if(mm<=6.1)return'Normal — uso geral';
  if(mm<=8.1)return'Tele médio — maior densidade de píxeis';
  if(mm<=12.1)return'Telefoto — detalhe a longa distância';
  return'Telefoto longo — campo estreito e elevada densidade';
}

// Horizontal resolution used by DORI.
// Explicit catalogue values always take priority.
function cameraHorizontalPixels(dev){
  if(!dev)return 1920;
  var explicit=Number(dev.resW||dev.resolutionW||dev.widthPx||0);
  if(explicit>0)return explicit;
  var mp=Number(dev.mp)||2;
  if(mp<=2.2)return 1920;
  if(mp<=3.2)return 2304;
  if(mp<=4.3)return 2688;
  if(mp<=5.5)return 2880;
  if(mp<=6.5)return 3200;
  if(mp<=8.5)return 3840;
  if(mp<=12.5)return 4000;
  return Math.round(Math.sqrt(mp*1000000*(16/9)));
}

// EN 62676-4 DORI thresholds, horizontal pixel density:
// Detection 25 px/m · Observation 62.5 px/m · Recognition 125 px/m · Identification 250 px/m.
var DORI_PPM={d:25,o:62.5,r:125,i:250};

function doriDistanceForPpm(horizontalPx,hfovDeg,ppm){
  var hfov=Math.max(1,Math.min(179,Number(hfovDeg)||90))*Math.PI/180;
  var denom=Number(ppm)*2*Math.tan(hfov/2);
  if(!denom||denom<=0)return 0;
  return horizontalPx/denom;
}

function autoDori(fov,range,mp){
  return doriCalc({fov:fov,range:range,mp:mp||2},2.8);
}

function doriCalc(dev,lens){
  if(!dev)return {d:0,o:0,r:0,i:0,hfov:0,hpx:0};
  var baseLens=typeof SIGSLensModel!=='undefined'?SIGSLensModel.policy(dev).base:(Number(dev.baseLens||dev.refLens||2.8)||2.8);
  var hfov=lFOV(Number(dev.fov)||90,Number(lens)||baseLens,baseLens,dev);
  var hpx=cameraHorizontalPixels(dev);
  return {
    d:doriDistanceForPpm(hpx,hfov,DORI_PPM.d),
    o:doriDistanceForPpm(hpx,hfov,DORI_PPM.o),
    r:doriDistanceForPpm(hpx,hfov,DORI_PPM.r),
    i:doriDistanceForPpm(hpx,hfov,DORI_PPM.i),
    hfov:hfov,
    hpx:hpx
  };
}

// Update DORI panel in right properties pane
function updateDoriPanel(dev,lens){
  var selected=fP(S.selId);if(dev&&selected&&window.SIGSEngineeringModel)dev=Object.assign({},dev,{resW:SIGSEngineeringModel.widthPixels(selected,dev)});
  var panel=document.getElementById('cctv-dori');
  if(!dev){if(panel)panel.style.display='none';return;}
  if(panel)panel.style.display='';
  var dr=doriCalc(window.SIGSEngineeringModel&&typeof p!=='undefined'?Object.assign({},dev,{resW:SIGSEngineeringModel.widthPixels(p,dev)}):dev,lens);
  document.getElementById('dori-dv').textContent=dr.d.toFixed(1)+'m';
  document.getElementById('dori-ov').textContent=dr.o.toFixed(1)+'m';
  document.getElementById('dori-rv').textContent=dr.r.toFixed(1)+'m';
  document.getElementById('dori-iv').textContent=dr.i.toFixed(1)+'m';
  // Progress bar — scale to Detection distance
  var maxD=dr.d||1;
  document.getElementById('dori-bar-d').style.width=Math.min(100,dr.d/maxD*100)+'%';
  document.getElementById('dori-bar-o').style.width=Math.min(100,dr.o/maxD*100)+'%';
  document.getElementById('dori-bar-r').style.width=Math.min(100,dr.r/maxD*100)+'%';
  document.getElementById('dori-bar-i').style.width=Math.min(100,dr.i/maxD*100)+'%';
  var info=(dev.mp?dev.mp+'MP · ':'')+(dr.hpx?dr.hpx+'px horiz. · ':'')+lens.toFixed(1)+'mm · FOV '+dr.hfov.toFixed(1)+'°';
  document.getElementById('dori-hint').textContent=info;
}

// ════════════════════════════════════════
// UTILS
// ════════════════════════════════════════
function hr(hex,a){if(!hex||hex.length<7)return'rgba(0,170,255,'+a+')';var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return'rgba('+r+','+g+','+b+','+a+')';}
function uid(){return Math.random().toString(36).slice(2,9)+Date.now().toString(36);}
var _ht; function hint(msg){var el=document.getElementById('hintbar');el.textContent=msg;el.classList.add('show');clearTimeout(_ht);_ht=setTimeout(function(){el.classList.remove('show');},3500);}
var _nt; function notify(msg){var el=document.getElementById('nfy');el.textContent=msg;el.classList.add('show');clearTimeout(_nt);_nt=setTimeout(function(){el.classList.remove('show');},2800);}

// ════════════════════════════════════════
// UNDO / REDO
// ════════════════════════════════════════
var UNDO_MAX = 30;

function snapShot(){
  // imgData excluded from snapshots — avoids storing MB of base64 per undo step
  return JSON.stringify({placed:S.placed, meas:S.meas, fp:S.fp?{x:S.fp.x,y:S.fp.y,w:S.fp.w,h:S.fp.h,opa:S.fp.opa,locked:S.fp.locked}:null, scale:S.scale, devN:S.devN});
}

function pushUndo(){
  S.undoStack.push(snapShot());
  if(S.undoStack.length > UNDO_MAX) S.undoStack.shift();
  S.redoStack = [];
  updateUndoUI();
}

function applySnap(snap){
  var d = JSON.parse(snap);
  S.placed = d.placed;
  S.meas = d.meas;
  S.scale = d.scale;
  S.devN = d.devN;
  if(d.fp && S.fp && S.fp.img){
    S.fp.x=d.fp.x; S.fp.y=d.fp.y; S.fp.w=d.fp.w; S.fp.h=d.fp.h;
    S.fp.opa=d.fp.opa; S.fp.locked=d.fp.locked;
  } else if(!d.fp){ S.fp=null; }
  deselect(); render(); updateStats();
}

function doUndo(){
  if(!S.undoStack.length) return;
  S.redoStack.push(snapShot());
  applySnap(S.undoStack.pop());
  updateUndoUI();
  notify('Desfeito');
}

function doRedo(){
  if(!S.redoStack.length) return;
  S.undoStack.push(snapShot());
  applySnap(S.redoStack.pop());
  updateUndoUI();
  notify('Refeito');
}

function updateUndoUI(){
  var u = document.getElementById('tb-undo');
  var r = document.getElementById('tb-redo');
  if(u) u.disabled = S.undoStack.length === 0;
  if(r) r.disabled = S.redoStack.length === 0;
}

// ════════════════════════════════════════
// FLOORS (PISOS)
// ════════════════════════════════════════
var FLOORS = [];   // [{id, name, placed, meas, fp, scale, devN}]
var FLOOR_CUR = 0; // index of active floor

function initFloors(){
  // Called in startModule — wrap current state in a floor
  FLOORS = [{id:uid(), name:'Piso 0', placed:[], meas:[], fp:null, scale:{ok:false,ppm:10,mpp:0.1}, devN:0}];
  FLOOR_CUR = 0;
  renderFloorBar();
}

function renderFloorBar(){
  var bar = document.getElementById('floor-tabs');
  bar.innerHTML = FLOORS.map(function(fl, i){
    var isActive = i === FLOOR_CUR;
    return '<div style="display:flex;align-items:center;gap:2px">' +
      '<button onclick="switchFloor('+i+')" style="padding:4px 12px;border-radius:5px;font-size:11px;font-weight:'+(isActive?700:500)+';cursor:pointer;font-family:var(--f);border:1px solid '+(isActive?'var(--acc)':'var(--bdr2)')+';background:'+(isActive?'rgba(59,130,246,.12)':'transparent')+';color:'+(isActive?'var(--acc)':'var(--txt2)')+';transition:all .15s;white-space:nowrap">'+fl.name+'</button>' +
      (FLOORS.length > 1 ? '<button onclick="renameFloor('+i+')" title="Renomear" style="background:none;border:none;color:var(--txt3);cursor:pointer;font-size:11px;padding:0 2px;line-height:1">✏</button><button onclick="deleteFloor('+i+')" title="Eliminar" style="background:none;border:none;color:var(--txt3);cursor:pointer;font-size:11px;padding:0 2px;line-height:1">✕</button>' : '') +
    '</div>';
  }).join('');
}

function saveCurrentFloor(){
  if(!FLOORS[FLOOR_CUR]) return;
  var fl = FLOORS[FLOOR_CUR];
  fl.placed = JSON.parse(JSON.stringify(S.placed));
  fl.meas   = JSON.parse(JSON.stringify(S.meas));
  fl.scale  = JSON.parse(JSON.stringify(S.scale));
  fl.devN   = S.devN;
  fl.fp     = S.fp ? {x:S.fp.x, y:S.fp.y, w:S.fp.w, h:S.fp.h, opa:S.fp.opa, locked:S.fp.locked, imgData:S.fp.imgData} : null;
}

function loadFloor(idx){
  var fl = FLOORS[idx];
  if(!fl) return;
  if(typeof closeMap==='function')closeMap();
  var loadId=S.floorPlanLoadId=(S.floorPlanLoadId||0)+1;
  S.placed = JSON.parse(JSON.stringify(fl.placed));
  S.meas   = JSON.parse(JSON.stringify(fl.meas));
  S.scale  = JSON.parse(JSON.stringify(fl.scale));
  S.devN   = fl.devN;
  S.undoStack = []; S.redoStack = []; updateUndoUI();
  if(fl.fp && fl.fp.imgData){
    var target=S.fp=Object.assign({},fl.fp,{img:null});
    var img = new Image();
    img.onload = function(){ if(S.floorPlanLoadId!==loadId||S.fp!==target)return; target.img=img; sigsSetPlantLocked(!!target.locked); fitView(); render(); updateStats(); };
    img.src = fl.fp.imgData;
  } else {
    S.fp = null;
    sigsSetPlantLocked(false);
  }
  if(S.scale.ok) document.getElementById('scbadge').textContent = S.scale.ppm.toFixed(1)+' px/m';
  else document.getElementById('scbadge').textContent = 'Escala: n/d';
  deselect(); fitView(); render(); updateStats();
}

function switchFloor(idx){
  if(idx === FLOOR_CUR) return;
  saveCurrentFloor();
  FLOOR_CUR = idx;
  loadFloor(idx);
  renderFloorBar();
  notify('Piso: '+FLOORS[idx].name);
}

function addFloor(){
  saveCurrentFloor();
  var n = FLOORS.length;
  FLOORS.push({id:uid(), name:'Piso '+n, placed:[], meas:[], fp:null, scale:{ok:false,ppm:S.scale.ppm,mpp:S.scale.mpp}, devN:0});
  switchFloor(FLOORS.length-1);
}

function renameFloor(idx){
  var name = prompt('Nome do piso:', FLOORS[idx].name);
  if(name && name.trim()) { FLOORS[idx].name = name.trim(); renderFloorBar(); }
}

function deleteFloor(idx){
  if(FLOORS.length <= 1){ notify('Deve existir pelo menos um piso'); return; }
  if(!confirm('Eliminar "'+FLOORS[idx].name+'"? Todos os dispositivos deste piso serão perdidos.')) return;
  FLOORS.splice(idx, 1);
  if(idx < FLOOR_CUR) FLOOR_CUR--;
  FLOOR_CUR = Math.min(FLOOR_CUR, FLOORS.length-1);
  loadFloor(FLOOR_CUR);
  renderFloorBar();
}

// ════════════════════════════════════════
// ════════════════════════════════════════
// ORÇAMENTO
// ════════════════════════════════════════
// Budget state — prices stored per libId + special keys
var BUDGET = {
  prices: {},     // libId -> unit price
  hddPrice: 0,
  hddSize: 0,     // TB recommended
  cablePrice: 0.80,
  iva: 23,
};

var HDD_SIZES = [1,2,3,4,6,8,10,12]; // standard HDD sizes in TB
function sigsHddCatalogRef(tb){
  var db=window.SIGS_HDD_DB||[];
  var hit=db.find(function(x){return Number(x.capacityTB)===Number(tb);});
  return hit?hit.reference:('HDD-SURV-'+tb+'TB');
}

function nearestHDD(gb){
  var tb=gb/1024;
  var sizes=(window.SIGS_HDD_DB&&SIGS_HDD_DB.length)?SIGS_HDD_DB.map(function(x){return Number(x.capacityTB)||0;}).filter(Boolean).sort(function(a,b){return a-b;}):HDD_SIZES.slice();
  for(var i=0;i<sizes.length;i++){if(sizes[i]>=tb)return sizes[i];}
  return sizes.length?sizes[sizes.length-1]:12;
}

function buildBudget(){
  saveCurrentFloor();
  var allPlaced=[];
  FLOORS.forEach(function(fl){ allPlaced=allPlaced.concat(fl.placed); });

  var CAMTYPES=['dome','bullet','ptz','fisheye','turret','thermal_bi'];
  var cams=allPlaced.filter(function(p){var d=gD(p.libId);return d&&CAMTYPES.indexOf(d.type)>=0;});

  // Read cable price from input
  var cablePriceEl = document.getElementById('bgt-cable-price');
  if(cablePriceEl) BUDGET.cablePrice = parseFloat(cablePriceEl.value)||0;

  // ── SECTION: Cameras grouped by model ──
  var camGroups = {};
  allPlaced.forEach(function(p){
    var d=gD(p.libId); if(!d) return;
    if(CAMTYPES.indexOf(d.type)<0) return;
    var k=p.libId;
    if(!camGroups[k]) camGroups[k]={dev:d,count:0,libId:k};
    camGroups[k].count++;
  });

  var camSection = document.getElementById('budget-cams-section');
  if(camSection){
    var html = '<div style="padding:7px 9px;border-radius:7px;background:var(--bg2);border:1px solid var(--bdr2)">';
    html += '<div style="font-size:10px;font-weight:700;color:var(--txt2);margin-bottom:7px;letter-spacing:.5px">📷 CÂMARAS</div>';
    if(!Object.keys(camGroups).length){
      html += '<div style="font-size:11px;color:var(--txt3)">Sem câmaras no projeto.</div>';
    } else {
      Object.keys(camGroups).forEach(function(k){
        var g=camGroups[k];
        var savedPrice = BUDGET.prices[k]||0;
        html += '<div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--bdr)">';
        html += '<div style="font-size:11px;font-weight:600;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:1px">'+(g.dev.model||g.dev.name)+'</div>';
        html += '<div style="font-size:9px;color:var(--txt3);font-family:var(--m);margin-bottom:4px">Qtd: <b style="color:var(--acc)">'+g.count+'</b> unidade'+(g.count!==1?'s':'')+'</div>';
        html += '<div class="fr" style="margin-bottom:2px">';
        html += '<span class="fl">P. unitário</span>';
        html += '<input class="fi" type="number" min="0" step="0.01" value="'+savedPrice+'" style="text-align:right"';
        html += ' oninput="BUDGET.prices[\''+k+'\']=parseFloat(this.value)||0;_refreshBudgetTotals()" placeholder="0.00">';
        html += '<span style="font-size:10px;color:var(--txt3);margin-left:3px;flex-shrink:0">€</span>';
        html += '</div>';
        var subtotal = savedPrice * g.count;
        html += '<div style="font-size:10px;color:var(--txt3);text-align:right;font-family:var(--m)" id="cam-sub-'+k+'">';
        html += g.count+' × '+savedPrice.toFixed(2)+'€ = <b style="color:var(--acc3)">'+subtotal.toFixed(2)+'€</b></div>';
        html += '</div>';
      });
    }
    html += '</div>';
    camSection.innerHTML = html;
  }

  // ── SECTION: HDD ──
  var totalGB=0;
  cams.forEach(function(p){totalGB+=calcStorage(p.mp||4,p.codec||'ultra265b',p.days||30,p).gb;});
  var hddTB = nearestHDD(totalGB);
  BUDGET.hddSize = hddTB;
  var hddSection = document.getElementById('budget-hdd-section');
  if(hddSection){
    var savedHDD = BUDGET.hddPrice||0;
    var html2 = '<div style="padding:7px 9px;border-radius:7px;background:var(--bg2);border:1px solid var(--bdr2)">';
    html2 += '<div style="font-size:10px;font-weight:700;color:var(--txt2);margin-bottom:7px;letter-spacing:.5px">💾 DISCO HDD</div>';
    if(!cams.length){
      html2 += '<div style="font-size:11px;color:var(--txt3)">Sem câmaras — sem cálculo de disco.</div>';
    } else {
      html2 += '<div style="font-size:10px;color:var(--txt3);margin-bottom:6px">Necessário: <b style="color:var(--acc4);font-family:var(--m)">'+fmtGB(totalGB)+'</b>';
      html2 += ' → Recomendado: <b style="color:var(--acc4);font-family:var(--m)">'+hddTB+'TB</b></div>';
      html2 += '<div class="fr" style="margin-bottom:5px"><span class="fl">Tamanho</span>';
      html2 += '<select class="fi" id="bgt-hdd-size" onchange="BUDGET.hddSize=+this.value;_refreshBudgetTotals()">';
      HDD_SIZES.forEach(function(s){
        html2 += '<option value="'+s+'"'+(s===hddTB?' selected':'')+'>'+s+' TB</option>';
      });
      html2 += '</select></div>';
      html2 += '<div class="fr"><span class="fl">Preço disco</span>';
      html2 += '<input class="fi" id="bgt-hdd-price" type="number" min="0" step="0.01" value="'+savedHDD+'" style="text-align:right"';
      html2 += ' oninput="BUDGET.hddPrice=parseFloat(this.value)||0;_refreshBudgetTotals()" placeholder="0.00">';
      html2 += '<span style="font-size:10px;color:var(--txt3);margin-left:3px;flex-shrink:0">€</span></div>';
    }
    html2 += '</div>';
    hddSection.innerHTML = html2;
  }

  // ── SECTION: NVR + Switch + other non-cam devices ──
  var nonCamGroups = {};
  allPlaced.forEach(function(p){
    var d=gD(p.libId); if(!d) return;
    if(CAMTYPES.indexOf(d.type)>=0) return;
    var k=p.libId;
    if(!nonCamGroups[k]) nonCamGroups[k]={dev:d,count:0,libId:k};
    nonCamGroups[k].count++;
  });

  var sysSection = document.getElementById('budget-system-section');
  if(sysSection){
    var html3 = '<div style="padding:7px 9px;border-radius:7px;background:var(--bg2);border:1px solid var(--bdr2)">';
    html3 += '<div style="font-size:10px;font-weight:700;color:var(--txt2);margin-bottom:7px;letter-spacing:.5px">🖥 SISTEMA (NVR · SWITCH)</div>';

    if(cams.length){
      var totalBW2=0,maxMP2=0;
      cams.forEach(function(p){var mp=p.mp||4,codec=p.codec||'ultra265b';var br=cameraNetworkMbps(p);totalBW2+=br;if(mp>maxMP2)maxMP2=mp;});
      var nvrMatch=suggestNVR(cams.length,maxMP2,totalBW2);
      var poe=calcPoE(cams);
      var systemItems=[
        nvrMatch[0]?{key:'__nvr__',label:'NVR — '+nvrMatch[0].name,hint:nvrMatch[0].brand+' · '+nvrMatch[0].ch+'ch · '+nvrMatch[0].hdd+' HDD'}:null,
        poe.suggested[0]?{key:'__switch__',label:'Switch PoE — '+poe.suggested[0].name,hint:poe.suggested[0].budget+'W · '+poe.suggested[0].ports+' portas · uplink '+poe.uplink.name}:null,
      ].filter(Boolean);
      systemItems.forEach(function(item){
        var saved=BUDGET.prices[item.key]||0;
        html3 += '<div style="margin-bottom:7px;padding-bottom:7px;border-bottom:1px solid var(--bdr)">';
        html3 += '<div style="font-size:11px;font-weight:600;color:var(--txt);margin-bottom:1px">'+item.label+'</div>';
        html3 += '<div style="font-size:9px;color:var(--txt3);font-family:var(--m);margin-bottom:4px">'+item.hint+'</div>';
        html3 += '<div class="fr"><span class="fl">Preço unit.</span>';
        html3 += '<input class="fi" type="number" min="0" step="0.01" value="'+saved+'" style="text-align:right"';
        html3 += ' oninput="BUDGET.prices[\''+item.key+'\']=parseFloat(this.value)||0;_refreshBudgetTotals()" placeholder="0.00">';
        html3 += '<span style="font-size:10px;color:var(--txt3);margin-left:3px;flex-shrink:0">€</span></div></div>';
      });
    }

    Object.keys(nonCamGroups).forEach(function(k){
      var g=nonCamGroups[k];
      var saved=BUDGET.prices[k]||0;
      html3 += '<div style="margin-bottom:7px;padding-bottom:7px;border-bottom:1px solid var(--bdr)">';
      html3 += '<div style="font-size:11px;font-weight:600;color:var(--txt);margin-bottom:1px">'+(g.dev.model||g.dev.name)+'</div>';
      html3 += '<div style="font-size:9px;color:var(--txt3);font-family:var(--m);margin-bottom:4px">'+g.dev.type+' · Qtd: <b style="color:var(--acc)">'+g.count+'</b></div>';
      html3 += '<div class="fr"><span class="fl">Preço unit.</span>';
      html3 += '<input class="fi" type="number" min="0" step="0.01" value="'+saved+'" style="text-align:right"';
      html3 += ' oninput="BUDGET.prices[\''+k+'\']=parseFloat(this.value)||0;_refreshBudgetTotals()" placeholder="0.00">';
      html3 += '<span style="font-size:10px;color:var(--txt3);margin-left:3px;flex-shrink:0">€</span></div></div>';
    });

    if(!cams.length && !Object.keys(nonCamGroups).length){
      html3 += '<div style="font-size:11px;color:var(--txt3)">Sem dispositivos no projeto.</div>';
    }
    html3 += '</div>';
    sysSection.innerHTML = html3;
  }

  _refreshBudgetTotals();
}

function _refreshBudgetTotals(){
  saveCurrentFloor();
  var allPlaced=[];
  FLOORS.forEach(function(fl){ allPlaced=allPlaced.concat(fl.placed); });
  var CAMTYPES=['dome','bullet','ptz','fisheye','turret','thermal_bi'];
  var cams=allPlaced.filter(function(p){var d=gD(p.libId);return d&&CAMTYPES.indexOf(d.type)>=0;});

  // Cable
  var cableM=0;
  if(S.scale.ok && NVR_POS){
    allPlaced.forEach(function(p){var cd=cableForCam(p);if(cd)cableM+=cd.cable;});
  }
  var cablePrice = parseFloat((document.getElementById('bgt-cable-price')||{}).value)||BUDGET.cablePrice||0;
  var cableTotal = cableM * cablePrice;
  var cableLine = document.getElementById('budget-cable-line');
  if(cableLine){
    if(!S.scale.ok || !NVR_POS){
      cableLine.innerHTML='<span style="color:var(--txt3);font-size:10px">'+(!S.scale.ok?'Defina escala para calcular cabo.':'Defina posição NVR.')+'</span>';
    } else {
      cableLine.innerHTML='<span style="font-family:var(--m);font-size:11px">'+cableM.toFixed(0)+'m × '+cablePrice.toFixed(2)+'€/m = <b style="color:var(--acc3)">'+cableTotal.toFixed(2)+'€</b></span>';
    }
  }

  // Camera subtotal labels
  var camGroups={};
  allPlaced.forEach(function(p){var d=gD(p.libId);if(!d||CAMTYPES.indexOf(d.type)<0)return;var k=p.libId;if(!camGroups[k])camGroups[k]={count:0};camGroups[k].count++;});
  Object.keys(camGroups).forEach(function(k){
    var el=document.getElementById('cam-sub-'+k); if(!el)return;
    var price=BUDGET.prices[k]||0, count=camGroups[k].count;
    el.innerHTML=count+' × '+price.toFixed(2)+'€ = <b style="color:var(--acc3)">'+( price*count).toFixed(2)+'€</b>';
  });

  // Grand total
  var sub=0;
  Object.keys(camGroups).forEach(function(k){sub+=(BUDGET.prices[k]||0)*camGroups[k].count;});
  sub += BUDGET.hddPrice||0;
  sub += cableTotal;
  ['__nvr__','__switch__'].forEach(function(k){sub+=BUDGET.prices[k]||0;});
  var nonCamGroups={};
  allPlaced.forEach(function(p){var d=gD(p.libId);if(!d||CAMTYPES.indexOf(d.type)>=0)return;var k=p.libId;if(!nonCamGroups[k])nonCamGroups[k]={count:0};nonCamGroups[k].count++;});
  Object.keys(nonCamGroups).forEach(function(k){sub+=(BUDGET.prices[k]||0)*nonCamGroups[k].count;});

  var ivaRate=BUDGET.iva/100;
  var ivaVal=sub*ivaRate;
  var total=sub+ivaVal;

  var totalSection=document.getElementById('budget-total-section');
  if(totalSection){
    totalSection.innerHTML=
      '<div style="border-radius:8px;overflow:hidden;border:1px solid var(--bdr2)">'
      +'<div style="display:flex;justify-content:space-between;padding:7px 10px;background:var(--bg2)">'
        +'<span style="font-size:11px;color:var(--txt2)">Subtotal s/ IVA</span>'
        +'<span style="font-family:var(--m);font-size:12px;font-weight:700;color:var(--txt)">'+sub.toFixed(2)+' €</span>'
      +'</div>'
      +'<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--bg2);border-top:1px solid var(--bdr)">'
        +'<div style="display:flex;align-items:center;gap:5px">'
          +'<span style="font-size:11px;color:var(--txt2)">IVA</span>'
          +'<input type="number" min="0" max="99" value="'+BUDGET.iva+'" style="width:38px;padding:2px 4px;background:var(--bg3);border:1px solid var(--bdr2);border-radius:4px;color:var(--txt2);font-size:10px;font-family:var(--m);text-align:right" oninput="BUDGET.iva=+this.value;_refreshBudgetTotals()">'
          +'<span style="font-size:10px;color:var(--txt3)">%</span>'
        +'</div>'
        +'<span style="font-family:var(--m);font-size:11px;color:var(--txt2)">'+ivaVal.toFixed(2)+' €</span>'
      +'</div>'
      +'<div style="display:flex;justify-content:space-between;padding:10px;background:rgba(59,130,246,.08);border-top:1px solid rgba(59,130,246,.2)">'
        +'<span style="font-size:14px;font-weight:800;color:var(--txt);font-family:var(--h)">TOTAL c/ IVA</span>'
        +'<span style="font-family:var(--m);font-size:15px;font-weight:700;color:var(--acc)">'+total.toFixed(2)+' €</span>'
      +'</div>'
      +'</div>';
  }
}

// BOM — BILL OF MATERIALS
// ════════════════════════════════════════
function openBOM(){
  saveCurrentFloor();
  var allPlaced = [];
  FLOORS.forEach(function(fl){ allPlaced = allPlaced.concat(fl.placed); });

  var CAMTYPES=['dome','bullet','ptz','fisheye','turret','thermal_bi'];
  var cams = allPlaced.filter(function(p){var d=gD(p.libId);return d&&CAMTYPES.indexOf(d.type)>=0;});

  // Group placed devices by libId
  var groups = {};
  allPlaced.forEach(function(p){
    var dev = gD(p.libId); if(!dev) return;
    var key = p.libId;
    if(!groups[key]) groups[key] = {dev:dev, items:[], labels:[]};
    groups[key].items.push(p);
    groups[key].labels.push(p.label);
  });

  var rows = Object.values(groups).sort(function(a,b){ return b.items.length - a.items.length; });

  // System extras
  var extraRows = [];
  if(cams.length){
    var totalBW=0,maxMP=0,totalGB=0;
    cams.forEach(function(p){var mp=p.mp||4,codec=p.codec||'ultra265b',days=p.days||30;var br=cameraNetworkMbps(p);totalBW+=br;totalGB+=calcStorage(mp,codec,days,p).gb;if(mp>maxMP)maxMP=mp;});
    var nvr=suggestNVR(cams.length,maxMP,totalBW);
    var poe=calcPoE(cams);
    var hddTB=nearestHDD(totalGB);
    if(nvr[0]) extraRows.push({ref:nvr[0].name, name:'NVR Recomendado', type:'nvr', qty:1, note:nvr[0].brand+' · '+nvr[0].ch+'ch · '+nvr[0].hdd+' HDD'});
    if(poe.suggested[0]) extraRows.push({ref:poe.suggested[0].name, name:'Switch PoE', type:'switch', qty:1, note:poe.suggested[0].budget+'W · '+poe.suggested[0].ports+' portas'});
    extraRows.push({ref:sigsHddCatalogRef(hddTB), name:'Disco de Armazenamento', type:'hdd', qty:1, note:fmtGB(totalGB)+' necessários → '+hddTB+'TB'});
    // Cabo de rede — SEMPRE presente para orçamentar (€/m)
    var totalCable=0, cableEst=false;
    if(S.scale.ok && NVR_POS){ allPlaced.forEach(function(p){var cd=cableForCam(p);if(cd)totalCable+=cd.cable;}); }
    if(totalCable<=0){ totalCable=cams.length*15; cableEst=true; }
    extraRows.push({ref:'Cabo UTP Cat6', name:'Cabo de Rede (UTP Cat6)', type:'cabo', qty:Math.max(1,Math.ceil(totalCable)), note: cableEst ? '≈15 m/câmara (estimativa)' : totalCable.toFixed(0)+' m (traçado)'});
  }

  var total = allPlaced.length;
  document.getElementById('bom-summary').textContent =
    total + ' dispositivo(s) em ' + FLOORS.length + ' piso(s)  ·  ' + rows.length + ' referência(s)' +
    (extraRows.length ? '  ·  +' + extraRows.length + ' itens de sistema' : '');

  // Unified rows (devices + system/infra) for pricing
  _bomRows = [];
  rows.forEach(function(g){ _bomRows.push({ref:(g.dev.model||g.dev.name), name:g.dev.name, type:g.dev.type||'—', qty:g.items.length, unit:'', system:false}); });
  extraRows.forEach(function(r){ _bomRows.push({ref:r.ref, name:r.name, type:r.type, qty:r.qty, unit:(r.type==='cabo'?'m':''), system:true}); });

  var tbody = document.getElementById('bom-tbody');
  if(!_bomRows.length){
    tbody.innerHTML='<tr><td colspan="6" style="padding:24px;text-align:center;color:var(--txt3)">Nenhum dispositivo colocado</td></tr>';
    document.getElementById('bom-tfoot').innerHTML='';
    openM('m-bom'); return;
  }
  tbody.innerHTML = _bomRows.map(function(r,i){
    var bg = r.system ? (i%2?'rgba(59,130,246,.06)':'rgba(59,130,246,.03)') : (i%2?'rgba(255,255,255,.02)':'transparent');
    var refColor = r.system ? 'var(--acc4)' : 'var(--acc)';
    var price = bomGetPrice(r.ref);
    return '<tr data-ref="'+esc(r.ref)+'" style="border-bottom:1px solid var(--bdr);background:'+bg+'">' +
      '<td style="padding:7px 8px;font-family:var(--m);font-size:11px;color:'+refColor+';white-space:nowrap">'+esc(r.ref)+'</td>' +
      '<td style="padding:7px 8px;font-weight:600;color:var(--txt)">'+esc(r.name)+'</td>' +
      '<td style="padding:7px 8px;font-size:11px;color:var(--txt2)">'+esc(r.type)+'</td>' +
      '<td style="padding:7px 8px;text-align:center;font-family:var(--m);font-weight:700;color:var(--acc3)">'+r.qty+(r.unit?' '+r.unit:'')+'</td>' +
      '<td style="padding:7px 8px;text-align:right"><input type="number" min="0" step="0.01" value="'+(price||'')+'" placeholder="0.00" oninput="bomSetPrice(\''+escAttr(r.ref)+'\',this.value)" style="width:74px;padding:3px 5px;text-align:right;font-family:var(--m);font-size:11px;background:var(--bg2);border:1px solid var(--bdr2);border-radius:4px;color:var(--txt)"></td>' +
      '<td class="bom-rowtotal" style="padding:7px 8px;text-align:right;font-family:var(--m);font-size:11px;color:var(--txt)">—</td>' +
    '</tr>';
  }).join('');

  bomRecalc();
  openM('m-bom');
}

// ── Preços / orçamento (BOM) ──
var SIGS_PRICES = {}; try{ SIGS_PRICES = JSON.parse(localStorage.getItem('sigs_prices')||'{}'); }catch(e){ SIGS_PRICES={}; }
var _bomRows = [];
function escAttr(s){ return (s||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'"); }
function eur(n){ return '€ '+(+n||0).toLocaleString('pt-PT',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function bomGetPrice(ref){ var v=SIGS_PRICES[ref]; return (v===undefined||v===null||v==='')?0:+v; }
function bomSetPrice(ref,val){
  var n=parseFloat(val);
  if(isNaN(n)||n<0){ delete SIGS_PRICES[ref]; } else { SIGS_PRICES[ref]=n; }
  try{ localStorage.setItem('sigs_prices',JSON.stringify(SIGS_PRICES)); }catch(e){}
  bomRecalc();
}
function bomTotals(){
  var sub=0;
  _bomRows.forEach(function(r){ sub += bomGetPrice(r.ref)*r.qty; });
  var margin=parseFloat((document.getElementById('bom-margin')||{}).value)||0;
  var ivaOn=document.getElementById('bom-iva') && document.getElementById('bom-iva').checked;
  var withMargin=sub*(1+margin/100);
  var ivaVal=ivaOn?withMargin*0.23:0;
  return {sub:sub, margin:margin, marginVal:withMargin-sub, ivaOn:ivaOn, ivaVal:ivaVal, grand:withMargin+ivaVal};
}
function bomRecalc(){
  var trs=document.querySelectorAll('#bom-tbody tr[data-ref]');
  _bomRows.forEach(function(r,i){
    var price=bomGetPrice(r.ref), lineTotal=price*r.qty, tr=trs[i];
    if(tr){ var c=tr.querySelector('.bom-rowtotal'); if(c) c.textContent = price>0 ? eur(lineTotal) : '—'; }
  });
  var t=bomTotals(), tf=document.getElementById('bom-tfoot'); if(!tf) return;
  tf.innerHTML =
    '<tr><td colspan="4"></td><td style="padding:6px 8px;text-align:right;font-size:10px;color:var(--txt3)">Subtotal (custo)</td><td style="padding:6px 8px;text-align:right;font-family:var(--m);font-size:11px;color:var(--txt2)">'+eur(t.sub)+'</td></tr>' +
    (t.margin>0?'<tr><td colspan="4"></td><td style="padding:4px 8px;text-align:right;font-size:10px;color:var(--txt3)">+ Margem '+t.margin+'%</td><td style="padding:4px 8px;text-align:right;font-family:var(--m);font-size:11px;color:var(--acc3)">'+eur(t.marginVal)+'</td></tr>':'') +
    (t.ivaOn?'<tr><td colspan="4"></td><td style="padding:4px 8px;text-align:right;font-size:10px;color:var(--txt3)">+ IVA 23%</td><td style="padding:4px 8px;text-align:right;font-family:var(--m);font-size:11px;color:var(--txt2)">'+eur(t.ivaVal)+'</td></tr>':'') +
    '<tr style="border-top:2px solid var(--bdr2)"><td colspan="4"></td><td style="padding:7px 8px;text-align:right;font-size:11px;font-weight:700;color:var(--txt)">TOTAL'+(t.ivaOn?' c/IVA':'')+'</td><td style="padding:7px 8px;text-align:right;font-family:var(--m);font-size:13px;font-weight:800;color:var(--acc)">'+eur(t.grand)+'</td></tr>';
}

function exportBOM(fmt){
  if(!_bomRows.length){ notify('Abra o BOM primeiro'); return; }
  var t=bomTotals();
  var txt;
  if(fmt==='csv'){
    txt='Referencia,Descricao,Tipo,Quantidade,Preco unit (EUR),Total (EUR)\n';
    _bomRows.forEach(function(r){
      var pu=bomGetPrice(r.ref), lt=pu*r.qty;
      txt+='"'+r.ref+'","'+r.name+'","'+r.type+'",'+r.qty+(r.unit?(' '+r.unit):'')+','+pu.toFixed(2)+','+lt.toFixed(2)+'\n';
    });
    txt+=',,,,Subtotal,'+t.sub.toFixed(2)+'\n';
    if(t.margin>0) txt+=',,,,Margem '+t.margin+'%,'+t.marginVal.toFixed(2)+'\n';
    if(t.ivaOn)    txt+=',,,,IVA 23%,'+t.ivaVal.toFixed(2)+'\n';
    txt+=',,,,TOTAL'+(t.ivaOn?' c/IVA':'')+','+t.grand.toFixed(2)+'\n';
  } else {
    txt='ORÇAMENTO / BOM — '+MOD.toUpperCase()+'\n'+'='.repeat(60)+'\n\n';
    _bomRows.forEach(function(r){
      var pu=bomGetPrice(r.ref), lt=pu*r.qty;
      txt+='Ref:  '+r.ref+'\nNome: '+r.name+'\nTipo: '+r.type+'\nQtd:  '+r.qty+(r.unit?(' '+r.unit):'')+'\n';
      txt+='Preço unit: '+eur(pu)+'   Total linha: '+eur(lt)+'\n'+'-'.repeat(40)+'\n';
    });
    txt+='\nSubtotal (custo): '+eur(t.sub)+'\n';
    if(t.margin>0) txt+='Margem '+t.margin+'%: '+eur(t.marginVal)+'\n';
    if(t.ivaOn)    txt+='IVA 23%: '+eur(t.ivaVal)+'\n';
    txt+='TOTAL'+(t.ivaOn?' c/IVA':'')+': '+eur(t.grand)+'\n';
  }
  var blob=new Blob([txt],{type:fmt==='csv'?'text/csv':'text/plain'});
  var a=document.createElement('a'); a.href=URL.createObjectURL(blob);
  a.download='orcamento_'+MOD+'.'+(fmt==='csv'?'csv':'txt'); a.click();
  notify('Orçamento exportado!');
}

function esc(s){ var d=document.createElement('div');d.textContent=s||'';return d.innerHTML; }

// ════════════════════════════════════════
// NVR POSITION (for cable calculation)
// ════════════════════════════════════════
var NVR_POS = null; // {x, y} in world coords

function setNVRPosition(){
  S.tool = 'nvr';
  document.getElementById('hintbar').textContent = '📍 Clique no canvas para posicionar o NVR/Hub';
  document.getElementById('hintbar').classList.add('show');
  cw.style.cursor = 'crosshair';
}

// Hook into onClick to handle NVR placement
var _origOnClick = onClick;
onClick = function(e){
  if(S.tool === 'nvr'){
    var pos=ep(e), w=s2w(pos.x,pos.y);
    NVR_POS = {x:w.x, y:w.y};
    S.tool = null; cw.style.cursor = 'default';
    document.getElementById('hintbar').classList.remove('show');
    render(); updateCablePanel(); updateAllCableLabels(); updateProjSummary(); notify('📍 NVR/Hub posicionado');
    return;
  }
  _origOnClick(e);
};

// Draw NVR marker on canvas
var _origRender = render;
render = function(){
  _origRender();
  if(NVR_POS && S.layers.dev){
    var s=w2s(NVR_POS.x, NVR_POS.y);
    ctx.save();
    ctx.fillStyle='rgba(245,158,11,.9)';
    ctx.strokeStyle='rgba(245,158,11,1)';
    ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(s.x,s.y,10,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#000';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('NVR',s.x,s.y);
    ctx.restore();
    // Draw cable lines to all cameras — green dashed, visible
    // Skip cameras that have a manual route (those are drawn separately)
    if(S.scale.ok){
      S.placed.forEach(function(p){
        if(p.visible===false) return;
        if(p.cableRoute && p.cableRoute.length >= 2) return; // has manual route — skip auto line
        var cs=w2s(p.x,p.y);
        ctx.save();
        ctx.strokeStyle='rgba(239,68,68,.75)';
        ctx.lineWidth=2;
        ctx.setLineDash([10,5]);
        ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(cs.x,cs.y);ctx.stroke();
        // Distance label at midpoint
        if(S.scale.ok){
          var cd=cableForCam(p);
          if(cd){
            var mx=(s.x+cs.x)/2, my=(s.y+cs.y)/2;
            ctx.setLineDash([]);
            ctx.font='bold 9px monospace';
            var lbl=cd.planDist.toFixed(1)+'m';
            var tw=ctx.measureText(lbl).width;
            ctx.fillStyle='rgba(0,0,0,.7)'; ctx.fillRect(mx-tw/2-3,my-9,tw+6,13);
            ctx.fillStyle='#ef4444'; ctx.textAlign='center'; ctx.textBaseline='middle';
            ctx.fillText(lbl,mx,my-2);
          }
        }
        ctx.restore();
      });
    }
  }
};

// ════════════════════════════════════════
// STORAGE CALCULATION
// ════════════════════════════════════════
// Bitrate table (Mbps) by MP and codec
// Legacy fallback estimates; canonical model: engineering-model-v39.js.
// Ultra 265 savings depend on the scene. These are planning scenarios, not official modes.
var BITRATE_TABLE = {
  h264:      {2:4,    4:8,    5:10,  8:16,   12:24  },  // H.264 — baseline
  h265:      {2:2,    4:4,    5:5,   8:8,    12:12  },  // H.265 planning estimate
  ultra265b: {2:1,    4:2,    5:2.5, 8:4,    12:6   },  // Ultra 265 Basic  — ~75% vs H.264
  ultra265a: {2:0.5,  4:1,    5:1.2, 8:2,    12:3   },  // Quiet-scene planning estimate
  ultra265m: {2:0.2, 4:0.4,  5:0.5, 8:0.8,    12:1.2 },  // Very quiet scene; verify measured bitrate
};

function calcStorage(mp, codec, days, settings){
  if(window.SIGSEngineeringModel)return SIGSEngineeringModel.storage(mp,codec,days,settings);
  var br = (BITRATE_TABLE[codec]||BITRATE_TABLE.h265)[mp] || 8; // Mbps
  // Storage = bitrate(Mbps) * 3600s * 24h * days / 8 (bits→bytes) / 1024^3 (→GB)
  var gb = br * 3600 * 24 * days / 8 / (1024*1024*1024) * 1e6;
  return {bitrate:br, gb:Math.ceil(gb)};
}

function codecLabel(codec){
  var labels={
    ultra265m:'Ultra 265 · cena muito calma (UNV)',
    ultra265a:'Ultra 265 · cena calma (UNV)',
    ultra265b:'Ultra 265 · cenário de projeto (UNV)',
    h265:'H.265',
    h264:'H.264'
  };
  return labels[codec]||codec.toUpperCase();
}
function fmtGB(gb){
  if(window.SIGSEngineeringModel)return SIGSEngineeringModel.displayStorage(gb);
  if(gb >= 1024) return (gb/1024).toFixed(1)+' TB';
  return gb+' GB';
}

function updateStoragePanel(){
  var pc=fP(S.selId); if(!pc) return;
  var mp    = pc.mp    || 8;
  var codec = pc.codec || 'h265';
  var days  = pc.days  || 30;
  var res   = calcStorage(mp, codec, days, pc);
  document.getElementById('stor-bitrate').textContent = res.bitrate+' Mbps';
  document.getElementById('stor-percam').textContent  = fmtGB(res.gb);
  // Total all cameras in project (all floors)
  saveCurrentFloor();
  var total = 0;
  FLOORS.forEach(function(fl){
    fl.placed.forEach(function(p){
      if(gD(p.libId) && gD(p.libId).type !== undefined){
        var dev=gD(p.libId);
        if(['dome','bullet','turret','ptz','fisheye','thermal_bi'].indexOf(dev.type)>=0){
          var r2=calcStorage(p.mp||4, p.codec||'ultra265b',p.days||30,p);
          total += r2.gb;
        }
      }
    });
  });
  document.getElementById('stor-total').textContent = fmtGB(total);
}

// ════════════════════════════════════════
// CABLE CALCULATION
// ════════════════════════════════════════
function distWorld(ax,ay,bx,by){
  return Math.sqrt((ax-bx)*(ax-bx)+(ay-by)*(ay-by));
}

function cableForCam(p){
  if(!NVR_POS || !S.scale.ok) return null;
  var planDist = distWorld(p.x,p.y,NVR_POS.x,NVR_POS.y) * S.scale.mpp; // metres on plan
  var height   = p.instHeight || 3; // camera installation height
  var cable    = planDist + height + 5; // plan dist + drop to floor + 5m slack
  return {planDist:planDist, cable:cable};
}

function updateCablePanel(){
  var pc=fP(S.selId); if(!pc) return;
  var cd = cableForCam(pc);
  if(!cd){
    document.getElementById('cable-dist').textContent = NVR_POS ? (S.scale.ok ? '—':'Defina escala') : 'Defina NVR';
    document.getElementById('cable-len').textContent  = '—';
  } else {
    document.getElementById('cable-dist').textContent = cd.planDist.toFixed(1)+' m';
    document.getElementById('cable-len').textContent  = cd.cable.toFixed(1)+' m';
  }
  // Total cable all cameras all floors
  saveCurrentFloor();
  var totalCable = 0, counted = 0;
  FLOORS.forEach(function(fl){
    fl.placed.forEach(function(p){
      var d=gD(p.libId); if(!d)return;
      var c2=cableForCam(p); if(!c2)return;
      totalCable+=c2.cable; counted++;
    });
  });
  document.getElementById('cable-total').textContent = counted ? totalCable.toFixed(0)+' m ('+counted+' câm.)' : '—';
}

function updateAllCableLabels(){ updateCablePanel(); }

// ════════════════════════════════════════
// NVR SUGGESTION
// ════════════════════════════════════════
var NVR_DB = [
  // Uniview — PRIORIDADE
  {name:'NVR301-08S3',   ch:8,  maxMP:8,  bw:80,  hdd:1, brand:'Uniview'},
  {name:'NVR301-16S3',   ch:16, maxMP:8,  bw:160, hdd:2, brand:'Uniview'},
  {name:'NVR301-32S3',   ch:32, maxMP:8,  bw:320, hdd:2, brand:'Uniview'},
  {name:'NVR504-32B',    ch:32, maxMP:12, bw:384, hdd:4, brand:'Uniview'},
  {name:'NVR504-64B',    ch:64, maxMP:12, bw:512, hdd:8, brand:'Uniview'},
  // Hikvision
  {name:'DS-7604NI-K1',  ch:4,  maxMP:8,  bw:40,  hdd:1, brand:'Hikvision'},
  {name:'DS-7608NI-K2',  ch:8,  maxMP:8,  bw:80,  hdd:2, brand:'Hikvision'},
  {name:'DS-7616NI-K2',  ch:16, maxMP:8,  bw:160, hdd:2, brand:'Hikvision'},
  {name:'DS-7632NI-K4',  ch:32, maxMP:8,  bw:256, hdd:4, brand:'Hikvision'},
  // Safire
  {name:'SF-NVR6108-4K', ch:8,  maxMP:12, bw:160, hdd:2, brand:'Safire'},
  {name:'SF-NVR6116-4K', ch:16, maxMP:12, bw:320, hdd:2, brand:'Safire'},
  {name:'SF-NVR6132-4K', ch:32, maxMP:12, bw:384, hdd:4, brand:'Safire'},
];

function suggestNVR(numCams, maxMP, totalBW){
  return NVR_DB.filter(function(n){
    return n.ch >= numCams && n.maxMP >= maxMP && n.bw >= totalBW;
  }).sort(function(a,b){
    var aU=a.brand==='Uniview'?0:1, bU=b.brand==='Uniview'?0:1;
    if(aU!==bU) return aU-bU;
    return a.ch-b.ch || a.bw-b.bw;
  });
}

// ════════════════════════════════════════
// SYSTEM TAB — NVR + Cable + Network Diagram
// ════════════════════════════════════════
function buildSystemTab(){
  saveCurrentFloor();
  var allPlaced=[];
  FLOORS.forEach(function(fl){ allPlaced=allPlaced.concat(fl.placed); });
  var cctvContent=document.getElementById('cctv-system-content');
  var specialtyContent=document.getElementById('specialty-system-summary');
  var isCCTV=MOD==='cctv';
  if(cctvContent)cctvContent.style.display=isCCTV?'flex':'none';
  if(specialtyContent)specialtyContent.style.display=isCCTV?'none':'block';
  if(!isCCTV){
    var centralType=MOD==='fire'?'fire_central':'hub';
    var devices=allPlaced.filter(function(p){return !!gD(p.libId);});
    var centrals=devices.filter(function(p){return gD(p.libId).type===centralType;});
    if(specialtyContent){
      specialtyContent.innerHTML='<div class="stl">'+(MOD==='fire'?'Sistema de incêndio':'Sistema de intrusão')+'</div>'+
        '<p style="font-size:12px;color:var(--txt2);line-height:1.8">'+centrals.length+' '+(centrals.length===1?'central':'centrais')+' · '+devices.length+' equipamentos no projeto</p>'+
        '<p style="font-size:11px;color:var(--txt3);line-height:1.8">'+
        (centrals.length?'Consulta o verificador técnico para rever a instalação e a lista de material para preparar o orçamento.':'Coloca uma central da biblioteca para começar a organizar este sistema.')+'</p>'+
        '<button class="btn ba bsm bfw" onclick="buildSystemTab()">↺ Atualizar</button>';
    }
    return;
  }
  var CAMTYPES=['dome','bullet','ptz','fisheye','turret','thermal_bi'];
  var cams=allPlaced.filter(function(p){ var d=gD(p.libId);return d&&CAMTYPES.indexOf(d.type)>=0; });
  var numCams=cams.length;

  var totalBW=0, totalGB=0, maxMP=0, defDays=30;
  cams.forEach(function(p){
    var mp=p.mp||4, codec=p.codec||'ultra265b', days=p.days||defDays;
    var br=cameraNetworkMbps(p);
    totalBW+=br; totalGB+=calcStorage(mp,codec,days,p).gb;
    if(mp>maxMP)maxMP=mp;
  });

  // ── NVR Suggestion ──
  var nvrEl=document.getElementById('nvr-suggestion');
  if(nvrEl){
    if(!numCams){
      nvrEl.innerHTML='<p style="font-size:11px;color:var(--txt3)">Nenhuma câmara no projeto.</p>';
    } else {
      var matches=suggestNVR(numCams,maxMP,totalBW);
      var top=matches.slice(0,3);
      var html='<div style="font-size:11px;color:var(--txt2);margin-bottom:8px;padding:6px 8px;background:var(--bg3);border-radius:5px">'+
        '<b>'+numCams+'</b> câm · <b>'+totalBW.toFixed(1)+'</b> Mbps · 💾 <b>'+fmtGB(totalGB)+'</b></div>';
      if(!top.length){
        html+='<div style="font-size:11px;color:var(--acc2);padding:8px;background:rgba(239,68,68,.07);border-radius:5px;border:1px solid rgba(239,68,68,.2)">⚠ Nenhum NVR encontrado.</div>';
      } else {
        html+=top.map(function(n,i){
          var best=i===0;
          return '<div style="padding:7px 9px;border-radius:6px;border:1px solid '+(best?'rgba(59,130,246,.4)':'var(--bdr2)')+';background:'+(best?'rgba(59,130,246,.08)':'var(--bg3)')+';margin-bottom:4px">'+
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">'+
              '<span style="font-family:var(--m);font-size:11px;font-weight:700;color:'+(best?'var(--acc)':'var(--txt)')+'">'+n.name+'</span>'+
              (best?'<span style="font-size:8px;background:rgba(59,130,246,.18);color:var(--acc);padding:1px 6px;border-radius:8px">✓</span>':'')+'</div>'+
            '<div style="font-size:9px;color:var(--txt3);font-family:var(--m)">'+n.brand+' · '+n.ch+'ch · '+n.maxMP+'MP · '+n.bw+'Mbps · '+n.hdd+' HDD</div>'+
          '</div>';
        }).join('');
      }
      nvrEl.innerHTML=html;
    }
  }

  // ── Network Diagram ──
  buildNetworkDiagram(cams);

  // ── PoE ──
  buildPoESection(cams);

  // ── Cable summary ──
  var cableEl=document.getElementById('cable-summary');
  if(cableEl){
    if(!NVR_POS||!S.scale.ok){
      cableEl.innerHTML='<div style="font-size:11px;color:var(--txt3);padding:6px 8px;background:var(--bg3);border-radius:5px">'+(NVR_POS?'Defina escala.':'Defina posição NVR/Hub nas props de uma câmara.')+'</div>';
    } else {
      var totalCable=0;
      var rows=allPlaced.map(function(p){
        var d=gD(p.libId); if(!d)return '';
        var cd=cableForCam(p); if(!cd)return '';
        totalCable+=cd.cable;
        return '<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--bdr)">'+
          '<span style="font-family:var(--m);font-size:10px;color:var(--txt2)">'+p.label+'</span>'+
          '<span style="font-family:var(--m);font-size:10px;font-weight:600;color:var(--acc3)">'+cd.cable.toFixed(1)+'m</span></div>';
      }).join('');
      cableEl.innerHTML='<div style="margin-bottom:6px">'+rows+'</div>'+
        '<div style="display:flex;justify-content:space-between;padding:5px 8px;background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.2);border-radius:5px">'+
          '<span style="font-size:11px;color:var(--txt2)">Total cabo</span>'+
          '<span style="font-family:var(--m);font-weight:700;color:var(--acc3)">'+totalCable.toFixed(0)+' m</span></div>';
    }
  }
}

function buildNetworkDiagram(cams){
  var el=document.getElementById('net-diagram');
  if(!el)return;

  // Use a wider, proper HTML/CSS diagram instead of SVG (emoji + font issues in SVG)
  var numCams=cams.length;
  var poeData=calcPoE(cams);
  var poePort=Math.max(8,poeData.requiredPorts<=8?8:poeData.requiredPorts<=16?16:poeData.requiredPorts<=24?24:48);
  var nvrModel='';
  var totalBW=poeData.totalBW;
  if(numCams>0){var nm=suggestNVR(numCams,8,totalBW);if(nm[0])nvrModel=nm[0].name;}

  var camStyle='display:inline-flex;flex-direction:column;align-items:center;gap:2px;margin:3px 4px;';
  var nodeBox='padding:3px 6px;border-radius:5px;font-size:9px;font-weight:700;font-family:monospace;text-align:center;';

  // Build camera grid HTML
  var camHTML='';
  var displayCams=numCams>0?cams:[{label:'CAM01',mp:8},{label:'CAM02',mp:8}];
  displayCams.forEach(function(p){
    var dev=p.libId?gD(p.libId):null;
    var icon=dev?({dome:'◉',bullet:'▬',ptz:'⊕',fisheye:'◎'}[dev.type]||'◉'):'◉';
    var col=p.color||(dev?dev.color:'#3b82f6');
    var mp=p.mp||4;
    camHTML+='<div style="'+camStyle+'">'
      +'<div style="width:32px;height:28px;border-radius:6px;background:rgba(59,130,246,.12);border:1.5px solid #3b82f6;display:flex;align-items:center;justify-content:center;font-size:14px;color:'+col+'">'+icon+'</div>'
      +'<div style="font-size:7px;color:rgba(100,140,255,.8);font-family:monospace;max-width:32px;text-align:center;line-height:1.1">'+p.label+'</div>'
      +'<div style="font-size:6px;padding:0 3px;border-radius:2px;background:rgba(139,92,246,.2);color:#a78bfa;font-family:monospace">'+mp+'MP</div>'
      +'</div>';
  });

  el.innerHTML=
    '<div style="padding:10px 8px;font-size:11px;">'+
    // Cameras row
    '<div style="display:flex;flex-wrap:wrap;justify-content:center;padding:4px 0 2px;border-bottom:1px dashed rgba(59,130,246,.2);margin-bottom:4px">'+camHTML+'</div>'+
    // Connector lines hint
    '<div style="text-align:center;color:rgba(59,130,246,.3);font-size:9px;margin-bottom:4px">│ │ │ Cabo UTP/STP</div>'+
    // Switch row
    '<div style="display:flex;justify-content:center;margin-bottom:4px">'+
      '<div style="'+nodeBox+'background:rgba(16,185,129,.1);border:1.5px solid #10b981;color:#10b981;min-width:120px">'+
        'PoE SWITCH<br>'+
        '<span style="font-weight:400;color:rgba(16,185,129,.6);font-size:7px">'+poePort+' portas · '+poeData.totalWithMargin+'W · '+totalBW.toFixed(0)+' Mbps</span>'+
      '</div>'+
    '</div>'+
    // Connector
    '<div style="text-align:center;color:rgba(245,158,11,.55);font-size:9px;margin-bottom:4px">│ Uplink '+poeData.uplink.name+'</div>'+
    // NVR row
    '<div style="display:flex;justify-content:center;margin-bottom:4px">'+
      '<div style="'+nodeBox+'background:rgba(245,158,11,.1);border:1.5px solid #f59e0b;color:#f59e0b;min-width:140px">'+
        'NVR<br>'+
        '<span style="font-weight:400;color:rgba(245,158,11,.6);font-size:7px">'+(nvrModel||numCams+' canais')+'</span>'+
      '</div>'+
    '</div>'+
    // Footer info
    '<div style="margin-top:6px;font-size:9px;color:var(--txt3);text-align:center;font-family:monospace">'+
      numCams+' câm · '+FLOORS.length+' piso(s) · '+totalBW.toFixed(1)+' Mbps BW'+
    '</div>'+
    '</div>';
}

// ════════════════════════════════════════
// HOOK storage+cable into syncP and updP
// ════════════════════════════════════════
var _origSyncP=syncP;
syncP=function(){
  _origSyncP();
  var pc=fP(S.selId); if(!pc)return;
  var dev=gD(pc.libId);
  var isCCTV=MOD==='cctv'&&dev&&['dome','bullet','ptz','fisheye'].indexOf(dev.type)>=0;
  var storPanel=document.getElementById('cctv-storage');
  var cablePanel=document.getElementById('cctv-cable');
  if(storPanel)storPanel.style.display=isCCTV?'':'none';
  if(cablePanel)cablePanel.style.display=isCCTV?'':'none';
  if(isCCTV){
    // Populate storage fields
    document.getElementById('p-mp').value=pc.mp||4;
    document.getElementById('p-codec').value=pc.codec||'ultra265b';
    document.getElementById('p-days').value=pc.days||30;
    document.getElementById('p-height').value=pc.instHeight||3;
    updateStoragePanel();
    updateCablePanel();
  }
};

var _origUpdP=updP;
updP=function(key,val){
  _origUpdP(key,val);
  if(key==='mp'||key==='codec'||key==='days'){
    var pc=fP(S.selId);if(pc)pc[key]=val;
    updateStoragePanel();
  }
  if(key==='instHeight'){
    var pc2=fP(S.selId);if(pc2)pc2.instHeight=val;
    updateCablePanel();
    // Sync the install panel height field and recalc blind spot
    var hEl2=document.getElementById('p-instH');
    if(hEl2) hEl2.value=val;
    var tEl2=document.getElementById('p-tilt');
    if(tEl2) _calcBlindSpot(val, parseFloat(tEl2.value)||30);
  }
};

// Hook tab switch to auto-build system tab
var _origTab=tab;
tab=function(t){
  _origTab(t);
  if(t==='system') setTimeout(buildSystemTab,0);
  if(t==='budget') setTimeout(buildBudget,0);
};

// ════════════════════════════════════════
// MULTI-SELECT HELPERS
// ════════════════════════════════════════
// ════════════════════════════════════════
// QUICK MULTI-SELECT PANEL
// ════════════════════════════════════════
function toggleQuickSel(){
  var panel=document.getElementById('quick-sel-panel');
  var btn=document.getElementById('qs-toggle-btn');
  var visible=panel.style.display!=='none'&&panel.style.display!=='';
  panel.style.display=visible?'none':'flex';
  btn.classList.toggle('on',!visible);
  if(!visible) buildQsTypeBtns();
}

function buildQsTypeBtns(){
  var container=document.getElementById('qs-type-btns');
  if(!container)return;
  // Count placed devices by type
  var counts={};
  S.placed.forEach(function(p){
    var d=gD(p.libId);if(!d)return;
    counts[d.type]=(counts[d.type]||0)+1;
  });
  var typeLabels={dome:'Dome',bullet:'Bullet',ptz:'PTZ',fisheye:'Fisheye',
    hub:'Hub',pir_indoor:'PIR Int',pir_outdoor:'PIR Ext',door:'Porta',
    glass:'Vidro',combi:'Combi',siren_ext:'Sirene Ext',siren_int:'Sirene Int',
    keypad:'Teclado',remote:'Botão',relay:'Relé'};
  var typeColors={dome:'#3b82f6',bullet:'#f59e0b',ptz:'#8b5cf6',fisheye:'#10b981',turret:'#10b981',
    hub:'#e83040',pir_indoor:'#f09000',pir_outdoor:'#ff6020',door:'#3b82f6'};
  container.innerHTML='';
  Object.keys(counts).forEach(function(type){
    var n=counts[type];
    var lbl=typeLabels[type]||type;
    var col=typeColors[type]||'#6b7280';
    var btn=document.createElement('button');
    btn.style.cssText='padding:3px 8px;border-radius:12px;background:rgba(0,0,0,.2);border:1px solid '+col+';color:'+col+';font-size:9px;font-weight:700;cursor:pointer;font-family:var(--f);transition:all .15s';
    btn.textContent=lbl+' ('+n+')';
    btn.title='Selecionar todos os '+lbl;
    btn.onclick=function(){
      var hits=S.placed.filter(function(p){var d=gD(p.libId);return d&&d.type===type;});
      S.multiSel=hits.map(function(p){return p.id;});
      S.selId=S.multiSel[S.multiSel.length-1]||null;
      updateMultiSelPanel();
      if(S.selId){tab('props');}
      render();
      document.getElementById('qs-info').textContent=lbl+': '+n+' selecionados';
    };
    container.appendChild(btn);
  });
  if(!Object.keys(counts).length){
    container.innerHTML='<span style="font-size:10px;color:var(--txt3)">Sem dispositivos na planta</span>';
  }
}

function qsSelectAll(){
  S.multiSel=S.placed.map(function(p){return p.id;});
  S.selId=S.multiSel[S.multiSel.length-1]||null;
  updateMultiSelPanel(); render();
  document.getElementById('qs-info').textContent='Todos: '+S.multiSel.length+' selecionados';
}
function qsSelectFloor(){
  S.multiSel=S.placed.map(function(p){return p.id;}); // current floor only
  S.selId=S.multiSel[S.multiSel.length-1]||null;
  updateMultiSelPanel(); render();
  document.getElementById('qs-info').textContent='Piso atual: '+S.multiSel.length+' selecionados';
}
function qsClear(){
  document.getElementById('quick-sel-panel').style.display='none';
  document.getElementById('qs-toggle-btn').classList.remove('on');
  deselect();
}

// Rebuild QS panel when device list changes
var _origRenderDevList=renderDevList;
renderDevList=function(){
  _origRenderDevList();
  var panel=document.getElementById('quick-sel-panel');
  if(panel&&panel.style.display!=='none'&&panel.style.display!=='') buildQsTypeBtns();
};

function updateMultiSelPanel(){
  var bar=document.getElementById('multi-sel-bar');
  var n=S.multiSel.length;
  if(n>1){
    bar.style.display='flex';
    document.getElementById('multi-sel-count').textContent=n+' sel.';
    // Pre-fill storage fields from first selected cam
    var first=fP(S.multiSel[0]);
    if(first){
      var mpEl=document.getElementById('multi-mp');
      var codecEl=document.getElementById('multi-codec');
      var daysEl=document.getElementById('multi-days');
      if(mpEl)mpEl.value=first.mp||8;
      if(codecEl)codecEl.value=first.codec||'ultra265b';
      if(daysEl)daysEl.value=first.days||30;
    }
  } else {
    bar.style.display='none';
  }
}

function applyMultiStorage(){
  var mp=+document.getElementById('multi-mp').value;
  var codec=document.getElementById('multi-codec').value;
  var days=+document.getElementById('multi-days').value;
  var ids=S.multiSel.length>1?S.multiSel:(S.selId?[S.selId]:[]);
  ids.forEach(function(id){
    var p=fP(id); if(!p)return;
    p.mp=mp; p.codec=codec; p.days=days;
  });
  // Refresh props panel fields for the primary selection
  if(S.selId&&ids.indexOf(S.selId)>=0){
    var mpEl=document.getElementById('p-mp');
    var codecEl=document.getElementById('p-codec');
    var daysEl=document.getElementById('p-days');
    if(mpEl) mpEl.value=mp;
    if(codecEl) codecEl.value=codec;
    if(daysEl) daysEl.value=days;
    updateStoragePanel();
  }
  render();
  notify('💾 '+mp+'MP · '+codecLabel(codec)+' · '+days+'d → '+ids.length+' câmara(s)');
}

function selectAll(){
  S.multiSel=S.placed.map(function(p){return p.id;});
  if(S.multiSel.length){S.selId=S.multiSel[S.multiSel.length-1];tab('props');render();}
  updateMultiSelPanel();
  notify('Ctrl+A — '+S.multiSel.length+' selecionados');
}

function multiSelColor(){
  var picker=document.getElementById('multi-col-picker');
  picker.style.display='block';
  picker.click();
}
function applyMultiColor(val){
  var ids=S.multiSel.length>1?S.multiSel:(S.selId?[S.selId]:[]);
  ids.forEach(function(id){var p=fP(id);if(p)p.color=val;});
  document.getElementById('multi-col-picker').style.display='none';
  render(); notify('🎨 Cor aplicada a '+ids.length+' dispositivo(s)');
}
function multiSelOpacity(){
  var v=prompt('Opacidade do cone (5–85%):', '22');
  if(v===null)return;
  var val=Math.max(5,Math.min(85,parseInt(v)))/100;
  var ids=S.multiSel.length>1?S.multiSel:(S.selId?[S.selId]:[]);
  ids.forEach(function(id){var p=fP(id);if(p)p.opacity=val;});
  render(); notify('◑ Opacidade aplicada a '+ids.length+' dispositivo(s)');
}

// ════════════════════════════════════════
// SNAP TO GRID
// ════════════════════════════════════════
var SNAP_ON = false;
var SNAP_SIZE = 20; // world units (metres if scale set, else pixels)

function toggleSnap(){
  SNAP_ON = !SNAP_ON;
  var btn = document.getElementById('tb-snap');
  if(btn){
    btn.classList.toggle('on', SNAP_ON);
    btn.textContent = SNAP_ON ? '⊞ Snap ✓' : '⊞ Snap';
  }
  notify(SNAP_ON ? '⊞ Snap activo — '+SNAP_SIZE+'px' : '⊞ Snap desactivado');
}

function snapXY(x, y){
  if(!SNAP_ON) return {x:x, y:y};
  var g = S.scale.ok ? 1/S.scale.ppm : SNAP_SIZE; // snap to 1m if scale set, else 20px
  return {x: Math.round(x/g)*g, y: Math.round(y/g)*g};
}

// Patch placeDevice to snap
var _origPlaceDevice = placeDevice;
placeDevice = function(x, y){
  var snapped = snapXY(x, y);
  _origPlaceDevice(snapped.x, snapped.y);
};

// Patch onMove drag to snap
var _origOnMove2 = onMove;
onMove = function(e){
  _origOnMove2(e);
};
// Override drag in onMove to snap (patch the inner drag logic)
var _snapDragActive = false;

// ════════════════════════════════════════
// POE CALCULATION
// ════════════════════════════════════════
// PoE watts per camera type (typical)
var POE_WATTS = {
  dome:7.5,
  bullet:10,
  ptz:25,
  fisheye:8,
  turret:7.5,
  thermal_bi:18,
  default:8
};

// Values can be progressively enriched with exact manufacturer data.
// If a model is absent here, SIGS uses the device-class estimate and marks it as EST.


// PoE switch models


if(typeof POE_MODEL_WATTS==='undefined')var POE_MODEL_WATTS={};
if(typeof POE_SWITCH_DB==='undefined')var POE_SWITCH_DB=[];
var POE_CFG={marginPct:25,reservePorts:1};

function poeStandardForW(w){
  w=Number(w)||0;
  if(w<=12.95)return {name:'802.3af',label:'PoE'};
  if(w<=25.5)return {name:'802.3at',label:'PoE+'};
  if(w<=51)return {name:'802.3bt T3',label:'PoE++'};
  return {name:'802.3bt T4',label:'High PoE'};
}

function poeDeviceWatts(p,dev){
  if(p&&Number(p.poeW)>0)return {w:Number(p.poeW),source:'manual'};
  var model=dev&&(dev.model||dev.name)||'';
  if(model&&POE_MODEL_WATTS[model]!=null)return {w:Number(POE_MODEL_WATTS[model]),source:'model'};
  if(dev&&Number(dev.poeW)>0)return {w:Number(dev.poeW),source:'catalogue'};
  return {w:Number(POE_WATTS[(dev&&dev.type)||'default']||POE_WATTS.default),source:'estimated'};
}

function cameraNetworkMbps(p){
  if(p&&Number(p.netMbps)>0)return Math.max(Number(p.netMbps),Number(p.recordMbps)||0);
  if(window.SIGSEngineeringModel)return Math.max(Number(p.recordMbps)||0,SIGSEngineeringModel.bitrate(p.mp||4,'h265',p.recordFps||25));
  var mp=p.mp||4,codec=p.codec||'ultra265b';
  return Number(((BITRATE_TABLE[codec]||BITRATE_TABLE.h265)[mp]||4));
}

function recommendUplink(totalMbps){
  var design=totalMbps*1.30; // 30% headroom
  if(design<=70)return {name:'100 Mb/s',capacity:100,design:design,status:'ok'};
  if(design<=700)return {name:'1 GbE',capacity:1000,design:design,status:'ok'};
  if(design<=1750)return {name:'2.5 GbE',capacity:2500,design:design,status:'warn'};
  return {name:'10 GbE',capacity:10000,design:design,status:'warn'};
}

function setPlacedPoeW(id,val){
  var n=parseFloat(val),p=fP(id);
  if(!p)return;
  p.poeW=(isFinite(n)&&n>0)?n:null;
  buildSystemTab();
}

function setPoeCfg(key,val){
  if(key==='marginPct')POE_CFG.marginPct=Math.max(0,Math.min(100,parseFloat(val)||0));
  if(key==='reservePorts')POE_CFG.reservePorts=Math.max(0,Math.min(16,parseInt(val)||0));
  buildSystemTab();
}

function calcPoE(cams){
  var totalW=0,maxSingle=0,totalBW=0,rows=[];
  cams.forEach(function(p){
    var dev=gD(p.libId);if(!dev)return;
    var pw=poeDeviceWatts(p,dev),std=poeStandardForW(pw.w),bw=cameraNetworkMbps(p);
    totalW+=pw.w;
    totalBW+=bw;
    maxSingle=Math.max(maxSingle,pw.w);
    rows.push({
      id:p.id,label:p.label,type:dev.type,model:dev.model||dev.name||'',
      w:pw.w,source:pw.source,std:std,bw:bw
    });
  });

  var requiredPorts=cams.length+POE_CFG.reservePorts;
  var totalWithMargin=Math.ceil(totalW*(1+POE_CFG.marginPct/100));
  var uplink=recommendUplink(totalBW);

  var suggested=POE_SWITCH_DB.filter(function(sw){
    return sw.ports>=requiredPorts &&
           sw.budget>=totalWithMargin &&
           (sw.uplinkMbps||1000)>=Math.min(uplink.design,1000);
  }).sort(function(a,b){
    var aR=a.brand==='Reyee'?0:1,bR=b.brand==='Reyee'?0:1;
    if(aR!==bR)return aR-bR;
    var aw=a.budget-totalWithMargin,bw=b.budget-totalWithMargin;
    return aw-bw || a.ports-b.ports;
  });

  return {
    rows:rows,totalW:Math.round(totalW*10)/10,totalWithMargin:totalWithMargin,
    maxSingle:maxSingle,totalBW:totalBW,requiredPorts:requiredPorts,
    cameraPorts:cams.length,reservePorts:POE_CFG.reservePorts,marginPct:POE_CFG.marginPct,
    uplink:uplink,suggested:suggested.slice(0,3)
  };
}

function buildPoESection(cams){
  var el=document.getElementById('poe-summary');if(!el)return;
  var bwEl=document.getElementById('bw-summary');

  if(!cams.length){
    el.innerHTML='<p style="font-size:11px;color:var(--txt3)">Nenhuma câmara no projeto.</p>';
    if(bwEl)bwEl.innerHTML='<p style="font-size:11px;color:var(--txt3)">Sem tráfego CCTV para calcular.</p>';
    return;
  }

  var poe=calcPoE(cams);
  var uplinkPct=Math.min(999,poe.uplink.design/poe.uplink.capacity*100);
  var uplinkClass=uplinkPct>80?'poe-warn':'poe-ok';

  if(bwEl){
    bwEl.innerHTML=
      '<div class="poe-tech-grid">'+
        '<div class="poe-tech-stat"><div class="k">Tráfego câmaras</div><div class="v">'+poe.totalBW.toFixed(1)+' Mbps</div></div>'+
        '<div class="poe-tech-stat"><div class="k">Com 30% margem</div><div class="v">'+poe.uplink.design.toFixed(1)+' Mbps</div></div>'+
        '<div class="poe-tech-stat"><div class="k">Uplink recomendado</div><div class="v">'+poe.uplink.name+'</div></div>'+
        '<div class="poe-tech-stat"><div class="k">Ocupação prevista</div><div class="v">'+Math.min(999,uplinkPct).toFixed(0)+'%</div></div>'+
      '</div>'+
      '<div style="padding:6px 8px;border-radius:6px;background:var(--bg2);border:1px solid var(--bdr2);font-size:9px;color:var(--txt3);line-height:1.5">'+
        '<span class="poe-badge '+uplinkClass+'">'+(uplinkPct>80?'ATENÇÃO':'OK')+'</span> '+
        'Dimensionamento com 30% de folga. '+(poe.uplink.name==='100 Mb/s'?'Para projetos novos, 1 GbE continua a ser preferível quando disponível.':'')+
      '</div>';
  }

  var controls=
    '<div class="poe-ctrl">'+
      '<label>Margem PoE<select id="poe-margin-select">'+
        [10,20,25,30,40].map(function(v){return '<option value="'+v+'" '+(v===POE_CFG.marginPct?'selected':'')+'>'+v+'%</option>';}).join('')+
      '</select></label>'+
      '<label>Portas de reserva<select id="poe-reserve-select">'+
        [0,1,2,4,8].map(function(v){return '<option value="'+v+'" '+(v===POE_CFG.reservePorts?'selected':'')+'>'+v+'</option>';}).join('')+
      '</select></label>'+
    '</div>';

  var rows=poe.rows.map(function(r){
    var sourceLabel=r.source==='model'||r.source==='catalogue'?'MODELO':(r.source==='manual'?'MANUAL':'EST.');
    var sourceClass=(r.source==='estimated')?'poe-warn':'poe-ok';
    return '<div class="poe-row">'+
      '<div style="min-width:0">'+
        '<div style="font-family:var(--m);font-size:10px;font-weight:700;color:var(--txt);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+r.label+'</div>'+
        '<div style="font-size:8px;color:var(--txt3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+r.model+' · '+r.std.label+' '+r.std.name+' · '+r.bw.toFixed(1)+' Mbps</div>'+
      '</div>'+
      '<input class="poe-w-input" data-poe-id="'+r.id+'" type="number" min="1" max="100" step="0.5" value="'+r.w+'" title="Consumo PoE em watts">'+
      '<div style="text-align:right"><div style="font-family:var(--m);font-size:10px;font-weight:800;color:var(--acc4)">'+r.w.toFixed(1)+' W</div><span class="poe-badge '+sourceClass+'">'+sourceLabel+'</span></div>'+
    '</div>';
  }).join('');

  var overBudget=poe.suggested.length===0;
  var swHtml=poe.suggested.map(function(sw,i){
    var best=i===0;
    var pct=poe.totalWithMargin/sw.budget*100;
    return '<div style="padding:7px 8px;border-radius:6px;border:1px solid '+(best?'rgba(16,185,129,.35)':'var(--bdr2)')+';background:'+(best?'rgba(16,185,129,.07)':'var(--bg2)')+';margin-top:5px">'+
      '<div style="display:flex;justify-content:space-between;gap:6px;align-items:center">'+
        '<span style="font-family:var(--m);font-size:10px;font-weight:700;color:'+(best?'#10b981':'var(--txt)')+'">'+sw.name+'</span>'+
        (best?'<span class="poe-badge poe-ok">RECOMENDADO</span>':'')+
      '</div>'+
      '<div style="font-size:8.5px;color:var(--txt3);margin-top:2px">'+sw.brand+' · '+sw.ports+' portas · '+sw.budget+' W · ocupação PoE '+pct.toFixed(0)+'%</div>'+
    '</div>';
  }).join('');

  el.innerHTML=
    '<div class="poe-tech-grid">'+
      '<div class="poe-tech-stat"><div class="k">Portas usadas</div><div class="v">'+poe.cameraPorts+'</div></div>'+
      '<div class="poe-tech-stat"><div class="k">Portas mínimas</div><div class="v">'+poe.requiredPorts+'</div></div>'+
      '<div class="poe-tech-stat"><div class="k">Consumo real/estim.</div><div class="v">'+poe.totalW.toFixed(1)+' W</div></div>'+
      '<div class="poe-tech-stat"><div class="k">Budget recomendado</div><div class="v">'+poe.totalWithMargin+' W</div></div>'+
    '</div>'+
    controls+
    '<div style="padding:6px 8px;border-radius:6px;background:var(--bg3);margin-bottom:7px">'+rows+'</div>'+
    '<div style="display:flex;justify-content:space-between;gap:8px;padding:6px 8px;border-radius:6px;background:'+(overBudget?'rgba(239,68,68,.08)':'rgba(16,185,129,.07)')+';border:1px solid '+(overBudget?'rgba(239,68,68,.25)':'rgba(16,185,129,.22)')+'">'+
      '<span style="font-size:10px;color:var(--txt2)">PoE total + '+poe.marginPct+'% margem</span>'+
      '<span style="font-family:var(--m);font-weight:800;color:'+(overBudget?'#ef4444':'#10b981')+'">'+poe.totalW.toFixed(1)+' W → '+poe.totalWithMargin+' W</span>'+
    '</div>'+
    '<div style="margin-top:7px;font-size:9px;color:var(--txt3);font-family:var(--m)">Switch PoE sugerido:</div>'+
    (overBudget
      ?'<div style="font-size:10px;color:#ef4444;margin-top:4px;line-height:1.5">⚠ Nenhum switch da base atual cumpre simultaneamente portas + budget. Considere dois switches ou um modelo de maior capacidade.</div>'
      :swHtml)+
    '<div style="margin-top:7px;padding:6px 8px;border-radius:6px;background:var(--bg2);border:1px dashed var(--bdr2);font-size:8px;color:var(--txt3);line-height:1.5">'+
      'MODELO = valor específico disponível na base · EST. = estimativa por tipo de equipamento · MANUAL = valor definido pelo técnico.'+
    '</div>';

  var marginSel=document.getElementById('poe-margin-select');
  if(marginSel)marginSel.onchange=function(){setPoeCfg('marginPct',this.value);};
  var reserveSel=document.getElementById('poe-reserve-select');
  if(reserveSel)reserveSel.onchange=function(){setPoeCfg('reservePorts',this.value);};
  el.querySelectorAll('.poe-w-input').forEach(function(inp){
    inp.onchange=function(){setPlacedPoeW(this.getAttribute('data-poe-id'),this.value);};
  });
}

// ════════════════════════════════════════
// TEMPLATES
// ════════════════════════════════════════
var TEMPLATES = {
  cctv: [
    {
      name:'Moradia', icon:'🏠', desc:'4 câmaras cobertura exterior típica',
      devices:[
        {type:'bullet', rot:315, ox:-180, oy:-180, label:'CAM01'},
        {type:'bullet', rot:45,  ox:180,  oy:-180, label:'CAM02'},
        {type:'bullet', rot:225, ox:-180, oy:180,  label:'CAM03'},
        {type:'bullet', rot:135, ox:180,  oy:180,  label:'CAM04'},
      ]
    },
    {
      name:'Escritório', icon:'🏢', desc:'6 câmaras cobertura interior + entradas',
      devices:[
        {type:'dome', rot:315, ox:-200, oy:-200, label:'CAM01'},
        {type:'dome', rot:0,   ox:0,    oy:-200, label:'CAM02'},
        {type:'dome', rot:45,  ox:200,  oy:-200, label:'CAM03'},
        {type:'dome', rot:315, ox:-200, oy:200,  label:'CAM04'},
        {type:'dome', rot:45,  ox:200,  oy:200,  label:'CAM05'},
        {type:'bullet',rot:0,  ox:0,    oy:-250, label:'CAM06'},
      ]
    },
    {
      name:'Armazém', icon:'🏭', desc:'8 câmaras cobertura ampla industrial',
      devices:[
        {type:'dome', rot:315, ox:-300, oy:-200},
        {type:'dome', rot:0,   ox:0,    oy:-200},
        {type:'dome', rot:45,  ox:300,  oy:-200},
        {type:'dome', rot:315, ox:-300, oy:200},
        {type:'dome', rot:45,  ox:300,  oy:200},
        {type:'bullet',rot:270, ox:-350, oy:0},
        {type:'bullet',rot:90,  ox:350,  oy:0},
        {type:'ptz',   rot:0,   ox:0,    oy:0},
      ]
    },
    {
      name:'Estacionamento', icon:'🅿', desc:'PTZ central + bullets perímetro',
      devices:[
        {type:'ptz',   rot:0,   ox:0,    oy:0},
        {type:'bullet',rot:0,   ox:0,    oy:-280},
        {type:'bullet',rot:180, ox:0,    oy:280},
        {type:'bullet',rot:270, ox:-280, oy:0},
        {type:'bullet',rot:90,  ox:280,  oy:0},
        {type:'bullet',rot:315, ox:-200, oy:-200},
        {type:'bullet',rot:45,  ox:200,  oy:-200},
      ]
    },
    {
      name:'Corredor', icon:'🚶', desc:'Câmaras em linha cobrindo passagem',
      devices:[
        {type:'dome', rot:90,  ox:-300, oy:0},
        {type:'dome', rot:90,  ox:-100, oy:0},
        {type:'dome', rot:270, ox:100,  oy:0},
        {type:'dome', rot:270, ox:300,  oy:0},
      ]
    },
    {
      name:'Loja', icon:'🛒', desc:'Cobertura interior comercial completa',
      devices:[
        {type:'fisheye',rot:0, ox:0,    oy:0},
        {type:'dome',  rot:45, ox:150,  oy:-150},
        {type:'dome',  rot:315,ox:-150, oy:-150},
        {type:'dome',  rot:135,ox:150,  oy:150},
        {type:'dome',  rot:225,ox:-150, oy:150},
        {type:'bullet',rot:0,  ox:0,    oy:-200},
      ]
    },
  ],
  alarm: [
    {
      name:'Moradia Ajax', icon:'🏠', desc:'Hub + PIR interiores + contatos + sirene',
      devices:[
        {type:'hub',      ox:0,    oy:0},
        {type:'pir_indoor',ox:-150,oy:-100},
        {type:'pir_indoor',ox:150, oy:-100},
        {type:'pir_indoor',ox:0,   oy:150},
        {type:'door',     ox:-200, oy:-200},
        {type:'door',     ox:200,  oy:-200},
        {type:'siren_int',ox:0,    oy:-220},
        {type:'keypad',   ox:-220, oy:-180},
      ]
    },
    {
      name:'Escritório Ajax', icon:'🏢', desc:'Hub + PIR + contatos + sirene exterior',
      devices:[
        {type:'hub',        ox:0,    oy:50},
        {type:'pir_indoor', ox:-200, oy:-100},
        {type:'pir_indoor', ox:200,  oy:-100},
        {type:'pir_indoor', ox:0,    oy:-200},
        {type:'door',       ox:-250, oy:-250},
        {type:'door',       ox:250,  oy:-250},
        {type:'siren_ext',  ox:0,    oy:-280},
        {type:'keypad',     ox:-270, oy:-220},
      ]
    },
  ]
};

function openTemplates(){
  var grid = document.getElementById('tpl-grid');
  var tpls = TEMPLATES[MOD] || [];
  grid.innerHTML = tpls.map(function(t,i){
    return '<div onclick="applyTemplate('+i+')" style="padding:14px;border-radius:8px;border:1px solid var(--bdr2);background:var(--bg3);cursor:pointer;transition:all .18s" ' +
      'onmouseover="this.style.borderColor=\'var(--acc)\';this.style.background=\'var(--bg4)\'" ' +
      'onmouseout="this.style.borderColor=\'var(--bdr2)\';this.style.background=\'var(--bg3)\'">' +
      '<div style="font-size:28px;margin-bottom:8px">'+t.icon+'</div>' +
      '<div style="font-size:13px;font-weight:700;color:var(--txt);margin-bottom:4px">'+t.name+'</div>' +
      '<div style="font-size:10px;color:var(--txt3)">'+t.desc+'</div>' +
      '<div style="margin-top:6px;font-family:var(--m);font-size:9px;color:var(--acc)">'+t.devices.length+' dispositivos</div>' +
    '</div>';
  }).join('') || '<p style="font-size:11px;color:var(--txt3);padding:10px">Sem templates para este módulo.</p>';
  openM('m-templates');
}

function applyTemplate(idx){
  var tpl = (TEMPLATES[MOD]||[])[idx]; if(!tpl) return;
  if(S.placed.length && !confirm('Substituir dispositivos actuais pelo template "'+tpl.name+'"?')) return;
  pushUndo();
  S.placed = [];
  var cx = 0, cy = 0; // world centre
  var prefixes={dome:'CAM',bullet:'CAM',ptz:'CAM',turret:'CAM',fisheye:'CAM',hub:'HUB',repeater:'REX',pir_outdoor:'PIR',pir_indoor:'PIR',door:'DR',glass:'GL',combi:'CB',siren_ext:'SIR',siren_int:'SIR',keypad:'KP',remote:'BTN',relay:'RLY'};
  tpl.devices.forEach(function(d, i){
    // Find a matching device in the library
    var dev = S.lib.find(function(l){ return l.type===d.type; });
    if(!dev) return;
    var pre = prefixes[d.type]||'DEV';
    var n = nextNum(pre); S.devN++;
    var label = d.label || (pre+(n<10?'0':'')+n);
    S.placed.push({
      id:uid(), libId:dev.id,
      x: cx+(d.ox||0), y: cy+(d.oy||0),
      rotation: d.rot||0,
      label: label,
      color: dev.color, opacity:0.22, visible:true,
      lens:typeof SIGSLensModel!=='undefined'?SIGSLensModel.policy(dev).initial:2.8, afov:dev.fov, arange:dev.range, zone:Math.floor(i/4)+1
    });
  });
  closeM('m-templates');
  deselect(); fitView(); render(); updateStats();
  notify('Template "'+tpl.name+'" aplicado — '+S.placed.length+' dispositivos');
}

// ════════════════════════════════════════
// PDF EXPORT (via jsPDF + html2canvas)
// ════════════════════════════════════════
function doExportPDF(){
  // Load jsPDF if not already loaded
  if(typeof window.jspdf === 'undefined'){
    var s1 = document.createElement('script');
    s1.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s1.onload = function(){
      var s2 = document.createElement('script');
      s2.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s2.onload = function(){ _generatePDF(); };
      document.head.appendChild(s2);
    };
    document.head.appendChild(s1);
    notify('A carregar bibliotecas PDF...');
  } else {
    _generatePDF();
  }
}

function _generatePDF(){
  _fillPrintDoc();
  notify('A gerar PDF...');
  var jsPDF = window.jspdf ? window.jspdf.jsPDF : window.jsPDF;
  var doc = new jsPDF('p','mm','a4');
  var W = doc.internal.pageSize.getWidth();  // 210
  var H = doc.internal.pageSize.getHeight(); // 297
  var margin = 14;

  // ── Collect data ──
  saveCurrentFloor();
  var allPlaced=[]; FLOORS.forEach(function(fl){allPlaced=allPlaced.concat(fl.placed);});
  var CAMTYPES=['dome','bullet','ptz','fisheye','turret','thermal_bi'];
  var cams=allPlaced.filter(function(p){var d=gD(p.libId);return d&&CAMTYPES.indexOf(d.type)>=0;});
  var projTitle = document.getElementById('pr-title').value.trim()||'Projeto';
  var projNum   = document.getElementById('pr-projnum').value.trim();
  var clientName= document.getElementById('pr-client-name').value.trim();
  var clientCo  = document.getElementById('pr-client-company').value.trim();
  var clientAddr= document.getElementById('pr-client-addr').value.trim();
  var clientNIF = document.getElementById('pr-client-nif').value.trim();
  var instCo    = document.getElementById('pr-company').value.trim()||'SIGS';
  var instName  = document.getElementById('pr-name').value.trim();
  var instEmail = document.getElementById('pr-email').value.trim();
  var instPhone = document.getElementById('pr-phone').value.trim();
  var dateVal   = document.getElementById('pr-date').value;
  var dateStr   = dateVal?new Date(dateVal+'T12:00').toLocaleDateString('pt-PT',{year:'numeric',month:'long',day:'numeric'}):new Date().toLocaleDateString('pt-PT',{year:'numeric',month:'long',day:'numeric'});
  var modLabel  = MOD==='cctv'?'Videovigilância IP':'Intrusão Ajax Systems';

  // ── Helper functions ──────────────────────────────────────
  function addPageHeader(doc,pg,total){
    // Top stripe
    doc.setFillColor(8,26,52); doc.rect(0,0,W,14,'F');
    // Logo
    var hx=margin;
    if(S.logoURL){try{doc.addImage(S.logoURL,'JPEG',margin,1.5,16,11);hx=margin+19;}catch(e){try{doc.addImage(S.logoURL,'PNG',margin,1.5,16,11);hx=margin+19;}catch(e2){}}}
    doc.setFontSize(10);doc.setFont('helvetica','bold');doc.setTextColor(255,255,255);
    doc.text(instCo,hx,9);
    doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(160,185,210);
    doc.text(projTitle+(projNum?' · Nº'+projNum:''),hx,13.2);
    doc.setFontSize(7);doc.setTextColor(130,155,180);
    doc.text('Pág '+pg+'/'+total,W-margin,9,{align:'right'});
    doc.text(modLabel,W-margin,13.2,{align:'right'});
  }
  function addPageFooter(doc){
    var fy=H-8;
    doc.setDrawColor(180,200,220);doc.setLineWidth(0.2);doc.line(margin,fy-2,W-margin,fy-2);
    doc.setFontSize(6.5);doc.setTextColor(150,165,180);doc.setFont('helvetica','normal');
    doc.text('Documento gerado por SIGS Design · '+new Date().toLocaleString('pt-PT'),margin,fy);
    doc.text('Este documento é confidencial e destinado exclusivamente ao cliente indicado.',W-margin,fy,{align:'right'});
  }
  function sectionTitle(doc,txt,y){
    doc.setFillColor(8,26,52);doc.rect(margin,y,W-2*margin,6,'F');
    doc.setFontSize(8.5);doc.setFont('helvetica','bold');doc.setTextColor(255,255,255);
    doc.text(txt.toUpperCase(),margin+3,y+4.2);
    return y+8;
  }
  function checkPage(doc,y,need){
    if(y+need>H-16){doc.addPage();return 18;}
    return y;
  }
  function tableHeader(doc,cols,y,fillRGB){
    var r=fillRGB||[8,40,80];
    doc.setFillColor(r[0],r[1],r[2]);doc.rect(margin,y,W-2*margin,5.5,'F');
    doc.setFontSize(7);doc.setFont('helvetica','bold');doc.setTextColor(255,255,255);
    var tx=margin;
    cols.forEach(function(c){doc.text(c[0],tx+1.5,y+3.8);tx+=c[1];});
    return y+5.5;
  }
  function tableRow(doc,vals,cols,y,even){
    if(even){doc.setFillColor(246,249,252);doc.rect(margin,y,W-2*margin,5,'F');}
    doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(30,45,65);
    var tx=margin;
    vals.forEach(function(v,vi){
      var str=String(v);
      var maxw=cols[vi][1]-3;
      // Truncate if needed
      while(doc.getTextWidth(str)>maxw && str.length>1) str=str.slice(0,-1);
      doc.text(str,tx+1.5,y+3.5);tx+=cols[vi][1];
    });
    return y+5;
  }

  // ════════════════════════════════════════════════════════
  // PAGE 1 — CAPA
  // ════════════════════════════════════════════════════════
  // Background gradient simulation
  doc.setFillColor(5,12,28);doc.rect(0,0,W,H,'F');
  // Top accent
  doc.setFillColor(8,40,90);doc.rect(0,0,W,72,'F');
  // Diagonal decorative stripe
  doc.setFillColor(10,50,105);
  doc.triangle(0,0,W*0.6,0,0,H*0.35,'F');

  // Logo on cover
  var logoY=20;
  if(S.logoURL){
    try{doc.addImage(S.logoURL,'JPEG',margin,logoY,40,26);logoY+=30;}
    catch(e){try{doc.addImage(S.logoURL,'PNG',margin,logoY,40,26);logoY+=30;}catch(e2){}}
  }

  // Company name
  doc.setFontSize(11);doc.setFont('helvetica','bold');doc.setTextColor(140,175,220);
  doc.text(instCo.toUpperCase(),margin,logoY+10);

  // Big project title
  doc.setFontSize(28);doc.setFont('helvetica','bold');doc.setTextColor(240,246,255);
  // Wrap long titles
  var titleLines=doc.splitTextToSize(projTitle,W-2*margin-10);
  doc.text(titleLines,margin,85);

  // Module badge
  doc.setFillColor(59,130,246);doc.roundedRect(margin,100,50,10,2,2,'F');
  doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(255,255,255);
  doc.text(modLabel,margin+3,106.5);

  // Divider line
  doc.setDrawColor(59,130,246);doc.setLineWidth(0.8);doc.line(margin,116,W/2,116);

  // Client block
  doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(120,155,200);
  doc.text('CLIENTE',margin,126);
  doc.setFont('helvetica','bold');doc.setTextColor(220,235,255);doc.setFontSize(13);
  doc.text(clientCo||clientName||'—',margin,134);
  if(clientCo&&clientName){doc.setFontSize(9);doc.setFont('helvetica','normal');doc.setTextColor(150,175,210);doc.text(clientName,margin,140);}
  if(clientAddr){doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(120,150,185);doc.text(clientAddr,margin,146);}
  if(clientNIF){doc.setFontSize(7.5);doc.setTextColor(100,130,165);doc.text('NIF: '+clientNIF,margin,151);}

  // Installer block (right)
  var rx=W/2+10;
  doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(120,155,200);
  doc.text('INSTALADOR',rx,126);
  doc.setFont('helvetica','bold');doc.setTextColor(220,235,255);doc.setFontSize(11);
  doc.text(instCo,rx,133);
  var instLines2=[instName,instEmail,instPhone].filter(Boolean);
  doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(150,175,210);
  instLines2.forEach(function(l,i){doc.text(l,rx,139+i*5.5);});

  // Date + project number
  doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(120,155,200);
  doc.text('DATA',margin,170);
  doc.setFont('helvetica','normal');doc.setTextColor(200,220,245);doc.setFontSize(10);
  doc.text(dateStr,margin,177);
  if(projNum){
    doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(120,155,200);
    doc.text('Nº PROJETO',rx,170);
    doc.setFont('helvetica','normal');doc.setTextColor(200,220,245);doc.setFontSize(10);
    doc.text(projNum,rx,177);
  }

  // Summary stats at bottom of cover
  var stats=[
    {label:'Dispositivos',val:String(allPlaced.length)},
    {label:'Pisos',val:String(FLOORS.length)},
    {label:'Câmaras',val:String(cams.length)},
  ];
  if(S.scale.ok){
    var totalGB2=0;cams.forEach(function(p){totalGB2+=calcStorage(p.mp||4,p.codec||'ultra265b',p.days||30,p).gb;});
    stats.push({label:'Armazenamento',val:fmtGB(totalGB2)});
  }
  var statW=(W-2*margin)/stats.length;
  doc.setDrawColor(30,60,100);doc.setLineWidth(0.3);doc.line(margin,200,W-margin,200);
  stats.forEach(function(s,i){
    var sx=margin+i*statW;
    doc.setFillColor(12,30,60);doc.rect(sx,202,statW-3,22,'F');
    doc.setFontSize(14);doc.setFont('helvetica','bold');doc.setTextColor(100,180,255);
    doc.text(s.val,sx+statW/2-1.5,215,{align:'center'});
    doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(100,130,165);
    doc.text(s.label.toUpperCase(),sx+statW/2-1.5,221,{align:'center'});
  });

  // Cover footer
  doc.setFillColor(8,20,45);doc.rect(0,H-18,W,18,'F');
  doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(80,110,150);
  doc.text('SIGS Design · Documento gerado em '+new Date().toLocaleString('pt-PT'),margin,H-8);
  doc.text('Confidencial',W-margin,H-8,{align:'right'});

  // ════════════════════════════════════════════════════════
  // PAGES 2..N — Planta por piso (um piso por página)
  // ════════════════════════════════════════════════════════
  var savedFloor=FLOOR_CUR;
  FLOORS.forEach(function(fl,fi){
    doc.addPage();
    // Render this floor's canvas
    loadFloor(fi);
    render();
    var imgData=cv.toDataURL('image/jpeg',0.9);
    loadFloor(savedFloor); render();

    var imgMaxW=W-2*margin, imgMaxH=H-50;
    var ratio=cv.height/cv.width;
    var imgW=imgMaxW, imgH=imgW*ratio;
    if(imgH>imgMaxH){imgH=imgMaxH;imgW=imgH/ratio;}

    // Section header
    doc.setFillColor(8,26,52);doc.rect(0,0,W,14,'F');
    doc.setFontSize(9);doc.setFont('helvetica','bold');doc.setTextColor(255,255,255);
    if(S.logoURL){try{doc.addImage(S.logoURL,'JPEG',margin,1.5,16,11);}catch(e){}}
    var hx2=S.logoURL?margin+19:margin;
    doc.text(instCo,hx2,9);
    doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(160,185,210);
    doc.text(projTitle+(projNum?' · Nº'+projNum:''),hx2,13.2);
    doc.setFontSize(7);doc.setTextColor(130,155,180);
    doc.text('Piso '+(fi+1)+'/'+FLOORS.length,W-margin,9,{align:'right'});

    // Floor title bar
    doc.setFillColor(20,50,90);doc.rect(0,14,W,10,'F');
    doc.setFontSize(10);doc.setFont('helvetica','bold');doc.setTextColor(160,210,255);
    doc.text('📐  '+fl.name.toUpperCase(),margin+3,21);
    var flDevs=fl.placed.length;
    var flCams=fl.placed.filter(function(p){var d=gD(p.libId);return d&&CAMTYPES.indexOf(d.type)>=0;}).length;
    doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(120,160,200);
    doc.text(flDevs+' dispositivos'+(flCams?' · '+flCams+' câmaras':''),W-margin,21,{align:'right'});

    // Plant image — centered
    var imgX=(W-imgW)/2;
    doc.addImage(imgData,'JPEG',imgX,26,imgW,imgH);

    // Scale indicator
    if(fl.scale&&fl.scale.ok){
      doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(80,120,160);
      doc.text('Escala: '+fl.scale.ppm.toFixed(2)+' px/m',margin,H-10);
    }

    // Footer
    doc.setDrawColor(180,200,220);doc.setLineWidth(0.2);doc.line(margin,H-8,W-margin,H-8);
    doc.setFontSize(6.5);doc.setTextColor(150,165,180);doc.setFont('helvetica','normal');
    doc.text('SIGS Design · '+modLabel,margin,H-4);
    doc.text(dateStr,W-margin,H-4,{align:'right'});
  });

  // ════════════════════════════════════════════════════════
  // PAGE — Lista de dispositivos / BOM / Sistema
  // ════════════════════════════════════════════════════════
  doc.addPage();
  var y=18;
  // Page header
  addPageHeader(doc,FLOORS.length+2,'?');

  // ── Camera table ──
  if(MOD==='cctv'&&cams.length){
    y=sectionTitle(doc,'📷  Lista de Câmaras',y);
    var cols=[['ID',13],['Modelo',38],['Piso',18],['Lente',14],['FOV',13],['Alcance',15],['MP',11],['Armazen.',24]];
    y=tableHeader(doc,cols,y);
    cams.forEach(function(p,i){
      y=checkPage(doc,y,6);
      var dev=gD(p.libId);if(!dev)return;
      var lens=(typeof SIGSLensModel!=='undefined'?SIGSLensModel.effective(p,dev):(p.lens||2.8));
      var flName='—';
      FLOORS.forEach(function(fl){if(fl.placed.some(function(q){return q.id===p.id;}))flName=fl.name;});
      var st=calcStorage(p.mp||dev.mp||4,p.codec||'ultra265b',p.days||30,p);
      y=tableRow(doc,[p.label,(dev.model||dev.name),flName,lens.toFixed(1)+'mm',lFOV(dev.fov,lens,typeof SIGSLensModel!=='undefined'?SIGSLensModel.policy(dev).base:undefined,dev).toFixed(0)+'°',lRange(dev.range,lens).toFixed(0)+'m',(p.mp||4)+'MP',fmtGB(st.gb)],cols,y,i%2===0);
    });
    y+=6;
  }

  // ── Ajax device table ──
  if(MOD==='alarm'&&allPlaced.length){
    y=checkPage(doc,y,20);
    y=sectionTitle(doc,'🔴  Lista de Dispositivos Ajax',y);
    var acols=[['ID',16],['Nome',50],['Tipo',28],['Piso',20],['Zona',14],['Alcance',20]];
    y=tableHeader(doc,acols,y,[50,20,20]);
    allPlaced.forEach(function(p,i){
      y=checkPage(doc,y,6);
      var dev=gD(p.libId);if(!dev)return;
      var flName='—';
      FLOORS.forEach(function(fl){if(fl.placed.some(function(q){return q.id===p.id;}))flName=fl.name;});
      y=tableRow(doc,[p.label,dev.name,dev.type||'—',flName,p.zone||1,(dev.range||0)>0?(p.arange||dev.range)+'m':'—'],acols,y,i%2===0);
    });
    y+=6;
  }

  // ── BOM ──
  y=checkPage(doc,y,20);
  y=sectionTitle(doc,'📋  Lista de Material (BOM)',y);
  var groups={};
  allPlaced.forEach(function(p){var dev=gD(p.libId);if(!dev)return;var k=p.libId;if(!groups[k])groups[k]={dev:dev,count:0};groups[k].count++;});
  var bomRows=Object.values(groups).sort(function(a,b){return b.count-a.count;});
  var bcols=[['Referência',46],['Descrição',72],['Tipo',32],['Qtd',16]];
  y=tableHeader(doc,bcols,y,[26,58,90]);
  bomRows.forEach(function(g,i){
    y=checkPage(doc,y,6);
    y=tableRow(doc,[(g.dev.model||g.dev.name),g.dev.name,g.dev.type||'—',String(g.count)],bcols,y,i%2===0);
  });
  y+=6;

  // ── NVR + Storage (CCTV) ──
  if(MOD==='cctv'&&cams.length){
    y=checkPage(doc,y,30);
    y=sectionTitle(doc,'🖥  Sistema & Armazenamento',y);
    var totalBW=0,maxMP=0,totalGB=0;
    cams.forEach(function(p){var mp=p.mp||4,codec=p.codec||'ultra265b',days=p.days||30;var br=cameraNetworkMbps(p);totalBW+=br;totalGB+=calcStorage(mp,codec,days,p).gb;if(mp>maxMP)maxMP=mp;});
    var matches=suggestNVR(cams.length,maxMP,totalBW);
    var poe=calcPoE(cams);

    // Info boxes
    var boxes=[
      {label:'Câmaras',val:String(cams.length)},
      {label:'Largura de Banda',val:totalBW.toFixed(1)+' Mbps'},
      {label:'Armazenamento Total',val:fmtGB(totalGB)},
    ];
    var bw=(W-2*margin)/boxes.length;
    boxes.forEach(function(b,i){
      var bx=margin+i*bw;
      doc.setFillColor(240,246,255);doc.rect(bx,y,bw-3,16,'F');
      doc.setDrawColor(180,210,240);doc.setLineWidth(0.3);doc.rect(bx,y,bw-3,16,'S');
      doc.setFontSize(13);doc.setFont('helvetica','bold');doc.setTextColor(10,42,74);
      doc.text(b.val,bx+(bw-3)/2,y+10,{align:'center'});
      doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(80,110,150);
      doc.text(b.label.toUpperCase(),bx+(bw-3)/2,y+15,{align:'center'});
    });
    y+=20;

    if(matches[0]){
      doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(10,42,74);
      doc.text('NVR Recomendado: ',margin,y);
      doc.setFont('helvetica','normal');doc.setTextColor(30,60,100);
      doc.text(matches[0].name+' · '+matches[0].brand+' · '+matches[0].ch+' canais · '+matches[0].hdd+' HDD',margin+35,y);
      y+=5.5;
    }
    if(matches[1]){
      doc.setFontSize(7.5);doc.setFont('helvetica','normal');doc.setTextColor(80,110,150);
      doc.text('Alternativa: '+matches[1].name+' ('+matches[1].brand+')',margin,y);y+=5;
    }
    if(poe.suggested[0]){
      doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(10,42,74);
      doc.text('Switch PoE: ',margin,y);
      doc.setFont('helvetica','normal');doc.setTextColor(30,60,100);
      doc.text(poe.suggested[0].name+' · '+poe.suggested[0].budget+'W · '+poe.suggested[0].ports+' portas',margin+22,y);
      y+=6;
    }
  }

  // ── Cabo estimado ──
  if(S.scale.ok){
    var totalCable=0;var cableOk=false;
    allPlaced.forEach(function(p){var cd=cableForCam(p);if(cd){totalCable+=cd.cable;cableOk=true;}});
    if(cableOk){
      y=checkPage(doc,y,8);
      doc.setFontSize(8);doc.setFont('helvetica','bold');doc.setTextColor(10,42,74);
      doc.text('Cabo total estimado: ',margin,y);
      doc.setFont('helvetica','normal');doc.setTextColor(30,60,100);
      doc.text(totalCable.toFixed(0)+' m',margin+40,y);y+=6;
    }
  }

  // ── Orçamento (preços do BOM) ──
  var rptBudgetEl = document.getElementById('rpt-budget');
  if(rptBudgetEl && rptBudgetEl.checked){
    y=checkPage(doc,y,24);
    y=sectionTitle(doc,'💶  Orçamento',y);

    var CAMT=['dome','bullet','ptz','fisheye','turret'];
    // Linhas iguais às do BOM (dispositivos agrupados + sistema)
    var qg={};
    allPlaced.forEach(function(p){var d=gD(p.libId);if(!d)return;var k=p.libId;if(!qg[k])qg[k]={dev:d,count:0};qg[k].count++;});
    var qrows=Object.values(qg).sort(function(a,b){return b.count-a.count;}).map(function(g){return {ref:(g.dev.model||g.dev.name),name:g.dev.name,qty:g.count,unit:''};});
    var qcams=allPlaced.filter(function(p){var d=gD(p.libId);return d&&CAMT.indexOf(d.type)>=0;});
    if(qcams.length){
      var tBW=0,mMP=0,tGB=0;
      qcams.forEach(function(p){var mp=p.mp||4,cod=p.codec||'ultra265b';var br=cameraNetworkMbps(p);tBW+=br;tGB+=calcStorage(mp,cod,p.days||30,p).gb;if(mp>mMP)mMP=mp;});
      var nv=suggestNVR(qcams.length,mMP,tBW), pe=calcPoE(qcams), hd=nearestHDD(tGB);
      if(nv[0]) qrows.push({ref:nv[0].name,name:'NVR Recomendado',qty:1,unit:''});
      if(pe.suggested[0]) qrows.push({ref:pe.suggested[0].name,name:'Switch PoE',qty:1,unit:''});
      qrows.push({ref:sigsHddCatalogRef(hd),name:'Disco de Armazenamento',qty:1,unit:''});
      var cM=0; if(S.scale.ok&&NVR_POS){allPlaced.forEach(function(p){var cd=cableForCam(p);if(cd)cM+=cd.cable;});} if(cM<=0){cM=qcams.length*15;}
      qrows.push({ref:'Cabo UTP Cat6',name:'Cabo de Rede (UTP Cat6)',qty:Math.max(1,Math.ceil(cM)),unit:'m'});
    }

    var commercialTotal=typeof sigsV8Quote==='function'?sigsV8Quote():null;
    if(commercialTotal)qrows=commercialTotal.lines;

    var qcols=[['Descrição',84],['Ref.',38],['Qtd',16],['P.Unit.',24],['Total',26]];
    y=tableHeader(doc,qcols,y,[0,60,40]);
    var qsub=0;
    qrows.forEach(function(r,i){
      var before=y; y=checkPage(doc,y,6); if(y!==before+0 && y===18){ y=tableHeader(doc,qcols,y,[0,60,40]); }
      var pu=commercialTotal?r.sale:bomGetPrice(r.ref), lt=commercialTotal?r.net:pu*r.qty; qsub+=lt;
      y=tableRow(doc,[r.name,(r.ref||'').slice(0,18),r.qty+(r.unit?(' '+r.unit):''),pu.toFixed(2)+' €',lt.toFixed(2)+' €'],qcols,y,i%2===0);
    });

    // Totais — margem e IVA definidos no BOM
    var qmargin=parseFloat((document.getElementById('bom-margin')||{}).value)||0;
    var qivaOn=!document.getElementById('bom-iva')||document.getElementById('bom-iva').checked;
    if(commercialTotal){qmargin=0;qivaOn=SIGS_COMMERCIAL.iva>0;}
    var qwm=qsub*(1+qmargin/100), qiva=commercialTotal?commercialTotal.iva:(qivaOn?qwm*0.23:0), qtot=qwm+qiva;
    y=checkPage(doc,y,28); y+=4;
    var txR=margin+W/2;
    doc.setDrawColor(200,215,230);doc.setLineWidth(0.2);doc.line(txR-2,y-3,W-margin,y-3);
    doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(60,80,110);
    doc.text(commercialTotal?'Subtotal após desconto:':'Subtotal:',txR,y);doc.setFont('helvetica','bold');doc.setTextColor(30,50,80);doc.text(qsub.toFixed(2)+' €',W-margin,y,{align:'right'});y+=5;
    if(qmargin>0){doc.setFont('helvetica','normal');doc.setTextColor(60,80,110);doc.text('Margem '+qmargin+'%:',txR,y);doc.text((qwm-qsub).toFixed(2)+' €',W-margin,y,{align:'right'});y+=5;}
    if(qivaOn){doc.setFont('helvetica','normal');doc.setTextColor(60,80,110);doc.text('IVA '+(commercialTotal?SIGS_COMMERCIAL.iva:23)+'%:',txR,y);doc.text(qiva.toFixed(2)+' €',W-margin,y,{align:'right'});y+=5;}
    doc.setFillColor(8,26,52);doc.rect(txR-2,y-4,W-margin-txR+4,8.5,'F');
    doc.setFontSize(10.5);doc.setFont('helvetica','bold');doc.setTextColor(255,255,255);
    doc.text('TOTAL'+(qivaOn?' c/IVA':''),txR+1,y+1.7);doc.text(qtot.toFixed(2)+' €',W-margin-1,y+1.7,{align:'right'});y+=11;
  }

  // ── Guarantee / terms ──
  y=checkPage(doc,y,35);
  y=sectionTitle(doc,'📝  Condições & Garantia',y);
  var terms=[
    '• Garantia de 2 anos em todos os equipamentos contra defeitos de fabrico.',
    '• A instalação inclui configuração, testes e formação básica de utilização.',
    '• Assistência técnica disponível em dias úteis, das 9h00 às 18h00.',
    '• Alterações ao projeto após aprovação podem implicar custos adicionais.',
    '• Proposta válida por 30 dias a partir da data de emissão.',
    '• Valores sem IVA salvo indicação expressa. IVA à taxa legal em vigor.',
  ];
  doc.setFontSize(7.5);doc.setFont('helvetica','normal');doc.setTextColor(60,80,110);
  if(window.SIGS_COMMERCIAL)terms=[SIGS_COMMERCIAL.terms||'Condições comerciais a definir com o cliente.','Proposta válida por '+SIGS_COMMERCIAL.validity+' dias.'];
  terms.forEach(function(t){doc.splitTextToSize(t,W-2*margin).forEach(function(line){y=checkPage(doc,y,6);doc.text(line,margin,y);y+=5;});});

  // ── Final footer on all pages ──
  var pageCount=doc.getNumberOfPages();
  for(var pg=1;pg<=pageCount;pg++){
    doc.setPage(pg);
    if(pg>1) addPageFooter(doc);
    // Fix page count in header (page 1 is cover — no header)
    if(pg>1){
      // Re-draw page number correctly
      doc.setFontSize(7);doc.setFont('helvetica','normal');doc.setTextColor(130,155,180);
      doc.text('Pág '+(pg-1)+'/'+(pageCount-1),W-margin,9,{align:'right'});
    }
  }

  var projName=(document.getElementById('pr-title').value||'projeto').replace(/\s+/g,'_');
  doc.save(projName+'_'+MOD+'.pdf');
  notify('📄 PDF exportado — '+pageCount+' páginas!');
}

function _fillPrintDoc(){
  // Logo
  var plogoEl=document.getElementById('plogo');
  if(plogoEl){ if(S.logoURL){plogoEl.src=S.logoURL;plogoEl.style.display='';}else{plogoEl.src='';plogoEl.style.display='none';} }
  // Populate printdoc fields for client data
  var fields = {
    'pd-cname':         'pr-name',
    'pd-cemail':        'pr-email',
    'pd-cphone':        'pr-phone',
    'pd-ccompany':      'pr-company',
    'pd-client-name':   'pr-client-name',
    'pd-client-company':'pr-client-company',
    'pd-client-addr':   'pr-client-addr',
    'pd-client-nif':    'pr-client-nif',
    'pd-client-phone':  'pr-client-phone',
    'pd-projnum':       'pr-projnum',
  };
  Object.keys(fields).forEach(function(out){
    var inp = document.getElementById(fields[out]);
    var outel = document.getElementById(out);
    if(inp && outel) outel.textContent = inp.value.trim();
  });
  document.getElementById('pd-title').textContent = document.getElementById('pr-title').value.trim();
  document.getElementById('pd-module').textContent = 'Design — '+(MOD==='cctv'?'Videovigilância':'Intrusão Ajax Systems');
  var clientRow = document.getElementById('pd-client-row');
  var hasClient = document.getElementById('pr-client-name').value.trim() || document.getElementById('pr-client-company').value.trim();
  if(clientRow) clientRow.style.display = hasClient ? '' : 'none';
  var dval = document.getElementById('pr-date').value;
  var dateEl = document.getElementById('pd-cdate');
  if(dateEl) dateEl.textContent = dval ? 'Data: '+new Date(dval+'T12:00').toLocaleDateString('pt-PT',{year:'numeric',month:'long',day:'numeric'}) : '';
}

// doPrint already calls _fillPrintDoc() internally

// PoE now built inside buildSystemTab directly

// G key handled by main keydown listener

// ════════════════════════════════════════
// FLOOR OVERVIEW — vista global de pisos
// ════════════════════════════════════════
function openFloorOverview(){
  saveCurrentFloor();
  var grid = document.getElementById('floor-overview-grid');
  grid.innerHTML = '';
  var savedFloor = FLOOR_CUR;

  FLOORS.forEach(function(fl, fi){
    // Render this floor to a small offscreen canvas
    loadFloor(fi);
    render();
    var thumb = document.createElement('canvas');
    var THUMB_W = 440, THUMB_H = Math.round(440*(cv.height/cv.width));
    thumb.width = THUMB_W; thumb.height = THUMB_H;
    var tctx = thumb.getContext('2d');
    tctx.drawImage(cv, 0, 0, THUMB_W, THUMB_H);
    var thumbData = thumb.toDataURL('image/jpeg', 0.8);

    // Count devices
    var CAMTYPES=['dome','bullet','ptz','fisheye','turret','thermal_bi'];
    var cams = fl.placed.filter(function(p){var d=gD(p.libId);return d&&CAMTYPES.indexOf(d.type)>=0;}).length;
    var devs = fl.placed.length;
    var cableTotal = 0;
    fl.placed.forEach(function(p){var cd=cableForCam(p);if(cd)cableTotal+=cd.cable;});

    var card = document.createElement('div');
    card.style.cssText = 'border:1px solid var(--bdr2);border-radius:12px;overflow:hidden;background:var(--bg2);cursor:pointer;transition:all .15s;';
    card.onmouseover = function(){ this.style.borderColor='var(--acc)'; this.style.boxShadow='0 0 20px rgba(59,130,246,.12)'; };
    card.onmouseout  = function(){ this.style.borderColor='var(--bdr2)'; this.style.boxShadow=''; };
    card.onclick = function(){
      closeM('m-floors');
      loadFloor(savedFloor);
      switchFloor(fi);
    };

    card.innerHTML =
      '<div style="background:var(--bg3);padding:8px 12px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--bdr)">'
      + '<span style="font-family:var(--h);font-size:13px;font-weight:700;color:var(--txt)">'+(fi===savedFloor?'● ':'')+ fl.name+'</span>'
      + '<span style="font-size:9px;font-family:var(--m);color:var(--txt3)">'+devs+' disp.</span>'
      + '</div>'
      + '<img src="'+thumbData+'" style="width:100%;display:block;aspect-ratio:'+cv.width+'/'+cv.height+';object-fit:cover">'
      + '<div style="padding:8px 12px;display:flex;gap:10px;background:var(--bg2)">'
      + '<div style="flex:1;text-align:center"><div style="font-family:var(--m);font-size:13px;font-weight:700;color:var(--acc)">'+devs+'</div><div style="font-size:9px;color:var(--txt3)">Dispositivos</div></div>'
      + (cams>0?'<div style="flex:1;text-align:center"><div style="font-family:var(--m);font-size:13px;font-weight:700;color:var(--acc3)">'+cams+'</div><div style="font-size:9px;color:var(--txt3)">Câmaras</div></div>':'')
      + (cableTotal>0?'<div style="flex:1;text-align:center"><div style="font-family:var(--m);font-size:13px;font-weight:700;color:var(--acc4)">'+cableTotal.toFixed(0)+'m</div><div style="font-size:9px;color:var(--txt3)">Cabo</div></div>':'')
      + '</div>';

    grid.appendChild(card);
  });

  // Restore
  loadFloor(savedFloor);
  openM('m-floors');
}

// ════════════════════════════════════════
// PRESENTATION MODE — modo cliente
// ════════════════════════════════════════
var _presentCtx = null, _presentBgCtx = null;
var _presentRenderActive = false;

function enterPresentMode(){
  if(!document.getElementById('app').classList.contains('show')){ notify('Abra um projeto primeiro'); return; }
  document.body.classList.add('presenting');
  _buildPBar(); _buildPLegend();
  document.addEventListener('keydown', _presKey);
  setTimeout(function(){ resize(); if(S.lmap){try{S.lmap.invalidateSize();}catch(e){}} render(); }, 80);
}
function _presKey(e){
  if(e.key==='Escape'){ exitPresentMode(); }
  else if(e.key==='ArrowRight'||e.key==='ArrowDown'){ var n=Math.min(FLOOR_CUR+1,FLOORS.length-1); if(n!==FLOOR_CUR) _presGoFloor(n); }
  else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){ var p=Math.max(FLOOR_CUR-1,0); if(p!==FLOOR_CUR) _presGoFloor(p); }
}
function _presGoFloor(i){
  switchFloor(i); _buildPBar(); _buildPLegend();
  setTimeout(function(){ resize(); if(S.lmap){try{S.lmap.invalidateSize();}catch(e){}} render(); }, 40);
}
function _buildPBar(){
  var bar=document.getElementById('pbar'); if(!bar) return;
  var projTitle=(document.getElementById('pr-title')?document.getElementById('pr-title').value.trim():'')||'Projeto';
  var modName=MOD==='cctv'?'Videovigilância IP':MOD==='fire'?'Deteção de Incêndio EN54':'Intrusão Ajax';
  var logoInner=S.logoURL?'<img src="'+S.logoURL+'" style="width:100%;height:100%;object-fit:contain">':(MOD==='cctv'?'📹':MOD==='fire'?'🔥':'🔴');
  var tabs=FLOORS.map(function(fl,i){return '<div class="pb-tab'+(i===FLOOR_CUR?' on':'')+'" onclick="_presGoFloor('+i+')">'+esc(fl.name)+'</div>';}).join('');
  var devCount=S.placed.length, CAMT=['dome','bullet','ptz','fisheye','turret'];
  var cams=S.placed.filter(function(p){var d=gD(p.libId);return d&&CAMT.indexOf(d.type)>=0;}).length;
  var countTxt=devCount+' dispositivo'+(devCount!==1?'s':'')+(cams?' · '+cams+' câmara'+(cams!==1?'s':''):'');
  bar.innerHTML=
    '<div class="pb-logo">'+logoInner+'</div>'
    +'<div><div class="pb-title">'+esc(projTitle)+'</div><div class="pb-sub">'+modName+(FLOORS.length>1?' · '+FLOORS.length+' pisos':'')+'</div></div>'
    +'<div style="flex:1"></div>'
    +(FLOORS.length>1?'<div class="pb-tabs">'+tabs+'</div>':'')
    +'<div class="pb-count">'+countTxt+'</div>'
    +'<button class="pb-exit" onclick="exitPresentMode()" title="Sair (Esc)">✕</button>';
}
function _buildPLegend(){
  var el=document.getElementById('plegend'); if(!el) return;
  var types={};
  S.placed.forEach(function(p){var d=gD(p.libId);if(!d)return;var k=d.type;if(!types[k])types[k]={dev:d,count:0};types[k].count++;});
  var labels={dome:'Dome',bullet:'Bullet',ptz:'PTZ',fisheye:'Fisheye',turret:'Turret',radar:'Radar',thermal_bi:'Térmica',hub:'Hub',pir_indoor:'PIR Interior',pir_outdoor:'PIR Exterior',door:'Contacto',glass:'Vidro',combi:'Combi',siren_ext:'Sirene Ext.',siren_int:'Sirene Int.',keypad:'Teclado',remote:'Telecomando',relay:'Relé',fire:'Detetor Fogo',leak:'Água'};
  var keys=Object.keys(types);
  var rows=keys.length?keys.map(function(t){var d=types[t].dev,n=types[t].count;return '<div style="display:flex;align-items:center;gap:9px;margin-bottom:7px"><span style="width:11px;height:11px;border-radius:50%;background:'+d.color+';box-shadow:0 0 7px '+d.color+'90;flex-shrink:0"></span><span style="font-size:12px;color:rgba(255,255,255,.78);flex:1">'+(labels[t]||t)+'</span><span style="font-family:var(--m);font-size:12px;font-weight:700;color:#5fb0ff">'+n+'</span></div>';}).join(''):'<div style="font-size:11px;color:rgba(255,255,255,.4)">Sem dispositivos colocados</div>';
  el.innerHTML='<div class="pl-h">Legenda</div>'+rows+'<div class="pl-foot">'+(S.scale.ok?S.scale.ppm.toFixed(1)+' px/m':'Escala não definida')+' · Esc para sair</div>';
}

function _initPresentCanvas(){
  var overlay = document.getElementById('present-overlay');
  if(!overlay || overlay.style.display==='none') return;

  // Set title
  var projTitle = document.getElementById('pr-title') ? document.getElementById('pr-title').value.trim() : '';
  document.getElementById('present-title').textContent = projTitle || 'Projeto';
  document.getElementById('present-sub').textContent = (MOD==='cctv'?'Videovigilância IP':'Intrusão Ajax') + (FLOORS.length>1?' · '+FLOORS.length+' pisos':'');

  // Logo in present mode
  var logoWrap = document.getElementById('present-logo-wrap');
  if(S.logoURL && logoWrap){
    logoWrap.innerHTML = '<img src="'+S.logoURL+'" style="width:32px;height:32px;object-fit:contain;border-radius:8px">';
  }

  // Setup canvas
  var wrap = document.getElementById('present-canvas-wrap');
  var pcv  = document.getElementById('present-cv');
  var pbgcv= document.getElementById('present-bgcv');
  var wW = wrap.clientWidth  || window.innerWidth;
  var wH = wrap.clientHeight || (window.innerHeight - 52);
  pcv.width = pbgcv.width = wW;
  pcv.height = pbgcv.height = wH;
  _presentCtx   = pcv.getContext('2d');
  _presentBgCtx = pbgcv.getContext('2d');

  // Build floor tabs
  _buildPresentFloorTabs();

  // Add pan/zoom to present canvas
  var pcv = document.getElementById('present-cv');
  if(pcv){
    var _pDrag=false, _pLast={x:0,y:0};
    pcv.onmousedown=function(e){ _pDrag=true; _pLast={x:e.clientX,y:e.clientY}; pcv.style.cursor='grabbing'; };
    pcv.onmousemove=function(e){
      if(!_pDrag)return;
      S.pan.x+=(e.clientX-_pLast.x); S.pan.y+=(e.clientY-_pLast.y);
      _pLast={x:e.clientX,y:e.clientY};
      _presentRender();
    };
    pcv.onmouseup=pcv.onmouseleave=function(){ _pDrag=false; pcv.style.cursor='grab'; };
    pcv.style.cursor='grab';
    pcv.onwheel=function(e){
      e.preventDefault();
      var factor=e.deltaY<0?1.12:1/1.12;
      var rect=pcv.getBoundingClientRect();
      var mx=e.clientX-rect.left, my=e.clientY-rect.top;
      S.pan.x=(S.pan.x-mx+pcv.width/2)*factor+mx-pcv.width/2;
      S.pan.y=(S.pan.y-my+pcv.height/2)*factor+my-pcv.height/2;
      S.zoom=Math.max(0.1,Math.min(20,S.zoom*factor));
      _presentRender();
    };
  }

  // Render
  _presentRender();
  _buildPresentLegend();
  _updatePresentHUD();

  // Keyboard: Esc to exit, arrow keys for floors
  document.addEventListener('keydown', _presentKeydown);
  document.addEventListener('keydown', _presentF5, {capture:true});

  // Resize
  window.addEventListener('resize', _presentResize);
  setTimeout(function(){ _presentRender(); _buildPresentLegend(); _updatePresentHUD(); }, 50);

  hint('▶ Modo apresentação — Esc para sair · ← → para mudar piso');
}

function exitPresentMode(){
  document.body.classList.remove('presenting');
  document.removeEventListener('keydown', _presKey);
  setTimeout(function(){ resize(); if(S.lmap){try{S.lmap.invalidateSize();}catch(e){}} render(); }, 80);
}
document.addEventListener('keydown',function(e){
  if(e.key==='F5' && document.getElementById('app').classList.contains('show') && !document.body.classList.contains('presenting')){
    e.preventDefault(); enterPresentMode();
  }
});

function _presentKeydown(e){
  if(e.key==='Escape'){ exitPresentMode(); return; }
  if(e.key==='ArrowRight'||e.key==='ArrowDown'){
    var next = Math.min(FLOOR_CUR+1, FLOORS.length-1);
    if(next!==FLOOR_CUR){ switchFloor(next); _buildPresentFloorTabs(); _presentRender(); _updatePresentHUD(); }
  }
  if(e.key==='ArrowLeft'||e.key==='ArrowUp'){
    var prev = Math.max(FLOOR_CUR-1, 0);
    if(prev!==FLOOR_CUR){ switchFloor(prev); _buildPresentFloorTabs(); _presentRender(); _updatePresentHUD(); }
  }
}

function _presentF5(e){
  if(e.key==='F5' && document.getElementById('present-overlay').style.display==='none'){
    e.preventDefault(); enterPresentMode();
  }
}
function _presentResize(){
  var wrap = document.getElementById('present-canvas-wrap');
  var pcv  = document.getElementById('present-cv');
  var pbgcv= document.getElementById('present-bgcv');
  if(!wrap) return;
  pcv.width = pbgcv.width = wrap.clientWidth;
  pcv.height = pbgcv.height = wrap.clientHeight;
  _presentRender();
}

function _buildPresentFloorTabs(){
  var bar = document.getElementById('present-floor-tabs');
  if(!bar) return;
  bar.innerHTML = FLOORS.map(function(fl, i){
    var active = i===FLOOR_CUR;
    return '<button onclick="switchFloor('+i+');_buildPresentFloorTabs();_presentRender();_updatePresentHUD();" style="'
      +'padding:5px 14px;border-radius:6px;font-size:11px;font-weight:'+(active?700:500)+';cursor:pointer;'
      +'font-family:var(--f);border:1px solid '+(active?'var(--acc)':'var(--bdr2)')+';'
      +'background:'+(active?'rgba(59,130,246,.15)':'transparent')+';'
      +'color:'+(active?'var(--acc)':'var(--txt2)')+';transition:all .1s;white-space:nowrap">'
      +fl.name+'</button>';
  }).join('');
}

function _updatePresentHUD(){
  var devCount = S.placed.length;
  var CAMTYPES=['dome','bullet','ptz','fisheye','turret','thermal_bi'];
  var cams = S.placed.filter(function(p){var d=gD(p.libId);return d&&CAMTYPES.indexOf(d.type)>=0;}).length;
  var el = document.getElementById('present-devcount');
  if(el) el.textContent = devCount+' dispositivo'+(devCount!==1?'s':'')+(cams?' · '+cams+' câmara'+(cams!==1?'s':''):'');
  var scaleEl = document.getElementById('present-scale-pill');
  if(scaleEl) scaleEl.textContent = S.scale.ok ? S.scale.ppm.toFixed(1)+' px/m' : 'Escala não definida';
}

function _presentRender(){
  var pcv = document.getElementById('present-cv');
  if(!pcv) return;

  var W = pcv.width, H = pcv.height;

  // If canvas has no size yet, try to get it from wrapper
  if(!W || !H){
    var wrap = document.getElementById('present-canvas-wrap');
    if(wrap){
      W = wrap.clientWidth || window.innerWidth;
      H = wrap.clientHeight || (window.innerHeight - 52);
      pcv.width = document.getElementById('present-bgcv').width = W;
      pcv.height = document.getElementById('present-bgcv').height = H;
    }
    if(!W || !H) return;
  }

  // Save main canvas original state
  var savedW = cv.width, savedH = cv.height;
  var savedPanX = S.pan.x, savedPanY = S.pan.y;
  var savedZoom = S.zoom;

  // Resize main canvas to present size
  cv.width = bgcv.width = W;
  cv.height = bgcv.height = H;
  // Shift pan so same world centre appears in new canvas size
  S.pan.x = savedPanX + (W - savedW) / 2;
  S.pan.y = savedPanY + (H - savedH) / 2;

  // Render into main canvas at present size
  render();

  // Copy result to present canvas
  var pctx = pcv.getContext('2d');
  pctx.clearRect(0, 0, W, H);
  pctx.drawImage(cv, 0, 0);

  // Draw subtle grid on present bg canvas
  var pbgcv = document.getElementById('present-bgcv');
  if(pbgcv){
    var pbg = pbgcv.getContext('2d');
    pbg.fillStyle = '#050810'; pbg.fillRect(0, 0, W, H);
    var step = S.scale.ok ? S.scale.ppm * 5 * S.zoom : 60 * S.zoom;
    if(step >= 12 && step < 300){
      var ox = ((S.pan.x + W/2) % step + step) % step;
      var oy = ((S.pan.y + H/2) % step + step) % step;
      pbg.strokeStyle = 'rgba(25,40,70,0.8)'; pbg.lineWidth = 0.5;
      pbg.beginPath();
      for(var x = ox - step; x < W + step; x += step){ pbg.moveTo(x,0); pbg.lineTo(x,H); }
      for(var y = oy - step; y < H + step; y += step){ pbg.moveTo(0,y); pbg.lineTo(W,y); }
      pbg.stroke();
    }
  }

  // Restore main canvas dimensions and re-render silently
  cv.width = bgcv.width = savedW;
  cv.height = bgcv.height = savedH;
  S.pan.x = savedPanX;
  S.pan.y = savedPanY;
  // Don't call render() here - it would flicker. The main canvas will
  // be re-rendered naturally on next user interaction or resize.
  // Just clear it to avoid showing stale present-sized content
  ctx.clearRect(0, 0, savedW, savedH);
  bg.clearRect(0, 0, savedW, savedH);
  render();
}

function _buildPresentLegend(){
  var el = document.getElementById('present-legend-items');
  if(!el) return;
  var CAMTYPES=['dome','bullet','ptz','fisheye','turret','thermal_bi'];
  var types = {};
  S.placed.forEach(function(p){
    var d=gD(p.libId); if(!d) return;
    var key=d.type; if(!types[key]) types[key]={dev:d,count:0};
    types[key].count++;
  });
  var typeLabels={dome:'Dome',bullet:'Bullet',ptz:'PTZ',fisheye:'Fisheye',hub:'Hub',pir_indoor:'PIR Interior',pir_outdoor:'PIR Exterior',door:'Contato Magnético',glass:'Vidro',combi:'Combi',siren_ext:'Sirene Ext.',siren_int:'Sirene Int.',keypad:'Teclado',remote:'Telecomando',relay:'Relé',fire:'Detetor Fogo',leak:'Detetor Água'};
  el.innerHTML = Object.keys(types).map(function(t){
    var d=types[t].dev, n=types[t].count;
    return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">'
      +'<div style="width:10px;height:10px;border-radius:50%;background:'+d.color+';flex-shrink:0;box-shadow:0 0 6px '+d.color+'80"></div>'
      +'<span style="font-size:11px;color:var(--txt2);flex:1">'+(typeLabels[t]||t)+'</span>'
      +'<span style="font-family:var(--m);font-size:11px;font-weight:700;color:var(--acc3)">'+n+'</span>'
      +'</div>';
  }).join('');
}

// Rebuild legend when floor changes in present mode
var _origSwitchFloor = switchFloor;
switchFloor = function(idx){
  _origSwitchFloor(idx);
  if(document.getElementById('present-overlay').style.display!=='none'){
    setTimeout(function(){ _buildPresentLegend(); },50);
  }
};

// ════════════════════════════════════════
// TRAÇADO MANUAL DE CABO
// ════════════════════════════════════════
var CABLE_ROUTE = {
  active: false,   // a traçar agora?
  camId:  null,    // câmara activa
  pts:    []       // pontos do percurso (world coords)
};

// Cada placed device pode ter: p.cableRoute = [{x,y},...] | null
// Se null → usa linha reta NVR (teórica)

function startCableRoute(){
  if(!NVR_POS){
    notify('⚠ Defina primeiro a posição do NVR/Hub');
    hint('📍 Clique em "Definir posição NVR/Hub" para marcar o gravador na planta');
    return;
  }
  if(!S.scale.ok){
    notify('⚠ Defina a escala antes de traçar o percurso');
    return;
  }
  var pc = fP(S.selId);
  if(!pc){ notify('⚠ Selecione uma câmara primeiro'); return; }

  // Start from camera position
  // Keep the previous route until the edited route is confirmed.
  CABLE_ROUTE.active = true;
  CABLE_ROUTE.camId  = pc.id;
  CABLE_ROUTE.pts    = [{x: NVR_POS.x, y: NVR_POS.y}]; // start at NVR
  S.tool = 'cable';
  cw.style.cursor = 'crosshair';
  document.getElementById('btn-cable-route').textContent = '⏹ Terminar (duplo-clique)';
  document.getElementById('btn-cable-route').style.background = 'rgba(239,68,68,.15)';
  var st = document.getElementById('cable-route-status');
  if(st){ st.style.display=''; st.textContent='0 pontos · 0.0 m'; }
  hint('🔌 Clique para adicionar pontos · Duplo-clique para terminar · Esc para cancelar');
}

function _finishCableRoute(){
  var pc = fP(CABLE_ROUTE.camId);
  if(pc && CABLE_ROUTE.pts.length >= 2){
    // Add camera as last point
    CABLE_ROUTE.pts.push({x: pc.x, y: pc.y});
    pushUndo();pc.cableRoute = JSON.parse(JSON.stringify(CABLE_ROUTE.pts));pc.cableAnchor='end';if(typeof sigsV6MarkDirty==='function')sigsV6MarkDirty();
    var len = _cableRouteLen(pc);
    notify('✓ Rota guardada — ' + len.toFixed(1) + ' m de percurso');
  }
  _resetCableRoute();
  updateCablePanel(); render();
}

function _cancelCableRoute(){
  _resetCableRoute();
  render();
  notify('Rota cancelada');
}

function _resetCableRoute(){
  CABLE_ROUTE.active = false;
  CABLE_ROUTE.pts    = [];
  S.tool = null;
  S.tmpLine = null;
  cw.style.cursor = 'default';
  var btn = document.getElementById('btn-cable-route');
  if(btn){ btn.textContent = '✏ Traçar rota do cabo'; btn.style.background = ''; }
  var st = document.getElementById('cable-route-status');
  if(st) st.style.display = 'none';
  _refreshCableButtons();
}

function _refreshCableButtons(){
  var pc = fP(S.selId);
  var hasRoute = pc && pc.cableRoute && pc.cableRoute.length >= 2;
  var clrBtn = document.getElementById('btn-cable-clear');
  if(clrBtn) clrBtn.style.display = hasRoute ? '' : 'none';
}

function clearCableRoute(){
  var pc = fP(S.selId); if(!pc) return;
  pc.cableRoute = null;
  _refreshCableButtons();
  updateCablePanel(); render();
  notify('🗑 Rota removida — a usar linha reta');
}

function _cableRouteLen(p){
  if(!p.cableRoute || p.cableRoute.length < 2) return 0;
  var total = 0;
  for(var i=1; i<p.cableRoute.length; i++){
    var a=p.cableRoute[i-1], b=p.cableRoute[i];
    total += Math.sqrt((b.x-a.x)*(b.x-a.x)+(b.y-a.y)*(b.y-a.y));
  }
  return total * S.scale.mpp;
}

// Override cableForCam to use manual route when available
var _origCableForCam = cableForCam;
cableForCam = function(p){
  if(p.cableRoute && p.cableRoute.length >= 2 && S.scale.ok){
    var planDist = _cableRouteLen(p);
    var height   = p.instHeight || 3;
    return {planDist: planDist, cable: planDist + height + 2, isManual: true};
  }
  return _origCableForCam(p);
};

// Hook onClick for cable routing
var _cableOrigOnClick = onClick;
onClick = function(e){
  if(CABLE_ROUTE.active && S.tool === 'cable'){
    var pos=ep(e), w=s2w(pos.x,pos.y);
    CABLE_ROUTE.pts.push({x:w.x, y:w.y});
    // Update status
    var total=0;
    for(var i=1;i<CABLE_ROUTE.pts.length;i++){
      var a=CABLE_ROUTE.pts[i-1],b=CABLE_ROUTE.pts[i];
      total+=Math.sqrt((b.x-a.x)*(b.x-a.x)+(b.y-a.y)*(b.y-a.y));
    }
    var st=document.getElementById('cable-route-status');
    if(st) st.textContent=CABLE_ROUTE.pts.length+' pontos · '+(total*S.scale.mpp).toFixed(1)+' m';
    render();
    return;
  }
  _cableOrigOnClick(e);
};

// Double-click to finish
cv.addEventListener('dblclick', function(e){
  if(CABLE_ROUTE.active && S.tool==='cable'){
    e.preventDefault(); e.stopPropagation();
    _finishCableRoute();
  }
});

// Escape cancels
document.addEventListener('keydown', function(e){
  if(e.key==='Escape' && CABLE_ROUTE.active){ _cancelCableRoute(); }
}, true);

// onMove: show preview segment while drawing
var _cableOrigOnMove = onMove;
onMove = function(e){
  if(CABLE_ROUTE.active && S.tool==='cable' && CABLE_ROUTE.pts.length >= 1){
    var pos=ep(e), w=s2w(pos.x,pos.y);
    var last=CABLE_ROUTE.pts[CABLE_ROUTE.pts.length-1];
    S.tmpLine={x1:last.x, y1:last.y, x2:w.x, y2:w.y, col:'#10b981'};
    render();
    return;
  }
  _cableOrigOnMove(e);
};

// Override render to draw manual routes and active route
var _cableOrigRender = render;
render = function(){
  _cableOrigRender();

  // Draw saved manual routes (green dashed, replaces straight line)
  S.placed.forEach(function(p){
    if(window.SIGSNetwork&&SIGSNetwork.enabled()&&SIGS_COMMERCIAL.network.assignments[p.id])return;
    if(!p.cableRoute || p.cableRoute.length < 2) return;
    var isSel = p.id === S.selId;
    ctx.save();
    ctx.strokeStyle = isSel ? 'rgba(239,68,68,1)' : 'rgba(239,68,68,.7)';
    ctx.lineWidth   = isSel ? 3 : 2;
    ctx.setLineDash([10,5]);
    ctx.beginPath();
    var s0=w2s(p.cableRoute[0].x,p.cableRoute[0].y);
    ctx.moveTo(s0.x,s0.y);
    for(var i=1;i<p.cableRoute.length;i++){
      var si=w2s(p.cableRoute[i].x,p.cableRoute[i].y);
      ctx.lineTo(si.x,si.y);
    }
    ctx.stroke();
    // Always show distance label at midpoint of route
    if(S.scale.ok){
      var mid=Math.floor(p.cableRoute.length/2);
      var sm=w2s(p.cableRoute[mid].x,p.cableRoute[mid].y);
      var lbl=_cableRouteLen(p).toFixed(1)+'m ✏';
      ctx.setLineDash([]);
      ctx.font='bold 9px monospace';
      var tw=ctx.measureText(lbl).width;
      ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillRect(sm.x-tw/2-3,sm.y-9,tw+6,13);
      ctx.fillStyle='#ef4444';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(lbl,sm.x,sm.y-2);
    }
    // Waypoint dots when selected
    if(isSel){
      ctx.setLineDash([]);
      p.cableRoute.forEach(function(pt,idx){
        var sp=w2s(pt.x,pt.y);
        ctx.beginPath();ctx.arc(sp.x,sp.y,idx===0||idx===p.cableRoute.length-1?5:3,0,Math.PI*2);
        ctx.fillStyle=idx===0?'#f59e0b':idx===p.cableRoute.length-1?'#3b82f6':'#ef4444';
        ctx.fill();
      });
    }
    ctx.restore();
  });

  // Draw active route being drawn
  if(CABLE_ROUTE.active && CABLE_ROUTE.pts.length >= 1){
    ctx.save();
    ctx.strokeStyle='rgba(239,68,68,.9)';ctx.lineWidth=2.5;ctx.setLineDash([10,5]);
    ctx.beginPath();
    var p0=w2s(CABLE_ROUTE.pts[0].x,CABLE_ROUTE.pts[0].y);
    ctx.moveTo(p0.x,p0.y);
    for(var j=1;j<CABLE_ROUTE.pts.length;j++){
      var pj=w2s(CABLE_ROUTE.pts[j].x,CABLE_ROUTE.pts[j].y);
      ctx.lineTo(pj.x,pj.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);
    CABLE_ROUTE.pts.forEach(function(pt,idx){
      var sp=w2s(pt.x,pt.y);
      ctx.beginPath();ctx.arc(sp.x,sp.y,4,0,Math.PI*2);
      ctx.fillStyle=idx===0?'#f59e0b':'#ef4444';ctx.fill();
    });
    ctx.restore();
  }
};

// Update cable panel to show manual route info
var _cableOrigUpdatePanel = updateCablePanel;
updateCablePanel = function(){
  _cableOrigUpdatePanel();
  _refreshCableButtons();
  var pc = fP(S.selId); if(!pc) return;
  if(pc.cableRoute && pc.cableRoute.length >= 2){
    var distEl = document.getElementById('cable-dist');
    if(distEl){
      var cd = cableForCam(pc);
      if(cd) distEl.textContent = cd.planDist.toFixed(1)+' m ✏';
    }
  }
};

// ════════════════════════════════════════
// ════════════════════════════════════════
// DISK CALCULATOR — JS (synced with new HTML)
// ════════════════════════════════════════

var DC_BRANDS = {
  hikvision:{name:'Hikvision',icon:'🔴',color:'#e63946',logoURL:null,
    codecs:[
      {id:'hk_h265pro',  label:'H.265 Pro+',  note:'Estimativa inteligente · confirme bitrate da câmara', factor:0.18},
      {id:'hk_h265plus', label:'H.265+',       note:'Estimativa inteligente · depende da cena',        factor:0.22},
      {id:'hk_h265',     label:'H.265',        note:'HEVC · estimativa de projeto',                       factor:0.30},
      {id:'hk_h264plus', label:'H.264+',       note:'H.264 otimizado · estimativa',      factor:0.38},
      {id:'hk_h264',     label:'H.264',        note:'Baseline',                            factor:0.50},
    ],defaultCodec:'hk_h265plus',
    resolutions:[
      {id:'2mp',label:'2 MP · 1080p',base:16},{id:'4mp',label:'4 MP · 1440p',base:24},
      {id:'5mp',label:'5 MP',base:32},{id:'6mp',label:'6 MP',base:38},
      {id:'8mp',label:'8 MP · 4K',base:48},{id:'12mp',label:'12 MP',base:64},
    ]},
  dahua:{name:'Dahua',icon:'🟡',color:'#f59e0b',logoURL:null,
    codecs:[
      {id:'dh_s265plus', label:'Smart H.265+', note:'Estimativa inteligente · confirme bitrate', factor:0.18},
      {id:'dh_s265',     label:'Smart H.265',  note:'Estimativa inteligente · depende da cena', factor:0.23},
      {id:'dh_h265',     label:'H.265',        note:'HEVC · estimativa de projeto', factor:0.30},
      {id:'dh_s264plus', label:'Smart H.264+', note:'H.264 com AI Dahua',              factor:0.28},
      {id:'dh_h264',     label:'H.264',        note:'Baseline',                        factor:0.50},
    ],defaultCodec:'dh_s265plus',
    resolutions:[
      {id:'2mp',label:'2 MP · 1080p',base:16},{id:'4mp',label:'4 MP · 1440p',base:24},
      {id:'5mp',label:'5 MP',base:32},{id:'8mp',label:'8 MP · 4K',base:48},
      {id:'12mp',label:'12 MP',base:64},
    ]},
  uniview:{name:'Uniview (UNV)',icon:'🔵',color:'#3b82f6',logoURL:null,
    codecs:[
      {id:'uv_ultra265max',label:'Ultra 265 · cena muito calma', note:'Cenário até 95% abaixo de H.264; só validar com bitrate medido. Não é um modo oficial',factor:0.025},
      {id:'uv_ultra265adv',label:'Ultra 265 · cena calma', note:'Hipótese de projeto: 87,5% abaixo de H.264; a atividade e a luz podem aumentar o bitrate',factor:0.0625},
      {id:'uv_ultra265',   label:'Ultra 265 · cenário de projeto', note:'Hipótese: 75% abaixo de H.264 a 25 fps. Confirma bitrate médio real; não é um modo oficial.',factor:0.125},
      {id:'uv_h265',       label:'H.265',         note:'HEVC · estimativa de projeto',factor:0.30},
      {id:'uv_h264',       label:'H.264',         note:'Baseline',                            factor:0.50},
    ],defaultCodec:'uv_ultra265',
    resolutions:[
      {id:'2mp',label:'2 MP · 1080p',base:16},{id:'4mp',label:'4 MP · 1440p',base:24},
      {id:'5mp',label:'5 MP',base:32},{id:'8mp',label:'8 MP · 4K',base:48},
      {id:'12mp',label:'12 MP',base:64},
    ]},
  safire:{name:'Safire Smart',icon:'🟢',color:'#10b981',logoURL:null,
    codecs:[
      {id:'sf_sfcodec',  label:'SF-Codec',  note:'Estimativa inteligente · confirme bitrate', factor:0.18},
      {id:'sf_h265pro',  label:'H.265 Pro', note:'H.265 otimizado · estimativa',factor:0.21},
      {id:'sf_h265plus', label:'H.265+',    note:'Estimativa inteligente · depende da cena',factor:0.24},
      {id:'sf_h265',     label:'H.265',     note:'HEVC · estimativa de projeto',factor:0.30},
      {id:'sf_h264plus', label:'H.264+',    note:'H.264 melhorado Safire',              factor:0.35},
      {id:'sf_h264',     label:'H.264',     note:'Baseline',                            factor:0.50},
    ],defaultCodec:'sf_sfcodec',
    resolutions:[
      {id:'2mp',label:'2 MP · 1080p',base:16},{id:'4mp',label:'4 MP · 1440p',base:24},
      {id:'5mp',label:'5 MP',base:32},{id:'8mp',label:'8 MP · 4K',base:48},
      {id:'12mp',label:'12 MP',base:64},
    ]},
};

var DC_ENVS = [
  {id:'industry',   icon:'🏭',name:'Indústria',     motionPct:60,motionFactor:2.8},
  {id:'supermarket',icon:'🛒',name:'Supermercado',  motionPct:50,motionFactor:2.2},
  {id:'commerce',   icon:'🏪',name:'Comércio',      motionPct:35,motionFactor:2.0},
  {id:'office',     icon:'🏢',name:'Escritório',    motionPct:20,motionFactor:1.6},
  {id:'home',       icon:'🏠',name:'Habitação',     motionPct:10,motionFactor:1.4},
];
var DC_HDD_SIZES = [1,2,3,4,6,8,10,12,14,16,18,20];

var _dcBrand = null, _dcEnv = null, _dcCamId = 0, _dcCams = [], _dcMotionOn = false;

// ── Helpers ──────────────────────────────────────────────
function dcGetCodecFactor(id){
  if(!_dcBrand) return 0.5;
  var c=DC_BRANDS[_dcBrand].codecs.find(function(c){return c.id===id;});
  return c?c.factor:0.5;
}
function dcGetResBase(id){
  if(!_dcBrand) return 16;
  var r=DC_BRANDS[_dcBrand].resolutions.find(function(r){return r.id===id;});
  return r?r.base:16;
}
function dcGetCodecNote(id){
  if(!_dcBrand) return '';
  var c=DC_BRANDS[_dcBrand].codecs.find(function(c){return c.id===id;});
  return c?c.note:'';
}
function dcFmtGB(gb){if(window.SIGSEngineeringModel)return SIGSEngineeringModel.displayStorage(gb);return gb>=1024?(gb/1024).toFixed(2)+' TB':Math.ceil(gb)+' GB';}

var _dcUploadTarget = null;
function dcUploadBrandLogo(brand){
  _dcUploadTarget = brand;
  document.getElementById('dc-brand-logo-input').click();
}
function dcOnBrandLogoFile(e){
  var file=e.target.files[0]; if(!file||!_dcUploadTarget) return;
  var r=new FileReader();
  r.onload=function(ev){
    DC_BRANDS[_dcUploadTarget].logoURL=ev.target.result;
    // Update brand card
    var el=document.getElementById('dc-blogo-'+_dcUploadTarget);
    if(el) el.innerHTML='<img src="'+ev.target.result+'" style="width:38px;height:38px;object-fit:contain;border-radius:8px">';
    // If this is the selected brand, refresh nav too
    if(_dcBrand===_dcUploadTarget) dcRefreshNav();
    notify('Logo da '+DC_BRANDS[_dcUploadTarget].name+' atualizado');
  };
  r.readAsDataURL(file); e.target.value='';
}

// ── Logo upload ──────────────────────────────────────────
function dcLoadLogo(e){
  var file=e.target.files[0]; if(!file) return;
  var r=new FileReader();
  r.onload=function(ev){
    if(_dcBrand) DC_BRANDS[_dcBrand].logoURL=ev.target.result;
    dcRefreshNav(); dcRefreshBrandCard();
  };
  r.readAsDataURL(file); e.target.value='';
}

function dcRefreshNav(){
  if(!_dcBrand) return;
  var b=DC_BRANDS[_dcBrand];
  var logo=document.getElementById('dc-nav-logo');
  if(logo){
    logo.style.background=b.color+'22';
    logo.style.borderColor=b.color+'55';
    logo.innerHTML=b.logoURL?'<img src="'+b.logoURL+'" style="width:28px;height:28px;object-fit:contain;border-radius:6px">':b.icon;
  }
  var t=document.getElementById('dc-nav-title');
  if(t) t.innerHTML=b.name+' <span style="color:var(--acc4)">Calculador</span>';
  var def=b.codecs.find(function(c){return c.id===b.defaultCodec;});
  var s=document.getElementById('dc-nav-sub');
  if(s) s.textContent=def?def.label+' · '+def.note:'';
}

function dcRefreshBrandCard(){
  if(!_dcBrand) return;
  var b=DC_BRANDS[_dcBrand];
  var el=document.getElementById('dc-blogo-'+_dcBrand);
  if(!el) return;
  if(b.logoURL){el.innerHTML='<img src="'+b.logoURL+'" style="width:38px;height:38px;object-fit:contain;border-radius:8px">';}
  else{el.innerHTML=b.icon;el.style.fontSize='22px';}
}

// ── Show section with animation ──────────────────────────
function dcShowPanel(id){
  var el=document.getElementById(id); if(!el) return;
  el.style.display='';
  requestAnimationFrame(function(){
    el.style.opacity='1'; el.style.transform='translateY(0)';
  });
}

// ── Select brand ─────────────────────────────────────────
function dcSelectBrand(brand){
  _dcBrand=brand;
  var b=DC_BRANDS[brand];

  // Brand tiles
  document.querySelectorAll('.dc-brand-tile').forEach(function(el){
    var isSel=el.dataset.brand===brand;
    el.classList.toggle('sel',isSel);
    if(isSel){
      el.style.borderColor=b.color+'88';
      el.style.background=b.color+'15';
      el.style.boxShadow='0 6px 20px rgba(0,0,0,.35),0 0 0 1px '+b.color+'33 inset';
    } else {
      el.style.borderColor='';el.style.background='';el.style.boxShadow='';
    }
  });

  // Update nav
  dcRefreshNav();
  dcRefreshBrandCard();

  // Brand tag
  var bt=document.getElementById('dc-brand-tag');
  if(bt) bt.innerHTML='<span style="color:'+b.color+';font-weight:700">'+b.icon+' '+b.name+'</span>';

  // Scene pills
  var sb=document.getElementById('dc-scene-bar');
  if(sb){sb.style.display='flex';dcBuildScenePills();}

  // Show panels
  dcShowPanel('dc-env-panel');
  dcShowPanel('dc-cam-panel');
  dcShowPanel('dc-ret-panel');

  // Build env
  dcBuildEnvStrip();

  // Cameras
  if(_dcCams.length===0) dcAddCam();
  else dcRebuildCams();

  dcCalc();
}

// ── Environment strip ────────────────────────────────────
function dcBuildEnvStrip(){
  var strip=document.getElementById('dc-env-strip');
  if(!strip) return;
  strip.innerHTML='';
  DC_ENVS.forEach(function(env){
    var d=document.createElement('div');
    d.className='dc-env-card'+(_dcEnv===env.id?' sel':'');
    d.innerHTML='<div class="dec-icon">'+env.icon+'</div>'+
      '<div class="dec-name">'+env.name+'</div>'+
      '<div class="dec-pct">'+env.motionPct+'% mov.</div>';
    d.onclick=function(){dcSelectEnv(env.id);};
    strip.appendChild(d);
  });
}

function dcBuildScenePills(){
  var pills=document.getElementById('dc-scene-pills');
  if(!pills) return;
  pills.innerHTML='';
  DC_ENVS.forEach(function(env){
    var p=document.createElement('div');
    p.className='dc-scene-pill'+(_dcEnv===env.id?' active':'');
    p.id='dc-pill-'+env.id;
    p.textContent=env.icon+' '+env.name;
    p.onclick=function(){dcSelectEnv(env.id);};
    pills.appendChild(p);
  });
}

// ── Select environment ───────────────────────────────────
function dcSelectEnv(envId){
  _dcEnv=envId;
  var env=DC_ENVS.find(function(e){return e.id===envId;}); if(!env) return;

  // Update strip
  document.querySelectorAll('.dc-env-card').forEach(function(el,i){
    el.classList.toggle('sel',DC_ENVS[i]&&DC_ENVS[i].id===envId);
  });
  // Update pills
  document.querySelectorAll('.dc-scene-pill').forEach(function(el){
    el.classList.toggle('active', el.id==='dc-pill-'+envId);
  });
  // Update env tag
  var et=document.getElementById('dc-env-tag');
  if(et) et.innerHTML='<span style="color:var(--acc4)">'+env.icon+' '+env.name+'</span>';

  // Auto-enable motion + set values
  _dcMotionOn=true;
  var btn=document.getElementById('dc-toggle-btn');
  if(btn) btn.classList.add('on');
  var mr=document.getElementById('dc-motion-row');
  if(mr) mr.classList.add('on');
  var md=document.getElementById('dc-motion-detail');
  if(md) md.style.display='';

  var pctEl=document.getElementById('dc-motion-pct');
  var facEl=document.getElementById('dc-motion-factor');
  if(pctEl){pctEl.value=env.motionPct; document.getElementById('dc-mpct-v').textContent=env.motionPct+'%';}
  if(facEl){facEl.value=env.motionFactor; document.getElementById('dc-mfactor-v').textContent=env.motionFactor.toFixed(1)+'×';}
  document.getElementById('dc-mfactor-tag').textContent=env.motionFactor.toFixed(1);

  var desc=document.getElementById('dc-motion-desc');
  if(desc) desc.textContent=env.motionPct+'% do tempo em movimento · ×'+env.motionFactor.toFixed(1)+' bitrate';

  dcUpdateMotionViz();
  dcCalc();
}

// ── Motion toggle ────────────────────────────────────────
function dcToggleMotion(){
  _dcMotionOn=!_dcMotionOn;
  var btn=document.getElementById('dc-toggle-btn');
  var row=document.getElementById('dc-motion-row');
  var detail=document.getElementById('dc-motion-detail');
  if(btn) btn.classList.toggle('on',_dcMotionOn);
  if(row) row.classList.toggle('on',_dcMotionOn);
  if(detail) detail.style.display=_dcMotionOn?'':'none';
  dcCalc();
}

function dcOnMotionChange(){
  var pct=document.getElementById('dc-motion-pct').value;
  var fac=parseFloat(document.getElementById('dc-motion-factor').value||2).toFixed(1);
  document.getElementById('dc-mpct-v').textContent=pct+'%';
  document.getElementById('dc-mfactor-v').textContent=fac+'×';
  document.getElementById('dc-mfactor-tag').textContent=fac;
  dcUpdateMotionViz();
  dcCalc();
}

function dcUpdateMotionViz(){
  var pct=parseFloat((document.getElementById('dc-motion-pct')||{}).value||30);
  var still=document.getElementById('dc-mv-still');
  var move=document.getElementById('dc-mv-move');
  if(still) still.style.width=(100-pct)+'%';
  if(move){move.style.left=(100-pct)+'%';move.style.width=pct+'%';}
}


function dcRecordingModeChanged(){
  var mode=(document.getElementById('dc-record-mode')||{value:'continuous'}).value;
  var pct=document.getElementById('dc-event-pct');
  var duty=document.getElementById('dc-record-duty');
  var note=document.getElementById('dc-record-note');
  var eventMode=mode==='event';
  if(pct)pct.disabled=!eventMode;
  var p=eventMode?Math.min(100,Math.max(1,parseFloat((pct||{value:30}).value)||30)):100;
  if(duty)duty.textContent=p.toFixed(0)+'%';
  if(note)note.innerHTML=eventMode
    ?'<strong>Evento / Movimento:</strong> o armazenamento é calculado apenas para '+p.toFixed(0)+'% do período configurado. Use uma percentagem baseada na atividade real do local.'
    :'<strong>Contínua:</strong> considera gravação durante todas as horas configuradas. Para gravação por evento, escolha “Evento / Movimento” e indique a percentagem média real de atividade.';
  return p/100;
}

// ── Camera rows ──────────────────────────────────────────
function dcMakeResOpts(selId){
  if(!_dcBrand) return '';
  return DC_BRANDS[_dcBrand].resolutions.map(function(r){
    return '<option value="'+r.id+'"'+(r.id===selId?' selected':'')+'>'+r.label+'</option>';
  }).join('');
}
function dcMakeCodecOpts(selId){
  if(!_dcBrand) return '';
  var def=selId||DC_BRANDS[_dcBrand].defaultCodec;
  return DC_BRANDS[_dcBrand].codecs.map(function(c){
    return '<option value="'+c.id+'"'+(c.id===def?' selected':'')+'>'+c.label+'</option>';
  }).join('');
}

function dcAddCam(){
  if(!_dcBrand) return;
  _dcCamId++;
  var id=_dcCamId;
  _dcCams.push({id:id,name:'Câmara '+id,resId:'2mp',codecId:DC_BRANDS[_dcBrand].defaultCodec,fps:25,bitrate:null,qty:1});
  var list=document.getElementById('dc-cam-list');
  var card=dcMakeCamCard(id);
  list.appendChild(card);
  dcCalc();
}

function dcMakeCamCard(id){
  var cam=_dcCams.find(function(c){return c.id===id;}); if(!cam||!_dcBrand) return document.createElement('div');
  var b=DC_BRANDS[_dcBrand];
  var brBase=dcEffectiveBitrate(cam);

  var card=document.createElement('div');
  card.className='dc-cam-card';
  card.id='dc-camcard-'+id;

  var fpsopts=[1,5,10,12,15,20,25,30].map(function(f){
    return '<option value="'+f+'"'+(f===cam.fps?' selected':'')+'>'+f+' fps</option>';
  }).join('');

  card.innerHTML=
    '<div class="dc-cam-head">'+
      '<div class="dc-cam-idx">'+id+'</div>'+
      '<input class="dc-cam-name" value="'+cam.name+'" oninput="_dcCamName('+id+',this.value)">'+
      '<span class="dc-cam-br" id="dc-cbr-'+id+'">'+brBase.toFixed(2)+' Mbps</span>'+
      '<button class="dc-cam-del-btn" onclick="dcDelCam('+id+')" title="Remover">✕</button>'+
    '</div>'+
    '<div class="dc-cam-body">'+
      '<div class="dc-cf"><label>RESOLUÇÃO</label><select onchange="_dcCamSet('+id+',\'resId\',this.value)">'+dcMakeResOpts(cam.resId)+'</select></div>'+
      '<div class="dc-cf"><label>CODEC</label><select onchange="_dcCamSet('+id+',\'codecId\',this.value)">'+dcMakeCodecOpts(cam.codecId)+'</select></div>'+
      '<div class="dc-cf"><label>FPS</label><select onchange="_dcCamSet('+id+',\'fps\',+this.value)">'+fpsopts+'</select></div>'+
      '<div class="dc-cf"><label>BITRATE</label><div class="dc-bitrate-wrap"><input type="number" min="0.1" max="100" step="0.1" placeholder="Auto" value="'+(cam.bitrate||'')+'" oninput="_dcCamBitrate('+id+',this.value)"><span class="dc-bitrate-unit">Mbps</span></div></div>'+
      '<div class="dc-cf"><label>QTD.</label><input type="number" value="'+cam.qty+'" min="1" max="999" oninput="_dcCamSet('+id+',\'qty\',+this.value)"></div>'+
      '<div class="dc-cam-tot"><div class="l">TOTAL</div><div class="v" id="dc-ctot-'+id+'">—</div></div>'+
    '</div>'+
    '<div class="dc-cam-note"><div class="dc-cam-dot" id="dc-cdot-'+id+'" style="background:'+b.color+'"></div><span id="dc-cnote-'+id+'">'+dcGetCodecNote(cam.codecId)+'</span></div>';
  return card;
}

function dcRebuildCams(){
  var list=document.getElementById('dc-cam-list');
  list.innerHTML='';
  _dcCams.forEach(function(cam){
    if(_dcBrand&&!DC_BRANDS[_dcBrand].codecs.find(function(c){return c.id===cam.codecId;})){
      cam.codecId=DC_BRANDS[_dcBrand].defaultCodec;
    }
    list.appendChild(dcMakeCamCard(cam.id));
  });
}

function _dcCamName(id,v){var c=_dcCams.find(function(c){return c.id===id;});if(c)c.name=v;}
function _dcCamBitrate(id,v){
  var c=_dcCams.find(function(c){return c.id===id;});if(!c)return;
  var n=parseFloat(v);
  c.bitrate=(isFinite(n)&&n>0)?n:null;
  dcCalc();
}
function dcAutoBitrate(cam){
  if(window.SIGSEngineeringModel)return SIGSEngineeringModel.bitrate(parseFloat(cam.resId)||4,cam.codecId,cam.fps);
  return dcGetResBase(cam.resId)*dcGetCodecFactor(cam.codecId)*Math.min(Math.max(cam.fps,1)/25,1.2);
}
function dcEffectiveBitrate(cam){
  return (cam.bitrate&&cam.bitrate>0)?cam.bitrate:dcAutoBitrate(cam);
}
function _dcCamSet(id,k,v){
  var c=_dcCams.find(function(c){return c.id===id;}); if(!c) return;
  c[k]=v;
  var br=dcEffectiveBitrate(c);
  var brel=document.getElementById('dc-cbr-'+id);
  if(brel) brel.textContent=br.toFixed(2)+' Mbps';
  var note=document.getElementById('dc-cnote-'+id);
  if(note) note.textContent=dcGetCodecNote(c.codecId);
  dcCalc();
}
function dcDelCam(id){
  _dcCams=_dcCams.filter(function(c){return c.id!==id;});
  var el=document.getElementById('dc-camcard-'+id); if(el) el.remove();
  dcCalc();
}

// ── MAIN CALCULATION ─────────────────────────────────────
function dcCalc(){
  if(!_dcBrand||!_dcCams.length) return;
  var b        = DC_BRANDS[_dcBrand];
  var days     = Math.max(1,parseInt((document.getElementById('dc-days')||{value:30}).value)||30);
  var hours    = Math.min(24,Math.max(1,parseInt((document.getElementById('dc-hours')||{value:24}).value)||24));
  var raidPct  = parseInt((document.getElementById('dc-raid')||{value:0}).value)||0;
  var margPct  = Math.max(0,Number((document.getElementById('dc-margin')||{value:20}).value));
  var overheadPct=parseInt((document.getElementById('dc-overhead')||{value:5}).value)||0;
  var recordDuty=dcRecordingModeChanged();
  var recordMode=(document.getElementById('dc-record-mode')||{value:'continuous'}).value;
  var motPct   = _dcMotionOn?(parseFloat((document.getElementById('dc-motion-pct')||{value:30}).value)||30)/100:0;
  var motFac   = _dcMotionOn?(parseFloat((document.getElementById('dc-motion-factor')||{value:2}).value)||2):1;

  var totalCams=0,totalPeakBW=0,totalRecordedBW=0,totalRaw=0,groups=[];
  var seconds=3600*hours*days;
  var mbpsToGB=seconds/8*1e6/(1024*1024*1024);

  _dcCams.forEach(function(cam){
    var baseBr=dcEffectiveBitrate(cam);
    // Scene-complexity simulation affects the bitrate while a stream is being recorded.
    var motMix=_dcMotionOn&&!cam.bitrate?((1-motPct)*1+motPct*motFac):1;
    var streamBr=baseBr*motMix;
    var recordedBr=streamBr*recordDuty;
    var gbCam=recordedBr*mbpsToGB;
    var gbGrp=gbCam*cam.qty;

    totalCams+=cam.qty;
    totalPeakBW+=streamBr*cam.qty;
    totalRecordedBW+=recordedBr*cam.qty;
    totalRaw+=gbGrp;

    var brel=document.getElementById('dc-cbr-'+cam.id);
    if(brel){
      var src=cam.bitrate&&cam.bitrate>0?'manual':'auto';
      brel.textContent=streamBr.toFixed(2)+' Mbps · '+src+(motMix>1?' ⚡':'');
    }
    var totel=document.getElementById('dc-ctot-'+cam.id);
    if(totel)totel.textContent=dcFmtGB(gbGrp);

    groups.push({name:cam.name,qty:cam.qty,gb:gbGrp,bitrate:streamBr,recordedBitrate:recordedBr});
  });

  // Overhead covers filesystem/container/NVR protocol allowance.
  var gbOverhead=totalRaw*(1+overheadPct/100);
  var gbRaid=gbOverhead*(1+raidPct/100);
  var gbFinal=gbRaid*(1+margPct/100);
  var tbFinal=gbFinal*Math.pow(1024,3)/1e12;

  // Reference without scene-complexity simulation.
  var rawNoMotion=_dcCams.reduce(function(s,cam){
    return s+dcEffectiveBitrate(cam)*recordDuty*mbpsToGB*cam.qty;
  },0);
  var gbFinalNoMotion=rawNoMotion*(1+overheadPct/100)*(1+raidPct/100)*(1+margPct/100);

  var badge=document.getElementById('dc-total-badge');
  if(badge)badge.textContent=totalCams+(totalCams===1?' câm.':' câm.');

  document.getElementById('dc-empty').style.display='none';
  var rc=document.getElementById('dc-res-content');
  rc.style.display='flex';

  var col=tbFinal>50?'#ef4444':tbFinal>10?'#f59e0b':'#10b981';
  var heroNum=document.getElementById('dc-hero-num');
  if(heroNum){
    heroNum.textContent=dcFmtGB(gbFinal);
    heroNum.style.color=col;
    heroNum.classList.remove('dc-hero-bump');
    void heroNum.offsetWidth;
    heroNum.classList.add('dc-hero-bump');
    setTimeout(function(){heroNum.classList.remove('dc-hero-bump');},250);
  }
  var heroUnit=document.getElementById('dc-hero-unit');
  if(heroUnit)heroUnit.textContent='armazenamento total · '+days+' dias · '+(recordMode==='event'?'evento':'contínua');
  var heroSub=document.getElementById('dc-hero-sub');
  if(heroSub)heroSub.innerHTML=
    '<strong style="color:var(--acc3)">'+totalCams+'</strong> câmara'+(totalCams===1?'':'s')+
    ' · rede estimada '+(totalPeakBW>=1000?(totalPeakBW/1000).toFixed(2)+' Gbps':totalPeakBW.toFixed(1)+' Mbps')+
    ' · gravação média '+(totalRecordedBW>=1000?(totalRecordedBW/1000).toFixed(2)+' Gbps':totalRecordedBW.toFixed(1)+' Mbps');

  var hero=document.getElementById('dc-hero');
  if(hero)hero.style.setProperty('--hero-glow',col+'20');

  dcDrawGauge(tbFinal,col);

  function setStat(id,v){var el=document.getElementById(id);if(el)el.textContent=v;}
  setStat('dc-s-cams',totalCams+(totalCams===1?' câmara':' câmaras'));
  setStat('dc-s-bw',totalPeakBW>=1000?(totalPeakBW/1000).toFixed(2)+' Gbps':totalPeakBW.toFixed(1)+' Mbps');
  setStat('dc-s-rec-bw',totalRecordedBW>=1000?(totalRecordedBW/1000).toFixed(2)+' Gbps':totalRecordedBW.toFixed(1)+' Mbps');
  setStat('dc-s-raw',dcFmtGB(totalRaw));
  setStat('dc-s-raid',dcFmtGB(gbRaid)+(raidPct?' + reserva '+raidPct+'%':''));
  setStat('dc-s-margin',dcFmtGB(gbFinal)+' · margem '+margPct+'%');
  setStat('dc-s-days',days+'d · '+hours+'h/dia · '+Math.round(recordDuty*100)+'%');

  var imp=document.getElementById('dc-impact');
  if(_dcMotionOn&&imp){
    imp.style.display='';
    setStat('dc-mi-base',dcFmtGB(gbFinalNoMotion));
    setStat('dc-mi-motion',dcFmtGB(gbFinal));
    var diff=gbFinal-gbFinalNoMotion;
    var diffPct=gbFinalNoMotion>0?(diff/gbFinalNoMotion*100):0;
    setStat('dc-mi-diff',(diff>=0?'+':'')+dcFmtGB(Math.ceil(Math.abs(diff)))+' ('+(diff>=0?'+':'')+diffPct.toFixed(0)+'%)');
  } else if(imp)imp.style.display='none';

  var hddGrid=document.getElementById('dc-hdd-grid');
  if(hddGrid){
    hddGrid.innerHTML='';
    var best=[];
    DC_HDD_SIZES.forEach(function(t){
      var q=Math.ceil(gbFinal/(t*1e12/Math.pow(1024,3)));
      if(q>=1&&q<=32)best.push({t:t,q:q,tot:t*1e12/Math.pow(1024,3)*q});
    });
    // Prefer the first option using at most 4 disks, otherwise nearest larger set.
    var preferred=0;
    for(var i=0;i<best.length;i++){if(best[i].q<=4){preferred=i;break;}}
    var from=Math.max(0,preferred-1);
    best.slice(from,from+4).forEach(function(h,idx){
      var isBest=(from+idx)===preferred;
      var d=document.createElement('div');
      d.className='dc-hdd-card'+(isBest?' best':'');
      d.innerHTML='<div class="dc-hdd-tb">'+h.t+' TB</div>'+
        '<div class="dc-hdd-qty">'+h.q+' disco'+(h.q!==1?'s':'')+'</div>'+
        '<div style="font-size:7.5px;color:var(--txt3);margin-top:1px">'+dcFmtGB(h.tot)+'</div>';
      hddGrid.appendChild(d);
    });
  }

  var gw=document.getElementById('dc-groups-wrap');
  var gb2=document.getElementById('dc-group-bars');
  if(groups.length>1&&gw&&gb2){
    gw.style.display='';
    gb2.innerHTML='';
    var maxGB=Math.max.apply(null,groups.map(function(g){return g.gb;}));
    groups.forEach(function(g){
      var pct=maxGB>0?(g.gb/maxGB*100):0;
      gb2.innerHTML+='<div class="dc-bar">'+
        '<span class="dc-bar-lbl" title="'+g.name+(g.qty>1?' ×'+g.qty:'')+'">'+g.name+(g.qty>1?' ×'+g.qty:'')+'</span>'+
        '<div class="dc-bar-track"><div class="dc-bar-fill" style="width:'+pct.toFixed(0)+'%;background:'+b.color+'"></div></div>'+
        '<span class="dc-bar-val">'+dcFmtGB(g.gb)+'</span>'+
      '</div>';
    });
  } else if(gw)gw.style.display='none';
}

// ── Gauge ─────────────────────────────────────────────────
function dcDrawGauge(tbVal,col){
  var c=document.getElementById('dc-gauge'); if(!c) return;
  var ctx2=c.getContext('2d'),W=c.width,H=c.height;
  ctx2.clearRect(0,0,W,H);

  var cx=W/2,cy=H-12,r=Math.min(W/2,H)-12;
  var maxTB=Math.max(tbVal*1.5,5);
  var pct=Math.min(tbVal/maxTB,1);

  // Background track
  ctx2.beginPath();ctx2.arc(cx,cy,r,Math.PI,0);
  ctx2.strokeStyle='rgba(255,255,255,.07)';ctx2.lineWidth=12;ctx2.lineCap='round';ctx2.stroke();

  // Colored fill
  if(pct>0){
    // Gradient along arc
    var grd=ctx2.createLinearGradient(cx-r,0,cx+r,0);
    grd.addColorStop(0,'#10b981');grd.addColorStop(0.5,col);grd.addColorStop(1,col);
    ctx2.beginPath();ctx2.arc(cx,cy,r,Math.PI,Math.PI+Math.PI*pct);
    ctx2.strokeStyle=grd;ctx2.lineWidth=12;ctx2.lineCap='round';ctx2.stroke();
  }

  // Needle
  var angle=Math.PI+Math.PI*pct;
  var nx=cx+Math.cos(angle)*(r-2),ny=cy+Math.sin(angle)*(r-2);
  ctx2.beginPath();ctx2.moveTo(cx,cy);ctx2.lineTo(nx,ny);
  ctx2.strokeStyle=col;ctx2.lineWidth=2;ctx2.lineCap='round';ctx2.stroke();
  ctx2.beginPath();ctx2.arc(cx,cy,5,0,Math.PI*2);
  ctx2.fillStyle=col;ctx2.fill();

  // Value text
  ctx2.fillStyle=col;
  ctx2.font='bold 18px monospace';
  ctx2.textAlign='center';ctx2.textBaseline='bottom';
  ctx2.fillText(tbVal>=1?tbVal.toFixed(1)+' TB':Math.ceil(tbVal*1024)+' GB',cx,cy-4);

  // Scale labels
  ctx2.fillStyle='rgba(255,255,255,.2)';ctx2.font='8px monospace';ctx2.textBaseline='top';
  ctx2.textAlign='left';ctx2.fillText('0',cx-r-2,cy+4);
  ctx2.textAlign='right';ctx2.fillText(maxTB.toFixed(0)+'TB',cx+r+2,cy+4);

  // Gauge label below
  var gl=document.getElementById('dc-gauge-label');
  if(gl) gl.textContent=(pct*100).toFixed(0)+'% da capacidade estimada';
}

// ── Export ────────────────────────────────────────────────
function dcExportTxt(){
  if(!_dcBrand||!_dcCams.length){notify('Nenhum dado para exportar');return;}
  var b=DC_BRANDS[_dcBrand];
  var days=(document.getElementById('dc-days')||{value:30}).value;
  var hours=(document.getElementById('dc-hours')||{value:24}).value;
  var mode=(document.getElementById('dc-record-mode')||{value:'continuous'}).value;
  var duty=mode==='event'?(document.getElementById('dc-event-pct')||{value:30}).value:100;
  var overhead=(document.getElementById('dc-overhead')||{value:5}).value;
  var raid=(document.getElementById('dc-raid')||{value:0}).value;
  var margin=(document.getElementById('dc-margin')||{value:20}).value;
  var heroEl=document.getElementById('dc-hero-num');
  var bwEl=document.getElementById('dc-s-bw');
  var recBwEl=document.getElementById('dc-s-rec-bw');

  var lines=[
    '═══════════════════════════════════════════',
    '  RELATÓRIO TÉCNICO DE ARMAZENAMENTO CCTV',
    '  SIGS Studio',
    '═══════════════════════════════════════════',
    'Data:        '+new Date().toLocaleDateString('pt-PT'),
    'Marca:       '+b.name,
    'Retenção:    '+days+' dias · '+hours+'h/dia',
    'Gravação:    '+(mode==='event'?'Evento / Movimento · '+duty+'% do tempo':'Contínua · 100% do tempo'),
    'Overhead:    +'+overhead+'%',
    'Redundância: +'+raid+'%',
    'Margem:      +'+margin+'%',
    _dcMotionOn?'Complexidade de cena: simulação ativa':'Complexidade de cena: simulação desativada',
    '',
    '── Câmaras ──────────────────────────────'
  ];

  _dcCams.forEach(function(cam){
    var r=DC_BRANDS[_dcBrand].resolutions.find(function(r){return r.id===cam.resId;})||{label:'?'};
    var codec=DC_BRANDS[_dcBrand].codecs.find(function(c){return c.id===cam.codecId;})||{label:'?'};
    var br=dcEffectiveBitrate(cam);
    lines.push(
      '  '+cam.name+' ×'+cam.qty+': '+r.label+' · '+codec.label+' · '+cam.fps+'fps · '+
      br.toFixed(2)+' Mbps '+(cam.bitrate?'(manual)':'(auto)')
    );
  });

  lines=lines.concat([
    '',
    '── Resultado ────────────────────────────',
    '  Capacidade recomendada: '+(heroEl?heroEl.textContent:'—'),
    '  Rede estimada:          '+(bwEl?bwEl.textContent:'—'),
    '  Bitrate gravado médio:  '+(recBwEl?recBwEl.textContent:'—'),
    '',
    'Nota: cálculo de projeto. Para dimensionamento final, usar o bitrate configurado/medido em cada câmara sempre que disponível.',
    '═══════════════════════════════════════════'
  ]);

  var txt=lines.join('\n');
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(function(){notify('✓ Relatório copiado');}).catch(function(){dcFallbackCopy(txt);});
  }else dcFallbackCopy(txt);
}

// ── Show / Hide ───────────────────────────────────────────
function showDiskCalc(){
  document.getElementById('launcher').classList.add('gone');
  document.getElementById('app').style.display='none';
  document.getElementById('disk-calc-app').classList.add('visible');
}
function hideDiskCalc(){
  var app=document.getElementById('disk-calc-app');
  app.classList.remove('visible');
  // Reset state
  _dcBrand=null;_dcEnv=null;_dcCamId=0;_dcCams=[];_dcMotionOn=false;
  ['dc-env-panel','dc-cam-panel','dc-ret-panel'].forEach(function(id){
    var el=document.getElementById(id);
    if(el){el.style.display='none';el.style.opacity='0';el.style.transform='translateY(6px)';}
  });
  document.getElementById('dc-cam-list').innerHTML='';
  document.getElementById('dc-empty').style.display='';
  document.getElementById('dc-res-content').style.display='none';
  document.getElementById('dc-scene-bar').style.display='none';
  document.querySelectorAll('.dc-brand-tile').forEach(function(el){
    el.classList.remove('sel');el.style.borderColor='';el.style.background='';el.style.boxShadow='';
  });
  var logo=document.getElementById('dc-nav-logo');
  if(logo){logo.innerHTML='💾';logo.style.background='var(--bg2)';logo.style.borderColor='var(--bdr2)';}
  var t=document.getElementById('dc-nav-title');
  if(t) t.innerHTML='Calculador de Disco <span style="color:var(--acc4)">NVR</span>';
  var s=document.getElementById('dc-nav-sub');
  if(s) s.textContent='Selecione a marca para começar';
  var bt=document.getElementById('dc-brand-tag');
  if(bt) bt.textContent='Escolha a marca';
  var toggle=document.getElementById('dc-toggle-btn');
  if(toggle) toggle.classList.remove('on');
  var mr=document.getElementById('dc-motion-row');
  if(mr) mr.classList.remove('on');
  var md=document.getElementById('dc-motion-detail');
  if(md) md.style.display='none';
}

// Patch startModule / backToLauncher
var _dcStart=startModule;
startModule=function(mod){if(mod==='disk'){showDiskCalc();return;}_dcStart(mod);};
var _dcBack=backToLauncher;
backToLauncher=function(){hideDiskCalc();_dcBack();};

var _darkTheme = true;

function sigsUpdateThemeControls(){
  var label=_darkTheme?'☀️ Modo Dia':'🌙 Modo Noite';
  document.querySelectorAll('.sigs-theme-toggle').forEach(function(btn){
    btn.textContent=label;
    btn.setAttribute('title',_darkTheme?'Mudar para modo Dia':'Mudar para modo Noite');
    btn.setAttribute('aria-label',_darkTheme?'Mudar para modo Dia':'Mudar para modo Noite');
  });

  var tb=document.getElementById('tb-theme');
  if(tb){
    tb.textContent=_darkTheme?'☀️':'🌙';
    tb.setAttribute('title',_darkTheme?'Mudar para modo Dia':'Mudar para modo Noite');
    tb.setAttribute('aria-label',_darkTheme?'Mudar para modo Dia':'Mudar para modo Noite');
  }

  /* Older theme buttons in module toolbars */
  document.querySelectorAll('button.tb[onclick="toggleTheme()"]').forEach(function(btn){
    if(btn.id!=='tb-theme'){
      btn.textContent=_darkTheme?'☀️':'🌙';
      btn.setAttribute('title',_darkTheme?'Mudar para modo Dia':'Mudar para modo Noite');
    }
  });

  var meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute('content',_darkTheme?'#050810':'#eef3f9');
}

function sigsApplyTheme(silent){
  document.body.classList.toggle('light',!_darkTheme);
  sigsUpdateThemeControls();

  try{localStorage.setItem('sigs-theme',_darkTheme?'dark':'light');}catch(e){}

  var bgEl=document.getElementById('bgcv');
  if(bgEl){
    var bg2ctx=bgEl.getContext('2d');
    bg2ctx.fillStyle=_darkTheme?'#070a12':'#eef3f9';
    bg2ctx.fillRect(0,0,bgEl.width,bgEl.height);
  }

  if(typeof render==='function'){
    try{render();}catch(e){}
  }

  if(!silent && typeof notify==='function'){
    notify(_darkTheme?'🌙 Modo Noite':'☀️ Modo Dia');
  }
}

function toggleTheme(){
  _darkTheme=!_darkTheme;
  sigsApplyTheme(false);
}

/* Restore the user's choice on every visit. Default remains the current Night mode. */
(function(){
  var saved=null;
  try{saved=localStorage.getItem('sigs-theme');}catch(e){}
  _darkTheme=saved!=='light';
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){sigsApplyTheme(true);},{once:true});
  }else{
    sigsApplyTheme(true);
  }
})();

// Update render background for light mode
var _origRenderFn = render;
render = function(){
  _origRenderFn();
  if(!_darkTheme){
    var bgEl2 = document.getElementById('bgcv');
    if(bgEl2){
      var bg2c = bgEl2.getContext('2d');
      bg2c.fillStyle = '#f1f4f8';
      bg2c.fillRect(0,0,bgEl2.width,bgEl2.height);
      // Re-draw grid in light mode
      if(S.layers && S.layers.grid){
        var step = S.scale.ok ? S.scale.ppm*5*S.zoom : 60*S.zoom;
        if(step >= 14){
          var W2=bgEl2.width,H2=bgEl2.height;
          var ox2=((S.pan.x+W2/2)%step+step)%step, oy2=((S.pan.y+H2/2)%step+step)%step;
          bg2c.strokeStyle='rgba(60,80,140,0.08)'; bg2c.lineWidth=0.5;
          bg2c.beginPath();
          for(var gx=ox2-step;gx<W2+step;gx+=step){bg2c.moveTo(gx,0);bg2c.lineTo(gx,H2);}
          for(var gy=oy2-step;gy<H2+step;gy+=step){bg2c.moveTo(0,gy);bg2c.lineTo(W2,gy);}
          bg2c.stroke();
          var o2=w2s(0,0);
          bg2c.strokeStyle='rgba(37,99,235,0.12)'; bg2c.lineWidth=1;
          bg2c.beginPath();bg2c.moveTo(o2.x,0);bg2c.lineTo(o2.x,H2);bg2c.moveTo(0,o2.y);bg2c.lineTo(W2,o2.y);bg2c.stroke();
        }
      }
    }
  }
};

// ════════════════════════════════════════
// LIBRARY SEARCH / FILTER
// ════════════════════════════════════════
var _libSearchTerm = '';

// Show search bar when CCTV module starts
var _origStartMod = startModule;
startModule = function(mod){
  _origStartMod(mod);
  var sw = document.getElementById('lib-search-wrap');
  if(sw) sw.style.display = mod==='cctv' ? '' : 'none';
  _libSearchTerm = '';
  var si = document.getElementById('lib-search');
  if(si) si.value = '';
};

function filterLib(term){
  _libSearchTerm = (term||'').toLowerCase().trim();
  renderDevList();
  // Auto-open all families when searching
  if(_libSearchTerm){
    _libFamilyOpen = {cctv:true, hikvision:true, dahua:true, uniview:true, radar:true, thermal:true, custom:true, ax_int:true, ax_ext:true, ax_acc:true, fr_cen:true, fr_bat:true, fr_det:true, fr_sir:true};
  }
}

// Patch _makeDevItem to hide non-matching items
var _origMakeDevItem = _makeDevItem;
_makeDevItem = function(dev){
  var el = _origMakeDevItem(dev);
  if(_libSearchTerm){
    var haystack = (dev.name+' '+dev.model+' '+(dev.desc||'')+' '+dev.type+' '+(dev.brand||'')).toLowerCase();
    if(haystack.indexOf(_libSearchTerm) < 0){
      el.style.display = 'none';
    }
  }
  return el;
};

// ════════════════════════════════════════
// URL / CLIPBOARD IMPORT
// ════════════════════════════════════════
var _uiClipDataURL = null;

function openUrlImport(){
  _uiClipDataURL = null;
  document.getElementById('ui-url-input').value='';
  document.getElementById('ui-url-preview').style.display='none';
  document.getElementById('ui-url-err').style.display='none';
  document.getElementById('ui-load-btn').style.display='none';
  document.getElementById('ui-clip-preview').style.display='none';
  document.getElementById('ui-clip-load-btn').style.display='none';
  uiTab('url');
  openM('m-urlimport');
}
function uiTab(t){
  document.getElementById('ui-panel-url').style.display  = t==='url'  ? '' : 'none';
  document.getElementById('ui-panel-clip').style.display = t==='clip' ? '' : 'none';
  var u=document.getElementById('ui-tab-url'), c=document.getElementById('ui-tab-clip');
  u.style.borderBottomColor = t==='url'  ? 'var(--acc)' : 'transparent';
  u.style.color             = t==='url'  ? 'var(--acc)' : 'var(--txt3)';
  c.style.borderBottomColor = t==='clip' ? 'var(--acc)' : 'transparent';
  c.style.color             = t==='clip' ? 'var(--acc)' : 'var(--txt3)';
}
function uiPreviewURL(){
  var url = document.getElementById('ui-url-input').value.trim();
  if(!url){ notify('Cole um URL válido'); return; }
  var errEl = document.getElementById('ui-url-err');
  var prevEl = document.getElementById('ui-url-preview');
  var img = document.getElementById('ui-url-img');
  errEl.style.display='none'; prevEl.style.display='none';
  document.getElementById('ui-load-btn').style.display='none';
  img.onload = function(){
    prevEl.style.display='';
    document.getElementById('ui-load-btn').style.display='';
  };
  img.onerror = function(){
    errEl.textContent='Não foi possível carregar a imagem. Verifique o URL ou use um proxy de imagem.';
    errEl.style.display='';
  };
  img.src = url;
}
function uiLoadURL(){
  var url = document.getElementById('ui-url-img').src;
  if(!url) return;
  // Load as cross-origin image into canvas
  var img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function(){
    _applyImportedImage(img, url);
    closeM('m-urlimport');
    notify('✓ Planta importada por URL');
  };
  img.onerror = function(){
    // Try without CORS (display only, canvas will be tainted)
    var img2 = new Image();
    img2.onload = function(){
      _applyImportedImage(img2, url);
      closeM('m-urlimport');
      notify('✓ Planta carregada (sem CORS — exportação PNG pode falhar)');
    };
    img2.onerror = function(){ notify('Erro ao carregar imagem'); };
    img2.src = url;
  };
  img.src = url;
}
function uiDrop(e){
  e.preventDefault();
  document.getElementById('ui-clip-drop').style.borderColor='var(--bdr2)';
  var files = e.dataTransfer.files;
  if(files && files[0] && files[0].type.startsWith('image/')){
    _uiReadFile(files[0]);
  }
}
function uiFileLoad(e){
  var f = e.target.files[0]; if(!f) return;
  _uiReadFile(f); e.target.value='';
}
function _uiReadFile(file){
  var r = new FileReader();
  r.onload = function(ev){
    _uiClipDataURL = ev.target.result;
    var img = document.getElementById('ui-clip-img');
    img.src = _uiClipDataURL;
    document.getElementById('ui-clip-preview').style.display='';
    document.getElementById('ui-clip-load-btn').style.display='';
  };
  r.readAsDataURL(file);
}
function uiLoadClip(){
  if(!_uiClipDataURL){ notify('Nenhuma imagem'); return; }
  var img = new Image();
  img.onload = function(){
    _applyImportedImage(img, _uiClipDataURL);
    closeM('m-urlimport');
    notify('✓ Planta importada');
  };
  img.src = _uiClipDataURL;
}
function _applyImportedImage(img, dataURL){
  var iw = img.naturalWidth||800, ih = img.naturalHeight||600;
  var sc = Math.min(1, (cv.width*.88/S.zoom)/iw, (cv.height*.88/S.zoom)/ih);
  var fw = Math.round(iw*sc), fh = Math.round(ih*sc);
  S.fp = {img:img, imgData:dataURL, x:-fw/2, y:-fh/2, w:fw, h:fh, opa:1.0, locked:true};
  sigsSetPlantLocked(true);fitView(); updateStats();
}
// Global Ctrl+V handler for paste-anywhere
document.addEventListener('paste', function(e){
  if(!document.getElementById('m-urlimport').classList.contains('hide')) return; // handled by modal
  var items = e.clipboardData && e.clipboardData.items;
  if(!items) return;
  for(var i=0;i<items.length;i++){
    if(items[i].type.indexOf('image')>=0){
      var blob = items[i].getAsFile();
      if(blob){
        var r = new FileReader();
        r.onload = function(ev){
          var img = new Image();
          img.onload = function(){
            _applyImportedImage(img, ev.target.result);
            notify('✓ Planta colada do clipboard (Ctrl+V)');
          };
          img.src = ev.target.result;
        };
        r.readAsDataURL(blob);
        e.preventDefault();
        return;
      }
    }
  }
});
// Paste inside modal
document.addEventListener('paste', function(e){
  if(document.getElementById('m-urlimport').classList.contains('hide')) return;
  var panel = document.getElementById('ui-panel-clip');
  if(!panel || panel.style.display==='none') return;
  var items = e.clipboardData && e.clipboardData.items;
  if(!items) return;
  for(var i=0;i<items.length;i++){
    if(items[i].type.indexOf('image')>=0){
      var blob = items[i].getAsFile();
      if(blob){ _uiReadFile(blob); e.preventDefault(); return; }
    }
  }
});

// ════════════════════════════════════════
// LARGURA DE BANDA
// ════════════════════════════════════════
function buildBandwidth(cams){
  var el = document.getElementById('bw-summary');
  if(!el) return;
  if(!cams || !cams.length){
    el.innerHTML='<p style="font-size:11px;color:var(--txt3)">Nenhuma câmara no projeto.</p>';
    return;
  }

  // Per-codec totals
  var codecGroups={}, totalMbps=0, peakMbps=0;
  var codecOrder=['ultra265m','ultra265a','ultra265b','h265','h264'];

  cams.forEach(function(p){
    var mp = p.mp||4, codec = p.codec||'ultra265b';
    var br = (BITRATE_TABLE[codec]||BITRATE_TABLE.h265)[mp]||4;
    totalMbps += br;
    if(br > peakMbps) peakMbps = br;
    if(!codecGroups[codec]) codecGroups[codec]={count:0, total:0};
    codecGroups[codec].count++;
    codecGroups[codec].total+=br;
  });

  var switchNeeded = totalMbps > 100 ? '1 Gbps' : '100 Mbps';
  var switchModel  = totalMbps > 900 ? 'Switch 10G recomendado' : totalMbps > 100 ? 'Switch PoE 1G' : 'Switch PoE Fast Ethernet';
  var statusCol    = totalMbps > 800 ? 'var(--acc2)' : totalMbps > 400 ? 'var(--acc4)' : 'var(--acc3)';

  // Bar chart — max width = 200px representing max theoretical (all h264 12MP)
  var maxTheoretical = cams.length * 24; // worst case all 12MP H.264
  var barPct = Math.min(100, (totalMbps / Math.max(maxTheoretical, totalMbps*1.3)) * 100);

  var html = '';
  // Summary card
  html += '<div style="padding:8px 10px;border-radius:7px;background:var(--bg3);border:1px solid var(--bdr2);margin-bottom:8px">';
  html += '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px">';
  html += '<span style="font-size:11px;color:var(--txt2)">'+ cams.length +' câmaras</span>';
  html += '<span style="font-family:var(--m);font-size:16px;font-weight:700;color:'+statusCol+'">'+totalMbps.toFixed(1)+' Mbps</span>';
  html += '</div>';
  // Progress bar
  html += '<div style="height:6px;border-radius:3px;background:var(--bg4);overflow:hidden;margin-bottom:6px">';
  html += '<div style="height:100%;width:'+barPct.toFixed(0)+'%;background:'+statusCol+';border-radius:3px;transition:width .4s"></div>';
  html += '</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px">';
  html += '<div style="text-align:center;padding:4px;background:var(--bg2);border-radius:5px"><div style="font-size:8px;color:var(--txt3);margin-bottom:2px">TOTAL</div><div style="font-family:var(--m);font-size:11px;font-weight:700;color:'+statusCol+'">'+totalMbps.toFixed(1)+' Mbps</div></div>';
  html += '<div style="text-align:center;padding:4px;background:var(--bg2);border-radius:5px"><div style="font-size:8px;color:var(--txt3);margin-bottom:2px">POR CÂMARA</div><div style="font-family:var(--m);font-size:11px;font-weight:700;color:var(--acc4)">'+(totalMbps/cams.length).toFixed(2)+' Mbps</div></div>';
  html += '<div style="text-align:center;padding:4px;background:var(--bg2);border-radius:5px"><div style="font-size:8px;color:var(--txt3);margin-bottom:2px">REDE MIN.</div><div style="font-family:var(--m);font-size:11px;font-weight:700;color:var(--acc)">'+switchNeeded+'</div></div>';
  html += '</div></div>';

  // Per-codec breakdown
  html += '<div style="margin-bottom:8px">';
  codecOrder.forEach(function(codec){
    var g = codecGroups[codec]; if(!g) return;
    var label = codecLabel(codec);
    var pct = Math.min(100, (g.total/Math.max(totalMbps,1))*100);
    html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">';
    html += '<span style="font-size:9px;color:var(--txt3);width:90px;flex-shrink:0;font-family:var(--m)">'+label.split('(')[0].trim()+'</span>';
    html += '<div style="flex:1;height:5px;background:var(--bg4);border-radius:3px;overflow:hidden">';
    html += '<div style="height:100%;width:'+pct.toFixed(0)+'%;background:var(--acc);border-radius:3px"></div>';
    html += '</div>';
    html += '<span style="font-family:var(--m);font-size:9px;color:var(--txt2);width:52px;text-align:right">'+g.total.toFixed(1)+' Mbps</span>';
    html += '<span style="font-size:9px;color:var(--txt3);width:18px;text-align:right">×'+g.count+'</span>';
    html += '</div>';
  });
  html += '</div>';

  // Switch recommendation
  html += '<div style="padding:7px 9px;border-radius:6px;border:1px solid var(--bdr2);background:var(--bg3);display:flex;align-items:center;gap:8px">';
  html += '<span style="font-size:16px">🔀</span>';
  html += '<div><div style="font-size:11px;font-weight:600;color:var(--txt)">'+switchModel+'</div>';
  html += '<div style="font-size:9px;color:var(--txt3);margin-top:1px">'+totalMbps.toFixed(1)+' Mbps total · '+switchNeeded+' portas</div></div>';
  html += '</div>';

  el.innerHTML = html;
}

// Patch buildSystemTab to call buildBandwidth
var _origBuildSystemTab = buildSystemTab;
buildSystemTab = function(){
  _origBuildSystemTab();
  saveCurrentFloor();
  var allP=[];
  FLOORS.forEach(function(fl){ allP=allP.concat(fl.placed); });
  var CAMTYPES=['dome','bullet','ptz','fisheye','turret','radar','thermal_bi'];
  var cams=allP.filter(function(p){ var d=gD(p.libId); return d&&CAMTYPES.indexOf(d.type)>=0; });
  buildBandwidth(cams);
};

// Criminalidade PT removida na V6.
