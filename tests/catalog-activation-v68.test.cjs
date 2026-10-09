const {JSDOM}=require('jsdom'),fs=require('node:fs'),assert=require('node:assert/strict');
const read=p=>fs.readFileSync(require('node:path').join(__dirname,'..',p),'utf8');
(async()=>{
const dom=new JSDOM('<button id="w12-portal-launch"></button><div class="dc-brand-tile" data-brand="dahua"></div>',{url:'https://www.sigs-studio.pt/app-Sigs.html',runScripts:'outside-only'}),w=dom.window;
w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.setInterval=()=>1;
w.CLOUD={user:{id:'admin',role:'ADMIN'},access:'token'};w.SIGS_LICENSE={ctx:{company:{id:'company-a'}}};let unlocked=false,calls=[],resolveStale;
w._sigsSbCfg=()=>({url:'https://api.test'});w._sigsSbHeaders=()=>({Authorization:'Bearer token'});
w._sigsSbJson=async(url,opts)=>{calls.push({url,body:JSON.parse(opts.body)});if(url.endsWith('sigs_catalog_access'))return unlocked;if(JSON.parse(opts.body).p_code!=='D@HUA')throw Error('Código de ativação inválido.');unlocked=true;return true;};
w.fetch=async()=>({ok:true,json:async()=>({})});w.eval(read('assets/js/catalog-activation-v68.js'));w.eval(read('assets/js/activity-v42.js'));
await w.sigsCatalogRefreshAccess();assert.equal(w.sigsVisibleCatalog([{brand:'dahua'},{brand:'hikvision'}]).length,1);assert(w.document.querySelector('[data-brand="dahua"]').hidden);
w.SIGSActivity.password();assert(w.document.getElementById('catalog-activation-code'));assert(w.document.getElementById('catalog-activation-submit'));assert.equal(w.document.querySelector('.s42-account-row').children.length,2);
const input=w.document.getElementById('catalog-activation-code'),status=w.document.getElementById('catalog-activation-status');input.value='wrong';await w.sigsSubmitCatalogActivation();assert(status.textContent.includes('inválido'));assert(!w.sigsCatalogDeviceAllowed({brand:'dahua'}));input.value='D@HUA';await w.sigsSubmitCatalogActivation();assert(w.sigsCatalogDeviceAllowed({brand:'Dahua'}));assert(w.sigsCatalogDeviceAllowed({brand:{slug:'dahua'}}));assert.equal(input.value,'');assert(status.textContent.includes('ativados'));assert(calls.some(x=>x.body.p_company_id==='company-a'));
// Access immediately disappears on identity change, even before the next request.
w.SIGS_LICENSE.ctx.company.id='company-b';assert(!w.sigsCatalogDeviceAllowed({brand:'dahua'}));
w._sigsSbJson=()=>new Promise(r=>resolveStale=r);const pending=w.sigsCatalogRefreshAccess();w.CLOUD.user=null;w.CLOUD.access=null;await w.sigsCatalogRefreshAccess();resolveStale(true);await pending;assert(!w.sigsCatalogDeviceAllowed({brand:'dahua'}));
w.document.querySelector("[data-close]").click();dom.window.close();console.log('PASS: account field, validation, activation, company isolation, logout and stale requests');
})().catch(e=>{console.error(e);process.exit(1);});
