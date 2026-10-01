'use strict';

const assert = require('assert');
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const net = require('net');
const os = require('os');
const path = require('path');

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'olchipanel-multi-agent-'));
const children = [];

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

function makeAgent(port, name) {
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'bin', 'olchipanel.js')], {
    env: { ...process.env, OLCHIPANEL_HOME: home, OLCHIPANEL_PORT: String(port), OLCHIPANEL_OPEN: '0', OLCHIPANEL_NO_UPDATE_CHECK: '1' },
    stdio: ['pipe', 'pipe', 'inherit'],
  });
  children.push(child);
  let buffer = '';
  let nextId = 1;
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
  return {
    child,
    rpc(method, params) {
      const id = nextId++;
      return new Promise((resolve) => {
        pending.set(id, resolve);
        child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
      });
    },
    initialize() {
      return this.rpc('initialize', {
        protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name, version: '1' },
      });
    },
  };
}

function waitFor(check, timeoutMs) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      try { if (check()) return resolve(); } catch (e) {}
      if (Date.now() - started > timeoutMs) return reject(new Error('timed out waiting for the shared viewer'));
      setTimeout(tick, 50);
    };
    tick();
  });
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    }).on('error', reject);
  });
}

async function waitForJson(url, predicate, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started <= timeoutMs) {
    try {
      const value = await getJson(url);
      if (predicate(value)) return value;
    } catch (e) {}
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error('timed out waiting for shared viewer state');
}

function cleanup() {
  children.forEach((child) => { try { child.kill(); } catch (e) {} });
  setTimeout(() => { try { fs.rmSync(home, { recursive: true, force: true }); } catch (e) {} }, 100);
}

const timeout = setTimeout(() => {
  cleanup();
  console.error('MULTI AGENT FAIL: timeout');
  process.exit(1);
}, 20000);

(async () => {
  const port = await freePort();
  const agents = ['claude', 'codex', 'cursor', 'antigravity'].map((name) => makeAgent(port, name));
  await Promise.all(agents.map((agent) => agent.initialize()));
  await Promise.all(agents.map((agent, index) => agent.rpc('tools/call', {
    name: 'set_goal', arguments: { goal: `parallel goal ${index + 1}` },
  })));

  const viewerFile = path.join(home, 'viewer.json');
  await waitFor(() => fs.existsSync(viewerFile), 6000);
  const viewerUrl = JSON.parse(fs.readFileSync(viewerFile, 'utf8')).url;
  let state = await waitForJson(viewerUrl + '/api/state', (value) => value.sessions.length === 4, 6000);
  assert.strictEqual(state.sessions.length, 4, 'four real agents must appear as four sidebar sessions');
  assert.strictEqual(new Set(state.sessions.map((session) => session.id)).size, 4, 'real parallel agents must retain distinct identities');
  assert.strictEqual(new Set(state.sessions.map((session) => session.goal)).size, 4, 'each sidebar row must retain its own work state');

  await new Promise((resolve) => setTimeout(resolve, 1100));
  await agents[0].initialize();
  await agents[0].rpc('tools/call', { name: 'name_session', arguments: { name: 'claude reconnected' } });
  state = await getJson(viewerUrl + '/api/state');
  assert.strictEqual(state.sessions.length, 4, 're-initializing one transport must not add a fifth sidebar row');
  assert.ok(state.sessions.some((session) => session.name === 'claude reconnected'), 'the reconnected agent must keep updating its original row');

  console.log('MULTI AGENT OK: four agents share one viewer and four logical sidebar rows; reconnect stays at four');
  clearTimeout(timeout);
  cleanup();
  setTimeout(() => process.exit(0), 180);
})().catch((error) => {
  console.error('MULTI AGENT FAIL:', error && error.stack || error);
  clearTimeout(timeout);
  cleanup();
  process.exit(1);
});
