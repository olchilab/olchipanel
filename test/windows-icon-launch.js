'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'olchipanel-pwa-shortcut-'));
process.env.OLCHIPANEL_NO_UPDATE_CHECK = '1';
const { findInstalledWindowsAppShortcut } = require('../src/viewer');

const appData = path.join(root, 'AppData', 'Roaming');
const nested = path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Chrome Apps');
const shortcut = path.join(nested, 'OlchiPanel.lnk');

try {
  fs.mkdirSync(nested, { recursive: true });
  fs.writeFileSync(shortcut, 'fixture');
  assert.strictEqual(
    findInstalledWindowsAppShortcut({ APPDATA: appData, USERPROFILE: path.join(root, 'User') }),
    shortcut,
    'installed PWA shortcut must win over generic browser app mode',
  );
  assert.strictEqual(
    findInstalledWindowsAppShortcut({ APPDATA: path.join(root, 'missing') }),
    null,
    'missing PWA shortcut must preserve the portable browser fallback',
  );
  console.log('WINDOWS ICON LAUNCH OK: installed OlchiPanel PWA shortcut is preferred');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
