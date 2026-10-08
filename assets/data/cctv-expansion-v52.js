/* Hikvision / Uniview: manufacturer specifications checked on 2026-10-08.
   Each entry represents one lens variant. Prices and unverified PoE loads are omitted. */
(function(root){'use strict';
const hik='https://pro-av.hikvision.com/mena-en/products/IP-Products/Network-Cameras/';
const unv='https://www.uniview.com/Products/Network_Cameras/Prime_Series/PRIMEI_Series/';
function motor(model,brand,type,mp,min,max,wide,tele,range,sourceURL,extra){return Object.assign({model,brand,type,mp,lensType:'motorized',lensMin:min,lensMax:max,baseLens:min,fov:wide,fovWide:wide,fovTele:tele,range,sourceURL},extra||{});}
const rows=[
 motor('DS-2CD2686G2-IZS','hikvision','bullet',8,2.8,12,108,46,60,hik+'Pro-Series-EasyIP-/ds-2cd2686g2-izs/',{name:'Bullet 8 MP AcuSense · Motorizada',recordFps:25}),
 motor('DS-2CD2686G2-IZSU/SL','hikvision','bullet',8,2.8,12,108,46,60,hik+'Pro-Series-EasyIP-/ds-2cd2686g2-izsu-sl/',{name:'Bullet 8 MP AcuSense · Alarme luminoso e sonoro',recordFps:25}),
 motor('DS-2CD3666G2-IZS','hikvision','bullet',6,2.7,13.5,106,35.6,60,hik+'Ultra-Series-SmartIP-/ds-2cd3666g2-izs/',{name:'Bullet 6 MP SmartIP · Motorizada',resW:3200,resH:1800,recordFps:20}),
 {model:'DS-2CD2387G2H-LIU',brand:'hikvision',type:'turret',mp:8,name:'Turret 8 MP ColorVu · Smart Hybrid Light',lensType:'fixed',focalLength:2.8,baseLens:2.8,fov:108.8,range:40,recordFps:25,sourceURL:'https://assets.hikvision.com/prd/public/all/doc/sm000052164/DS-2CD2387G2H-LIU_Datasheet_20230719.pdf'},
 motor('DS-2CD2766G2-IZS','hikvision','dome',6,2.8,12,106,35,40,hik+'Pro-Series-EasyIP-/ds-2cd2766g2-izs/',{name:'Dome 6 MP AcuSense · Motorizada',resW:3200,resH:1800}),
 motor('IPC3638SB-ADZK-I0','uniview','turret',8,2.8,12,107.4,29.2,40,unv+'IPC3638SB-ADZK-I0/',{name:'Turret 8 MP LightHunter · Motorizada',recordFps:20}),
 motor('IPC2328SB-DZK-I0','uniview','bullet',8,2.8,12,107.4,29.2,50,unv+'IPC2328SB-DZK-I0/',{name:'Bullet 8 MP LightHunter · Motorizada',recordFps:20}),
 motor('IPC3238SB-ADZK-I0','uniview','dome',8,2.8,12,107.4,29.2,40,unv+'IPC3238SB-ADZK-I0/',{name:'Dome 8 MP LightHunter · Motorizada',recordFps:20}),
 {model:'IPC3618SB-ADF28KMC-I1',brand:'uniview',type:'turret',mp:8,name:'Turret 8 MP ColorHunter · Wise-ISP · Dual Light',lensType:'fixed',focalLength:2.8,baseLens:2.8,fov:98.7,range:30,recordFps:25,poeW:11.5,poeStandard:'802.3af',sourceURL:unv+'IPC3618SB-ADF28KMC-I1/'},
 motor('IPC3634SR3-ADZK-G','uniview','turret',4,2.8,12,102.79,30.86,40,'https://sgcdn.uniview.com/us/Products/Network_Cameras/Sharp/IR/IPC3634SR3-ADZK-G/',{name:'Turret 4 MP WDR · Motorizada',resW:2688,resH:1520,recordFps:25})
].map(d=>Object.assign({id:'verified-cctv-'+d.model.toLowerCase().replace(/[^a-z0-9]+/g,'-'),family:'cctv',height:3,color:d.brand==='hikvision'?'#ef4444':'#3b82f6',icon:d.type==='bullet'?'▬':'◉',resW:3840,resH:2160,codec:d.brand==='uniview'?'ultra265b':'h265',sourceChecked:'2026-10-08',desc:d.lensType==='fixed'?'Lente fixa de 2,8 mm; variante de lente específica.':'Lente motorizada. FOV nos extremos conforme ficha; valores intermédios estimados. Confirmar no equipamento.'},d));
// Correct optical metadata without changing IDs used by saved projects.
const corrections=[
 motor('DS-2CD2643G2-IZS','hikvision','bullet',4,2.8,12,95.8,29.2,60,hik+'Pro-Series-EasyIP-/ds-2cd2643g2-izs/'),
 motor('DS-2CD2H43G2-IZS','hikvision','dome',4,2.8,12,95.8,29.2,40,'https://www.hikvision.com/content/dam/hikvision/products/S000000001/S000000002/S000000003/S000000025/OFR000038/M000037857/Data_Sheet/DS-2CD2H43G2-IZS_Datasheet_V5.5.102_20201010.pdf'),
 motor('DS-2CD2766G2T-IZS','hikvision','dome',6,2.8,12,99,35,40,'https://www.hikvision.com/content/dam/hikvision/au/firmware/ds-2cd2766g2t-izs/DS-2CD2766G2T-IZS-C_Datasheet_V5.5.113_20220810.pdf'),
 motor('DS-2CD2746G2-IZS','hikvision','dome',4,2.8,12,108,30,40,'https://www.hikvision.com/content/dam/hikvision/products/S000000001/S000000002/S000000003/S000000025/OFR000041/M000014832/Data_Sheet/DS-2CD2746G2-IZS-C_Datasheet_V5.5.112_20230217.pdf'),
 motor('IPC2325EBR5-DUPZ','uniview','bullet',5,2.7,13.5,93.38,28.56,50,'https://www.uniview.com/res/202007/15/20200715_1777567_UNV%20IPC2325EBR5-DUPZ%205MP%20WDR%20Starlight%28Motorized%29VF%20Network%20IR%20Bullet%20Camera%20V2.0_789997_168459_0.pdf',{resW:2592,resH:1944,recordFps:20})
].map(d=>Object.assign({sourceChecked:'2026-10-08'},d));
function key(d){return String(d.model||'').trim().toUpperCase();}
function enrich(existing,spec){
 if(existing.custom)return existing;
 // Catalogue edits with explicit optical metadata take precedence over defaults.
 if(existing.lensType||existing.focalLength||existing.lensMin||existing.optics||existing.sourceChecked)return Object.assign({},spec,existing);
 const result=Object.assign({},existing,spec,{id:existing.id,model:existing.model,name:existing.name||spec.name});
 // Old seed DORI values were generic; derive distances from resolution and actual FOV.
 delete result.dori;return result;
}
function merge(lib){const out=(lib||[]).map(d=>Object.assign({},d));corrections.forEach(d=>{const i=out.findIndex(x=>key(x)===key(d));if(i>=0)out[i]=enrich(out[i],d);});rows.forEach(d=>{const i=out.findIndex(x=>key(x)===key(d));if(i<0)out.push(Object.assign({},d));else out[i]=enrich(out[i],d);});return out;}
root.SIGSCCTVExpansion={rows,corrections,merge};root.CCTV_LIB=merge(root.CCTV_LIB);
if(typeof module!=='undefined'&&module.exports)module.exports=root.SIGSCCTVExpansion;
})(typeof window!=='undefined'?window:globalThis);
