(()=>{
 function paintTools(){
  const ko=document.documentElement.lang!=='en',dark=document.documentElement.dataset.theme==='dark';
  const help=document.getElementById('helpBtn'),theme=document.getElementById('themeBtn');
  if(help)help.innerHTML='<span class="tool-icon" aria-hidden="true">?</span><span>'+(ko?'도움말':'Help')+'</span>';
  if(theme)theme.innerHTML='<span class="tool-icon" aria-hidden="true">◐</span><span>'+(dark?(ko?'밝게':'Light'):(ko?'어둡게':'Dark'))+'</span>';
 }
 paintTools();new MutationObserver(paintTools).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','lang']});
 const hints={tabSituation:'작업의 흐름과 진행 상황을 확인합니다.',tabPlan:'할 일을 상태별 보드로 관리합니다.',tabScope:'날짜별 자료를 분석하고 노트·플랜에 반영합니다.',tabNeeds:'답변이나 승인이 필요한 요청을 확인합니다.',tabRecords:'변경·결정·실패한 시도를 확인합니다.',tabMemo:'모든 세션이 함께 사용하는 노트를 읽고 편집합니다.',mapTreeBtn:'작업의 단계와 분기를 트리로 봅니다.',mapGraphBtn:'기록된 작업 순서와 현재 위치를 워크플로우로 봅니다.',viewTabStack:'잠시 멈춘 일과 다시 시작할 지점을 확인합니다.',viewTabChanges:'변경한 파일과 실행·검증 기록입니다.',viewTabDec:'결정한 내용과 확인되지 않은 가정입니다.',viewTabDeadends:'실패한 시도와 피해야 할 이유입니다.'};
 const tip=document.createElement('div');tip.id='studio-tip';tip.role='tooltip';tip.hidden=true;document.body.appendChild(tip);
 let timer,owner;
 function hide(){clearTimeout(timer);tip.hidden=true;if(owner)owner.removeAttribute('aria-describedby');owner=null;}
 Object.assign(hints,{exportBtn:'현재 패널의 내용을 파일로 내보냅니다.',helpBtn:'OlchiPanel 사용법과 단축키를 확인합니다.',langBtn:'한국어와 영어를 전환합니다.',themeBtn:()=>document.documentElement.dataset.theme==='dark'?'라이트 모드로 전환합니다.':'다크 모드로 전환합니다.'});
 for(const [id,text] of Object.entries(hints)){
  const tab=document.getElementById(id);if(!tab)continue;
  function show(){hide();tab.removeAttribute('title');owner=tab;timer=setTimeout(()=>{tip.textContent=typeof text==='function'?text():text;tip.hidden=false;tab.setAttribute('aria-describedby',tip.id);const r=tab.getBoundingClientRect();tip.style.left=Math.max(8,Math.min(r.left,innerWidth-tip.offsetWidth-8))+'px';tip.style.top=Math.min(r.bottom+8,innerHeight-tip.offsetHeight-8)+'px';},1000);}
  tab.addEventListener('mouseenter',show);tab.addEventListener('focus',show);tab.addEventListener('mouseleave',hide);tab.addEventListener('blur',hide);tab.addEventListener('click',hide);
 }
 document.addEventListener('keydown',e=>{if(e.key==='Escape')hide();});window.addEventListener('resize',hide);document.addEventListener('wheel',hide,{passive:true});
})();
