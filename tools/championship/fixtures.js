(function () {
  'use strict';
  const scenes = [
    ['플랜 한눈에 보기', '준비된 플랜에서 AI의 작업과 진행 상태를 확인하고 카드를 옮겨 봅니다.', 'plan'],
    ['작업 흐름 살펴보기', '같은 작업의 목표·분기·다음 행동을 그래프로 확인합니다.', 'situation'],
    ['자료 분석', '방문자 수·매출을 날짜별로 살펴보고 선택 구간을 분석합니다.', 'scope'],
    ['노트와 다음 검토', '분석 결과를 기록하고 원인을 확인할 두 갈래 작업을 정리합니다.', 'memo'],
    ['내가 결정할 일', 'AI가 정할 수 없는 선택은 요청으로 남깁니다.', 'needs'],
    ['이전 세션의 인계', '이전 세션에 남긴 결정·중단점·미해결 요청을 확인합니다.', 'situation'],
    ['여러 AI와 이어가기', 'Codex와 Claude가 같은 플랜·노트를 참고하는 모습을 확인합니다.', 'situation']
  ];
  // Tour steps select a view; the workspace data stays the same throughout.
  function fixture() {
    const time = new Date(Date.now() - 60000).toISOString();
    const step = (id, label, status, children = [], extra = {}) => ({id,label,status,children,...extra});
    const tree = step('launch', '웹사이트 추이 점검', 'container', [
      step('scope', '목표와 대상 정리', 'done'),
      step('plan', '작업 순서와 완료 기준', 'done'),
      step('analysis', '날짜별 방문·매출 분석', 'now'),
      step('review', '두 갈래 검토', 'container', [
        step('traffic', '유입 경로 확인', 'next', [], {branch:true,weight:'fork'}),
        step('sales', '구매 전환 자료 확인', 'pause', [], {branch:true,weight:'fork'})
      ]),
      step('verify', '유입 경로별 자료 요청', 'pause')
    ]);
    const decisions = [{text:'유입 경로별 자료부터 확인한다. 현재 날짜별 집계만으로 감소 원인을 단정하지 않는다.',kind:'decision'}];
    const pending = [{text:'유입 경로와 구매 전환 자료를 확인해 주세요.',hot:true}];
    const changes = [
      {kind:'add',target:'작업 플랜',summary:'자료 확인·분석·검토의 완료 기준을 정리했습니다.',at:time},
      {kind:'add',target:'공통 노트',summary:'분석 기준과 추가 확인할 내용을 정리했습니다.',at:time},
      {kind:'edit',target:'검토 순서',summary:'유입 경로별 자료부터 확인하기로 했습니다.',at:time},
      {kind:'add',target:'세션 이어받기',summary:'이전 목표·플랜·결정·미해결 요청을 이어받았습니다.',at:time}
    ];
    const session = {schema:'olchipanel.v1',id:'demo-session-2',agent:'codex',name:'웹사이트 분석',cwd:'/projects/웹사이트-분석',workspace:'웹사이트 분석',started:time,updated:time,alive:true,
      goal:'웹사이트 방문·매출 추이 점검',map:{tree,back:'유입 경로별 자료 요청'},
      stack:[{text:'유입 경로별 자료 요청',resume:'선택 구간의 유입 경로별 자료를 요청하고 감소 원인을 검토한다.',at:time}],
      decisions,changes,deadends:[],pending,plan_id:'demo-plan',resumed_from:'demo-session-1'};
    const items = [
      ['scope','확인할 지표 정리','done','날짜별 방문자 수·매출을 각각 확인한다. 단위가 다른 지표를 같은 Y축에 겹치지 않는다.'],
      ['analysis','관심 구간 분석','in_progress','날짜 구간을 선택하고 일평균·최소·최대를 기록한다.'],
      ['traffic','유입 경로별 자료 확인','todo','날짜별 집계만으로 유입 경로의 변화를 알 수 없으므로 추가 자료를 요청한다.'],
      ['conversion','구매 전환 자료 확인','todo','방문자 수와 매출의 차이를 설명할 구매 건수·환불 자료 등을 따로 확인한다.'],
      ['approve','원인 가설 검토','todo','원인이 확인되기 전 광고 변경이나 가격 조정을 실행하지 않는다.']
    ].map(([id,title,status,note],order)=>({id,title,status,note,order,priority:2,labels:id==='approve'?['review']:[]}));
    const plan = {schema:'olchipanel.plan.v1',id:'demo-plan',title:'웹사이트 추이 점검',version:1,updated:time,items};
    let notes = [
      {id:'demo-note-criteria',title:'웹사이트 분석 기준',html:'<h1>웹사이트 분석 기준</h1><p>미리 준비한 50일의 가상 자료로 방문자 수와 매출 추이를 확인합니다.</p><h2>확인할 것</h2><ul><li>X축: 날짜 / Y축: 선택한 지표</li><li>기간을 선택해 일평균·최소·최대 확인</li><li>매출은 구간 합계, 방문자는 분석 일수 확인</li></ul><h2>해석 기준</h2><p>일별 방문자 수를 더해 기간 전체의 중복 제거 방문자 수라고 표현하지 않습니다. 날짜별 집계만으로 변동 원인을 단정하지 않습니다.</p>',pinned:true},
      {id:'demo-note-next',title:'다음 세션 참고',html:'<h1>다음 세션 참고</h1><p>유입 경로별 자료부터 확인하기로 했습니다.</p><p>다음 작업: 분석 노트의 날짜 구간을 확인하고 추가 자료를 요청합니다.</p><p>남은 요청: 유입 경로별 자료 확인.</p><p>이 노트는 공통 문서입니다. 후속 에이전트가 필요할 때 다시 읽습니다.</p>',pinned:false}
    ].map((n,order)=>({...n,order,parentId:null,collapsed:false,created:time,updated:time}));
    const business=window.ChampionshipBusiness;
    let result=null;
    if(business){try{
      const saved=JSON.parse(sessionStorage.getItem('olchipanel.championship.analysis-result.v1')||'null');
      const range=saved&&business.rangeIndices(saved.start,saved.end);
      if(range&&business.METRICS[saved.metric])result=business.snapshot(saved.metric,range);
    }catch(_){} }
    if(result){
      const metric=business.METRICS[result.metric],fmt=n=>Number(n).toLocaleString('ko-KR',{maximumFractionDigits:1});
      notes.unshift({id:'demo-analysis-result',title:metric.label+' 분석 결과',html:'<h1>'+metric.label+' 분석 결과</h1><p>가상 자료 · '+result.start+' ~ '+result.end+' · '+result.count+'일</p><ul><li>일평균: '+fmt(result.average)+' '+metric.unit+'</li><li>최소: '+fmt(result.minimum)+' '+metric.unit+'</li><li>최대: '+fmt(result.maximum)+' '+metric.unit+'</li>'+(result.metric==='revenue'?'<li>구간 매출 합계: '+fmt(result.total)+' 원</li>':'')+'</ul><h2>다음 확인</h2><p>선택 구간의 유입 경로·구매 전환 자료를 확인합니다. 이 집계만으로 변화의 원인을 단정하지 않습니다.</p>',pinned:true,order:-1,parentId:null,created:time,updated:time});
      items.push({id:'analysis-followup',title:'선택 구간 추가 자료 확인',status:'todo',priority:2,labels:['review'],order:5,note:result.start+' ~ '+result.end+' '+metric.label+' 분석 결과를 기준으로 원인을 확인할 추가 자료를 요청한다.'});
      changes.push({kind:'add',target:'자료 분석 결과',summary:metric.label+' '+result.start+' ~ '+result.end+' 결과를 노트·플랜에 반영했습니다.',at:time});
      session.plan_id=plan.id;
    }
    try {
      const edits=JSON.parse(sessionStorage.getItem('olchipanel.championship.plan-status.v1')||'null');
      if(edits&&Number.isSafeInteger(edits.revision)&&edits.revision>=0&&edits.items){
        for(const item of items){const status=edits.items[item.id];if(['backlog','todo','in_progress','done','canceled'].includes(status))item.status=status;}
        plan.version+=edits.revision;
      }
    } catch (_) {}
    try {
      const edits=JSON.parse(sessionStorage.getItem('olchipanel.championship.memo.edits.v1')||'null');
      if(edits&&Array.isArray(edits.notes)&&Array.isArray(edits.deleted)){
        notes=notes.filter(n=>!edits.deleted.includes(n.id));
        for(const note of edits.notes){
          const index=notes.findIndex(n=>n.id===note.id);
          if(index<0)notes.push(note);else notes[index]=note;
        }
      }
    }catch(_){}
    const assistant={...session,id:'demo-claude',agent:'claude',name:'자료 검토',cwd:'/projects/자료-검토',workspace:'자료 검토',alive:true,resumed_from:undefined,
      goal:'방문·매출 분석 근거 검토',
      map:{tree:step('claude-review','분석 근거 검토','container',[
        step('review-note','Codex가 정리한 공통 노트 확인','done'),
        step('review-evidence','유입 경로·구매 전환 근거 검토','now'),
        step('review-return','검토 결과를 후속 작업에 전달','next')]),back:''},
      pending:[{text:'방문 감소와 매출 변화를 구분하려면 유입 경로별 자료가 필요합니다. 추가 자료를 확인해 주세요.',hot:false}],
      changes:[{kind:'add',target:'공통 노트 검토',summary:'같은 플랜과 노트를 참고해 분석 근거를 검토합니다.',at:time}],decisions:[],stack:[]};
    const previous={...session,id:'demo-session-1',name:'이전 분석 세션',alive:false,resumed_from:undefined,
      started:new Date(Date.now()-3600000).toISOString(),updated:new Date(Date.now()-600000).toISOString(),
      changes:changes.filter(change=>change.target!=='세션 이어받기')};
    const sessions=[session,assistant,previous];
    return {state:{sessions,total:sessions.length,version:'0.8.2',latest:null,pid:null,windowOpen:true},plan,memo:{schema:'olchipanel.memo.v4',selected:notes[0]?.id||null,notes}};
  }

  window.ChampionshipDemo = {scenes,fixture};
})();
