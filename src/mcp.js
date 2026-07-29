// mcp.js — zero-dependency MCP server (stdio transport, newline-delimited JSON-RPC 2.0).
// One process per connected agent. Tools mutate this session's state file;
// the viewer picks changes up and live-renders. No SDK, no build, no install.
'use strict';
const readline = require('readline');
const state = require('./state');

const PROTOCOL_VERSION = '2024-11-05';
const VERSION = require('../package.json').version; // single source — a hardcoded copy drifted (issue #3)

const INSTRUCTIONS = `OlchiPanel is a live situation board for the HUMAN watching you work.
It is narrative instrumentation, not logging. Keep it honest and current:
- If a previous panel exists for this project (you'll be told below), call resume_project FIRST — it hands you the whole prior situation (goal, journey, decisions, dead ends, open asks) like an inherited memory, and archives the old panel.
- If you connect mid-task with no previous panel, backfill: reconstruct the journey so far from the conversation (steps already done get status "done"), then continue live. A panel that starts at step 5 should still show steps 1-4.
- Name this session after the conversation's title/topic: if the human names it (e.g. "call this one Master"), use exactly that; otherwise derive a short name from the task. The name must FOLLOW the conversation — when the human renames the topic or the mission visibly shifts, call name_session again so the panel always carries the current name.
- Call set_goal once you understand the task (one sentence, the north star).
- Build the journey map with add_step as your plan takes shape (batch a whole plan in one call via steps:[...]); statuses: now (exactly one), next, done, pause. Moving "now" into a child leaves the parent as a plain container, not done.
- A stray idea appears mid-task: weigh it before you draw it, or the map fills with noise.
  · Will you actually STOP or SPLIT the current work to explore it now? → add_step(branch=true, weight="fork") with a note on WHY. It shows as an active fork; parallel workers each update their own branch with set_status.
  · Worth keeping but NOT now? → weight="side". It parks as a folded side-quest that never clutters the map.
  · A passing thought you could forget in five minutes? → do NOT draw it. At most, one line in the current step's note.
  The test is not "is it a different idea" — it's "does it change what I'm doing, or is it just worth remembering."
- When the human changes topic mid-task, push_interrupt with a resume point; pop_interrupt when you return.
- Record what you touch with log_change (files created/modified/deleted, commands, commits) — this is what the human checks instead of re-reading the transcript.
- Record confirmed decisions AND silent assumptions with add_decision.
- When you try something and it fails, log_deadend with why — so nobody walks that path twice.
- When you need the human (a question, an approval, a blocker), call need_human — that list is their inbox from you.
Update immediately when reality changes — a stale panel is worse than none.`;

