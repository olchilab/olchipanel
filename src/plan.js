// plan.js — lightweight Linear/Jira-style plan storage. Zero deps (fs only).
// One plan = one JSON file under ~/.olchipanel/plans/<planId>.json, written
// atomically. Optimistic concurrency via a monotonic `version`. Agents (MCP) and
// the human (REST) both mutate through plan_mutate() so invariants live in one place.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const state = require('./state');

const PLANS_DIR = path.join(state.ROOT, 'plans');
const STATES = ['backlog', 'todo', 'in_progress', 'done', 'canceled'];
const PRIORITIES = [0, 1, 2, 3, 4]; // none, low, med, high, urgent
const TRANSFER_SCHEMA = 'olchipanel.plan-transfer.v1';
const AUTHOR_DOCUMENT_SCHEMA = require('../skills/olchipanel-plan-author/references/olchipanel-plan-author.v1.schema.json');
const AUTHOR_SCHEMA = AUTHOR_DOCUMENT_SCHEMA.properties.schema.const;
const AUTHOR_ITEM_KINDS = AUTHOR_DOCUMENT_SCHEMA.$defs.item.properties.kind.enum;
const MAX_IMPORT_ITEMS = 1000;
const AUTHOR_KEY = /^[A-Za-z][A-Za-z0-9_-]{0,39}$/;
const EVIDENCE_KEY = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function ensureDir() { fs.mkdirSync(PLANS_DIR, { recursive: true }); }

function planPath(id) {
  return path.join(PLANS_DIR, String(id).replace(/[^A-Za-z0-9._-]/g, '_') + '.json');
}

function newId(prefix) {
  return prefix + crypto.randomBytes(4).toString('hex');
}

function nowIso() { return new Date().toISOString(); }

function newPlanId() {
  return new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + '-' + crypto.randomBytes(2).toString('hex');
}

function writeAtomic(p, obj) {
  ensureDir();
  const tmp = p + '.tmp.' + process.pid + '.' + crypto.randomBytes(3).toString('hex');
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2));
  fs.renameSync(tmp, p); // atomic replace
}

function listPlans() {
  ensureDir();
  const out = [];
  for (const f of fs.readdirSync(PLANS_DIR)) {
    if (!f.endsWith('.json')) continue;
    try {
      const plan = JSON.parse(fs.readFileSync(path.join(PLANS_DIR, f), 'utf8'));
      const counts = {};
      for (const it of plan.items || []) counts[it.status] = (counts[it.status] || 0) + 1;
      out.push({ id: plan.id, title: plan.title, updated: plan.updated, version: plan.version, counts });
    } catch (e) { /* skip unreadable */ }
  }
  out.sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
  return out;
}

function getPlan(id) {
  try { return JSON.parse(fs.readFileSync(planPath(id), 'utf8')); }
  catch (e) { return null; }
}

function createPlan(title) {
  const t = String(title || '').trim();
  if (!t || t.length > 200) throw err('bad_title', 'title 1~200 chars');
  const plan = {
    schema: 'olchipanel.plan.v1', id: newId(''), title: t, version: 1,
    updated: nowIso(), states: STATES.slice(), items: [],
  };
  plan.id = newPlanId();
  writeAtomic(planPath(plan.id), plan);
  return plan;
}

function err(code, msg) { const e = new Error(msg); e.code = code; return e; }

// Cycle guard: walking parent links from `startId` must not reach `targetId`.
function wouldCycle(items, startParent, itemId) {
  let cur = startParent, guard = 0;
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  while (cur && guard++ < 1000) {
    if (cur === itemId) return true;
    cur = byId[cur] ? byId[cur].parent : null;
  }
  return false;
}

