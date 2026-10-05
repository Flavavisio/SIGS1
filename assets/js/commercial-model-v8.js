/* Shared pricing model. Currency is rounded per line before summing. */
(function(root){
'use strict';
function num(v){v=Number(v);return Number.isFinite(v)?Math.max(0,v):0;}
function round(v){return Math.round((v+Number.EPSILON)*100)/100;}
function defaults(){return {version:1,prices:{},margin:0,marginMode:'markup',discount:0,iva:23,laborHours:0,laborCost:0,laborSale:0,extras:[],company:'',client:'',reference:'',validity:30,terms:''};}
function calculate(rows,c){
 var discount=Math.min(100,num(c.discount)),margin=Math.min(c.marginMode==='margin'?99:500,num(c.margin));
 var lines=rows.map(function(r){
  var p=c.prices[r.ref]||{},cost=num(p.cost),sale=p.sale===null||p.sale===undefined||p.sale===''?
   (c.marginMode==='margin'?cost/(1-margin/100):cost*(1+margin/100)):num(p.sale);
  sale=round(sale);
  return Object.assign({},r,{cost:cost,sale:sale,costTotal:round(cost*num(r.qty)),gross:round(sale*num(r.qty)),net:round(sale*num(r.qty)*(1-discount/100)),missing:sale===0});
 });
 if(num(c.laborHours))lines.push({ref:'MAO-DE-OBRA',name:'Instalação e configuração',qty:num(c.laborHours),unit:'h',cost:num(c.laborCost),sale:num(c.laborSale),costTotal:round(num(c.laborHours)*num(c.laborCost)),gross:round(num(c.laborHours)*num(c.laborSale)),net:round(num(c.laborHours)*num(c.laborSale)*(1-discount/100)),missing:num(c.laborSale)===0});
 var cost=round(lines.reduce(function(t,r){return t+r.costTotal;},0)),gross=round(lines.reduce(function(t,r){return t+r.gross;},0)),sub=round(lines.reduce(function(t,r){return t+r.net;},0)),iva=round(sub*Math.min(100,num(c.iva))/100);
 return {lines:lines,cost:cost,gross:gross,discount:round(gross-sub),sub:sub,iva:iva,total:round(sub+iva),profit:round(sub-cost),margin:sub?round((sub-cost)/sub*100):0,missing:lines.filter(function(r){return r.missing;}).length};
}
var model={defaults:defaults,calculate:calculate,num:num,round:round};
root.SIGSCommercialModel=model;
if(typeof module!=='undefined'&&module.exports)module.exports=model;
})(typeof window!=='undefined'?window:globalThis);
