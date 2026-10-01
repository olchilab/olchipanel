// Synthetic daily data, not real usage or sales for OlchiLab.
export const ROWS=Array.from({length:50},(_,index)=>{
  const date=new Date(Date.UTC(2026,7,1+index)).toISOString().slice(0,10);
  const dip=index>=22&&index<=29;
  const visitors=Math.round((1800+index*13+Math.sin(index*1.1)*190+(index%7<2?250:0))*(dip?.58:1));
  const revenue=Math.round(visitors*(28+(index%5)*3)*(dip?.86:1)/100)*100;
  return {index,date,visitors,revenue};
});
export const METRICS={
  visitors:{label:'방문자 수',axis:'일별 방문자 수 (명)',unit:'명'},
  revenue:{label:'매출',axis:'일별 매출 (원)',unit:'원'}
};
export const DEMO=new URLSearchParams(globalThis.location?.search||'').get('demo')==='1';
export const STORAGE=DEMO?'olchipanel.championship.analysis.v1':'olchipanel.analysis.v1';
export const SNAPSHOT=DEMO?'olchipanel.championship.analysis-result.v1':'olchipanel.analysis-result.v1';
export function analysisStorage(){return DEMO?sessionStorage:localStorage;}
export function rangeIndices(start,end){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(start)||!/^\d{4}-\d{2}-\d{2}$/.test(end))return null;
  const a=ROWS.findIndex(row=>row.date===start),b=ROWS.findIndex(row=>row.date===end);
  return a<0||b<0?null:{start:Math.min(a,b),end:Math.max(a,b)};
}
export function statistics(metric,start=0,end=ROWS.length-1){
  if(!METRICS[metric]||!Number.isInteger(start)||!Number.isInteger(end))throw new Error('Invalid metric or date index');
  const lo=Math.max(0,Math.min(start,end)),hi=Math.min(ROWS.length-1,Math.max(start,end));
  const rows=ROWS.filter(row=>row.index>=lo&&row.index<=hi);
  if(!rows.length)return {count:0,minimum:null,maximum:null,average:null,total:0,rows};
  const minimum=rows.reduce((a,b)=>a[metric]<=b[metric]?a:b),maximum=rows.reduce((a,b)=>a[metric]>=b[metric]?a:b);
  const total=rows.reduce((sum,row)=>sum+row[metric],0);
  return {count:rows.length,minimum,maximum,average:total/rows.length,total,rows};
}
export function readStored(){
  let value;try{value=JSON.parse(analysisStorage().getItem(STORAGE)||'null');}catch(_){}
  const metric=METRICS[value?.metric]?value.metric:'visitors';
  const range=value&&rangeIndices(value.start,value.end);
  return {metric,range:range||{start:0,end:49}};
}
export function snapshot(metric,range){
  const stats=statistics(metric,range.start,range.end);
  return {schema:'championship-analysis.v1',metric,start:stats.rows[0].date,end:stats.rows.at(-1).date,count:stats.count,
    minimum:stats.minimum[metric],maximum:stats.maximum[metric],average:Number(stats.average.toFixed(2)),total:stats.total};
}
