/* Non-PoE counterparts for cross-brand alternatives. Conservative 10 TB/drive from the per-series sheet. */
(function(root){'use strict';
const rows=[
{name:'UV-NVR301-08B-IQ',reference:'UV-NVR301-08B-IQ',brand:'Uniview',ch:8,maxMP:12,bw:80,hdd:1,maxDiskTB:10,poePorts:0,poeBudget:0,poeMaxPortW:0,lanPorts:1,lanMbps:100,recommendationPriority:1,sourceChecked:'2026-11-03',sourceURL:'https://www.visiotechsecurity.com/en/products/ip-cctv-1/professional-nvrs-12/uniview---uniarch-311/uv-nvr301-08b-iq-detail',datasheetURL:'https://www.uniview.com/arab/res/202407/19/20240719_1905768_UNV%20NVR301-B-IQ%20Series%20Network%20Video%20Recorder_994342_168459_0.pdf'},
{name:'UV-NVR302-16B-IQ',reference:'UV-NVR302-16B-IQ',brand:'Uniview',ch:16,maxMP:12,bw:160,hdd:2,maxDiskTB:10,poePorts:0,poeBudget:0,poeMaxPortW:0,lanPorts:1,lanMbps:1000,recommendationPriority:1,sourceChecked:'2026-11-03',sourceURL:'https://www.visiotechsecurity.com/en/products/ip-cctv-1/professional-nvrs-12/uniview---uniarch-311/uv-nvr302-16b-iq-detail',datasheetURL:'https://global.uniview.com/kr/Products/NVR/Easy/2/NVR302-16B-IQ/'}
];
function merge(lib){const out=(lib||[]).slice();for(const d of rows){const i=out.findIndex(x=>(x.reference||x.name)===d.reference);if(i<0)out.push({...d});else out[i]={...out[i],...d};}return out;}
root.SIGSNvrAlternatives124={rows,merge};root.NVR_DB=merge(root.NVR_DB);
})(typeof window!=='undefined'?window:globalThis);
