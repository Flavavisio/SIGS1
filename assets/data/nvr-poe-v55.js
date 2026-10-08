/* PoE recorder specifications checked 2026-10-08 against Visiotech / manufacturer sources. */
(function(root){
const rows=[
{name:'UV-NVR301-08B-P8-IQ',reference:'UV-NVR301-08B-P8-IQ',brand:'Uniview',ch:8,maxMP:12,bw:80,hdd:1,maxDiskTB:10,poePorts:8,poeBudget:75,poeMaxPortW:30,sourceURL:'https://www.visiotechsecurity.com/pt/produtos/uv-nvr301-08b-p8-iq-detail',powerSourceURL:'https://www.uniview.com/de/Products/NVR/Easy/NVR301-B-P-IQ/'},
{name:'UV-NVR302-16B-P16-IQ',reference:'UV-NVR302-16B-P16-IQ',brand:'Uniview',ch:16,maxMP:12,bw:160,hdd:2,maxDiskTB:10,poePorts:16,poeBudget:240,poeMaxPortW:30,sourceURL:'https://www.visiotechsecurity.com/en/products/ip-cctv-1/professional-nvrs-12/uniview---uniarch-311/uv-nvr302-16b-p16-iq-detail'},
{name:'DS-7608NXI-K2/8P(D)',reference:'DS-7608NXI-K2/8P(D)',poePortSource:'Limite nominal PSE IEEE 802.3at; confirmar por porta no fabricante',brand:'Hikvision',ch:8,maxMP:12,bw:80,hdd:2,maxDiskTB:16,poePorts:8,poeBudget:80,poeMaxPortW:30,sourceURL:'https://www.visiotechsecurity.com/pt/produtos/cctv-ip-1/nvrs-profissionais-12/hikvision-31/ds-7608nxi-k2_8p%28d%29-detail'},
{name:'DS-7616NXI-K2/16P(D)',reference:'DS-7616NXI-K2/16P(D)',poePortSource:'Limite nominal PSE IEEE 802.3at; confirmar por porta no fabricante',brand:'Hikvision',ch:16,maxMP:12,bw:160,hdd:2,maxDiskTB:16,poePorts:16,poeBudget:200,poeMaxPortW:30,sourceURL:'https://www.visiotechsecurity.com/pt/produtos/ip/nvrs-profissionais-12/hikvision-31/ds-7616nxi-k2_16p%28d%29-detail'}
];
function merge(lib){const out=(lib||[]).map(d=>({...d}));rows.forEach(d=>{const i=out.findIndex(x=>(x.reference||x.name)===d.reference);if(i<0)out.push({...d});else out[i]={...d,...Object.fromEntries(Object.entries(out[i]).filter(([,v])=>v!==undefined))};});return out;}
root.SIGSNvrPoE={rows,merge};root.NVR_DB=merge(root.NVR_DB);
if(typeof module!=='undefined'&&module.exports)module.exports=root.SIGSNvrPoE;
})(typeof window!=='undefined'?window:globalThis);
