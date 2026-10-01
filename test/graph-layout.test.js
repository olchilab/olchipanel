const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('public/index.html','utf8');
const source=html.slice(html.indexOf('  function autoLayout('),html.indexOf('  function graphStatusText('));
const context={graphLayoutMode:()=> 'wide',graphNodeGeometry:n=>({width:n.w,height:n.h,portY:0,lines:['task']})};
vm.createContext(context);vm.runInContext(source,context);
let seed=13,id=0;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
function tree(depth){return {id:String(++id),w:180+Math.round(rand()*250),h:60+Math.round(rand()*120),children:depth?Array.from({length:1+Math.floor(rand()*3)},()=>tree(depth-1)):[]};}
for(let run=0;run<30;run++){
 const root=tree(3),model=context.autoLayout(root);
 assert.equal(model.edges.length,model.nodes.length-1,'each non-root step has one incoming connector');
 assert.deepEqual(Array.from(model.flow,n=>n.id),[root.id,...root.children.map(n=>n.id)],'root children define the recorded main route');
 for(let i=1;i<model.flow.length;i++){
  const edge=model.edges.find(e=>e.kind==='flow'&&e.target===model.flow[i]);
  assert.equal(edge.source,model.flow[i-1],'main route connects consecutive steps');
  assert.ok(model.flow[i].x>model.flow[i-1].x,'main route moves left to right');
  assert.equal(model.flow[i].y,model.flow[i-1].y,
    'main-stage arrow ports align even when card heights differ');
  const clearGap=model.flow[i].x-model.flow[i].width/2
    -(model.flow[i-1].x+model.flow[i-1].width/2);
  assert.ok(clearGap>=48,
    'main-stage connector keeps at least the shortened 48px column gap');
 }
 for(const n of model.nodes){
  for(const p of model.nodes){if(p===n)continue;
   const overlapX=Math.abs(n.x-p.x)<(n.width+p.width)/2;
   const overlapY=Math.abs(n.y-p.y)<(n.height+p.height)/2;
   assert.ok(!(overlapX&&overlapY),'workflow cards overlap');
  }
  if(n.stage===null){
   const edge=model.edges.find(e=>e.kind==='detail'&&e.target===n);
   assert.equal(edge.source,n.parent,'detail keeps its actual parent');
   assert.ok(n.y-n.height/2>n.parent.y+n.parent.height/2,'extra work flows below its parent');
   let anchor=n.parent;while(anchor.stage===null)anchor=anchor.parent;
   assert.equal(n.x,anchor.x,'extra work stays below its main phase');
  }
 }
 const positions=m=>m.nodes.map(n=>[n.id,n.x,n.y,n.width,n.height,n.lane,n.stage]);
 assert.deepEqual(positions(context.autoLayout(root)),positions(model),'arrange must be deterministic');
}
const workflow={id:'root',w:240,h:66,children:[
 {id:'done',w:240,h:66,status:'done'},
 {id:'active',w:240,h:66,status:'now',children:[
  {id:'detail',w:240,h:66,status:'done'},
  {id:'followup',w:240,h:66,status:'next'},
 ]},
 {id:'parked',w:240,h:66,status:'pause'},
 {id:'future',w:240,h:66,status:'next'},
]};
const live=context.autoLayout(workflow);
assert.deepEqual(Array.from(live.flow,n=>n.id),['root','done','active','future']);
assert.equal(live.current.id,'active');assert.equal(live.currentStage,2);
assert.equal(live.nodes.find(n=>n.id==='parked').stage,null,'paused work leaves the main route');
assert.equal(live.nodes.find(n=>n.id==='parked').x,live.flow[0].x,'paused work sits below the root');
assert.equal(live.nodes.find(n=>n.id==='detail').x,live.flow[2].x,'detail sits below its phase');
const firstExtra=live.nodes.find(n=>n.id==='detail'),secondExtra=live.nodes.find(n=>n.id==='followup');
assert.ok(secondExtra.y-secondExtra.height/2>firstExtra.y+firstExtra.height/2,
 'several extra tasks stack without overlapping below the same phase');
assert.equal(firstExtra.y-firstExtra.height/2-(live.flow[2].y+live.flow[2].height/2),48,
 'the first extra task begins one shortened vertical connector below the phase');
context.graphLayoutMode=()=> 'compact';
const compact=context.autoLayout(workflow);
assert.ok(compact.flow[1].x>compact.flow[0].x,'narrow mode preserves left-to-right order');
assert.ok(compact.nodes.find(n=>n.id==='detail').y>compact.flow[2].y,'narrow mode keeps extra work below');
context.graphLayoutMode=()=> 'wide';
const labelContext={graphTextWidth:value=>Array.from(String(value)).length*10};
vm.createContext(labelContext);
vm.runInContext(html.slice(html.indexOf('  function graphLabelLines('),html.indexOf('  function graphNodeGeometry(')),labelContext);
const balanced=Array.from(labelContext.graphLabelLines('9장 문구 교정 진행 — Jev 후보는 실행팩 미반영',270,3));
assert.equal(balanced.length,2,'the title stays on two lines');
assert.ok(balanced[1].length>4,'the final row is not an orphaned word');
assert.equal(balanced.join(' '),'9장 문구 교정 진행 — Jev 후보는 실행팩 미반영',
 'balanced wrapping preserves the full title');
