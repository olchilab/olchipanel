// plan.js unit tests. Zero deps; isolates state to a temp HOME.
'use strict';
const os = require('os');
const fs = require('fs');
const path = require('path');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'olchipanel-plan-'));
process.env.OLCHIPANEL_HOME = path.join(tmp, '.olchipanel');
const plan = require('../src/plan');

let fails = 0, total = 0;
function ok(label, cond, detail) {
  total++;
  if (!cond) { fails++; console.log('FAIL ' + label + (detail ? ' :: ' + detail : '')); }
  else console.log('PASS ' + label);
}
function throws(label, fn, code) {
  total++;
  try { fn(); fails++; console.log('FAIL ' + label + ' (no throw)'); }
  catch (e) { if (code && e.code !== code) { fails++; console.log('FAIL ' + label + ' (code ' + e.code + ')'); } else console.log('PASS ' + label); }
}

const p = plan.createPlan('My Plan');
ok('create plan', p.id && p.version === 1 && p.items.length === 0);
throws('empty title rejected', () => plan.createPlan('  '), 'bad_title');

const { item, version } = plan.plan_mutate(p.id, 'add', { title: 'first task' });
ok('add item bumps version', version === 2 && item.id.startsWith('itm_'));
ok('add default status/priority', item.status === 'todo' && item.priority === 0);

throws('add bad status', () => plan.plan_mutate(p.id, 'add', { title: 'x', status: 'nope' }), 'bad_status');
throws('add bad priority', () => plan.plan_mutate(p.id, 'add', { title: 'x', priority: 9 }), 'bad_priority');

const child = plan.plan_mutate(p.id, 'add', { title: 'child', parent: item.id });
ok('add child with parent', child.item.parent === item.id);
throws('add with missing parent', () => plan.plan_mutate(p.id, 'add', { title: 'x', parent: 'itm_zzzz' }), 'no_parent');

// optimistic concurrency
const cur = plan.getPlan(p.id);
throws('stale write rejected', () => plan.plan_mutate(p.id, 'update', { id: item.id, patch: { status: 'done' } }, cur.version - 1), 'stale');
const u = plan.plan_mutate(p.id, 'update', { id: item.id, patch: { status: 'in_progress' } }, cur.version);
ok('update with correct baseVersion', u.version === cur.version + 1);
ok('status persisted', plan.getPlan(p.id).items.find((i) => i.id === item.id).status === 'in_progress');

// cycle guard
throws('self-parent rejected', () => plan.plan_mutate(p.id, 'update', { id: item.id, patch: { parent: item.id } }), 'cycle');
throws('cycle rejected', () => plan.plan_mutate(p.id, 'update', { id: item.id, patch: { parent: child.item.id } }), 'cycle');

// delete detaches children
plan.plan_mutate(p.id, 'delete', { id: item.id });
const after = plan.getPlan(p.id);
ok('delete removes item', !after.items.find((i) => i.id === item.id));
ok('child detached to top level', after.items.find((i) => i.id === child.item.id).parent === null);
throws('delete missing item', () => plan.plan_mutate(p.id, 'delete', { id: 'itm_zzzz' }), 'no_item');

// list + session link
plan.plan_mutate(p.id, 'add', { title: 'linked', session: 'sess-123' });
const linked = plan.getPlan(p.id).items.find((i) => i.session === 'sess-123');
ok('session link stored', !!linked);
const plans = plan.listPlans();
ok('listPlans returns summary with counts', plans.length === 1 && plans[0].counts && typeof plans[0].counts === 'object');

// atomic write leaves no tmp files
const stray = fs.readdirSync(plan.PLANS_DIR).filter((f) => f.includes('.tmp.'));
ok('no stray tmp files', stray.length === 0, stray.join(','));

console.log(`plan.test: ${fails ? 'FAIL' : 'PASS'} ${total - fails}/${total}`);
process.exit(fails ? 1 : 0);
