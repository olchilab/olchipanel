import React,{useEffect,useMemo,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Graph} from './Graph.jsx';
import {ROWS,METRICS,STORAGE,SNAPSHOT,DEMO,analysisStorage,readStored,rangeIndices,statistics,snapshot} from './model.js';
import './graph.css';
import './panel.css';

const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
const fmt=(v)=>Number(v).toLocaleString('ko-KR',{maximumFractionDigits:1});
function Scope(){
  const presentation=new URLSearchParams(location.search).get('presentation')==='1';
  const [initial]=useState(readStored);
  const [metric,setMetric]=useState(initial.metric);
  const [range,setRange]=useState(initial.range);
  const [tool,setTool]=useState('analysis');
  const [markers,setMarkers]=useState([]);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const data=useMemo(()=>ROWS.map(row=>({index:row.index,x:row.index,value:row[metric]})),[metric]);
  const bounds=useMemo(()=>({xMin:0,xMax:49,yMin:0,yMax:Math.ceil(Math.max(...data.map(d=>d.value))*1.15/(metric==='revenue'?10000:100))*(metric==='revenue'?10000:100)}),[data,metric]);
  const [view,setView]=useState(bounds);
  const stats=useMemo(()=>statistics(metric,range.start,range.end),[metric,range]);
  useEffect(()=>{setView(bounds);setMarkers([]);setMessage('');},[bounds]);
  useEffect(()=>{
    try{analysisStorage().setItem(STORAGE,JSON.stringify({metric,start:ROWS[range.start].date,end:ROWS[range.end].date}));}catch(_){}
    setMessage('');
  },[metric,range]);
  useEffect(()=>{
    function theme(e){if(e.source===parent&&e.origin===location.origin&&e.data?.type==='olchipanel-theme'&&['light','dark'].includes(e.data.theme))document.documentElement.dataset.theme=e.data.theme;}
    window.addEventListener('message',theme);
    try{document.documentElement.dataset.theme=parent.document.documentElement.dataset.theme||'light';}catch(_){}
    return()=>window.removeEventListener('message',theme);
  },[]);
  function normalized(v){
    const sx=clamp(v.xMax-v.xMin,1,49),sy=clamp(v.yMax-v.yMin,bounds.yMax*.02,bounds.yMax);
    const xMin=clamp(v.xMin,0,49-sx),yMin=clamp(v.yMin,0,bounds.yMax-sy);
    return {xMin,xMax:xMin+sx,yMin,yMax:yMin+sy};
  }
  function zoom(center,factor){setView(current=>{
    const cx=center?.x??(current.xMin+current.xMax)/2,cy=center?.value??(current.yMin+current.yMax)/2;
    const sx=(current.xMax-current.xMin)*factor,sy=(current.yMax-current.yMin)*factor;
    return normalized({xMin:cx-sx/2,xMax:cx+sx/2,yMin:cy-sy/2,yMax:cy+sy/2});
  });}
  function dateChange(which,value){
    const selected=rangeIndices(which==='start'?value:ROWS[range.start].date,which==='end'?value:ROWS[range.end].date);
    if(!selected){setError('샘플 기간 안의 날짜를 선택하세요.');return;}
    setError('');setRange(selected);
  }
  function reflect(){
    const result=snapshot(metric,range);
    try{analysisStorage().setItem(SNAPSHOT,JSON.stringify(result));}
    catch(_){setMessage('브라우저 저장소를 사용할 수 없어 반영하지 못했습니다.');return;}
    if(parent!==window)parent.postMessage({type:DEMO?'championship-analysis-result':'olchipanel-analysis-result',result},location.origin);
    else setMessage('샘플 결과를 저장했습니다. 패널에서 노트를 확인하세요.');
  }
  const full=range.start===0&&range.end===49;
  const tools=[['analysis','구간 선택'],['zoom-in','확대'],['zoom-out','축소'],['pan','이동'],['point','점 표시']];
  return <main className="scope-workspace" data-metric={metric}>
    <header className="scope-header"><div><h1>자료 분석</h1><p>OlchiScope · 웹사이트 추이{presentation?'':' 샘플'}</p></div>
      <label className="metric-field">지표 <select aria-label="분석 지표" value={metric} onChange={e=>setMetric(e.target.value)}>{Object.entries(METRICS).map(([key,m])=><option key={key} value={key}>{m.label}</option>)}</select></label></header>
    <nav className="scope-tools" aria-label="그래프 도구">{tools.map(([id,label])=><button key={id} aria-pressed={tool===id} onClick={()=>setTool(id)}>{label}</button>)}<button onClick={()=>setView(bounds)}>전체 보기</button><span>2026.08.01–09.19 · 가상 자료</span></nav>
    <Graph data={data} view={view} bounds={bounds} minimumSpan={{x:1,y:bounds.yMax*.02}} tool={tool} mode={1} markers={markers}
      formatX={x=>ROWS[clamp(Math.round(x),0,49)].date.slice(5).replace('-','/')}
      formatY={(v,axis)=>metric==='revenue'&&axis?fmt(v/10000)+'만':fmt(v)+(axis?'':' '+METRICS[metric].unit)} yLabel={METRICS[metric].axis}
      onToggleMarker={i=>setMarkers(current=>current.includes(i)?current.filter(v=>v!==i):[...current.slice(-3),i])}
      onMoveMarker={(pos,i)=>setMarkers(current=>current.map((value,index)=>index===pos?i:value))}
      onPan={delta=>setView(current=>{const span=current.xMax-current.xMin;const xMin=clamp(current.xMin+delta,0,49-span);return {...current,xMin,xMax:xMin+span};})}
      onZoomAt={zoom} onZoomTo={v=>setView(normalized(v))} onPinch={v=>setView(normalized(v))}
      analysisRange={full?null:{startTime:range.start,endTime:range.end}}
      onAnalysisRange={r=>{setError('');setRange({start:clamp(Math.round(Math.min(r.startTime,r.endTime)),0,49),end:clamp(Math.round(Math.max(r.startTime,r.endTime)),0,49)});}}
    />
    <section className="scope-results" aria-label="선택 구간 분석 결과" data-count={stats.count}>
      <div className="range-row"><strong>분석 구간</strong><label>시작 <input aria-label="시작 날짜" type="date" min={ROWS[0].date} max={ROWS[49].date} value={ROWS[range.start].date} onChange={e=>dateChange('start',e.target.value)}/></label><span>–</span><label>끝 <input aria-label="끝 날짜" type="date" min={ROWS[0].date} max={ROWS[49].date} value={ROWS[range.end].date} onChange={e=>dateChange('end',e.target.value)}/></label><button onClick={()=>{setRange({start:0,end:49});setError('');}} disabled={full}>전체 기간</button></div>
      {error&&<p role="alert">{error}</p>}
      <dl className="stat-list"><div><dt>일평균</dt><dd data-stat="average">{fmt(stats.average)}<small>{METRICS[metric].unit}</small></dd></div><div><dt>최소 · {stats.minimum.date.slice(5)}</dt><dd data-stat="minimum">{fmt(stats.minimum[metric])}<small>{METRICS[metric].unit}</small></dd></div><div><dt>최대 · {stats.maximum.date.slice(5)}</dt><dd data-stat="maximum">{fmt(stats.maximum[metric])}<small>{METRICS[metric].unit}</small></dd></div><div><dt>{metric==='revenue'?'구간 매출 합계':'분석 일수'}</dt><dd data-stat="fourth">{metric==='revenue'?fmt(stats.total):stats.count}<small>{metric==='revenue'?'원':'일'}</small></dd></div></dl>
      <div className="result-action"><p>{metric==='visitors'?'일별 방문자 수입니다. 기간 전체의 중복 제거 방문자 수는 알 수 없습니다.':'선택 날짜의 매출 합계와 일평균입니다.'}</p><button className="primary" onClick={reflect}>노트·플랜에 반영 →</button></div>
      {message&&<p role="status">{message}</p>}
    </section>
  </main>;
}
createRoot(document.getElementById('root')).render(<Scope/>);
