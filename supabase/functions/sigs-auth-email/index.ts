import nodemailer from 'npm:nodemailer@10.0.14';
import {Webhook} from 'npm:standardwebhooks@1.0.0';
import {createAuthEmailHandler} from '../_shared/auth-email-handler.mjs';

const env=(name:string)=>Deno.env.get(name)||'';
// Auth hooks use a Standard Webhooks signature instead of a user JWT.
// Never log this request: its payload contains verification tokens.
Deno.serve(createAuthEmailHandler({
 configured:()=>['SEND_EMAIL_HOOK_SECRET','SMTP_HOST','SMTP_USER','SMTP_PASSWORD','SMTP_FROM'].every(k=>!!env(k))&&env('SMTP_PORT')==='465',
 verify:(body:string,headers:Record<string,string>)=>new Webhook(env('SEND_EMAIL_HOOK_SECRET').replace(/^v1,whsec_/,'').replace(/^whsec_/,'')).verify(body,headers),
 from:()=>env('SMTP_FROM'),
 createTransport:()=>nodemailer.createTransport({host:env('SMTP_HOST'),port:465,secure:true,auth:{user:env('SMTP_USER'),pass:env('SMTP_PASSWORD')},connectionTimeout:4000,greetingTimeout:4000,socketTimeout:4500,disableFileAccess:true,disableUrlAccess:true})
}));
