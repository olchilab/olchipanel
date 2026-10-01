import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';

function browser(storage,stage=1){
  const context=vm.createContext({URL,URLSearchParams,Response,console,location:new URL('https://example.test/olchipanel/plan?stage='+stage),
    sessionStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
    document:{documentElement:{dataset:{surface:'plan'}}},addEventListener(){}});
  context.window=context;
  for(const name of ['fixtures.js','adapter.js'])vm.runInContext(fs.readFileSync(new URL('../tools/championship/'+name,import.meta.url),'utf8'),context);
  return context;
}
const get=async b=>(await b.fetch('/api/plan')).json();
const move=(b,version,patch={status:'done'})=>b.fetch('/api/plan/item?plan=demo-plan&id=traffic',{method:'PATCH',body:JSON.stringify({baseVersion:version,patch})});

test('sample card moves persist within a visit and next AI session, with explicit reset',async()=>{
  const storage=new Map(),b=browser(storage),initial=await get(b);
  assert.equal((await move(b,initial.version)).status,200);
  assert.equal((await get(b)).items.find(x=>x.id==='traffic').status,'done');
  assert.equal((await get(browser(storage,6))).items.find(x=>x.id==='traffic').status,'done');
  assert.equal((await move(b,initial.version)).status,409);
  storage.delete('olchipanel.championship.plan-status.v1');
  assert.equal((await get(browser(storage))).items.find(x=>x.id==='traffic').status,'todo');
});
test('sample interaction rejects unrelated edits and external writes',async()=>{
  const b=browser(new Map()),p=await get(b);
  assert.equal((await move(b,p.version,{title:'not allowed'})).status,400);
  assert.equal((await move(b,p.version,{status:'invalid'})).status,400);
  assert.equal((await b.fetch('/api/memo',{method:'POST'})).status,400);
  assert.equal((await b.fetch('https://other.test/api/plan/item',{method:'PATCH'})).status,403);
  assert.equal((await get(b)).items.find(x=>x.id==='traffic').status,'todo');
});

test('local notes preserve edits, new pages and deletion across sessions and stage changes',async()=>{
  const storage=new Map(),b=browser(storage,3);
  let memo=(await (await b.fetch('/api/memo')).json()).memo;
  memo.notes[0].title='검토 근거';memo.notes[0].html='<p>다시 확인할 자료</p>';
  memo.notes.push({id:'note-review-1',title:'내 노트',html:'<p>추가 확인</p>',parentId:null,pinned:false,collapsed:false,order:3});
  assert.equal((await b.fetch('/api/memo?id=common',{method:'POST',body:JSON.stringify({memo})})).status,200);
  memo=(await (await browser(storage,6).fetch('/api/memo')).json()).memo;
  assert.equal(memo.notes.find(n=>n.id==='demo-note-criteria').title,'검토 근거');
  assert.equal(memo.notes.find(n=>n.id==='note-review-1').html,'<p>추가 확인</p>');
  assert.match(memo.notes.find(n=>n.id==='demo-note-next').html,/유입 경로별 자료부터/);
  memo.notes=memo.notes.filter(n=>n.id!=='demo-note-criteria');
  await browser(storage,6).fetch('/api/memo',{method:'POST',body:JSON.stringify({memo})});
  assert.equal((await (await browser(storage,3).fetch('/api/memo')).json()).memo.notes.some(n=>n.id==='demo-note-criteria'),false);
  storage.delete('olchipanel.championship.memo.edits.v1');
  assert.equal((await (await browser(storage,3).fetch('/api/memo')).json()).memo.notes.length,2);
});

test('all tour steps expose the same populated workspace from the first visit',async()=>{
  const storage=new Map();
  const snapshot=async stage=>{
    const b=browser(storage,stage),plan=await get(b),state=await (await b.fetch('/api/state')).json(),memo=(await (await b.fetch('/api/memo')).json()).memo;
    return {plan:plan.items,version:plan.version,notes:memo.notes.map(n=>({id:n.id,title:n.title,html:n.html})),sessions:state.sessions.map(s=>({id:s.id,alive:s.alive,plan:s.plan_id,pending:s.pending,map:s.map}))};
  };
  const first=await snapshot(0);assert.equal(first.plan.length,5);assert.equal(first.notes.length,2);assert.equal(first.sessions.length,3);
  for(let stage=1;stage<7;stage++)assert.deepEqual(await snapshot(stage),first);
});
