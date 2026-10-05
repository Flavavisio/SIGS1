/* Rectilinear camera geometry; vertical FOV estimated from horizontal FOV and image ratio. */
(function(root){'use strict';
function ground(height,tilt,hfov,ratio){height=Math.max(0,Number(height)||0);tilt=Math.max(0,Math.min(90,Number(tilt)||0));hfov=Math.max(1,Math.min(179,Number(hfov)||90));ratio=Number(ratio)>0?Number(ratio):9/16;var half=Math.atan(Math.tan(hfov*Math.PI/360)*ratio)*180/Math.PI,near=tilt+half,far=tilt-half;return {verticalHalf:half,verticalFov:half*2,nearAngle:near,farAngle:far,blind:near>=90?0:height/Math.tan(near*Math.PI/180),reach:far<=0?Infinity:height/Math.tan(far*Math.PI/180)};}
root.sigsGroundGeometry=ground;if(typeof module!=='undefined'&&module.exports)module.exports={ground};
})(typeof window!=='undefined'?window:globalThis);
