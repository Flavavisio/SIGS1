/* SIGS Studio — satellite viewer. MapLibre 5.6.0, CSS-pixel capture and scale. */
(function(w){
  'use strict';
  var legacy={open:w.openMap,close:w.closeMap,search:w.doSearch,capture:w.captureMapTiles,lock:w._applyMapLock};
  var map=null,marker=null,observer=null,fallback=false,capturing=false,searchId=0,viewId=0,sourceFailed=false;
  var credit='Imagery © Esri, Maxar, Earthstar Geographics';
  var roadCredit='Esri, HERE, Garmin, © OpenStreetMap contributors';
  var names=true;
  function el(id){return document.getElementById(id);}
  function mpp(lat,zoom){return 40075016.68557849*Math.cos(lat*Math.PI/180)/(512*Math.pow(2,zoom));}
  function style(){
    var root='https://server.arcgisonline.com/ArcGIS/rest/services/';
    function raster(path,attribution){return {type:'raster',tiles:[root+path+'/MapServer/tile/{z}/{y}/{x}'],tileSize:256,maxzoom:19,attribution:attribution};}
    return {version:8,sources:{
      'sigs-satellite':raster('World_Imagery',credit),
      'sigs-roads':raster('Reference/World_Transportation',roadCredit),
      'sigs-places':raster('Reference/World_Boundaries_and_Places','Esri, Garmin')
    },layers:[
      {id:'sigs-satellite',type:'raster',source:'sigs-satellite',paint:{'raster-fade-duration':0}},
      {id:'sigs-roads',type:'raster',source:'sigs-roads',layout:{visibility:names?'visible':'none'},paint:{'raster-fade-duration':0}},
      {id:'sigs-places',type:'raster',source:'sigs-places',layout:{visibility:names?'visible':'none'},paint:{'raster-fade-duration':0}}
    ]};
  }
  function status(text){var n=el('sigs-map-status');if(n)n.textContent=text;}
  function resize(){if(!w.S||!S.mapOpen)return;if(map)map.resize();else if(S.lmap)S.lmap.invalidateSize();}
  function observe(){if(observer||!w.ResizeObserver)return;observer=new ResizeObserver(resize);observer.observe(el('leafmap'));}
  function show(){
    viewId++;
    S.mapOpen=true;el('mapwrap').classList.add('show');document.body.classList.add('sigs-map-open');
    el('mapbtn').classList.add('on');el('mapbtn').textContent='✕ Fechar Mapa';
    observe();requestAnimationFrame(resize);
  }
  function reset(error){
    if(map){map.remove();map=null;S.mlmap=null;}
    el('leafmap').innerHTML='';marker=null;fallback=true;
    var b=el('sigs-map-names');if(b)b.hidden=true;
    if(error)console.warn('SIGS MapLibre: '+error.message);
    status(error?(/WebGL/i.test(error.message)?'A aceleração gráfica (WebGL) não está disponível neste navegador. Satélite em modo de compatibilidade.':'Vista de compatibilidade ativa. O mapa gráfico não arrancou: '+error.message):'Vista de compatibilidade · satélite');legacy.open();observe();requestAnimationFrame(resize);
  }
  w.openMap=function(){
    if(fallback){show();legacy.open();return;}
    show();
    if(map){resize();status('Satélite · procura uma morada ou enquadra a área');return;}
    if(!w.maplibregl){reset();return;}
    try{
      map=new maplibregl.Map({container:'leafmap',style:style(),center:[-9.1392,38.7166],zoom:13,
        minZoom:1,maxZoom:18,bearing:0,pitch:0,dragRotate:false,pitchWithRotate:false,
        touchPitch:false,canvasContextAttributes:{preserveDrawingBuffer:true},attributionControl:false});
      S.mlmap=map;
      map.touchZoomRotate.disableRotation();
      map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
      map.addControl(new maplibregl.ScaleControl({unit:'metric'}),'bottom-left');
      map.addControl(new maplibregl.AttributionControl({compact:false}),'bottom-right');
      map.on('load',function(){resize();status('Satélite Esri · MapLibre');});
      map.on('movestart',function(){sourceFailed=false;});
      map.on('error',function(e){
        if(e.sourceId==='sigs-satellite')sourceFailed=true;
        status('Não foi possível carregar uma camada. Verifica a ligação antes de capturar.');
      });
      map.getCanvas().addEventListener('webglcontextlost',function(e){e.preventDefault();sourceFailed=true;status('Mapa indisponível. Fecha e volta a abrir para tentar novamente.');});
    }catch(e){reset(e);}
  };
  w.closeMap=function(){
    viewId++;searchId++;S.mapOpen=false;document.body.classList.remove('sigs-map-open');legacy.close();
  };
  // A captured plant stays locked; reopening the viewer must still allow a new location.
  w._applyMapLock=function(){
    if(map)return;
    var locked=S.mapLocked;
    if(S.mapOpen)S.mapLocked=false;
    try{legacy.lock();}finally{S.mapLocked=locked;}
  };
  w.sigsMapToggleNames=function(){
    if(!map||!map.isStyleLoaded())return;
    names=!names;['sigs-roads','sigs-places'].forEach(function(id){map.setLayoutProperty(id,'visibility',names?'visible':'none');});
    var b=el('sigs-map-names');b.setAttribute('aria-pressed',String(names));b.textContent=names?'Nomes das ruas ✓':'Nomes das ruas';
  };
  w.doSearch=function(){
    if(!map){legacy.search();return;}
    var q=el('mapsrch').value.trim();if(!q)return;
    var id=++searchId;status('A pesquisar…');
    fetch('https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(q)+'&limit=1',{headers:{'Accept-Language':'pt'}})
      .then(function(r){if(!r.ok)throw new Error('search');return r.json();})
      .then(function(data){
        if(id!==searchId||!S.mapOpen)return;
        if(!data||!data.length){status('Local não encontrado: '+q);return;}
        var result=data[0],lat=Number(result.lat),lng=Number(result.lon);
        if(!Number.isFinite(lat)||!Number.isFinite(lng))throw new Error('coordinates');
        if(marker)marker.remove();
        marker=new maplibregl.Marker({color:'#4169e1'}).setLngLat([lng,lat]).addTo(map);
        map.jumpTo({center:[lng,lat],zoom:16,bearing:0,pitch:0});status('✓ '+result.display_name);
      }).catch(function(){if(id===searchId&&S.mapOpen)status('Não foi possível pesquisar. Verifica a ligação e tenta novamente.');});
  };
  w.captureMapTiles=function(){
    if(!map){legacy.capture();return;}
    if(capturing)return;
    if(!S.mapOpen){notify('Abre o mapa antes de capturar.');return;}
    resize();
    if(sourceFailed||!map.isStyleLoaded()||!map.areTilesLoaded()||map.isMoving()){
      notify('Aguarda o carregamento completo do mapa antes de capturar.');return;
    }
    var div=el('leafmap'),width=div.clientWidth,height=div.clientHeight;
    if(!width||!height){notify('Mapa sem área visível.');return;}
    // Reject rotation/pitch even if another integration enabled them: one uniform scale is otherwise invalid.
    if(Math.abs(map.getPitch())>.001||Math.abs(map.getBearing())>.001){
      map.jumpTo({bearing:0,pitch:0});notify('Mapa alinhado. Aguarda e volta a capturar.');return;
    }
    var token={view:viewId,floor:w.FLOOR_CUR,floors:w.FLOORS,fp:S.fp},center=map.getCenter(),zoom=map.getZoom();
    var meters=mpp(center.lat,zoom),ppm=1/meters,canvas=document.createElement('canvas');
    canvas.width=width;canvas.height=height;capturing=true;
    var data;
    try{
      var ctx=canvas.getContext('2d');ctx.drawImage(map.getCanvas(),0,0,width,height);
      var lines=[credit+' | MapLibre'];if(names)lines.push(roadCredit);
      ctx.font='10px sans-serif';ctx.textAlign='right';
      var labelWidth=Math.min(width,Math.max.apply(null,lines.map(function(line){return ctx.measureText(line).width;}))+16);
      ctx.fillStyle='rgba(255,255,255,.94)';ctx.fillRect(width-labelWidth,height-lines.length*15-6,labelWidth,lines.length*15+6);
      ctx.fillStyle='#263445';lines.forEach(function(line,i){ctx.fillText(line,width-8,height-(lines.length-1-i)*15-7,width-16);});
      data=canvas.toDataURL('image/jpeg',.92);
    }catch(e){capturing=false;notify('Não foi possível capturar o mapa. Tenta novamente.');return;}
    var img=new Image();
    img.onload=function(){
      capturing=false;
      if(!S.mapOpen||viewId!==token.view||w.FLOOR_CUR!==token.floor||w.FLOORS!==token.floors||S.fp!==token.fp)return;
      S.fp={img:img,imgData:data,x:-width/2,y:-height/2,w:width,h:height,opa:1,locked:true};
      S.scale={ok:true,ppm:ppm,mpp:meters};el('scbadge').textContent=ppm.toFixed(2)+' px/m';
      sigsSetPlantLocked(true);w.closeMap();fitView();updateStats();
      if(typeof w.sigsV6MarkDirty==='function')w.sigsV6MarkDirty();
      notify('Mapa capturado e planta bloqueada. Escala automática: '+ppm.toFixed(2)+' px/m');
    };
    img.onerror=function(){capturing=false;notify('Não foi possível gerar a planta.');};img.src=data;
  };
  w.SIGSMapV56={metersPerPixel:mpp,style:style,resize:resize};
})(window);
