'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const pkg = require('../package.json');
const skill = fs.readFileSync(path.join(ROOT, 'skills', 'olchipanel-plan', 'SKILL.md'), 'utf8');
const openai = fs.readFileSync(path.join(ROOT, 'skills', 'olchipanel-plan', 'agents', 'openai.yaml'), 'utf8');
const mcp = fs.readFileSync(path.join(ROOT, 'src', 'mcp.js'), 'utf8');
const authorSkill = fs.readFileSync(path.join(ROOT, 'skills', 'olchipanel-plan-author', 'SKILL.md'), 'utf8');
const authorOpenai = fs.readFileSync(path.join(ROOT, 'skills', 'olchipanel-plan-author', 'agents', 'openai.yaml'), 'utf8');
const authorContract = fs.readFileSync(path.join(ROOT, 'skills', 'olchipanel-plan-author', 'references', 'planning-contract.md'), 'utf8');
const authorSchema = require('../skills/olchipanel-plan-author/references/olchipanel-plan-author.v1.schema.json');
const softwarePlan = require('../skills/olchipanel-plan-author/assets/software-release-plan.json');
const workshopPlan = require('../skills/olchipanel-plan-author/assets/community-workshop-plan.json');
const runnerSkill = fs.readFileSync(path.join(ROOT, 'skills', 'olchipanel-plan-runner', 'SKILL.md'), 'utf8');
const runnerOpenai = fs.readFileSync(path.join(ROOT, 'skills', 'olchipanel-plan-runner', 'agents', 'openai.yaml'), 'utf8');
const runnerContract = fs.readFileSync(path.join(ROOT, 'skills', 'olchipanel-plan-runner', 'references', 'execution-contract.md'), 'utf8');

assert(pkg.files.includes('skills'), 'npm package must include portable skills');
assert.match(skill, /^---\s+[\s\S]*name: olchipanel-plan\s+[\s\S]*---/);
assert.match(skill, /Do not activate for ordinary planning/i, 'ordinary planning must not silently opt into OlchiPanel');
for (const tool of ['plan_list', 'plan_open', 'plan_add', 'plan_set', 'plan_apply']) {
  assert(skill.includes('`' + tool + '`'), `plan skill missing ${tool}`);
}
assert.match(skill, /같이 이어쓰기[\s\S]*사본 보내기[\s\S]*내보내기 \/ 가져오기/, 'skill must distinguish sharing, copying, and computer transfer');
assert.match(skill, /olchipanel\.plan-transfer\.v1/, 'skill must name the portable transfer contract');
assert.match(skill, /missing reference, unclear intent[\s\S]*ask and wait before mutating/i,
  'maintenance must not convert uncertainty into speculative cards');
assert.match(skill, /small revision[\s\S]*route back to `olchipanel-plan-author`/i,
  'maintenance must stop when incremental scope becomes substantive authoring');
assert.match(mcp, /refreshPlanBinding[\s\S]*plan_list/, 'MCP must notice a plan attached by the app');
assert.match(openai, /\$olchipanel-plan/, 'skill UI prompt must name the skill explicitly');

assert.match(authorSkill, /^---\s+[\s\S]*name: olchipanel-plan-author\s+[\s\S]*---/);
assert.match(authorSkill, /If the human explicitly asks[\s\S]*If planning merely seems useful[\s\S]*wait/i,
  'author skill must remain opt-in while allowing one non-mutating offer');
assert.match(authorSkill, /offer OlchiPanel Plan once and wait[\s\S]*do not create or apply anything until the human opts in/i,
  'author skill must offer rather than silently activate during ordinary planning');
assert.match(authorSkill, /Ask whether the human has preferred references[\s\S]*gather the smallest useful set of authoritative references/i,
  'author skill must check supplied references before gathering only consequential gaps');
assert.match(authorSkill, /state the research or consultation need early[\s\S]*expert or specialist review/i,
  'author skill must surface and seek needed consultation before drafting');
assert.match(authorSkill, /Use live search when freshness can change the answer[\s\S]*If live search is unavailable/i,
  'author skill must live-verify time-sensitive planning facts or leave them unresolved');
assert.match(authorSkill, /Run a confidence gate[\s\S]*Wait for the answer/i,
  'author skill must stop for material uncertainty instead of guessing through it');
assert.match(authorSkill, /Show that direction as a short checkpoint and wait for confirmation[\s\S]*initial opt-in[\s\S]*not approval/i,
  'author skill must separate Plan opt-in from draft approval');
assert.match(authorSkill, /Do not move from first hearing a new objective to `plan_apply` in the same response/i,
  'author skill must block one-shot plan application');
