'use strict';

const assert = require('assert');
const { execFile } = require('child_process');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');

const home = fs.mkdtempSync(path.join(os.tmpdir(), 'olchipanel-single-'));
process.env.OLCHIPANEL_HOME = home;
process.env.OLCHIPANEL_PORT = '0';
process.env.OLCHIPANEL_NO_UPDATE_CHECK = '1';

const viewer = require('../src/viewer');
const server = viewer.start();

function request(url, method, headers, body) {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? '' : JSON.stringify(body);
    const requestHeaders = Object.assign({}, headers || {});
    if (payload) {
      requestHeaders['Content-Type'] = 'application/json';
      requestHeaders['Content-Length'] = Buffer.byteLength(payload);
    }
    const req = http.request(url, { method: method || 'GET', headers: requestHeaders }, (res) => {
      let body = '';
      res.on('data', d => { body += d; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function connectEvents(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url + '/events', (res) => {
      res.once('data', () => resolve({ req, res }));
    });
    req.on('error', reject);
  });
}

function runOpenCommand() {
  return new Promise((resolve, reject) => {
    execFile(process.execPath, [path.join(__dirname, '..', 'bin', 'olchipanel.js'), 'open'], {
      env: { ...process.env, OLCHIPANEL_HOME: home, OLCHIPANEL_PORT: '0' },
      timeout: 5000,
    }, (err, stdout, stderr) => {
      if (err) return reject(new Error(`${err.message}\n${stderr}`));
      resolve(stdout);
    });
  });
}

async function run() {
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;

  const first = await request(url + '/api/window/claim', 'POST');
  const raced = await request(url + '/api/window/claim', 'POST');
  assert.strictEqual(first.status, 200);
  assert.strictEqual(first.body.open, true, 'first open command must win the window claim');
  assert.strictEqual(raced.body.open, false, 'a simultaneous open command must not launch another window');
  const forbidden = await request(url + '/api/window/claim', 'POST', { Origin: 'https://example.com' });
  assert.strictEqual(forbidden.status, 403, 'cross-origin pages must not claim a localhost window');

  const tokenA = 'window-primary-1234';
  const tokenB = 'window-duplicate-5678';
  const registered = await request(url + '/api/window/register', 'POST', {}, { token: tokenA });
  assert.strictEqual(registered.body.primary, true, 'the claimed app window must become the primary lease owner');
  assert.strictEqual(fs.existsSync(path.join(home, 'window.json')), true, 'the window lease must survive a viewer restart');
  const duplicate = await request(url + '/api/window/register', 'POST', {}, { token: tokenB });
  assert.strictEqual(duplicate.body.primary, false, 'a second app window must not replace a live owner');
  const beat = await request(url + '/api/window/heartbeat', 'POST', {}, { token: tokenA });
  assert.strictEqual(beat.body.primary, true, 'the owner must be able to renew its window lease');
  const wrongRelease = await request(url + '/api/window/release', 'POST', {}, { token: tokenB });
  assert.strictEqual(wrongRelease.body.released, false, 'a duplicate window must not release the primary lease');
  const cli = await runOpenCommand();
  assert.match(cli, /olchipanel already open/, 'the public open command must report and preserve the existing window');
  const concurrent = await Promise.all([runOpenCommand(), runOpenCommand(), runOpenCommand(), runOpenCommand()]);
  concurrent.forEach((output) => assert.match(output, /olchipanel already open/,
    'every concurrent agent open request must reuse the primary window'));

  const events = await connectEvents(url);
  const state = await request(url + '/api/state');
  const connected = await request(url + '/api/window/claim', 'POST');
  assert.strictEqual(state.body.windowOpen, true, 'the viewer must detect the connected panel window');
  assert.strictEqual(connected.body.open, false, 'an already connected panel must block another window');

  const released = await request(url + '/api/window/release', 'POST', {}, { token: tokenA });
  assert.strictEqual(released.body.released, true, 'the primary app window must release its own lease');
  assert.strictEqual(fs.existsSync(path.join(home, 'window.json')), false, 'an explicit close must clear the persisted lease');

  events.req.destroy();
  events.res.destroy();
  await new Promise(resolve => server.close(resolve));
  fs.rmSync(home, { recursive: true, force: true });
  console.log('SINGLE INSTANCE OK: one window claim survives races and live viewer connections');
}

run().catch((err) => {
  console.error('SINGLE INSTANCE FAIL:', err && err.stack || err);
  try { server.close(); } catch (e) {}
  try { fs.rmSync(home, { recursive: true, force: true }); } catch (e) {}
  process.exit(1);
});
