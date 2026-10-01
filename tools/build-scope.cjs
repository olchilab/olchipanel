'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),source=path.join(root,'src/scope');
function buildScope(out=path.join(root,'public/scope')){
 const esbuild=require(path.join(source,'node_modules/esbuild'));
 fs.mkdirSync(out,{recursive:true});
 esbuild.buildSync({entryPoints:[path.join(source,'main.jsx')],bundle:true,minify:true,jsx:'automatic',outfile:path.join(out,'scope.js'),define:{'process.env.NODE_ENV':'"production"'},legalComments:'eof'});
 fs.copyFileSync(path.join(source,'index.html'),path.join(out,'index.html'));
 fs.copyFileSync(path.join(root,'public/themes/shared.css'),path.join(out,'controls.css'));
 esbuild.buildSync({entryPoints:[path.join(source,'model.js')],bundle:true,platform:'node',format:'cjs',outfile:path.join(source,'model.cjs')});
 return out;
}
module.exports={buildScope};
if(require.main===module)console.log('Built shared analysis: '+buildScope());
