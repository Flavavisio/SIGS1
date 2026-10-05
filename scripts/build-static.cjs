const fs=require('node:fs');
fs.rmSync('dist',{recursive:true,force:true});fs.mkdirSync('dist');
for(const f of ['index.html','app-Sigs.html','proposta.html','acesso.html','assets'])fs.cpSync(f,'dist/'+f,{recursive:true});
fs.rmSync('dist/assets/js/email-center-v15.js',{force:true});
console.log('SIGS static build prepared.');