assert.match(html,/graph\.layout\.v8\./,'new automatic geometry uses its own saved-layout key');
workflow.children[1].status='container';workflow.children[1].children[0].status='now';
const nested=context.autoLayout(workflow);
assert.equal(nested.current.id,'detail');assert.equal(nested.currentStage,2,'nested current work points to its main phase');
workflow.children[1].children[0].status='done';
assert.equal(context.autoLayout(workflow).current,null,'no active marker is invented');
vm.runInContext(html.slice(html.indexOf('  function graphSessionIsLive(){'),html.indexOf('  function graphNodeClass(')),context);
context.sessions=[{id:'session',alive:true}];context.current='session';context.isStale=()=>false;context.lang='ko';
assert.match(context.graphStatusText({status:'now'}),/현재 위치/,'live work has a current marker');
assert.match(context.graphPositionText(live),/^현재 위치 · 2 \/ 3$/,'main route shows its numbered current stage');
assert.match(context.graphPositionText(nested),/^현재 위치 · 2 \/ 3 · 세부 단계$/,'nested work stays attached to its main stage');
const sideAtStart={current:{stage:null},currentStage:0,flow:[{stage:0},{stage:1}]};
assert.match(context.graphPositionText(sideAtStart),/^현재 위치 · 추가 작업$/,'extra work below the root is not misnamed as start');
context.sessions[0].alive=false;
assert.match(context.graphStatusText({status:'now'}),/마지막 위치/,'ended work is not described as live');
assert.match(context.graphPositionText(live),/^마지막 위치 · 2 \/ 3$/,'ended work retains its last recorded stage');
// Fit must include large trees; the old minimum 28% cropped tall content.
const viewport={clientWidth:600,clientHeight:260};
context.graphBounds=()=>({left:0,right:1000,top:0,bottom:4000});
context.document={getElementById:()=>viewport};context.graphCamera={};context.applyGraphTransform=()=>{};
vm.runInContext(html.slice(html.indexOf('  function fitGraph(){'),html.indexOf('  function zoomGraph(')),context);
context.fitGraph();assert.ok(4000*context.graphCamera.scale<=viewport.clientHeight-48);
assert.ok(context.graphCamera.y>=24 && context.graphCamera.y<=70,'fit leaves a readable top margin');
let focusCalls=0;
context.fitGraph=()=>{context.graphCamera.scale=.56;};
context.focusGraphCurrent=()=>{focusCalls++;context.graphCamera.scale=1;};
context.graphModel={current:{id:'active'}};
context.initialGraphView();
assert.equal(focusCalls,1,'small overview moves to the recorded position at readable scale');
context.graphModel={current:null};
context.initialGraphView();
assert.equal(focusCalls,1,'no position is invented for a session without now');
console.log('GRAPH LAYOUT PASS: 30 mixed trees, ordered stages, parent-linked details, no overlap, repeatability, tall fit');

vm.runInContext(html.slice(html.indexOf('  function graphEdgePath('),html.indexOf('  function updateGraphEdges(')),context);
const card=(x,y)=>({x,y,width:240,height:66,portY:0});
for(const [name,from,to,compact,start,end] of [
 ['right',card(120,60),card(440,160),false,[240,60],[320,160]],
 ['left after drag',card(440,160),card(120,60),false,[320,160],[240,60]],
 ['below',card(120,60),card(140,180),false,[120,93],[140,147]],
 ['above',card(120,180),card(140,60),false,[120,147],[140,93]],
 ['same row',card(120,60),card(440,60),false,[240,60],[320,60]],
 ['compact outside cards',card(140,60),card(158,160),true,[20,60],[38,160]],
]) {
 const path=context.graphEdgePath(from,to,compact);
 assert.ok(path.startsWith('M '+start.join(' ')),name+' starts on source boundary');
 assert.ok(path.endsWith('L '+end.join(' ')),name+' ends on target boundary');
 assert.ok(!/NaN|Infinity/.test(path),name+' has finite geometry');
 if(name==='right')assert.ok(path.includes(' Q '),'elbows are rounded');
}
assert.ok(!/NaN|Infinity/.test(context.graphEdgePath(card(120,60),card(120,60),false)),'overlapping drag remains finite');
const flowPath=context.graphEdgePath(card(120,60),card(440,60),false,'flow');
assert.equal(flowPath,'M 240 60 L 320 60','main route connects right and left card boundaries');
const downPath=context.graphEdgePath(card(120,60),card(120,180),false,'detail');
assert.equal(downPath,'M 120 93 L 120 147','one extra task gets a direct downward arrow');
const activeRecord=live.nodes.find(n=>n.id==='active');
const firstPath=context.graphEdgePath(activeRecord,firstExtra,false,'detail');
assert.equal(firstPath,`M ${activeRecord.x} ${activeRecord.y+activeRecord.height/2} L ${firstExtra.x} ${firstExtra.y-firstExtra.height/2}`,
 'first extra task connects parent bottom to child top');
const secondPath=context.graphEdgePath(activeRecord,secondExtra,false,'detail');
const siblingBus=activeRecord.x-activeRecord.width/2-26-10;
assert.ok(siblingBus<firstExtra.x-firstExtra.width/2,'later sibling route stays outside the earlier card');
assert.ok(secondPath.includes(` ${siblingBus} `),'later sibling uses the outside gutter');
assert.ok(secondPath.endsWith(`L ${secondExtra.x} ${secondExtra.y-secondExtra.height/2}`),
 'later sibling arrow also enters downward through the top');
assert.match(html,/'marker-end': 'url\(#'/,'edge renderer attaches direction markers');
console.log('GRAPH EDGES PASS: workflow markers, detail routing, boundary anchors, reversed/vertical drag, compact, zero distance');
