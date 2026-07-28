#!/usr/bin/env node
// olchipanel — entry point.
//   olchipanel            → MCP stdio server for the connected agent + viewer (if port free)
//   olchipanel viewer     → viewer only (no MCP); auto-opens the panel window
//   olchipanel open       → open the panel window for a running viewer (or start one)
//   olchipanel stop       → fully stop the board server (closing the window only closes the screen)
//   olchipanel hook       → agent-hook adapter (stdin: hook event JSON) — deterministic Changes
'use strict';
const viewer = require('../src/viewer');
const mcp = require('../src/mcp');

const mode = process.argv[2] || 'mcp';

if (mode === 'viewer') {
  viewer.start({ announce: true, open: true });
} else if (mode === 'open') {
  const url = viewer.currentViewerUrl();
  if (url) {
    viewer.ping(url, (alive) => {
      if (alive) { viewer.openBrowser(url); console.log(`olchipanel → ${url}`); }
      else viewer.start({ announce: true, open: true }); // stale URL — start a fresh viewer
    });
  } else viewer.start({ announce: true, open: true });
} else if (mode === 'stop') {
  // full shutdown for humans: closing the window only closes the SCREEN — the
  // board process keeps serving (by design). This kills it cleanly, no Task
  // Manager safari required. Agent-owned MCP processes end with their agents.
  const url = viewer.currentViewerUrl();
  if (!url) { console.log('olchipanel: no board is running.'); process.exit(0); }
  viewer.ping(url, (alive) => {
    if (!alive) { console.log('olchipanel: no board is running.'); process.exit(0); }
    require('http').get(url + '/api/state', (res) => {
      let b = '';
      res.on('data', d => { b += d; });
      res.on('end', () => {
        try {
          const pid = JSON.parse(b).pid;
          if (!pid) throw new Error('no pid');
          process.kill(pid);
          console.log(`olchipanel STOPPED (pid ${pid}). Agents keep their own helper processes until you close the agents themselves.`);
        } catch (e) {
          console.log('olchipanel: could not identify the board process — in Task Manager, end the node.exe serving port ' + url.split(':').pop() + '.');
        }
        process.exit(0);
      });
    }).on('error', () => { console.log('olchipanel: no board is running.'); process.exit(0); });
  });
} else if (mode === 'hook') {
  require('../src/hook').run();
} else {
  // MCP mode: stdout belongs to JSON-RPC. Never console.log here.
  // Auto-open here is opt-in via OLCHIPANEL_OPEN (so headless/CI never pops a window).
  viewer.start(); // walks ports; no-op if another instance already serves
  mcp.serve({ getViewerUrl: viewer.currentViewerUrl });
}
