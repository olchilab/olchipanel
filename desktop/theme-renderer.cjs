'use strict';
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const {sessionActivity}=require('./session-activity.cjs');
function renderTheme(variant,surface){
  if(!['studio','editorial'].includes(variant)||!['index','plan'].includes(surface))throw new Error('Unknown theme surface');
  const label=variant==='studio'?'0.8.2':'E3 · EDITORIAL DESK';
  let html=fs.readFileSync(path.join(root,'public',surface+'.html'),'utf8');
  const css=fs.readFileSync(path.join(root,'public','themes','shared.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'public','themes',variant+'.css'),'utf8');
  html=html.replace(/<html([^>]*)>/,'<html$1 data-design="'+variant+'" data-surface="'+surface+'">');
  html=html.replace('</head>','<style>'+css+'</style></head>');
  if(surface==='index'){
    if(variant==='studio'){
      html=html.replace("'현재 진행 중인 단계 없음 · 아래는 기록된 여정입니다.'","''");
      html=html.replace('</body>','<script>'+fs.readFileSync(path.join(root,'public/themes/studio-help.js'),'utf8')+'</script></body>');
      html=html.replace('function renderRow(s, v){',sessionActivity.toString()+'\n    function renderRow(s, v){');
      html=html.replace("if (s.alive) face.appendChild(el('span', 'alive'));", "var activity=sessionActivity(s);var faceLed=el('span','session-activity '+activity.kind);faceLed.title=activity.label;faceLed.setAttribute('role','img');faceLed.setAttribute('aria-label',activity.label);face.appendChild(faceLed);");
      html=html.replace(/if \(s.alive\) \{ var ld = el\('span', 'live-inline'\);[^\n]+/, "var ld=el('span','session-activity '+activity.kind);ld.setAttribute('role','img');ld.setAttribute('aria-label',activity.label);ld.title=activity.label;txt.appendChild(ld);");
      html=html.replace("var txt = el('span', 'txt' + (s.alive ? '' : ' dead'), sessionLabel(s));", "var projectName=(s.cwd || '').replace(/[\\\\/]+$/, '').split(/[\\\\/]/).pop() || s.workspace || s.name || '프로젝트';\n        var txt = el('span', 'txt' + (s.alive ? '' : ' dead'));\n        var projectTitle=el('span','project-title',Array.from(projectName).length>20?Array.from(projectName).slice(0,19).join('')+'…':projectName);\n        projectTitle.title=projectName;txt.appendChild(projectTitle);");
      html=html.replace(/sub.appendChild\(document.createTextNode\(' ' \+ \(s.cwd[^\n]+/, "sub.appendChild(document.createTextNode(' · ' + ago(s.started)));");
      html=html.replaceAll('olchipanel.theme','olchipanel.studio.theme');
      html=html.replace('applyTheme(saved || prefers);',"applyTheme(saved || 'dark');");
      html=html.replace("document.documentElement.setAttribute('data-theme', t);", "document.documentElement.setAttribute('data-theme', t);\n    var themeButton=document.getElementById('themeBtn');\n    themeButton.title=t==='dark'?'라이트 모드로 전환':'다크 모드로 전환';\n    themeButton.setAttribute('aria-label',themeButton.title);\n    themeButton.setAttribute('aria-pressed',String(t==='dark'));");
    }
    html=html.replace('<div class="rail-head">','<div class="theme-brand"><strong>OlchiPanel</strong><span>'+label+'</span></div><div class="rail-head">');
    if(variant==='studio'){
      const toggle=html.match(/<button class="rail-toggle"[\s\S]*?<\/button>/);
      if(toggle){html=html.replace(toggle[0],'');html=html.replace('<div class="theme-brand"><strong>OlchiPanel</strong>','<div class="theme-brand"><div class="studio-brand-row"><strong>OlchiPanel</strong>'+toggle[0]+'</div>');}
      const menu=html.match(/<div class="rail-tools top-right">[\s\S]*?<\/div>/);
      if(menu){html=html.replace(menu[0],'');html=html.replace('<div class="rail-head">',menu[0]+'<div class="rail-head">');}
    }
    html=html.replace('<h1 class="goalbar" id="goalbar">','<div class="theme-goal"><span class="theme-kicker">'+(variant==='studio'?'CURRENT WORK':'현재 작업')+'</span><h1 class="goalbar" id="goalbar">');
    html=html.replace('<div class="stamp" id="substamp">','</div><div class="stamp" id="substamp">');
    html=html.replace("    postWindow('/api/window/release', true).catch(function(){});",'    // Native windows own the Electron singleton, not the legacy browser lease.');
    html=html.replace('  beginWindow();','  setInterval(refresh,'+(variant==='studio'?'1500':'5000')+');');
  }
  return html;
}
module.exports={renderTheme};
