const assert=require('node:assert/strict'),fs=require('fs'),{JSDOM}=require('jsdom');
const dom=new JSDOM('<body class="sigs-premium"><aside class="studio-rail"><nav class="sigs-v5-nav"></nav><div class="studio-rail-foot"></div></aside><section id="lp"><details id="scene-v29">Pessoa</details><details id="geometry-v28">Paredes</details><div id="lib-search-wrap"><input id="lib-search"></div><div id="dlist"></div></section><section id="rp"><div class="tabs">Equipamento Sistema Projeto Camadas</div><div class="tc on">Propriedades da câmara</div></section></body>',{url:'https://example.test',runScripts:'outside-only'}),w=dom.window,d=w.document;
const css=d.createElement('style');css.textContent=fs.readFileSync('assets/css/sidebar-v13.css','utf8');d.head.appendChild(css);
Object.defineProperty(d,'readyState',{value:'complete'});w.setTimeout=f=>f();w.requestAnimationFrame=f=>f();let resizes=0;w.resize=()=>resizes++;w.innerWidth=1600;w.S={lib:[]};w.MOD='cctv';w.sLib=()=>{};
w.eval(fs.readFileSync('assets/js/sidebar-v13.js','utf8'));
const rail=d.querySelector('.studio-rail'),tabs=[...d.querySelectorAll('.s13-tabs button')],scene=d.getElementById('s13-scene-panel'),rp=d.getElementById('rp'),toggle=d.getElementById('s13-inspector-collapse');
assert.equal(tabs.length,3);assert.equal(scene.children.length,2);assert(!d.getElementById('lp').contains(d.getElementById('scene-v29')));
const width=w.getComputedStyle(rail).width;
for(const name of ['menu','library','scene']){tabs.find(b=>b.dataset.sidebarView===name).click();assert.equal(w.getComputedStyle(rail).width,width,'All open views keep the current width');}
assert.equal(w.getComputedStyle(scene).display,'block');assert.equal(w.getComputedStyle(d.getElementById('lp')).display,'none');
tabs[2].dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));assert.equal(rail.dataset.view,'menu');
tabs[0].dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true}));assert.equal(rail.dataset.view,'scene');
d.getElementById('s13-collapse').click();assert.equal(w.getComputedStyle(scene).display,'none');w.SIGSSidebar.showScene();assert.equal(rail.dataset.collapsed,'false');assert.equal(rail.dataset.view,'scene');
assert.equal(toggle.getAttribute('aria-expanded'),'true');toggle.click();assert.equal(toggle.getAttribute('aria-expanded'),'false');assert.equal(w.getComputedStyle(rp).width,'44px');assert.equal(w.getComputedStyle(rp.querySelector('.tc')).display,'none');assert.equal(w.localStorage.getItem('sigs-inspector-collapsed-v71'),'true');toggle.click();assert.equal(toggle.getAttribute('aria-expanded'),'true');assert.notEqual(w.getComputedStyle(rp.querySelector('.tc')).display,'none');assert(resizes>0);
w.innerWidth=800;w.sigsStudioPanel=()=>{w.document.body.classList.add('studio-panel-library');tabs[1].click();};w.SIGSSidebar.showScene();assert.equal(rail.dataset.view,'scene','Opening mobile overlay keeps the Scenario view');
dom.window.close();console.log('PASS: three tabs, moved controls, constant width, keyboard cycle, scenario reopening/mobile and reversible persisted inspector collapse');
