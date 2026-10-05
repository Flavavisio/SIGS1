
// ══════════════════════════════════════════════════════════════
// SUPABASE AUTH ADAPTER — replaces legacy localhost auth
// ══════════════════════════════════════════════════════════════
(function(){
  var SB_URL='https://kbihedvyykjlbnipdgfm.supabase.co';
  var SB_KEY='sb_publishable_7iaBGJr6qS-YO1HOySsKUQ_vCxOU52o';
  function sbHeaders(token){
    var h={'apikey':SB_KEY,'Content-Type':'application/json'};
    if(token) h['Authorization']='Bearer '+token;
    return h;
  }
  function saveSession(s){
    try{
      if(s&&s.access_token){ localStorage.setItem('sigs_sb_access',s.access_token); CLOUD.access=s.access_token; }
      if(s&&s.refresh_token){ localStorage.setItem('sigs_sb_refresh',s.refresh_token); }
      if(s&&s.user){ localStorage.setItem('sigs_sb_user',JSON.stringify(s.user)); }
    }catch(e){}
  }
  function clearSession(){
    try{
      localStorage.removeItem('sigs_sb_access');
      localStorage.removeItem('sigs_sb_refresh');
      localStorage.removeItem('sigs_sb_user');
      localStorage.removeItem('sigs_refresh');
    }catch(e){}
    CLOUD.access=null; CLOUD.user=null;
  }
  function storedAccess(){try{return localStorage.getItem('sigs_sb_access')}catch(e){return null}}
  function storedRefresh(){try{return localStorage.getItem('sigs_sb_refresh')}catch(e){return null}}
  function authError(r,b){
    var msg=(b&&(b.msg||b.message||b.error_description||b.error))||('Erro '+r.status);
    var er=new Error(msg);er.status=r.status;return er;
  }
  window.cloudLogin=function(email,password){
    if(typeof sigsLoginProgressUpdate==='function')sigsLoginProgressUpdate(10,'A validar email e password…','Autenticação segura');
    return fetch(SB_URL+'/auth/v1/token?grant_type=password',{
      method:'POST',headers:sbHeaders(),body:JSON.stringify({email:email,password:password})
    }).then(function(r){return r.json().catch(function(){return {}}).then(function(b){
      if(!r.ok)throw authError(r,b);
      saveSession(b);
      if(typeof sigsLoginProgressUpdate==='function')sigsLoginProgressUpdate(24,'Sessão autenticada. A carregar perfil…','Sessão validada');
      return cloudLoadMe().then(function(){return {}});
    })});
  };
  window._cloudTryRefresh=function(){
    var rt=storedRefresh(); if(!rt)return Promise.resolve(false);
    return fetch(SB_URL+'/auth/v1/token?grant_type=refresh_token',{
      method:'POST',headers:sbHeaders(),body:JSON.stringify({refresh_token:rt})
    }).then(function(r){return r.json().catch(function(){return {}}).then(function(b){if(!r.ok){clearSession();return false}saveSession(b);return true})}).catch(function(){return false});
  };
  window.cloudLoadMe=function(){
    var token=CLOUD.access||storedAccess(); if(!token)return Promise.reject(new Error('Sessão inexistente.'));
    CLOUD.access=token;
    if(typeof sigsLoginProgressUpdate==='function')sigsLoginProgressUpdate(28,'A validar sessão do utilizador…','A carregar perfil');
    return fetch(SB_URL+'/auth/v1/user',{headers:sbHeaders(token)})
      .then(function(r){return r.json().then(function(u){if(!r.ok)throw authError(r,u);if(typeof sigsLoginProgressUpdate==='function')sigsLoginProgressUpdate(36,'Utilizador validado. A consultar perfil…','A carregar perfil');return u})})
      .then(function(au){
        return fetch(SB_URL+'/rest/v1/profiles?select=id,name,email,role,active&id=eq.'+encodeURIComponent(au.id),{headers:sbHeaders(token)})
          .then(function(r){return r.json().then(function(rows){
            if(!r.ok)throw authError(r,rows);
            var p=(rows&&rows[0])||{};
            if(p.active===false)throw new Error('Conta desativada.');
            CLOUD.user={id:au.id,email:au.email||p.email,name:p.name||'',role:p.role||null,active:p.active!==false,isSuperAdmin:p.role==='SUPER_ADMIN',plan:'SIGS',entitlements:{}};
            if(typeof _cloudBtn==='function')_cloudBtn();
            if(typeof sigsLoginProgressUpdate==='function')sigsLoginProgressUpdate(52,'Perfil '+(p.role||'utilizador')+' carregado.','Perfil carregado');
            var u=CLOUD.user;
            if(typeof sigsLoginProgressUpdate==='function')sigsLoginProgressUpdate(62,'A validar empresa, licença e permissões…','A validar licença');
            if(typeof window.sigsCatalogLoadRemote==='function'){
              if(typeof sigsLoginProgressUpdate==='function')sigsLoginProgressUpdate(72,'A carregar equipamentos e dados técnicos…','A carregar catálogo');
              return window.sigsCatalogLoadRemote().catch(function(){return null;}).then(function(){
                if(typeof sigsLoginProgressUpdate==='function')sigsLoginProgressUpdate(78,'Catálogo remoto consultado.','Catálogo técnico');
                if(typeof sigsLoginProgressUpdate==='function')sigsLoginProgressUpdate(91,'Equipamentos e imagens preparados.','Base técnica pronta');
                return u;
              });
            }
            return u;
          })});
      });
  };
  window.cloudLogout=function(){
    var token=CLOUD.access||storedAccess();
    var req=token?fetch(SB_URL+'/auth/v1/logout',{method:'POST',headers:sbHeaders(token)}).catch(function(){}):Promise.resolve();
    clearSession();CLOUD.projectId=null;CLOUD.projectName=null;if(window.LIC)LIC.ctx=null;
    if(typeof _cloudBtn==='function')_cloudBtn();
    return req;
  };
  try{var a=storedAccess();if(a)CLOUD.access=a;}catch(e){}
})();


