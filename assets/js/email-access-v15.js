(function(){'use strict';
const base='https://kbihedvyykjlbnipdgfm.supabase.co',key='sb_publishable_7iaBGJr6qS-YO1HOySsKUQ_vCxOU52o';
const $=id=>document.getElementById(id);let token=null,mode='recover';
const hash=new URLSearchParams(location.hash.slice(1));const kind=hash.get('type');const error=hash.get('error');
if(location.hash)history.replaceState(null,'',location.pathname+location.search);
function status(text,isError=false){$('access-status').textContent=text;$('access-status').dataset.error=String(isError);}
async function request(path,body,method='POST',access){const headers={'apikey':key,'Content-Type':'application/json'};if(access)headers.Authorization='Bearer '+access;const r=await fetch(base+'/auth/v1/'+path,{method,headers,...(body===undefined?{}:{body:JSON.stringify(body)})});const b=await r.json().catch(()=>({}));if(!r.ok){const e=new Error('Auth request failed');e.status=r.status;throw e;}return b;}
async function init(){
 if(error){status('Este link expirou ou já foi utilizado. Pede um novo link de recuperação.',true);return;}
 if((kind==='recovery'||kind==='invite')&&hash.get('access_token')){
  $('access-submit').disabled=true;status('A validar o teu link…');
  try{const candidate=hash.get('access_token');await request('user',undefined,'GET',candidate);token=candidate;mode='password';$('email-field').hidden=true;$('access-email').required=false;$('password-fields').hidden=false;$('access-password').required=true;$('access-repeat').required=true;$('access-title').textContent=kind==='invite'?'Define a tua palavra-passe':'Escolhe uma nova palavra-passe';$('access-copy').textContent=kind==='invite'?'O teu email foi confirmado. Define a palavra-passe inicial para começares a usar o SIGS Studio.':'Cria uma palavra-passe para entrares na tua conta SIGS.';$('access-submit').textContent='Guardar palavra-passe';status('');$('access-password').focus();}catch(e){status('Este link expirou ou não é válido. Pede um novo link de recuperação.',true);}finally{$('access-submit').disabled=false;}
 }
}
$('access-form').addEventListener('submit',async e=>{e.preventDefault();const button=$('access-submit');button.disabled=true;status('A processar…');
 try{if(mode==='password'){
  const password=$('access-password').value;if(password.length<8||password!==$('access-repeat').value){status('As palavras-passe devem coincidir e ter pelo menos 8 caracteres.',true);return;}
  await request('user',{password},'PUT',token);let revoked=true;try{await request('logout?scope=global',undefined,'POST',token);}catch(e){revoked=false;}token=null;$('access-password').value='';$('access-repeat').value='';$('access-form').hidden=true;$('access-title').textContent=kind==='invite'?'Conta ativada':'Palavra-passe guardada';$('access-copy').textContent=revoked?'Já podes voltar ao login e entrar com a tua nova palavra-passe.':'A palavra-passe foi guardada. Volta ao login. Não foi possível terminar as restantes sessões; contacta o administrador se não reconheces algum acesso.';
 }else{
  const email=$('access-email').value.trim();const redirect=new URL('acesso.html',location.href);redirect.search='';redirect.hash='';await request('recover?redirect_to='+encodeURIComponent(redirect.href),{email});status('Se este email tiver uma conta no SIGS, receberás um link de recuperação. Verifica também o spam.');
 }}catch(e){status(e.status===429?'Aguarda alguns minutos antes de pedir outro link.':mode==='password'?'Não foi possível guardar. O link pode ter expirado ou a palavra-passe não cumprir os requisitos. Pede um novo link e tenta novamente.':'Não foi possível pedir o email. Tenta novamente dentro de alguns minutos.',true);}finally{button.disabled=false;}
});init();
})();
