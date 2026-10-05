// Apply the prepared Auth templates and optional SMTP settings through the official Management API.
// Credentials are read only from the environment and are never printed or persisted.
import fs from 'node:fs';
const ref='kbihedvyykjlbnipdgfm',token=process.env.SUPABASE_ACCESS_TOKEN;
if(!token){console.error('SUPABASE_ACCESS_TOKEN is required in the environment.');process.exit(1);}
async function api(path,body){const r=await fetch('https://api.supabase.com/v1/projects/'+ref+path,{method:body?'PATCH':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});if(!r.ok)throw Error('Management API request failed ('+r.status+').');return r.json();}
try{
 const current=await api('/config/auth');const payload=JSON.parse(fs.readFileSync('supabase/email-templates/auth-config.json','utf8'));
 const redirects=['https://sigs-studio.flowy-mouse-8040.chatgpt.site/acesso.html','https://sigs-studio.flowy-mouse-8040.chatgpt.site/app-Sigs.html','https://flavavisio.github.io/Sigs/acesso.html','https://flavavisio.github.io/Sigs/app-Sigs.html','https://flavavisio.github.io/SIGS1/acesso.html','https://flavavisio.github.io/SIGS1/app-Sigs.html'];
 payload.uri_allow_list=[...new Set([...String(current.uri_allow_list||'').split(',').filter(Boolean),...redirects])].join(',');
 // Preserve the existing Site URL, unless it still points to a development localhost.
 if(!current.site_url||/^https?:\/\/localhost/.test(current.site_url))payload.site_url='https://sigs-studio.flowy-mouse-8040.chatgpt.site/app-Sigs.html';
 const fields={SMTP_HOST:'smtp_host',SMTP_USER:'smtp_user',SMTP_PASSWORD:'smtp_pass',SMTP_FROM:'smtp_admin_email',SMTP_PORT:'smtp_port'};
 const provided=Object.keys(fields).filter(k=>process.env[k]);if(provided.length&&provided.length!==Object.keys(fields).length)throw Error('Provide all five SMTP variables or none.');
 if(provided.length){for(const [env,key]of Object.entries(fields))payload[key]=env==='SMTP_PORT'?Number(process.env[env]):process.env[env];payload.smtp_sender_name='SIGS Studio';}
 await api('/config/auth',payload);const verified=await api('/config/auth');
 for(const [key,value]of Object.entries(payload))if(key.startsWith('mailer_')&&verified[key]!==value)throw Error('Template verification failed.');
 console.log('Auth email templates, security notifications and redirect allow list applied and verified.');
}catch(e){console.error(e.message);process.exit(1);}
