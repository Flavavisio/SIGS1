/* Public page views: no cookies, storage, fingerprint, referrer or account data. */
(function(){'use strict';
 var page=location.pathname.replace(/^\/SIGS1(?=\/)/,'');if(page==='/index.html')page='/';
 if(['/', '/registo.html','/acesso.html','/privacidade.html'].indexOf(page)<0)return;
 if(navigator.globalPrivacyControl||navigator.doNotTrack==='1')return;
 var sent=false;
 function record(){
  if(sent||document.visibilityState==='hidden')return;sent=true;
  fetch('https://kbihedvyykjlbnipdgfm.supabase.co/functions/v1/sigs-activity',{
   method:'POST',credentials:'omit',referrerPolicy:'no-referrer',keepalive:true,
   headers:{apikey:'sb_publishable_7iaBGJr6qS-YO1HOySsKUQ_vCxOU52o','Content-Type':'application/json'},
   body:JSON.stringify({action:'visit',page:page})
  }).catch(function(){});
 }
 document.addEventListener('visibilitychange',record);record();
})();
