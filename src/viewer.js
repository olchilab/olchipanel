// viewer.js — tiny HTTP + SSE server for the live panel. Zero deps.
// Any olchipanel process tries to start this; if the port is taken, another
// instance is already serving (state is shared via files, so that's fine).
// The actually-bound URL is written to ~/.olchipanel/viewer.json so every
// process (and get_panel) can report the real address.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const state = require('./state');

const BASE_PORT = Number(process.env.OLCHIPANEL_PORT || 6711);
const MAX_TRIES = 10;
const PUBLIC = path.join(__dirname, '..', 'public');
const VIEWER_FILE = path.join(state.ROOT, 'viewer.json');

function currentViewerUrl() {
  try { return JSON.parse(fs.readFileSync(VIEWER_FILE, 'utf8')).url; } catch (e) { return null; }
}

// viewer.json can be stale (points at a viewer that has since died — SIGKILL
// leaves no chance to clean it). Verify the URL actually answers before trusting it.
function ping(url, cb) {
  let done = false;
  const finish = (ok) => { if (!done) { done = true; cb(ok); } };
  try {
    const req = http.get(url + '/api/state', { timeout: 2000 }, (res) => {
      res.resume(); finish(res.statusCode === 200);
    });
    req.on('error', () => finish(false));
    req.on('timeout', () => { req.destroy(); finish(false); });
  } catch (e) { finish(false); }
}

// Whether to auto-open a browser. `olchipanel viewer`/`open` always do.
// In MCP mode it's opt-in via env (so CI/headless never pops a window):
// OLCHIPANEL_OPEN = 1|true|app -> open ; 0|false|tab handled below.
function shouldOpen(opts) {
  const v = String(process.env.OLCHIPANEL_OPEN || '').toLowerCase();
  if (['0', 'false', 'no', 'off'].includes(v)) return false;
  if (opts && opts.open) return true;
  return ['1', 'true', 'yes', 'on', 'app', 'tab'].includes(v);
}

// CSRF guard for the localhost write endpoints: browsers attach an Origin header
// to cross-site POSTs. Same-origin fetches carry our own host (or no Origin for
// non-browser tools like curl) — anything else is some web page poking localhost.
// DNS-rebinding guard: a hostile page can point its own domain at 127.0.0.1
// and then read the panel as if same-origin. The browser can't fake Host —
// reject anything that isn't a loopback name before touching any route.
function hostOk(req) {
  const h = String(req.headers.host || '').replace(/:\d+$/, '').toLowerCase();
  return h === '127.0.0.1' || h === 'localhost' || h === '[::1]';
}

function sameOriginOk(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // curl / same-origin GET-form-free fetches
  try { return new URL(origin).hostname === '127.0.0.1' || new URL(origin).hostname === 'localhost'; }
  catch (e) { return false; }
}

// A session's cwd is machine-truth from the agent, but it can be tilde-prefixed,
// stale, or from another machine. Resolve to a real directory or null — spawning
// a terminal at a bad path pops an OS error dialog instead of a terminal.
function resolveDir(p) {
  if (!p) return null;
  let dir = String(p);
  if (dir === '~') dir = os.homedir();
  else if (dir.startsWith('~/') || dir.startsWith('~\\')) dir = path.join(os.homedir(), dir.slice(2));
  try { return fs.statSync(dir).isDirectory() ? dir : null; } catch (e) { return null; }
}

// One-click MCP setup: write the olchipanel entry into the chosen agent's
// config. Fixed templates only — the request carries an agent key, never
// content or paths. Existing-but-broken JSON is never clobbered (fail loud).
function setupAgent(agent, dir) {
  const entry = { command: 'npx', args: ['-y', 'olchipanel'] };
  function patchJson(file) {
    let j = {};
    if (fs.existsSync(file)) {
      try { j = JSON.parse(fs.readFileSync(file, 'utf8')); }
      catch (e) { throw new Error(path.basename(file) + ' exists but is not valid JSON — fix it by hand'); }
    }
    j.mcpServers = j.mcpServers || {};
    const already = JSON.stringify(j.mcpServers.olchipanel) === JSON.stringify(entry);
    j.mcpServers.olchipanel = entry;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(j, null, 2) + '\n', 'utf8');
    return { wrote: file, already };
  }
  if (agent === 'claude') {
    if (!dir) throw new Error('project_folder_missing');
    return patchJson(path.join(dir, '.mcp.json'));
  }
  if (agent === 'cursor') {
    if (!dir) throw new Error('project_folder_missing');
    return patchJson(path.join(dir, '.cursor', 'mcp.json'));
  }
  if (agent === 'codex') {
    const file = path.join(os.homedir(), '.codex', 'config.toml');
    let txt = '';
    try { txt = fs.readFileSync(file, 'utf8'); } catch (e) { /* absent → create */ }
    // duplicate keys make the whole TOML invalid, so any plausible existing
    // olchipanel definition (table header, dotted key, or inline under a table)
    // means skip — false-skip is safe, a duplicate append corrupts the config
    if (/^\s*\[mcp_servers\.olchipanel\]/m.test(txt) ||
        /^\s*(mcp_servers\.)?olchipanel\s*=/m.test(txt)) return { wrote: file, already: true };
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.appendFileSync(file, (txt && !txt.endsWith('\n') ? '\n' : '') +
      '\n[mcp_servers.olchipanel]\ncommand = "npx"\nargs = ["-y", "olchipanel"]\n', 'utf8');
    return { wrote: file, already: false };
  }
  throw new Error('unknown_agent');
}

