(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const key = 'olchipanel.championship.progress.v1';
  let stage = 0, started = false;
  let appReady=false, pendingNavigation=false, guiding=false, frameTick=0, focusGuide=false, guidedTarget=null;
  const watchedDocs=new WeakSet();
  const guidesKey='olchipanel.championship.guides.v1';
  const foldedKey='olchipanel.championship.guide-folded.v1';
  function setAppReady(ready){appReady=ready;$('practice').disabled=!ready;}
  function showStage(){if(appReady)$('app').contentWindow.postMessage({type:'championship-show-stage',stage},location.origin);}
  $('app').addEventListener('load',()=>{
    try{
      setAppReady(new URL($('app').contentWindow.location.href).searchParams.has('stage'));
      if(appReady&&pendingNavigation){pendingNavigation=false;showStage();}
    }catch(_){setAppReady(false);}
  });
  const guidance=[
    ['플랜 카드를 옮겨 보세요','카드를 누르면 상세 내용을 볼 수 있습니다. 상태를 바꾸려면 카드 왼쪽 점 손잡이를 잡고 IN PROGRESS 또는 DONE 열로 끌어 놓으세요.','변경한 상태는 체험 중 이어집니다. 새로고침하면 처음부터 시작합니다.'],
    ['작업에 연결된 노트를 열어 보세요','“날짜별 방문·매출 분석” 상자를 누르고 “페이지 열기”를 눌러 보세요. 특정 노트 페이지를 읽거나 수정하고, 돌아가기 버튼으로 보던 그래프에 복귀합니다.','노트 페이지 연결은 데모 전용 미리보기입니다. 상자를 끌어 위치를 바꿀 수도 있습니다.'],
    ['그래프에서 관심 구간을 선택하세요','그래프 위를 가로로 드래그하거나 시작·끝 날짜를 바꿔 보세요. “노트·플랜에 반영”을 누르면 결과와 후속 작업이 생깁니다.','방문자와 매출을 전환하며 실제 구간 통계를 확인합니다.'],
    ['새 노트를 작성해 보세요','“+ 새 노트”를 누르고 제목과 본문을 입력하세요. 서식·체크 목록을 쓸 수 있고, 분석 결과 노트도 직접 수정할 수 있습니다.','작성한 노트는 두 AI 세션에서 함께 보고 다시 열 수 있습니다.'],
    ['나에게 온 요청을 열어 보세요','요청 항목을 클릭하면 요청한 AI, 작업 목표와 현재 맥락이 열립니다. 필요한 내용을 복사해 에이전트 대화로 가져갈 수 있습니다.','요청을 읽는 것과 해결하는 것은 별도로 유지됩니다.'],
    ['다음 세션에 넘길 맥락을 확인하세요','왼쪽 “이전 분석 세션”을 선택한 뒤 목표 옆 “재개”를 누르세요. 현재 상태·최근 기록·다음 작업과 미해결 요청을 확인하고 복사할 수 있습니다.','복사는 실제 AI 실행이나 답변 전송을 대신하지 않습니다.'],
    ['Claude 세션으로 전환해 보세요','왼쪽 “자료 검토 · CLAUDE”를 누르세요. 다른 AI가 맡은 작업을 보고 플랜·노트 탭을 열어 앞서 남긴 내용을 확인하세요.','Codex와 Claude가 같은 작업 자료를 이어 보는 가상 협업 흐름입니다.']
  ];
  function watchDocument(doc){
    if(!doc?.documentElement||watchedDocs.has(doc))return;
    watchedDocs.add(doc);
    doc.addEventListener('pointerdown',()=>foldGuide(),true);
    doc.addEventListener('keydown',event=>{if(event.key==='Escape'&&guiding){foldGuide();$('reopen-guide').focus();}},true);
    new MutationObserver(()=>{
      const appDoc=$('app').contentDocument;
      const docs=[appDoc,...Array.from(appDoc?.querySelectorAll('iframe')||[],f=>f.contentDocument)];
      $('guideResume').style.visibility=docs.some(d=>d?.querySelector('dialog[open]'))?'hidden':'';
    }).observe(doc.documentElement,{subtree:true,attributes:true,attributeFilter:['open']});
  }
  function guideTarget(){
    const doc=$('app').contentDocument;
    if(!appReady||!doc||$('app').contentWindow.championshipTourStage!==stage)return null;
    watchDocument(doc);
    for(const f of doc.querySelectorAll('iframe'))watchDocument(f.contentDocument);
    const selectors=['#planFrame','#graphNodes .graph-node.now','#scopeFrame','#memoNew','#needslist .need-item','.resume-trigger','.panel-tab[data-session-id="demo-claude"]'];
    let target=doc.querySelector(selectors[stage]);
    if(stage===0){
      const planDoc=target?.contentDocument;
      const status=ChampionshipDemo.fixture().plan.items.find(item=>item.id==='traffic').status;
      planDoc?.querySelector('.col.collapsed[data-st="'+status+'"] .col-collapse')?.click();
      target=planDoc?.querySelector('.card[data-id="traffic"]');
    }
    if(stage===2)target=target?.contentDocument?.querySelector('.range-row');
    if(target&&target!==guidedTarget){guidedTarget=target;target.scrollIntoView({block:'nearest',inline:'nearest'});}
    return target;
  }
  function targetRect(target){
    if(!target?.isConnected)return null;
    const box=target.getBoundingClientRect();
    if(!box.width||!box.height)return null;
    let left=box.left,top=box.top,right=box.right,bottom=box.bottom,win=target.ownerDocument.defaultView;
    while(win!==window){
      const frame=win.frameElement;if(!frame)return null;
      const r=frame.getBoundingClientRect();
      left=Math.max(0,left)+r.left;top=Math.max(0,top)+r.top;
      right=Math.min(frame.clientWidth,right)+r.left;bottom=Math.min(frame.clientHeight,bottom)+r.top;
      win=frame.ownerDocument.defaultView;
    }
    if(right<=left||bottom<=top)return null;
    return {left,top,right,bottom,width:right-left,height:bottom-top};
  }
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  function positionGuide(){
    if(!guiding)return;
    const target=guideTarget(),r=targetRect(target),panel=$('stepGuide'),outline=$('tourHighlight');
    if(r){
      const app=$('app').getBoundingClientRect();
      const bounds={left:Math.max(8,app.left+8),right:Math.min(innerWidth-8,app.right-8),top:app.top+8,bottom:app.bottom-8};
      panel.hidden=false;outline.hidden=false;
      panel.style.maxHeight=(bounds.bottom-bounds.top)+'px';
      const w=panel.offsetWidth,h=panel.offsetHeight,gap=18;
      const candidates=[
        {side:'right',x:r.right+gap,y:r.top},
        {side:'left',x:r.left-w-gap,y:r.top},
        {side:'bottom',x:r.left,y:r.bottom+gap},
        {side:'top',x:r.left,y:r.top-h-gap}
      ].map(c=>({...c,x:clamp(c.x,bounds.left,bounds.right-w),y:clamp(c.y,bounds.top,bounds.bottom-h)}));
      const overlap=c=>Math.max(0,Math.min(c.x+w,r.right+5)-Math.max(c.x,r.left-5))*Math.max(0,Math.min(c.y+h,r.bottom+5)-Math.max(c.y,r.top-5));
      candidates.sort((a,b)=>overlap(a)-overlap(b));const c=candidates[0];
      panel.style.left=c.x+'px';panel.style.top=c.y+'px';panel.dataset.side=c.side;
      panel.style.setProperty('--arrow-x',clamp((r.left+r.right)/2-c.x,18,w-18)+'px');
      panel.style.setProperty('--arrow-y',clamp((r.top+r.bottom)/2-c.y,18,h-18)+'px');
      Object.assign(outline.style,{left:(r.left-4)+'px',top:(r.top-4)+'px',width:(r.width+8)+'px',height:(r.height+8)+'px'});
      panel.style.visibility='visible';
      if(focusGuide){focusGuide=false;$('practice').focus({preventScroll:true});}
    }else{panel.style.visibility='hidden';outline.hidden=true;}
    frameTick=requestAnimationFrame(positionGuide);
  }
  function hideGuide(){
    guiding=false;cancelAnimationFrame(frameTick);$('stepGuide').hidden=true;$('tourHighlight').hidden=true;
    $('guideResume').hidden=true;$('guide').hidden=false;try{sessionStorage.removeItem(foldedKey);}catch(_){}
  }
  function showFoldedGuide(){
    $('resume-count').textContent=String(stage+1).padStart(2,'0')+' / 07';
    $('resume-next').textContent=stage===6?'안내 마치기':'다음 안내 →';
    $('guideResume').hidden=false;$('guide').hidden=true;
    try{sessionStorage.setItem(foldedKey,String(stage));}catch(_){}
  }
  function foldGuide(){
    if(!guiding)return;
    hideGuide();showFoldedGuide();
  }
  function stepGuide(force=false){
    hideGuide();
    if(!started||(!force&&sessionStorage.getItem(guidesKey)==='off'))return;
    $('stepGuideCount').textContent=String(stage+1).padStart(2,'0')+' / 07 · 사용 안내';
    $('stepGuideTitle').textContent=guidance[stage][0];$('stepGuideBody').textContent=guidance[stage][1];$('stepGuideResult').textContent=guidance[stage][2];
    $('guide-next').textContent=stage===6?'확인 · 안내 마치기':'다음 →';
    $('stepGuide').style.visibility='hidden';guiding=true;focusGuide=true;guidedTarget=null;positionGuide();
  }
  function finishGuide(){
    hideGuide();
    $('scene-title').textContent='안내를 모두 확인했어요';
    $('scene-description').textContent='이제 탭을 자유롭게 둘러보거나 사용 방법을 확인해 보세요.';
    $('guide').textContent='마지막 안내 다시 보기';$('guide').focus();
  }
  try {
    const saved = JSON.parse(sessionStorage.getItem(key)||'null');
    if(saved && Number.isInteger(saved.stage) && saved.stage>=0 && saved.stage<7){stage=saved.stage;started=saved.started===true;}
    document.documentElement.dataset.theme=sessionStorage.getItem('olchipanel.championship.studio.theme')==='dark'?'dark':'light';
  } catch (_) {}
  function render() {
    $('intro').hidden=started;$('experience').hidden=!started;
    if(started) {
      const scene=ChampionshipDemo.scenes[stage];
      $('counter').textContent=String(stage+1).padStart(2,'0')+' / 07';
      $('guide').textContent='이번 단계 안내';
      $('scene-title').textContent=scene[0];$('scene-description').textContent=scene[1];
      $('previous').disabled=stage===0;
      $('next').textContent=stage===6?'사용 방법 · GitHub ↗':'다음 단계 →';
      const path='app.html?stage='+stage;
      if(!$('app').getAttribute('src')){pendingNavigation=true;setAppReady(false);$('app').src=path;}else showStage();
    }
    try {sessionStorage.setItem(key,JSON.stringify({stage,started}));}catch(_){}
  }
  function guide(){hideGuide();if(!$('usage').open)$('usage').showModal();}
  $('start').onclick=()=>{started=true;render();stepGuide();};
  $('home').onclick=()=>{resetWorkspace();started=false;render();$('start').focus();};
  $('previous').onclick=()=>{if(stage>0){stage--;render();stepGuide();}};
  $('next').onclick=()=>{if(stage<6){stage++;render();stepGuide();}else guide();};
  function resetWorkspace(){try{$('app').contentWindow.dispatchEvent(new Event('championship-reset'));}catch(_){}window.resetChampionshipSession();stage=0;hideGuide();$('app').removeAttribute('src');}
  $('restart').onclick=()=>{resetWorkspace();render();stepGuide();};
  $('guide').onclick=()=>{showStage();stepGuide(true);};$('intro-guide').onclick=guide;
  $('practice').onclick=()=>{if(!appReady)return;const target=guideTarget();foldGuide();if(target){if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}};
  $('resume-next').onclick=$('guide-next').onclick=()=>{if(stage<6){stage++;render();stepGuide(true);}else finishGuide();};
  $('skip-guides').onclick=()=>{sessionStorage.setItem(guidesKey,'off');hideGuide();$('guide').focus();};
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&guiding){foldGuide();$('reopen-guide').focus();}});
  $('reopen-guide').onclick=()=>{showStage();stepGuide(true);};
  document.addEventListener('keydown',event=>{
    const key=event.code==='Backquote'?'`':event.key;
    if(!started||!appReady||! /^[`1-5qwe]$/i.test(key)||event.defaultPrevented||event.isComposing||event.repeat||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey||$('usage').open)return;
    if(event.target?.isContentEditable||event.target?.closest('input,textarea,select,[contenteditable]'))return;
    event.preventDefault();foldGuide();$('app').contentWindow.postMessage({type:'olchipanel-view-shortcut',key},location.origin);
  });
  $('close-guide').onclick=$('explore').onclick=()=>$('usage').close();
  window.addEventListener('message',event=>{
    if(event.origin!==location.origin||event.source!==$('app').contentWindow)return;
    if(event.data?.type==='championship-guide')guide();
    if(event.data?.type==='olchipanel-view-shortcut-used')foldGuide();
    if(event.data?.type==='championship-theme' && ['light','dark'].includes(event.data.theme))document.documentElement.dataset.theme=event.data.theme;
  });
  render();
  if(started&&sessionStorage.getItem(foldedKey)===String(stage))showFoldedGuide();
})();
