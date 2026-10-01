// plan.js unit tests. Zero deps; isolates state to a temp HOME.
'use strict';
const os = require('os');
const fs = require('fs');
const path = require('path');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'olchipanel-plan-'));
process.env.OLCHIPANEL_HOME = path.join(tmp, '.olchipanel');
const plan = require('../src/plan');
const softwarePlan = require('../skills/olchipanel-plan-author/assets/software-release-plan.json');
const workshopPlan = require('../skills/olchipanel-plan-author/assets/community-workshop-plan.json');

let fails = 0, total = 0;
function ok(label, cond, detail) {
  total++;
  if (!cond) { fails++; console.log('FAIL ' + label + (detail ? ' :: ' + detail : '')); }
  else console.log('PASS ' + label);
}
function throws(label, fn, code) {
  total++;
  try { fn(); fails++; console.log('FAIL ' + label + ' (no throw)'); }
  catch (e) { if (code && e.code !== code) { fails++; console.log('FAIL ' + label + ' (code ' + e.code + ')'); } else console.log('PASS ' + label); }
}

const p = plan.createPlan('My Plan');
ok('create plan', p.id && p.version === 1 && p.items.length === 0);
throws('empty title rejected', () => plan.createPlan('  '), 'bad_title');

const { item, version } = plan.plan_mutate(p.id, 'add', { title: 'first task' });
ok('add item bumps version', version === 2 && item.id.startsWith('itm_'));
ok('add default status/priority', item.status === 'todo' && item.priority === 0);

throws('add bad status', () => plan.plan_mutate(p.id, 'add', { title: 'x', status: 'nope' }), 'bad_status');
throws('add bad priority', () => plan.plan_mutate(p.id, 'add', { title: 'x', priority: 9 }), 'bad_priority');

const child = plan.plan_mutate(p.id, 'add', { title: 'child', parent: item.id });
ok('add child with parent', child.item.parent === item.id);
throws('add with missing parent', () => plan.plan_mutate(p.id, 'add', { title: 'x', parent: 'itm_zzzz' }), 'no_parent');

// optimistic concurrency
const cur = plan.getPlan(p.id);
throws('stale write rejected', () => plan.plan_mutate(p.id, 'update', { id: item.id, patch: { status: 'done' } }, cur.version - 1), 'stale');
const u = plan.plan_mutate(p.id, 'update', { id: item.id, patch: { status: 'in_progress' } }, cur.version);
ok('update with correct baseVersion', u.version === cur.version + 1);
ok('status persisted', plan.getPlan(p.id).items.find((i) => i.id === item.id).status === 'in_progress');

// cycle guard
throws('self-parent rejected', () => plan.plan_mutate(p.id, 'update', { id: item.id, patch: { parent: item.id } }), 'cycle');
throws('cycle rejected', () => plan.plan_mutate(p.id, 'update', { id: item.id, patch: { parent: child.item.id } }), 'cycle');

// delete detaches children
plan.plan_mutate(p.id, 'delete', { id: item.id });
const after = plan.getPlan(p.id);
ok('delete removes item', !after.items.find((i) => i.id === item.id));
ok('child detached to top level', after.items.find((i) => i.id === child.item.id).parent === null);
throws('delete missing item', () => plan.plan_mutate(p.id, 'delete', { id: 'itm_zzzz' }), 'no_item');

// list + session link
plan.plan_mutate(p.id, 'add', { title: 'linked', session: 'sess-123' });
const linked = plan.getPlan(p.id).items.find((i) => i.session === 'sess-123');
ok('session link stored', !!linked);
const plans = plan.listPlans();
ok('listPlans returns summary with counts', plans.length === 1 && plans[0].counts && typeof plans[0].counts === 'object');

// portable transfer: imported plans receive fresh ids, keep task fields, and
// deliberately drop machine-local session ownership.
const bundle = plan.exportPlan(p.id);
ok('export uses portable transfer schema', bundle.schema === plan.TRANSFER_SCHEMA && bundle.plan.title === 'My Plan');
const imported = plan.importPlan(bundle);
ok('import creates an independent plan id', imported.id !== p.id && imported.items.length === bundle.plan.items.length);
ok('import remaps item ids', imported.items.every((it) => !bundle.plan.items.some((source) => source.id === it.id)));
ok('import drops old session ownership', imported.items.every((it) => it.session === null));
throws('non OlchiPanel import rejected', () => plan.importPlan({ schema: 'other', plan: {} }), 'bad_import');

