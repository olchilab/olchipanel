'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../output/championship-demo/site');
const discovery=path.resolve(__dirname,'../output/championship-demo/preview.json');
const types={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch(_){res.writeHead(400).end();return;}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}
  if(pathname==='/'){res.writeHead(302,{Location:'/olchipanel/'}).end();return;}
  if(!pathname.startsWith('/olchipanel/')){res.writeHead(404).end();return;}
  const file=path.resolve(root,pathname.slice('/olchipanel/'.length)||'index.html');
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  if(req.method==='HEAD')res.end();else fs.createReadStream(file).pipe(res);
});
server.listen(0,'127.0.0.1',()=>{
  const url='http://127.0.0.1:'+server.address().port+'/olchipanel/';
  fs.writeFileSync(discovery,JSON.stringify({url,pid:process.pid,startedAt:new Date().toISOString()},null,2));
  console.log(url);
});
function stop(){server.close(()=>process.exit(0));}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
