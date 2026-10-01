'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');
const {createUpdateService, validateConfig, inventory} = require('../packages/olchi-release-kit');
const fs=require('node:fs'), os=require('node:os'), path=require('node:path'), crypto=require('node:crypto');
test('release verification rejects corrupted installers and mismatched versions', () => {
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'olchi-release-test-'));
  try {
    const data=Buffer.from('installer-fixture');
    fs.writeFileSync(path.join(directory,'App.exe'),data);
    fs.writeFileSync(path.join(directory,'latest.yml'), `version: 1.0.0\nfiles:\n  - url: App.exe\n    size: ${data.length}\n    sha512: ${crypto.createHash('sha512').update(data).digest('base64')}\n`);
    assert.equal(inventory(directory,'test-app','1.0.0').artifacts.length,2);
    assert.throws(()=>inventory(directory,'test-app','1.0.1'),/version/);
    fs.appendFileSync(path.join(directory,'App.exe'),'corruption');
    assert.throws(()=>inventory(directory,'test-app','1.0.0'),/checksum/);
  } finally { for (const name of fs.readdirSync(directory)) fs.unlinkSync(path.join(directory,name)); fs.rmdirSync(directory); }
});
test('two products use the same release contract, secrets and insecure feeds rejected', () => {
  for (const productId of ['olchipanel', 'second-app']) {
    assert.equal(validateConfig({schema:'olchi-release.v1', productId, publish:{provider:'generic', url:`https://downloads.example.com/${productId}/`}}).productId, productId);
  }
  for (const url of ['http://example.com', 'https://user:secret@example.com', 'https://example.com?token=secret']) {
    assert.throws(() => validateConfig({schema:'olchi-release.v1', productId:'test-app', publish:{provider:'generic',url}}));
  }
});
test('deduplicates checks/downloads, stages without forced quit, defers on shutdown', async () => {
  const updater = new EventEmitter();
  let calls = 0, finish;
  updater.checkForUpdates = async () => {calls++; return {downloadPromise:new Promise(resolve => {finish=resolve;})};};
  updater.quitAndInstall = () => assert.fail('Must never force a running app to quit');
  const service = createUpdateService({updater,enabled:true});
  const first = service.check();
  assert.equal(first, service.check());
  await new Promise(resolve => setImmediate(resolve));
  updater.emit('update-downloaded', {version:'0.8.3'});
  finish(); await first;
  await service.check();
  assert.equal(calls,1); assert.equal(service.getState().phase,'ready');
  service.deferInstall(); assert.equal(updater.autoInstallOnAppQuit,false);
  service.dispose(); assert.equal(updater.listenerCount('error'),0);
});
test('network/download failures are recoverable and development does not check', async () => {
  const updater = new EventEmitter(); let calls=0;
  updater.checkForUpdates = async () => {calls++; throw new Error('private token must not leak');};
  const dev = createUpdateService({updater,enabled:false}); await dev.check(); assert.equal(calls,0); dev.dispose();
  const service=createUpdateService({updater,enabled:true});
  await service.check(); assert.equal(service.getState().phase,'error');
  assert.ok(!JSON.stringify(service.getState()).includes('token'));
  await service.check(); assert.equal(calls,2); service.dispose();
});
