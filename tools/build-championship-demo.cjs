'use strict';
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {renderTheme}=require('../desktop/theme-renderer.cjs');
const root=path.resolve(__dirname,'..');
const source=path.join(__dirname,'championship');
const out=path.join(root,'output/championship-demo/site');
const scope=path.join(root,'src/scope');
const esbuild=require(path.join(scope,'node_modules/esbuild'));
fs.mkdirSync(path.join(out,'icons'),{recursive:true});
fs.mkdirSync(path.join(out,'scope'),{recursive:true});
require('./build-scope.cjs').buildScope(path.join(out,'scope'));
esbuild.buildSync({entryPoints:[path.join(scope,'model.js')],bundle:true,minify:true,format:'iife',globalName:'ChampionshipBusiness',outfile:path.join(out,'business-data.js')});
fs.copyFileSync(path.join(scope,'index.html'),path.join(out,'scope/index.html'));
function replace(html,from,to){if(!html.includes(from))throw new Error('App source changed; review demo adapter: '+from);return html.replace(from,to);}
const style=`<style>.tab-x,#resumeArchive,#exportBtn,#langBtn{display:none!important}#newPlan,#sendPlan,#exportPlan,#importPlan,.col .add{display:none!important}.card{cursor:pointer}.drag-handle{cursor:grab}.card .menu-btn{display:none}.championship-target{outline:2px solid var(--brand)!important;outline-offset:3px}</style>`;
for(const surface of ['index','plan']){
  let html=renderTheme('studio',surface).replaceAll('olchipanel.','olchipanel.championship.').replaceAll('localStorage','sessionStorage');
  html=html.replaceAll('href="/icons/','href="icons/').replaceAll('src="/icons/','src="icons/');
  html=html.replaceAll("'/icons/","'icons/");
  html=html.replaceAll('href="/manifest','data-unused-manifest="/manifest');
  html=replace(html,'</head>',style+'<script src="session.js"></script><script src="business-data.js"></script><script src="fixtures.js"></script><script src="adapter.js"></script></head>');
  if(surface==='index'){
    // Keep the sample map legible at laptop height without changing the app layout.
    html=replace(html,'gapX = 80, gapY = 24','gapX = 36, gapY = 12');
    html=replace(html,'Math.max(66, 46 + lines.length * 20)','Math.max(52, 32 + lines.length * 20)');
    html=replace(html,'Math.max(240, Math.min(340, Math.ceil(widest + 44)))','Math.max(220, Math.min(340, Math.ceil(widest + 44)))');
    html=replace(html,'var firstLineY = -record.height / 2 + 25;','var firstLineY = -record.height / 2 + 21;');
    html=replace(html,"y: String(record.height / 2 - 14), 'text-anchor': 'start'","y: String(record.height / 2 - 11), 'text-anchor': 'start'");
    html=replace(html,'(viewport.clientWidth - 48) / width, (viewport.clientHeight - 48) / height','(viewport.clientWidth - 32) / width, (viewport.clientHeight - 32) / height');
    // The prototype stays out of public/index.html and the installed app.
    html=replace(html,'  var graphViewportSize=',fs.readFileSync(path.join(source,'note-links.js'),'utf8')+'\n  var graphViewportSize=');
    html=replace(html,"        var dx = 0, dy = 0, step = e.shiftKey ? 1 : 10;","        if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();demoOpenNode(record);return;}\n        var dx = 0, dy = 0, step = e.shiftKey ? 1 : 10;");
    html=replace(html,"    if (graphDrag.type === 'node') saveGraphLayout();","    if (graphDrag.type === 'node') { saveGraphLayout(); if(e.type==='pointerup'&&Math.hypot(e.clientX-graphDrag.startX,e.clientY-graphDrag.startY)<5)demoOpenNode(graphDrag.record); }");
    html=replace(html,'<span>0.8.2</span>','<span>0.8.2 · 샘플</span>');
    html=replace(html,"sub.appendChild(document.createTextNode(' · ' + ago(s.started)));","sub.appendChild(document.createTextNode(' · ' + (s.alive?'연결됨':'연결 종료'))); b.dataset.sessionId=s.id;");
    html=replace(html,"projectTitle.title=projectName;txt.appendChild(projectTitle);","projectTitle.textContent=s.agent==='claude'?'자료 검토':s.id==='demo-session-1'?'이전 분석 세션':'웹사이트 분석'; projectTitle.title=projectTitle.textContent;txt.appendChild(projectTitle);");
    html=replace(html,"scopeFrame.src='/scope/index.html'","scopeFrame.src='scope/index.html?demo=1'+(window.championshipPresentation?'&presentation=1':'')");
    html=replace(html,"f.src = '/plan'","f.src = 'plan.html?stage=' + window.championshipStage");
    html=replace(html,"applyTheme(saved || 'dark');","applyTheme(saved || 'light');");
    html=replace(html,"memoSaved: '저장됨'","memoSaved: '체험 중 저장됨'");
    html=replace(html,"memoSaved: 'saved'","memoSaved: 'Saved for this visit'");
    html=replace(html,'function memoSaveNow(forWhom){','function memoSaveNow(forWhom){ if(window.championshipReset)return Promise.resolve();');
    html=replace(html,'</head>',`<style>
html[data-design="studio"] .theme-brand>span{display:none}
html[data-design="studio"] .theme-brand{padding-bottom:0;border:0;margin-bottom:10px}
html[data-design="studio"] .theme-brand strong{font-size:24px;letter-spacing:-.7px;color:var(--ink)}
html[data-design="studio"] .memo-content{min-height:80px}
@media(min-width:761px) and (max-height:500px){
html[data-design="studio"] .rail-group{display:none}
html[data-design="studio"] .panel-tab{padding-block:5px}
html[data-design="studio"] .rail-session-area{min-height:108px}
html[data-design="studio"] .rail-drawer{min-height:220px}
html[data-design="studio"] .rail-tools{margin-bottom:6px;padding-bottom:6px}
}
.championship-target{outline:2px solid var(--brand)!important;outline-offset:3px}
.demo-node-dialog{max-width:540px;width:calc(100vw - 48px)}
.demo-node-dialog .resume-dialog-body{display:grid;gap:16px}
.demo-node-dialog .resume-dialog-body p{margin:0}
.demo-note-label{font-size:13px;font-weight:600}
.demo-note-select{width:100%;min-width:0;padding:10px 36px 10px 12px;color:var(--ink);background-color:var(--panel);border:1px solid var(--line);border-radius:6px}
.demo-note-back{align-self:flex-start;margin:0 0 10px;padding:7px 10px;color:var(--brand);background:transparent;border:1px solid var(--line);border-radius:6px;max-width:100%;white-space:normal;text-align:left}
.demo-note-back[hidden]{display:none}
html[data-design="studio"] #situation.graph-active #journeyProgress{display:none}
html[data-design="studio"] #situation.graph-active .graph-toolbar{min-height:36px;padding-block:4px}
</style></head>`);
  } else {
    html=replace(html,"mb.title='메뉴 (상태·우선순위·라벨·삭제)'","mb.title='샘플 카드 상세 보기'");
    html=replace(html,'function openMenu(it,card){','function openMenu(it,card){ return openCardComposer(it.status,it,card);');
    html=replace(html,'function advance(it){','function advance(it){ return openCardComposer(it.status,it,document.querySelector(\'.card[data-id="\'+it.id+\'"]\'));');
    html=replace(html,'function delSel(){','function delSel(){ return;');
    html=replace(html,'function openCardComposer(status,item,trigger){','function openCardComposer(status,item,trigger){ if(!item)return;');
    html=replace(html,"$('#cardComposer').showModal();",`$('#cardComposer').showModal();
      $('#composerTitle').textContent='샘플 카드';$('#composerSubtitle').textContent='상태 변경은 이번 체험에서만 유지됩니다.';$('#composerSave').textContent='상태 저장';
      $('#composerCancel').textContent='닫기';$('#cardTitle').readOnly=true;$('#cardNote').readOnly=true;
      $('#cardStatus').disabled=false;$('#cardPriority').disabled=true;
      document.querySelectorAll('#composerLabels input').forEach(input=>input.disabled=true);`);
    html=replace(html,"const payload={title,note:$('#cardNote').value.trim(),status:$('#cardStatus').value,priority:Number($('#cardPriority').value),labels:selectedComposerLabels()};","const payload={status:$('#cardStatus').value};");
  }
  fs.writeFileSync(path.join(out,surface==='index'?'app.html':'plan.html'),html);
}
for(const file of ['index.html','fixtures.js','adapter.js','shell.css','shell.js','session.js'])fs.copyFileSync(path.join(source,file),path.join(out,file));
fs.copyFileSync(path.join(root,'public/icons/olchi-dark-32.png'),path.join(out,'icons/olchi-dark-32.png'));
for(const icon of ['olchi-favicon-v4.ico','olchi-favicon-dark-v1.ico','olchi-192.png'])fs.copyFileSync(path.join(root,'public/icons',icon),path.join(out,'icons',icon));
const sourceFiles=fs.readdirSync(source,{withFileTypes:true}).filter(f=>f.isFile()).map(f=>'tools/championship/'+f.name);
const scopeFiles=fs.readdirSync(scope,{withFileTypes:true}).filter(f=>f.isFile()).map(f=>'src/scope/'+f.name);
const inputs=['public/index.html','public/plan.html','public/themes/shared.css','public/themes/studio.css','public/themes/studio-help.js','desktop/theme-renderer.cjs','desktop/session-activity.cjs',...sourceFiles,...scopeFiles,'tools/build-championship-demo.cjs'];
const hashes=Object.fromEntries(inputs.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(root,file))).digest('hex')]));
fs.writeFileSync(path.join(out,'build.json'),JSON.stringify({generatedAt:new Date().toISOString(),productVersion:'0.8.2',renderer:"renderTheme('studio', surface)",synthetic:true,demoOnly:['graph-note-page-links'],localInteractions:['plan-status','analysis','notes','request-details','graph-note-page-links'],sourceHashes:hashes},null,2)+'\n');
console.log('Built static demo: '+out);
