// viewer.js — tiny HTTP + SSE server for the live panel. Zero deps.
// Any olchipanel process tries to start this; if the port is taken, another
// instance is already serving (state is shared via files, so that's fine).
// The actually-bound URL is written to ~/.olchipanel/viewer.json so every
// process (and get_panel) can report the real address.
'use strict';
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const state = require('./state');

const VERSION = require('../package.json').version;

// Once-a-day version check against the npm registry — a plain GET, nothing
// attached. The ONLY network call this tool ever makes; disable with
// OLCHIPANEL_NO_UPDATE_CHECK=1. Failure is silence, never an error.
let latestKnown = null;
function checkUpdate() {
  if (process.env.OLCHIPANEL_NO_UPDATE_CHECK) return;
  try {
    const req = https.get('https://registry.npmjs.org/olchipanel/latest', { timeout: 4000 }, (res) => {
      let b = '';
      res.on('data', d => { b += d; if (b.length > 65536) req.destroy(); });
      res.on('end', () => {
        try {
          const v = JSON.parse(b).version;
          if (v && v !== VERSION) latestKnown = v;
        } catch (e) { /* silent */ }
      });
    });
    req.on('error', () => {});
    req.on('timeout', () => req.destroy());
  } catch (e) { /* silent */ }
}

const BASE_PORT = Number(process.env.OLCHIPANEL_PORT || 6711);
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

// A single ping can misfire during a race: an incumbent viewer that just won the
// bind may not answer /api/state for a beat, and a briefly-busy one can blow the
// 2s window. Declaring it dead on one miss is what made a new viewer spawn on the
// NEXT port — a fresh panel each launch. Retry a few times before giving up so
// "adopt the existing viewer" is reliable and the machine keeps ONE panel.
function pingRetry(url, tries, cb) {
  ping(url, (ok) => {
    if (ok || tries <= 1) return cb(ok);
    setTimeout(() => pingRetry(url, tries - 1, cb), 300);
  });
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

// Memo file for a request: ?id=<session> → memo-<safe>.txt (per panel),
// no id → memo.txt (board-wide). id is sanitized to a safe filename.
function memoFile(rawUrl) {
  let id = '';
  const q = rawUrl.indexOf('?');
  if (q >= 0) {
    const m = /(?:^|&)id=([^&]*)/.exec(rawUrl.slice(q + 1));
    if (m) id = decodeURIComponent(m[1]);
  }
  const safe = String(id).replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80);
  return path.join(state.ROOT, safe ? `memo-${safe}.txt` : 'memo.txt');
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
  const entry = { command: 'npx', args: ['-y', 'olchipanel@latest'] }; // @latest: bare npx freezes on the first cached version (measured)
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
      '\n[mcp_servers.olchipanel]\ncommand = "npx"\nargs = ["-y", "olchipanel@latest"]\n', 'utf8');
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
// App-mode args with a DEDICATED profile dir. Without --user-data-dir, a new
// --app window attaches to the user's already-running Chrome — which then
// shows the address bar and inherits that instance's flags (e.g. a stray
// --no-sandbox warning banner). A separate profile forces a clean app window.
function appArgs(url) {
  const profile = path.join(state.ROOT, 'browser-profile');
  try { fs.mkdirSync(profile, { recursive: true }); } catch (e) {}
  return ['--app=' + url, '--user-data-dir=' + profile, '--no-first-run', '--no-default-browser-check'];
}

// Auto-open dedupe: with OLCHIPANEL_OPEN=app in the MCP config, EVERY agent that
// connects would pop its own window at the same board — 5 agents, 5 windows.
// A marker records that a window was already opened for the current board; auto
// opens skip when it matches. Explicit `olchipanel open`/`viewer` ignore it
// (the human asked for a window). Marker resets when the board process changes.
const WINDOW_MARKER = path.join(state.ROOT, 'window.json');
function boardStamp() { try { const j = JSON.parse(fs.readFileSync(VIEWER_FILE, 'utf8')); return j.at || j.adopted_at || ''; } catch (e) { return ''; } }
function windowAlreadyOpen() { try { return JSON.parse(fs.readFileSync(WINDOW_MARKER, 'utf8')).boardAt === boardStamp(); } catch (e) { return false; } }
function markWindowOpen() { try { fs.writeFileSync(WINDOW_MARKER, JSON.stringify({ boardAt: boardStamp(), at: new Date().toISOString() }), 'utf8'); } catch (e) {} }

