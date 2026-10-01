'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const state = require('./state');

// Machine-local choice: never turn a desktop-only preference into a browser
// fallback, even when an older agent config still says OLCHIPANEL_OPEN=tab.
function prefersDesktop(root = state.ROOT, env = process.env) {
  try {
    const value = JSON.parse(fs.readFileSync(path.join(root, 'preferences.json'), 'utf8'));
    if (value.windowMode === 'desktop') return true;
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error('OlchiPanel preferences.json could not be read: ' + error.message);
  }
  return env.OLCHIPANEL_OPEN === 'desktop';
}

function desktopCommand() {
  if (process.versions.electron) return { command: process.execPath, args: [] };
  const command = require('electron');
  if (typeof command !== 'string' || !fs.existsSync(command)) throw new Error('Electron executable is unavailable');
  return { command, args: [path.resolve(__dirname, '../desktop/main.cjs')] };
}

function openDesktop(url, options = {}) {
  const report = options.report || (error => console.error('OlchiPanel app could not open; browser fallback disabled: ' + error.message));
  try {
    const target = (options.resolve || desktopCommand)();
    const env = { ...process.env, OLCHIPANEL_OPEN: '0', OLCHIPANEL_PORT: new URL(url).port };
    delete env.ELECTRON_RUN_AS_NODE;
    const child = (options.spawn || spawn)(target.command, target.args, {
      detached: true, stdio: 'ignore', windowsHide: true, env,
    });
    child.on('error', report);
    child.unref();
    return true;
  } catch (error) { report(error); return false; }
}

module.exports = { prefersDesktop, openDesktop };