// The single mutation point. op ∈ add | update | step | delete. Enforces invariants,
// bumps version, writes atomically. `baseVersion` (optional) rejects stale writes.
function plan_mutate(planId, op, args, baseVersion) {
  const plan = getPlan(planId);
  if (!plan) throw err('no_plan', 'plan not found');
  if (baseVersion != null && Number(baseVersion) !== plan.version) {
    throw err('stale', `version ${plan.version} != baseVersion ${baseVersion}`);
  }
  if (op === 'add') {
    const title = String(args.title || '').trim();
    if (!title || title.length > 200) throw err('bad_title', 'title 1~200 chars');
    const status = args.status || 'todo';
    if (!STATES.includes(status)) throw err('bad_status', 'invalid status');
    const priority = args.priority == null ? 0 : Number(args.priority);
    if (!PRIORITIES.includes(priority)) throw err('bad_priority', 'invalid priority');
    if (args.parent && !plan.items.find((i) => i.id === args.parent)) throw err('no_parent', 'parent missing');
    const item = {
      id: newId('itm_'), title, status, priority,
      parent: args.parent || null,
      order: (plan.items.reduce((m, i) => Math.max(m, i.order || 0), 0) + 1024),
      labels: Array.isArray(args.labels) ? args.labels.slice(0, 8) : [],
      session: args.session || null, note: String(args.note || '').slice(0, 4000),
      created: nowIso(), updated: nowIso(),
    };
    plan.items.push(item);
    finalize(plan);
    return { item, version: plan.version };
  }
  if (op === 'update') {
    const it = plan.items.find((i) => i.id === args.id);
    if (!it) throw err('no_item', 'item not found');
    const p = args.patch || {};
    if (p.status !== undefined) { if (!STATES.includes(p.status)) throw err('bad_status', 'invalid status'); it.status = p.status; }
    if (p.priority !== undefined) { const v = Number(p.priority); if (!PRIORITIES.includes(v)) throw err('bad_priority', 'invalid priority'); it.priority = v; }
    if (p.title !== undefined) { const t = String(p.title).trim(); if (!t || t.length > 200) throw err('bad_title', 'title 1~200'); it.title = t; }
    if (p.parent !== undefined) {
      if (p.parent && !plan.items.find((i) => i.id === p.parent)) throw err('no_parent', 'parent missing');
      if (p.parent === it.id || wouldCycle(plan.items, p.parent, it.id)) throw err('cycle', 'parent cycle');
      it.parent = p.parent || null;
    }
    if (p.order !== undefined) it.order = Number(p.order);
    if (p.note !== undefined) it.note = String(p.note).slice(0, 4000);
    if (p.labels !== undefined) it.labels = Array.isArray(p.labels) ? p.labels.slice(0, 8) : it.labels;
    it.updated = nowIso();
    finalize(plan);
    return { version: plan.version };
  }
  if (op === 'step') {
    const it = plan.items.find((i) => i.id === args.id);
    if (!it) throw err('no_item', 'item not found');
    const action = String(args.action || '');
    const session = text(args.session, 'bad_session', 'session', { required: true, max: 200 });
    const note = text(args.note, 'bad_step', 'note', { max: 1000 });
    if (!['start', 'pause', 'complete'].includes(action)) throw err('bad_step', 'invalid plan step action');
    if (action !== 'complete' && args.evidence != null) throw err('bad_step', 'evidence is only accepted when completing a task');

    if (action === 'start') {
      if (it.status === 'in_progress') {
        if (it.session === session) return { item: it, version: plan.version, changed: false };
        if (!it.session) {
          it.session = session;
          if (note) it.note = prependNote(it.note, note);
          it.updated = nowIso();
          finalize(plan);
          return { item: it, version: plan.version, changed: true };
        }
        throw err('claimed', 'task is already in progress by another session');
      }
      if (it.status !== 'todo') throw err('not_ready', `cannot start a ${it.status} task`);
      const blockers = blockersFor(plan, it);
      if (blockers.length) throw err('blocked_dependencies', `blocked by ${blockers.map((item) => item.key || item.id).join(', ')}`);
      it.status = 'in_progress';
      it.session = session;
      if (note) it.note = prependNote(it.note, note);
      it.updated = nowIso();
      finalize(plan);
      return { item: it, version: plan.version, changed: true };
    }

    if (action === 'pause') {
      if (it.session && it.session !== session) throw err('claimed', 'task is owned by another session');
      if (it.status === 'todo' && !it.session) return { item: it, version: plan.version, changed: false };
      if (it.status !== 'in_progress') throw err('bad_transition', `cannot pause a ${it.status} task`);
      it.status = 'todo';
      it.session = null;
      if (note) it.note = prependNote(it.note, note);
      it.updated = nowIso();
      finalize(plan);
      return { item: it, version: plan.version, changed: true };
    }

    const proof = normalizeEvidenceInput(args.evidence);
    const evidenceLog = Array.isArray(it.evidenceLog) ? it.evidenceLog : [];
    const existing = evidenceLog.find((entry) => entry.key === proof.key);
    if (existing && (existing.summary !== proof.summary || (existing.ref || '') !== (proof.ref || ''))) {
      throw err('evidence_conflict', `evidence key ${proof.key} already has different content`);
    }
    if (it.status === 'done') {
      if (existing) return { item: it, version: plan.version, changed: false };
      throw err('bad_transition', 'task is already done with different evidence');
    }
    if (it.session && it.session !== session) throw err('claimed', 'task is owned by another session');
    if (it.status !== 'in_progress') throw err('bad_transition', `cannot complete a ${it.status} task before starting it`);
    if (!existing) {
      if (evidenceLog.length >= 100) throw err('too_many_evidence', 'task evidence log is full');
      evidenceLog.push(Object.assign({}, proof, { at: nowIso() }));
    }
    it.evidenceLog = evidenceLog;
    it.status = 'done';
    it.session = session;
    const visibleProof = `실행 증거 [${proof.key}]: ${proof.summary}${proof.ref ? ` — ${proof.ref}` : ''}`;
    it.note = prependNote(it.note, note ? `${visibleProof}\n${note}` : visibleProof);
    it.updated = nowIso();
    finalize(plan);
    return { item: it, version: plan.version, changed: true };
  }
  if (op === 'delete') {
    const before = plan.items.length;
    plan.items = plan.items.filter((i) => i.id !== args.id);
    // orphan children: detach to top level (don't cascade-delete silently)
    for (const i of plan.items) if (i.parent === args.id) i.parent = null;
    if (plan.items.length === before) throw err('no_item', 'item not found');
    finalize(plan);
    return { version: plan.version };
  }
  throw err('bad_op', 'unknown op');
}

