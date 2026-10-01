'use strict';
const {spawnSync}=require('node:child_process');
const result=spawnSync('npm',['pack','--dry-run','--json','--ignore-scripts'],{cwd:require('node:path').resolve(__dirname,'..'),encoding:'utf8',shell:process.platform==='win32'});
if(result.status!==0){console.error('Cannot inspect the public npm package; publication blocked.');process.exit(1);}
let packages;try{packages=JSON.parse(result.stdout);}catch(_){console.error('Invalid package inventory; publication blocked.');process.exit(1);}
const paths=packages.flatMap(pack=>(pack.files||[]).map(file=>file.path));
if(!paths.length){console.error('Empty package inventory; publication blocked.');process.exit(1);}
const internal=paths.filter(file=>/(^|\/)(skills|SKILL\.md)(\/|$)/i.test(file));
if(internal.length){console.error('Publication blocked: '+internal.length+' internal skill files would be included. Keep this package private; use tools/prepare-public-demo.cjs for the public static demo.');process.exit(1);}
console.log('Public package inventory: no internal skill paths.');