// Parent/child structure and human-authored fields survive the id remap.
const hierarchy = plan.createPlan('Hierarchy');
const parent = plan.plan_mutate(hierarchy.id, 'add', {
  title: 'parent task', priority: 3, labels: ['review'], note: 'finish when checked',
}).item;
plan.plan_mutate(hierarchy.id, 'add', { title: 'child task', parent: parent.id });
const hierarchyCopy = plan.importPlan(plan.exportPlan(hierarchy.id));
const copiedParent = hierarchyCopy.items.find((it) => it.title === 'parent task');
const copiedChild = hierarchyCopy.items.find((it) => it.title === 'child task');
ok('import preserves parent relationship after id remap', copiedChild.parent === copiedParent.id);
ok('import preserves task details', copiedParent.priority === 3 && copiedParent.labels[0] === 'review' && copiedParent.note === 'finish when checked');

// Typed author documents work across domains and preserve planning semantics.
const authoredSoftware = plan.importPlan(softwarePlan);
const softwareT1 = authoredSoftware.items.find((it) => it.key === 'T1');
const softwareT2 = authoredSoftware.items.find((it) => it.key === 'T2');
ok('software author fixture imports with structured brief', authoredSoftware.brief.objective === softwarePlan.plan.objective && authoredSoftware.items.length === softwarePlan.plan.items.length);
ok('author relationships remap to local ids', softwareT2.parent && softwareT2.dependsOn[0] === softwareT1.id && softwareT2.dependsOn[0] !== 'T1');
ok('author completion remains visible and structured', softwareT2.completion && softwareT2.note.includes('완료 조건:'));

const initialFrontier = plan.getPlanFrontier(authoredSoftware.id, 'sess-runner');
ok('frontier separates ready and blocked work', initialFrontier.ready.some((it) => it.key === 'T1') && initialFrontier.blocked.some((it) => it.key === 'T2') && initialFrontier.blocked.some((it) => it.key === 'M1'));
const startedT1 = plan.plan_mutate(authoredSoftware.id, 'step', {
  id: softwareT1.id, action: 'start', session: 'sess-runner',
}, authoredSoftware.version);
ok('runner start claims ready task', startedT1.item.status === 'in_progress' && startedT1.item.session === 'sess-runner' && startedT1.changed);
throws('another session cannot steal active task', () => plan.plan_mutate(authoredSoftware.id, 'step', {
  id: softwareT1.id, action: 'start', session: 'sess-other',
}, startedT1.version), 'claimed');
throws('runner cannot start blocked dependency', () => plan.plan_mutate(authoredSoftware.id, 'step', {
  id: softwareT2.id, action: 'start', session: 'sess-runner',
}, startedT1.version), 'blocked_dependencies');
throws('runner completion requires evidence', () => plan.plan_mutate(authoredSoftware.id, 'step', {
  id: softwareT1.id, action: 'complete', session: 'sess-runner',
}, startedT1.version), 'bad_evidence');
const proof = { key: 'fixture-20260905', summary: 'focused fixture checks passed', ref: 'node test/plan.test.js' };
const completedT1 = plan.plan_mutate(authoredSoftware.id, 'step', {
  id: softwareT1.id, action: 'complete', session: 'sess-runner', evidence: proof,
}, startedT1.version);
ok('runner completion atomically stores proof', completedT1.item.status === 'done' && completedT1.item.evidenceLog.length === 1 && completedT1.item.note.includes(proof.summary));
const retriedCompletion = plan.plan_mutate(authoredSoftware.id, 'step', {
  id: softwareT1.id, action: 'complete', session: 'sess-runner', evidence: proof,
}, completedT1.version);
ok('identical completion retry is idempotent', !retriedCompletion.changed && retriedCompletion.version === completedT1.version && retriedCompletion.item.evidenceLog.length === 1);
const successorRetry = plan.plan_mutate(authoredSoftware.id, 'step', {
  id: softwareT1.id, action: 'complete', session: 'sess-successor', evidence: proof,
}, completedT1.version);
ok('identical completion retry stays safe across sessions', !successorRetry.changed && successorRetry.version === completedT1.version);
throws('same evidence key with different content fails loud', () => plan.plan_mutate(authoredSoftware.id, 'step', {
  id: softwareT1.id, action: 'complete', session: 'sess-runner', evidence: Object.assign({}, proof, { summary: 'different result' }),
}, completedT1.version), 'evidence_conflict');
const advancedFrontier = plan.getPlanFrontier(authoredSoftware.id, 'sess-runner');
ok('completion releases the next dependency', advancedFrontier.ready.some((it) => it.key === 'T2') && !advancedFrontier.ready.some((it) => it.key === 'M1'));
const startedT2 = plan.plan_mutate(authoredSoftware.id, 'step', {
  id: softwareT2.id, action: 'start', session: 'sess-runner',
}, completedT1.version);
const pausedT2 = plan.plan_mutate(authoredSoftware.id, 'step', {
  id: softwareT2.id, action: 'pause', session: 'sess-runner', note: 'waiting for a fresh input',
}, startedT2.version);
ok('pause releases claim and returns task to todo', pausedT2.item.status === 'todo' && pausedT2.item.session === null && pausedT2.item.note.startsWith('waiting for a fresh input'));