function openBrowser(url, opts) {
  // auto opens (agent-triggered) dedupe; explicit human opens always proceed
  if (opts && opts.auto && windowAlreadyOpen()) return;
  markWindowOpen();
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
  // app-window attempt (no address bar). `start msedge --app=` silently opened
  // a normal tabbed window when Edge wasn't the app alias — so on Windows we
  // locate a real chrome/edge exe and pass --app directly; only then fall to a tab.
  try {
    if (plat === 'win32') {
      const env = process.env;
      const candidates = [
        env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
        env.PROGRAMFILES && path.join(env.PROGRAMFILES, 'Google/Chrome/Application/chrome.exe'),
        env['PROGRAMFILES(X86)'] && path.join(env['PROGRAMFILES(X86)'], 'Google/Chrome/Application/chrome.exe'),
        env['PROGRAMFILES(X86)'] && path.join(env['PROGRAMFILES(X86)'], 'Microsoft/Edge/Application/msedge.exe'),
        env.PROGRAMFILES && path.join(env.PROGRAMFILES, 'Microsoft/Edge/Application/msedge.exe'),
        // registry-independent last resorts (App Paths / common install roots)
        env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'Microsoft/Edge/Application/msedge.exe'),
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
      ].filter(Boolean);
      let exe = candidates.find(p => { try { return fs.existsSync(p); } catch (e) { return false; } });
      if (!exe) {
        // PATH lookup as a final resort so a nonstandard install still gets app mode
        try {
          const out = require('child_process').execSync('where chrome 2>NUL || where msedge 2>NUL',
            { encoding: 'utf8', windowsHide: true }).split(/\r?\n/).find(Boolean);
          if (out && fs.existsSync(out.trim())) exe = out.trim();
        } catch (e) { /* none on PATH */ }
      }
      if (exe) {
        const p = spawn(exe, appArgs(url), detached);
        p.on('error', tab); p.unref();
      } else { tab(); } // no Chromium browser found → plain tab is the honest fallback
    } else if (plat === 'darwin') {
      const p = spawn('open', ['-na', 'Google Chrome', '--args'].concat(appArgs(url)), detached);
      p.on('error', tab); p.unref();
    } else {
      const p = spawn('google-chrome', appArgs(url), detached);
      p.on('error', function () { try { spawn('chromium', appArgs(url), detached).unref(); } catch (e) { tab(); } });
      p.unref();
    }
  } catch (e) { tab(); }
}

// Read a JSON body, run handler(body), and reply. Maps plan invariant errors to
// HTTP: stale→409, bad_*→400, no_*/not found→404, else 500. Never leaks stacks.
function readJson(req, res, handler) {
  let body = '';
  req.on('data', (d) => { body += d; if (body.length > 262144) req.destroy(); });
  req.on('end', () => {
    let out;
    try {
      const parsed = body ? JSON.parse(body) : {};
      out = handler(parsed);
    } catch (e) {
      const code = e && e.code;
      const status = code === 'stale' ? 409
        : /^bad_|^cycle$/.test(String(code)) ? 400
          : /^no_|_not/.test(String(code)) || code === 'no_plan' || code === 'no_item' || code === 'no_parent' ? 404
            : 400;
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ ok: false, error: code || 'bad_request' }));
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(Object.assign({ ok: true }, out)));
  });
}

function query(rawUrl, key) {
  const q = rawUrl.indexOf('?');
  if (q < 0) return '';
  const m = new RegExp('(?:^|&)' + key + '=([^&]*)').exec(rawUrl.slice(q + 1));
  return m ? decodeURIComponent(m[1]) : '';
}

