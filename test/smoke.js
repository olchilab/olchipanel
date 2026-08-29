// smoke.js — boots the MCP server exactly like an agent would. A startup
// handshake must stay invisible; the first explicit tool call must create the
// session and start the viewer. Used by CI across win/mac/linux.
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const http = require('http');
const path = require('path');
const os = require('os');

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'olchipanel-smoke-'));
const child = spawn(process.execPath, [path.join(__dirname, '..', 'bin', 'olchipanel.js')], {
  env: {
    ...process.env,
    OLCHIPANEL_HOME: home,
    OLCHIPANEL_PORT: '6799',
    OLCHIPANEL_NO_UPDATE_CHECK: '1',
  },
  stdio: ['pipe', 'pipe', 'inherit'],
});

let buf = '';
const pending = new Map();
child.stdout.on('data', (d) => {
  buf += d.toString();
  let nl;
  while ((nl = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, nl); buf = buf.slice(nl + 1);
    if (!line.trim()) continue;
    let msg; try { msg = JSON.parse(line); } catch (e) { continue; }
    const resolve = pending.get(msg.id);
    if (resolve) { pending.delete(msg.id); resolve(msg); }
  }
});

function rpc(id, method, params) {
  return new Promise((resolve) => {
    pending.set(id, resolve);
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
}

function sessionFiles() {
  const dir = path.join(home, 'sessions');
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith('.json')) : [];
}

function waitFor(check, timeoutMs) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      try { if (check()) return resolve(); } catch (e) {}
      if (Date.now() - started >= timeoutMs) return reject(new Error('timed out waiting for opt-in viewer'));
      setTimeout(tick, 40);
    };
    tick();
  });
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', d => { body += d; });
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

const timer = setTimeout(() => {
  console.error('SMOKE FAIL: timeout');
  child.kill();
  process.exit(1);
}, 15000);

(async () => {
  const init = await rpc(1, 'initialize', {
    protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'smoke', version: '0' },
  });
  const expected = require(path.join(__dirname, '..', 'package.json')).version;
  if (!init.result || init.result.serverInfo.version !== expected) {
    throw new Error('unexpected initialize response');
  }
  if (!/Do not call an OlchiPanel tool.*HUMAN explicitly asks/s.test(init.result.instructions || '')) {
    throw new Error('MCP instructions must preserve the human opt-in boundary');
  }
  if (fs.existsSync(path.join(home, 'sessions')) || fs.existsSync(path.join(home, 'viewer.json'))) {
    throw new Error('initialize must not touch panel storage or start a viewer');
  }

  await rpc(2, 'tools/list', {});
  if (fs.existsSync(path.join(home, 'sessions')) || fs.existsSync(path.join(home, 'viewer.json'))) {
    throw new Error('tools/list must remain read-only');
  }

  const used = await rpc(3, 'tools/call', {
    name: 'set_goal', arguments: { goal: 'explicit opt-in smoke' },
  });
  if (used.result?.isError || sessionFiles().length !== 1) {
    throw new Error('first explicit tool call must persist exactly one session');
  }

  const viewerFile = path.join(home, 'viewer.json');
  await waitFor(() => fs.existsSync(viewerFile), 3000);
  const url = JSON.parse(fs.readFileSync(viewerFile, 'utf8')).url;
  const live = await getJson(url + '/api/state');
  if (!live.sessions || live.sessions.length !== 1 || live.sessions[0].goal !== 'explicit opt-in smoke') {
    throw new Error('viewer did not expose the opted-in session');
  }

  console.log('SMOKE OK:', init.result.serverInfo.name, expected,
    '| initialize invisible, explicit tool registered:', sessionFiles()[0], '| os:', process.platform);
  clearTimeout(timer);
  child.kill();
  setTimeout(() => process.exit(0), 100);
})().catch((err) => {
  console.error('SMOKE FAIL:', err && err.stack || err);
  clearTimeout(timer);
  child.kill();
  process.exit(1);
});
