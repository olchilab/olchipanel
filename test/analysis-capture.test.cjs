'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'olchipanel-analysis-'));
process.env.OLCHIPANEL_HOME=root;
const state=require('../src/state'),plans=require('../src/plan'),notes=require('../src/memo'),{capture}=require('../src/analysis-capture');
test('analysis saves real notes and plan cards, preserves edits, and safely retries',()=>{
 state.ensureDirs();const s=state.newSession('codex');state.writeSession(s);
 notes.write(root,'common',{notes:[{id:'keep',title:'기존 노트',html:'<p>보존</p>'}]});
 const input={session:s.id,planId:'',metric:'revenue',start:'2026-08-01',end:'2026-08-03',total:999999};
 const saved=capture(input);capture(input);input.planId=saved.planId;
 assert.equal(notes.read(root,'common').memo.notes.length,2);
 assert.match(notes.read(root,'common').memo.notes.find(n=>n.id===saved.noteId).html,/193,900/);
 assert.equal(plans.getPlan(saved.planId).items.length,1);
 assert.equal(state.readAllSessions()[0].plan_id,saved.planId);
 const memo=notes.read(root,'common').memo;memo.notes.find(n=>n.id===saved.noteId).title='사용자 편집';notes.write(root,'common',memo);
 plans.plan_mutate(saved.planId,'update',{id:saved.itemId,patch:{status:'done'}});
 capture(input);assert.equal(plans.getPlan(saved.planId).items.length,1);assert.equal(plans.getPlan(saved.planId).items[0].status,'done');
 assert.equal(notes.read(root,'common').memo.notes.find(n=>n.id===saved.noteId).title,'사용자 편집');
 assert.equal(notes.read(root,'common').memo.notes.find(n=>n.id==='keep').html,'<p>보존</p>');
 const receipt=path.join(root,'analysis-'+saved.noteId.slice(9)+'.json');const record=JSON.parse(fs.readFileSync(receipt));delete record.itemId;fs.writeFileSync(receipt,JSON.stringify(record));
 capture(input);assert.equal(plans.getPlan(saved.planId).items.length,1,'interrupted card save must recover without duplication');
 assert.throws(()=>capture({...input,planId:'wrong'}),/target_changed/);
 assert.throws(()=>capture({...input,start:'invalid'}),/bad_analysis/);
 assert.throws(()=>capture({...input,session:'missing'}),/no_session/);
 const full=notes.read(root,'common').memo;while(full.notes.length<100)full.notes.push({id:'existing-'+full.notes.length,title:'keep',html:''});notes.write(root,'common',full);
 assert.throws(()=>capture({...input,end:'2026-08-04'}),/notebook_full/);
 assert.equal(plans.getPlan(saved.planId).items.length,1,'full notebook must not create a partial card');
});
test('app and demo ship identical analysis assets from the product source',()=>{
 for(const file of ['scope.js','scope.css','index.html','controls.css'])assert.deepEqual(fs.readFileSync(path.join(__dirname,'../public/scope',file)),fs.readFileSync(path.join(__dirname,'../output/championship-demo/site/scope',file)),file);
});
test('sample analysis iframe result is read by the demo host without crossing app storage',()=>{
 const vm=require('node:vm'),storage=new Map();
 const load=(query)=>{
   const c=vm.createContext({URLSearchParams,location:{search:query},sessionStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},localStorage:{getItem:()=>null}});c.window=c;
   vm.runInContext(fs.readFileSync(path.join(__dirname,'../output/championship-demo/site/business-data.js'),'utf8'),c);
   vm.runInContext(fs.readFileSync(path.join(__dirname,'../tools/championship/fixtures.js'),'utf8'),c);return c;
 };
 const frame=load('?demo=1'),host=load('?stage=2');
 assert.notEqual(frame.ChampionshipBusiness.SNAPSHOT,host.ChampionshipBusiness.SNAPSHOT);
 const result=frame.ChampionshipBusiness.snapshot('revenue',{start:22,end:29});
 storage.set(frame.ChampionshipBusiness.SNAPSHOT,JSON.stringify(result));
 const sample=host.ChampionshipDemo.fixture();
 assert.match(sample.memo.notes.find(n=>n.id==='demo-analysis-result').html,/311,700/);
 assert(sample.plan.items.some(i=>i.id==='analysis-followup'));
 storage.clear();storage.set(host.ChampionshipBusiness.SNAPSHOT,JSON.stringify(result));
 assert(!host.ChampionshipDemo.fixture().memo.notes.some(n=>n.id==='demo-analysis-result'),'app-local result must not leak into the demo');
});