assert.match(authorSkill, /Prefer the minimum plan[\s\S]*Do not add future-scale architecture/i,
  'author skill must guard against speculative overdesign');
assert.match(authorSkill, /canonical product version[\s\S]*terminal release checkpoint/i,
  'software planning must use the current version as a bounded closure unit');
assert.match(authorSkill, /`plan_apply`[\s\S]*`plan_list` with `detail: true`/, 'author skill must explain apply and structured inspection');
assert.match(authorOpenai, /\$olchipanel-plan-author/, 'author skill UI prompt must name the skill explicitly');
assert.strictEqual(authorSchema.properties.schema.const, 'olchipanel.plan-author.v1');
assert(authorSchema.required.includes('schema') && authorSchema.$defs.plan.required.includes('successCriteria'));
assert.strictEqual(softwarePlan.schema, 'olchipanel.plan-author.v1');
assert.strictEqual(workshopPlan.schema, 'olchipanel.plan-author.v1');
assert.notStrictEqual(softwarePlan.plan.title, workshopPlan.plan.title, 'fixtures must exercise distinct domains');
for (const source of ['Superpowers', 'Planning with Files', 'GitHub Spec Kit', 'Linear roadmap planning', 'Shape Up']) {
  assert(authorContract.includes(source), `planning contract missing source ${source}`);
}
assert.match(authorContract, /Progressive planning cadence[\s\S]*Confirm direction before decomposition/, 'planning contract must define iterative confirmation');
assert.match(authorContract, /Sufficiency without research theatre[\s\S]*Stop gathering/, 'planning contract must bound reference collection');
assert.match(authorContract, /Use live search for time-sensitive claims[\s\S]*Record when the lookup occurred/i,
  'planning contract must preserve freshness evidence for volatile facts');
assert.match(authorContract, /Software releases close as version units[\s\S]*human decision/i,
  'planning contract must keep version closure evidence-based and human-controlled');
const releaseGate = softwarePlan.plan.items.find(item => item.key === 'C2');
assert(softwarePlan.plan.title.startsWith('0.8.2 ·'), 'software fixture must name its canonical version boundary');
assert(releaseGate && releaseGate.kind === 'checkpoint' && releaseGate.dependsOn.includes('C1'),
  'software fixture must end in a dependency-backed release checkpoint');
assert.match(mcp, /name: 'plan_apply'[\s\S]*inputSchema: planAuthorSchema/, 'MCP must expose the canonical schema directly');
assert.match(mcp, /plan_list\(\{ status, detail \}/, 'MCP must support structured detail reads');

assert.match(runnerSkill, /^---\s+[\s\S]*name: olchipanel-plan-runner\s+[\s\S]*---/);
assert.match(runnerSkill, /Use only when the human asks to execute or continue an OlchiPanel plan/i, 'runner must remain opt-in');
for (const tool of ['plan_next', 'plan_step', 'plan_list']) {
  assert(runnerSkill.includes('`' + tool + '`'), `runner skill missing ${tool}`);
}
assert.match(runnerSkill, /freshly[\s\S]*evidence object/i, 'runner must require fresh completion evidence');
assert.match(runnerSkill, /required source material is missing[\s\S]*do not invent the answer[\s\S]*after confirmation/i,
  'runner must pause for missing sources or material ambiguity');
assert.match(runnerSkill, /does not authorize the runner to redesign/i,
  'runner must return plan-design holes instead of expanding execution scope');
assert.match(runnerSkill, /version-bounded software plan[\s\S]*does not by itself close the version/i,
  'runner must not confuse an empty frontier with version closure');
assert.match(runnerSkill, /Never increment the product version[\s\S]*human/i,
  'runner must leave version advancement to the human');
assert.match(runnerOpenai, /\$olchipanel-plan-runner/, 'runner skill UI prompt must name the skill explicitly');
assert.match(runnerContract, /State machine[\s\S]*Concurrency and retries[\s\S]*Compatibility/, 'runner reference must cover execution recovery');
assert.match(runnerContract, /terminal release checkpoint[\s\S]*No runnable cards remaining is not equivalent/i,
  'runner contract must define the version closure gate');
assert.match(mcp, /name: 'plan_next'[\s\S]*name: 'plan_step'/, 'MCP must expose frontier and strict transition tools');
assert.match(mcp, /action: \{ type: 'string', enum: \['start', 'pause', 'complete'\]/, 'plan_step must publish a typed action enum');

console.log('PLAN SKILL OK: author, runner, typed execution, and transfer guidance ready');
