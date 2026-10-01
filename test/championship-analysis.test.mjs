import test from 'node:test';
import assert from 'node:assert/strict';
import {ROWS,rangeIndices,statistics,snapshot} from '../tools/championship/scope/model.js';

test('daily fixtures span both months with separate people and currency units',()=>{
  assert.equal(ROWS.length,50);
  assert.equal(ROWS[0].date,'2026-08-01');
  assert.equal(ROWS.at(-1).date,'2026-09-19');
  assert.equal(new Set(ROWS.map(r=>r.date)).size,50);
  assert.ok(ROWS.every(r=>Number.isInteger(r.visitors)&&r.visitors>0&&Number.isInteger(r.revenue)&&r.revenue>=0));
});
test('inclusive dates and reverse selection preserve exact arithmetic',()=>{
  assert.deepEqual(rangeIndices('2026-08-03','2026-08-01'),{start:0,end:2});
  // Explicit fixture anchors: 2050,2232,1980 people; 57400,69200,67300 KRW.
  const s=statistics('visitors',0,2);
  assert.equal(s.count,3);assert.equal(s.total,6262);assert.equal(s.average,6262/3);
  assert.equal(s.minimum.visitors,1980);assert.equal(s.maximum.visitors,2232);
  assert.deepEqual(statistics('visitors',2,0),s);
  assert.equal(statistics('revenue',0,2).total,193900);
  assert.equal(statistics('revenue',1,1).average,69200);
});
test('invalid dates and empty numeric ranges cannot imply a valid result',()=>{
  assert.equal(rangeIndices('2026-07-31','2026-08-05'),null);
  assert.equal(rangeIndices('2026-08-32','2026-09-03'),null);
  assert.equal(rangeIndices('','2026-09-03'),null);
  assert.equal(statistics('visitors',60,70).count,0);
  assert.throws(()=>statistics('temperature'));
});
test('captured result is an exact selected-range snapshot',()=>{
  const s=snapshot('revenue',{start:22,end:29});
  assert.deepEqual(s,{schema:'championship-analysis.v1',metric:'revenue',start:'2026-08-23',end:'2026-08-30',count:8,minimum:31500,maximum:50200,average:38962.5,total:311700});
});
