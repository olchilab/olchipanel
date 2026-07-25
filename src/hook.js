// hook.js — optional per-agent enhancer: deterministic Changes logging.
// Claude Code PostToolUse hook pipes its event JSON to `olchipanel hook`;
// we map file/command tools onto log_change entries in the matching live
// session (same cwd, newest). The model can forget — this can't.
// Zero deps, silent on anything it doesn't understand (never breaks the agent).
'use strict';
const fs = require('fs');
const path = require('path');
const state = require('./state');

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch (e) { return ''; }
}

function norm(p) { return String(p || '').replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase(); }

// map a Claude Code tool event to a change entry (null = not a change)
function toChange(evt) {
  const tool = evt.tool_name || '';
  const input = evt.tool_input || {};
  if (tool === 'Write') {
    const existed = input.file_path && fs.existsSync(input.file_path);
    return { kind: existed ? 'modified' : 'created', target: input.file_path || '' };
  }
  if (tool === 'Edit' || tool === 'NotebookEdit') {
    return { kind: 'modified', target: input.file_path || input.notebook_path || '' };
  }
  if (tool === 'Bash') {
    const cmd = String(input.command || '');
    if (!cmd) return null;
    // only commands that plausibly change things; skip pure reads to keep the tab signal-dense
    if (/^\s*(ls|cat|head|tail|grep|rg|find|pwd|echo|git (status|log|diff|show)|node --check)\b/.test(cmd)) return null;
    const commit = /git\s+commit/.test(cmd);
    return { kind: commit ? 'commit' : 'command', target: cmd.slice(0, 120) };
  }
  return null;
}

function run() {
  let evt;
  try { evt = JSON.parse(readStdin()); } catch (e) { return; } // not for us — stay silent
  const change = toChange(evt);
  if (!change || !change.target) return;

  // find the live session for this project (same cwd), newest first
  const cwd = norm(evt.cwd || process.cwd());
  const sessions = state.readAllSessions().filter(s => s.alive && norm(s.cwd) === cwd);
  const target = sessions[0];
  if (!target) return; // no live panel for this project — nothing to enrich

  target.changes = target.changes || [];
  const last = target.changes[target.changes.length - 1];
  const at = new Date().toISOString();
  if (last && last.kind === change.kind && last.target === change.target) {
    last.at = at; // coalesce repeated edits of the same file
  } else {
    target.changes.push({ kind: change.kind, target: change.target, summary: '', at });
  }
  try { state.writeSession(target); } catch (e) { /* never break the agent over telemetry */ }
}

module.exports = { run, toChange };
if (require.main === module) run();
