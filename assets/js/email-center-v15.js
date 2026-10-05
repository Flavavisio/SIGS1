(function(){'use strict';
const base='https://kbihedvyykjlbnipdgfm.supabase.co',key='sb_publishable_7iaBGJr6qS-YO1HOySsKUQ_vCxOU52o';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const events={welcome:'Boas-vindas',license_activated:'Licença ativada',license_renewed:'Licença renovada',license_expiring:'Aviso de vencimento',license_expired:'Licença expirada',license_suspended:'Licença suspensa',license_reactivated:'Licença reativada'};
async function post(path,body){const r=await fetch(base+path,{method:'POST',headers:{apikey:key,Authorization:'Bearer '+CLOUD.access,'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.error||'Não foi possível consultar os emails.');return data;}
window.sigsOpenEmailCenter=async function(){
 if(!window.CLOUD||CLOUD.user?.role!=='SUPER_ADMIN')return;const host=document.getElementById('sigs-gate-main');if(!host)return;
 host.innerHTML='<div class="sag-title">Emails do SIGS</div><div class="sag-sub">Acesso, recuperação e avisos de licença.</div><div class="sag-card"><a class="sag-btn primary" href="emails.html" target="_blank" rel="noopener">Ver os 15 modelos</a> <button class="sag-btn" onclick="sigsPortalRender()">Voltar</button><div id="email-center-status" role="status" style="margin-top:16px">A consultar o serviço…</div><div id="email-center-list"></div></div>';
 const status=document.getElementById('email-center-status');
 try{const [transport,queue]=await Promise.all([post('/functions/v1/sigs-email-worker',{action:'status'}),post('/rest/v1/rpc/sigs_email_status',{})]);if(!status.isConnected)return;
 const counts=queue.counts||{};status.textContent=(transport.enabled?'Envios de licença ativos.':transport.configured?'SMTP configurado; envios de licença por ativar.':'SMTP dos avisos de licença por configurar.')+' Em espera: '+(counts.pending||0)+' · Enviados: '+(counts.sent||0)+' · Falhas: '+(counts.failed||0)+'.';
 const list=document.getElementById('email-center-list');list.innerHTML='<p style="font-size:11px;color:var(--txt3)">Os emails de autenticação usam a configuração de SMTP e os modelos do Supabase Auth.</p>'+(queue.recent||[]).map(r=>'<div style="padding:10px 0;border-top:1px solid var(--bdr2);font-size:12px">'+esc(events[r.event]||r.event)+' · '+esc({pending:'Em espera',processing:'A enviar',sent:'Enviado',failed:'Falhou',cancelled:'Cancelado'}[r.status]||r.status)+'<small style="display:block;color:var(--txt3)">'+esc(new Date(r.created_at).toLocaleString('pt-PT'))+(r.last_error?' · '+esc(r.last_error):'')+'</small></div>').join('');
 }catch(e){if(status.isConnected)status.textContent='Não foi possível consultar o serviço de emails. Os modelos estão disponíveis na pré-visualização.';}
};
})();
