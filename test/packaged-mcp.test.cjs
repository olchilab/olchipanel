'use strict';
// Transport-only check: no panel tool calls, no real user config or sessions.
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, spawnSync } = require('child_process');
const exe = process.argv[2] || path.resolve('dist-desktop/win-unpacked/OlchiPanel.exe');
const script = process.argv[3] || path.join(path.dirname(exe), 'resources', 'app.asar', 'bin', 'olchipanel.js');
const home = fs.mkdtempSync(path.join(os.tmpdir(), 'olchi-packed-mcp-'));
const child = spawn(exe, [script], { windowsHide: true, env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', OLCHIPANEL_HOME: home, OLCHIPANEL_OPEN: '0', OLCHIPANEL_NO_UPDATE_CHECK: '1' }, stdio: ['pipe', 'pipe', 'pipe'] });
let out = '', err = '';
child.stderr.on('data', d => { err += d; });
const timer = setTimeout(() => { child.kill(); console.error('packaged MCP timeout', err); process.exitCode = 1; }, 10000);
child.on('error', e => { clearTimeout(timer); console.error(e.message); process.exitCode = 1; });
child.stdout.on('data', d => {
  out += d;
  const messages = out.split('\n').filter(Boolean).flatMap(s => { try { return [JSON.parse(s)]; } catch (_) { return []; } });
  if (!messages.some(m => m.id === 2)) return;
  clearTimeout(timer);
  try {
    assert.equal(messages.find(m => m.id === 1).result.serverInfo.version, require('../package.json').version);
    assert.ok(messages.find(m => m.id === 2).result.tools.some(t => t.name === 'start_project'));
    const sessions = path.join(home, 'sessions');
    assert.ok(!fs.existsSync(sessions) || fs.readdirSync(sessions).length === 0);
    const project = path.join(home, 'project');
    fs.mkdirSync(project);
    fs.writeFileSync(path.join(project, 'package.json'), '{}');
    for (let i = 0; i < 2; i++) {
      const setup = spawnSync(exe, [script, 'setup', '--project', project], {
        encoding: 'utf8', timeout: 10000, windowsHide: true,
        env: { ...process.env, ELECTRON_RUN_AS_NODE: '1', OLCHIPANEL_HOME: home, OLCHIPANEL_OPEN: '0' },
      });
      assert.equal(setup.status, 0, setup.stderr);
      if (i) assert.match(setup.stdout, /"changed": 0/);
    }
    for (const folder of ['.agents', '.claude']) assert.ok(fs.existsSync(path.join(project, folder, 'skills', 'olchipanel-track', 'SKILL.md')));
    assert.ok(!fs.existsSync(sessions) || fs.readdirSync(sessions).length === 0);
    console.log('packaged MCP PASS: initialize, start_project discovery, bundled project skills/setup/repeat, no startup session; ' + exe);
  } catch (e) { console.error(e.message, err); process.exitCode = 1; }
  child.kill();
});
for (const [id, method, params] of [[1, 'initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'packaging-test', version: '1' } }], [2, 'tools/list', {}]]) {
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
}
