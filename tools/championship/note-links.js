// Inserted inside the generated demo renderer only. No app/MCP contract changes.
  var demoNoteLinksKey='olchipanel.championship.node-notes.v1';
  var demoNoteReturn=null;
  // Flush the previous editor before merging the new analysis page. A reload
  // could otherwise let pagehide save the old memo and delete the new result.
  window.championshipApplyAnalysis=async function(){
    if(memoTimer)await memoSaveNow(memoLoadedFor);
    var key='olchipanel.championship.memo.edits.v1';
    var edits=JSON.parse(sessionStorage.getItem(key)||'null');
    if(edits){edits.notes=edits.notes.filter(function(n){return n.id!=='demo-analysis-result';});edits.deleted=edits.deleted.filter(function(id){return id!=='demo-analysis-result';});sessionStorage.setItem(key,JSON.stringify(edits));}
    var response=await fetch('/api/memo');if(!response.ok)throw new Error('분석 노트를 불러오지 못했습니다.');
    var loaded=await response.json();memoDoc=loaded.memo;memoLoadedFor=COMMON_NOTE_SCOPE;
    demoNoteReturn=null;demoBackButton.hidden=true;selectMemo('demo-analysis-result');showTab('memo');
    await memoSaveNow(memoLoadedFor);refresh();
  };
  function demoLinkedNoteId(nodeId){
    var key=current+':'+nodeId;
    try {
      var saved=JSON.parse(sessionStorage.getItem(demoNoteLinksKey)||'{}');
      if(Object.prototype.hasOwnProperty.call(saved,key))return saved[key];
    }catch(_){}
    return ({scope:'demo-note-criteria',analysis:'demo-note-criteria',traffic:'demo-note-next','review-note':'demo-note-criteria'})[nodeId]||null;
  }
  function demoNotePath(note){
    var labels=[note.title||'제목 없는 페이지'],seen=new Set([note.id]),parent=memoById(note.parentId);
    while(parent&&!seen.has(parent.id)){seen.add(parent.id);labels.unshift(parent.title||'제목 없는 페이지');parent=memoById(parent.parentId);}
    return labels.join(' / ');
  }
  async function demoPrepareNotes(){
    if(memoLoadedFor===COMMON_NOTE_SCOPE)return;
    var response=await fetch('/api/memo');
    if(!response.ok)throw new Error('노트를 불러오지 못했습니다. 다시 눌러 주세요.');
    var loaded=await response.json();
    if(memoLoadedFor!==COMMON_NOTE_SCOPE){
      memoDoc=loaded.memo;memoLoadedFor=COMMON_NOTE_SCOPE;memoRestoreTabs();
      memoSyncEditor();renderMemoList();
    }
  }
  function demoRenderLinkMarkers(){
    if(!graphModel)return;
    graphModel.nodes.forEach(function(record){
      record.el.dataset.nodeId=record.data.id;
      var marker=record.el.querySelector('.demo-note-marker');
      if(!marker){marker=svgEl('text',{x:String(record.width/2-16),y:String(record.height/2-14),'text-anchor':'end','class':'graph-node-meta demo-note-marker','aria-hidden':'true'});record.el.appendChild(marker);}
      marker.textContent=demoLinkedNoteId(record.data.id)?'↗ 노트':'';
    });
  }
  async function demoOpenNode(record){
    if(document.querySelector('#demoNodeDialog[open]'))return;
    var sessionId=current,nodeId=record.data.id;
    var dialog=el('dialog','resume-dialog demo-node-dialog');dialog.id='demoNodeDialog';
    dialog.setAttribute('aria-labelledby','demoNodeTitle');
    var head=el('div','resume-dialog-head'),title=el('h2','',record.data.label);title.id='demoNodeTitle';
    var close=el('button','resume-dialog-close','×');close.type='button';close.setAttribute('aria-label','닫기');close.onclick=function(){dialog.close();};head.append(title,close);
    var body=el('div','resume-dialog-body'),status=el('p','cap',graphStatusText(record.data));
    var label=el('label','demo-note-label','연결할 노트 페이지');label.htmlFor='demoNoteSelect';
    var select=el('select','demo-note-select');select.id='demoNoteSelect';select.disabled=true;
    var message=el('p','cap','노트를 불러오는 중…');message.id='demoNoteMessage';message.setAttribute('role','status');
    var actions=el('div','resume-dialog-actions');
    var open=el('button','resume-dialog-action','페이지 열기'),save=el('button','resume-dialog-action secondary','연결 저장');
    open.type=save.type='button';open.disabled=save.disabled=true;actions.append(open,save);
    body.append(status,label,select,message,actions);dialog.append(head,body);document.body.appendChild(dialog);
    dialog.addEventListener('close',function(){dialog.remove();var node=graphModel&&graphModel.nodes.find(function(n){return n.data.id===nodeId;});if(current===sessionId&&node)node.el.focus();});
    dialog.showModal();close.focus();
    try{await demoPrepareNotes();}catch(error){message.textContent=error.message;return;}
    if(!dialog.open)return;
    var linked=demoLinkedNoteId(nodeId),missing=linked&&!memoById(linked);
    var none=el('option','','연결 안 함');none.value='';select.appendChild(none);
    memoDoc.notes.forEach(function(note){var option=el('option','',demoNotePath(note));option.value=note.id;select.appendChild(option);});
    select.value=missing?'':linked||'';select.disabled=false;
    function update(){open.disabled=!select.value||select.value!==linked;save.disabled=(select.value||null)===linked;
      message.textContent=missing?'연결된 페이지가 삭제되었습니다. 다른 페이지를 선택해 주세요.':!memoDoc.notes.length?'공통 노트에서 페이지를 만든 뒤 연결해 주세요.':save.disabled?(linked?'연결된 페이지를 바로 열 수 있습니다.':'아직 연결된 페이지가 없습니다.'):'연결 저장을 누르면 이 항목에 적용됩니다.';}
    select.onchange=update;update();
    save.onclick=function(){
      if(current!==sessionId){message.textContent='세션이 바뀌었습니다. 항목을 다시 열어 주세요.';return;}
      try{var links=JSON.parse(sessionStorage.getItem(demoNoteLinksKey)||'{}');links[sessionId+':'+nodeId]=select.value||null;sessionStorage.setItem(demoNoteLinksKey,JSON.stringify(links));}
      catch(_){message.textContent='연결을 저장하지 못했습니다. 다시 시도해 주세요.';return;}
      linked=select.value||null;missing=false;update();message.textContent=linked?'이번 체험에 연결을 저장했습니다.':'페이지 연결을 해제했습니다.';demoRenderLinkMarkers();
    };
    open.onclick=function(){
      if(current!==sessionId||!memoById(linked)){message.textContent='페이지를 찾을 수 없습니다. 항목을 다시 열어 주세요.';return;}
      demoNoteReturn={sessionId:sessionId,nodeId:nodeId,camera:{...graphCamera}};
      dialog.close();showTab('memo');selectMemo(linked);
      demoBackButton.hidden=false;demoBackButton.textContent='← '+record.data.label+' 그래프로 돌아가기';
      demoBackButton.focus({preventScroll:true});
    };
  }
  var demoBackButton=el('button','demo-note-back','← 그래프로 돌아가기');demoBackButton.type='button';demoBackButton.hidden=true;
  document.getElementById('memo').prepend(demoBackButton);
  demoBackButton.onclick=function(){
    var back=demoNoteReturn;if(!back)return;
    var session=sessions.find(function(s){return s.id===back.sessionId;});if(!session){demoBackButton.hidden=true;return;}
    current=back.sessionId;sessionStorage.setItem('olchipanel.championship.sel',current);render();showTab('situation');setMapMode('graph');
    requestAnimationFrame(function(){requestAnimationFrame(function(){graphCamera={...back.camera};graphNeedsFit=false;applyGraphTransform();var node=graphModel&&graphModel.nodes.find(function(n){return n.data.id===back.nodeId;});if(node)node.el.focus({preventScroll:true});});});
    demoBackButton.hidden=true;demoNoteReturn=null;
  };
  new MutationObserver(demoRenderLinkMarkers).observe(document.getElementById('graphNodes'),{childList:true});
