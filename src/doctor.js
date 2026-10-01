// doctor.js — read-only first-success diagnostics for the CLI and viewer.
// Never writes agent configuration. It reports only whether an OlchiPanel MCP
// entry is present/current, without returning unrelated config contents.
'use strict';

const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { parse: parseToml } = require('smol-toml');

const VERSION = require('../package.json').version;

function readText(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch (e) { return null; }
}

function installedRuntime(entry) {
  if (!entry || entry.env?.ELECTRON_RUN_AS_NODE !== '1' || !Array.isArray(entry.args) || entry.args.length !== 1) return false;
  if (!path.isAbsolute(entry.command || '') || !/OlchiPanel\.exe$/i.test(entry.command)) return false;
  const archive = path.join(path.dirname(entry.command), 'resources', 'app.asar');
  return entry.args[0] === path.join(archive, 'bin', 'olchipanel.js') && fs.existsSync(entry.command) && fs.existsSync(archive);
}

function jsonEntry(file) {
  const text = readText(file);
  if (text === null) return { file, exists: false, valid: true, configured: false, current: false };
  try {
    const json = JSON.parse(text);
    const entry = json && json.mcpServers && json.mcpServers.olchipanel;
    const command = entry && String(entry.command || '').toLowerCase();
    const args = entry && Array.isArray(entry.args) ? entry.args.map(String) : [];
    return {
      file, exists: true, valid: true, configured: !!entry,
      bundled: installedRuntime(entry),
      current: installedRuntime(entry) || (!!entry && /^npx(?:\.cmd)?$/.test(command) && args.includes('-y') && args.includes('olchipanel@latest')),
    };
  } catch (e) {
    return { file, exists: true, valid: false, configured: false, current: false };
  }
}

function codexEntry(file) {
  const text = readText(file);
  if (text === null) return { file, exists: false, valid: true, configured: false, current: false };
  try {
    const entry = parseToml(text.replace(/^\uFEFF/, '')).mcp_servers?.olchipanel;
    const bundled = installedRuntime(entry);
    return { file, exists: true, valid: true, configured: !!entry, bundled,
      current: bundled || (!!entry && /^npx(?:\.cmd)?$/i.test(entry.command || '') && Array.isArray(entry.args) && entry.args.includes('-y') && entry.args.includes('olchipanel@latest')) };
  } catch (_) { return { file, exists: true, valid: false, configured: false, current: false }; }
}

function combineEntries(entries) {
  const configured = entries.filter(x => x.configured);
  const invalid = entries.filter(x => x.exists && !x.valid);
  return {
    configured: configured.length > 0,
    current: configured.some(x => x.current),
    bundled: configured.some(x => x.bundled),
    invalid: invalid.length > 0,
    files: entries.map(x => ({ file: x.file, exists: x.exists, valid: x.valid, configured: x.configured, current: x.current })),
  };
}

function commandPath(command, options) {
  const env = (options && options.env) || process.env;
  const dirs = String(env.PATH || env.Path || '').split(path.delimiter).filter(Boolean);
  const names = process.platform === 'win32'
    ? [command.replace(/\.cmd$/i, '') + '.cmd', command.replace(/\.cmd$/i, '') + '.exe', command.replace(/\.cmd$/i, '')]
    : [command];
  for (const dir of dirs) {
    for (const name of names) {
      const candidate = path.join(dir.replace(/^"|"$/g, ''), name);
      try { if (fs.statSync(candidate).isFile()) return candidate; } catch (e) {}
    }
  }
  return null;
}

function commandProbe(command, options, probeName) {
  if (options && options[probeName + 'Probe']) return options[probeName + 'Probe'];
  const executable = commandPath(command, options);
  if (!executable) return { available: false, version: '' };
  // Node 22 on Windows rejects direct spawnSync of .cmd with EINVAL. Presence
  // on PATH is the reliable read-only availability check; do not invoke a shell.
  if (process.platform === 'win32' && /\.cmd$/i.test(executable)) {
    return { available: true, version: '', path: executable };
  }
  try {
    const result = spawnSync(executable, ['--version'], {
      encoding: 'utf8', timeout: 3000, windowsHide: true,
      env: (options && options.env) || process.env,
    });
    return {
      available: result.status === 0,
      version: result.status === 0 ? String(result.stdout || '').trim() : '',
      path: executable,
    };
  } catch (e) {
    return { available: false, version: '' };
  }
}

