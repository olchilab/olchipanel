'use strict';

const assert = require('assert');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const doctor = require('../src/doctor');

async function run() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'olchipanel-doctor-'));
  const home = path.join(root, 'home');
  const project = path.join(root, 'project');
  fs.mkdirSync(path.join(home, '.codex'), { recursive: true });
  fs.mkdirSync(path.join(home, '.gemini', 'config'), { recursive: true });
  fs.mkdirSync(project, { recursive: true });

  fs.writeFileSync(path.join(home, '.codex', 'config.toml'),
    '[mcp_servers.olchipanel]\ncommand = "npx"\nargs = ["-y", "olchipanel@latest"]\n');
  fs.writeFileSync(path.join(home, '.gemini', 'config', 'mcp_config.json'), JSON.stringify({
    mcpServers: { olchipanel: { command: 'npx', args: ['-y', 'olchipanel@latest'] } },
  }));

  const ready = await doctor.inspect({
    home, cwd: project, olchiHome: path.join(root, 'olchi'), nodeVersion: 'v22.18.0',
    npmProbe: { available: true, version: '10.9.3' }, npxProbe: { available: true, version: '10.9.3' },
    browserProbe: { available: true, name: 'Chrome', path: '/fake/chrome' }, viewerProbe: { live: false },
  });
  assert.strictEqual(ready.ready, true);
  assert.deepStrictEqual(ready.configuredAgents.sort(), ['antigravity', 'codex']);
  assert.strictEqual(ready.configs.claude.configured, false, 'project Claude config must not be guessed');
  assert.strictEqual(ready.viewer.live, false, 'stopped on-demand viewer is informational, not a blocker');
  assert.match(doctor.format(ready), /READY/);

  fs.writeFileSync(path.join(project, '.mcp.json'), '{ broken json');
  const broken = await doctor.inspect({
    home, cwd: project, nodeVersion: 'v16.20.0',
    npmProbe: { available: false, version: '' }, npxProbe: { available: false, version: '' },
    browserProbe: { available: false, name: '', path: '' }, viewerProbe: { live: false },
  });
  assert.strictEqual(broken.ready, false);
  assert(broken.blockers.includes('node_unsupported'));
  assert(broken.blockers.includes('npm_missing'));
  assert(broken.blockers.includes('npx_missing'));
  assert(broken.blockers.includes('invalid_config'));
  assert.strictEqual(fs.readFileSync(path.join(project, '.mcp.json'), 'utf8'), '{ broken json',
    'doctor must never repair or overwrite invalid config');

  process.env.OLCHIPANEL_HOME = path.join(root, 'viewer-home');
  process.env.OLCHIPANEL_PORT = '0';
  process.env.OLCHIPANEL_NO_UPDATE_CHECK = '1';
  const viewer = require('../src/viewer');
  const server = viewer.start();
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/api/doctor`;
  const api = await new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch (error) { reject(error); }
      });
    }).on('error', reject);
  });
  assert.strictEqual(api.status, 200);
  assert.strictEqual(api.body.schema, 'olchipanel.doctor.v1');
  assert(api.body.configs && api.body.configs.antigravity, 'viewer diagnostics must include Antigravity');
  await new Promise(resolve => server.close(resolve));

  fs.rmSync(root, { recursive: true, force: true });
  console.log('DOCTOR OK: read-only Node, npx, viewer, and four-agent diagnostics');
  process.exit(0); // viewer file watchers are intentionally long-lived in production
}

run().catch((error) => {
  console.error('DOCTOR FAIL:', error && error.stack || error);
  process.exit(1);
});
