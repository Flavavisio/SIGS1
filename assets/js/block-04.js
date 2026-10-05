
// ══════════════════════════════════════════════════════════════
// SIGS LICENSING v1 — SUPER_ADMIN → ADMIN → SALES
// Front-end contract. Security/limits MUST be enforced by backend.
// ══════════════════════════════════════════════════════════════
(function(){
  var ROLE={SUPER_ADMIN:'SUPER_ADMIN',ADMIN:'ADMIN',SALES:'SALES'};
  var LIC={ctx:null,loading:false,lastError:null};
  window.SIGS_ROLES=ROLE; window.SIGS_LICENSE=LIC;

  function roleOf(){ return (CLOUD.user && (CLOUD.user.role || (CLOUD.user.isSuperAdmin?'SUPER_ADMIN':null))) || null; }
  function esc(v){ return _esc(v==null?'':v); }
  function fmtDate(v){ if(!v)return '—'; try{return new Date(v).toLocaleDateString('pt-PT');}catch(e){return String(v);} }
  function pill(text,kind){ var c=kind==='ok'?'#10b981':kind==='bad'?'#ef4444':kind==='warn'?'#f59e0b':'#94a3b8'; return '<span style="display:inline-flex;align-items:center;padding:3px 8px;border-radius:999px;border:1px solid '+c+'55;color:'+c+';font-size:10px;font-family:var(--m);font-weight:700">'+esc(text)+'</span>'; }
  function btn(label,onclick,primary,danger){ return '<button onclick="'+onclick+'" style="padding:8px 11px;border-radius:8px;cursor:pointer;font-family:var(--f);font-size:11px;font-weight:700;border:1px solid '+(danger?'rgba(239,68,68,.35)':primary?'transparent':'var(--bdr2)')+';background:'+(danger?'rgba(239,68,68,.08)':primary?'var(--acc)':'transparent')+';color:'+(danger?'#ef4444':primary?'#fff':'var(--txt2)')+'">'+label+'</button>'; }
  function card(inner){ return '<div style="background:var(--bg1,#0b0f15);border:1px solid var(--bdr2);border-radius:12px;padding:14px">'+inner+'</div>'; }
  function field(id,label,type,placeholder,value){return '<label style="display:block;font-size:9px;text-transform:uppercase;letter-spacing:.6px;color:var(--txt3);font-family:var(--m);margin-bottom:4px">'+label+'</label><input id="'+id+'" type="'+(type||'text')+'" value="'+esc(value||'')+'" placeholder="'+esc(placeholder||'')+'" style="width:100%;box-sizing:border-box;background:var(--bg2);border:1px solid var(--bdr2);border-radius:8px;padding:9px 10px;color:var(--txt);font-family:var(--f);font-size:12px;outline:none">';}

  function licenseApi(path,opts){
    opts=opts||{};
    var SB_URL='https://kbihedvyykjlbnipdgfm.supabase.co';
    var SB_KEY='sb_publishable_7iaBGJr6qS-YO1HOySsKUQ_vCxOU52o';
    var token=CLOUD.access;
    function headers(extra){
      return Object.assign({'apikey':SB_KEY,'Authorization':'Bearer '+token,'Content-Type':'application/json'},extra||{});
    }
    function jsonFetch(url,o,retried){
      o=o||{};
      return fetch(url,o).then(function(r){
        if(r.status===401 && !retried && typeof _cloudTryRefresh==='function'){
          return _cloudTryRefresh().then(function(ok){
            if(!ok)return r.text().then(function(t){var b={};try{b=t?JSON.parse(t):{};}catch(e){};var er=new Error(b.error||b.message||'Sessão expirada. Volta a iniciar sessão.');er.status=401;throw er;});
            token=CLOUD.access||storedAccess();
            o.headers=Object.assign({},o.headers||{}, {'Authorization':'Bearer '+token,'apikey':SB_KEY});
            return jsonFetch(url,o,true);
          });
        }
        return r.text().then(function(t){
          var b={}; try{b=t?JSON.parse(t):{};}catch(e){b={message:t||('Erro '+r.status)};}
          if(!r.ok){var er=new Error(b.error||b.message||('Erro '+r.status));er.status=r.status;throw er;}
          return b;
        });
      });
    }
    function rest(table,query){
      return jsonFetch(SB_URL+'/rest/v1/'+table+(query||''),{headers:headers()});
    }
    function edge(body){
      return jsonFetch(SB_URL+'/functions/v1/sigs-admin',{
        method:'POST',headers:headers(),body:JSON.stringify(body)
      });
    }
    function latestLicense(licenses,companyId){
      return (licenses||[]).filter(function(l){return l.company_id===companyId;})
        .sort(function(a,b){return String(b.created_at||'').localeCompare(String(a.created_at||''));})[0]||null;
    }
    function moduleMap(mods,licId){
      var out={};
      (mods||[]).filter(function(m){return m.license_id===licId&&m.enabled!==false;}).forEach(function(m){
        if(m.module_code==='CCTV')out.cctv=true;
        if(m.module_code==='INTRUSION')out.alarm=true;
        if(m.module_code==='FIRE')out.fire=true;
        if(m.module_code==='CLOUD')out.cloud=true;
      });
      return out;
    }
    function buildContext(){
      var role=roleOf();
      if(role===ROLE.SUPER_ADMIN){
        return Promise.all([
          rest('companies','?select=id,name,nif,client_code,status,created_at&order=created_at.desc'),
          rest('licenses','?select=id,company_id,plan_id,status,billing_interval,starts_at,expires_at,created_at&order=created_at.desc'),
          rest('plans','?select=id,code,name,max_projects,max_items_per_project'),
          rest('company_members','?select=company_id,user_id,role,active'),
          rest('profiles','?select=id,name,email,role,active'),
          rest('projects','?select=id,company_id'),
          rest('license_modules','?select=license_id,module_code,enabled')
        ]).then(function(a){
          var companies=a[0],licenses=a[1],plans=a[2],members=a[3],profiles=a[4],projects=a[5],mods=a[6]; var planMap={};plans.forEach(function(p){planMap[p.id]=p;});
          var pmap={};profiles.forEach(function(p){pmap[p.id]=p;});
          var shaped=companies.map(function(c){
            var l=latestLicense(licenses,c.id);
            var adm=members.find(function(m){return m.company_id===c.id&&m.role==='ADMIN'&&m.active!==false;});
            var ap=adm?pmap[adm.user_id]:null;
            return {
              id:c.id,name:c.name,nif:c.nif,clientCode:c.client_code||'',adminEmail:ap&&ap.email||'',
              salesCount:members.filter(function(m){return m.company_id===c.id&&m.role==='SALES'&&m.active!==false;}).length,
              projectCount:projects.filter(function(p){return p.company_id===c.id;}).length,
              license:l?{id:l.id,plan:(planMap[l.plan_id]&&planMap[l.plan_id].name)||'SIGS',planCode:(planMap[l.plan_id]&&planMap[l.plan_id].code)||'',billingInterval:l.billing_interval||'MONTH',status:l.status,expiresAt:l.expires_at,maxProjects:(planMap[l.plan_id]&&planMap[l.plan_id].max_projects)||null,maxItems:(planMap[l.plan_id]&&planMap[l.plan_id].max_items_per_project)||null,modules:moduleMap(mods,l.id)}:null
            };
          });
          var now=Date.now(),soon=now+5*86400000;
          return {stats:{
            companies:companies.length,
            activeLicenses:licenses.filter(function(l){return l.status==='ACTIVE';}).length,
            expiringLicenses:licenses.filter(function(l){var d=l.expires_at?new Date(l.expires_at).getTime():0;return d>0&&d<=soon&&(l.status==='ACTIVE'||l.status==='EXPIRED');}).length,
            users:profiles.filter(function(p){return p.active!==false;}).length
          },companies:shaped};
        });
      }
      return Promise.all([
        rest('company_members','?select=company_id,user_id,role,active&user_id=eq.'+encodeURIComponent(CLOUD.user.id)),
        rest('companies','?select=id,name,nif,client_code,status'),
        rest('licenses','?select=id,company_id,plan_id,status,billing_interval,starts_at,expires_at,created_at&order=created_at.desc'),
        rest('plans','?select=id,code,name,max_projects,max_items_per_project'),
        rest('company_members','?select=company_id,user_id,role,active'),
        rest('profiles','?select=id,name,email,role,active'),
        rest('license_modules','?select=license_id,module_code,enabled'),
        rest('projects','?select=id,company_id,created_by,assigned_to,name,module,status,camera_count,detector_count,fire_detector_count,floor_count,created_at,updated_at&order=updated_at.desc')
      ]).then(function(a){
        var my=a[0][0],companies=a[1],licenses=a[2],plans=a[3],members=a[4],profiles=a[5],mods=a[6],projects=a[7]||[]; var planMap={};plans.forEach(function(p){planMap[p.id]=p;});
        if(!my)return {};
        var co=companies.find(function(c){return c.id===my.company_id;})||{};
        var l=latestLicense(licenses,my.company_id);
        var pmap={};profiles.forEach(function(p){pmap[p.id]=p;});
        var users=members.filter(function(m){return m.company_id===my.company_id;}).map(function(m){
          var p=pmap[m.user_id]||{};
          return {id:m.user_id,name:p.name||'',email:p.email||'',role:m.role,active:m.active!==false&&p.active!==false};
        });
        return {
          company:{id:co.id,name:co.name,nif:co.nif,clientCode:co.client_code||''},
          license:l?{id:l.id,plan:(planMap[l.plan_id]&&planMap[l.plan_id].name)||'SIGS',planCode:(planMap[l.plan_id]&&planMap[l.plan_id].code)||'',billingInterval:l.billing_interval||'MONTH',status:l.status,expiresAt:l.expires_at,maxProjects:(planMap[l.plan_id]&&planMap[l.plan_id].max_projects)||null,maxItems:(planMap[l.plan_id]&&planMap[l.plan_id].max_items_per_project)||null,modules:moduleMap(mods,l.id)}:null,
          users:users,
          projects:projects.filter(function(pr){return pr.company_id===my.company_id;}).map(function(pr){
            var owner=pmap[pr.created_by]||{};
            var assignee=pmap[pr.assigned_to]||{};return {id:pr.id,name:pr.name||'Projeto',module:pr.module||'CCTV',status:pr.status||'DRAFT',createdBy:pr.created_by,createdByName:owner.name||owner.email||'Utilizador',assignedTo:pr.assigned_to||null,assignedToName:assignee.name||assignee.email||'',cameraCount:pr.camera_count||0,detectorCount:pr.detector_count||0,fireDetectorCount:pr.fire_detector_count||0,floorCount:pr.floor_count||1,createdAt:pr.created_at,updatedAt:pr.updated_at};
          })
        };
      });
    }

    if(path==='/licensing/context' && (!opts.method || opts.method==='GET')) return buildContext();

    if(path==='/licensing/licenses' && opts.method==='POST'){
      var b=JSON.parse(opts.body||'{}');
      return edge({action:'create_company',name:b.companyName,nif:b.nif||null,client_code:b.clientCode||null})
        .then(function(x){
          var cid=x.company.id;
          var modules=[];
          if(!b.modules||b.modules.cctv!==false)modules.push('CCTV');
          if(!b.modules||b.modules.alarm!==false)modules.push('INTRUSION');
          if(!b.modules||b.modules.fire!==false)modules.push('FIRE');
          if(!b.modules||b.modules.cloud!==false)modules.push('CLOUD');
          return edge({action:'issue_license',company_id:cid,plan_code:b.planCode||'EXPRESS',billing_interval:b.billingInterval||'MONTH',modules:modules})
            .then(function(y){
              return edge({action:'create_admin_with_password',company_id:cid,email:b.adminEmail,name:b.adminName,password:b.adminPassword})
                .then(function(){return {company:x.company,license:y.license};});
            });
        });
    }

    var m=path.match(/^\/licensing\/licenses\/([^/]+)$/);
    if(m && opts.method==='PATCH'){
      var pb=JSON.parse(opts.body||'{}');
      return edge({action:'update_license',license_id:decodeURIComponent(m[1]),status:pb.status});
    }

    var c=path.match(/^\/licensing\/companies\/([^/]+)$/);
    if(c && (!opts.method || opts.method==='GET')){
      var cid=decodeURIComponent(c[1]);
      return Promise.all([
        rest('companies','?select=id,name,nif,client_code&id=eq.'+encodeURIComponent(cid)),
        rest('licenses','?select=id,company_id,plan_id,status,billing_interval,expires_at,created_at&company_id=eq.'+encodeURIComponent(cid)+'&order=created_at.desc'),
        rest('plans','?select=id,code,name,max_projects,max_items_per_project'),
        rest('company_members','?select=company_id,user_id,role,active&company_id=eq.'+encodeURIComponent(cid)),
        rest('profiles','?select=id,name,email,role,active'),
        rest('projects','?select=id,company_id&company_id=eq.'+encodeURIComponent(cid))
      ]).then(function(a){
        var co=a[0][0]||{},l=a[1][0]||null,plans=a[2],members=a[3],profiles=a[4],projects=a[5],pmap={},planMap={};
        profiles.forEach(function(p){pmap[p.id]=p;});plans.forEach(function(p){planMap[p.id]=p;});var pl=l?planMap[l.plan_id]:null;
        return {id:co.id,name:co.name,nif:co.nif,clientCode:co.client_code||'',license:l?{id:l.id,plan:(pl&&pl.name)||'SIGS',planCode:(pl&&pl.code)||'',billingInterval:l.billing_interval||'MONTH',status:l.status,expiresAt:l.expires_at,maxProjects:pl&&pl.max_projects,maxItems:pl&&pl.max_items_per_project}:null,
          salesCount:members.filter(function(m){return m.role==='SALES'&&m.active!==false;}).length,projectCount:projects.length,
          users:members.map(function(mm){var p=pmap[mm.user_id]||{};return{id:mm.user_id,name:p.name||'',email:p.email||'',role:mm.role,active:mm.active!==false&&p.active!==false};})
        };
      });
    }

    if(path==='/licensing/password' && opts.method==='PATCH'){
      var pwb=JSON.parse(opts.body||'{}');
      return edge({action:'set_user_password',user_id:pwb.userId,password:pwb.password});
    }

    if(path==='/licensing/company-code' && opts.method==='PATCH'){
      var cb=JSON.parse(opts.body||'{}');
      var cid3=(LIC.ctx&&LIC.ctx.company&&LIC.ctx.company.id)||null;
      if(!cid3)return Promise.reject(new Error('Empresa não encontrada.'));
      return jsonFetch(SB_URL+'/rest/v1/companies?id=eq.'+encodeURIComponent(cid3),{
        method:'PATCH',
        headers:headers({'Prefer':'return=representation'}),
        body:JSON.stringify({client_code:(cb.clientCode||'').trim()||null})
      }).then(function(rows){return rows&&rows[0]?rows[0]:{};});
    }

    if(path==='/licensing/users' && opts.method==='POST'){
      var ub=JSON.parse(opts.body||'{}');
      var companyId=(LIC.ctx&&LIC.ctx.company&&LIC.ctx.company.id)||null;
      if(!companyId)return Promise.reject(new Error('Empresa não encontrada.'));
      return edge({action:'create_sales_with_password',company_id:companyId,email:ub.email,name:ub.name,password:ub.password});
    }

    var u=path.match(/^\/licensing\/users\/([^/]+)$/);
    if(u && opts.method==='PATCH'){
      var xb=JSON.parse(opts.body||'{}');
      var companyId2=(LIC.ctx&&LIC.ctx.company&&LIC.ctx.company.id)||null;
      if(!companyId2)return Promise.reject(new Error('Empresa não encontrada.'));
      return edge({action:'set_member_active',company_id:companyId2,user_id:decodeURIComponent(u[1]),active:!!xb.active});
    }

    if(path==='/licensing/renew' && opts.method==='POST'){
      var rb=JSON.parse(opts.body||'{}');
      return edge({action:'renew_license',license_id:rb.licenseId});
    }

    if(path==='/licensing/change' && opts.method==='PATCH'){
      var ch=JSON.parse(opts.body||'{}');
      return edge({action:'change_license',license_id:ch.licenseId,plan_code:ch.planCode,billing_interval:ch.billingInterval});
    }

    if(path==='/licensing/company-delete' && opts.method==='DELETE'){
      var db=JSON.parse(opts.body||'{}');
      return edge({action:'delete_company',company_id:db.companyId});
    }

    return Promise.reject(new Error('Operação de licenciamento não suportada.'));
  }
  function loadContext(){
    if(!CLOUD.user){ LIC.ctx=null; return Promise.resolve(null); }
    LIC.loading=true; LIC.lastError=null;
    return licenseApi('/licensing/context').then(function(c){LIC.ctx=c;LIC.loading=false;refreshLicenseButton();return c;}).catch(function(e){LIC.loading=false;LIC.lastError=e;refreshLicenseButton();throw e;});
  }
  window.loadLicenseContext=loadContext;

  function refreshLicenseButton(){
    var b=document.getElementById('licensebtn'); if(!b)return;
    var r=roleOf(); b.style.display='';
    if(r===ROLE.SUPER_ADMIN)b.textContent='🔑 Super Admin'; else if(r===ROLE.ADMIN)b.textContent='🔑 Empresa'; else b.textContent='🔑 Licença';
  }
  window.refreshLicenseButton=refreshLicenseButton;

  window.openLicenseCenter=function(){
    if(!CLOUD.user){ notify('Inicia sessão para gerir licenças.'); return; }
    var main=document.getElementById('sigs-gate-main');
    if(!main){ notify('Painel de administração indisponível.'); return; }
    var r=roleOf();
    var title=r===ROLE.SUPER_ADMIN?'Backoffice Super Admin':r===ROLE.ADMIN?'Backoffice da Empresa':'Licença da Empresa';
    var sub=r===ROLE.SUPER_ADMIN?'Crie empresas, emita licenças, convide Admins e controle toda a plataforma.':r===ROLE.ADMIN?'Gira a licença da sua empresa e crie ou desative os seus Comerciais.':'Consulte os dados da licença associada à sua empresa.';
    main.innerHTML='<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px;flex-wrap:wrap">'+
      '<div><div class="sag-title">'+esc(title)+'</div><div class="sag-sub" id="lic-subtitle">'+esc(sub)+'</div></div>'+
      '<div class="sag-actions" style="margin-top:0"><button class="sag-btn" onclick="closeLicenseCenter()">← Voltar</button><button class="sag-btn primary" onclick="sigsPortalOpenDesigner()">📐 Abrir SIGS Design</button></div></div>'+
      '<div id="license-body"><div class="sag-card" style="padding:28px;text-align:center;color:var(--txt3)">A carregar dados do Supabase…</div></div>';
    renderLicenseCenter();
  };
  window.closeLicenseCenter=function(){ if(window.sigsPortalRender) window.sigsPortalRender(); };

  function renderLicenseCenter(){
    var el=document.getElementById('license-body'); if(!el)return;
    var r=roleOf();
    var sub=document.getElementById('lic-subtitle');
    if(sub) sub.textContent=r===ROLE.SUPER_ADMIN?'Gestão global · empresas, licenças, Admins e utilização':r===ROLE.ADMIN?'Gestão da empresa · licença e Comerciais':'Consulta da licença da empresa';
    el.innerHTML='<div class="sag-card" style="padding:28px;text-align:center;color:var(--txt3)">A carregar dados do Supabase…</div>';
    loadContext().then(function(){
      if(r===ROLE.SUPER_ADMIN) renderSuperAdmin();
      else if(r===ROLE.ADMIN) renderAdmin();
      else renderSalesReadonly();
    }).catch(function(e){
      el.innerHTML=card('<div style="font-weight:800;color:#ef4444;margin-bottom:6px">Não foi possível carregar o backoffice</div><div style="font-size:12px;color:var(--txt2);line-height:1.6">'+esc(e.message||'Erro ao carregar os dados do Supabase.')+'</div>');
    });
  }
  window.renderLicenseCenter=renderLicenseCenter;

  function licCalcEndDate(interval){
    var d=new Date();
    if(interval==='YEAR') d.setFullYear(d.getFullYear()+1);
    else d.setMonth(d.getMonth()+1);
    return d;
  }
  function licFmtDateLocal(d){
    if(!d||isNaN(d.getTime()))return '—';
    return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();
  }
  window.licUpdateEndPreview=function(){
    var s=document.getElementById('lic-billing'),el=document.getElementById('lic-end-preview');
    if(!s||!el)return;
    el.textContent=licFmtDateLocal(licCalcEndDate(s.value));
  };
  function licCounterCard(label,value,color,filter){
    return '<div onclick="licShowCounter(\''+filter+'\')" title="Clique para ver a lista" style="cursor:pointer;transition:.16s ease" onmouseenter="this.style.transform=\'translateY(-2px)\';this.style.borderColor=\'var(--acc)\'" onmouseleave="this.style.transform=\'none\';this.style.borderColor=\'var(--bdr)\'">'+
      card('<div style="font-size:9px;color:var(--txt3);font-family:var(--m);text-transform:uppercase">'+label+'</div><div style="font-size:24px;font-weight:900;color:'+color+'">'+value+'</div><div style="font-size:9px;color:var(--txt3);margin-top:5px">Clique para consultar →</div>')+'</div>';
  }
  function renderSuperAdmin(){
    var el=document.getElementById('license-body'), c=LIC.ctx||{}, stats=c.stats||{}, companies=c.companies||[];
    var html='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px">'+
      licCounterCard('Empresas',(stats.companies||companies.length||0),'var(--txt)','companies')+
      licCounterCard('Licenças ativas',(stats.activeLicenses||0),'#10b981','active')+
      licCounterCard('A expirar',(stats.expiringLicenses||0),'#f59e0b','expiring')+
      licCounterCard('Utilizadores',(stats.users||0),'var(--acc)','users')+
    '</div>';
    html+='<div id="lic-counter-list" style="display:none;margin-bottom:14px"></div>';
    html+='<div style="display:grid;grid-template-columns:380px 1fr;gap:14px">';
    html+=card('<div style="font-size:13px;font-weight:800;color:var(--txt);margin-bottom:12px">＋ Emitir nova licença</div>'+field('lic-company','Empresa','text','Segurança XPTO Lda')+'<div style="height:8px"></div>'+field('lic-admin-name','Nome do Admin','text','João Silva')+'<div style="height:8px"></div>'+field('lic-admin-email','Email do Admin','email','admin@empresa.pt')+'<div style="height:8px"></div>'+field('lic-admin-password','Password inicial do Admin','password','Mínimo 8 caracteres')+'<div style="height:8px"></div>'+field('lic-nif','NIF','text','')+'<div style="height:8px"></div>'+field('lic-client-code','Código do cliente','text','Ex.: CLI-001')+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">'+
        '<div><div style="font-size:10px;color:var(--txt3);font-family:var(--m);text-transform:uppercase;margin-bottom:5px">Plano</div><select id="lic-plan" style="width:100%;background:var(--bg1);border:1px solid var(--bdr2);border-radius:8px;padding:10px;color:var(--txt);font-family:var(--f)"><option value="EXPRESS">Express</option><option value="PRO">PRO</option></select></div>'+
        '<div><div style="font-size:10px;color:var(--txt3);font-family:var(--m);text-transform:uppercase;margin-bottom:5px">Periodicidade</div><select id="lic-billing" onchange="licUpdateEndPreview()" style="width:100%;background:var(--bg1);border:1px solid var(--bdr2);border-radius:8px;padding:10px;color:var(--txt);font-family:var(--f)"><option value="MONTH">Mensal</option><option value="YEAR">Anual</option></select></div>'+
      '</div>'+
      '<div style="margin-top:10px;padding:10px;border:1px solid var(--bdr2);background:var(--bg1);border-radius:8px"><div style="font-size:9px;color:var(--txt3);font-family:var(--m);text-transform:uppercase">Fim da licença</div><div id="lic-end-preview" style="font-size:15px;font-weight:900;color:var(--txt);margin-top:3px">—</div><div style="font-size:9px;color:var(--txt3);margin-top:3px">Calculado automaticamente a partir da data de emissão.</div></div>'+
      '<div style="margin-top:11px;font-size:10px;color:var(--txt3);font-family:var(--m);text-transform:uppercase">Módulos</div><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin:7px 0 12px"><label><input id="lic-m-cctv" type="checkbox" checked> CCTV</label><label><input id="lic-m-alarm" type="checkbox" checked> Intrusão</label><label><input id="lic-m-fire" type="checkbox" checked> Incêndio</label><label><input id="lic-m-cloud" type="checkbox" checked> Cloud</label></div>'+
      '<button id="lic-emit-btn" type="button" onclick="licCreateLicense()" style="padding:10px 14px;border:0;border-radius:8px;background:var(--acc);color:#fff;font-family:var(--f);font-size:11px;font-weight:800;cursor:pointer">Emitir licença</button><div id="lic-emit-status" style="font-size:10px;color:var(--txt3);margin-top:8px;min-height:14px"></div>');
    var rows=companies.map(function(x){var l=x.license||{},d=l.expiresAt?new Date(l.expiresAt).getTime():0,now=Date.now(),five=now+5*86400000,expired=d>0&&d<now,warning=!expired&&d>0&&d<=five&&l.status==='ACTIVE',displayStatus=expired?'EXPIRADA':l.status,kind=expired?'bad':warning?'warn':(l.status==='ACTIVE'?'ok':l.status==='SUSPENDED'?'warn':'bad'),rowBg=expired?'rgba(239,68,68,.10)':warning?'rgba(245,158,11,.08)':'transparent',rowBorder=expired?'rgba(239,68,68,.42)':warning?'rgba(245,158,11,.35)':'var(--bdr)';return '<div style="display:grid;grid-template-columns:1.5fr 1fr .7fr .7fr auto;gap:8px;align-items:center;padding:10px;border-bottom:1px solid '+rowBorder+';background:'+rowBg+'"><div><div style="font-weight:700;color:'+(expired?'#ef4444':'var(--txt)')+'">'+esc(x.name)+'</div><div style="font-size:10px;color:var(--txt3)">'+esc(x.adminEmail||'')+'</div></div><div style="font-size:11px;color:var(--txt2)">'+esc(l.plan||'SIGS')+'<br><span style="font-size:10px">'+(l.billingInterval==='YEAR'?'Anual':'Mensal')+'</span></div><div>'+pill(displayStatus||'—',kind)+'</div><div style="font-size:10px;color:'+(expired?'#ef4444':warning?'#f59e0b':'var(--txt3)')+'">'+fmtDate(l.expiresAt)+'</div><div style="display:flex;gap:5px;flex-wrap:wrap;justify-content:flex-end">'+
      btn('Abrir','licOpenCompany(\''+esc(x.id)+'\')',false)+
      (l.id?btn('Renovar','licRenewLicense(\''+esc(l.id)+'\')',false):'')+
      (l.id?btn('Alterar','licOpenChangeLicense(\''+esc(l.id)+'\',\''+esc(l.planCode||'EXPRESS')+'\',\''+esc(l.billingInterval||'MONTH')+'\')',false):'')+
      (l.id?(l.status==='ACTIVE'?btn('Suspender','licSetStatus(\''+esc(l.id)+'\',\'SUSPENDED\')',false,true):btn('Ativar','licSetStatus(\''+esc(l.id)+'\',\'ACTIVE\')',false)):'')+
      btn('Palavra-passe do Admin','licOpenCompanyPassword(\''+esc(x.id)+'\')',false)+
      btn('Apagar','licDeleteCompany(\''+esc(x.id)+'\',\''+esc(x.name)+'\')',false,true)+
      '</div></div>';}).join('');
    html+=card('<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div style="font-size:13px;font-weight:800;color:var(--txt)">Empresas licenciadas</div><div style="font-size:10px;color:var(--txt3)">'+companies.length+' registo(s)</div></div><div style="min-width:620px">'+(rows||'<div style="padding:24px;text-align:center;color:var(--txt3)">Sem empresas.</div>')+'</div>');
    html+='</div>'; el.innerHTML=html; setTimeout(licUpdateEndPreview,0);
  }

  window.licShowCounter=function(filter){
    var el=document.getElementById('lic-counter-list'); if(!el)return;
    var c=LIC.ctx||{},companies=c.companies||[],now=Date.now(),soon=now+30*86400000, title='';
    if(filter==='companies'){title='Empresas';}
    else if(filter==='active'){title='Empresas com licença ativa';companies=companies.filter(function(x){return x.license&&x.license.status==='ACTIVE';});}
    else if(filter==='expiring'){title='Licenças a expirar em 5 dias ou expiradas';companies=companies.filter(function(x){var l=x.license||{},d=l.expiresAt?new Date(l.expiresAt).getTime():0;return d>0&&d<=soon&&(l.status==='ACTIVE'||l.status==='EXPIRED');});}
    if(filter==='users'){
      title='Utilizadores ativos';
      var items=[];
      companies.forEach(function(x){
        if(x.adminEmail)items.push('<div style="padding:9px 10px;border-bottom:1px solid var(--bdr)"><b>'+esc(x.adminEmail)+'</b><div style="font-size:9px;color:var(--txt3)">Admin · '+esc(x.name)+'</div></div>');
        var n=x.salesCount||0;if(n)items.push('<div style="padding:9px 10px;border-bottom:1px solid var(--bdr)"><b>'+n+' Comercial'+(n===1?'':'is')+'</b><div style="font-size:9px;color:var(--txt3)">'+esc(x.name)+'</div></div>');
      });
      el.innerHTML=card('<div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:13px;font-weight:900">'+title+'</div><button onclick="document.getElementById(\'lic-counter-list\').style.display=\'none\'" style="background:none;border:0;color:var(--txt3);cursor:pointer">✕</button></div><div style="margin-top:8px">'+(items.join('')||'<div style="padding:12px;color:var(--txt3)">Sem utilizadores.</div>')+'</div>');
      el.style.display='block'; return;
    }
    var rows=companies.map(function(x){var l=x.license||{};return '<div style="display:grid;grid-template-columns:1.5fr 1fr .8fr auto;gap:8px;align-items:center;padding:9px 10px;border-bottom:1px solid var(--bdr)"><div><b>'+esc(x.name)+'</b><div style="font-size:9px;color:var(--txt3)">'+esc(x.adminEmail||'')+'</div></div><div style="font-size:10px">'+esc(l.plan||'Sem licença')+' · '+(l.billingInterval==='YEAR'?'Anual':'Mensal')+'</div><div style="font-size:10px">'+fmtDate(l.expiresAt)+'</div><div>'+btn('Abrir','licOpenCompany(\''+esc(x.id)+'\')',false)+'</div></div>';}).join('');
    el.innerHTML=card('<div style="display:flex;justify-content:space-between;align-items:center"><div style="font-size:13px;font-weight:900">'+title+' <span style="color:var(--txt3);font-size:10px">('+companies.length+')</span></div><button onclick="document.getElementById(\'lic-counter-list\').style.display=\'none\'" style="background:none;border:0;color:var(--txt3);cursor:pointer">✕</button></div><div style="margin-top:8px">'+(rows||'<div style="padding:12px;color:var(--txt3)">Sem registos.</div>')+'</div>');
    el.style.display='block';
  };

  window.licCreateLicense=function(){
    var q=function(id){return document.getElementById(id)};
    var body={companyName:(q('lic-company').value||'').trim(),adminName:(q('lic-admin-name').value||'').trim(),adminEmail:(q('lic-admin-email').value||'').trim(),adminPassword:(q('lic-admin-password').value||''),nif:(q('lic-nif').value||'').trim()||null,clientCode:(q('lic-client-code').value||'').trim()||null,planCode:q('lic-plan').value,billingInterval:q('lic-billing').value,modules:{cctv:q('lic-m-cctv').checked,alarm:q('lic-m-alarm').checked,fire:q('lic-m-fire').checked,cloud:q('lic-m-cloud').checked}};
    var status=q('lic-emit-status'),button=q('lic-emit-btn');
    if(body.adminPassword.length<8){if(status){status.style.color='#ef4444';status.textContent='A password deve ter pelo menos 8 caracteres.';}notify('A password deve ter pelo menos 8 caracteres.');return;}
    if(!body.companyName||!body.adminName||!body.adminEmail||!body.adminPassword){if(status){status.style.color='#ef4444';status.textContent='Preenche Empresa, Nome do Admin, Email e Password.';}notify('Preenche empresa, Admin e email.');return;}
    if(status){status.style.color='var(--txt3)';status.textContent='A criar empresa, licença e convite do Admin…';}
    if(button){button.disabled=true;button.style.opacity='.55';button.textContent='A emitir…';}
    licenseApi('/licensing/licenses',{method:'POST',body:JSON.stringify(body)}).then(function(res){
      if(status){status.style.color='#10b981';status.textContent='✓ Licença emitida. Fim: '+licFmtDateLocal(licCalcEndDate(body.billingInterval));}
      notify('✓ Licença emitida e Admin criado/convidado.');
      return loadContext().then(function(){renderSuperAdmin();});
    }).catch(function(e){
      if(status){status.style.color='#ef4444';status.textContent='Erro: '+(e.message||'Não foi possível emitir a licença.');}
      notify('Erro: '+(e.message||'Não foi possível emitir a licença.'));
      if(button){button.disabled=false;button.style.opacity='1';button.textContent='Emitir licença';}
    });
  };
  window.licSetStatus=function(id,status){ if(!confirm((status==='SUSPENDED'?'Suspender':'Ativar')+' esta licença?'))return; licenseApi('/licensing/licenses/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({status:status})}).then(function(){notify('Licença atualizada.');renderLicenseCenter();}).catch(function(e){notify('Erro: '+e.message);}); };
  window.licRenewLicense=function(id){
    if(!confirm('Renovar esta licença pelo mesmo período atual?'))return;
    licenseApi('/licensing/renew',{method:'POST',body:JSON.stringify({licenseId:id})})
      .then(function(res){
        var end=res&&res.license&&res.license.expires_at?fmtDate(res.license.expires_at):'';
        notify('✓ Licença renovada'+(end?' até '+end:'')+'.');
        renderLicenseCenter();
      })
      .catch(function(e){notify('Erro: '+e.message);});
  };

  window.licOpenChangeLicense=function(id,plan,billing){
    var old=document.getElementById('lic-change-overlay');
    if(old)old.remove();

    var wrap=document.createElement('div');
    wrap.id='lic-change-overlay';
    wrap.style.cssText='position:fixed;inset:0;z-index:1000000;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;padding:20px';

    wrap.innerHTML=
      '<div style="width:min(520px,96vw);background:var(--bg1);border:1px solid var(--bdr2);border-radius:16px;padding:22px;box-shadow:0 25px 80px rgba(0,0,0,.45)">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:16px">'+
          '<div>'+
            '<div style="font-size:18px;font-weight:900;color:var(--txt)">Alterar licença</div>'+
            '<div style="font-size:11px;color:var(--txt3);margin-top:3px">A alteração inicia um novo período a partir de hoje.</div>'+
          '</div>'+
          '<button id="lic-change-close" type="button" style="border:0;background:transparent;color:var(--txt3);font-size:20px;cursor:pointer">✕</button>'+
        '</div>'+
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'+
          '<div>'+
            '<div style="font-size:10px;color:var(--txt3);font-family:var(--m);text-transform:uppercase;margin-bottom:5px">Plano</div>'+
            '<select id="lic-change-plan" style="width:100%;background:var(--bg2);border:1px solid var(--bdr2);border-radius:8px;padding:10px;color:var(--txt)">'+
              '<option value="EXPRESS">Express</option>'+
              '<option value="PRO">PRO</option>'+
            '</select>'+
          '</div>'+
          '<div>'+
            '<div style="font-size:10px;color:var(--txt3);font-family:var(--m);text-transform:uppercase;margin-bottom:5px">Periodicidade</div>'+
            '<select id="lic-change-billing" style="width:100%;background:var(--bg2);border:1px solid var(--bdr2);border-radius:8px;padding:10px;color:var(--txt)">'+
              '<option value="MONTH">Mensal</option>'+
              '<option value="YEAR">Anual</option>'+
            '</select>'+
          '</div>'+
        '</div>'+
        '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px">'+
          '<button id="lic-change-cancel" type="button" style="padding:9px 13px;border-radius:8px;border:1px solid var(--bdr2);background:transparent;color:var(--txt2);cursor:pointer">Cancelar</button>'+
          '<button id="lic-change-save" type="button" style="padding:9px 13px;border-radius:8px;border:0;background:var(--acc);color:#fff;font-weight:800;cursor:pointer">Guardar alteração</button>'+
        '</div>'+
        '<div id="lic-change-status" style="font-size:10px;color:var(--txt3);margin-top:8px"></div>'+
      '</div>';

    document.body.appendChild(wrap);

    document.getElementById('lic-change-plan').value=(plan==='PRO'?'PRO':'EXPRESS');
    document.getElementById('lic-change-billing').value=(billing==='YEAR'?'YEAR':'MONTH');

    function closeChangeLicense(){
      var ov=document.getElementById('lic-change-overlay');
      if(ov)ov.remove();
    }

    document.getElementById('lic-change-close').addEventListener('click',closeChangeLicense);
    document.getElementById('lic-change-cancel').addEventListener('click',closeChangeLicense);
    document.getElementById('lic-change-save').addEventListener('click',function(){
      licSubmitChangeLicense(id);
    });
  };

  window.licSubmitChangeLicense=function(id){
    var plan=document.getElementById('lic-change-plan').value;
    var billing=document.getElementById('lic-change-billing').value;
    var st=document.getElementById('lic-change-status');
    if(st)st.textContent='A guardar...';
    licenseApi('/licensing/change',{method:'PATCH',body:JSON.stringify({licenseId:id,planCode:plan,billingInterval:billing})})
      .then(function(res){
        var end=res&&res.license&&res.license.expires_at?fmtDate(res.license.expires_at):'';
        var ov=document.getElementById('lic-change-overlay'); if(ov)ov.remove();
        notify('✓ Licença alterada'+(end?' até '+end:'')+'.');
        renderLicenseCenter();
      })
      .catch(function(e){if(st){st.style.color='#ef4444';st.textContent='Erro: '+e.message;}notify('Erro: '+e.message);});
  };

  window.licDeleteCompany=function(companyId,name){
    var v=prompt('Esta ação elimina a empresa, licença, projetos e associações.\\n\\nPara confirmar a eliminação de \"'+name+'\", escreva APAGAR:');
    if(v!=='APAGAR')return;
    licenseApi('/licensing/company-delete',{method:'DELETE',body:JSON.stringify({companyId:companyId})})
      .then(function(){
        notify('Empresa e licença apagadas.');
        renderLicenseCenter();
      })
      .catch(function(e){notify('Erro: '+e.message);});
  };
  window.licOpenCompanyPassword=function(id){window.licOpenCompany(id,true);};
  window.licOpenCompany=function(id,focusPassword){ licenseApi('/licensing/companies/'+encodeURIComponent(id)).then(function(x){renderCompanyDetail(x);if(focusPassword){var input=document.getElementById('company-admin-password');if(input){input.focus();input.scrollIntoView({block:'center',behavior:'smooth'});}}}).catch(function(e){notify('Erro: '+e.message);}); };
  function renderCompanyDetail(x){
    var el=document.getElementById('license-body'),l=x.license||{},users=x.users||[];
    var admin=users.find(function(u){return u.role===ROLE.ADMIN&&u.active!==false;})||users.find(function(u){return u.role===ROLE.ADMIN;});
    var adminHtml=admin
      ? '<div style="display:grid;grid-template-columns:1.1fr .9fr;gap:12px">'
        +'<div><div style="font-size:13px;font-weight:800;color:var(--txt)">Admin da empresa</div>'
        +'<div style="margin-top:8px;font-size:12px;color:var(--txt)">'+esc(admin.name||'Admin')+'</div>'
        +'<div style="font-size:10px;color:var(--txt3)">'+esc(admin.email||'')+'</div></div>'
        +'<div><div style="font-size:10px;color:var(--txt3);font-family:var(--m);text-transform:uppercase;margin-bottom:6px">Alterar palavra-passe do Admin</div>'
        +'<div style="display:flex;gap:8px"><input id="company-admin-password" type="password" placeholder="Mínimo 8 caracteres" style="flex:1;background:var(--bg1);border:1px solid var(--bdr2);border-radius:8px;padding:10px;color:var(--txt);font-family:var(--f)">'
        +'<button type="button" onclick="licChangeAdminPassword(\''+esc(admin.id)+'\')" style="padding:9px 13px;border:0;border-radius:8px;background:var(--acc);color:#fff;font-weight:800;cursor:pointer">Guardar palavra-passe</button></div>'
        +'<div id="company-admin-password-status" style="font-size:9px;color:var(--txt3);margin-top:5px">A password atual não é apresentada por segurança.</div></div></div>'
      : '<div style="font-size:11px;color:#f59e0b">Esta empresa ainda não tem um Admin associado.</div>';

    el.innerHTML=
      '<div style="margin-bottom:10px">'+btn('← Voltar','renderLicenseCenter()',false)+'</div>'
      +card('<div style="display:flex;justify-content:space-between;gap:12px"><div><div style="font-size:20px;font-weight:900;color:var(--txt)">'+esc(x.name)+'</div><div style="font-size:11px;color:var(--txt3)">'+esc(x.nif||'')+(x.clientCode?' · Código: '+esc(x.clientCode):'')+'</div></div><div>'+pill(l.status||'—',l.status==='ACTIVE'?'ok':'warn')+'</div></div>'
      +'<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px"><div>Plano<br><b>'+esc(l.plan||'SIGS')+'</b></div><div>Periodicidade<br><b>'+(l.billingInterval==='YEAR'?'Anual':'Mensal')+'</b></div><div>Validade<br><b>'+fmtDate(l.expiresAt)+'</b></div><div>Projetos<br><b>'+esc(x.projectCount||0)+(l.maxProjects?' / '+esc(l.maxProjects):'')+'</b></div></div>')
      +'<div style="height:12px"></div>'
      +card(adminHtml)
      +'<div style="height:12px"></div>'
      +card('<div style="font-weight:800;color:var(--txt);margin-bottom:8px">Utilizadores</div>'
        +users.map(function(u){return '<div style="display:grid;grid-template-columns:1fr .6fr .5fr;gap:8px;padding:9px 4px;border-bottom:1px solid var(--bdr)"><div><b>'+esc(u.name)+'</b><div style="font-size:10px;color:var(--txt3)">'+esc(u.email)+'</div></div><div>'+pill(u.role,u.active===false?'bad':'ok')+'</div><div style="text-align:right">'+(u.active===false?'Inativo':'Ativo')+'</div></div>';}).join('')+'</div>');
  }

  window.licChangeAdminPassword=function(userId){
    var input=document.getElementById('company-admin-password'),status=document.getElementById('company-admin-password-status');
    if(!input)return;
    var password=input.value||'';
    if(password.length<8){
      if(status){status.style.color='#ef4444';status.textContent='A password deve ter pelo menos 8 caracteres.';}
      notify('A password deve ter pelo menos 8 caracteres.');
      return;
    }
    if(status){status.style.color='var(--txt3)';status.textContent='A alterar...';}
    licenseApi('/licensing/password',{method:'PATCH',body:JSON.stringify({userId:userId,password:password})})
      .then(function(){
        input.value='';
        if(status){status.style.color='#10b981';status.textContent='✓ Password atualizada com sucesso.';}
        notify('✓ Password do Admin atualizada.');
      })
      .catch(function(e){
        if(status){status.style.color='#ef4444';status.textContent='Erro: '+e.message;}
        notify('Erro: '+e.message);
      });
  };


  function renderSalesReadonly(){
    var el=document.getElementById('license-body'),c=LIC.ctx||{},co=c.company||{},l=c.license||{};
    el.innerHTML=card('<div style="display:flex;justify-content:space-between;gap:12px"><div><div style="font-size:18px;font-weight:900;color:var(--txt)">'+esc(co.name||'Empresa')+'</div><div style="font-size:11px;color:var(--txt3)">Utilizador Comercial · acesso sem permissões administrativas</div></div>'+pill(l.status||'—',l.status==='ACTIVE'?'ok':'warn')+'</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px"><div><span style="font-size:9px;color:var(--txt3)">VALIDADE</span><br><b>'+fmtDate(l.expiresAt)+'</b></div><div><span style="font-size:9px;color:var(--txt3)">PLANO</span><br><b>'+esc(l.plan||'SIGS')+'</b></div><div><span style="font-size:9px;color:var(--txt3)">MÓDULOS</span><br><b>'+Object.keys(l.modules||{}).filter(function(k){return l.modules[k];}).map(function(k){return k.toUpperCase();}).join(' · ')+'</b></div></div><div style="margin-top:14px;font-size:11px;color:var(--txt2)">A gestão de comerciais e da licença é exclusiva do Admin da empresa.</div>');
  }

  function renderAdmin(){
    var el=document.getElementById('license-body'),c=LIC.ctx||{},co=c.company||{},l=c.license||{},users=c.users||[],sales=users.filter(function(u){return u.role===ROLE.SALES;});
    var canAdd=l.status==='ACTIVE';
    var html='<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">';
    html+=card('<div style="display:flex;justify-content:space-between;gap:12px"><div><div style="font-size:18px;font-weight:900;color:var(--txt)">'+esc(co.name||'Empresa')+'</div><div style="font-size:10px;color:var(--txt3)">'+esc(co.nif||'')+'</div></div>'+pill(l.status||'—',l.status==='ACTIVE'?'ok':l.status==='SUSPENDED'?'warn':'bad')+'</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px"><div><span style="font-size:9px;color:var(--txt3)">VALIDADE</span><br><b>'+fmtDate(l.expiresAt)+'</b></div><div><span style="font-size:9px;color:var(--txt3)">PERIODICIDADE</span><br><b>'+(l.billingInterval==='YEAR'?'Anual':'Mensal')+'</b></div><div><span style="font-size:9px;color:var(--txt3)">PLANO</span><br><b>'+esc(l.plan||'SIGS')+'</b></div></div><div style="margin-top:12px;font-size:11px;color:var(--txt2)">Módulos: '+Object.keys(l.modules||{}).filter(function(k){return l.modules[k];}).map(function(k){return k.toUpperCase();}).join(' · ')+'</div><div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--bdr)"><div style="font-size:10px;color:var(--txt3);font-family:var(--m);text-transform:uppercase;margin-bottom:6px">Código do cliente</div><div style="display:flex;gap:8px"><input id="admin-client-code" value="'+esc(co.clientCode||'')+'" placeholder="Ex.: CLI-001" style="flex:1;background:var(--bg1);border:1px solid var(--bdr2);border-radius:8px;padding:10px;color:var(--txt);font-family:var(--f)"><button type="button" onclick="licSaveClientCode()" style="padding:9px 13px;border:0;border-radius:8px;background:var(--acc);color:#fff;font-weight:800;cursor:pointer">Guardar código</button></div><div id="admin-client-code-status" style="font-size:9px;color:var(--txt3);margin-top:5px">Pode alterar este código a qualquer momento.</div><div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--bdr)"><div style="font-size:10px;color:var(--txt3);font-family:var(--m);text-transform:uppercase;margin-bottom:6px">Alterar a minha password</div><div style="display:flex;gap:8px"><input id="admin-own-password" type="password" placeholder="Nova password · mínimo 8 caracteres" style="flex:1;background:var(--bg1);border:1px solid var(--bdr2);border-radius:8px;padding:10px;color:var(--txt);font-family:var(--f)"><button type="button" onclick="licChangeOwnPassword()" style="padding:9px 13px;border:0;border-radius:8px;background:var(--acc);color:#fff;font-weight:800;cursor:pointer">Alterar</button></div><div id="admin-own-password-status" style="font-size:9px;color:var(--txt3);margin-top:5px">Use uma password com pelo menos 8 caracteres.</div></div></div>');
    html+=card('<div style="font-size:13px;font-weight:800;color:var(--txt);margin-bottom:11px">＋ Criar Comercial</div>'+field('sales-name','Nome','text','Nome do comercial')+'<div style="height:8px"></div>'+field('sales-email','Email','email','comercial@empresa.pt')+'<div style="height:8px"></div>'+field('sales-password','Password inicial','password','Mínimo 8 caracteres')+'<div style="height:12px"></div>'+(canAdd?btn('Criar Comercial','licCreateSales()',true):'<div style="font-size:11px;color:#f59e0b">Não é possível adicionar Comerciais enquanto a licença não estiver ativa.</div>'));
    html+='</div><div style="height:14px"></div>';
    html+=card('<div style="display:flex;justify-content:space-between;margin-bottom:8px"><div style="font-size:13px;font-weight:800;color:var(--txt)">Comerciais da empresa</div><div style="font-size:10px;color:var(--txt3)">'+sales.length+' comercial(is)</div></div>'+sales.map(function(u){return '<div style="display:grid;grid-template-columns:1.5fr .55fr auto;gap:8px;align-items:center;padding:10px 4px;border-bottom:1px solid var(--bdr)"><div><div style="font-weight:700;color:var(--txt)">'+esc(u.name)+'</div><div style="font-size:10px;color:var(--txt3)">'+esc(u.email)+'</div></div><div style="font-size:10px;color:var(--txt3)">'+(u.active===false?'Inativo':'Ativo')+'</div><div>'+(u.active===false?btn('Reativar','licToggleUser(\''+esc(u.id)+'\',true)',false):btn('Desativar','licToggleUser(\''+esc(u.id)+'\',false)',false,true))+'</div></div>';}).join('')+'</div>');
    el.innerHTML=html;
  }

  window.sigsRenderAdminHome=function(){
    var host=document.getElementById('sigs-gate-main');
    if(!host)return;
    host.innerHTML='<div class="sag-title">Painel do Administrador</div><div class="sag-sub">A carregar utilização do plano e projetos da empresa…</div>';
    licenseApi('/licensing/context').then(function(ctx){
      LIC.ctx=ctx||{};
      var co=LIC.ctx.company||{},l=LIC.ctx.license||{},projects=LIC.ctx.projects||[];
      var maxProjects=l.maxProjects==null?null:Number(l.maxProjects),used=projects.length,free=maxProjects==null?null:Math.max(0,maxProjects-used),pct=maxProjects?Math.min(100,Math.round((used/maxProjects)*100)):0;
      function itemCount(p){return (p.cameraCount||0)+(p.detectorCount||0)+(p.fireDetectorCount||0);}
      var rows=projects.length?projects.map(function(p){return '<div style="display:grid;grid-template-columns:1.5fr .6fr .75fr .55fr .75fr auto;gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid var(--bdr)"><div><div style="font-weight:800;color:var(--txt)">'+esc(p.name)+'</div><div style="font-size:9px;color:var(--txt3)">por '+esc(p.createdByName||'Utilizador')+' · '+esc(p.status==='DRAFT'?'Rascunho':p.status==='ARCHIVED'?'Arquivado':'Ativo')+'</div></div><div>'+pill(esc(p.module||'—'),'ok')+'</div><div style="font-size:10px;color:var(--txt2)">'+itemCount(p)+' item'+(itemCount(p)===1?'':'s')+'</div><div style="font-size:10px;color:var(--txt2)">'+(p.floorCount||1)+' piso'+((p.floorCount||1)===1?'':'s')+'</div><div style="font-size:9px;color:var(--txt3)">'+fmtDate(p.updatedAt||p.createdAt)+'</div><div style="display:flex;gap:6px;flex-wrap:wrap">'+btn('Abrir','sigsAdminOpenProject(\''+esc(p.id)+'\',\''+esc(p.name).replace(/'/g,"\\'")+'\')',false)+btn('Duplicar','sigsV6DuplicateProject(\''+esc(p.id)+'\')',false)+'</div></div>';}).join(''):'<div style="padding:30px;text-align:center;color:var(--txt3);font-size:11px">Ainda não existem projetos guardados no Supabase.</div>';
      host.innerHTML='<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px"><div><div class="sag-title">'+esc(co.name||'Painel do Administrador')+'</div><div class="sag-sub">Dashboard da empresa · utilização do plano e supervisão dos projetos</div></div><div class="sag-actions" style="margin-top:0"><button class="sag-btn primary" onclick="sigsV6NewProject()">＋ Novo Projeto</button><button class="sag-btn" onclick="openLicenseCenter()">👥 Gerir Comerciais</button><button class="sag-btn" onclick="sigsPortalOpenDesigner()">📐 Entrar no SIGS</button><button class="sag-btn danger" onclick="sigsPortalLogout()">Sair</button></div></div>'+
        '<div class="sag-card" style="margin-top:18px"><div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:12px"><div><strong style="color:var(--txt);font-size:16px">Utilização do plano</strong><div class="sag-sub" style="margin:4px 0 0">Projetos partilhados pelo Admin e Comerciais</div></div><div style="text-align:right"><div style="font-size:27px;font-weight:900;color:var(--txt)">'+used+(maxProjects!=null?' / '+maxProjects:'')+'</div><div style="font-size:10px;color:'+(free===0&&maxProjects!=null?'#ef4444':'var(--txt3)')+'">'+(free==null?'Sem limite definido':free+' projeto'+(free===1?'':'s')+' livre'+(free===1?'':'s'))+'</div></div></div>'+
        (maxProjects!=null?'<div style="height:10px;background:var(--bg2);border:1px solid var(--bdr);border-radius:999px;overflow:hidden"><div style="height:100%;width:'+pct+'%;background:'+(pct>=100?'#ef4444':pct>=80?'#f59e0b':'var(--acc)')+'"></div></div>':'')+
        '<div class="sag-grid" style="margin-top:14px"><div class="sag-stat"><span>Usados</span><b>'+used+'</b></div><div class="sag-stat"><span>Disponíveis</span><b>'+(free==null?'—':free)+'</b></div><div class="sag-stat"><span>Itens / projeto</span><b>'+(l.maxItems==null?'—':l.maxItems)+'</b></div></div></div>'+
        '<div class="sag-card" style="margin-top:18px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px"><strong style="color:var(--txt);font-size:16px">Projetos da empresa</strong><span style="font-size:10px;color:var(--txt3)">'+projects.length+' projeto(s)</span></div>'+rows+'</div>';
    }).catch(function(err){
      host.innerHTML='<div class="sag-title">Painel do Administrador</div><div class="sag-card" style="border-color:rgba(239,68,68,.3);color:#ef4444">Não foi possível carregar o dashboard: '+esc(err&&err.message?err.message:'erro desconhecido')+'</div><div class="sag-actions"><button class="sag-btn primary" onclick="sigsRenderAdminHome()">Tentar novamente</button><button class="sag-btn danger" onclick="sigsPortalLogout()">Sair</button></div>';
    });
  };



  window.sigsRenderSalesHome=function(){
    var host=document.getElementById('sigs-gate-main');
    if(!host)return;
    host.innerHTML='<div class="sag-title">Painel do Comercial</div><div class="sag-sub">A carregar projetos e equipa…</div>';
    licenseApi('/licensing/context').then(function(ctx){
      LIC.ctx=ctx||{};
      var co=LIC.ctx.company||{},l=LIC.ctx.license||{},projects=LIC.ctx.projects||[],users=LIC.ctx.users||[];
      var sales=users.filter(function(u){return u.role===ROLE.SALES&&u.active!==false;});
      function itemCount(p){return (p.cameraCount||0)+(p.detectorCount||0)+(p.fireDetectorCount||0);}
      var own=projects.filter(function(p){return p.createdBy===CLOUD.user.id;});
      var shared=projects.filter(function(p){return p.createdBy!==CLOUD.user.id&&p.assignedTo===CLOUD.user.id;});
      var rows=projects.length?projects.map(function(p){
        var mine=p.createdBy===CLOUD.user.id;
        var relation=(mine?'Meu projeto':'Partilhado por '+esc(p.createdByName||'colega'))+' · '+esc(p.status==='DRAFT'?'Rascunho':p.status==='ARCHIVED'?'Arquivado':'Ativo');
        var shareInfo=mine&&p.assignedToName?'<div style="font-size:9px;color:#60a5fa;margin-top:3px">Partilhado com '+esc(p.assignedToName)+'</div>':'';
        return '<div style="display:grid;grid-template-columns:1.45fr .55fr .72fr .65fr auto;gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid var(--bdr)">'+
          '<div><div style="font-weight:800;color:var(--txt)">'+esc(p.name)+'</div><div style="font-size:9px;color:var(--txt3)">'+relation+'</div>'+shareInfo+'</div>'+
          '<div>'+pill(esc(p.module||'—'),'ok')+'</div>'+
          '<div style="font-size:10px;color:var(--txt2)">'+itemCount(p)+' item'+(itemCount(p)===1?'':'s')+'</div>'+
          '<div style="font-size:9px;color:var(--txt3)">'+fmtDate(p.updatedAt||p.createdAt)+'</div>'+
          '<div style="display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap">'+
            btn('Abrir','sigsAdminOpenProject(\''+esc(p.id)+'\',\''+esc(p.name).replace(/'/g,"\\'")+'\')',false)+
            (mine?btn('Duplicar','sigsV6DuplicateProject(\''+esc(p.id)+'\')',false)+btn('Partilhar','sigsOpenShareProject(\''+esc(p.id)+'\')',false):'')+
          '</div></div>';
      }).join(''):'<div style="padding:30px;text-align:center;color:var(--txt3);font-size:11px">Ainda não tem projetos.</div>';

      host.innerHTML=
        '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px"><div><div class="sag-title">'+esc(co.name||'Painel do Comercial')+'</div><div class="sag-sub">Os seus projetos e os que foram partilhados consigo</div></div><div class="sag-actions" style="margin-top:0"><button class="sag-btn primary" onclick="sigsV6NewProject()">＋ Novo Projeto</button><button class="sag-btn" onclick="sigsPortalOpenDesigner()">📐 Entrar no SIGS</button><button class="sag-btn danger" onclick="sigsPortalLogout()">Sair</button></div></div>'+
        '<div class="sag-grid" style="margin-top:18px"><div class="sag-stat"><span>Meus projetos</span><b>'+own.length+'</b></div><div class="sag-stat"><span>Partilhados comigo</span><b>'+shared.length+'</b></div><div class="sag-stat"><span>Plano</span><b style="font-size:16px">'+esc(l.plan||'SIGS')+'</b></div></div>'+
        '<div class="sag-card" style="margin-top:18px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><strong style="color:var(--txt);font-size:16px">Projetos</strong><span style="font-size:10px;color:var(--txt3)">'+projects.length+' projeto(s) acessíveis</span></div>'+rows+'</div>'+
        '<div class="sag-card" style="margin-top:18px"><strong style="color:var(--txt);font-size:16px">Conta</strong><div class="sag-sub" style="margin-top:4px">Pode alterar a sua password sempre que precisar.</div><div style="display:flex;gap:8px;margin-top:12px;max-width:620px"><input id="sales-own-password" type="password" placeholder="Nova password · mínimo 8 caracteres" style="flex:1;background:var(--bg1);border:1px solid var(--bdr2);border-radius:8px;padding:10px;color:var(--txt);font-family:var(--f)"><button type="button" onclick="sigsSalesChangePassword()" style="padding:9px 13px;border:0;border-radius:8px;background:var(--acc);color:#fff;font-weight:800;cursor:pointer">Guardar palavra-passe</button></div><div id="sales-own-password-status" style="font-size:9px;color:var(--txt3);margin-top:5px"></div></div>';
    }).catch(function(err){
      host.innerHTML='<div class="sag-title">Painel do Comercial</div><div class="sag-card" style="border-color:rgba(239,68,68,.3);color:#ef4444">Não foi possível carregar: '+esc(err&&err.message?err.message:'erro desconhecido')+'</div><div class="sag-actions"><button class="sag-btn primary" onclick="sigsRenderSalesHome()">Tentar novamente</button><button class="sag-btn danger" onclick="sigsPortalLogout()">Sair</button></div>';
    });
  };

  window.sigsSalesChangePassword=function(){
    var input=document.getElementById('sales-own-password'),status=document.getElementById('sales-own-password-status');
    if(!input||!CLOUD.user)return;
    var password=input.value||'';
    if(password.length<8){
      if(status){status.style.color='#ef4444';status.textContent='A password deve ter pelo menos 8 caracteres.';}
      notify('A password deve ter pelo menos 8 caracteres.');
      return;
    }
    if(status){status.style.color='var(--txt3)';status.textContent='A alterar...';}
    licenseApi('/licensing/password',{method:'PATCH',body:JSON.stringify({userId:CLOUD.user.id,password:password})})
      .then(function(){
        input.value='';
        if(status){status.style.color='#10b981';status.textContent='✓ Password atualizada.';}
        notify('✓ Password atualizada.');
      })
      .catch(function(e){
        if(status){status.style.color='#ef4444';status.textContent='Erro: '+e.message;}
        notify('Erro: '+e.message);
      });
  };

  window.sigsOpenShareProject=function(projectId){
    var ctx=LIC.ctx||{},users=ctx.users||[],projects=ctx.projects||[];
    var project=projects.find(function(p){return p.id===projectId;});
    if(!project||project.createdBy!==CLOUD.user.id){notify('Só o criador pode alterar a partilha deste projeto.');return;}
    var colleagues=users.filter(function(u){return u.role===ROLE.SALES&&u.active!==false&&u.id!==CLOUD.user.id;});
    if(!colleagues.length){notify('Não existem outros Comerciais ativos nesta empresa.');return;}
    var old=document.getElementById('sigs-share-overlay');if(old)old.remove();
    var wrap=document.createElement('div');
    wrap.id='sigs-share-overlay';
    wrap.style.cssText='position:fixed;inset:0;z-index:1000000;background:rgba(0,0,0,.62);display:flex;align-items:center;justify-content:center;padding:20px';
    var options='<option value="">Sem partilha</option>'+colleagues.map(function(u){return '<option value="'+esc(u.id)+'">'+esc(u.name||u.email)+' · '+esc(u.email||'')+'</option>';}).join('');
    wrap.innerHTML='<div style="width:min(520px,96vw);background:var(--bg1);border:1px solid var(--bdr2);border-radius:16px;padding:22px;box-shadow:0 25px 80px rgba(0,0,0,.45)">'+
      '<div style="font-size:18px;font-weight:900;color:var(--txt)">Partilhar projeto</div>'+
      '<div style="font-size:11px;color:var(--txt3);margin-top:4px">Escolha um Comercial da mesma empresa.</div>'+
      '<select id="sigs-share-user" style="width:100%;margin-top:14px;background:var(--bg2);border:1px solid var(--bdr2);border-radius:8px;padding:11px;color:var(--txt)">'+options+'</select>'+
      '<div style="font-size:9px;color:var(--txt3);margin-top:6px">O colega poderá abrir e trabalhar neste projeto. O projeto continua identificado pelo criador original.</div>'+
      '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:18px"><button id="sigs-share-cancel" type="button" class="sag-btn">Cancelar</button><button id="sigs-share-save" type="button" class="sag-btn primary">Guardar partilha</button></div>'+
      '<div id="sigs-share-status" style="font-size:10px;color:var(--txt3);margin-top:8px"></div></div>';
    document.body.appendChild(wrap);
    document.getElementById('sigs-share-user').value=project.assignedTo||'';
    document.getElementById('sigs-share-cancel').onclick=function(){wrap.remove();};
    document.getElementById('sigs-share-save').onclick=function(){
      var target=document.getElementById('sigs-share-user').value||null;
      var st=document.getElementById('sigs-share-status');
      if(st)st.textContent='A guardar...';
      var cfg=_sigsSbCfg();
      _sigsSbJson(cfg.url+'/rest/v1/projects?id=eq.'+encodeURIComponent(projectId),{
        method:'PATCH',
        headers:_sigsSbHeaders({'Prefer':'return=representation'}),
        body:JSON.stringify({assigned_to:target,updated_at:new Date().toISOString()})
      }).then(function(){
        wrap.remove();
        notify(target?'✓ Projeto partilhado.':'Partilha removida.');
        sigsRenderSalesHome();
      }).catch(function(e){
        if(st){st.style.color='#ef4444';st.textContent='Erro: '+e.message;}
        notify('Erro: '+e.message);
      });
    };
  };

  window.licChangeOwnPassword=function(){
    var input=document.getElementById('admin-own-password'),status=document.getElementById('admin-own-password-status');
    if(!input||!CLOUD.user)return;
    var password=input.value||'';
    if(password.length<8){
      if(status){status.style.color='#ef4444';status.textContent='A password deve ter pelo menos 8 caracteres.';}
      notify('A password deve ter pelo menos 8 caracteres.');
      return;
    }
    if(status){status.style.color='var(--txt3)';status.textContent='A alterar...';}
    licenseApi('/licensing/password',{method:'PATCH',body:JSON.stringify({userId:CLOUD.user.id,password:password})})
      .then(function(){
        input.value='';
        if(status){status.style.color='#10b981';status.textContent='✓ Password atualizada.';}
        notify('✓ Password atualizada com sucesso.');
      })
      .catch(function(e){
        if(status){status.style.color='#ef4444';status.textContent='Erro: '+e.message;}
        notify('Erro: '+e.message);
      });
  };

  window.licSaveClientCode=function(){
    var input=document.getElementById('admin-client-code'),status=document.getElementById('admin-client-code-status');
    if(!input)return;
    var value=(input.value||'').trim();
    if(status){status.style.color='var(--txt3)';status.textContent='A guardar...';}
    licenseApi('/licensing/company-code',{method:'PATCH',body:JSON.stringify({clientCode:value})})
      .then(function(){
        if(LIC.ctx&&LIC.ctx.company)LIC.ctx.company.clientCode=value;
        if(status){status.style.color='#10b981';status.textContent='✓ Código guardado.';}
        notify('✓ Código do cliente atualizado.');
      })
      .catch(function(e){
        if(status){status.style.color='#ef4444';status.textContent='Erro: '+e.message;}
        notify('Erro: '+e.message);
      });
  };

  window.licCreateSales=function(){
    var name=document.getElementById('sales-name').value.trim(),
        email=document.getElementById('sales-email').value.trim(),
        password=(document.getElementById('sales-password').value||'');
    if(!name||!email||!password){notify('Preenche nome, email e password.');return;}
    if(password.length<8){notify('A password deve ter pelo menos 8 caracteres.');return;}
    licenseApi('/licensing/users',{method:'POST',body:JSON.stringify({name:name,email:email,password:password,role:'SALES'})})
      .then(function(){notify('✓ Comercial criado.');renderLicenseCenter();})
      .catch(function(e){notify('Erro: '+e.message);});
  };
  window.licToggleUser=function(id,active){ licenseApi('/licensing/users/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({active:active})}).then(function(){notify(active?'Utilizador reativado.':'Utilizador desativado; os projetos permanecem na empresa.');renderLicenseCenter();}).catch(function(e){notify('Erro: '+e.message);}); };

  // Module access helper. Backend remains authoritative.
  window.sigsModuleAllowed=function(mod){
    if(!CLOUD.user)return true; // preserves existing offline mode until server enables strict licensing
    var c=LIC.ctx, r=roleOf(); if(r===ROLE.SUPER_ADMIN)return true;
    if(!c||!c.license)return true; // avoid locking legacy backend before licensing endpoints exist
    if(c.license.status!=='ACTIVE')return false;
    var m=c.license.modules||{}; if(mod==='cctv')return m.cctv!==false; if(mod==='alarm')return m.alarm!==false; if(mod==='fire')return m.fire!==false; return true;
  };

  // Wrap module launcher to respect licensed modules when context is available.
  var originalStart=window.startModule;
  window.startModule=function(mod){ if(!window.sigsModuleAllowed(mod)){notify('🔒 Este módulo não está incluído na licença ativa.');return;} return originalStart.apply(this,arguments); };

  // Login/access portal is Supabase-only in V6.
  window.cloudShowRegister=function(){ notify('As contas são criadas pelo Super Admin ou pelo Admin da empresa.'); };
  setTimeout(refreshLicenseButton,1000);
})();