function browserProbe(options) {
  if (options && options.browserProbe) return options.browserProbe;
  const env = (options && options.env) || process.env;
  const candidates = [];
  if (process.platform === 'win32') {
    const roots = [env.LOCALAPPDATA, env.ProgramFiles, env['ProgramFiles(x86)']].filter(Boolean);
    roots.forEach(root => {
      candidates.push(['Chrome', path.join(root, 'Google', 'Chrome', 'Application', 'chrome.exe')]);
      candidates.push(['Edge', path.join(root, 'Microsoft', 'Edge', 'Application', 'msedge.exe')]);
    });
  } else if (process.platform === 'darwin') {
    candidates.push(['Chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']);
    candidates.push(['Edge', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']);
    candidates.push(['Chromium', '/Applications/Chromium.app/Contents/MacOS/Chromium']);
  }
  for (const pair of candidates) {
    try { if (fs.statSync(pair[1]).isFile()) return { available: true, name: pair[0], path: pair[1] }; } catch (e) {}
  }
  for (const pair of [['Chrome', 'google-chrome'], ['Chromium', 'chromium'], ['Chromium', 'chromium-browser'], ['Edge', 'microsoft-edge']]) {
    const found = commandPath(pair[1], options);
    if (found) return { available: true, name: pair[0], path: found };
  }
  return { available: false, name: '', path: '' };
}

function viewerRecord(olchiHome) {
  const file = path.join(olchiHome, 'viewer.json');
  const text = readText(file);
  if (text === null) return { file, url: null, pid: null, recorded: false };
  try {
    const value = JSON.parse(text);
    const parsed = new URL(String(value.url || ''));
    if (!['127.0.0.1', 'localhost', '::1'].includes(parsed.hostname)) throw new Error('not_loopback');
    return { file, url: parsed.origin, pid: Number(value.pid) || null, recorded: true };
  } catch (e) {
    return { file, url: null, pid: null, recorded: true, invalid: true };
  }
}

function probeViewer(url, options) {
  if (options && options.viewerProbe) return Promise.resolve(options.viewerProbe);
  if (!url) return Promise.resolve({ live: false });
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => { if (!settled) { settled = true; resolve(value); } };
    try {
      const req = http.get(url + '/api/state', { timeout: 1200 }, (res) => {
        res.resume();
        finish({ live: res.statusCode === 200, status: res.statusCode });
      });
      req.on('error', () => finish({ live: false }));
      req.on('timeout', () => { req.destroy(); finish({ live: false }); });
    } catch (e) { finish({ live: false }); }
  });
}

