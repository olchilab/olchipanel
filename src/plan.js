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

function ensureDir() { fs.mkdirSync(PLANS_DIR, { recursive: true }); }

function planPath(id) {
  return path.join(PLANS_DIR, String(id).replace(/[^A-Za-z0-9._-]/g, '_') + '.json');
}

function newId(prefix) {
  return prefix + crypto.randomBytes(4).toString('hex');
}

function nowIso() { return new Date().toISOString(); }

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
  plan.id = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14) + '-' + crypto.randomBytes(2).toString('hex');
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

// The single mutation point. op ∈ add | update | delete. Enforces invariants,
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

module.exports = {
  PLANS_DIR, STATES, PRIORITIES,
  listPlans, getPlan, createPlan, plan_mutate,
};