function start(opts) {
  opts = opts || {};
  try { state.cleanup(); } catch (e) {} // archive dead+stale sessions so the board stays clean

  // Discovery-first single-instance: if viewer.json already names a viewer that
  // still answers (retried, to survive a startup race or a busy beat), ADOPT it
  // and spawn nothing — regardless of which port it's on. This is what keeps the
  // machine to ONE panel instead of binding a fresh port every launch. Only when
  // no live viewer is on record do we bind (bindNew walks ports for a free one).
  const known = currentViewerUrl();
  if (known) {
    pingRetry(known, 4, (alive) => {
      if (alive) {
        if (currentViewerUrl() !== known) {
          try { fs.writeFileSync(VIEWER_FILE, JSON.stringify({ url: known, pid: null, adopted_at: new Date().toISOString() }), 'utf8'); } catch (e) {}
        }
        if (opts.announce) console.log(`olchipanel viewer (existing) → ${known}`);
        if (shouldOpen(opts)) openBrowser(known, { auto: !opts.open });
      } else {
        bindNew(opts); // discovery record is stale → start a fresh viewer
      }
    });
    return null;
  }
  return bindNew(opts);
}

function bindNew(opts) {
  opts = opts || {};
  const clients = new Set();

  const server = http.createServer((req, res) => {
    if (!hostOk(req)) { res.writeHead(403); return res.end('forbidden'); }
    const rawUrl = req.url || '/';
    const url = rawUrl.split('?')[0];
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
      res.end(JSON.stringify({ sessions: visible.slice(0, MAX), total: all.length, version: VERSION, latest: latestKnown, pid: process.pid }));
    } else if (rawUrl.split('?')[0] === '/api/memo' && req.method === 'GET') {
      // human's scratchpad — one per panel (id), plus a board-wide one (no id).
      // Agents never read or write these files; this is the human's corner.
      let text = '';
      try { text = fs.readFileSync(memoFile(rawUrl), 'utf8'); } catch (e) {}
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ text }));
    } else if (rawUrl.split('?')[0] === '/api/memo' && req.method === 'POST') {
      if (!sameOriginOk(req)) { res.writeHead(403); return res.end('{"ok":false,"error":"forbidden"}'); }
      let body = '';
      req.on('data', d => { body += d; if (body.length > 262144) req.destroy(); });
      req.on('end', () => {
        try {
          const { text } = JSON.parse(body || '{}');
          fs.writeFileSync(memoFile(rawUrl), String(text == null ? '' : text).slice(0, 65536), 'utf8');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end('{"ok":true}');
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end('{"ok":false,"error":"bad_request"}');
        }
      });
    } else if (url === '/api/rename' && req.method === 'POST') {
      // rename a session from the sidebar (human affordance). Origin-checked (CSRF).
      if (!sameOriginOk(req)) { res.writeHead(403); return res.end('{"ok":false,"error":"forbidden"}'); }
      let body = '';
      req.on('data', d => { body += d; if (body.length > 4096) req.destroy(); });
      req.on('end', () => {
        try {
          const { id, name } = JSON.parse(body || '{}');
          const s = state.readAllSessions().find(x => x.id === id);
          if (!s) { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end('{"ok":false,"error":"not_found"}'); }
          s.name = String(name == null ? '' : name).slice(0, 60);
          state.writeSession(s); // touches the dir → SSE broadcasts
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true, name: s.name }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end('{"ok":false,"error":"bad_request"}');
        }
      });
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
    } else if (url === '/plan' || url === '/plans' || url === '/plan.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(fs.readFileSync(path.join(PUBLIC, 'plan.html')));
    } else if (url === '/api/plans' && req.method === 'GET') {
      const plan = require('./plan');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(plan.listPlans()));
    } else if (url === '/api/plans' && req.method === 'POST') {
      if (!sameOriginOk(req)) { res.writeHead(403); return res.end('{"ok":false,"error":"forbidden"}'); }
      readJson(req, res, (b) => {
        const plan = require('./plan');
        const p = plan.createPlan(b.title);
        return { id: p.id, version: p.version };
      });
    } else if (rawUrl.split('?')[0] === '/api/plan' && req.method === 'GET') {
      const plan = require('./plan');
      const id = query(rawUrl, 'id');
      const p = plan.getPlan(id);
      if (!p) { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end('{"ok":false,"error":"not_found"}'); }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(p));
    } else if (rawUrl.split('?')[0] === '/api/plan/item' && req.method === 'POST') {
      if (!sameOriginOk(req)) { res.writeHead(403); return res.end('{"ok":false,"error":"forbidden"}'); }
      readJson(req, res, (b) => require('./plan').plan_mutate(query(rawUrl, 'plan'), 'add', b, b.baseVersion));
    } else if (rawUrl.split('?')[0] === '/api/plan/item' && req.method === 'PATCH') {
      if (!sameOriginOk(req)) { res.writeHead(403); return res.end('{"ok":false,"error":"forbidden"}'); }
      readJson(req, res, (b) => require('./plan').plan_mutate(query(rawUrl, 'plan'), 'update', { id: query(rawUrl, 'id'), patch: b.patch }, b.baseVersion));
    } else if (rawUrl.split('?')[0] === '/api/plan/item' && req.method === 'DELETE') {
      if (!sameOriginOk(req)) { res.writeHead(403); return res.end('{"ok":false,"error":"forbidden"}'); }
      readJson(req, res, (b) => require('./plan').plan_mutate(query(rawUrl, 'plan'), 'delete', { id: query(rawUrl, 'id') }, b.baseVersion));
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

  // Background devices (dir watch, 5s poll, daily update check) are armed ONLY
  // in the one process that actually wins the bind and serves the board — every
  // other connected agent's MCP process stays fully idle in the background.
  // (User-burden rule: with N agents attached, exactly 1 process does any work.)
  state.ensureDirs();
  let t = null;
  const kick = () => { clearTimeout(t); t = setTimeout(broadcast, 120); };
  function armBackgroundDevices() {
    // unref everywhere: none of this may keep a dying process alive
    try { fs.watch(state.SESSIONS, kick).unref(); } catch (e) { /* poll covers it */ }
    let lastMtime = 0;
    setInterval(() => {
      let m;
      try { m = fs.statSync(state.SESSIONS).mtimeMs; } catch (e) { return; }
      if (m !== lastMtime) { lastMtime = m; kick(); }
    }, 5000).unref();
    checkUpdate();
    setInterval(checkUpdate, 24 * 60 * 60 * 1000).unref();
  }

  // Bind ONE canonical port only (no port-walking). One machine → one viewer →
  // one port. Port-walking is what let instances pile up: a busy/slow 6711 sent
  // the launch to 6712, 6713… each a separate viewer, and their corpses left
  // stale discovery. So: if BASE_PORT is taken, health-check it — if an
  // olchipanel viewer already owns it, ADOPT (spawn nothing); if it's taken by
  // something that isn't our viewer, fail loud and DO NOT drift to another port.
  function tryListen() {
    server.listen(BASE_PORT, '127.0.0.1');
  }
  const takenUrl = `http://127.0.0.1:${BASE_PORT}`;
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE' || e.code === 'EACCES') {
      // retry generously so a viewer mid-startup isn't mistaken for a squatter
      return pingRetry(takenUrl, 8, (aliveViewer) => {
        if (aliveViewer) {
          // an olchipanel viewer already owns the port → adopt it, spawn nothing
          if (currentViewerUrl() !== takenUrl) {
            try { fs.writeFileSync(VIEWER_FILE, JSON.stringify({ url: takenUrl, pid: null, adopted_at: new Date().toISOString() }), 'utf8'); } catch (err) {}
          }
          if (opts.announce) console.log(`olchipanel viewer (existing) → ${takenUrl}`);
          if (shouldOpen(opts)) openBrowser(takenUrl, { auto: !opts.open });
          return;
        }
        // port busy but no olchipanel viewer answers → do NOT bind a second port.
        console.error(`[olchipanel] port ${BASE_PORT} is busy but no olchipanel viewer responds there. ` +
          `Free that port (or set OLCHIPANEL_PORT) and relaunch — not spawning a second instance.`);
      });
    }
    console.error('[olchipanel viewer]', e.message);
  });
  server.on('listening', () => {
    const url = `http://127.0.0.1:${server.address().port}`;
    try {
      fs.writeFileSync(VIEWER_FILE, JSON.stringify({ url, pid: process.pid, at: new Date().toISOString() }), 'utf8');
    } catch (e) {}
    armBackgroundDevices(); // the bind winner is the ONLY process doing background work
    if (opts.announce) console.log(`olchipanel READY → ${url}  (board is live; this window keeps serving it — minimize it, or close it and any connected agent will take over)`);
    // only the process that WON the bind reaches here — so "already open" never
    // double-opens: a second instance fails to bind and never gets this callback.
    if (shouldOpen(opts)) openBrowser(url, { auto: !opts.open });
  });
  tryListen();
  return server;
}

module.exports = { start, currentViewerUrl, openBrowser, ping, BASE_PORT };
