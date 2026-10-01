// MCP plan-tools test: spawn the stdio server, drive plan_open/add/set/list,
// and confirm the mutations land in plan storage with the session link.
'use strict';
const os = require('os');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const authorDocument = require('../skills/olchipanel-plan-author/assets/software-release-plan.json');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'olchipanel-mcp-'));
const HOME = path.join(tmp, '.olchipanel');
const env = Object.assign({}, process.env, { OLCHIPANEL_HOME: HOME, OLCHIPANEL_OPEN: '0' });
require('../src/memo').write(HOME, 'common', {
  selected: 'shared-1',
  notes: [{ id: 'shared-1', title: 'Shared Note', html: '<p>agent-readable</p>' }],
});

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
  ok('plan tools advertised', ['plan_open', 'plan_add', 'plan_set', 'plan_apply', 'plan_next', 'plan_step', 'plan_list'].every((n) => names.includes(n)), names.join(','));
  const applyTool = list.result.tools.find((tool) => tool.name === 'plan_apply');
  ok('plan_apply publishes the typed author schema', applyTool && applyTool.inputSchema.properties.schema.const === 'olchipanel.plan-author.v1', JSON.stringify(applyTool));
  ok('shared Note tool advertised', names.includes('note_read'), names.join(','));

  const note = await rpc(3, 'tools/call', { name: 'note_read', arguments: {} });
  ok('note_read returns the common notebook', /Shared Note/.test(textOf(note)) && /agent-readable/.test(textOf(note)), textOf(note));

  const open = await rpc(4, 'tools/call', { name: 'plan_open', arguments: { title: 'Agent Plan' } });
  ok('plan_open returns plan id', /Plan open: \S+/.test(textOf(open)), textOf(open));

  const add = await rpc(5, 'tools/call', { name: 'plan_add', arguments: { title: 'ship feature', priority: 3 } });
  ok('plan_add returns task id', /Task added: itm_/.test(textOf(add)), textOf(add));
  const itemId = (textOf(add).match(/itm_\w+/) || [])[0];

  const set = await rpc(6, 'tools/call', { name: 'plan_set', arguments: { id: itemId, status: 'in_progress' } });
  ok('plan_set updates', /updated/.test(textOf(set)), textOf(set));

  const listed = await rpc(7, 'tools/call', { name: 'plan_list', arguments: {} });
  ok('plan_list shows mine + status', /in_progress/.test(textOf(listed)) && /\(mine\)/.test(textOf(listed)), textOf(listed));

  // storage truth: the plan file exists with the linked session
  const plansDir = path.join(HOME, 'plans');
  const files = fs.readdirSync(plansDir).filter((f) => f.endsWith('.json'));
  const plan = JSON.parse(fs.readFileSync(path.join(plansDir, files[0]), 'utf8'));
  const item = plan.items.find((i) => i.id === itemId);
  ok('mutation persisted to storage', !!item && item.status === 'in_progress', JSON.stringify(item));
  ok('item linked to a session', item && typeof item.session === 'string' && item.session.length > 0, item && item.session);

  // The desktop app can rebind a live session to an imported/shared plan. The
  // next Plan call must follow that binding without restarting the MCP process.
  const sessionDir = path.join(HOME, 'sessions');
  const sessionFile = fs.readdirSync(sessionDir).find((f) => f.endsWith('.json'));
  const sessionPath = path.join(sessionDir, sessionFile);
  const session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
  const reboundId = 'plan_rebound_fixture';
  fs.writeFileSync(path.join(plansDir, reboundId + '.json'), JSON.stringify({
    schema: 'olchipanel.plan.v1', id: reboundId, title: 'Received Plan', version: 1,
    created: new Date().toISOString(), updated: new Date().toISOString(),
    states: ['backlog', 'todo', 'in_progress', 'done', 'canceled'],
    items: [{ id: 'itm_received', title: 'received task', status: 'todo', priority: 0, parent: null, order: 1000, labels: [], note: '', session: null }],
  }, null, 2));
  session.plan_id = reboundId;
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2));
  const rebound = await rpc(8, 'tools/call', { name: 'plan_list', arguments: {} });
  ok('live MCP follows app-attached plan without restart', /received task/.test(textOf(rebound)), textOf(rebound));

  const applied = await rpc(9, 'tools/call', { name: 'plan_apply', arguments: authorDocument });
  const appliedResult = JSON.parse(textOf(applied));
  ok('plan_apply creates and attaches a complete plan', appliedResult.attached && appliedResult.items === authorDocument.plan.items.length && appliedResult.id !== reboundId, textOf(applied));
  const detailed = await rpc(10, 'tools/call', { name: 'plan_list', arguments: { detail: true } });
  const detailedPlan = JSON.parse(textOf(detailed));
  ok('plan_list detail returns author brief and relationships', detailedPlan.brief.objective === authorDocument.plan.objective && detailedPlan.items.some((entry) => entry.dependsOn && entry.dependsOn.length), textOf(detailed));
  ok('plan_apply updates durable session binding', JSON.parse(fs.readFileSync(sessionPath, 'utf8')).plan_id === appliedResult.id);
  const invalidDocument = JSON.parse(JSON.stringify(authorDocument));
  invalidDocument.plan.items[0].dependsOn = ['MISSING'];
  const rejected = await rpc(11, 'tools/call', { name: 'plan_apply', arguments: invalidDocument });
  ok('plan_apply rejects invalid relationships', rejected.result && rejected.result.isError && /missing dependency/.test(textOf(rejected)), textOf(rejected));
  ok('failed plan_apply preserves current binding', JSON.parse(fs.readFileSync(sessionPath, 'utf8')).plan_id === appliedResult.id);

  const frontier = await rpc(12, 'tools/call', { name: 'plan_next', arguments: {} });
  const frontierResult = JSON.parse(textOf(frontier));
  const readyT1 = frontierResult.ready.find((entry) => entry.key === 'T1');
  const blockedT2 = frontierResult.blocked.find((entry) => entry.key === 'T2');
  ok('plan_next computes ready and blocked frontier', readyT1 && blockedT2 && blockedT2.blockers.some((entry) => entry.key === 'T1'), textOf(frontier));

  const blockedStart = await rpc(13, 'tools/call', { name: 'plan_step', arguments: { id: blockedT2.id, action: 'start' } });
  ok('plan_step rejects blocked start', blockedStart.result && blockedStart.result.isError && /blocked by T1/.test(textOf(blockedStart)), textOf(blockedStart));
  const started = await rpc(14, 'tools/call', { name: 'plan_step', arguments: { id: readyT1.id, action: 'start' } });
  const startedResult = JSON.parse(textOf(started));
  ok('plan_step starts and claims ready task', startedResult.status === 'in_progress' && startedResult.changed, textOf(started));
  const noEvidence = await rpc(15, 'tools/call', { name: 'plan_step', arguments: { id: readyT1.id, action: 'complete' } });
  ok('plan_step refuses evidence-free completion', noEvidence.result && noEvidence.result.isError && /evidence must be an object/.test(textOf(noEvidence)), textOf(noEvidence));
  const evidence = { key: 'mcp-fixture-20260905', summary: 'MCP execution fixture passed', ref: 'test/plan_mcp.test.js' };
  const completed = await rpc(16, 'tools/call', { name: 'plan_step', arguments: { id: readyT1.id, action: 'complete', evidence } });
  const completedResult = JSON.parse(textOf(completed));
  ok('plan_step completes with durable evidence', completedResult.status === 'done' && completedResult.evidenceCount === 1, textOf(completed));
  const retry = await rpc(17, 'tools/call', { name: 'plan_step', arguments: { id: readyT1.id, action: 'complete', evidence } });
  ok('plan_step completion retry is duplicate-safe', JSON.parse(textOf(retry)).changed === false, textOf(retry));
  const nextFrontier = JSON.parse(textOf(await rpc(18, 'tools/call', { name: 'plan_next', arguments: {} })));
  ok('plan_next releases downstream work after proof', nextFrontier.ready.some((entry) => entry.key === 'T2'));
  const storedApplied = JSON.parse(fs.readFileSync(path.join(plansDir, appliedResult.id + '.json'), 'utf8'));
  const storedT1 = storedApplied.items.find((entry) => entry.key === 'T1');
  ok('runner proof persists in plan storage', storedT1.status === 'done' && storedT1.evidenceLog[0].key === evidence.key && storedT1.note.includes(evidence.summary), JSON.stringify(storedT1));

  child.stdin.end();
  setTimeout(() => { console.log(`plan_mcp.test: ${fails ? 'FAIL' : 'PASS'} ${total - fails}/${total}`); process.exit(fails ? 1 : 0); }, 200);
})();
setTimeout(() => { console.log('plan_mcp.test: FAIL (timeout)'); process.exit(1); }, 10000);
