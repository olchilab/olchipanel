'use strict';

const assert = require('assert');
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'olchipanel-session-id-'));
const idleHome = path.join(home, 'idle');
const idle = spawnSync(process.execPath, [path.join(__dirname, '..', 'bin', 'olchipanel.js')], {
  env: { ...process.env, OLCHIPANEL_HOME: idleHome, OLCHIPANEL_OPEN: '0', OLCHIPANEL_NO_UPDATE_CHECK: '1' },
  input: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { clientInfo: { name: 'idle' } } }) + '\n',
  encoding: 'utf8', timeout: 5000,
});
assert.strictEqual(idle.status, 0, idle.stderr);
assert.ok(!fs.existsSync(idleHome), 'initialize followed by disconnect must create no storage');
const child = spawn(process.execPath, [path.join(__dirname, '..', 'bin', 'olchipanel.js')], {
  env: { ...process.env, OLCHIPANEL_HOME: home, OLCHIPANEL_PORT: '0', OLCHIPANEL_OPEN: '0', OLCHIPANEL_NO_UPDATE_CHECK: '1' },
  stdio: ['pipe', 'pipe', 'inherit'],
});

let buffer = '';
const pending = new Map();
child.stdout.on('data', (chunk) => {
  buffer += chunk.toString();
  let end;
  while ((end = buffer.indexOf('\n')) >= 0) {
    const line = buffer.slice(0, end); buffer = buffer.slice(end + 1);
    let message; try { message = JSON.parse(line); } catch (e) { continue; }
    const done = pending.get(message.id);
    if (done) { pending.delete(message.id); done(message); }
  }
});

function rpc(id, method, params) {
  return new Promise((resolve) => {
    pending.set(id, resolve);
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}

function files() {
  const dir = path.join(home, 'sessions');
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter((file) => file.endsWith('.json')) : [];
}

const timeout = setTimeout(() => {
  child.kill();
  console.error('SESSION IDENTITY FAIL: timeout');
  process.exit(1);
}, 12000);

(async () => {
  const initialize = (id) => rpc(id, 'initialize', {
    protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'same-agent', version: '1' },
  });
  await initialize(1);
  assert.deepStrictEqual(files(), [], 'connection alone must not register a panel');
  await initialize(10);
  assert.deepStrictEqual(files(), [], 'reinitialize before opt-in must remain read-only');
  await rpc(2, 'tools/call', { name: 'set_goal', arguments: { goal: 'keep one logical row' } });
  const firstFile = files()[0];
  assert.ok(firstFile, 'the first explicit use must create one session');

  // Cross a timestamp second so the old implementation would create a second
  // id/file when the same stdio transport initialized again.
  await new Promise((resolve) => setTimeout(resolve, 1100));
  await initialize(3);
  await rpc(4, 'tools/call', { name: 'name_session', arguments: { name: 'same row after reconnect' } });

  assert.deepStrictEqual(files(), [firstFile], 're-initializing one MCP transport must not create another sidebar session');
  const saved = JSON.parse(fs.readFileSync(path.join(home, 'sessions', firstFile), 'utf8'));
  assert.strictEqual(saved.goal, 'keep one logical row');
  assert.strictEqual(saved.name, 'same row after reconnect');
  await rpc(5, 'tools/call', { name: 'add_step', arguments: { id: 'work', label: '실제 작업', status: 'now' } });
  const working = JSON.parse(fs.readFileSync(path.join(home, 'sessions', firstFile), 'utf8'));
  assert.strictEqual(working.map.tree.id, 'work', 'first work root replaces the connection placeholder');
  assert.ok(!working.map.tree.bootstrap);
  await initialize(6);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(path.join(home, 'sessions', firstFile), 'utf8')).map, working.map, 'reinitialize must preserve the actual journey');
  const limitGoal = '가'.repeat(9) + ' ' + '나'.repeat(10);
  const accepted = await rpc(20, 'tools/call', { name: 'set_goal', arguments: { goal: limitGoal } });
  assert.ok(!accepted.result.isError, '20 characters including an internal space must be accepted');
  for (const [index, goal] of [limitGoal + '다', ' ', '두 줄\n목표'].entries()) {
    const rejected = await rpc(21 + index, 'tools/call', { name: 'set_goal', arguments: { goal } });
    assert.ok(rejected.result.isError, 'invalid goal must be rejected');
    assert.strictEqual(JSON.parse(fs.readFileSync(path.join(home, 'sessions', firstFile), 'utf8')).goal, limitGoal, 'rejection must preserve the previous goal');
  }
  const unicode = await rpc(24, 'tools/call', { name: 'set_goal', arguments: { goal: '😀'.repeat(20) } });
  assert.ok(!unicode.result.isError, 'count Unicode characters rather than UTF-16 code units');

  console.log('SESSION IDENTITY OK: one MCP transport keeps one human-visible session across reinitialize');
  clearTimeout(timeout);
  child.kill();
  setTimeout(() => process.exit(0), 80);
})().catch((error) => {
  console.error('SESSION IDENTITY FAIL:', error && error.stack || error);
  clearTimeout(timeout);
  child.kill();
  try { fs.rmSync(home, { recursive: true, force: true }); } catch (e) {}
  process.exit(1);
});
