'use strict';
// Explicit, repeatable import from the existing OlchiScope implementation.
// Does not change OlchiScope. Generated sources are kept in this project.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const source=path.resolve(process.argv[2]||path.join(__dirname,'../../olchi-scope/apps/web/src'));
const target=path.join(__dirname,'championship/scope');
fs.mkdirSync(target,{recursive:true});
const app=fs.readFileSync(path.join(source,'App.jsx'),'utf8');
function change(text,from,to){if(!text.includes(from))throw new Error('Scope source changed: '+from);return text.replace(from,to);}
let graph=app.slice(app.indexOf('function Graph({'),app.indexOf('function MarkerTray('));
if(!graph.trim().endsWith('}'))throw new Error('Graph source boundary changed');
graph=change(graph,'function Graph({','export function Graph({\n  bounds, minimumSpan, formatX, formatY, yLabel,');
graph=graph.replaceAll('temperatureData','data').replaceAll('DEFAULT_VIEW','bounds').replaceAll('MIN_VIEW_SPAN','minimumSpan').replaceAll('temperature','value').replace(/\.time\b/g,'.x').replace(/\btime:/g,'x:');
graph=change(graph,'온도 (°C)','{yLabel}');
graph=change(graph,'경과 시간 (s)','날짜');
graph=change(graph,'경과 시간에 따른 온도 변화 그래프. 현재 ${data.length}개 측정값 표시 중','날짜에 따른 ${yLabel} 그래프. ${data.length}일 샘플');
graph=change(graph,'formatNumber(tick, tickDigits(view.xMax - view.xMin))','formatX(tick)');
graph=change(graph,'makeTicks(view.xMin, view.xMax, 6).map((tick)', 'Array.from(new Set(makeTicks(Math.ceil(view.xMin), Math.floor(view.xMax), 6).map(Math.round))).map((tick)');
graph=change(graph,'formatNumber(tick, tickDigits(view.yMax - view.yMin))','formatY(tick, true)');
for(const name of ['point','hovered']){
  graph=graph.replaceAll(`{formatNumber(${name}.x, 2)} s`,`{formatX(${name}.x)}`);
  graph=graph.replaceAll(`{formatNumber(${name}.value, 2)} °C`,`{formatY(${name}.value)}`);
}
graph=graph.replaceAll('시간:','날짜:').replaceAll('온도:','값:').replaceAll('시간 {','날짜 {').replaceAll('온도 {','값 {');
const helpers=app.slice(app.indexOf('function clamp('),app.indexOf('function Graph({'));
const header=`// Adapted from OlchiScope App.jsx. See provenance.json.\nimport {useEffect,useRef,useState} from 'react';\nimport {calculatePinchView} from './viewport.js';\nconst VIEWBOX={width:1200,height:520};\nconst PLOT={left:98,right:1160,top:62,bottom:452};\nconst ZOOM_DRAG_THRESHOLD=8;\n`;
fs.writeFileSync(path.join(target,'Graph.jsx'),header+helpers+graph);
fs.copyFileSync(path.join(source,'viewport.js'),path.join(target,'viewport.js'));
const css=fs.readFileSync(path.join(source,'styles.css'),'utf8');
let graphCss=css.slice(css.indexOf('.graph-shell {'),css.indexOf('.marker-tray {')).replaceAll('temperature','value');
graphCss=graphCss.replace(/url\("\/cursors\/zoom-in.png"\) 10 9, /g,'').replace(/url\("\/cursors\/zoom-out.png"\) 10 9, /g,'');
fs.writeFileSync(path.join(target,'graph.css'),graphCss);
fs.writeFileSync(path.join(target,'provenance.json'),JSON.stringify({project:'OlchiScope',sourceFiles:Object.fromEntries(['App.jsx','viewport.js','styles.css'].map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(path.join(source,file))).digest('hex')])),adaptation:'Extract Graph and pinch viewport; accept numeric x/value, bounds and formatters; daily business fixtures; use Studio theme.'},null,2)+'\n');
console.log('Imported OlchiScope Graph and viewport into '+target);