function finalize(plan) {
  plan.version += 1;
  plan.updated = nowIso();
  writeAtomic(planPath(plan.id), plan);
}

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function allowedKeys(value, allowed, code, field) {
  if (!isObject(value)) throw err(code, `${field} must be an object`);
  const unknown = Object.keys(value).find((key) => !allowed.includes(key));
  if (unknown) throw err(code, `${field}.${unknown} is not supported`);
}

function text(value, code, field, { required = false, max = 500, nullable = false } = {}) {
  if (value == null) {
    if (nullable) return null;
    if (required) throw err(code, `${field} is required`);
    return '';
  }
  if (typeof value !== 'string') throw err(code, `${field} must be a string`);
  const out = value.trim();
  if (required && !out) throw err(code, `${field} is required`);
  if (out.length > max) throw err(code, `${field} is too long`);
  return out;
}

function dateOnly(value, code, field) {
  const out = text(value, code, field, { nullable: true, max: 10 });
  if (out && !DATE_ONLY.test(out)) throw err(code, `${field} must use YYYY-MM-DD`);
  return out;
}

function textList(value, code, field, maxItems = 50) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > maxItems) throw err(code, `${field} must be an array of at most ${maxItems} strings`);
  const out = value.map((entry, index) => text(entry, code, `${field}[${index}]`, { required: true }));
  if (new Set(out).size !== out.length) throw err(code, `${field} contains duplicates`);
  return out;
}

function evidenceKey(value, code, field) {
  const out = text(value, code, field, { required: true, max: 80 });
  if (!EVIDENCE_KEY.test(out)) throw err(code, `${field} is not a valid evidence key`);
  return out;
}