async function inspect(options) {
  options = options || {};
  const home = options.home || os.homedir();
  const cwd = path.resolve(options.cwd || process.cwd());
  const olchiHome = options.olchiHome || process.env.OLCHIPANEL_HOME || path.join(home, '.olchipanel');
  const nodeVersion = String(options.nodeVersion || process.version);
  const nodeMajor = Number((/^v?(\d+)/.exec(nodeVersion) || [])[1] || 0);
  const npx = commandProbe(process.platform === 'win32' ? 'npx.cmd' : 'npx', options, 'npx');
  const npm = commandProbe(process.platform === 'win32' ? 'npm.cmd' : 'npm', options, 'npm');
  const browser = browserProbe(options);
  const configEnv = options.env || (options.home ? {} : process.env);
  const configs = {
    claude: combineEntries([jsonEntry(path.join(cwd, '.mcp.json')), jsonEntry(path.join(configEnv.CLAUDE_CONFIG_DIR || home, '.claude.json'))]),
    codex: combineEntries([codexEntry(path.join(configEnv.CODEX_HOME || path.join(home, '.codex'), 'config.toml'))]),
    cursor: combineEntries([jsonEntry(path.join(cwd, '.cursor', 'mcp.json'))]),
    antigravity: combineEntries([
      jsonEntry(path.join(home, '.gemini', 'config', 'mcp_config.json')),
      jsonEntry(path.join(home, '.gemini', 'antigravity-cli', 'mcp_config.json')),
      jsonEntry(path.join(cwd, '.agents', 'mcp_config.json')),
    ]),
  };
  const record = viewerRecord(olchiHome);
  const live = await probeViewer(record.url, options);
  let viewerPort = null;
  try { viewerPort = record.url ? Number(new URL(record.url).port) : null; } catch (e) {}
  const configuredAgents = Object.keys(configs).filter(key => configs[key].configured);
  const invalidConfigs = Object.keys(configs).filter(key => configs[key].invalid);
  const blockers = [];
  if (nodeMajor < 18) blockers.push('node_unsupported');
  const bundledRuntime = Object.values(configs).some(c => c.bundled);
  if (!npm.available && !bundledRuntime) blockers.push('npm_missing');
  if (!npx.available && !bundledRuntime) blockers.push('npx_missing');
  if (invalidConfigs.length) blockers.push('invalid_config');
  if (!configuredAgents.length) blockers.push('agent_not_configured');
  return {
    schema: 'olchipanel.doctor.v1', version: VERSION,
    platform: process.platform, arch: process.arch, cwd,
    node: { version: nodeVersion, major: nodeMajor, supported: nodeMajor >= 18 },
    npm, npx, browser, bundledRuntime,
    viewer: { recorded: record.recorded, invalid: !!record.invalid, url: record.url, port: viewerPort, pid: record.pid, live: !!live.live },
    configs, configuredAgents, invalidConfigs, blockers,
    ready: blockers.length === 0,
    prompt: '이 작업을 OlchiPanel로 추적해',
  };
}

function format(report) {
  const rows = [];
  const mark = value => value ? 'PASS' : 'FAIL';
  rows.push(`OlchiPanel doctor ${report.version}`);
  rows.push(`[${mark(report.node.supported)}] Node ${report.node.version} (requires >=18)`);
  rows.push(`[${report.bundledRuntime ? 'INFO' : mark(report.npm.available)}] npm${report.bundledRuntime ? ' (not required for installed MCP)' : report.npm.version ? ' ' + report.npm.version : ''}`);
  rows.push(`[${report.bundledRuntime ? 'INFO' : mark(report.npx.available)}] npx${report.bundledRuntime ? ' (not required for installed MCP)' : report.npx.version ? ' ' + report.npx.version : ''}`);
  rows.push(`[${report.viewer.live ? 'PASS' : 'INFO'}] viewer ${report.viewer.live ? 'live at ' + report.viewer.url : 'not running (starts on demand)'}`);
  rows.push(`[${report.browser.available ? 'PASS' : 'INFO'}] browser ${report.browser.available ? report.browser.name : 'dedicated app browser not found; default-browser fallback will be used'}`);
  const labels = { claude: 'Claude Code', codex: 'Codex', cursor: 'Cursor', antigravity: 'Antigravity' };
  Object.keys(labels).forEach((key) => {
    const value = report.configs[key];
    const state = value.invalid ? 'FAIL' : (value.current ? 'PASS' : (value.configured ? 'WARN' : 'INFO'));
    const detail = value.invalid ? 'config format is invalid' :
      (value.bundled ? 'installed MCP configured (connection not verified)' : value.current ? 'olchipanel@latest configured' : (value.configured ? 'OlchiPanel entry needs review' : 'not configured here'));
    rows.push(`[${state}] ${labels[key]}: ${detail}`);
  });
  rows.push('');
  rows.push(report.ready ? 'READY — restart your agent, then say:' : 'NEXT — configure one agent, restart it, then say:');
  rows.push(`  ${report.prompt}`);
  return rows.join('\n');
}

module.exports = { inspect, format, jsonEntry, codexEntry };
