'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const pkg = require('../package.json');
const mcp = fs.readFileSync(path.join(ROOT, 'src', 'mcp.js'), 'utf8');
const skill = fs.readFileSync(path.join(ROOT, 'skills', 'olchipanel-track', 'SKILL.md'), 'utf8');
const contract = fs.readFileSync(path.join(ROOT, 'skills', 'olchipanel-track', 'references', 'recording-contract.md'), 'utf8');
const openai = fs.readFileSync(path.join(ROOT, 'skills', 'olchipanel-track', 'agents', 'openai.yaml'), 'utf8');

assert(pkg.files.includes('skills'), 'npm package must include the portable tracking skill');
assert.match(skill, /^---\s+[\s\S]*name: olchipanel-track\s+[\s\S]*---/);
assert.match(skill, /explicitly asks[\s\S]*never activates/i, 'skill discovery must preserve explicit human opt-in');
assert.match(skill, /references\/recording-contract\.md/, 'detailed recording rules must stay progressively disclosed');
assert.match(openai, /\$olchipanel-track/, 'skill UI prompt must name the skill explicitly');

for (const tool of ['resume_project', 'name_session', 'set_goal', 'add_step', 'set_status',
  'plan_open', 'plan_add', 'plan_set', 'log_change', 'add_decision', 'log_deadend', 'need_human', 'get_panel']) {
  assert(contract.includes('`' + tool + '`'), `recording contract missing ${tool}`);
}

const compact = mcp.match(/const INSTRUCTIONS = `([^`]*)`;/);
assert(compact, 'compact MCP instructions must remain a single auditable string');
assert(compact[1].length < 500, `compact MCP instructions cost regressed to ${compact[1].length} chars`);
assert.match(compact[1], /explicitly asks/i, 'MCP instructions must retain the opt-in gate');
assert.match(compact[1], /Do not mirror/i, 'MCP instructions must suppress transcript-like token waste');

console.log(`TRACKING SKILL OK: packaged guide + ${compact[1].length}-char MCP contract`);
