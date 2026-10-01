'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { setupProject } = require('../src/project-setup');
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'olchipanel-setup-'));
function project(name) {
  const dir = path.join(base, name); fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, 'AGENTS.md'), '\ufeff# User rules\r\nKeep my text.');
  return dir;
}
const root = project('normal');
const original = fs.readFileSync(path.join(root, 'AGENTS.md'));
const preview = setupProject(root, { dryRun: true });
assert(preview.changed > 2);
assert.deepStrictEqual(fs.readdirSync(root), ['AGENTS.md'], 'preview must write nothing');
const result = setupProject(root);
assert(result.changed === preview.changed);
assert(fs.readFileSync(path.join(root, 'AGENTS.md')).subarray(0, original.length).equals(original), 'preserve original bytes');
for (const vendor of ['.agents', '.claude']) {
  assert(fs.existsSync(path.join(root, vendor, 'skills/olchipanel-track/references/project-start.md')));
  assert(fs.existsSync(path.join(root, vendor, 'skills/olchipanel-track/references/recording-contract.md')));
}
const mtimes = result.files.map(f => fs.statSync(path.join(root, f.path)).mtimeMs);
assert.strictEqual(setupProject(root).changed, 0);
assert.deepStrictEqual(result.files.map(f => fs.statSync(path.join(root, f.path)).mtimeMs), mtimes, 'repeat must not rewrite files');

const conflict = project('conflict');
fs.mkdirSync(path.join(conflict, '.claude/skills/olchipanel-track'), { recursive: true });
fs.writeFileSync(path.join(conflict, '.claude/skills/olchipanel-track/SKILL.md'), 'custom skill');
assert.throws(() => setupProject(conflict), /Existing skill differs/);
assert(!fs.existsSync(path.join(conflict, '.agents')), 'conflict preflight must prevent partial writes');
assert(!fs.existsSync(path.join(conflict, 'CLAUDE.md')));
assert(fs.readFileSync(path.join(conflict, 'AGENTS.md')).equals(original));
const broken = project('broken');
fs.appendFileSync(path.join(broken, 'AGENTS.md'), '\n<!-- olchipanel:project-start:v1 -->');
assert.throws(() => setupProject(broken), /instruction block differs/);
assert(!fs.existsSync(path.join(broken, '.agents')));
const linked = project('linked');
fs.symlinkSync(root, path.join(linked, '.agents'), process.platform === 'win32' ? 'junction' : 'dir');
assert.throws(() => setupProject(linked), /linked path/);
const locked = project('locked');
fs.writeFileSync(path.join(locked, '.olchipanel-setup.lock'), 'another owner');
assert.throws(() => setupProject(locked), /EEXIST/);
assert.strictEqual(fs.readFileSync(path.join(locked, '.olchipanel-setup.lock'), 'utf8'), 'another owner');

const cli = path.join(__dirname, '..', 'bin', 'olchipanel.js');
const cliRoot = project('cli');
let run = spawnSync(process.execPath, [cli, 'setup', '--project', cliRoot, '--check'], { encoding: 'utf8' });
assert.strictEqual(run.status, 0, run.stderr);
assert(!fs.existsSync(path.join(cliRoot, 'CLAUDE.md')));
run = spawnSync(process.execPath, [cli, 'setup', '--project', cliRoot], { encoding: 'utf8' });
assert.strictEqual(run.status, 0, run.stderr);
assert(fs.existsSync(path.join(cliRoot, 'CLAUDE.md')));

function mcp(cwd, calls) {
  const home = path.join(cwd, 'runtime');
  const messages = [{ jsonrpc: '2.0', id: 1, method: 'initialize', params: { clientInfo: { name: 'setup-test' } } }, ...calls];
  const run = spawnSync(process.execPath, [cli], { cwd,
    env: { ...process.env, OLCHIPANEL_HOME: home, OLCHIPANEL_PORT: '0', OLCHIPANEL_OPEN: '0', OLCHIPANEL_NO_UPDATE_CHECK: '1' },
    input: messages.map(m=>JSON.stringify(m)).join('\n')+'\n', encoding: 'utf8', timeout: 8000 });
  assert.strictEqual(run.status, 0, run.stderr);
  return run.stdout.trim().split('\n').map(line=>JSON.parse(line));
}
const idle = project('idle');
mcp(idle, [{ jsonrpc:'2.0',id:2,method:'tools/list',params:{} }]);
assert.deepStrictEqual(fs.readdirSync(idle), ['AGENTS.md'], 'startup/discovery/shutdown must not set up project or panel');
const active = project('active');
const calls = [{ jsonrpc:'2.0',id:2,method:'tools/call',params:{name:'start_project',arguments:{}} }];
const replies = mcp(active, calls);
assert(!replies.find(r=>r.id===2).result.isError);
assert(fs.existsSync(path.join(active, 'CLAUDE.md')), 'real MCP must install both agent guides');
const failed = mcp(conflict, calls);
assert(failed.find(r=>r.id===2).result.isError);
assert(!fs.existsSync(path.join(conflict, 'runtime')), 'setup conflict must not register a panel or viewer');
console.log('PROJECT SETUP PASS: CLI/MCP, no automatic startup writes, repeat, original bytes, conflicts, links, locks');
