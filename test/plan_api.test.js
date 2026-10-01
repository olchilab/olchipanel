// End-to-end plan REST test: start a viewer on an isolated port/HOME, drive the API.
'use strict';
const os = require('os');
const fs = require('fs');
const path = require('path');
const http = require('http');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'olchipanel-planapi-'));
process.env.USERPROFILE = tmp;
process.env.HOME = tmp;
process.env.OLCHIPANEL_HOME = path.join(tmp, '.olchipanel');
process.env.OLCHIPANEL_PORT = '6841';
process.env.OLCHIPANEL_OPEN = '0';
const viewer = require('../src/viewer');
const state = require('../src/state');
const planStore = require('../src/plan');
const workshopPlan = require('../skills/olchipanel-plan-author/assets/community-workshop-plan.json');
const targetSession = state.writeSession(state.newSession('transfer-test'));

let fails = 0, total = 0;
function ok(label, cond, detail) {
  total++;
  if (!cond) { fails++; console.log('FAIL ' + label + (detail ? ' :: ' + detail : '')); }
  else console.log('PASS ' + label);
}

function req(method, p, body) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json', 'Origin': 'http://127.0.0.1:' + base };
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    const r = http.request({ host: '127.0.0.1', port: base, path: p, method, headers }, (res) => {
      let b = ''; res.on('data', (d) => { b += d; });
      res.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) {} resolve({ status: res.statusCode, body: j }); });
    });
    r.on('error', () => resolve({ status: 0, body: null }));
    if (data) r.write(data); r.end();
  });
}