// ══════════════════════════════════════════════════════════════


// SIGS PRE-APP ACCESS PORTAL
// ══════════════════════════════════════════════════════════════
(function(){
  function ge(id){return document.getElementById(id)}
  function e(v){return (typeof _esc==='function')?_esc(v==null?'':v):String(v==null?'':v).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]})}

  var LOGIN_PROGRESS={value:0,visible:false};
  var LOGIN_STEPS=[
    {p:8, icon:'🔐',label:'Autenticação'},
    {p:28,icon:'👤',label:'Perfil'},
    {p:48,icon:'🏢',label:'Empresa'},
    {p:62,icon:'🔑',label:'Licença'},
    {p:78,icon:'📦',label:'Catálogo'},
    {p:88,icon:'🖼️',label:'Imagens'},
    {p:96,icon:'📁',label:'Projetos'},
    {p:100,icon:'✓',label:'Pronto'}
  ];

  function renderLoginLoader(initialMsg){
    var el=ge('sigs-gate-main');if(!el)return;
    LOGIN_PROGRESS.value=0;LOGIN_PROGRESS.visible=true;
    el.innerHTML=
      '<div class="sag-title">A preparar o SIGS</div>'+
      '<div class="sag-sub">A validar a conta e a carregar a base de dados.</div>'+
      '<div class="sigs-db-loader" role="status" aria-live="polite">'+
        '<div class="sigs-db-orbit"><div class="sigs-db-core">🗄️</div></div>'+
        '<div class="sigs-db-pct" id="sigs-db-pct">0%</div>'+
        '<div class="sigs-db-title" id="sigs-db-title">A ligar à base de dados</div>'+
        '<div class="sigs-db-msg" id="sigs-db-msg">'+e(initialMsg||'A iniciar ligação segura…')+'</div>'+
        '<div class="sigs-db-track"><div class="sigs-db-fill" id="sigs-db-fill"></div></div>'+
        '<div class="sigs-db-steps" id="sigs-db-steps">'+
          LOGIN_STEPS.map(function(s,i){return '<div class="sigs-db-step" data-step="'+i+'"><span class="ico">'+s.icon+'</span>'+s.label+'</div>';}).join('')+
        '</div>'+
        '<div class="sigs-db-ready" id="sigs-db-ready">Não feche esta janela durante a sincronização.</div>'+
      '</div>';
    sigsLoginProgressUpdate(2,initialMsg||'A iniciar ligação segura…','A ligar à base de dados');
  }

  window.sigsLoginProgressUpdate=function(value,msg,title){
    value=Math.max(LOGIN_PROGRESS.value||0,Math.min(100,Math.round(Number(value)||0)));
    LOGIN_PROGRESS.value=value;
    var pct=ge('sigs-db-pct'),fill=ge('sigs-db-fill'),message=ge('sigs-db-msg'),ttl=ge('sigs-db-title');
    if(pct)pct.textContent=value+'%';
    if(fill)fill.style.width=value+'%';
    if(message&&msg)message.textContent=msg;
    if(ttl&&title)ttl.textContent=title;
    LOGIN_STEPS.forEach(function(s,i){
      var node=document.querySelector('.sigs-db-step[data-step="'+i+'"]');if(!node)return;
      node.classList.remove('active','done');
      if(value>=s.p)node.classList.add('done');
      else {
        var prev=i?LOGIN_STEPS[i-1].p:0;
        if(value>=prev&&value<s.p)node.classList.add('active');
      }
    });
    var ready=ge('sigs-db-ready');
    if(ready&&value>=100){ready.textContent='✓ Base de dados pronta. A abrir o painel…';ready.style.color='#10b981';}
  };

  window.sigsLoginProgressCatalog=function(message){
    if(!LOGIN_PROGRESS.visible)return;
    var m=String(message||'');
    var match=m.match(/equipamentos\s+(\d+)\/(\d+)/i);
    if(match){
      var n=Number(match[1])||0,total=Number(match[2])||1;
      var p=78+Math.round((n/total)*10);
      sigsLoginProgressUpdate(p,m,'A sincronizar catálogo');
      return;
    }
    if(/marcas/i.test(m))sigsLoginProgressUpdate(76,m,'A sincronizar catálogo');
    else if(/atualizar/i.test(m))sigsLoginProgressUpdate(89,m,'A atualizar equipamentos');
    else if(/sincronizado|equipamentos no Supabase/i.test(m))sigsLoginProgressUpdate(92,m,'Catálogo pronto');
  };

  function finishLoginLoader(){
    sigsLoginProgressUpdate(100,'Base de dados carregada com sucesso.','Tudo pronto');
    return new Promise(function(resolve){setTimeout(resolve,520);});
  }
  function role(){return (window.CLOUD&&CLOUD.user&&(CLOUD.user.role||(CLOUD.user.isSuperAdmin?'SUPER_ADMIN':null)))||null}
  function roleLabel(r){return r==='SUPER_ADMIN'?'Super Admin':r==='ADMIN'?'Administrador':r==='SALES'?'Comercial':'Sem perfil'}
  function openDesigner(options){
    if(!options||options.projectReady!==true||!CLOUD.projectId||!CLOUD.projectName){
      if(typeof window.sigsV6NewProject==='function')window.sigsV6NewProject();
      return;
    }
    document.body.classList.remove('sigs-locked');var g=ge('sigs-access-gate');if(g)g.style.display='none';if(ge('launcher'))ge('launcher').classList.remove('gone')}
  function logout(){try{cloudLogout()}catch(x){};document.body.classList.add('sigs-locked');var g=ge('sigs-access-gate');if(g)g.style.display='flex';renderLogin()}
  window.sigsPortalOpenDesigner=openDesigner;window.sigsPortalLogout=logout;

  function renderLogin(msg){
    var el=ge('sigs-gate-main'); if(!el)return;
    el.innerHTML='<div class="sag-title">Entrar no SIGS</div>'+
      '<div class="sag-sub">O acesso é feito por utilizadores criados através de uma licença. Não existe registo público.</div>'+
      (msg?'<div class="sag-card" style="border-color:rgba(239,68,68,.3);color:#ef4444;font-size:12px">'+e(msg)+'</div>':'')+
      '<div class="sag-card" style="max-width:460px">'+
        '<label class="sag-label">Email</label><input class="sag-input" id="sg-email" type="email" autocomplete="username" placeholder="email@empresa.pt">'+
        '<label class="sag-label">Password</label><input class="sag-input" id="sg-pass" type="password" autocomplete="current-password" placeholder="••••••••••">'+
        '<div id="sg-mfa-wrap" style="display:none"><label class="sag-label">Código MFA</label><input class="sag-input" id="sg-mfa" inputmode="numeric" placeholder="000000"></div>'+
        '<div class="sag-actions"><button class="sag-btn primary" onclick="sigsPortalLogin()">Entrar</button><a class="sag-btn" href="acesso.html">Esqueci-me da palavra-passe</a></div>'+
        '<div style="margin-top:12px;font-size:10px;color:var(--txt3);line-height:1.6">Se ainda não tem acesso, o Super Admin deve emitir uma licença para a sua empresa ou o seu Admin deve criar o seu utilizador Comercial.</div>'+
      '</div>';
  }
  window.sigsPortalLogin=function(){
    var em=(ge('sg-email')||{}).value||'',pw=(ge('sg-pass')||{}).value||'',mfa=(ge('sg-mfa')||{}).value||'';
    if(!em.trim()||!pw){renderLogin('Preenche email e password.');return}
    renderLoginLoader('A autenticar utilizador…');
    sigsLoginProgressUpdate(5,'A contactar o servidor de autenticação…','Autenticação segura');
    cloudLogin(em.trim(),pw,mfa).then(function(r){
      if(r&&r.mfaRequired){LOGIN_PROGRESS.visible=false;renderLogin('Introduz o código MFA.');var w=ge('sg-mfa-wrap');if(w)w.style.display='block';return}
      sigsLoginProgressUpdate(94,'A preparar projetos e permissões…','A finalizar sessão');
      return finishLoginLoader().then(function(){LOGIN_PROGRESS.visible=false;sigsPortalRender();});
    }).catch(function(err){
      LOGIN_PROGRESS.visible=false;
      renderLogin(err&&err.message?err.message:'Não foi possível iniciar sessão.');
    });
  };

  function modulePills(ent){
    var m=(ent&&ent.modules)||ent||{};var keys=[['cctv','CCTV'],['intrusion','Intrusão'],['fire','Incêndio'],['cloud','Cloud']];
    return keys.map(function(k){var on=m[k[0]]!==false;return '<span style="font:9px var(--m);padding:4px 7px;border-radius:999px;border:1px solid '+(on?'rgba(16,185,129,.32)':'var(--bdr2)')+';color:'+(on?'#10b981':'var(--txt3)')+'">'+k[1]+'</span>'}).join(' ')
  }
  window.sigsPortalRender=function(){
    var el=ge('sigs-gate-main');if(!el)return;
    if(!window.CLOUD||!CLOUD.user){renderLogin();return}
    var u=CLOUD.user,r=role(),ent=u.entitlements||{};
    if(r==='SUPER_ADMIN'){
      el.innerHTML='<div class="sag-title">Super Admin</div><div class="sag-sub">Gestão central do SIGS Design. Emita licenças para empresas e crie o respetivo Admin.</div>'+
        '<div class="sag-grid"><div class="sag-stat"><span>Perfil</span><b>Super Admin</b></div><div class="sag-stat"><span>Conta</span><b style="font-size:13px">'+e(u.email||'—')+'</b></div><div class="sag-stat"><span>Estado</span><b style="color:#10b981">Ativo</b></div></div>'+
        '<div class="sag-card"><strong style="color:var(--txt)">Gestão da plataforma</strong><div class="sag-sub">Licenças, catálogo técnico e acesso ao SIGS Design.</div><div class="sag-actions"><button class="sag-btn primary" onclick="openLicenseCenter()">🔑 Gestão de licenças</button><button class="sag-btn" onclick="sigsOpenCatalogManager()">📦 Catálogo Técnico</button><button class="sag-btn" onclick="sigsPortalOpenDesigner()">📐 Abrir SIGS Design</button><button class="sag-btn danger" onclick="sigsPortalLogout()">Sair</button></div></div>';
      return;
    }
    if(r==='ADMIN'){
      if(typeof window.sigsRenderAdminHome==='function')window.sigsRenderAdminHome();
      else el.innerHTML='<div class="sag-title">Painel do Administrador</div><div class="sag-sub">A carregar…</div>';
      return;
    }
    if(r==='SALES'){
      if(typeof window.sigsRenderSalesHome==='function')window.sigsRenderSalesHome();
      else el.innerHTML='<div class="sag-title">Painel do Comercial</div><div class="sag-sub">A carregar…</div>';
      return;
    }
    el.innerHTML='<div class="sag-title">Conta sem perfil</div><div class="sag-sub">A sessão foi iniciada, mas o backend ainda não devolveu um perfil SUPER_ADMIN, ADMIN ou SALES.</div><div class="sag-actions"><button class="sag-btn danger" onclick="sigsPortalLogout()">Sair</button></div>';
  };

  function boot(){
    document.body.classList.add('sigs-locked');
    var g=ge('sigs-access-gate');if(g)g.style.display='flex';
    if(window.CLOUD&&CLOUD.user){sigsPortalRender();return}
    if(typeof _cloudTryRefresh==='function'){
      _cloudTryRefresh().then(function(ok){if(ok)return cloudLoadMe();}).then(function(){sigsPortalRender()}).catch(function(){renderLogin()});
    } else renderLogin();
  }
  setTimeout(boot,1050);
})();

