/* Map editing helpers for the project-owned network. No inferred hardware capacities. */
(function(root){'use strict';
const key=(node,medium,pool)=>medium==='fiber'?'sfp':pool==='poe'?'poe':pool==='uplink'?'uplink':'shared';
function capacity(node,spec,medium,pool){
 const value=spec[medium==='fiber'?'sfpPorts':pool==='poe'?'poePorts':pool==='uplink'?'uplinkPorts':node.kind==='nvr'?'lanPorts':'rj45Ports'];
 return value===null||value===undefined||value===''?null:Number.isInteger(Number(value))&&Number(value)>=0?Number(value):null;
}
function portUses(net,nodeId,medium='copper',pool='shared',exclude={}){
 const node=net.nodes.find(n=>n.id===nodeId);if(!node)return [];
 const group=key(node,medium,pool),out=[];
 const add=(ports,label,kind,id,count)=>{const values=String(ports||'').split(',').map(s=>s.trim()).filter(Boolean);if(!values.length)out.push({port:null,label,kind,id,count});else values.forEach(port=>out.push({port,label,kind,id,count:1}));};
 for(const [id,a] of Object.entries(net.assignments||{}))if(id!==exclude.cameraId&&a.switchId===nodeId&&key(node,a.link?.medium,a.pool||(node.kind==='nvr'?'poe':'shared'))===group)add(a.port,id,'camera',id,1);
 for(const l of net.links||[])if(l.id!==exclude.linkId)for(const end of ['A','B'])if(l[end==='A'?'a':'b']===nodeId&&key(node,l.medium,l['pool'+end]||'shared')===group)add(l['port'+end],l.name||l.id,'link',l.id,Number(l.members)||1);
 return out;
}
function freePorts(net,node,spec,medium,pool,exclude){
 const limit=capacity(node,spec,medium,pool),uses=portUses(net,node.id,medium,pool,exclude),used=new Set(uses.map(x=>Number(x.port)).filter(x=>x>0));
 // Old unnamed ports cannot safely be assigned an arbitrary index automatically.
 if(limit===null||uses.some(x=>!/^\d+$/.test(String(x.port))||Number(x.port)<1))return {limit,ports:[],unconfirmed:true,uses};
 return {limit,ports:Array.from({length:Math.min(limit,4096)},(_,i)=>i+1).filter(i=>!used.has(i)),unconfirmed:false,uses};
}
function portError(net,node,spec,medium,pool,port,exclude){
 const limit=capacity(node,spec,medium,pool);
 if(!/^\d+$/.test(String(port))||Number(port)<1)return 'Indica uma porta válida (1, 2, 3…).';
 if(limit!==null&&Number(port)>limit)return 'A porta excede a capacidade deste grupo.';
 if(portUses(net,node.id,medium,pool,exclude).some(x=>Number(x.port)===Number(port)))return 'Esta porta já está ocupada.';
 return null;
}
function path(net,a,b,excludeLinkId){
 const nodes=new Set((net.nodes||[]).map(n=>n.id));if(!nodes.has(a)||!nodes.has(b))return null;
 const queue=[{id:a,nodes:[a],links:[]}],seen=new Set([a]);
 while(queue.length){const p=queue.shift();if(p.id===b)return p;for(const l of net.links||[]){if(l.id===excludeLinkId||!nodes.has(l.a)||!nodes.has(l.b)||l.a===l.b)continue;const next=l.a===p.id?l.b:l.b===p.id?l.a:null;if(next&&!seen.has(next)){seen.add(next);queue.push({id:next,nodes:[...p.nodes,next],links:[...p.links,l.id]});}}}
 return null;
}
function recorders(net,nodeId){return net.nodes.filter(n=>n.kind==='nvr'&&path(net,nodeId,n.id));}
function trace(net,cameraId){const a=net.assignments?.[cameraId];if(!a)return null;const p=path(net,a.switchId,a.nvrId);return p?{cameraId,nodes:p.nodes,links:p.links}:null;}
root.SIGSNetworkMapModel={capacity,portUses,freePorts,portError,path,recorders,trace};
if(typeof module!=='undefined'&&module.exports)module.exports=root.SIGSNetworkMapModel;
})(typeof window!=='undefined'?window:globalThis);
