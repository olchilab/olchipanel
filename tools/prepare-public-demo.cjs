'use strict';
// Publish this isolated static tree, never a checkout or a desktop/npm package.
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const source=path.join(root,'output/championship-demo/site');
const target=path.join(root,'output/github-demo-public');
const allowed=[
  'adapter.js','app.html','build.json','business-data.js','fixtures.js','index.html',
  'plan.html','session.js','shell.css','shell.js',
  'icons/olchi-192.png','icons/olchi-dark-32.png','icons/olchi-favicon-dark-v1.ico','icons/olchi-favicon-v4.ico',
  'scope/controls.css','scope/index.html','scope/scope.css','scope/scope.js'
];
function list(dir,prefix=''){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const relative=prefix+entry.name;
    if(entry.isSymbolicLink())throw new Error('Public export rejects symlinks: '+relative);
    return entry.isDirectory()?list(path.join(dir,entry.name),relative+'/'):[relative];
  });
}
const actual=list(source);
if(actual.length!==allowed.length||actual.some(file=>!allowed.includes(file)))throw new Error('Unexpected demo files; review the explicit public allowlist');
if(fs.existsSync(target)&&list(target).some(file=>!allowed.includes(file)&&!['README.md','PUBLIC-FILES.json'].includes(file)))throw new Error('Unexpected public staging files; preserve and inspect them');
const records=[];
for(const file of allowed){
  const bytes=fs.readFileSync(path.join(source,file));
  const destination=path.join(target,file);
  fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,bytes);
  records.push({path:file,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
fs.writeFileSync(path.join(target,'README.md'),'# OlchiPanel public interaction demo\n\nStatic demonstration with synthetic data and simulated Codex/Claude sessions. No live AI calls.\n\nGraph-to-note-page links are a demo-only prototype, not an installed-app feature. Edits last for the current visit; a fresh visit resets the demo.\n\nServe this folder at `/olchipanel/`. The public deployment is https://olchilab.com/olchipanel/.\n\nThis export contains no internal agent skills, MCP server, desktop installer, credentials, or local work records.\n');
fs.writeFileSync(path.join(target,'PUBLIC-FILES.json'),JSON.stringify({schema:'olchipanel.public-demo.v1',generatedAt:new Date().toISOString(),files:records},null,2)+'\n');
console.log(JSON.stringify({target,staticFiles:records.length,internalSkills:0}));