function normalizeEvidenceInput(value, code = 'bad_evidence', field = 'evidence') {
  allowedKeys(value, ['key', 'summary', 'ref'], code, field);
  const proof = {
    key: evidenceKey(value.key, code, `${field}.key`),
    summary: text(value.summary, code, `${field}.summary`, { required: true, max: 500 }),
  };
  const ref = text(value.ref, code, `${field}.ref`, { max: 1000 });
  if (ref) proof.ref = ref;
  return proof;
}

function normalizeEvidenceLog(value, code, field) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 100) throw err(code, `${field} must contain at most 100 entries`);
  const keys = new Set();
  return value.map((entry, index) => {
    const entryField = `${field}[${index}]`;
    allowedKeys(entry, ['key', 'summary', 'ref', 'at'], code, entryField);
    const normalized = normalizeEvidenceInput({ key: entry.key, summary: entry.summary, ref: entry.ref }, code, entryField);
    if (keys.has(normalized.key)) throw err(code, `${field} contains duplicate key ${normalized.key}`);
    keys.add(normalized.key);
    const at = text(entry.at, code, `${entryField}.at`, { required: true, max: 40 });
    if (Number.isNaN(Date.parse(at))) throw err(code, `${entryField}.at must be an ISO timestamp`);
    normalized.at = at;
    return normalized;
  });
}

function prependNote(existing, addition) {
  const current = String(existing || '').trim();
  const next = String(addition || '').trim();
  if (!next || current.startsWith(next)) return current.slice(0, 4000);
  return [next, current].filter(Boolean).join('\n').slice(0, 4000);
}

function blockersFor(plan, item) {
  const byId = new Map((plan.items || []).map((entry) => [entry.id, entry]));
  const blockers = [];
  for (const id of Array.isArray(item.dependsOn) ? item.dependsOn : []) {
    const dependency = byId.get(id);
    if (!dependency || dependency.status !== 'done') blockers.push(dependency || { id, title: 'Missing dependency', status: 'missing' });
  }
  if (item.kind === 'milestone') {
    for (const child of plan.items || []) {
      if (child.parent === item.id && child.status !== 'done' && child.status !== 'canceled') blockers.push(child);
    }
  }
  return blockers;
}

function frontierItem(plan, item, session) {
  const blockers = blockersFor(plan, item);
  return {
    id: item.id,
    ...(item.key ? { key: item.key } : {}),
    ...(item.kind ? { kind: item.kind } : {}),
    title: item.title,
    status: item.status,
    priority: item.priority,
    mine: !!session && item.session === session,
    ...(item.completion ? { completion: item.completion } : {}),
    requiredEvidence: Array.isArray(item.evidence) ? item.evidence.slice() : [],
    evidenceCount: Array.isArray(item.evidenceLog) ? item.evidenceLog.length : 0,
    blockers: blockers.map((entry) => ({
      id: entry.id,
      ...(entry.key ? { key: entry.key } : {}),
      title: entry.title,
      status: entry.status,
    })),
  };
}

function getPlanFrontier(planId, session) {
  const plan = getPlan(planId);
  if (!plan) throw err('no_plan', 'plan not found');
  const sort = (a, b) => (b.priority - a.priority) || ((a.order || 0) - (b.order || 0));
  const activeItems = (plan.items || []).filter((item) => item.status === 'in_progress').sort(sort);
  const candidates = (plan.items || []).filter((item) => item.status === 'todo').sort(sort);
  const ready = [];
  const blocked = [];
  for (const item of candidates) {
    const view = frontierItem(plan, item, session);
    (view.blockers.length ? blocked : ready).push(view);
  }
  return {
    schema: 'olchipanel.plan-frontier.v1',
    id: plan.id,
    title: plan.title,
    version: plan.version,
    nextAction: plan.brief && plan.brief.nextAction || null,
    active: activeItems.map((item) => frontierItem(plan, item, session)),
    ready,
    blocked,
  };
}

function authorKey(value, code, field) {
  const out = text(value, code, field, { required: true, max: 40 });
  if (!AUTHOR_KEY.test(out)) throw err(code, `${field} is not a valid key`);
  return out;
}

