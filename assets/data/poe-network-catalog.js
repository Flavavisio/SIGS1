/* ═══════════════════════════════════════════════════════════════
   SIGS DESIGN — PoE / NETWORK CATALOG

   POE_MODEL_WATTS: model -> project-design power in watts.
   POE_SWITCH_DB: switch references used by the recommendation engine.
   ═══════════════════════════════════════════════════════════════ */

var POE_MODEL_WATTS = {
  'DS-2CD1043G2-LIU':6.5,
  'DS-2CD1143G2-LIU':6.5,
  'DS-2CD2143G2-I':7.5,
  'DS-2CD2347G2-LU':7.5,
  'DS-2CD2047G2-LU':7.5,
  'DS-2CD2087G2-LU':8.5,
  'DS-2CD2386G2-IU':9.0,
  'DS-2CD2547G2-LS':7.5,
  'DS-2CD2T47G2-L':8.5,
  'IPC2124LE-ADF28KM-G':7.5,
  'IPC3614LE-ADF28K-G':7.5,
  'IPC2124SB-ADF28KMC-I0':8.5,
  'IPC3614SB-ADF28KMC-I0':8.5,
  'IPC2125SB-ADF28KMC-I0':9.0,
  'IPC3615SB-ADF28KMC-I0':9.0,
  'IPC2128SB-ADF28KMC-I0':10.0,
  'IPC3618SB-ADF28KMC-I0':10.0,
  'IPC2128SE-ADF28KM-WL-I0':12.0,
  'IPC3618SE-ADF28KM-WL-I0':12.0,
  'IPC815SR-DVPF14':9.0,
  'IPC868ER-VF18-B':12.0,
  'SF-IPTB256A-3D5':15.0,
  'SF-IPTB256A-7D5':15.0,
  'SF-IPTB384A-9D5':18.0,
  'SF-IPTB384A-19D5':18.0,
  'SF-IPTB384A-25D5':18.0
};

var POE_SWITCH_DB = [
  {name:'Reyee RG-ES108GD-P',ports:8,budget:65,brand:'Reyee',uplinkMbps:1000,note:'8x GE PoE, 65W'},
  {name:'Reyee RG-ES108GD-P-I',ports:8,budget:120,brand:'Reyee',uplinkMbps:1000,note:'8x GE PoE, 120W'},
  {name:'Reyee RG-ES116G-P',ports:16,budget:125,brand:'Reyee',uplinkMbps:1000,note:'16x GE PoE, 125W'},
  {name:'Reyee RG-ES116G-P-I',ports:16,budget:230,brand:'Reyee',uplinkMbps:1000,note:'16x GE PoE, 230W'},
  {name:'Reyee RG-ES124G-P',ports:24,budget:185,brand:'Reyee',uplinkMbps:1000,note:'24x GE PoE, 185W'},
  {name:'Reyee RG-ES124G-P-I',ports:24,budget:370,brand:'Reyee',uplinkMbps:1000,note:'24x GE PoE, 370W'},
  {name:'Reyee RG-ES148GD-P',ports:48,budget:370,brand:'Reyee',uplinkMbps:1000,note:'48x GE PoE, 370W'},
  {name:'Reyee RG-NBS3100-8GT2SFP-P',ports:8,budget:120,brand:'Reyee',uplinkMbps:1000,note:'8x GE PoE gerido, 120W'},
  {name:'Reyee RG-NBS3100-16GT2SFP-P',ports:16,budget:230,brand:'Reyee',uplinkMbps:1000,note:'16x GE PoE gerido, 230W'},
  {name:'Reyee RG-NBS3100-24GT4SFP-P',ports:24,budget:370,brand:'Reyee',uplinkMbps:1000,note:'24x GE PoE gerido, 370W'},
  {name:'Uniview NSW2010-8T1GT1GF-POE-IN',ports:8,budget:75,brand:'Uniview',uplinkMbps:1000,note:'8x FE PoE + GE uplink, 75W'},
  {name:'Uniview NSW2010-16T2GF-POE-IN',ports:16,budget:135,brand:'Uniview',uplinkMbps:1000,note:'16x FE PoE + GE uplink, 135W'},
  {name:'Uniview NSW2010-24T4GF-POE-IN',ports:24,budget:185,brand:'Uniview',uplinkMbps:1000,note:'24x FE PoE + GE uplink, 185W'},
  {name:'Uniview NSW2020-8MBP-IN',ports:8,budget:120,brand:'Uniview',uplinkMbps:1000,note:'8x GE PoE, 120W'},
  {name:'Uniview NSW2020-16MBP-IN',ports:16,budget:240,brand:'Uniview',uplinkMbps:1000,note:'16x GE PoE, 240W'},
  {name:'Uniview NSW2020-24MBP-IN',ports:24,budget:370,brand:'Uniview',uplinkMbps:1000,note:'24x GE PoE, 370W'},
  {name:'Uniview NSW5000-8T2GF-POE-IN',ports:8,budget:130,brand:'Uniview',uplinkMbps:1000,note:'8x GE PoE L2+, 130W'},
  {name:'Uniview NSW5000-16T4GF-POE-IN',ports:16,budget:250,brand:'Uniview',uplinkMbps:1000,note:'16x GE PoE L2+, 250W'},
  {name:'Uniview NSW5000-24T4GF-POE-IN',ports:24,budget:400,brand:'Uniview',uplinkMbps:1000,note:'24x GE PoE L2+, 400W'},
  {name:'Uniview NSW5000-48T4GF-POE-IN',ports:48,budget:740,brand:'Uniview',uplinkMbps:1000,note:'48x GE PoE L2+, 740W'}
];
