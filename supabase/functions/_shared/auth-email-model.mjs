import {renderEmail,esc,appURL} from './email-model.mjs';

const kinds={signup:'confirmation',email:'confirmation',invite:'invite',magiclink:'magic_link',recovery:'recovery',email_change:'email_change',reauthentication:'reauthentication',password_changed_notification:'password_changed_notification',email_changed_notification:'email_changed_notification'};
const origins=['https://sigs-studio.flowy-mouse-8040.chatgpt.site','https://flavavisio.github.io','https://www.sigs-studio.pt','https://sigs-studio.pt'];
const paths=['/app-Sigs.html','/acesso.html','/SIGS1/app-Sigs.html','/SIGS1/acesso.html','/Sigs/app-Sigs.html','/Sigs/acesso.html'];
function address(value){if(typeof value!=='string'||value.length>254||!/^\S+@[^\s,;<>@]+\.[^\s,;<>@]+$/.test(value)||/[\r\n,;<>]/.test(value))throw Error('INVALID_RECIPIENT');return value;}
function redirect(value,kind){
 let u;try{u=new URL(value||appURL);}catch{throw Error('INVALID_REDIRECT');}
 if(u.username||u.password||!origins.includes(u.origin)||!paths.includes(u.pathname))throw Error('INVALID_REDIRECT');
 // Recovery/invitation always land on the password screen. Confirmation lands on the app.
 const password=['recovery','invite'].includes(kind);
 const canonical=new URL(password?'acesso.html':'app-Sigs.html',appURL);canonical.search=u.search;return canonical.href;
}
function build(kind,to,token,hash,action,returnURL){
 let url=returnURL;
 if(!['reauthentication','password_changed_notification','email_changed_notification'].includes(kind)){
  if(typeof hash!=='string'||!/^[a-zA-Z0-9_-]{16,256}$/.test(hash))throw Error('INVALID_TOKEN_HASH');
  const verify=new URL('https://kbihedvyykjlbnipdgfm.supabase.co/auth/v1/verify');
  verify.searchParams.set('token',hash);verify.searchParams.set('type',action);verify.searchParams.set('redirect_to',returnURL);url=verify.href;
 }
 if(kind==='reauthentication'&&!/^\d{6,10}$/.test(token||''))throw Error('INVALID_OTP');
 const message=renderEmail(kind,{}, {authTemplate:true});
 const values={ConfirmationURL:url,SiteURL:returnURL,Email:address(to),Token:String(token||'')};
 const fill=(source,html)=>source.replace(/{{\s*\.(ConfirmationURL|SiteURL|Email|Token)\s*}}/g,(_,key)=>html?esc(values[key]):values[key]);
 return {to:address(to),subject:message.subject,html:fill(message.html,true),text:fill(message.text,false)};
}
export function authMessages(payload){
 const user=payload?.user,data=payload?.email_data;if(!user||!data)throw Error('INVALID_PAYLOAD');
 const action=data.email_action_type,kind=kinds[action];if(!kind)throw Error('UNSUPPORTED_EMAIL_ACTION');
 const returnURL=redirect(data.redirect_to||data.site_url,kind);
 if(action==='email_change'){
  const messages=[];
  // Supabase's legacy names are reversed: token_hash_new belongs to the CURRENT address.
  if(data.token_hash_new)messages.push(build(kind,user.email,data.token,data.token_hash_new,action,returnURL));
  messages.push(build(kind,user.new_email,data.token_new||data.token,data.token_hash,action,returnURL));return messages;
 }
 return [build(kind,user.email,data.token,data.token_hash,action,returnURL)];
}