// ---------- tool definitions ----------
const TOOLS = [
  {
    name: 'resume_project',
    description: 'Inherit the previous panel of THIS project (same working directory): its goal, journey map, decisions, dead ends, changes and open asks become yours, and the old panel is archived. Returns the inherited situation as text — read it as your predecessor\'s handoff memo. Call this first when a previous panel exists; then update statuses to match present reality.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'name_session',
    description: 'Give this session a human-facing name shown big in the sidebar (e.g. "Master", "결제 리팩터"). Name it after the conversation title/topic — the human\'s wording wins, otherwise derive from the task. Call again whenever the topic is renamed or the mission shifts: the panel name must follow the conversation, renames included.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'Short display name for this session.' } },
      required: ['name'],
    },
  },
  {
    name: 'set_goal',
    description: 'Set the north-star goal shown pinned at the top of the panel. Call once the task is understood; update if the mission itself changes. One sentence.',
    inputSchema: {
      type: 'object',
      properties: { goal: { type: 'string', description: 'One-sentence goal, human-readable.' } },
      required: ['goal'],
    },
  },
  {
    name: 'add_step',
    description: 'Add a step to the journey map (a tree; root = the overall journey). Steps nest under parent_id. Set branch=true when a stray idea splits the path, and use weight to size it — this is how the map stays signal, not noise: "fork" = you are actually stopping/splitting current work to explore now (drawn active); "side" = worth revisiting but not now (parked, auto-folded). A passing thought you could forget should not be a step at all — put at most one line in the parent step\'s note. Branch notes must say WHY the branch happened.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Short unique id for this step, e.g. "impl-mcp" or "branch-a".' },
        label: { type: 'string', description: 'Human-readable step name.' },
        parent_id: { type: 'string', description: 'Id of parent step. Omit for the root step (first call).' },
        status: { type: 'string', enum: ['done', 'now', 'next', 'pause'], description: '"now" = currently here (only one in the whole tree).' },
        branch: { type: 'boolean', description: 'true if this step is the head of a branch (a stray idea that split the path).' },
        weight: { type: 'string', enum: ['fork', 'side'], description: 'For branches: "fork" = actively exploring now (splitting/pausing current work); "side" = a parked side-quest, auto-folded so it does not clutter the map. Omit for normal steps.' },
        note: { type: 'string', description: 'For branches: why this branch happened, one sentence.' },
        steps: { type: 'array', description: 'Batch form: an array of step objects (same fields as above, including parent_id). Lays out a whole plan in one call — prefer this when registering several steps at once. When present, the top-level fields are ignored.', items: { type: 'object' } },
      },
      required: [],
    },
  },
  {
    name: 'set_status',
    description: 'Update the status of an existing journey step. Setting "now" automatically demotes the previous "now": to done normally, or to a plain container when it is an ancestor of the new "now" (a parent is not finished while its child is in progress). Parallel workers each call this on their own branch to show live progress.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        status: { type: 'string', enum: ['done', 'now', 'next', 'pause'] },
        label: { type: 'string', description: 'Optionally rename the step at the same time.' },
      },
      required: ['id', 'status'],
    },
  },
  {
    name: 'push_interrupt',
    description: 'The human changed topic while you were mid-task: push what you WERE doing onto the interrupt stack, with a resume point, so it is never lost. Top of stack = resume first.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'What you were doing.' },
        resume: { type: 'string', description: 'Where/how to resume: what signal, which file, which step.' },
      },
      required: ['text', 'resume'],
    },
  },
  {
    name: 'pop_interrupt',
    description: 'You returned to the most recent interrupted work: pop it off the stack.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'add_decision',
    description: 'Record a decision or a silent assumption (one line). kind="decision" for choices made/confirmed with the human; kind="assumption" for things you assumed without asking — surfacing those builds trust.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        kind: { type: 'string', enum: ['decision', 'assumption'], description: 'Default: decision.' },
      },
      required: ['text'],
    },
  },
  {
    name: 'log_change',
    description: 'Record something you touched: a file created/modified/deleted, a command run, a commit made. Write paths with forward slashes (C:/...) — backslashes tend to die in tool-call string escaping. This list is what the human checks instead of re-reading the whole transcript — log every meaningful change as you make it.',
    inputSchema: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['created', 'modified', 'deleted', 'command', 'commit'], description: 'What kind of change.' },
        target: { type: 'string', description: 'File path, command line, or commit hash.' },
        summary: { type: 'string', description: 'One line: what changed and why.' },
      },
      required: ['kind', 'target'],
    },
  },
  {
    name: 'log_deadend',
    description: 'Record a path you tried that failed: what you attempted and why it did not work. Prevents anyone (including future you) from walking the same dead end twice.',
    inputSchema: {
      type: 'object',
      properties: {
        tried: { type: 'string', description: 'What you attempted.' },
        why: { type: 'string', description: 'Why it failed / what blocked it.' },
      },
      required: ['tried', 'why'],
    },
  },
  {
    name: 'need_human',
    description: 'Replace the list of things you need from the human right now: questions, approvals, blockers only they can clear. This is their inbox from you — keep it current, clear it when answered. hot=true for urgent.',
    inputSchema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: { text: { type: 'string' }, hot: { type: 'boolean' } },
            required: ['text'],
          },
        },
      },
      required: ['items'],
    },
  },
  {
    name: 'get_panel',
    description: 'Read back this session\'s current panel state and the viewer URL. Use to verify the panel matches reality.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'plan_open',
    description: 'Open (or create) a shared plan board for this session, so the human can watch tasks on the /plan page. Returns the plan id. Call once; later plan_add/plan_set target it.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title if a new plan is created (ignored if one is already open).' },
        id: { type: 'string', description: 'Attach to an existing plan by id instead of creating one.' },
      },
    },
  },
  {
    name: 'plan_add',
    description: 'Add a task to this session\'s open plan. The task is auto-linked to this agent session so the board shows who owns it. Call plan_open first.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title.' },
        status: { type: 'string', enum: ['backlog', 'todo', 'in_progress', 'done', 'canceled'], description: 'Default todo.' },
        priority: { type: 'number', description: '0 none, 1 low, 2 med, 3 high, 4 urgent.' },
        parent: { type: 'string', description: 'Parent task id for a sub-task.' },
      },
      required: ['title'],
    },
  },
  {
    name: 'plan_set',
    description: 'Update a task on this session\'s plan (status/priority/note) as you make progress. The human sees it live.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Task id (from plan_add / plan_list).' },
        status: { type: 'string', enum: ['backlog', 'todo', 'in_progress', 'done', 'canceled'] },
        priority: { type: 'number' },
        note: { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'plan_list',
    description: 'List tasks on this session\'s open plan (optionally filtered by status) to decide what to do next.',
    inputSchema: {
      type: 'object',
      properties: { status: { type: 'string', enum: ['backlog', 'todo', 'in_progress', 'done', 'canceled'] } },
    },
  },
];