// (The one-click "open terminal" endpoint was removed in 0.2.0 — the spawned
// terminal landing outside the panel confused more than it helped. The resume
// bar keeps the copy-prompt path.)

// Open the panel. Default: an app window (no address bar; shows in the taskbar
// like its own app) via Edge/Chrome. Falls back to the default browser as a tab.
// OLCHIPANEL_OPEN=tab forces a normal tab. Opening is best-effort, never fatal.
function openBrowser(url) {
  const mode = String(process.env.OLCHIPANEL_OPEN || '').toLowerCase();
  const plat = process.platform;
  const detached = { detached: true, stdio: 'ignore' };
  function tab() {
    try {
      if (plat === 'win32') spawn('cmd', ['/c', 'start', '', url], detached).unref();
      else if (plat === 'darwin') spawn('open', [url], detached).unref();
      else spawn('xdg-open', [url], detached).unref();
    } catch (e) { /* give up quietly */ }
  }
  if (mode === 'tab') return tab();
  // app-window attempt (no chrome), fall back to a tab on any failure
  try {
    if (plat === 'win32') {
      const p = spawn('cmd', ['/c', 'start', 'msedge', '--app=' + url], detached);
      p.on('error', tab); p.unref();
    } else if (plat === 'darwin') {
      const p = spawn('open', ['-na', 'Google Chrome', '--args', '--app=' + url], detached);
      p.on('error', tab); p.unref();
    } else {
      const p = spawn('google-chrome', ['--app=' + url], detached);
      p.on('error', function () { try { spawn('chromium', ['--app=' + url], detached).unref(); } catch (e) { tab(); } });
      p.unref();
    }
  } catch (e) { tab(); }
}

