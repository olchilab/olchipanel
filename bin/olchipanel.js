#!/usr/bin/env node
// olchipanel — entry point.
//   olchipanel            → MCP stdio server for the connected agent + viewer (if port free)
//   olchipanel viewer     → viewer only (no MCP); auto-opens the panel window
//   olchipanel open       → open the panel window for a running viewer (or start one)
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
} else if (mode === 'hook') {
  require('../src/hook').run();
} else {
  // MCP mode: stdout belongs to JSON-RPC. Never console.log here.
  // Auto-open here is opt-in via OLCHIPANEL_OPEN (so headless/CI never pops a window).
  viewer.start(); // walks ports; no-op if another instance already serves
  mcp.serve({ getViewerUrl: viewer.currentViewerUrl });
}
