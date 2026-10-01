'use strict';
function sessionActivity(s,now=Date.now()){
 if(!s.alive)return {kind:'offline',label:'연결 안 됨'};
 if(s.responseActivity&&s.responseActivity.state==='working')return {kind:'working',label:'응답 중'};
 const times=[Date.parse(s.updated||''),Number(s.responseActivity&&s.responseActivity.updatedAt)].filter(t=>Number.isFinite(t)&&t>0);
 if(times.length&&now-Math.max(...times)>=3600000)return {kind:'idle',label:'연결됨 · 1시간 이상 활동 없음'};
 return {kind:'connected',label:'연결됨'};
}
module.exports={sessionActivity};