// ---------- tool implementations ----------
function makeToolRunner(session, getViewerUrl) {
  const save = () => state.writeSession(session);

  // handoff memo: render a panel's situation as text the successor agent can absorb
  function handoffMemo(p) {
    const lines = [];
    lines.push(`Inherited panel${p.name ? ` "${p.name}"` : ''} (agent: ${p.agent}, last updated: ${p.updated})`);
    if (p.goal) lines.push(`GOAL: ${p.goal}`);
    if (p.map && p.map.tree) {
      lines.push('JOURNEY:');
      (function walk(n, d) {
        const st = n.status ? `[${n.status}]` : (n.branch ? '[branch]' : '[ ]');
        lines.push(`${'  '.repeat(d)}- ${st} ${n.label}${n.note ? ` — ${n.note}` : ''}`);
        (n.children || []).forEach(c => walk(c, d + 1));
      })(p.map.tree, 1);
    }
    if ((p.pending || []).length) lines.push('OPEN ASKS (needs the human): ' + p.pending.map(x => (x.hot ? '[HOT] ' : '') + x.text).join(' | '));
    if ((p.stack || []).length) lines.push('INTERRUPTED (resume first on top): ' + p.stack.map(s => `${s.text} (resume: ${s.resume})`).join(' | '));
    if ((p.decisions || []).length) lines.push('DECISIONS: ' + p.decisions.map(d => (typeof d === 'string' ? d : (d.kind === 'assumption' ? '[assumed] ' : '') + d.text)).join(' | '));
    if ((p.deadends || []).length) lines.push('DEAD ENDS (do not retry): ' + p.deadends.map(d => `${d.tried} → ${d.why}`).join(' | '));
    const ch = (p.changes || []).slice(-6);
    if (ch.length) lines.push('RECENT CHANGES: ' + ch.map(c => `${c.kind} ${c.target}`).join(' | '));
    return lines.join('\n');
  }

  return {
    resume_project() {
      const prev = state.findPrevious(state.panelKey(session), session.id);
      if (!prev) return 'No previous panel exists for this project — starting fresh is correct.';
      // inherit the whole situation
      if (!session.name) session.name = prev.name || '';
      session.goal = prev.goal || '';
      session.map = prev.map || { tree: null, back: '' };
      session.stack = prev.stack || [];
      session.decisions = prev.decisions || [];
      session.changes = prev.changes || [];
      session.deadends = prev.deadends || [];
      session.pending = prev.pending || [];
      session.resumed_from = prev.id;
      save();
      // archive every other panel of this project — the board shows one living panel per project
      const norm = (x) => String(x || '').replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
      let archived = 0;
      for (const s of state.readAllSessions()) {
        if (s.id !== session.id && !s.archived && norm(state.panelKey(s)) === norm(state.panelKey(session))) {
          s.archived = true;
          try { state.writeSession(s); archived++; } catch (e) {}
        }
      }
      return handoffMemo(prev) +
        `\n\n(${archived} old panel${archived === 1 ? '' : 's'} archived. This panel now carries the project. ` +
        'Update statuses to present reality — what was "now" may be done, and clear OPEN ASKS that were answered.)';
    },
    name_session({ name }) {
      session.name = String(name).slice(0, 60);
      save();
      return `Session named: ${session.name}`;
    },
    set_goal({ goal }) {
      session.goal = String(goal);
      save();
      return `Goal set: ${session.goal}`;
    },
    add_step(input) {
      // batch form: {steps:[{...},{...}]} lays out a whole plan in one call —
      // first real-user feedback: one call per step made planning feel costly
      const list = Array.isArray(input && input.steps) && input.steps.length ? input.steps : [input];
      const results = [];
      for (const { id, label, parent_id, status, branch, note, weight } of list) {
        if (id == null || label == null) throw new Error('Each step needs an id and a label.');
        const node = { id: String(id), label: String(label) };
        if (status) node.status = status;
        if (branch) node.branch = true;
        if (weight === 'fork' || weight === 'side') node.weight = weight;
        if (node.weight === 'side') node.collapsed = true; // side-quests park folded
        if (note) node.note = String(note);
        if (!session.map.tree) {
          if (parent_id) throw new Error('Tree is empty — first add_step must be the root (omit parent_id).');
          session.map.tree = node;
        } else {
          if (state.findNode(session.map.tree, node.id)) throw new Error(`Step id "${node.id}" already exists — use set_status to update it.`);
          const parent = parent_id
            ? state.findNode(session.map.tree, String(parent_id))
            : session.map.tree;
          if (!parent) throw new Error(`parent_id "${parent_id}" not found in the journey tree.`);
          (parent.children = parent.children || []).push(node);
        }
        if (status === 'now') {
          const keep = node;
          state.clearNow(session.map.tree, state.pathIds(session.map.tree, node.id));
          keep.status = 'now';
        }
        results.push(`Step "${node.label}" added${parent_id ? ` under ${parent_id}` : ' as root'}.`);
      }
      save();
      return results.join('\n');
    },
    set_status({ id, status, label }) {
      const node = state.findNode(session.map.tree, String(id));
      if (!node) throw new Error(`Step id "${id}" not found.`);
      if (status === 'now') state.clearNow(session.map.tree, state.pathIds(session.map.tree, String(id)));
      node.status = status;
      if (label) node.label = String(label);
      save();
      return `Step "${node.label}" → ${status}.`;
    },
    push_interrupt({ text, resume }) {
      session.stack.unshift({ text: String(text), resume: String(resume), at: new Date().toISOString().slice(0, 16).replace('T', ' ') });
      save();
      return `Interrupted work pushed (stack depth ${session.stack.length}).`;
    },
    pop_interrupt() {
      const item = session.stack.shift();
      save();
      return item ? `Resumed: ${item.text}` : 'Stack was empty.';
    },
    add_decision({ text, kind }) {
      session.decisions.push({ text: String(text), kind: kind === 'assumption' ? 'assumption' : 'decision' });
      save();
      return kind === 'assumption' ? 'Assumption surfaced.' : 'Decision recorded.';
    },
    log_change({ kind, target, summary }) {
      session.changes.push({ kind: String(kind), target: String(target),
        summary: summary ? String(summary) : '', at: new Date().toISOString() });
      save();
      return `Change logged: ${kind} ${target}`;
    },
    log_deadend({ tried, why }) {
      session.deadends.push({ tried: String(tried), why: String(why), at: new Date().toISOString() });
      save();
      return 'Dead end recorded — nobody walks it twice.';
    },
    need_human({ items }) {
      session.pending = (items || []).map(i => ({ text: String(i.text), hot: !!i.hot }));
      save();
      return `Needs-you list set (${session.pending.length} items).`;
    },
    get_panel() {
      const viewer = (typeof getViewerUrl === 'function' && getViewerUrl()) || 'viewer not running';
      return JSON.stringify({ viewer, state: session }, null, 2);
    },
    // ---- plan board tools: the agent drives a Linear/Jira-style plan the human watches ----
    plan_open({ title, id } = {}) {
      const plan = require('./plan');
      if (id) {
        if (!plan.getPlan(id)) throw new Error(`No plan with id ${id}.`);
        session.plan_id = id;
      } else if (!session.plan_id || !plan.getPlan(session.plan_id)) {
        const p = plan.createPlan(title || session.name || session.goal || 'Plan');
        session.plan_id = p.id;
      }
      save();
      const url = (typeof getViewerUrl === 'function' && getViewerUrl()) || '';
      return `Plan open: ${session.plan_id}${url ? ` — human view: ${url}/plan` : ''}`;
    },
    plan_add({ title, status, priority, parent } = {}) {
      const plan = require('./plan');
      if (!session.plan_id) this.plan_open({});
      const cur = plan.getPlan(session.plan_id);
      const { item, version } = plan.plan_mutate(session.plan_id, 'add',
        { title, status, priority, parent, session: session.id }, cur.version);
      return `Task added: ${item.id} [${item.status}] "${item.title}" (plan v${version})`;
    },
    plan_set({ id, status, priority, note } = {}) {
      const plan = require('./plan');
      if (!session.plan_id) throw new Error('No plan open — call plan_open first.');
      const patch = {};
      if (status !== undefined) patch.status = status;
      if (priority !== undefined) patch.priority = priority;
      if (note !== undefined) patch.note = note;
      const cur = plan.getPlan(session.plan_id);
      const { version } = plan.plan_mutate(session.plan_id, 'update', { id, patch }, cur.version);
      return `Task ${id} updated (plan v${version}).`;
    },
    plan_list({ status } = {}) {
      const plan = require('./plan');
      if (!session.plan_id) return 'No plan open — call plan_open first.';
      const p = plan.getPlan(session.plan_id);
      if (!p) return 'Plan not found.';
      let items = p.items;
      if (status) items = items.filter((i) => i.status === status);
      if (!items.length) return status ? `No ${status} tasks.` : 'No tasks yet.';
      return items.map((i) => `${i.id} [${i.status}] P${i.priority} ${i.title}${i.session === session.id ? ' (mine)' : ''}`).join('\n');
    },
  };
}

