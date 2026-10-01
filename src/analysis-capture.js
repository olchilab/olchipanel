'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const state=require('./state'),plans=require('./plan'),notes=require('./memo');
const {METRICS,rangeIndices,snapshot}=require('./scope/model.cjs');
const fail=(code)=>{throw Object.assign(new Error(code),{code});};
// Explicit human save only. Recompute the sample; never trust client totals or HTML.
function capture(input){
 const range=rangeIndices(input.start,input.end);
 if(!range||!METRICS[input.metric])fail('bad_analysis');
 const session=state.readAllSessions().find(s=>s.id===input.session);
 if(!session)fail('no_session');
 const result=snapshot(input.metric,range),metric=METRICS[result.metric];
 const key=crypto.createHash('sha256').update(JSON.stringify([session.id,result.metric,result.start,result.end])).digest('hex').slice(0,24);
 const noteId='analysis-'+key,receiptFile=path.join(state.ROOT,'analysis-'+key+'.json');
 const memo=notes.read(state.ROOT,'common').memo;
 if(memo.notes.length>=100&&!memo.notes.some(n=>n.id===noteId))fail('bad_notebook_full');
 let receipt;try{receipt=JSON.parse(fs.readFileSync(receiptFile,'utf8'));}catch(_){}
 if(input.planId!==(session.plan_id||'')&&!(input.planId===''&&receipt?.createdPlan&&receipt.planId===session.plan_id))fail('bad_analysis_target_changed');
 const saveReceipt=()=>{const tmp=receiptFile+'.tmp';fs.writeFileSync(tmp,JSON.stringify(receipt));fs.renameSync(tmp,receiptFile);};
 if(receipt&&receipt.planId!==session.plan_id)fail('bad_analysis_target_changed');
 let plan=plans.getPlan(session.plan_id||''),createdPlan=false;
 if(!plan){
   if(receipt)fail('no_plan');
   plan=plans.createPlan('자료 분석 · 샘플');session.plan_id=plan.id;state.writeSession(session);createdPlan=true;
 }
 receipt=receipt||{schema:'olchipanel.analysis-capture.v1',planId:plan.id,noteId,createdPlan};saveReceipt();
 const fmt=v=>Number(v).toLocaleString('ko-KR',{maximumFractionDigits:2});
 const title=metric.label+' 분석 · '+result.start+' ~ '+result.end;
 const summary='가상 자료 · '+result.count+'일\n일평균 '+fmt(result.average)+' '+metric.unit+' · 최소 '+fmt(result.minimum)+' · 최대 '+fmt(result.maximum)+(result.metric==='revenue'?'\n구간 매출 합계 '+fmt(result.total)+' 원':'\n기간 전체의 중복 제거 방문자 수는 알 수 없습니다.');
 if(!receipt.itemId){
   // The marker recovers a save interrupted after the card write, without duplicates.
   const marker='분석 기록: '+key;
   const previous=plan.items.find(i=>(i.note||'').includes(marker));
   const item=previous||plans.plan_mutate(plan.id,'add',{title:metric.label+' 변화 원인 검토',status:'todo',session:session.id,note:title+'\n'+summary+'\n선택 구간의 유입 경로·구매 전환 자료를 확인합니다. 집계만으로 원인을 단정하지 않습니다.\n'+marker},plan.version).item;
   receipt.itemId=item.id;saveReceipt();
 }
 if(!memo.notes.some(n=>n.id===noteId)){
   const now=new Date().toISOString();
   memo.notes.push({id:noteId,title,html:'<h1>'+title+'</h1><p>'+summary.replace(/\n/g,'</p><p>')+'</p><h2>다음 확인</h2><p>선택 구간의 유입 경로·구매 전환 자료를 확인합니다. 이 집계만으로 변화의 원인을 단정하지 않습니다.</p>',order:memo.notes.length,pinned:false,parentId:null,created:now,updated:now});
   memo.selected=noteId;notes.write(state.ROOT,'common',memo);
 }
 return {noteId,planId:plan.id,itemId:receipt.itemId,memo:notes.read(state.ROOT,'common').memo};
}
module.exports={capture};
