// smoke.js — boots the MCP server exactly like an agent would, does a real
// initialize handshake, and verifies a session file lands on disk.
// Exit 0 = the npx path works on this OS. Used by CI across win/mac/linux.
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'olchipanel-smoke-'));
const child = spawn(process.execPath, [path.join(__dirname, '..', 'bin', 'olchipanel.js')], {
  env: { ...process.env, OLCHIPANEL_HOME: home, OLCHIPANEL_PORT: '6799' },
  stdio: ['pipe', 'pipe', 'inherit'],
});

const timer = setTimeout(() => {
  console.error('SMOKE FAIL: no initialize response within 15s');
  child.kill();
  process.exit(1);
}, 15000);

let buf = '';
child.stdout.on('data', (d) => {
  buf += d.toString();
  const line = buf.split('\n').find(l => l.includes('"result"'));
  if (!line) return;
  let msg;
  try { msg = JSON.parse(line); } catch (e) { return; } // partial line — wait for more
  if (!msg.result || !msg.result.serverInfo) {
    console.error('SMOKE FAIL: unexpected initialize result:', line);
    process.exit(1);
  }
  const expected = require(path.join(__dirname, '..', 'package.json')).version;
  if (msg.result.serverInfo.version !== expected) {
    console.error(`SMOKE FAIL: serverInfo.version ${msg.result.serverInfo.version} != package.json ${expected}`);
    process.exit(1);
  }
  const sessions = fs.readdirSync(path.join(home, 'sessions')).filter(f => f.endsWith('.json'));
  if (!sessions.length) {
    console.error('SMOKE FAIL: handshake ok but no session file written');
    process.exit(1);
  }
  console.log('SMOKE OK:', msg.result.serverInfo.name, msg.result.serverInfo.version,
    '| session file:', sessions[0], '| os:', process.platform);
  clearTimeout(timer);
  child.kill();
  process.exit(0);
});

child.stdin.write(JSON.stringify({
  jsonrpc: '2.0', id: 1, method: 'initialize',
  params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'smoke', version: '0' } },
}) + '\n');
