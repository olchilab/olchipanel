(function () {
  'use strict';
  const raw = Number(new URLSearchParams(location.search).get('stage'));
  let stage = Number.isInteger(raw) && raw >= 0 && raw < 7 ? raw : 0;
  let data = ChampionshipDemo.fixture(stage);
  const presentation = new URLSearchParams(location.search).get('presentation')==='1';
  window.championshipPresentation=presentation;
  const namespace = 'olchipanel.championship.';
  window.demoRequests = [];
  try {
    sessionStorage.setItem(namespace+'lang','ko');
    if (!sessionStorage.getItem(namespace+'studio.theme')) sessionStorage.setItem(namespace+'studio.theme','light');
    if (document.documentElement.dataset.surface === 'index') {
      const tabs=JSON.parse(sessionStorage.getItem(namespace+'memo.tabs.v1')||'null');
      if(Array.isArray(tabs?.open)&&tabs.open.length&&!tabs.open.some(id=>data.memo.notes.some(note=>note.id===id)))sessionStorage.removeItem(namespace+'memo.tabs.v1');
      const pane=new URLSearchParams(location.search).get('pane');
      sessionStorage.setItem(namespace+'tab',['memo','plan','scope'].includes(pane)?pane:ChampionshipDemo.scenes[stage][2]);
      sessionStorage.setItem(namespace+'sel',stage===5?'demo-session-1':'demo-session-2');
      sessionStorage.setItem(namespace+'map.mode','graph');
    }
  } catch (_) {}
  window.fetch = async function (input, init = {}) {
    const url = new URL(typeof input === 'string' ? input : input.url, location.href);
    const method = (init.method || input.method || 'GET').toUpperCase();
    window.demoRequests.push({path:url.pathname,method});
    const reply = (body,status=200) => new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
    if (url.origin !== location.origin) return reply({error:'외부 API는 사용하지 않습니다.'},403);
    data=ChampionshipDemo.fixture(stage);
    if(method==='POST'&&url.pathname==='/api/memo'){
      let memo;try{memo=JSON.parse(init.body).memo;}catch(_){return reply({error:'잘못된 노트입니다.'},400);}
      if(!memo||!Array.isArray(memo.notes)||memo.notes.length>100||memo.notes.some(n=>!n||typeof n.id!=='string'||! /^(note-|demo-)[a-zA-Z0-9-]+$/.test(n.id)||typeof n.title!=='string'||typeof n.html!=='string'||n.html.length>65536)||new Set(memo.notes.map(n=>n.id)).size!==memo.notes.length)return reply({error:'노트 형식을 확인해 주세요.'},400);
      try{
        const key=namespace+'memo.edits.v1',saved=JSON.parse(sessionStorage.getItem(key)||'null');
        const edits=saved&&Array.isArray(saved.notes)&&Array.isArray(saved.deleted)?saved:{notes:[],deleted:[]};
        const fields=['title','html','pinned','order','parentId','collapsed'];
        for(const note of memo.notes){
          const previous=data.memo.notes.find(n=>n.id===note.id);
          if(!previous||fields.some(field=>note[field]!==previous[field])){
            edits.notes=edits.notes.filter(n=>n.id!==note.id);edits.notes.push(note);
          }
          edits.deleted=edits.deleted.filter(id=>id!==note.id);
        }
        for(const previous of data.memo.notes){
          if(!memo.notes.some(n=>n.id===previous.id)){
            edits.notes=edits.notes.filter(n=>n.id!==previous.id);
            if(!edits.deleted.includes(previous.id))edits.deleted.push(previous.id);
          }
        }
        sessionStorage.setItem(key,JSON.stringify(edits));
      }catch(_){return reply({error:'브라우저에 저장하지 못했습니다.'},500);}
      return reply({ok:true});
    }
    if(method==='PATCH'&&url.pathname==='/api/plan/item'){
      let body;try{body=JSON.parse(init.body);}catch(_){return reply({error:'잘못된 변경입니다.'},400);}
      const item=data.plan?.items.find(item=>item.id===url.searchParams.get('id'));
      if(!item||url.searchParams.get('plan')!==data.plan.id)return reply({error:'카드를 찾지 못했습니다.'},404);
      if(body.baseVersion!==data.plan.version)return reply({error:'다른 창에서 변경됐습니다. 다시 시도해 주세요.'},409);
      if(!body.patch||Object.keys(body.patch).length!==1||!['backlog','todo','in_progress','done','canceled'].includes(body.patch.status))return reply({error:'샘플 카드의 상태만 변경할 수 있습니다.'},400);
      try{
        const key=namespace+'plan-status.v1';const saved=JSON.parse(sessionStorage.getItem(key)||'null');
        const edits=saved&&Number.isSafeInteger(saved.revision)&&saved.revision>=0&&saved.items&&typeof saved.items==='object'?saved:{revision:0,items:{}};
        edits.items[item.id]=body.patch.status;edits.revision++;sessionStorage.setItem(key,JSON.stringify(edits));
      }catch(_){return reply({error:'브라우저에 저장하지 못했습니다.'},500);}
      return reply({ok:true,version:data.plan.version+1});
    }
    if (method !== 'GET') return reply({error:'이 체험에서는 제공하지 않는 변경입니다.'},405);
    switch (url.pathname) {
      case '/api/state': return reply(data.state);
      case '/api/memo': return reply({memo:data.memo});
      case '/api/plans': return reply(data.plan?[{id:data.plan.id,title:data.plan.title}]:[]);
      case '/api/plan': return data.plan?reply(data.plan):reply({error:'아직 플랜이 없는 단계입니다.'},404);
      default: return reply({error:'이 체험에서는 제공하지 않는 기능입니다.'},404);
    }
  };
  window.EventSource = class { close() {} addEventListener() {} removeEventListener() {} };
  window.addEventListener('DOMContentLoaded', () => {
    if(presentation){
      const version=document.querySelector('.theme-brand>span');
      if(version)version.textContent='0.8.2';
    }
    const help=document.querySelector('#helpBtn');
    if(help){help.innerHTML='<span class="tool-icon" aria-hidden="true">?</span><span>도움말</span>';help.setAttribute('aria-label','사용 방법 보기');}
    const blocked = '.tab-x,.setup-run,#exportBtn,#langBtn,#resumeArchive';
    document.addEventListener('click',e=>{
      if (e.target.closest(blocked)) { e.preventDefault(); e.stopImmediatePropagation(); }
      if (e.target.closest('#helpBtn')) { e.preventDefault(); e.stopImmediatePropagation(); window.parent.postMessage({type:'championship-guide'},location.origin); }
    },true);
    document.addEventListener('dblclick',e=>{
      if(e.target.closest('.tab-wrap')){e.preventDefault();e.stopImmediatePropagation();}
    },true);
    document.addEventListener('submit',e=>{if(!e.target.matches('#cardComposerForm,.memo-link-dialog form')){e.preventDefault();e.stopImmediatePropagation();}},true);
    document.addEventListener('keydown',e=>{
      if(document.documentElement.dataset.surface==='plan' && ['c','x','X','0','1','2','3','4','Delete','Backspace'].includes(e.key) && !e.target.closest('input,textarea')) {
        e.preventDefault();e.stopImmediatePropagation();
      }
    },true);
    const theme = () => {
      const themeButton=document.querySelector('#themeBtn'),dark=document.documentElement.dataset.theme==='dark';
      if(themeButton)themeButton.innerHTML='<span class="tool-icon" aria-hidden="true">◐</span><span>'+(dark?'밝게':'어둡게')+'</span>';
      if(window.parent!==window)window.parent.postMessage({type:'championship-theme',theme:document.documentElement.dataset.theme||'light'},location.origin);
      document.querySelector('#scopeFrame')?.contentWindow?.postMessage({type:'olchipanel-theme',theme:document.documentElement.dataset.theme||'light'},location.origin);
    };
    if(document.documentElement.dataset.surface==='index') {
      new MutationObserver(theme).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
      theme();
      window.addEventListener('message',async event=>{
        if(event.origin!==location.origin||event.source!==document.querySelector('#scopeFrame')?.contentWindow)return;
        if(event.data?.type==='championship-analysis-result'){
          if(window.championshipApplyAnalysis){
            try{await window.championshipApplyAnalysis();}
        catch(_){const status=document.querySelector('#memoState');if(status)status.textContent='분석 저장을 다시 시도해 주세요.';}
            return;
          }
          try{
            const key=namespace+'memo.edits.v1',edits=JSON.parse(sessionStorage.getItem(key)||'null');
            if(edits){edits.notes=edits.notes.filter(n=>n.id!=='demo-analysis-result');edits.deleted=edits.deleted.filter(id=>id!=='demo-analysis-result');sessionStorage.setItem(key,JSON.stringify(edits));}
          }catch(_){}
          try{sessionStorage.setItem(namespace+'memo.tabs.v1',JSON.stringify({schema:namespace+'memo-tabs.v1',open:['demo-analysis-result'],active:'demo-analysis-result'}));}catch(_){}
          const url=new URL(location.href);url.searchParams.set('pane','memo');location.replace(url.href);
        }
      });
    }
  });
  window.championshipStage = stage;
  window.addEventListener('championship-reset',()=>{window.championshipReset=true;});
  window.addEventListener('message',async event=>{
    if(event.origin!==location.origin||event.source!==window.parent)return;
    if(event.data?.type==='championship-show-stage'){
      if(!Number.isInteger(event.data.stage)||event.data.stage<0||event.data.stage>6)return;
      stage=event.data.stage;window.championshipStage=stage;
    }else if(event.data?.type!=='championship-focus-guide')return;
    // Restore the scene's context after free exploration, keeping local edits.
    for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();
    if(document.body.classList.contains('rail-closed'))document.querySelector('#railToggle')?.click();
    const sessionId=stage===5?'demo-session-1':'demo-session-2';
    document.querySelector('.panel-tab[data-session-id="'+sessionId+'"]')?.click();
    const tabs=['#tabPlan','#tabSituation','#tabScope','#tabMemo','#tabNeeds','#tabSituation','#tabSituation'];
    document.querySelector(tabs[stage])?.click();
    if([1,5,6].includes(stage))document.querySelector('#mapGraphBtn')?.click();
    document.querySelector('.panel-tab[data-session-id="'+sessionId+'"]')?.scrollIntoView({block:'nearest'});
    window.championshipTourStage=stage;

  });
})();
