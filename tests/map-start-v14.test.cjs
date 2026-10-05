const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../assets/js/block-03.js'),'utf8');
function fn(name){const start=source.indexOf('function '+name+'(');assert.ok(start>=0);return source.slice(start,source.indexOf('\n}',start)+2);}
const active=new Set(),nodes={};for(const id of ['mapwrap','mapbtn','leafmap','gmapsbtn'])nodes[id]={classList:{add(){},remove(){}},style:{}};
const map={setView(){return this;},hasLayer:l=>active.has(l),removeLayer:l=>active.delete(l),invalidateSize(){}};
function layer(){return {addTo(){active.add(this);return this;}};}
const ctx={S:{},window:{},document:{getElementById:id=>nodes[id]},requestAnimationFrame:f=>f(),setTimeout:f=>f(),_applyMapLock(){},_getGmapsKey:()=>'',_loadGoogleMaps:(key,cb)=>cb(true),notify(){},L:{map:()=>map,tileLayer:layer,layerGroup:layer,control:{layers:()=>({addTo(){return this;},addBaseLayer(){}})},gridLayer:{googleMutant:layer}}};ctx.window.L=ctx.L;
vm.createContext(ctx);for(const name of ['_showSatelliteMap','_addGoogleLayers','openMap','closeMap'])vm.runInContext(fn(name),ctx);
ctx.openMap();assert.equal(ctx.S.mapOpen,true);assert.equal(active.size,1);assert.ok(active.has(ctx.S.satelliteLayer));
const [street,satellite,hybrid]=ctx.S.mapBaseLayers;active.delete(satellite);street.addTo(map);const overlay=layer();overlay.addTo(map);ctx.closeMap();ctx.openMap();assert.ok(active.has(satellite));assert.ok(!active.has(street));assert.ok(active.has(overlay));
active.delete(satellite);hybrid.addTo(map);ctx.closeMap();ctx.openMap();assert.ok(active.has(satellite));assert.ok(!active.has(hybrid));
ctx._getGmapsKey=()=> 'test-key';ctx._addGoogleLayers(false);const googleSat=ctx.S.satelliteLayer;assert.notEqual(googleSat,satellite);assert.ok(active.has(googleSat));assert.ok(!active.has(satellite));
const googleStreet=ctx.S.mapBaseLayers[3];active.delete(googleSat);googleStreet.addTo(map);ctx.closeMap();ctx.openMap();assert.ok(active.has(googleSat));assert.ok(!active.has(googleStreet));assert.ok(active.has(overlay));
console.log('PASS: first map opening, reopening from streets/hybrid, Google satellite and overlay preservation.');
