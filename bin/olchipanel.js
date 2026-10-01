#!/usr/bin/env node
// olchipanel — entry point.
//   olchipanel            → MCP stdio server; viewer starts on first explicit tool call
//   olchipanel viewer     → viewer only (no MCP); auto-opens the panel window
//   olchipanel open       → open the panel window for a running viewer (or start one)
//   olchipanel stop       → fully stop the board server (closing the window only closes the screen)
//   olchipanel doctor     → read-only first-success diagnostics
//   olchipanel hook       → agent-hook adapter (stdin: hook event JSON) — deterministic Changes
'use strict';
const viewer = require('../src/viewer');
const mcp = require('../src/mcp');
const VERSION = require('../package.json').version;

const mode = process.argv[2] || 'mcp';

const HELP = `OlchiPanel ${VERSION}

Usage:
  olchipanel                 Start the MCP stdio server (used by agents)
  olchipanel open            Open the board; starts a local viewer if needed
  olchipanel start [--project DIR]  Register project guides/skills, then open the board
  olchipanel setup [--project DIR] [--check]  Register guides/skills without opening a viewer
  olchipanel viewer          Start the local viewer and open its window
  olchipanel stop            Stop the discovered local viewer
  olchipanel doctor [--json] Check Node, npx, viewer, and agent MCP configuration
  olchipanel hook            Read one agent hook event from stdin
  olchipanel --help          Show this help
  olchipanel --version       Print the installed version

The viewer binds to 127.0.0.1 (default port 6711). When open/viewer starts a
server, keep that terminal open; stop it with Ctrl+C or run "olchipanel stop"
from another terminal.`;

if (mode === '--help' || mode === '-h' || mode === 'help') {
  console.log(HELP);
  process.exit(0);
}
if (mode === '--version' || mode === '-v' || mode === 'version') {
  console.log(VERSION);
  process.exit(0);
}
if (!['mcp', 'viewer', 'open', 'start', 'setup', 'stop', 'doctor', 'hook'].includes(mode)) {
  console.error(`olchipanel: unknown command "${mode}".\n`);
  console.error(HELP);
  process.exit(1);
}

if (mode === 'setup' || mode === 'start') {
  try {
    const args = process.argv.slice(3);
    let project = process.cwd(), dryRun = false;
    for (let i = 0; i < args.length; i++) {
      if (args[i] === '--project' && args[i + 1] && !args[i + 1].startsWith('--')) project = args[++i];
      else if (args[i] === '--check' && mode === 'setup') dryRun = true;
      else throw new Error(`Unknown or incomplete setup argument: ${args[i]}`);
    }
    console.log(dryRun ? 'OlchiPanel 프로젝트 지침·스킬 등록 범위를 확인합니다.' : 'OlchiPanel 프로젝트 지침·스킬을 등록합니다.');
    console.log(JSON.stringify(require('../src/project-setup').setupProject(project, { dryRun }), null, 2));
  } catch (error) {
    console.error(`OlchiPanel setup failed: ${error.message}`);
    process.exit(1);
  }
  if (mode === 'setup') process.exit(0);
}

if (mode === 'viewer') {
  console.log('olchipanel: starting the local viewer…');
  viewer.start({ announce: true, open: true });
} else if (mode === 'open' || mode === 'start') {
  console.log('olchipanel: opening the board…');
  const url = viewer.currentViewerUrl();
  if (url) {
    viewer.ping(url, (alive) => {
      if (alive) {
        viewer.openBrowserOnce(url, {}, (opened) => {
          console.log(opened ? `olchipanel → ${url}` : `olchipanel already open → ${url}`);
        });
      }
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
} else if (mode === 'doctor') {
  const doctor = require('../src/doctor');
  doctor.inspect().then((report) => {
    if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
    else console.log(doctor.format(report));
    process.exitCode = report.ready ? 0 : 1;
  }).catch((error) => {
    console.error('olchipanel doctor failed:', error && error.message || error);
    process.exitCode = 1;
  });
} else if (mode === 'hook') {
  require('../src/hook').run();
} else {
  // MCP mode: stdout belongs to JSON-RPC. Never console.log here.
  // The handshake creates no panel or viewer. Registration and viewer startup
  // begin with the first panel tool call after explicit human opt-in.
  let viewerRequested = false;
  mcp.serve({
    getViewerUrl: viewer.currentViewerUrl,
    ensureViewer: () => {
      if (viewerRequested) return;
      viewerRequested = true;
      // Auto-open remains separately opt-in via OLCHIPANEL_OPEN.
      viewer.start();
    },
  });
}