function start(opts) {
  opts = opts || {};
  const clients = new Set();

  const server = http.createServer((req, res) => {
    if (!hostOk(req)) { res.writeHead(403); return res.end('forbidden'); }
    const url = (req.url || '/').split('?')[0];
    if (url === '/' || url === '/index.html') {
      // no-store: the page must always reflect the shipped UI, never a stale cache
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(fs.readFileSync(path.join(PUBLIC, 'index.html')));
    } else if (url === '/manifest.webmanifest') {
      // installable PWA: a standalone window whose titlebar melts into the app
      res.writeHead(200, { 'Content-Type': 'application/manifest+json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({
        name: 'OlchiPanel', short_name: 'OlchiPanel', start_url: '/',
        display: 'standalone', display_override: ['window-controls-overlay', 'standalone'],
        background_color: '#16161a', theme_color: '#16161a',
        icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' }],
      }));
    } else if (url === '/icon.svg') {
      res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' });
      res.end("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='#17324f'/><path d='M12 9.5v13l10.5-6.5z' fill='#b7d95b'/></svg>");
    } else if (url === '/api/state') {
      // read-time truth overlay: a session whose owner pid is gone is not alive,
      // whatever its file says (SIGKILL leaves no chance to write alive:false)
      const all = state.readAllSessions().map(s => {
        if (s.alive && state.pidAlive(s.id) === false) return { ...s, alive: false };
        return s;
      });
      // archived panels (superseded by a resume_project) stay on disk until expiry
      // but leave the sidebar — one living panel per project
      const visible = all.filter(s => !s.archived);
      const MAX = 30;
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ sessions: visible.slice(0, MAX), total: all.length }));
    } else if (url === '/api/setup-agent' && req.method === 'POST') {
      // One-click MCP setup from the help screen. The request names an agent
      // (whitelisted) and a session (for the project folder) — config content
      // and target paths are fixed server-side. Origin-checked (CSRF guard).
      if (!sameOriginOk(req)) { res.writeHead(403); return res.end('{"ok":false,"error":"forbidden"}'); }
      let body = '';
      req.on('data', d => { body += d; if (body.length > 4096) req.destroy(); });
      req.on('end', () => {
        try {
          const { agent, id } = JSON.parse(body || '{}');
          if (!['claude', 'codex', 'cursor'].includes(agent)) { res.writeHead(400, { 'Content-Type': 'application/json' }); return res.end('{"ok":false,"error":"unknown_agent"}'); }
          const s = state.readAllSessions().find(x => x.id === id);
          const r = setupAgent(agent, s ? resolveDir(s.cwd) : null);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, wrote: r.wrote, already: r.already }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: String(e.message || e) }));
        }
      });
    } else if (url === '/api/archive' && req.method === 'POST') {
      if (!sameOriginOk(req)) { res.writeHead(403); return res.end('{"ok":false,"error":"forbidden"}'); }
      // the viewer's only write: tuck a (dead) panel away. localhost-only by bind.
      let body = '';
      req.on('data', d => { body += d; if (body.length > 4096) req.destroy(); });
      req.on('end', () => {
        try {
          const { id } = JSON.parse(body || '{}');
          const s = state.readAllSessions().find(x => x.id === id);
          if (!s) { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end('{"ok":false,"error":"not_found"}'); }
          s.archived = true;
          state.writeSession(s); // touches the dir → SSE broadcasts the change
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end('{"ok":true}');
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end('{"ok":false,"error":"bad_request"}');
        }
      });
    } else if (url === '/events') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store',
        'Connection': 'keep-alive',
      });
      res.write(': connected\n\n');
      clients.add(res);
      req.on('close', () => clients.delete(res));
    } else {
      res.writeHead(404); res.end('not found');
    }
  });

  function broadcast() {
    for (const res of clients) {
      try { res.write('data: changed\n\n'); } catch (e) { clients.delete(res); }
    }
  }

  // Watch the sessions dir; debounce bursts. Slow poll backs up fs.watch
  // where it is unreliable (network drives etc.).
  state.ensureDirs();
  let t = null;
  const kick = () => { clearTimeout(t); t = setTimeout(broadcast, 120); };
  // unref: watching must not keep a process alive that never won the bind —
  // an adopting `open` would otherwise linger forever as a zombie
  try { fs.watch(state.SESSIONS, kick).unref(); } catch (e) { /* poll covers it */ }
  let lastMtime = 0;
  setInterval(() => {
    let m;
    try { m = fs.statSync(state.SESSIONS).mtimeMs; } catch (e) { return; }
    if (m !== lastMtime) { lastMtime = m; kick(); }
  }, 5000).unref();

  // Bind: walk candidate ports. A taken port is first health-checked: if a live
  // olchipanel viewer already answers there, ADOPT it (heal the discovery file,
  // spawn nothing) instead of binding the next port — port-walking used to
  // create duplicate viewers whose death left viewer.json pointing at a corpse.
  let attempt = 0;
  function tryListen() {
    server.listen(BASE_PORT + attempt, '127.0.0.1');
  }
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE' || e.code === 'EACCES') {
      const takenUrl = `http://127.0.0.1:${BASE_PORT + attempt}`;
      return ping(takenUrl, (aliveViewer) => {
        if (aliveViewer) {
          // someone else serves — by design. Make sure discovery points at them.
          if (currentViewerUrl() !== takenUrl) {
            try { fs.writeFileSync(VIEWER_FILE, JSON.stringify({ url: takenUrl, pid: null, adopted_at: new Date().toISOString() }), 'utf8'); } catch (err) {}
          }
          if (opts.announce) console.log(`olchipanel viewer (existing) → ${takenUrl}`);
          if (shouldOpen(opts)) openBrowser(takenUrl);
          return;
        }
        if (++attempt < MAX_TRIES) return tryListen(); // squatter that isn't a viewer → next port
      });
    }
    console.error('[olchipanel viewer]', e.message);
  });
  server.on('listening', () => {
    const url = `http://127.0.0.1:${server.address().port}`;
    try {
      fs.writeFileSync(VIEWER_FILE, JSON.stringify({ url, pid: process.pid, at: new Date().toISOString() }), 'utf8');
    } catch (e) {}
    if (opts.announce) console.log(`olchipanel viewer → ${url}`);
    // only the process that WON the bind reaches here — so "already open" never
    // double-opens: a second instance fails to bind and never gets this callback.
    if (shouldOpen(opts)) openBrowser(url);
  });
  tryListen();
  return server;
}

module.exports = { start, currentViewerUrl, openBrowser, ping, BASE_PORT };
