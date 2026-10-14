/* Exact legacy optics correction, verified against the manufacturer's model sheet. */
(function(root){'use strict';
const model='DS-2CD2643G2-IZS',source='https://pro-av.hikvision.com/mena-en/products/IP-Products/Network-Cameras/Pro-Series-EasyIP-/ds-2cd2643g2-izs/';
const patch={lensType:'varifocal',motorized:true,lensMin:2.8,lensMax:12,baseLens:2.8,fov:95.8,fovWide:95.8,fovTele:29.2,verticalFov:50.6,verticalFovWide:50.6,verticalFovTele:16.4,mp:4,resW:2688,resH:1520,sensor:'1/3"',range:60,sourceURL:source,datasheetURL:'https://assets.hikvision.com/prd/public/all/doc/sm000058948/DS-2CD2643G2-IZS_Datasheet_V5.5.113_20230318.pdf',sourceChecked:'2026-10-14',analytics:{people:true,vehicles:true,label:'AcuSense · classificação de pessoas e veículos',source,checked:'2026-10-14'}};
const matches=d=>!d?.custom&&d?.model===model,seed=(root.CCTV_LIB||[]).find(matches);
function merge(lib){const out=(lib||[]).map(d=>matches(d)?{...d,...patch,id:d.id}:d);if(seed&&!out.some(matches))out.push({...seed,...patch});return out;}
root.CCTV_LIB=merge(root.CCTV_LIB);
const book=root.SIGSHikvisionCCTV92;if(book){const old=book.merge,lookup=book.lookup;book.merge=lib=>merge(old(lib));book.rows=merge(book.rows);book.lookup=d=>matches(d)?{...(lookup(d)||seed||d),...patch}:lookup(d);}
root.SIGSOpticalReview121={merge,model,patch};
})(typeof window!=='undefined'?window:globalThis);
