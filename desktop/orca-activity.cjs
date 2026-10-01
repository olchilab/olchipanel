'use strict';
const {execFile}=require('child_process');
const path=require('path');
const normalize=s=>String(s||'').replace(/\\/g,'/').replace(/\/$/,'').toLowerCase();
function attachActivity(sessions,worktrees){
  return sessions.map(s=>{
    const w=worktrees.find(w=>normalize(w.path)===normalize(s.cwd));
    const agents=(w?.agents||[]).filter(a=>String(s.agent).toLowerCase().includes(a.agentType));
    const peers=sessions.filter(p=>normalize(p.cwd)===normalize(s.cwd)&&p.agent===s.agent);
    return {...s,responseActivity:agents.length===1&&peers.length===1?{state:agents[0].state,interrupted:!!agents[0].interrupted,updatedAt:agents[0].updatedAt}:null};
  });
}
let pending=null,cached=[],at=0;
async function readActivity(){
  if(Date.now()-at<1500)return cached;
  if(pending)return pending;
  const executable=process.env.ORCA_CLI_COMMAND||path.join(process.env.LOCALAPPDATA||'', 'Programs','orca','resources','bin','orca.exe');
  pending=new Promise(resolve=>execFile(executable,['worktree','ps','--json'],{windowsHide:true,timeout:4000,maxBuffer:4*1024*1024},(err,out)=>{
    try{cached=err?[]:JSON.parse(out).result.worktrees||[];}catch{cached=[];}
    at=Date.now();pending=null;resolve(cached);
  }));
  return pending;
}
module.exports={attachActivity,readActivity};