const executionCopy = plan.importPlan(plan.exportPlan(authoredSoftware.id));
const executionCopyT1 = executionCopy.items.find((it) => it.key === 'T1');
ok('actual evidence survives transfer without session ownership', executionCopyT1.evidenceLog.length === 1 && executionCopyT1.evidenceLog[0].key === proof.key && executionCopyT1.session === null);
const duplicateEvidence = plan.exportPlan(authoredSoftware.id);
const duplicateEvidenceItem = duplicateEvidence.plan.items.find((it) => it.key === 'T1');
duplicateEvidenceItem.evidenceLog.push(Object.assign({}, duplicateEvidenceItem.evidenceLog[0]));
throws('transfer rejects duplicate evidence keys', () => plan.importPlan(duplicateEvidence), 'bad_import');
const badEvidenceTime = plan.exportPlan(authoredSoftware.id);
badEvidenceTime.plan.items.find((it) => it.key === 'T1').evidenceLog[0].at = 'not-a-time';
throws('transfer rejects invalid evidence timestamp', () => plan.importPlan(badEvidenceTime), 'bad_import');

const unowned = plan.createPlan('Transferred active');
const unownedItem = plan.plan_mutate(unowned.id, 'add', { title: 'resume me', status: 'in_progress' }).item;
const reclaimed = plan.plan_mutate(unowned.id, 'step', {
  id: unownedItem.id, action: 'start', session: 'sess-runner',
}, plan.getPlan(unowned.id).version);
ok('runner can reclaim unowned legacy active work', reclaimed.changed && reclaimed.item.session === 'sess-runner');

const authoredWorkshop = plan.importPlan(workshopPlan);
ok('distinct workshop fixture imports through the same contract', authoredWorkshop.title === workshopPlan.plan.title && authoredWorkshop.brief.scope.in.length > 0);

const roundTrip = plan.importPlan(plan.exportPlan(authoredSoftware.id));
const roundTripT1 = roundTrip.items.find((it) => it.key === 'T1');
const roundTripT2 = roundTrip.items.find((it) => it.key === 'T2');
ok('author metadata survives transfer roundtrip', roundTrip.brief.objective === authoredSoftware.brief.objective && roundTripT2.completion === softwareT2.completion);
ok('author dependency survives transfer id remap', roundTripT2.dependsOn[0] === roundTripT1.id && roundTripT2.dependsOn[0] !== softwareT1.id);

function clone(value) { return JSON.parse(JSON.stringify(value)); }
const missingWhy = clone(softwarePlan); delete missingWhy.plan.why;
throws('author missing required field rejected', () => plan.importPlan(missingWhy), 'bad_author');
const unknownField = clone(softwarePlan); unknownField.plan.surprise = true;
throws('author unknown field rejected', () => plan.importPlan(unknownField), 'bad_author');
const orphanDependency = clone(softwarePlan); orphanDependency.plan.items[0].dependsOn = ['MISSING'];
throws('author orphan dependency rejected', () => plan.importPlan(orphanDependency), 'bad_author');
const dependencyCycle = clone(softwarePlan); dependencyCycle.plan.items[1].dependsOn = ['T2'];
throws('author dependency cycle rejected', () => plan.importPlan(dependencyCycle), 'bad_author');

// atomic write leaves no tmp files
const stray = fs.readdirSync(plan.PLANS_DIR).filter((f) => f.includes('.tmp.'));
ok('no stray tmp files', stray.length === 0, stray.join(','));

console.log(`plan.test: ${fails ? 'FAIL' : 'PASS'} ${total - fails}/${total}`);
process.exit(fails ? 1 : 0);
