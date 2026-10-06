import {authMessages} from './auth-email-model.mjs';

const json=(body,status)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
export function createAuthEmailHandler({verify,configured,createTransport,from}){
 return async function(req){
  if(req.method!=='POST')return json({error:'METHOD_NOT_ALLOWED'},405);
  if(!configured())return json({error:'EMAIL_HOOK_NOT_CONFIGURED'},503);
  let raw;try{raw=await req.text();}catch{return json({error:'INVALID_PAYLOAD'},400);}
  if(raw.length>131072)return json({error:'PAYLOAD_TOO_LARGE'},413);
  let payload;try{payload=await verify(raw,Object.fromEntries(req.headers));}catch{return json({error:'INVALID_SIGNATURE'},401);}
  let messages;try{messages=authMessages(payload);}catch{return json({error:'INVALID_EMAIL_PAYLOAD'},400);}
  let transport,timer;
  try{
   transport=createTransport();
   const delivery=async()=>{for(const message of messages){
     const result=await transport.sendMail({from:{name:'SIGS Studio',address:from()},...message});
     if(!result.accepted?.length)throw Error('SMTP_REJECTED');
   }};
   await Promise.race([delivery(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('SMTP_TIMEOUT')),4500);})]);
   return json({},200);
  }catch{return json({error:'EMAIL_DELIVERY_FAILED'},500);}
  finally{clearTimeout(timer);if(transport)transport.close();}
 };
}
