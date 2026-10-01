'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');
const { app, BrowserWindow, dialog, session, net, powerMonitor, shell, Menu, Tray, nativeTheme } = require('electron');
const {createUpdateService} = require('../packages/olchi-release-kit');
const viewer = require('../src/viewer');
const product = require('../package.json');
const {renderTheme}=require('./theme-renderer.cjs');
const {attachActivity,readActivity}=require('./orca-activity.cjs');
const variant=process.env.OLCHIPANEL_DESIGN || 'studio';
if(!['studio','editorial'].includes(variant))throw new Error('Unknown comparison theme');
const windowTitle=variant==='studio'?'OlchiPanel':'OlchiPanel E3 — Editorial Desk';

const PANEL_ORIGIN = `http://127.0.0.1:${viewer.BASE_PORT}`;
const DEFAULT_BOUNDS = { width: 1440, height: 960 };
const MIN_BOUNDS = { width: 720, height: 620 };
const debug = (...values) => {
  if (process.env.OLCHIPANEL_E_DEBUG === '1') console.error('[OlchiPanel E]', ...values);
};

let panelWindow = null;
let panelTray = null;
let viewerServer = null;
let ownsViewer = false;
let quitting = false;
let saveTimer = null;
let updateService = null;
let setupRunning = false;

async function setupMcp(force = false) {
  if (process.platform !== 'win32' || !app.isPackaged || setupRunning || !panelWindow) return;
  const receipt = path.join(app.getPath('userData'), 'mcp-setup-v1.json');
  if (!force && fs.existsSync(receipt)) return;
  setupRunning = true;
  try {
    const result = await require('./windows-mcp-setup.cjs').runSetup({
      command: process.execPath,
      script: path.join(app.getAppPath(), 'bin', 'olchipanel.js'),
      show: options => dialog.showMessageBox(panelWindow, options),
    });
    if (['registered', 'deferred'].includes(result.status)) {
      fs.mkdirSync(path.dirname(receipt), { recursive: true });
      fs.writeFileSync(receipt, JSON.stringify({ status: result.status, at: new Date().toISOString() }));
    }
  } catch (error) {
    dialog.showErrorBox('MCP 설정 등록 실패', error.message);
  } finally { setupRunning = false; }
}

app.setName(windowTitle);
app.userAgentFallback = 'OlchiPanel/0.8.2';
app.setPath('userData', app.commandLine.getSwitchValue('user-data-dir') || path.join(app.getPath('appData'),'OlchiPanel-theme-'+variant));

function requestJson(url, timeout = 1500) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
      });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
  });
}

async function waitForViewer(attempts = 160) {
  let lastError = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await requestJson(`${PANEL_ORIGIN}/api/state`);
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
  throw lastError || new Error('OlchiPanel viewer did not start');
}

function ensureViewer() {
  debug('checking viewer', PANEL_ORIGIN);
  return requestJson(`${PANEL_ORIGIN}/api/state`).catch(() => {
    debug('starting owned viewer');
    viewerServer = viewer.start({
      suppressOpen: true,
      ignoreDiscovery: true,
      onListening(server) {
        viewerServer = server;
        ownsViewer = true;
        debug('viewer listening');
      },
    });
    return waitForViewer();
  });
}

function statePath() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function readBounds() {
  try {
    const saved = JSON.parse(fs.readFileSync(statePath(), 'utf8'));
    if ([saved.x, saved.y, saved.width, saved.height].every(Number.isFinite)
        && saved.width >= MIN_BOUNDS.width && saved.height >= MIN_BOUNDS.height) {
      return saved;
    }
  } catch (_) {}
  return DEFAULT_BOUNDS;
}

function writeBounds() {
  if (!panelWindow || panelWindow.isDestroyed()) return;
  const target = statePath();
  const temporary = `${target}.tmp`;
  try {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(temporary, JSON.stringify(panelWindow.getNormalBounds()), 'utf8');
    try { fs.renameSync(temporary, target); } catch (_) {
      fs.copyFileSync(temporary, target);
      fs.unlinkSync(temporary);
    }
  } catch (_) {}
}

function queueBoundsWrite() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(writeBounds, 250);
}

function focusPanel() {
  if (!panelWindow || panelWindow.isDestroyed()) {
    if (panelTray && app.isReady() && !quitting) createWindow();
    return;
  }
  if (panelWindow.isMinimized()) panelWindow.restore();
  panelWindow.show();
  panelWindow.focus();
}

function syncTrayIcon() {
  if (!panelTray) return;
  const name = nativeTheme.shouldUseDarkColors ? 'olchi-dark-32.png' : 'olchi-32.png';
  panelTray.setImage(path.join(__dirname, '..', 'public', 'icons', name));
}

function createTray() {
  if (process.platform !== 'win32' || panelTray) return;
  const icon = path.join(__dirname, '..', 'public', 'icons',
    nativeTheme.shouldUseDarkColors ? 'olchi-dark-32.png' : 'olchi-32.png');
  panelTray = new Tray(icon);
  panelTray.setToolTip('OlchiPanel — 실행 중');
  panelTray.setContextMenu(Menu.buildFromTemplate([
    { label: 'OlchiPanel 열기', click: focusPanel },
    { type: 'separator' },
    { label: '종료', click: () => app.quit() },
  ]));
  panelTray.on('double-click', focusPanel);
  nativeTheme.on('updated', syncTrayIcon);
}

