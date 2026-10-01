'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pkg = require('../package.json');
const main = fs.readFileSync(path.join(root, 'desktop', 'main.cjs'), 'utf8');
const viewer = fs.readFileSync(path.join(root, 'src', 'viewer.js'), 'utf8');

assert.strictEqual(pkg.scripts.e, 'electron desktop/main.cjs');
assert.strictEqual(pkg.devDependencies.electron, '44.1.0');
assert.match(main, /requestSingleInstanceLock\(\)/, 'Electron app must reject duplicate instances');
assert.match(main, /second-instance/, 'second launch must focus the existing window');
assert.match(main, /nodeIntegration:\s*false/);
assert.match(main, /contextIsolation:\s*true/);
assert.match(main, /sandbox:\s*true/);
assert.match(main, /autoHideMenuBar:\s*true/);
assert.match(main, /setTitle\(windowTitle\)/);
assert.match(main, /variant==='studio'\?'OlchiPanel'/);
assert.match(main, /setWindowOpenHandler/);
assert.match(main, /shell\.openExternal\(target\.href\)/);
assert.match(main, /return \{ action: 'deny' \}/);
assert.match(main, /will-navigate/);
assert.match(main, /viewer\.start\(\{[\s\S]*suppressOpen:\s*true/, 'Electron must not spawn a PWA/browser window');
assert.match(main, /ignoreDiscovery:\s*true/, 'Electron must not wait on a stale discovery record');
assert.match(main, /onListening\(server\)/, 'Electron must only claim a viewer it actually started');
assert.match(viewer, /opts && opts\.suppressOpen/, 'viewer must honor the native-shell no-browser override');
assert.match(main, /state\.version !== product\.version/, 'shell must reject a stale viewer');
assert.match(main, /app\.getPath\('userData'\)/, 'window state belongs outside the source tree');
assert.match(main, /setZoomFactor\(1\)/, 'page zoom must stay at 100%');
assert.match(main, /setVisualZoomLevelLimits\(1, 1\)/);
assert.doesNotMatch(main, /exec\(|spawn\(|taskkill|Stop-Process/, 'shell must not kill or spawn broad external processes');

console.log('electron-shell PASS');