let base;
const srv = viewer.start({ announce: false });
srv.on('listening', async () => {
  base = srv.address().port;
  const c = await req('POST', '/api/plans', { title: 'Sprint 1' });
  ok('POST /api/plans creates', c.status === 200 && c.body.id, JSON.stringify(c.body));
  const pid = c.body.id;

  const otherSession = state.writeSession({ ...state.newSession('other-plan-test'), id: 'other-plan-session' });
  const scopedCreate = await req('POST', '/api/plans', { title: 'Other session plan', session: otherSession.id });
  ok('new plan attaches to its requested session', state.readAllSessions().find(s => s.id === otherSession.id).plan_id === scopedCreate.body.id);
  const ownList = await req('GET', '/api/plans?session=' + otherSession.id);
  ok('session list contains only its linked plan', ownList.body.length === 1 && ownList.body[0].id === scopedCreate.body.id);
  const emptyList = await req('GET', '/api/plans?session=' + targetSession.id);
  ok('session without plan does not inherit global plan', emptyList.body.length === 0);
  const missingList = await req('GET', '/api/plans?session=missing');
  ok('unknown session does not expose global plans', missingList.body.length === 0);
  const unsetList = await req('GET', '/api/plans?session=');
  ok('empty session does not expose global plans', unsetList.body.length === 0);
  const countBefore = planStore.listPlans().length;
  const invalidCreate = await req('POST', '/api/plans', { title: 'Rejected', session: 'missing' });
  ok('invalid session rejects creation without orphan plan', invalidCreate.status === 404 && planStore.listPlans().length === countBefore);

  const badTitle = await req('POST', '/api/plans', { title: '' });
  ok('empty title -> 400', badTitle.status === 400);

  const add = await req('POST', '/api/plan/item?plan=' + pid, { title: 'design API' });
  ok('POST item -> 200 with version', add.status === 200 && add.body.version === 2, JSON.stringify(add.body));
  const itemId = add.body.item.id;

  const get = await req('GET', '/api/plan?id=' + pid);
  ok('GET plan returns item', get.status === 200 && get.body.items.length === 1);

  const stale = await req('PATCH', '/api/plan/item?plan=' + pid + '&id=' + itemId, { baseVersion: 1, patch: { status: 'done' } });
  ok('stale PATCH -> 409', stale.status === 409, JSON.stringify(stale.body));

  const patch = await req('PATCH', '/api/plan/item?plan=' + pid + '&id=' + itemId, { baseVersion: get.body.version, patch: { status: 'in_progress' } });
  ok('PATCH with correct version -> 200', patch.status === 200);

  const exported = await req('GET', '/api/plan/export?id=' + pid);
  ok('GET plan export returns portable bundle', exported.status === 200 && exported.body.schema === 'olchipanel.plan-transfer.v1' && exported.body.plan.items.length === 1, JSON.stringify(exported.body));

  const badStatus = await req('POST', '/api/plan/item?plan=' + pid, { title: 'x', status: 'nope' });
  ok('bad status -> 400', badStatus.status === 400);

  const list = await req('GET', '/api/plans');
  ok('GET /api/plans lists', list.status === 200 && list.body.length === 2 && list.body.find(p => p.id === pid).counts.in_progress === 1, JSON.stringify(list.body));

  const del = await req('DELETE', '/api/plan/item?plan=' + pid + '&id=' + itemId, { baseVersion: list.body[0].version });
  ok('DELETE item -> 200', del.status === 200, 'status=' + del.status + ' body=' + JSON.stringify(del.body) + ' ver=' + list.body[0].version);

  const imported = await req('POST', '/api/plan/import', { bundle: exported.body, session: targetSession.id });
  ok('POST plan import creates and attaches copy', imported.status === 200 && imported.body.id !== pid && imported.body.attached && imported.body.items === 1, JSON.stringify(imported.body));
  const importedPlan = await req('GET', '/api/plan?id=' + imported.body.id);
  ok('import preserves task state without old ownership', importedPlan.status === 200 && importedPlan.body.items[0].status === 'in_progress' && importedPlan.body.items[0].session === null, JSON.stringify(importedPlan.body));
  ok('import attaches receiving session', state.readAllSessions().find((s) => s.id === targetSession.id).plan_id === imported.body.id);

  const copied = await req('POST', '/api/plan/session', { plan: imported.body.id, session: targetSession.id, mode: 'copy' });
  ok('session copy gets independent plan id', copied.status === 200 && copied.body.id !== imported.body.id && copied.body.mode === 'copy', JSON.stringify(copied.body));
  const continued = await req('POST', '/api/plan/session', { plan: imported.body.id, session: targetSession.id, mode: 'continue' });
  ok('session continue shares source plan id', continued.status === 200 && continued.body.id === imported.body.id && continued.body.mode === 'continue', JSON.stringify(continued.body));
  const badImport = await req('POST', '/api/plan/import', { bundle: { schema: 'other' }, session: targetSession.id });
  ok('invalid plan file -> 400', badImport.status === 400, JSON.stringify(badImport.body));

  const authored = await req('POST', '/api/plan/import', { bundle: workshopPlan, session: targetSession.id });
  ok('author document imports through existing endpoint', authored.status === 200 && authored.body.attached && authored.body.items === workshopPlan.plan.items.length, JSON.stringify(authored.body));
  const authoredPlan = await req('GET', '/api/plan?id=' + authored.body.id);
  ok('author import exposes brief and structured cards', authoredPlan.status === 200 && authoredPlan.body.brief.objective === workshopPlan.plan.objective && authoredPlan.body.items.some((item) => item.dependsOn && item.dependsOn.length), JSON.stringify(authoredPlan.body));

  const authoredReady = planStore.getPlanFrontier(authored.body.id, targetSession.id).ready[0];
  const authorStart = planStore.plan_mutate(authored.body.id, 'step', {
    id: authoredReady.id, action: 'start', session: targetSession.id,
  }, authoredPlan.body.version);
  planStore.plan_mutate(authored.body.id, 'step', {
    id: authoredReady.id,
    action: 'complete',
    session: targetSession.id,
    evidence: { key: 'api-fixture-20260905', summary: 'API evidence roundtrip passed', ref: 'test/plan_api.test.js' },
  }, authorStart.version);
  const evidencedPlan = await req('GET', '/api/plan?id=' + authored.body.id);
  const evidencedItem = evidencedPlan.body.items.find((item) => item.id === authoredReady.id);
  ok('GET plan exposes runner evidence', evidencedPlan.status === 200 && evidencedItem.status === 'done' && evidencedItem.evidenceLog.length === 1, JSON.stringify(evidencedItem));
  const evidencedExport = await req('GET', '/api/plan/export?id=' + authored.body.id);
  ok('REST export includes portable runner evidence', evidencedExport.status === 200 && evidencedExport.body.plan.items.some((item) => item.evidenceLog && item.evidenceLog[0].key === 'api-fixture-20260905'), JSON.stringify(evidencedExport.body));
  const evidenceImport = await req('POST', '/api/plan/import', { bundle: evidencedExport.body, session: targetSession.id });
  const evidenceCopy = await req('GET', '/api/plan?id=' + evidenceImport.body.id);
  const evidenceCopyItem = evidenceCopy.body.items.find((item) => item.key === authoredReady.key);
  ok('REST roundtrip preserves evidence and drops local owner', evidenceImport.status === 200 && evidenceCopyItem.evidenceLog.length === 1 && evidenceCopyItem.session === null, JSON.stringify(evidenceCopyItem));

  const invalidAuthor = JSON.parse(JSON.stringify(workshopPlan));
  invalidAuthor.plan.items[0].dependsOn = ['MISSING'];
  const rejectedAuthor = await req('POST', '/api/plan/import', { bundle: invalidAuthor, session: targetSession.id });
  ok('invalid author relationship -> 400', rejectedAuthor.status === 400, JSON.stringify(rejectedAuthor.body));

  const forbidden = await new Promise((resolve) => {
    const r = http.request({ host: '127.0.0.1', port: base, path: '/api/plans', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Origin': 'http://evil.example' } }, (res) => { res.resume(); resolve(res.statusCode); });
    r.on('error', () => resolve(0)); r.end(JSON.stringify({ title: 'x' }));
  });
  ok('cross-origin POST -> 403 (CSRF)', forbidden === 403, String(forbidden));

  srv.close();
  console.log(`plan_api.test: ${fails ? 'FAIL' : 'PASS'} ${total - fails}/${total}`);
  process.exit(fails ? 1 : 0);
});
setTimeout(() => { console.log('plan_api.test: FAIL (no listen)'); process.exit(1); }, 8000);
