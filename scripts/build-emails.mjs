import fs from 'node:fs';
import {events,renderEmail} from '../supabase/functions/_shared/email-model.mjs';
const config={};let gallery='';
for(const [kind,event] of Object.entries(events)){
 const email=renderEmail(kind,event.auth||event.security?{}:{company:'Empresa Exemplo',plan:'Pro',billing:'Mensal',expires:'31/12/2026',maxProjects:50,maxItems:100},{authTemplate:!!(event.auth||event.security)});
 fs.writeFileSync(`supabase/email-templates/${kind}.html`,email.html);
 if(event.auth||event.security){config[`mailer_subjects_${kind}`]=email.subject;config[`mailer_templates_${kind}_content`]=email.html;}
 gallery+=`<article><h2>${event.subject}</h2><iframe title="${event.subject}" sandbox="" srcdoc="${email.html.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}"></iframe></article>`;
}
config.mailer_notifications_password_changed_enabled=true;config.mailer_notifications_email_changed_enabled=true;
fs.writeFileSync('supabase/email-templates/auth-config.json',JSON.stringify(config,null,2));
fs.writeFileSync('supabase/email-templates/preview.html',`<!doctype html><html lang="pt-PT"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Emails · SIGS Studio</title><style>body{margin:0;background:#f1f4f8;color:#18273e;font:14px system-ui}header{padding:28px max(20px,5vw);background:#15243b;color:white}header p{color:#b5c7e5}a{color:#729dff}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,520px),1fr));gap:24px;padding:24px max(16px,4vw)}article{overflow:hidden;border:1px solid #dce4ee;border-radius:16px;background:white}h2{font-size:15px;padding:8px 20px}iframe{display:block;width:100%;height:730px;border:0}</style></head><body><header><a href="app-Sigs.html">← Voltar ao SIGS</a><h1>Emails que acompanham cada etapa.</h1><p>Pré-visualização dos modelos. Dados de exemplo e links de autenticação sem validade.</p></header><main>${gallery}</main></body></html>`);
console.log(`Prepared ${Object.keys(events).length} email templates, Auth configuration and preview.`);