function normalizeScope(value, code) {
  allowedKeys(value, ['in', 'out'], code, 'scope');
  if (!Object.prototype.hasOwnProperty.call(value, 'in') || !Object.prototype.hasOwnProperty.call(value, 'out')) {
    throw err(code, 'scope.in and scope.out are required');
  }
  return { in: textList(value.in, code, 'scope.in'), out: textList(value.out, code, 'scope.out') };
}

function normalizeCriteria(value, code) {
  if (!Array.isArray(value) || !value.length || value.length > 30) {
    throw err(code, 'successCriteria must contain 1~30 entries');
  }
  const keys = new Set();
  return value.map((entry, index) => {
    allowedKeys(entry, ['key', 'text', 'evidence'], code, `successCriteria[${index}]`);
    const key = authorKey(entry.key, code, `successCriteria[${index}].key`);
    if (keys.has(key)) throw err(code, `duplicate success criterion key ${key}`);
    keys.add(key);
    return {
      key,
      text: text(entry.text, code, `successCriteria[${index}].text`, { required: true }),
      evidence: text(entry.evidence, code, `successCriteria[${index}].evidence`, { required: true }),
    };
  });
}

function normalizeRisks(value, code) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 30) throw err(code, 'risks must contain at most 30 entries');
  const keys = new Set();
  return value.map((entry, index) => {
    allowedKeys(entry, ['key', 'text', 'mitigation', 'trigger'], code, `risks[${index}]`);
    const key = authorKey(entry.key, code, `risks[${index}].key`);
    if (keys.has(key)) throw err(code, `duplicate risk key ${key}`);
    keys.add(key);
    const normalized = {
      key,
      text: text(entry.text, code, `risks[${index}].text`, { required: true }),
      mitigation: text(entry.mitigation, code, `risks[${index}].mitigation`, { required: true }),
    };
    const trigger = text(entry.trigger, code, `risks[${index}].trigger`);
    if (trigger) normalized.trigger = trigger;
    return normalized;
  });
}

const BRIEF_KEYS = [
  'schema', 'objective', 'why', 'scope', 'nextAction', 'timebox', 'targetDate',
  'constraints', 'assumptions', 'questions', 'replanWhen', 'successCriteria', 'risks',
];

function normalizeBrief(value, code) {
  allowedKeys(value, BRIEF_KEYS, code, 'brief');
  if (value.schema !== AUTHOR_SCHEMA) throw err(code, `brief.schema must be ${AUTHOR_SCHEMA}`);
  const brief = {
    schema: AUTHOR_SCHEMA,
    objective: text(value.objective, code, 'objective', { required: true, max: 1000 }),
    why: text(value.why, code, 'why', { required: true, max: 2000 }),
    scope: normalizeScope(value.scope, code),
    nextAction: text(value.nextAction, code, 'nextAction', { required: true }),
    constraints: textList(value.constraints, code, 'constraints'),
    assumptions: textList(value.assumptions, code, 'assumptions'),
    questions: textList(value.questions, code, 'questions'),
    replanWhen: textList(value.replanWhen, code, 'replanWhen'),
    successCriteria: normalizeCriteria(value.successCriteria, code),
    risks: normalizeRisks(value.risks, code),
  };
  const timebox = text(value.timebox, code, 'timebox', { nullable: true, max: 100 });
  const targetDate = dateOnly(value.targetDate, code, 'targetDate');
  if (timebox) brief.timebox = timebox;
  if (targetDate) brief.targetDate = targetDate;
  return brief;
}

function relationCycle(items, field) {
  const byKey = new Map(items.map((item) => [item.sourceId, item]));
  const visiting = new Set();
  const visited = new Set();
  function visit(key) {
    if (visiting.has(key)) return true;
    if (visited.has(key)) return false;
    visiting.add(key);
    const item = byKey.get(key);
    const next = field === 'parent' ? (item.parent ? [item.parent] : []) : item.dependsOn;
    for (const target of next) if (visit(target)) return true;
    visiting.delete(key);
    visited.add(key);
    return false;
  }
  return items.some((item) => visit(item.sourceId));
}