function isPanelUrl(candidate) {
  try { return new URL(candidate).origin === PANEL_ORIGIN; } catch (_) { return false; }
}

function createWindow() {
  panelWindow = new BrowserWindow({
    ...readBounds(),
    minWidth: MIN_BOUNDS.width,
    minHeight: MIN_BOUNDS.height,
    title: windowTitle,
    icon: path.join(__dirname, '..', 'public', 'icons', 'olchi-512.png'),
    backgroundColor: variant==='studio'?'#242524':'#f8f4ec',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      devTools: true,
    },
  });

  if (process.platform === 'win32') {
    panelWindow.setMenu(Menu.buildFromTemplate([{ label: '설정', submenu: [
      { label: '에이전트 연결…', enabled: app.isPackaged, click: () => setupMcp(true) },
      { type: 'separator' }, { role: 'quit', label: '종료' },
    ] }]));
  }
  panelWindow.setMenuBarVisibility(false);
  panelWindow.on('page-title-updated', (event) => {
    event.preventDefault();
    panelWindow.setTitle(windowTitle);
  });
  panelWindow.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const target = new URL(url);
      if (['https:', 'http:', 'mailto:'].includes(target.protocol)) {
        shell.openExternal(target.href).catch(() => {});
      }
    } catch (error) { /* Invalid and non-web targets stay blocked. */ }
    return { action: 'deny' };
  });
  panelWindow.webContents.on('will-navigate', (event, url) => {
    if (!isPanelUrl(url)) event.preventDefault();
  });
  panelWindow.webContents.on('before-input-event', (event, input) => {
    const zoomKey = ['+', '-', '=', '0'].includes(input.key);
    if ((input.control || input.meta) && zoomKey) {
      event.preventDefault();
      panelWindow.webContents.setZoomFactor(1);
    }
  });
  panelWindow.webContents.setZoomFactor(1);
  panelWindow.webContents.setVisualZoomLevelLimits(1, 1).catch(() => {});

  panelWindow.once('ready-to-show', () => {
    panelWindow.show();
    setupMcp(process.argv.includes('--setup-mcp'));
  });
  panelWindow.on('query-session-end', () => updateService?.deferInstall());
  panelWindow.on('session-end', () => updateService?.deferInstall());
  panelWindow.on('resize', queueBoundsWrite);
  panelWindow.on('move', queueBoundsWrite);
  panelWindow.on('close', (event) => {
    writeBounds();
    if (!quitting && panelTray) {
      event.preventDefault();
      panelWindow.hide();
    }
  });
  panelWindow.on('closed', () => { panelWindow = null; });
  panelWindow.loadURL(PANEL_ORIGIN);
}

function closeOwnedViewer() {
  if (!ownsViewer || !viewerServer || !viewerServer.listening) return;
  ownsViewer = false;
  try { viewerServer.close(); } catch (_) {}
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
debug('boot', { hasSingleInstanceLock });
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    focusPanel();
    if (argv.includes('--setup-mcp')) setupMcp(true);
  });
  app.whenReady().then(async () => {
    debug('app ready');
    try {
      const state = await ensureViewer();
      debug('viewer ready', state.version);
      if (state.version !== product.version) {
        throw new Error(`viewer ${state.version || 'unknown'} / app ${product.version}`);
      }
      session.defaultSession.protocol.handle('http', async (request) => {
        const url = new URL(request.url);
        if (url.origin === PANEL_ORIGIN && url.pathname === '/api/desktop-update') {
          return new Response(JSON.stringify(updateService?.getState() || {phase:'development'}), {headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
        }
        if(variant==='studio'&&url.origin===PANEL_ORIGIN&&url.pathname==='/api/state'){
          const [state,activity]=await Promise.all([requestJson(request.url),readActivity()]);
          state.sessions=attachActivity(state.sessions||[],activity);
          return new Response(JSON.stringify(state),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
        }
        if (url.origin === PANEL_ORIGIN && ['/', '/index.html', '/plan', '/plans', '/plan.html'].includes(url.pathname)) {
          try {
            return new Response(renderTheme(variant,url.pathname.startsWith('/plan')?'plan':'index'), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
          } catch (error) { console.error('Theme render failed',error); throw error; }
        }
        return net.fetch(request, { bypassCustomProtocolHandlers: true });
      });
      createWindow();
      createTray();
      if (app.isPackaged) {
        updateService = createUpdateService({updater: require('electron-updater').autoUpdater, enabled:true,
          onState: state => debug('update', state)});
        powerMonitor.on('shutdown', () => updateService.deferInstall());
        updateService.check();
      }
    } catch (error) {
      dialog.showErrorBox('OlchiPanel E 시작 실패', error.message);
      app.quit();
    }
  });
}

app.on('activate', focusPanel);

app.on('before-quit', () => {
  if (quitting) return;
  quitting = true;
  clearTimeout(saveTimer);
  writeBounds();
  nativeTheme.off('updated', syncTrayIcon);
  panelTray?.destroy();
  panelTray = null;
  closeOwnedViewer();
});

app.on('window-all-closed', () => { if (!panelTray) app.quit(); });
process.on('SIGINT', () => app.quit());
