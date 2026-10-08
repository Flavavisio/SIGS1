/* ═══════════════════════════════════════════════════════════════
   SIGS DESIGN — SUPABASE CATALOG MANAGER
   Remote catalogue + local fallback + Super Admin management UI.
   ═══════════════════════════════════════════════════════════════ */
(function(){
  'use strict';

  var CAT={loaded:false,remoteCount:0,products:[],brands:[],loading:null};
  window.SIGS_CATALOG=CAT;

  function clone(v){return JSON.parse(JSON.stringify(v||[]));}
  var LOCAL={
    cctv:clone(window.CCTV_LIB),
    intrusion:clone(window.AJAX_LIB),
    fire:clone(window.FIRE_LIB),
    poe:Object.assign({},window.POE_MODEL_WATTS||{}),
    images:Object.assign({},window.SIGS_PRODUCT_IMAGES||{})
  };
  window.SIGS_LOCAL_CATALOG=LOCAL;

  function cfg(){return typeof _sigsSbCfg==='function'?_sigsSbCfg():{url:'https://kbihedvyykjlbnipdgfm.supabase.co'};}
  function headers(extra){return typeof _sigsSbHeaders==='function'?_sigsSbHeaders(extra||{}):Object.assign({'Content-Type':'application/json'},extra||{});}
  function api(url,opts){return _sigsSbJson(url,opts||{headers:headers()});}
  function esc(v){return String(v==null?'':v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c];});}
  function slugify(s){return String(s||'Generic').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'generic';}
  function currentRole(){return window.CLOUD&&CLOUD.user?(CLOUD.user.role||(CLOUD.user.isSuperAdmin?'SUPER_ADMIN':'')):'';}
  function isSuper(){return currentRole()==='SUPER_ADMIN';}

  function productToDevice(row){
    var s=Object.assign({},row.specifications||{});
    s.id=s.source_id||s.id||row.reference;
    s.model=row.reference||s.model||s.id;
    s.name=row.name||s.name||row.reference;
    s.type=row.device_type||s.type||'equipment';
    s.family=row.family||s.family||String(row.category||'').toLowerCase();
    s.brand=(row.brand&&row.brand.slug)||s.brand||(row.brand&&row.brand.name)||'generic';
    if(row.description)s.desc=row.description;
    if(row.image_url)s.imgUrl=row.image_url;
    if(s.poe_w!=null)s.poeW=Number(s.poe_w)||null;
    s._supabaseId=row.id;
    s._remote=true;
    return s;
  }

  function applyRemote(rows){
    var cctv=[],intrusion=[],fire=[];
    var remoteImages={},remotePoe={};
    var nvrs=[],switches=[],hdds=[];
    (rows||[]).forEach(function(r){
      var d=productToDevice(r),cat=String(r.category||'').toUpperCase(),type=String(r.device_type||'').toLowerCase();
      // Designer library: only placeable field equipment.
      if(cat==='CCTV' && ['nvr','switch','hdd'].indexOf(type)<0)cctv.push(d);
      else if(cat==='FIRE')fire.push(d);
      else if(cat==='INTRUSION'||cat==='ALARM')intrusion.push(d);

      // Infrastructure catalogue used by the recommendation engines.
      var s=r.specifications||{};
      if(type==='nvr')nvrs.push({
        name:r.reference,reference:r.reference,productId:r.id,
        ch:Number(s.channels)||0,maxMP:Number(s.max_mp)||0,bw:Number(s.bandwidth_mbps)||0,hdd:Number(s.hdd_bays)||0,
        brand:(r.brand&&r.brand.name)||'—',remote:true
      });
      if(type==='switch')switches.push({
        name:r.reference,reference:r.reference,productId:r.id,
        ports:Number(s.ports)||0,budget:Number(s.poe_budget_w)||0,uplinkMbps:Number(s.uplink_mbps)||1000,
        brand:(r.brand&&r.brand.name)||'—',note:r.description||'',remote:true
      });
      if(type==='hdd')hdds.push({
        name:r.name,reference:r.reference,productId:r.id,capacityTB:Number(s.capacity_tb)||0,
        brand:(r.brand&&r.brand.name)||'Storage',generic:!!s.generic_capacity,remote:true
      });

      if(r.image_url)remoteImages[r.reference]=r.image_url;
      if(d.poeW>0)remotePoe[r.reference]=d.poeW;
    });
    if(cctv.length)window.CCTV_LIB=window.SIGSAjaxCCTV?SIGSAjaxCCTV.merge(cctv):cctv;
    if(cctv.length&&window.SIGSCCTVExpansion)window.CCTV_LIB=SIGSCCTVExpansion.merge(window.CCTV_LIB);
    if(cctv.length&&window.SIGSCCTVVisiotech)window.CCTV_LIB=SIGSCCTVVisiotech.merge(window.CCTV_LIB);
    if(intrusion.length)window.AJAX_LIB=intrusion;
    if(fire.length)window.FIRE_LIB=fire;
    if(nvrs.length)window.NVR_DB=nvrs;
    if(switches.length)window.POE_SWITCH_DB=switches;
    window.SIGS_HDD_DB=hdds.sort(function(a,b){return a.capacityTB-b.capacityTB;});
    window.SIGS_INFRA_CATALOG={nvrs:nvrs,switches:switches,hdds:window.SIGS_HDD_DB};
    window.SIGS_PRODUCT_IMAGES=Object.assign({},window.SIGS_PRODUCT_IMAGES||{},remoteImages);
    window.POE_MODEL_WATTS=Object.assign({},window.POE_MODEL_WATTS||{},remotePoe);

    if(window.MOD&&window.S&&Array.isArray(S.lib)){
      var base=MOD==='cctv'?window.CCTV_LIB:MOD==='fire'?window.FIRE_LIB:window.AJAX_LIB;
      if(base&&base.length){
        var customs=S.lib.filter(function(x){return x&&x.custom;});
        S.lib=clone(base).concat(customs);
        try{if(typeof renderDevList==='function')renderDevList();}catch(e){}
      }
    }
    try{if(typeof sigsApplyProductImages==='function')sigsApplyProductImages();}catch(e){}
    try{if(typeof sigsV7InfraLoaded==='function')sigsV7InfraLoaded(window.SIGS_INFRA_CATALOG);}catch(e){}
  }

  window.sigsCatalogLoadRemote=function(force){
    if(CAT.loading&&!force)return CAT.loading;
    var token=window.CLOUD&&CLOUD.access;
    if(!token)return Promise.resolve({fallback:true,count:0});
    var url=cfg().url+'/rest/v1/products?select=id,reference,name,category,family,device_type,image_url,description,specifications,active,brand:product_brands(name,slug)&active=eq.true&order=name.asc';
    CAT.loading=api(url,{headers:headers()}).then(function(rows){
      CAT.products=rows||[];CAT.remoteCount=CAT.products.length;CAT.loaded=true;
      if(CAT.products.length)applyRemote(CAT.products);
      return Promise.all([
        api(cfg().url+'/rest/v1/product_brands?select=id,name,slug,active&order=name.asc',{headers:headers()}),
        Promise.resolve(rows||[])
      ]).then(function(x){CAT.brands=x[0]||[];return {fallback:!CAT.products.length,count:CAT.products.length,products:CAT.products};});
    }).catch(function(err){
      CAT.loaded=false;CAT.remoteCount=0;
      console.warn('SIGS catalog remote unavailable; local fallback active.',err);
      return {fallback:true,count:0,error:err};
    }).finally(function(){CAT.loading=null;});
    return CAT.loading;
  };

  function localProducts(){
    var rows=[];
    [['CCTV',LOCAL.cctv],['INTRUSION',LOCAL.intrusion],['FIRE',LOCAL.fire]].forEach(function(pair){
      pair[1].forEach(function(d){
        var brand=(d.brand||(String(d.model||'').indexOf('AJAX.')===0?'Ajax':'Generic'));
        var ref=d.model||d.id;
        var spec=Object.assign({},d,{module_code:pair[0],poe_w:LOCAL.poe[ref]!=null?LOCAL.poe[ref]:(d.poeW||null),source_id:d.id});
        delete spec.imgUrl;delete spec.photoURL;
        rows.push({
          brand_name:brand,brand_slug:slugify(brand),reference:ref,name:d.name||ref,category:pair[0],
          family:d.family||d.cat||pair[0].toLowerCase(),device_type:d.type||'equipment',
          image_url:d.imgUrl||d.photoURL||LOCAL.images[ref]||LOCAL.images[d.id]||null,
          description:d.desc||null,specifications:spec,active:true
        });
      });
    });
    return rows;
  }

  function chunks(arr,n){var out=[];for(var i=0;i<arr.length;i+=n)out.push(arr.slice(i,i+n));return out;}

  window.sigsCatalogSyncLocal=function(opts){
    opts=opts||{};
    if(!isSuper())return Promise.reject(new Error('Apenas o Super Admin pode sincronizar o catálogo.'));
    var rows=localProducts(),brandsMap={};
    rows.forEach(function(r){brandsMap[r.brand_slug]={name:r.brand_name,slug:r.brand_slug,active:true};});
    var brands=Object.keys(brandsMap).map(function(k){return brandsMap[k];});
    var status=opts.statusEl||null;
    function st(m){
      if(status)status.textContent=m;
      if(opts.onProgress)opts.onProgress(m);
      if(opts.loginProgress&&typeof window.sigsLoginProgressCatalog==='function')window.sigsLoginProgressCatalog(m);
    }
    st('A sincronizar marcas…');
    return api(cfg().url+'/rest/v1/product_brands?on_conflict=slug',{
      method:'POST',headers:headers({'Prefer':'resolution=merge-duplicates,return=representation'}),body:JSON.stringify(brands)
    }).then(function(){
      return api(cfg().url+'/rest/v1/product_brands?select=id,name,slug,active',{headers:headers()});
    }).then(function(remoteBrands){
      var bySlug={};(remoteBrands||[]).forEach(function(b){bySlug[b.slug]=b;});
      var payload=rows.map(function(r){return {
        brand_id:bySlug[r.brand_slug]?bySlug[r.brand_slug].id:null,
        reference:r.reference,name:r.name,category:r.category,family:r.family,device_type:r.device_type,
        image_url:r.image_url,description:r.description,specifications:r.specifications,active:true,updated_at:new Date().toISOString()
      };});
      var batches=chunks(payload,30),chain=Promise.resolve();
      batches.forEach(function(batch,idx){chain=chain.then(function(){
        st('A sincronizar equipamentos '+(idx+1)+'/'+batches.length+'…');
        return api(cfg().url+'/rest/v1/products?on_conflict=reference',{
          method:'POST',headers:headers({'Prefer':'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify(batch)
        });
      });});
      return chain;
    }).then(function(){
      st('Catálogo sincronizado. A atualizar…');
      return sigsCatalogLoadRemote(true);
    }).then(function(res){
      st('✓ '+res.count+' equipamentos no Supabase.');
      if(typeof notify==='function')notify('✓ Catálogo sincronizado com o Supabase');
      return res;
    });
  };

  function autoSeedIfEmpty(opts){
    opts=opts||{};
    if(!isSuper())return Promise.resolve();
    return sigsCatalogLoadRemote().then(function(res){
      if(res.count===0)return sigsCatalogSyncLocal(opts);
      return res;
    }).catch(function(){return null;});
  }
  window.sigsCatalogAutoSeedIfEmpty=autoSeedIfEmpty;

  function loadManagerData(){
    return Promise.all([
      api(cfg().url+'/rest/v1/product_brands?select=id,name,slug,active&order=name.asc',{headers:headers()}),
      api(cfg().url+'/rest/v1/products?select=id,brand_id,reference,name,category,family,device_type,image_url,description,specifications,active,updated_at,brand:product_brands(name,slug)&order=category.asc,name.asc',{headers:headers()})
    ]).then(function(x){CAT.brands=x[0]||[];CAT.products=x[1]||[];return CAT;});
  }

  function managerHeader(){
    return '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap">'+
      '<div><div class="sag-title">Catálogo Técnico</div><div class="sag-sub">Equipamentos, imagens, dados técnicos e preços guardados no Supabase.</div></div>'+
      '<div class="sag-actions" style="margin-top:0"><button class="sag-btn" onclick="sigsPortalRender()">← Voltar</button><button class="sag-btn" onclick="sigsCatalogSyncFromManager()">↻ Reimportar fallback local</button><button class="sag-btn primary" onclick="sigsCatalogEditProduct()">＋ Novo equipamento</button></div></div>';
  }

  window.sigsOpenCatalogManager=function(){
    if(!isSuper()){if(typeof notify==='function')notify('Apenas Super Admin.');return;}
    var host=document.getElementById('sigs-gate-main');if(!host)return;
    host.innerHTML=managerHeader()+'<div class="sag-card" style="margin-top:16px;padding:28px;text-align:center;color:var(--txt3)">A carregar catálogo do Supabase…</div>';
    loadManagerData().then(function(){renderManager();}).catch(function(e){
      host.innerHTML=managerHeader()+'<div class="sag-card" style="margin-top:16px;color:#ef4444">Erro ao carregar catálogo: '+esc(e.message)+'</div>';
    });
  };

  window.sigsCatalogSyncFromManager=function(){
    var host=document.getElementById('catalog-sync-status');if(host)host.textContent='A iniciar…';
    sigsCatalogSyncLocal({statusEl:host}).then(function(){return loadManagerData();}).then(renderManager).catch(function(e){if(host){host.style.color='#ef4444';host.textContent='Erro: '+e.message;}if(typeof notify==='function')notify('Erro: '+e.message);});
  };

  function renderManager(){
    var host=document.getElementById('sigs-gate-main');if(!host)return;
    var products=CAT.products||[],brands=CAT.brands||[];
    var active=products.filter(function(p){return p.active!==false;}).length;
    host.innerHTML=managerHeader()+
      '<div class="sag-grid" style="margin-top:16px"><div class="sag-stat"><span>Equipamentos</span><b>'+products.length+'</b></div><div class="sag-stat"><span>Ativos</span><b style="color:#10b981">'+active+'</b></div><div class="sag-stat"><span>Marcas</span><b>'+brands.length+'</b></div></div>'+
      '<div class="sag-card" style="margin-top:14px"><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input id="cat-search" class="sag-input" style="max-width:360px;margin:0" placeholder="Pesquisar referência, nome ou marca…"><select id="cat-module" class="sag-input" style="width:180px;margin:0"><option value="">Todos os módulos</option><option>CCTV</option><option>INTRUSION</option><option>FIRE</option><option>NETWORK</option><option>STORAGE</option></select><span id="catalog-sync-status" style="font-size:10px;color:var(--txt3)"></span></div><div id="cat-list" style="margin-top:12px"></div></div>';
    var q=document.getElementById('cat-search'),m=document.getElementById('cat-module');
    if(q)q.oninput=renderManagerList;if(m)m.onchange=renderManagerList;
    renderManagerList();
  }

  function renderManagerList(){
    var el=document.getElementById('cat-list');if(!el)return;
    var q=((document.getElementById('cat-search')||{}).value||'').trim().toLowerCase();
    var mod=((document.getElementById('cat-module')||{}).value||'').toUpperCase();
    var rows=(CAT.products||[]).filter(function(p){
      if(mod&&String(p.category||'').toUpperCase()!==mod)return false;
      if(!q)return true;
      return [p.reference,p.name,p.category,p.family,p.device_type,p.brand&&p.brand.name].join(' ').toLowerCase().indexOf(q)>=0;
    });
    el.innerHTML=rows.length?rows.map(function(p){
      var img=p.image_url?'<img src="'+esc(p.image_url)+'" alt="" style="width:48px;height:48px;object-fit:contain;border-radius:7px;background:#fff">':'<div style="width:48px;height:48px;border-radius:7px;background:var(--bg2);display:flex;align-items:center;justify-content:center;color:var(--txt3)">📦</div>';
      return '<div style="display:grid;grid-template-columns:54px minmax(220px,1.4fr) minmax(150px,.8fr) 100px auto;gap:10px;align-items:center;padding:9px 0;border-bottom:1px solid var(--bdr)">'+img+
        '<div><div style="font-weight:800;color:var(--txt)">'+esc(p.name)+'</div><div style="font:9px var(--m);color:var(--txt3)">'+esc(p.reference)+'</div></div>'+
        '<div style="font-size:10px;color:var(--txt2)">'+esc((p.brand&&p.brand.name)||'—')+' · '+esc(p.device_type||'—')+'</div>'+
        '<div><span style="font:8px var(--m);padding:3px 6px;border-radius:999px;border:1px solid var(--bdr2);color:var(--txt2)">'+esc(p.category||'—')+'</span></div>'+
        '<div style="display:flex;gap:5px;justify-content:flex-end"><span style="font-size:9px;color:'+(p.active===false?'#ef4444':'#10b981')+'">'+(p.active===false?'INATIVO':'ATIVO')+'</span><button class="sag-btn" style="padding:6px 9px" onclick="sigsCatalogEditProduct(\''+esc(p.id)+'\')">Editar</button></div></div>';
    }).join(''):'<div style="padding:30px;text-align:center;color:var(--txt3)">Sem resultados.</div>';
  }

  function modal(){var old=document.getElementById('catalog-edit-overlay');if(old)old.remove();var o=document.createElement('div');o.id='catalog-edit-overlay';o.style.cssText='position:fixed;inset:0;z-index:1000000;background:rgba(0,0,0,.64);display:flex;align-items:center;justify-content:center;padding:20px';document.body.appendChild(o);return o;}
  function input(id,label,value,type){return '<label style="display:flex;flex-direction:column;gap:4px;font-size:9px;color:var(--txt3)">'+label+'<input id="'+id+'" type="'+(type||'text')+'" value="'+esc(value||'')+'" style="background:var(--bg2);border:1px solid var(--bdr2);border-radius:8px;padding:9px;color:var(--txt)"></label>';}

  window.sigsCatalogEditProduct=function(id){
    var p=id?(CAT.products||[]).find(function(x){return x.id===id;}):null;
    var o=modal(),spec=p&&p.specifications?p.specifications:{};
    var brandOpts=(CAT.brands||[]).map(function(b){return '<option value="'+b.id+'" '+(p&&p.brand_id===b.id?'selected':'')+'>'+esc(b.name)+'</option>';}).join('');
    o.innerHTML='<div style="width:min(920px,96vw);max-height:92vh;overflow:auto;background:var(--bg1);border:1px solid var(--bdr2);border-radius:16px;padding:22px;box-shadow:0 30px 90px rgba(0,0,0,.45)">'+
      '<div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:18px;font-weight:900;color:var(--txt)">'+(p?'Editar equipamento':'Novo equipamento')+'</div><div style="font-size:10px;color:var(--txt3)">Dados guardados diretamente no Supabase.</div></div><button id="cat-close" class="sag-btn">✕</button></div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px">'+input('cat-ref','Referência',p&&p.reference)+input('cat-name','Nome',p&&p.name)+
      '<label style="display:flex;flex-direction:column;gap:4px;font-size:9px;color:var(--txt3)">Marca<select id="cat-brand" style="background:var(--bg2);border:1px solid var(--bdr2);border-radius:8px;padding:9px;color:var(--txt)"><option value="">Sem marca</option>'+brandOpts+'</select></label>'+
      '<label style="display:flex;flex-direction:column;gap:4px;font-size:9px;color:var(--txt3)">Módulo<select id="cat-category" style="background:var(--bg2);border:1px solid var(--bdr2);border-radius:8px;padding:9px;color:var(--txt)"><option '+((p&&p.category)==='CCTV'?'selected':'')+'>CCTV</option><option '+((p&&p.category)==='INTRUSION'?'selected':'')+'>INTRUSION</option><option '+((p&&p.category)==='FIRE'?'selected':'')+'>FIRE</option><option '+((p&&p.category)==='NETWORK'?'selected':'')+'>NETWORK</option><option '+((p&&p.category)==='STORAGE'?'selected':'')+'>STORAGE</option></select></label>'+input('cat-family','Família',p&&p.family)+input('cat-type','Tipo',p&&p.device_type)+input('cat-img','URL da imagem',p&&p.image_url)+input('cat-poe','PoE (W)',spec.poe_w||spec.poeW||'','number')+
      '</div><label style="display:flex;flex-direction:column;gap:4px;font-size:9px;color:var(--txt3);margin-top:10px">Descrição<textarea id="cat-desc" rows="2" style="background:var(--bg2);border:1px solid var(--bdr2);border-radius:8px;padding:9px;color:var(--txt)">'+esc(p&&p.description||'')+'</textarea></label>'+
      '<label style="display:flex;flex-direction:column;gap:4px;font-size:9px;color:var(--txt3);margin-top:10px">Especificações técnicas (JSON)<textarea id="cat-spec" rows="8" style="font:10px var(--m);background:var(--bg2);border:1px solid var(--bdr2);border-radius:8px;padding:9px;color:var(--txt)">'+esc(JSON.stringify(spec,null,2))+'</textarea></label>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">'+input('cat-cost','Preço custo (€)','', 'number')+input('cat-sale','Preço venda (€)','', 'number')+'</div>'+
      '<div style="margin-top:12px;padding:10px;border:1px dashed var(--bdr2);border-radius:9px"><div style="font-size:9px;color:var(--txt3);margin-bottom:6px">Fotografia do equipamento</div><input id="cat-file" type="file" accept="image/png,image/jpeg,image/webp" style="font-size:10px;color:var(--txt2)"><button id="cat-upload" class="sag-btn" style="margin-left:8px">Carregar para Storage</button><span id="cat-upload-status" style="font-size:9px;color:var(--txt3);margin-left:8px"></span></div>'+
      '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:16px"><label style="font-size:10px;color:var(--txt2)"><input id="cat-active" type="checkbox" '+(!p||p.active!==false?'checked':'')+'> Equipamento ativo</label><div style="display:flex;gap:8px"><button id="cat-cancel" class="sag-btn">Cancelar</button><button id="cat-save" class="sag-btn primary">Guardar</button></div></div><div id="cat-save-status" style="font-size:10px;color:var(--txt3);margin-top:8px"></div></div>';
    document.getElementById('cat-close').onclick=document.getElementById('cat-cancel').onclick=function(){o.remove();};
    document.getElementById('cat-upload').onclick=function(){sigsCatalogUploadImage();};
    document.getElementById('cat-save').onclick=function(){saveProduct(p&&p.id,o);};
    if(p)loadGlobalPrice(p.id);
  };

  function loadGlobalPrice(productId){
    api(cfg().url+'/rest/v1/product_prices?select=id,cost_price,sale_price,currency&product_id=eq.'+encodeURIComponent(productId)+'&company_id=is.null&active=eq.true&order=valid_from.desc&limit=1',{headers:headers()}).then(function(rows){var x=rows&&rows[0];if(!x)return;var c=document.getElementById('cat-cost'),s=document.getElementById('cat-sale');if(c)c.value=x.cost_price==null?'':x.cost_price;if(s)s.value=x.sale_price==null?'':x.sale_price;});
  }

  function saveGlobalPrice(productId){
    var cost=parseFloat((document.getElementById('cat-cost')||{}).value),sale=parseFloat((document.getElementById('cat-sale')||{}).value);
    if(!isFinite(cost)&&!isFinite(sale))return Promise.resolve();
    return api(cfg().url+'/rest/v1/product_prices?select=id&product_id=eq.'+encodeURIComponent(productId)+'&company_id=is.null&active=eq.true&order=valid_from.desc&limit=1',{headers:headers()}).then(function(rows){
      var payload={cost_price:isFinite(cost)?cost:null,sale_price:isFinite(sale)?sale:null,currency:'EUR',active:true};
      if(rows&&rows[0])return api(cfg().url+'/rest/v1/product_prices?id=eq.'+encodeURIComponent(rows[0].id),{method:'PATCH',headers:headers({'Prefer':'return=minimal'}),body:JSON.stringify(payload)});
      payload.product_id=productId;payload.company_id=null;
      return api(cfg().url+'/rest/v1/product_prices',{method:'POST',headers:headers({'Prefer':'return=minimal'}),body:JSON.stringify(payload)});
    });
  }

  function saveProduct(id,overlay){
    var st=document.getElementById('cat-save-status');function status(m,c){if(st){st.textContent=m;if(c)st.style.color=c;}}
    var ref=(document.getElementById('cat-ref').value||'').trim(),name=(document.getElementById('cat-name').value||'').trim();
    if(!ref||!name){status('Referência e nome são obrigatórios.','#ef4444');return;}
    var specText=document.getElementById('cat-spec').value||'{}',spec;
    try{spec=JSON.parse(specText);}catch(e){status('JSON técnico inválido: '+e.message,'#ef4444');return;}
    var poe=parseFloat(document.getElementById('cat-poe').value);if(isFinite(poe)&&poe>0)spec.poe_w=poe;
    var payload={brand_id:document.getElementById('cat-brand').value||null,reference:ref,name:name,category:document.getElementById('cat-category').value,family:document.getElementById('cat-family').value||null,device_type:document.getElementById('cat-type').value||null,image_url:document.getElementById('cat-img').value||null,description:document.getElementById('cat-desc').value||null,specifications:spec,active:document.getElementById('cat-active').checked,updated_at:new Date().toISOString()};
    status('A guardar…');
    var req=id?api(cfg().url+'/rest/v1/products?id=eq.'+encodeURIComponent(id),{method:'PATCH',headers:headers({'Prefer':'return=representation'}),body:JSON.stringify(payload)}):api(cfg().url+'/rest/v1/products',{method:'POST',headers:headers({'Prefer':'return=representation'}),body:JSON.stringify(payload)});
    req.then(function(rows){var product=(rows&&rows[0])||{id:id};return saveGlobalPrice(product.id).then(function(){return product;});}).then(function(){status('✓ Guardado.','#10b981');return loadManagerData();}).then(function(){overlay.remove();renderManager();return sigsCatalogLoadRemote(true);}).catch(function(e){status('Erro: '+e.message,'#ef4444');});
  }

  window.sigsCatalogUploadImage=function(){
    var input=document.getElementById('cat-file'),st=document.getElementById('cat-upload-status'),ref=(document.getElementById('cat-ref').value||'produto').trim();
    var file=input&&input.files&&input.files[0];if(!file){if(st)st.textContent='Escolhe uma imagem.';return;}
    var ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
    var brandSel=document.getElementById('cat-brand'),brand=(CAT.brands||[]).find(function(b){return b.id===brandSel.value;});
    var path=(brand?brand.slug:'generic')+'/'+ref.replace(/[^A-Za-z0-9._-]+/g,'_')+'.'+ext;
    if(st)st.textContent='A carregar…';
    fetch(cfg().url+'/storage/v1/object/product-images/'+encodeURI(path),{method:'POST',headers:Object.assign({},headers(),{'Content-Type':file.type||'application/octet-stream','x-upsert':'true'}),body:file}).then(function(r){if(!r.ok)return r.text().then(function(t){throw new Error(t||('HTTP '+r.status));});var url=cfg().url+'/storage/v1/object/public/product-images/'+path;document.getElementById('cat-img').value=url;if(st){st.style.color='#10b981';st.textContent='✓ Imagem carregada.';}}).catch(function(e){if(st){st.style.color='#ef4444';st.textContent='Erro: '+e.message;}});
  };

  // Re-read remote catalogue when a valid session is already present.
  setTimeout(function(){if(window.CLOUD&&CLOUD.user)sigsCatalogLoadRemote().catch(function(){});},1400);
})();
