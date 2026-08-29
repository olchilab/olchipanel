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

  const badStatus = await req('POST', '/api/plan/item?plan=' + pid, { title: 'x', status: 'nope' });
  ok('bad status -> 400', badStatus.status === 400);

  const list = await req('GET', '/api/plans');
  ok('GET /api/plans lists', list.status === 200 && list.body.length === 1 && list.body[0].counts.in_progress === 1, JSON.stringify(list.body));

  const del = await req('DELETE', '/api/plan/item?plan=' + pid + '&id=' + itemId, { baseVersion: list.body[0].version });
  ok('DELETE item -> 200', del.status === 200, 'status=' + del.status + ' body=' + JSON.stringify(del.body) + ' ver=' + list.body[0].version);

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
