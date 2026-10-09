/* Shared geometry for PDF proposals and immutable public revisions. */
(function(root){
'use strict';
const number=v=>Number.isFinite(Number(v))?Number(v):0;
let clipId=0;
const cameras=['dome','bullet','turret','ptz','fisheye','thermal_bi'];
function capture(p,d){if(!cameras.includes(d.type))return {};const lens=root.SIGSLensModel?root.SIGSLensModel.effective(p,d):(number(p.lens)||2.8),reference=root.SIGSLensModel?root.SIGSLensModel.policy(d).base:(number(d.baseLens||d.refLens)||2.8),base=Math.max(1,Math.min(179,number(d.fov)||90));let fov=root.SIGSLensModel?root.SIGSLensModel.fov(p,d):2*Math.atan(Math.tan(base*Math.PI/360)*reference/lens)*180/Math.PI;
 if(d.type==='thermal_bi')fov=number(p.visibleFov||d.visibleFov||d.fov)||30;
 const out={type:d.type,lens,fov:Math.max(1,Math.min(360,fov)),range:Math.max(0,number(d.type==='thermal_bi'?(p.visibleRange||d.visibleRange||d.range):d.range)),rotation:number(p.rotation),instTilt:p.instTilt==null?30:number(p.instTilt),instHeight:number(p.instHeight)||3};
 if(d.type==='thermal_bi'){out.thermalFov=number(p.thermalFov||d.thermalFov)||30;out.thermalRange=number(p.thermalRange||d.thermalRange)||0;}return out;
}
function sector(p,ppm,obstacles){if(!cameras.includes(p.type)||!(ppm>0)||!(p.fov>0&&p.range>0))return '';const x=number(p.x),y=number(p.y),rotation=number(p.rotation)-90;
 function shape(fov,range,color){
 const tilt=p.instTilt==null?(p.tilt==null?30:number(p.tilt)):number(p.instTilt),half=Math.atan(Math.tan(Math.min(179,fov)*Math.PI/360)*9/16)*180/Math.PI;
 const blind=tilt<0||tilt+half>=90?0:(number(p.instHeight)||3)/Math.tan((tilt+half)*Math.PI/180)*ppm;
 const far=tilt-half,reach=fov<180&&tilt>=0&&far>0?(number(p.instHeight)||3)/Math.tan(far*Math.PI/180):Infinity;
 range=Math.min(range,reach);
 function hollow(svg){if(!(blind>0)||!Number.isFinite(blind))return svg;const id='sigs-blind-'+(++clipId),outer=Math.max(range*ppm+1,blind+1),disk='M'+(x+blind)+' '+y+'a'+blind+' '+blind+' 0 1 0 '+(-2*blind)+' 0a'+blind+' '+blind+' 0 1 0 '+(2*blind)+' 0Z';return '<defs><clipPath id="'+id+'"><path clip-rule="evenodd" d="M'+(x-outer)+' '+(y-outer)+'h'+(outer*2)+'v'+(outer*2)+'h'+(-outer*2)+'Z '+disk+'"/></clipPath></defs><g clip-path="url(#'+id+')">'+svg+'</g>';}
 const r=Math.max(0,number(range))*ppm,a=Math.max(0,Math.min(360,number(fov)))*Math.PI/360;if(!r||!a)return '';if(fov>=355)return hollow('<circle data-fov="'+number(fov)+'" cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+color+'" fill-opacity=".16" stroke="'+color+'" stroke-width="'+r/150+'"/>');
 return hollow('<path data-fov="'+number(fov)+'" d="M0 0 L'+r*Math.cos(a)+' '+(-r*Math.sin(a))+' A'+r+' '+r+' 0 '+(fov>180?1:0)+' 1 '+r*Math.cos(a)+' '+r*Math.sin(a)+' Z" transform="translate('+x+' '+y+') rotate('+rotation+')" fill="'+color+'" fill-opacity=".16" stroke="'+color+'" stroke-width="'+r/150+'"/>');}
 let result=shape(p.fov,p.range,'#3869e8')+(p.thermalFov>0&&p.thermalRange>0?shape(p.thermalFov,p.thermalRange,'#e06042'):'');
 const range=Math.max(p.range||0,p.thermalRange||0),fov=Math.max(p.fov||0,p.thermalFov||0),shadows=root.SIGSSiteGeometry?.shadows({...p,range,fov},ppm,obstacles)||[],r=range*ppm*2;
 for(const shadow of shadows){const id='sigs-wall-'+(++clipId),outer='M'+(x-r)+' '+(y-r)+'h'+(2*r)+'v'+(2*r)+'h'+(-2*r)+'Z',hole=shadow.map((v,i)=>(i?'L':'M')+v.x+' '+v.y).join(' ')+'Z';result='<defs><clipPath id="'+id+'" clipPathUnits="userSpaceOnUse"><path clip-rule="evenodd" d="'+outer+' '+hole+'"/></clipPath></defs><g clip-path="url(#'+id+')">'+result+'</g>';}
 return result;
}
function label(p){return cameras.includes(p.type)&&p.fov>0?'FOV '+number(p.fov).toLocaleString('pt-PT',{maximumFractionDigits:1})+'°'+(p.thermalFov>0?' · Térmico '+number(p.thermalFov).toLocaleString('pt-PT',{maximumFractionDigits:1})+'°':''):'';}
root.SIGSProposalOptics={capture,sector,label};if(typeof module!=='undefined'&&module.exports)module.exports=root.SIGSProposalOptics;
})(typeof window!=='undefined'?window:globalThis);