function composeAuthorNote(item) {
  const lines = [`완료 조건: ${item.completion}`];
  if (item.owner) lines.push(`담당: ${item.owner}`);
  if (item.targetDate) lines.push(`목표일: ${item.targetDate}`);
  if (item.dependsOn.length) lines.push(`선행: ${item.dependsOn.join(', ')}`);
  if (item.evidence.length) lines.push(`증거: ${item.evidence.join(' · ')}`);
  if (item.note) lines.push(item.note);
  return lines.join('\n').slice(0, 4000);
}

function normalizeAuthorDocument(document) {
  const code = 'bad_author';
  allowedKeys(document, ['schema', 'plan'], code, 'document');
  if (document.schema !== AUTHOR_SCHEMA) throw err(code, `schema must be ${AUTHOR_SCHEMA}`);
  const source = document.plan;
  const planKeys = ['title', 'objective', 'why', 'scope', 'nextAction', 'timebox', 'targetDate',
    'constraints', 'assumptions', 'questions', 'replanWhen', 'successCriteria', 'risks', 'items'];
  allowedKeys(source, planKeys, code, 'plan');
  if (!Array.isArray(source.items) || !source.items.length || source.items.length > MAX_IMPORT_ITEMS) {
    throw err(code, `items must contain 1~${MAX_IMPORT_ITEMS} entries`);
  }
  const briefSource = { schema: AUTHOR_SCHEMA };
  for (const key of BRIEF_KEYS) if (key !== 'schema' && Object.prototype.hasOwnProperty.call(source, key)) briefSource[key] = source[key];
  const brief = normalizeBrief(briefSource, code);
  const keys = new Set();
  const items = source.items.map((entry, index) => {
    allowedKeys(entry, ['key', 'kind', 'title', 'completion', 'status', 'priority', 'parent', 'dependsOn',
      'owner', 'targetDate', 'evidence', 'labels', 'note'], code, `items[${index}]`);
    const key = authorKey(entry.key, code, `items[${index}].key`);
    if (keys.has(key)) throw err(code, `duplicate item key ${key}`);
    keys.add(key);
    const kind = entry.kind == null ? 'task' : text(entry.kind, code, `items[${index}].kind`, { required: true, max: 20 });
    if (!AUTHOR_ITEM_KINDS.includes(kind)) throw err(code, `invalid item kind ${kind}`);
    const status = entry.status == null ? 'todo' : entry.status;
    if (!STATES.includes(status)) throw err(code, `invalid item status ${status}`);
    const priority = entry.priority == null ? 0 : Number(entry.priority);
    if (!Number.isInteger(priority) || !PRIORITIES.includes(priority)) throw err(code, `invalid item priority ${entry.priority}`);
    const parent = entry.parent == null ? null : authorKey(entry.parent, code, `items[${index}].parent`);
    const dependsOn = entry.dependsOn == null ? [] : textList(entry.dependsOn, code, `items[${index}].dependsOn`);
    const labels = entry.labels == null ? [] : textList(entry.labels, code, `items[${index}].labels`, 8);
    const allowedLabels = AUTHOR_DOCUMENT_SCHEMA.$defs.item.properties.labels.items.enum;
    if (labels.some((label) => !allowedLabels.includes(label))) throw err(code, `items[${index}].labels contains an unsupported label`);
    return {
      sourceId: key,
      key,
      kind,
      title: text(entry.title, code, `items[${index}].title`, { required: true, max: 200 }),
      completion: text(entry.completion, code, `items[${index}].completion`, { required: true, max: 1000 }),
      status,
      priority,
      parent,
      dependsOn,
      owner: text(entry.owner, code, `items[${index}].owner`, { nullable: true, max: 200 }),
      targetDate: dateOnly(entry.targetDate, code, `items[${index}].targetDate`),
      evidence: textList(entry.evidence, code, `items[${index}].evidence`, 20),
      labels,
      note: text(entry.note, code, `items[${index}].note`, { max: 4000 }),
    };
  });
  for (const item of items) {
    if (item.parent && !keys.has(item.parent)) throw err(code, `missing parent ${item.parent}`);
    if (item.parent === item.sourceId) throw err(code, `item ${item.sourceId} cannot parent itself`);
    for (const dependency of item.dependsOn) {
      if (!keys.has(dependency)) throw err(code, `missing dependency ${dependency}`);
      if (dependency === item.sourceId) throw err(code, `item ${item.sourceId} cannot depend on itself`);
    }
  }
  if (relationCycle(items, 'parent')) throw err(code, 'parent cycle');
  if (relationCycle(items, 'dependsOn')) throw err(code, 'dependency cycle');
  for (const item of items) item.note = composeAuthorNote(item);
  return {
    title: text(source.title, code, 'title', { required: true, max: 200 }),
    brief,
    items,
  };
}

