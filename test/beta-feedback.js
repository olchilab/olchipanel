// Regression coverage for the first public beta feedback round.
'use strict';

const assert = require('assert');
const fs = require('fs');
const net = require('net');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const CLI = path.join(ROOT, 'bin', 'olchipanel.js');

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

function stopChild(child) {
  return new Promise((resolve) => {
    if (!child || child.exitCode !== null) return resolve();
    const timer = setTimeout(resolve, 3000);
    child.once('exit', () => { clearTimeout(timer); resolve(); });
    child.kill();
  });
}

async function testCli() {
  const help = spawnSync(process.execPath, [CLI, '--help'], { encoding: 'utf8' });
  assert.strictEqual(help.status, 0, help.stderr);
  assert.match(help.stdout, /olchipanel open/);
  assert.match(help.stdout, /Ctrl\+C/);
  assert.match(help.stdout, /olchipanel stop/);

  const unknown = spawnSync(process.execPath, [CLI, 'definitely-not-a-command'], { encoding: 'utf8' });
  assert.strictEqual(unknown.status, 1);
  assert.match(unknown.stderr, /unknown command/);

  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'olchipanel-open-'));
  const port = await freePort();
  const child = spawn(process.execPath, [CLI, 'open'], {
    cwd: ROOT,
    env: {
      ...process.env,
      OLCHIPANEL_HOME: home,
      OLCHIPANEL_PORT: String(port),
      OLCHIPANEL_OPEN: '0',
      OLCHIPANEL_NO_UPDATE_CHECK: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', d => { output += d.toString(); });
  child.stderr.on('data', d => { output += d.toString(); });
  const deadline = Date.now() + 10000;
  while ((!/olchipanel READY/.test(output) || !/Keep this terminal open/.test(output)) && Date.now() < deadline) {
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  try {
    assert.match(output, /opening the board/);
    assert.match(output, new RegExp(`127\\.0\\.0\\.1:${port}`));
    assert.match(output, /Keep this terminal open/);
  } finally {
    await stopChild(child);
    fs.rmSync(home, { recursive: true, force: true });
  }
}

async function testMcpContracts() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'olchipanel-mcp-'));
  const port = await freePort();
  const child = spawn(process.execPath, [CLI], {
    cwd: ROOT,
    env: { ...process.env, OLCHIPANEL_HOME: home, OLCHIPANEL_PORT: String(port), OLCHIPANEL_NO_UPDATE_CHECK: '1' },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let nextId = 1;
  let buffer = '';
  const waiting = new Map();
  child.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      const msg = JSON.parse(line);
      const waiter = waiting.get(msg.id);
      if (waiter) { waiting.delete(msg.id); waiter.resolve(msg); }
    }
  });
  function request(method, params) {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { waiting.delete(id); reject(new Error(`timeout waiting for ${method}`)); }, 10000);
      waiting.set(id, { resolve: (msg) => { clearTimeout(timer); resolve(msg); } });
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
  }

  try {
    const init = await request('initialize', {
      protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'beta-feedback-test', version: '0' },
    });
    assert(init.result && init.result.serverInfo);
    assert(init.result.instructions.length < 500, 'server instructions should stay compact for clients that repeat them per tool');

    const listed = await request('tools/list', {});
    const tools = listed.result.tools;
    assert(tools.every(t => !t.description.includes('live situation board for the HUMAN')),
      'common server guidance must not be copied into tool descriptions');
    const addStep = tools.find(t => t.name === 'add_step');
    const setStatus = tools.find(t => t.name === 'set_status');
    const itemSchema = addStep.inputSchema.properties.steps.items;
    assert.deepStrictEqual(itemSchema.required, ['id', 'label']);
    assert(itemSchema.properties.id && itemSchema.properties.label && itemSchema.properties.parent_id);
    assert(itemSchema.properties.status.enum.includes('container'));
    assert(setStatus.inputSchema.properties.status.enum.includes('container'));

    const added = await request('tools/call', { name: 'add_step', arguments: { steps: [
      { id: 'root', label: 'Whole project', status: 'next' },
      { id: 'child', label: 'Current work', parent_id: 'root', status: 'now' },
    ] } });
    assert(!added.result.isError, JSON.stringify(added));
    const files = fs.readdirSync(path.join(home, 'sessions')).filter(f => f.endsWith('.json'));
    assert.strictEqual(files.length, 1);
    let session = JSON.parse(fs.readFileSync(path.join(home, 'sessions', files[0]), 'utf8'));
    assert.strictEqual(session.map.tree.status, 'container', 'ancestor of current child should be a plain container');
    assert.strictEqual(session.map.tree.children[0].status, 'now');

    const explicit = await request('tools/call', { name: 'set_status', arguments: { id: 'root', status: 'container' } });
    assert(!explicit.result.isError, JSON.stringify(explicit));
    session = JSON.parse(fs.readFileSync(path.join(home, 'sessions', files[0]), 'utf8'));
    assert.strictEqual(session.map.tree.status, 'container');
  } finally {
    child.stdin.end();
    await stopChild(child);
    fs.rmSync(home, { recursive: true, force: true });
  }
}

function testExportSurface() {
  const html = fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8');
  assert.match(html, /id="exportBtn"/);
  assert.match(html, /function exportSnapshot\(\)/);
  assert.match(html, /text\/markdown/);
}

(async () => {
  await testCli();
  await testMcpContracts();
  testExportSurface();
  console.log('BETA FEEDBACK REGRESSIONS OK');
})().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