// ══════════════════════════════════════════════════════════════
// PRODUCT IMAGE LAYER
// Exact images already present in each device (imgUrl/photoURL) are used first.
// For products without an image, create a branded model thumbnail so every product has a visual.
// Add exact manufacturer image URLs later in SIGS_PRODUCT_IMAGES without changing the renderer.
// ══════════════════════════════════════════════════════════════
(function(){
  // Product image map loaded from assets/data/product-images.js
  window.SIGS_PRODUCT_IMAGES=window.SIGS_PRODUCT_IMAGES||{};
  function svgThumb(dev){
    var brand=(dev.brand||((dev.model||'').indexOf('DS-')===0?'hikvision':(dev.model||'').indexOf('IPC-')===0?'uniview':'SIGS')).toUpperCase();
    var model=String(dev.model||dev.name||'Produto').replace(/[<>&\"]/g,'').slice(0,26);
    var kind=dev.type||'device';
    var glyph=(kind==='ptz'?'PTZ':kind==='bullet'?'▶':kind==='dome'?'●':kind==='turret'?'◉':kind==='fisheye'?'◎':kind==='radar'?'RADAR':kind==='thermal_bi'?'THERM':'◆');
    var svg='<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180"><rect width="180" height="180" rx="22" fill="#ffffff"/><rect x="10" y="10" width="160" height="160" rx="18" fill="#f8fafc" stroke="#dbe3ee"/><text x="90" y="70" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="#334155">'+glyph+'</text><text x="90" y="108" text-anchor="middle" font-family="Arial" font-size="12" font-weight="700" fill="#2563eb">'+brand+'</text><text x="90" y="130" text-anchor="middle" font-family="Arial" font-size="9" fill="#475569">'+model+'</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  }
  function isSupabaseProductImage(url){
    return !!(url && String(url).indexOf('/storage/v1/object/public/product-images/')>=0);
  }

  function testProductImage(dev,done){
    var exact=SIGS_PRODUCT_IMAGES[dev.id]||SIGS_PRODUCT_IMAGES[dev.model]||dev.photoURL||dev.imgUrl||(dev.imgKey&&window.AX_IMG&&AX_IMG[dev.imgKey]);
    if(!exact){
      dev.imgUrl=svgThumb(dev);
      done&&done();
      return;
    }

    /* Keep uploaded/custom data images immediately. */
    if(String(exact).indexOf('data:image/')===0){
      dev.imgUrl=exact;
      done&&done();
      return;
    }

    var img=new Image();
    var finished=false;
    function finish(ok){
      if(finished)return;
      finished=true;
      if(ok){
        dev.imgUrl=exact;
      }else{
        /* The Storage image is not uploaded yet: show a proper product card instead of a broken image. */
        dev.imgUrl=svgThumb(dev);
      }
      done&&done();
    }
    img.onload=function(){finish(true);};
    img.onerror=function(){finish(false);};
    img.src=exact;

    /* Avoid a library staying blank forever on a stalled request. */
    setTimeout(function(){finish(false);},3500);
  }

  window.sigsApplyProductImages=function(){
    var libs=[];
    if(window.CCTV_LIB)libs=libs.concat(CCTV_LIB);
    if(window.AJAX_LIB)libs=libs.concat(AJAX_LIB);
    if(window.FIRE_LIB)libs=libs.concat(FIRE_LIB);

    var pending=libs.length;
    if(!pending){
      try{if(typeof renderDevList==='function')renderDevList()}catch(e){}
      return;
    }

    var refreshTimer=null;
    function oneDone(){
      pending--;
      clearTimeout(refreshTimer);
      refreshTimer=setTimeout(function(){
        try{
          if(window.S&&S.lib){
            S.lib.forEach(function(d){
              var master=libs.find(function(x){return x.id===d.id || (x.model&&x.model===d.model);});
              if(master&&master.imgUrl)d.imgUrl=master.imgUrl;
              else if(!d.imgUrl&&!d.photoURL)d.imgUrl=svgThumb(d);
            });
          }
          if(typeof renderDevList==='function')renderDevList();
        }catch(e){}
      },60);
    }

    libs.forEach(function(d){testProductImage(d,oneDone);});
  };

  /* Re-run after module/library changes so images are also present after switching CCTV / Intrusion / Fire. */
  setTimeout(sigsApplyProductImages,450);
  setTimeout(sigsApplyProductImages,1800);
  window.addEventListener('load',function(){setTimeout(sigsApplyProductImages,250);},{once:true});
})();
