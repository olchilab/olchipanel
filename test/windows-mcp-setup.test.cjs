'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { parse } = require('smol-toml');
const { planRegistration, applyRegistration, runSetup, targetFor } = require('../desktop/windows-mcp-setup.cjs');

function fixture() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'olchi-install-'));
  return { home, env: {}, command: process.execPath, script: __filename, platform: 'win32' };
}
for (const agent of ['codex', 'claude']) {
  test(`${agent}: consent, existing settings/backup preserved, repeat unchanged`, async () => {
    const opts = fixture(), file = targetFor(agent, opts.home, {});
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const original = agent === 'codex' ? '\uFEFF# retain comment\r\nmodel = "test"\r\n' : '{"projects":{"private":{"trust":true}},"mcpServers":{"other":{"command":"keep"}}}';
    fs.writeFileSync(file, original);
    const plan = planRegistration({ ...opts, agent });
    assert.equal(fs.readFileSync(file, 'utf8'), original);
    const result = applyRegistration(plan);
    assert.equal(fs.readFileSync(result.backup, 'utf8'), original);
    const after = fs.readFileSync(file, 'utf8');
    const data = agent === 'codex' ? parse(after.replace(/^\uFEFF/, '')) : JSON.parse(after);
    if (agent === 'codex') { assert.ok(after.startsWith(original)); assert.equal(data.model, 'test'); }
    else { assert.equal(data.projects.private.trust, true); assert.equal(data.mcpServers.other.command, 'keep'); }
    assert.equal(planRegistration({ ...opts, agent }).changed, false);
    assert.equal(applyRegistration(planRegistration({ ...opts, agent })).status, 'already-registered');
    assert.equal(fs.readFileSync(file, 'utf8'), after);
  });
  test(`${agent}: malformed, conflicting and changed files never overwritten`, () => {
    const opts = fixture(), file = targetFor(agent, opts.home, {});
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, 'broken{');
    assert.throws(() => planRegistration({ ...opts, agent }), /형식 오류/);
    fs.writeFileSync(file, agent === 'codex' ? '[mcp_servers.olchipanel]\ncommand="other"' : '{"mcpServers":{"olchipanel":{"command":"other"}}}');
    assert.throws(() => planRegistration({ ...opts, agent }), /덮어쓰지/);
    fs.writeFileSync(file, agent === 'codex' ? '# original' : '{}');
    const plan = planRegistration({ ...opts, agent });
    fs.appendFileSync(file, ' ');
    const concurrent = fs.readFileSync(file);
    assert.throws(() => applyRegistration(plan), /설정이 변경/);
    assert.deepEqual(fs.readFileSync(file), concurrent);
  });
}
test('defer and consent cancellation write nothing', async () => {
  for (const responses of [[3], [0, 1], [1, 1], [2, 1]]) {
    const opts = fixture();
    const result = await runSetup({ ...opts, show: async () => ({ response: responses.shift() }) });
    assert.equal(result.status, 'deferred');
    assert.deepEqual(fs.readdirSync(opts.home), []);
  }
});
test('both agents consent, reload and same registration', async () => {
  const opts = fixture();
  for (let i = 0; i < 2; i++) {
    const responses = [2, 0, 0], dialogs = [];
    const result = await runSetup({ ...opts, show: async options => { dialogs.push(options); return { response: responses.shift() }; } });
    assert.equal(result.status, 'registered');
    assert.equal(result.results.length, 2);
    assert.ok(result.results.every(r => r.status === (i ? 'already-registered' : 'registered')));
    assert.equal(dialogs[1].defaultId, 1);
    assert.match(dialogs[2].detail, /실제 에이전트 연결은 아직 확인되지/);
  }
});
test('preflight conflict on second agent leaves first untouched', async () => {
  const opts = fixture();
  fs.writeFileSync(targetFor('claude', opts.home, {}), '{invalid');
  const responses = [2, 0];
  assert.equal((await runSetup({ ...opts, show: async () => ({ response: responses.shift() }) })).status, 'failed');
  assert.equal(fs.existsSync(targetFor('codex', opts.home, {})), false);
});
test('unsupported platforms do not prompt or write', async () => {
  const opts = fixture();
  assert.equal((await runSetup({ ...opts, platform: 'darwin', show: () => { throw new Error('unexpected dialog'); } })).status, 'unsupported');
  assert.deepEqual(fs.readdirSync(opts.home), []);
});
test('existing setup lock preserves configuration', () => {
  const opts = fixture(), plan = planRegistration({ ...opts, agent: 'claude' });
  fs.writeFileSync(plan.file + '.olchipanel.lock', 'other owner');
  assert.throws(() => applyRegistration(plan), /EEXIST/);
  assert.equal(fs.existsSync(plan.file), false);
  assert.equal(fs.readFileSync(plan.file + '.olchipanel.lock', 'utf8'), 'other owner');
});
test('doctor recognizes installed runtime without npm/npx and reads Claude user config', async () => {
  const opts = fixture();
  const command = path.join(opts.home, 'app', 'OlchiPanel.exe');
  const archive = path.join(path.dirname(command), 'resources', 'app.asar');
  fs.mkdirSync(path.dirname(archive), { recursive: true });
  fs.writeFileSync(command, 'fixture');
  fs.writeFileSync(archive, 'fixture');
  const script = path.join(archive, 'bin', 'olchipanel.js');
  for (const agent of ['codex', 'claude']) applyRegistration(planRegistration({ ...opts, command, script, agent }));
  const report = await require('../src/doctor').inspect({ home: opts.home, cwd: opts.home, env: {},
    nodeVersion: 'v24.0.0', npmProbe: { available: false }, npxProbe: { available: false },
    browserProbe: { available: false }, viewerProbe: { live: false } });
  assert.equal(report.bundledRuntime, true);
  assert.equal(report.configs.claude.current, true);
  assert.equal(report.configs.codex.current, true);
  assert.equal(report.ready, true);
  assert.match(require('../src/doctor').format(report), /connection not verified/);
});