function normalizeTransferBundle(bundle) {
  if (!bundle || bundle.schema !== TRANSFER_SCHEMA || !isObject(bundle.plan)) {
    throw err('bad_import', 'not an OlchiPanel plan file');
  }
  const title = text(bundle.plan.title, 'bad_import', 'plan title', { required: true, max: 200 });
  if (!Array.isArray(bundle.plan.items) || bundle.plan.items.length > MAX_IMPORT_ITEMS) {
    throw err('bad_import', 'invalid plan items');
  }
  const sourceIds = new Set();
  const authorKeys = new Set();
  const items = bundle.plan.items.map((item, index) => {
    if (!isObject(item)) throw err('bad_import', `invalid item at ${index}`);
    const sourceId = text(item.id, 'bad_import', `items[${index}].id`, { required: true, max: 200 });
    if (sourceIds.has(sourceId)) throw err('bad_import', 'duplicate or missing item id');
    sourceIds.add(sourceId);
    const status = item.status;
    if (!STATES.includes(status)) throw err('bad_import', 'invalid item status');
    const priority = Number(item.priority);
    if (!Number.isInteger(priority) || !PRIORITIES.includes(priority)) throw err('bad_import', 'invalid item priority');
    const key = item.key == null ? null : authorKey(item.key, 'bad_import', `items[${index}].key`);
    if (key && authorKeys.has(key)) throw err('bad_import', `duplicate item key ${key}`);
    if (key) authorKeys.add(key);
    const kind = item.kind == null ? null : text(item.kind, 'bad_import', `items[${index}].kind`, { required: true, max: 20 });
    if (kind && !AUTHOR_ITEM_KINDS.includes(kind)) throw err('bad_import', `invalid item kind ${kind}`);
    return {
      sourceId,
      key,
      kind,
      title: text(item.title, 'bad_import', `items[${index}].title`, { required: true, max: 200 }),
      completion: text(item.completion, 'bad_import', `items[${index}].completion`, { max: 1000 }),
      status,
      priority,
      parent: item.parent == null ? null : String(item.parent),
      dependsOn: item.dependsOn == null ? [] : textList(item.dependsOn, 'bad_import', `items[${index}].dependsOn`),
      owner: text(item.owner, 'bad_import', `items[${index}].owner`, { nullable: true, max: 200 }),
      targetDate: dateOnly(item.targetDate, 'bad_import', `items[${index}].targetDate`),
      evidence: textList(item.evidence, 'bad_import', `items[${index}].evidence`, 20),
      evidenceLog: normalizeEvidenceLog(item.evidenceLog, 'bad_import', `items[${index}].evidenceLog`),
      labels: Array.isArray(item.labels)
        ? item.labels.slice(0, 8).map((label) => String(label).trim().slice(0, 40)).filter(Boolean)
        : [],
      note: text(item.note, 'bad_import', `items[${index}].note`, { max: 4000 }),
      order: Number.isFinite(Number(item.order)) ? Number(item.order) : (index + 1) * 1024,
    };
  });
  for (const item of items) {
    if (item.parent && !sourceIds.has(item.parent)) throw err('bad_import', 'missing parent item');
    for (const dependency of item.dependsOn) {
      if (!sourceIds.has(dependency)) throw err('bad_import', `missing dependency ${dependency}`);
      if (dependency === item.sourceId) throw err('bad_import', 'self dependency');
    }
  }
  if (relationCycle(items, 'parent')) throw err('bad_import', 'parent cycle');
  if (relationCycle(items, 'dependsOn')) throw err('bad_import', 'dependency cycle');
  const brief = bundle.plan.brief == null ? null : normalizeBrief(bundle.plan.brief, 'bad_import');
  return { title, brief, items };
}

