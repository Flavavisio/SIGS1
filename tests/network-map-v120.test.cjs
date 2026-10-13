const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const M=require('../assets/js/network-map-model-v120.js');
const fixtureNet={nodes:[{id:'s',kind:'switch'},{id:'t',kind:'switch'},{id:'r',kind:'nvr'}],links:[{id:'e',a:'s',b:'t',portA:'1',portB:'1'},{id:'f',a:'t',b:'r',portA:'2',portB:'1'}],assignments:{c:{switchId:'s',nvrId:'r',port:'2',link:{medium:'copper'}}}};
assert.deepEqual(M.trace(fixtureNet,'c'),{cameraId:'c',nodes:['s','t','r'],links:['e','f']});
assert.equal(M.portError(fixtureNet,fixtureNet.nodes[0],{rj45Ports:8},'copper','shared','1'),'Esta porta já está ocupada.');
assert.equal(M.portError(fixtureNet,fixtureNet.nodes[0],{rj45Ports:8},'copper','shared','9'),'A porta excede a capacidade deste grupo.');
assert.deepEqual(M.freePorts(fixtureNet,fixtureNet.nodes[0],{rj45Ports:4},'copper','shared').ports,[3,4]);
assert.equal(M.portError(fixtureNet,fixtureNet.nodes[0],{sfpPorts:2},'fiber','shared','1'),null,'SFP numbering is independent of RJ45');
assert(M.freePorts(fixtureNet,fixtureNet.nodes[0],{},'copper','shared').unconfirmed);
fixtureNet.assignments.c.port='';assert(M.freePorts(fixtureNet,fixtureNet.nodes[0],{rj45Ports:8},'copper','shared').unconfirmed,'Unnamed old ports must not be auto-assigned');
fixtureNet.links.push({id:'loop',a:'r',b:'s'});assert(M.path(fixtureNet,'s','r'),'Cycles never hang the trace');

