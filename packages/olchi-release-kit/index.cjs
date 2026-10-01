'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const yaml = require('js-yaml');

function validateConfig(config) {
  if (config.schema !== 'olchi-release.v1' || !/^[a-z][a-z0-9.-]+$/.test(config.productId || '')) throw new Error('Invalid product config');
  const p = config.publish;
  if (p?.provider === 'github') {
    if (![p.owner, p.repo].every(v => typeof v === 'string' && /^[\w.-]+$/.test(v))) throw new Error('Invalid GitHub destination');
    if (p.private || p.token) throw new Error('Client credentials are forbidden; use a public download feed');
  } else if (p?.provider === 'generic') {
    const u = new URL(p.url);
    if (u.protocol !== 'https:' || u.username || u.password || u.search || u.hash) throw new Error('Feed must be a public HTTPS URL without credentials');
  } else throw new Error('Choose github or generic publish provider');
  return config;
}

function inventory(directory, productId, version) {
  if (!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version)) throw new Error('Invalid version');
  const files = fs.readdirSync(directory).filter(n => /\.(exe|blockmap|yml)$/.test(n) && n !== 'builder-debug.yml').sort();
  if (!files.some(n => n.endsWith('.exe')) || !files.some(n => n.endsWith('.yml'))) throw new Error('Installer and update metadata are required');
  const artifacts = files.map(name => {
    if (!fs.lstatSync(path.join(directory, name)).isFile()) throw new Error('Artifact must be a regular file');
    const data = fs.readFileSync(path.join(directory, name));
    return {name, bytes: data.length, sha512: crypto.createHash('sha512').update(data).digest('base64')};
  });
  for (const name of files.filter(n => n.endsWith('.yml'))) {
    if (name === 'builder-debug.yml' || name === 'builder-effective-config.yaml') continue;
    const info = yaml.load(fs.readFileSync(path.join(directory, name), 'utf8'));
    if (info.version !== version || !Array.isArray(info.files) || !info.files.length) throw new Error('Update metadata version/files mismatch');
    for (const file of info.files) {
      const artifact = artifacts.find(a => a.name === file.url);
      if (!artifact || artifact.sha512 !== file.sha512 || (file.size != null && artifact.bytes !== file.size)) throw new Error('Update artifact checksum/size mismatch');
    }
  }
  return {schema:'olchi-release-artifacts.v1', productId, version, artifacts};
}

// An injected updater keeps this adapter reusable and testable without Electron.
function createUpdateService({updater, enabled, onState = () => {}, intervalMs = 6 * 60 * 60 * 1000}) {
  let state = {phase: enabled ? 'idle' : 'development'};
  let pending = null;
  let disposed = false;
  const listeners = [];
  const set = next => { state = Object.freeze({...next}); onState(state); };
  const listen = (event, fn) => { updater.on(event, fn); listeners.push([event, fn]); };
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = true;
  updater.allowDowngrade = false;
  updater.allowPrerelease = false;
  listen('checking-for-update', () => set({phase:'checking'}));
  listen('update-available', info => set({phase:'downloading', version:info.version}));
  listen('download-progress', info => set({phase:'downloading', percent:Math.max(0, Math.min(100, info.percent || 0))}));
  listen('update-not-available', () => set({phase:'current'}));
  listen('update-downloaded', info => set({phase:'ready', version:info.version}));
  listen('error', () => set({phase:'error', message:'업데이트를 확인하지 못했습니다. 다음 확인 때 다시 시도합니다.'}));
  function check() {
    if (!enabled || disposed || state.phase === 'ready') return Promise.resolve(state);
    if (pending) return pending;
    pending = Promise.resolve().then(() => updater.checkForUpdates()).then(async result => {
      if (result?.downloadPromise) await result.downloadPromise;
      return state;
    }).catch(() => { set({phase:'error', message:'업데이트를 확인하지 못했습니다. 다음 확인 때 다시 시도합니다.'}); return state; }).finally(() => {pending = null;});
    return pending;
  }
  const timer = enabled ? setInterval(check, intervalMs) : null;
  timer?.unref?.();
  return {check, getState: () => state,
    // Never launch an installer while Windows is ending its session.
    deferInstall: () => {updater.autoInstallOnAppQuit = false;},
    dispose: () => {disposed = true; clearInterval(timer); for (const [event, fn] of listeners) updater.removeListener(event, fn);}
  };
}
module.exports = {validateConfig, inventory, createUpdateService};
