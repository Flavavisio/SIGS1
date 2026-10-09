const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
(async()=>{
 const d=new JSDOM('<div id="license-body"></div>',{url:'https://www.sigs-studio.pt/app-Sigs.html',runScripts:'outside-only'}),w=d.window,calls=[];
 w.CLOUD={user:{id:'super',role:'SUPER_ADMIN'},access:'test-token'};w._esc=s=>String(s);w.notify=()=>{};w.confirm=()=>true;w.startModule=()=>{};
 w.fetch=async(url,opts)=>{calls.push({url,body:opts.body?JSON.parse(opts.body):{}});return {ok:true,status:200,text:async()=>url.includes('/functions/')?JSON.stringify({license:{expires_at:'2026-10-23T12:00:00Z'}}):'[]'};};
 w.eval(fs.readFileSync('assets/js/block-04.js','utf8'));w.renderLicenseCenter();await new Promise(r=>setTimeout(r,20));
 const q=id=>w.document.getElementById(id);assert(q('lic-plan').querySelector('option[value=DEMO]'));q('lic-plan').value='DEMO';w.licUpdateEndPreview();assert(!q('lic-demo-options').hidden);assert(q('lic-billing').disabled);q('lic-demo-days').value=14;w.licUpdateEndPreview();
 q('lic-company').value='Demo Fixture';q('lic-admin-name').value='Fixture';q('lic-admin-email').value='test@example.invalid';w.licCreateLicense();await new Promise(r=>setTimeout(r,20));const issued=calls.find(x=>x.body.action==='provision_customer');assert.equal(issued.body.plan_code,'DEMO');assert.equal(issued.body.demo_days,14);
 w.licOpenChangeLicense('fixture','DEMO','MONTH');assert.equal(q('lic-change-plan').value,'DEMO');assert(!q('lic-change-demo-options').hidden);assert(q('lic-change-billing').disabled);q('lic-change-demo-days').value=7;w.licSubmitChangeLicense('fixture');await new Promise(r=>setTimeout(r,20));const changed=calls.find(x=>x.body.action==='change_license');assert.equal(changed.body.plan_code,'DEMO');assert.equal(changed.body.demo_days,7);
 w.CLOUD.user.role='ADMIN';w.renderLicenseCenter();await new Promise(r=>setTimeout(r,20));assert.equal(q('lic-plan'),null);assert.equal(q('lic-demo-options'),null);d.window.close();
 console.log('PASS: Super Admin demo issue/change forms send chosen duration; Admin has no demo issuance form.');
})().catch(e=>{console.error(e);process.exitCode=1;});