let setup=fs.readFileSync('tests/ptz-render-integration-v111.test.cjs','utf8').split('const models=')[0];
setup=setup.replace(",'assets/js/camera-fov-v108.js','assets/js/ptz-coverage-v109.js'",'');
const env={require,console};vm.createContext(env);vm.runInContext(setup+'globalThis.fixture={w,dom};',env);const {w,dom}=env.fixture;
const pending=[],noop=()=>{};Object.defineProperty(w.document,'readyState',{value:'complete'});w.setTimeout=fn=>{pending.push(fn);return pending.length;};w.setInterval=noop;w.document.defaultView.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
w.cv.getBoundingClientRect=()=>({left:70,top:40,width:1600,height:1400});w.cv.setPointerCapture=noop;w.cv.releasePointerCapture=noop;
w.sigsV6MarkDirty=()=>w.dirty=true;w.notify=m=>w.notice=m;w.updateStats=noop;w.sigsCatalogDeviceAllowed=()=>true;w.sigsVisibleCatalog=x=>x||[];
w.SIGS_V6={currentStatus:'DRAFT'};w.SIGS_LICENSE={ctx:{license:{planCode:'SUPREME',status:'ACTIVE',expiresAt:'2099-01-01',modules:{cctv:true}}}};
w.CLOUD.user={id:'test'};w.SIGSGeometryTools={cancel:noop};w.SIGSSceneTools={cancel:noop};w.SIGSEngineering={cancel:noop,open:noop,snapshot:()=>({notes:[],assumptions:[],system:[],zones:[],advanced:{system:{checks:[]},notes:[]}})};
w.POE_SWITCH_DB=[{reference:'SW8',ports:8,poePorts:8,budget:120,maxPortW:30,accessMbps:1000,uplinkMbps:1000,poeStandard:'802.3at',switchingMbps:16000}];
w.NVR_DB=[{reference:'NVR8',ch:8,maxMP:8,bw:80,lanPorts:1,lanMbps:1000,hdd:2,maxDiskTB:10}];
w.sigsSystemRecommendation=()=>({nvr:w.NVR_DB[0],switch:w.POE_SWITCH_DB[0],powerMode:'external',warnings:[]});
for(const f of ['commercial-model-v8','commercial-v8','recommendation-model-v24','network-model-v60','network-v60','network-map-model-v120','network-map-v120','camera-fov-v108','ptz-coverage-v109'])w.eval(fs.readFileSync('assets/js/'+f+'.js','utf8'));
for(const [type,name] of [['mousedown','onDown'],['mouseup','onUp'],['mousemove','onMove'],['click','onClick']])w.cw.addEventListener(type,e=>w[name](e));
const camera=w.CCTV_LIB.find(d=>d.type==='bullet'),p={id:'cam',libId:camera.id,label:'CAM01',x:0,y:0,lens:2.8,instHeight:3,instTilt:5,rotation:0,netMbps:8,poeW:8};
Object.assign(w.S,{placed:[p],lib:[camera],selId:null,multiSel:[],activeLib:camera,tool:'place',repeatPlacement:true,scale:{ok:true,ppm:10,mpp:.1},zoom:1,pan:{x:0,y:0},layers:{dev:1,cov:0,fp:0,grid:0,meas:0},undoStack:[],redoStack:[],mapOpen:false});
w.FLOORS=[{id:'floor',name:'Piso 1',placed:w.S.placed,scale:w.S.scale}];w.FLOOR_CUR=0;w.MOD='cctv';pending.forEach(fn=>fn());
function send(type,at,pointer='mouse',target=w.cv){const e=new w.MouseEvent(type,{bubbles:true,cancelable:true,button:0,clientX:at.x+70,clientY:at.y+40});if(type.startsWith('pointer'))Object.defineProperties(e,{pointerId:{value:1},isPrimary:{value:true},pointerType:{value:pointer}});target.dispatchEvent(e);return e;}
function tap(x,y,pointer='mouse'){const at=w.w2s(x,y);send('pointerdown',at,pointer);send('mousedown',at,pointer);send('pointerup',at,pointer);send('mouseup',at,pointer);send('click',at,pointer);}
function selectModel(ref){const select=w.document.querySelector('#net120-inspector [data-model]');assert(select);select.value=ref;select.onchange();}
function submit(){const form=w.document.querySelector('#net120-connection form');assert(form);form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
const NM=w.SIGSNetworkMap,N=w.SIGSNetwork;
NM.open();assert(w.document.getElementById('net120-toolbar'));NM.startPlace('switch');tap(200,0);selectModel('SW8');const sw1=w.SIGS_COMMERCIAL.network.nodes[0];
NM.startPlace('switch');tap(400,0,'touch');selectModel('SW8');const sw2=w.SIGS_COMMERCIAL.network.nodes[1];
NM.startPlace('nvr');tap(600,0,'pen');selectModel('NVR8');const nvr=w.SIGS_COMMERCIAL.network.nodes[2];assert.equal(w.S.placed.length,1);assert(w.SIGS_COMMERCIAL.network.enabled);
// Connect first, then infer a single reachable destination as the uplinks are added.
NM.startConnect();tap(0,0);tap(200,0);submit();assert.equal(w.SIGS_COMMERCIAL.network.assignments.cam.switchId,sw1.id);assert.equal(w.SIGS_COMMERCIAL.network.assignments.cam.nvrId,'');
NM.startConnect();tap(200,0);tap(400,0);submit();NM.startConnect();tap(400,0);tap(600,0);submit();
assert.equal(w.SIGS_COMMERCIAL.network.links.length,2);assert.equal(w.SIGS_COMMERCIAL.network.assignments.cam.nvrId,nvr.id);assert.equal(NM.trace('cam').nodes.length,3);
assert.equal(w.SIGS_COMMERCIAL.network.assignments.cam.port,'1');assert.equal(w.SIGS_COMMERCIAL.network.links[0].portA,'2','Uplink must use a different RJ45 port from the camera');
// Repeat connection edits a single edge; reserved ports and topology loops are rejected.
NM.startConnect();tap(400,0);tap(200,0);submit();assert.equal(w.SIGS_COMMERCIAL.network.links.length,2);assert.equal(w.SIGS_COMMERCIAL.network.links[0].a,sw1.id,'Editing from the other end must preserve the saved route orientation');
NM.startConnect();tap(200,0);tap(600,0);assert(!w.document.getElementById('net120-connection'));assert(w.notice.includes('ciclo'));
NM.startConnect();tap(0,0);tap(200,0);const f=w.document.querySelector('#net120-connection form');f.elements.namedItem('portB').value='2';submit();assert(w.document.querySelector('[data-error]').textContent.includes('ocupada'));assert.equal(w.SIGS_COMMERCIAL.network.assignments.cam.port,'1');w.document.querySelector('#net120-connection [data-cancel]').click();
// A camera selection highlights all of its route in the actual native canvas.
NM.startPlace('switch');tap(0,0);assert.equal(w.SIGS_COMMERCIAL.network.nodes.length,3,'Existing devices win over placement');assert.equal(NM.state().selected.kind,'camera');assert(w.document.getElementById('net120-inspector').textContent.includes('CAM01 → SW-1 → SW-2 → NVR-1'));
const yellow=w.ctx.getImageData(...Object.values(w.w2s(100,0)),1,1).data;assert(yellow[0]>200&&yellow[1]>150&&yellow[2]<100,'Full path is highlighted in the native renderer');
// Port/PoE/traffic and cable materials still come from the existing engineering model.
assert(N.snapshot().cameras[0].length.total>20);const quote=w.sigsV8Quote();assert.equal(quote.lines.filter(x=>x.type==='switch').length,1);assert.equal(quote.lines.find(x=>x.type==='switch').qty,2);assert(quote.lines.find(x=>x.type==='cabo').qty>60);
const saved=JSON.parse(JSON.stringify(w._buildProjectData()));assert.equal(saved.commercial.network.nodes.length,3);assert.equal(saved.commercial.network.links.length,2);
// Real route tracing follows the first camera and reanchors after switches move.
w.document.querySelector('#net120-inspector [data-route-camera]').click();tap(100,-100);N.finish();assert.equal(w.SIGS_COMMERCIAL.network.assignments.cam.link.routes[0].points.length,3);N.close();NM.open();
let movedCases=0;
for(const pointer of ['mouse','touch','pen'])for(const zoom of [.1,1,4]){
 w.S.zoom=zoom;w.render();const current=w.SIGS_COMMERCIAL.network.nodes.find(n=>n.id===sw1.id),before={x:current.x,y:current.y},at=w.w2s(before.x,before.y),end={x:at.x+60,y:at.y+30},undos=w.S.undoStack.length;
 send('pointerdown',at,pointer);send('pointermove',end,pointer);send('pointerup',end,pointer);assert.equal(current.x,before.x+60/zoom);assert.equal(current.y,before.y+30/zoom);assert.equal(w.S.undoStack.length,undos+1);assert.equal(JSON.parse(w.S.undoStack.at(-1)).network.nodes.find(n=>n.id===sw1.id).x,before.x);
 w.S.tool='place';send('click',{x:end.x+400,y:end.y+200},pointer,w.cw);assert.equal(w.S.placed.length,1);assert.equal(w.SIGS_COMMERCIAL.network.nodes.length,3,'Release never clones a camera or switch');movedCases++;
}
const length=N.snapshot().cameras[0].length.total;assert(Number.isFinite(length));w.S.zoom=1;
const current=w.SIGS_COMMERCIAL.network.nodes.find(n=>n.id===sw1.id),at=w.w2s(current.x,current.y),before={x:current.x,y:current.y};send('pointerdown',at,'touch');send('pointermove',{x:at.x+70,y:at.y},'touch');send('pointercancel',at,'touch');assert.equal(current.x,before.x);assert.equal(current.y,before.y);
NM.close();w.S.tool='place';send('pointerdown',w.w2s(-600,-300),'mouse',w.cw);send('mousedown',at);send('mousemove',{x:at.x+30,y:at.y});send('mouseup',{x:at.x+30,y:at.y});send('click',{x:at.x+500,y:at.y+200});assert.equal(current.x,before.x+30);assert.equal(w.S.placed.length,1,'Mouse fallback cannot place a release duplicate');
// Undo/redo and reopening the saved project preserve both topology and manual bends.
const previousX=current.x;w.doUndo();assert.equal(w.SIGS_COMMERCIAL.network.nodes.find(n=>n.id===sw1.id).x,previousX-30);w.doRedo();assert.equal(w.SIGS_COMMERCIAL.network.nodes.find(n=>n.id===sw1.id).x,previousX);
const roundtrip=JSON.parse(JSON.stringify(w._buildProjectData()));w.SIGS_COMMERCIAL.network.nodes[0].name='Changed';w._restoreProjectData(roundtrip);assert.equal(w.SIGS_COMMERCIAL.network.nodes[0].name,roundtrip.commercial.network.nodes[0].name);assert.equal(w.SIGS_COMMERCIAL.network.assignments.cam.link.routes[0].points[1].y,-100);
// Normal camera gestures keep their existing owner when network editing is closed.
NM.close();w.S.zoom=1;for(const pointer of ['mouse','touch','pen']){const cam=w.S.placed.find(p=>p.id==='cam'),at=w.w2s(cam.x,cam.y),x=cam.x;w.S.tool='place';w.S.activeLib=camera;send('pointerdown',at,pointer);send('pointermove',{x:at.x+30,y:at.y+20},pointer);send('pointerup',{x:at.x+30,y:at.y+20},pointer);send('click',{x:at.x+500,y:at.y+300},pointer);assert.equal(cam.x,x+30);assert.equal(w.S.placed.length,1);assert(!w.document.getElementById('net120-inspector'));}
// Connect across stable floor identities; never estimate an unmeasured inter-floor cable.
w.FLOORS.push({id:'floor2',name:'Piso 2',placed:[],meas:[],scale:{ok:true,ppm:20,mpp:.05},devN:0,fp:null});NM.open();w.switchFloor(1);NM.startPlace('switch');tap(200,0);selectModel('SW8');const sw3=w.SIGS_COMMERCIAL.network.nodes.at(-1);NM.startPlace('nvr');tap(400,0);selectModel('NVR8');const nvr2=w.SIGS_COMMERCIAL.network.nodes.at(-1);
NM.startConnect({kind:'switch',id:sw1.id});tap(200,0);submit();assert.equal(w.SIGS_COMMERCIAL.network.links.at(-1).routes.length,0);assert.equal(N.snapshot().links.at(-1).length.total,null);
NM.startConnect();tap(200,0);tap(400,0);submit();NM.startConnect({kind:'camera',id:'cam'});tap(200,0);const crossForm=w.document.querySelector('#net120-connection form');crossForm.elements.namedItem('nvrId').value=nvr2.id;submit();assert.equal(w.SIGS_COMMERCIAL.network.assignments.cam.nvrId,nvr2.id);assert.equal(N.snapshot().cameras[0].length.total,null);assert.equal(w.SIGS_COMMERCIAL.network.assignments.cam.link.routes.length,0);assert(!w.SIGS_COMMERCIAL.network.assignments.cam.link.link,'Rewiring cannot nest the previous assignment inside the new cable');
N.begin('route-camera','cam');tap(100,100);N.finish();N.close();assert.equal(w.FLOOR_CUR,0);assert.equal(N.snapshot().cameras[0].length.total,null,'One floor cannot imply the complete cable length');N.begin('route-camera-destination','cam');tap(300,100);N.finish();N.close();assert.equal(w.FLOOR_CUR,1);assert.equal(N.snapshot().cameras[0].length.total,null,'The vertical distance must be entered explicitly for inter-floor connections');assert.equal(w.SIGS_COMMERCIAL.network.assignments.cam.link.routes.length,2);NM.select({kind:'camera',id:'cam'});const vertical=w.document.querySelector('#net120-inspector [data-vertical]');assert(vertical);vertical.value='6';vertical.onchange();assert(Number.isFinite(N.snapshot().cameras[0].length.total));NM.close();
// Archive and licence changes prevent all new actions and preserve saved topology.
const preserved=JSON.stringify(w.SIGS_COMMERCIAL.network);w.SIGS_V6.currentStatus='ARCHIVED';NM.open();NM.startPlace('switch');tap(800,300);assert.equal(JSON.stringify(w.SIGS_COMMERCIAL.network),preserved);w.SIGS_V6.currentStatus='DRAFT';
for(const role of ['ADMIN','SALES','SUPER_ADMIN'])for(const plan of ['FREE','DEMO','EXPRESS','PRO']){
 w.CLOUD.user.role=role;w.SIGS_LICENSE.ctx.license.planCode=plan;N.refreshAccess();w.render();N.begin('route-camera','cam');assert(!w.document.getElementById('net60-draft'));NM.open();NM.startPlace('switch');NM.connect({kind:'switch',id:sw1.id},{kind:'nvr',id:nvr.id});assert(!w.document.getElementById('net120-toolbar'));assert(!w.document.getElementById('net120-inspector'));assert(!w.document.getElementById('net120-connection'));assert.equal(NM.trace('cam'),null);assert.equal(JSON.stringify(w.SIGS_COMMERCIAL.network),preserved);
}
w.SIGS_LICENSE.ctx.license.planCode='SUPREME';N.refreshAccess();NM.open();NM.startPlace('switch');assert(w.document.getElementById('net120-toolbar'));w.setTool('meas');assert(!NM.state().mode);
dom.window.close();console.log(`PASS: topology/ports helpers, actual map placement/model selection, camera → switch → switch → recorder, port conflict/cycle rejection, reachable recorder assignment, native path highlight, cable routing/length/BOM/save, ${movedCases} mouse/touch/pen drags with undo, cancellation, release suppression, actual undo/redo/project restore, two measured floors, archive and Supreme-only access for every role.`);