// ---------- JSON-RPC over stdio ----------
function serve({ getViewerUrl }) {
  let session = null;
  let runner = null;
  try { state.cleanup(); } catch (e) {} // housekeeping: expiry, dead probes, ghost-alive repair

  const rl = readline.createInterface({ input: process.stdin, terminal: false });

  function send(msg) {
    process.stdout.write(JSON.stringify(msg) + '\n');
  }
  function reply(id, result) { send({ jsonrpc: '2.0', id, result }); }
  function replyErr(id, code, message) { send({ jsonrpc: '2.0', id, error: { code, message } }); }

  rl.on('line', (line) => {
    line = line.trim();
    if (!line) return;
    let msg;
    try { msg = JSON.parse(line); } catch (e) { return; } // not for us
    const { id, method, params } = msg;

    try {
      if (method === 'initialize') {
        const clientName = params?.clientInfo?.name || 'unknown-agent';
        session = state.newSession(clientName);
        runner = makeToolRunner(session, getViewerUrl);
        // dynamic handoff hint: tell the agent up front that this project has a past
        let instructions = INSTRUCTIONS;
        try {
          const prev = state.findPrevious(state.panelKey(session), session.id);
          if (prev) {
            const label = prev.name || (prev.goal || '').slice(0, 60) || prev.id;
            instructions += `\n\n>>> A previous panel EXISTS for this project: "${label}" (last updated ${prev.updated}). Call resume_project FIRST to inherit it as your memory.`;
          }
        } catch (e) { /* hint is best-effort */ }
        reply(id, {
          protocolVersion: params?.protocolVersion || PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: { name: 'olchipanel', version: VERSION },
          instructions,
        });
      } else if (method === 'notifications/initialized' || (method && method.startsWith('notifications/'))) {
        // notifications need no response
      } else if (method === 'ping') {
        reply(id, {});
      } else if (method === 'tools/list') {
        reply(id, { tools: TOOLS });
      } else if (method === 'tools/call') {
        if (!runner) throw new Error('Not initialized.');
        const name = params?.name;
        const fn = runner[name];
        if (!fn) return replyErr(id, -32602, `Unknown tool: ${name}`);
        try {
          const text = fn(params?.arguments || {});
          reply(id, { content: [{ type: 'text', text: String(text) }] });
        } catch (e) {
          reply(id, { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true });
        }
      } else if (id !== undefined) {
        replyErr(id, -32601, `Method not found: ${method}`);
      }
    } catch (e) {
      if (id !== undefined) replyErr(id, -32603, e.message);
    }
  });

  const markDead = () => {
    if (!session) return;
    try {
      if (!state.isTouched(session)) { state.deleteSession(session.id); return; } // bare probe — leave no trace
      session.alive = false; state.writeSession(session);
    } catch (e) {}
  };
  rl.on('close', () => { markDead(); process.exit(0); });
  process.on('SIGINT', () => { markDead(); process.exit(0); });
  process.on('SIGTERM', () => { markDead(); process.exit(0); });
}

module.exports = { serve, TOOLS };
