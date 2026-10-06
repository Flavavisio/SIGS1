import assert from 'node:assert/strict';
import {authMessages} from '../supabase/functions/_shared/auth-email-model.mjs';
import {createAuthEmailHandler} from '../supabase/functions/_shared/auth-email-handler.mjs';
const hash='a'.repeat(64),newHash='b'.repeat(64);
const fixture=action=>({user:{email:'current@example.com',new_email:'new@example.com'},email_data:{email_action_type:action,token:'123456',token_hash:hash,redirect_to:'https://flavavisio.github.io/SIGS1/app-Sigs.html?registration=confirmed'}});
for(const action of ['signup','email','invite','recovery','magiclink','reauthentication','password_changed_notification','email_changed_notification']){
 const m=authMessages(fixture(action))[0];assert.equal(m.to,'current@example.com');assert.ok(!m.html.includes('{{'));assert.ok(m.html.includes('SIGS Studio'));
 if(['invite','recovery'].includes(action))assert.ok(m.text.includes(encodeURIComponent('/SIGS1/acesso.html')));
 if(action==='signup')assert.ok(m.html.includes('Ativar conta'));
 if(action==='reauthentication')assert.ok(m.html.includes('123456'));
}
const secure=fixture('email_change');secure.email_data.token_hash_new=newHash;secure.email_data.token_new='654321';
const pair=authMessages(secure);assert.equal(pair.length,2);assert.equal(pair[0].to,'current@example.com');assert.ok(pair[0].text.includes(newHash));assert.equal(pair[1].to,'new@example.com');assert.ok(pair[1].text.includes(hash));
assert.equal(authMessages(fixture('email_change'))[0].to,'new@example.com');
const bad=fixture('signup');bad.email_data.redirect_to='https://evil.test/acesso.html';assert.throws(()=>authMessages(bad));
bad.email_data.redirect_to='https://flavavisio.github.io/other/app-Sigs.html';assert.throws(()=>authMessages(bad));
bad.email_data.redirect_to='https://flavavisio.github.io/SIGS1/app-Sigs.html';bad.user.email='a@example.com\r\nBcc: b@example.com';assert.throws(()=>authMessages(bad));
const sent=[];let closed=0,accept=true;
const deps={configured:()=>true,verify:raw=>JSON.parse(raw),from:()=> 'Geral.sigs.studio@gmail.com',createTransport:()=>({sendMail:async m=>{sent.push(m);return {accepted:accept?[m.to]:[]};},close:()=>closed++})};
const req=payload=>new Request('https://hook.test',{method:'POST',body:JSON.stringify(payload)});
assert.equal((await createAuthEmailHandler({...deps,configured:()=>false})(req(fixture('signup')))).status,503);
assert.equal((await createAuthEmailHandler({...deps,verify:()=>{throw Error('bad signature');}})(req(fixture('signup')))).status,401);assert.equal(sent.length,0);
assert.equal((await createAuthEmailHandler(deps)(req({}))).status,400);assert.equal(sent.length,0);
assert.equal((await createAuthEmailHandler(deps)(req(fixture('signup')))).status,200);assert.equal(sent.length,1);assert.equal(closed,1);
accept=false;assert.equal((await createAuthEmailHandler(deps)(req(fixture('signup')))).status,500);assert.equal(closed,2);
assert.equal((await createAuthEmailHandler(deps)(new Request('https://hook.test'))).status,405);
console.log('PASS: Auth actions, correct secure email-change token mapping, redirect/recipient guards, signature rejection before SMTP, failures and cleanup.');
