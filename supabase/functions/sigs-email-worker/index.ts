import nodemailer from 'npm:nodemailer@10.0.14';
import {renderEmail} from '../_shared/email-model.mjs';

const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,apikey,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json'}});
const env=(name:string)=>Deno.env.get(name)||'';
async function api(path:string,body?:unknown,token?:string){
 const r=await fetch(env('SUPABASE_URL')+path,{method:body===undefined?'GET':'POST',headers:{apikey:env('SUPABASE_SERVICE_ROLE_KEY'),Authorization:'Bearer '+(token||env('SUPABASE_SERVICE_ROLE_KEY')),'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await r.json().catch(()=>null);if(!r.ok)throw Error('DATABASE_REQUEST_FAILED');return data;
}
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});if(req.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
 const token=(req.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'');if(!token)return json({error:'AUTH_REQUIRED'},401);
 const service=!!env('SUPABASE_SERVICE_ROLE_KEY')&&token===env('SUPABASE_SERVICE_ROLE_KEY');
 try{
  if(!service){let user;try{user=await api('/auth/v1/user',undefined,token);}catch{return json({error:'INVALID_SESSION'},401);}
   const profiles=await api('/rest/v1/profiles?select=role,active&id=eq.'+encodeURIComponent(user.id));if(!profiles?.[0]?.active||profiles[0].role!=='SUPER_ADMIN')return json({error:'SUPER_ADMIN_REQUIRED'},403);
  }
  let body;try{body=await req.json();}catch{return json({error:'INVALID_JSON'},400);}const action=String(body.action||'status');
  const configured=['SMTP_HOST','SMTP_USER','SMTP_PASSWORD','SMTP_FROM'].every(k=>!!env(k))&&env('SMTP_PORT')==='465';
  const enabled=configured&&env('SIGS_EMAIL_ENABLED')==='true';
  if(action==='status')return json({configured,enabled,transport:'SMTP',port:465});
  if(!['verify','dispatch'].includes(action))return json({error:'UNKNOWN_ACTION'},400);
  if(!configured)return json({error:'SMTP_NOT_CONFIGURED',configured:false},503);
  const transport=nodemailer.createTransport({host:env('SMTP_HOST'),port:465,secure:true,auth:{user:env('SMTP_USER'),pass:env('SMTP_PASSWORD')},connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000,disableFileAccess:true,disableUrlAccess:true});
  if(action==='verify'){try{await transport.verify();return json({verified:true});}catch{return json({error:'SMTP_VERIFICATION_FAILED'},502);}finally{transport.close();}}
  if(!enabled){transport.close();return json({error:'EMAIL_DELIVERY_DISABLED'},503);}
  const jobs=await api('/rest/v1/rpc/sigs_email_claim',{batch_size:5});let sent=0,failed=0,unknown=0;
  try{for(const job of jobs){
   let accepted=false;
   try{
    if(!/^[^\s,;<>@]+@[^\s,;<>@]+\.[^\s,;<>@]+$/.test(job.recipient))throw Error('INVALID_RECIPIENT');
    const message=renderEmail(job.event,job.payload,{appURL:env('SIGS_APP_URL')||undefined});
    const result=await transport.sendMail({from:{name:'SIGS Studio',address:env('SMTP_FROM')},to:job.recipient,...message,messageId:`<${job.id}@sigs-studio>`,...(env('SMTP_REPLY_TO')?{replyTo:env('SMTP_REPLY_TO')}:{})});
    accepted=(result.accepted||[]).length>0;if(!accepted)throw Error('SMTP_REJECTED');
    const completed=await api('/rest/v1/rpc/sigs_email_complete',{job_id:job.id,lease:job.lease_id,success:true});if(!completed)throw Error('DELIVERY_UNKNOWN');sent++;
   }catch(error){
    // SMTP acceptance followed by a DB outage is never reported as a definite failure.
    if(accepted){unknown++;continue;}
    const code=String((error as {code?:string}).code||'SMTP_FAILED').replace(/[^A-Z0-9_]/g,'').slice(0,40);
    try{await api('/rest/v1/rpc/sigs_email_complete',{job_id:job.id,lease:job.lease_id,success:false,error_code:code});failed++;}catch{unknown++;}
   }
  }}finally{transport.close();}
  return json({sent,failed,unknown});
 }catch{return json({error:'EMAIL_SERVICE_UNAVAILABLE'},503);}
});