function materializePlan(normalized) {
  const idMap = new Map();
  for (const item of normalized.items) idMap.set(item.sourceId, newId('itm_'));
  const timestamp = nowIso();
  const imported = {
    schema: 'olchipanel.plan.v1',
    id: newPlanId(),
    title: normalized.title,
    version: 1,
    updated: timestamp,
    states: STATES.slice(),
    items: normalized.items.map((item, index) => {
      const stored = {
        id: idMap.get(item.sourceId),
        title: item.title,
        status: item.status,
        priority: item.priority,
        parent: item.parent ? idMap.get(item.parent) : null,
        order: item.order == null ? (index + 1) * 1024 : item.order,
        labels: item.labels,
        session: null,
        note: item.note,
        created: timestamp,
        updated: timestamp,
      };
      if (item.key) stored.key = item.key;
      if (item.kind) stored.kind = item.kind;
      if (item.completion) stored.completion = item.completion;
      if (item.dependsOn && item.dependsOn.length) stored.dependsOn = item.dependsOn.map((id) => idMap.get(id));
      if (item.owner) stored.owner = item.owner;
      if (item.targetDate) stored.targetDate = item.targetDate;
      if (item.evidence && item.evidence.length) stored.evidence = item.evidence;
      if (item.evidenceLog && item.evidenceLog.length) stored.evidenceLog = item.evidenceLog;
      return stored;
    }),
  };
  if (normalized.brief) imported.brief = normalized.brief;
  writeAtomic(planPath(imported.id), imported);
  return imported;
}

// A transfer bundle contains only portable plan content. Local session ids are
// intentionally omitted: the receiving viewer attaches the imported copy to
// the currently selected session instead of pretending an old process owns it.
function exportPlan(id) {
  const plan = getPlan(id);
  if (!plan) throw err('no_plan', 'plan not found');
  return {
    schema: TRANSFER_SCHEMA,
    exportedAt: nowIso(),
    source: { id: plan.id, version: plan.version, updated: plan.updated },
    plan: {
      title: plan.title,
      states: STATES.slice(),
      ...(plan.brief ? { brief: JSON.parse(JSON.stringify(plan.brief)) } : {}),
      items: (plan.items || []).map((item) => ({
        id: item.id,
        title: item.title,
        status: item.status,
        priority: item.priority,
        parent: item.parent || null,
        order: item.order,
        labels: Array.isArray(item.labels) ? item.labels.slice(0, 8) : [],
        note: item.note || '',
        ...(item.key ? { key: item.key } : {}),
        ...(item.kind ? { kind: item.kind } : {}),
        ...(item.completion ? { completion: item.completion } : {}),
        ...(Array.isArray(item.dependsOn) && item.dependsOn.length ? { dependsOn: item.dependsOn.slice() } : {}),
        ...(item.owner ? { owner: item.owner } : {}),
        ...(item.targetDate ? { targetDate: item.targetDate } : {}),
        ...(Array.isArray(item.evidence) && item.evidence.length ? { evidence: item.evidence.slice() } : {}),
        ...(Array.isArray(item.evidenceLog) && item.evidenceLog.length ? { evidenceLog: JSON.parse(JSON.stringify(item.evidenceLog)) } : {}),
      })),
    },
  };
}

function importPlan(bundle) {
  if (bundle && bundle.schema === AUTHOR_SCHEMA) return materializePlan(normalizeAuthorDocument(bundle));
  return materializePlan(normalizeTransferBundle(bundle));
}

function copyPlan(id) {
  return importPlan(exportPlan(id));
}

module.exports = {
  PLANS_DIR, STATES, PRIORITIES, TRANSFER_SCHEMA, AUTHOR_SCHEMA, AUTHOR_DOCUMENT_SCHEMA,
  listPlans, getPlan, createPlan, plan_mutate, getPlanFrontier, exportPlan, importPlan, copyPlan, normalizeAuthorDocument,
};
