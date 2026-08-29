// MCP plan-tools test: spawn the stdio server, drive plan_open/add/set/list,
// and confirm the mutations land in plan storage with the session link.
'use strict';
const os = require('os');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'olchipanel-mcp-'));
const HOME = path.join(tmp, '.olchipanel');
const env = Object.assign({}, process.env, { OLCHIPANEL_HOME: HOME, OLCHIPANEL_OPEN: '0' });

const child = spawn(process.execPath, [path.join(__dirname, '..', 'bin', 'olchipanel.js')], { env, stdio: ['pipe', 'pipe', 'inherit'] });

let fails = 0, total = 0, buf = '';
const pending = [];
function ok(label, cond, detail) { total++; if (!cond) { fails++; console.log('FAIL ' + label + (detail ? ' :: ' + detail : '')); } else console.log('PASS ' + label); }
function send(obj) { child.stdin.write(JSON.stringify(obj) + '\n'); }
function rpc(id, method, params) { return new Promise((res) => { pending.push({ id, res }); send({ jsonrpc: '2.0', id, method, params }); }); }

child.stdout.on('data', (d) => {
  buf += d.toString();
  let nl;
  while ((nl = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
    if (!line.trim()) continue;
    let msg; try { msg = JSON.parse(line); } catch (e) { continue; }
    const p = pending.find((x) => x.id === msg.id);
    if (p) { pending.splice(pending.indexOf(p), 1); p.res(msg); }
  }
});

function textOf(r) { return r.result && r.result.content && r.result.content[0] && r.result.content[0].text || ''; }

(async () => {
  await rpc(1, 'initialize', { clientInfo: { name: 'test-agent' }, protocolVersion: '2024-11-05' });
  const list = await rpc(2, 'tools/list', {});
  const names = list.result.tools.map((t) => t.name);
  ok('plan tools advertised', ['plan_open', 'plan_add', 'plan_set', 'plan_list'].every((n) => names.includes(n)), names.join(','));

  const open = await rpc(3, 'tools/call', { name: 'plan_open', arguments: { title: 'Agent Plan' } });
  ok('plan_open returns plan id', /Plan open: \S+/.test(textOf(open)), textOf(open));

  const add = await rpc(4, 'tools/call', { name: 'plan_add', arguments: { title: 'ship feature', priority: 3 } });
  ok('plan_add returns task id', /Task added: itm_/.test(textOf(add)), textOf(add));
  const itemId = (textOf(add).match(/itm_\w+/) || [])[0];

  const set = await rpc(5, 'tools/call', { name: 'plan_set', arguments: { id: itemId, status: 'in_progress' } });
  ok('plan_set updates', /updated/.test(textOf(set)), textOf(set));

  const listed = await rpc(6, 'tools/call', { name: 'plan_list', arguments: {} });
  ok('plan_list shows mine + status', /in_progress/.test(textOf(listed)) && /\(mine\)/.test(textOf(listed)), textOf(listed));

  // storage truth: the plan file exists with the linked session
  const plansDir = path.join(HOME, 'plans');
  const files = fs.readdirSync(plansDir).filter((f) => f.endsWith('.json'));
  const plan = JSON.parse(fs.readFileSync(path.join(plansDir, files[0]), 'utf8'));
  const item = plan.items.find((i) => i.id === itemId);
  ok('mutation persisted to storage', !!item && item.status === 'in_progress', JSON.stringify(item));
  ok('item linked to a session', item && typeof item.session === 'string' && item.session.length > 0, item && item.session);

  child.stdin.end();
  setTimeout(() => { console.log(`plan_mcp.test: ${fails ? 'FAIL' : 'PASS'} ${total - fails}/${total}`); process.exit(fails ? 1 : 0); }, 200);
})();
setTimeout(() => { console.log('plan_mcp.test: FAIL (timeout)'); process.exit(1); }, 10000);
