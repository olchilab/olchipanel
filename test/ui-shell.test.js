'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8');
const viewer = fs.readFileSync(path.join(ROOT, 'src', 'viewer.js'), 'utf8');
const plan = fs.readFileSync(path.join(ROOT, 'public', 'plan.html'), 'utf8');
const icon = fs.readFileSync(path.join(ROOT, 'public', 'olchi.png'));
const icon32 = fs.readFileSync(path.join(ROOT, 'public', 'icons', 'olchi-32.png'));
const ico = fs.readFileSync(path.join(ROOT, 'public', 'icons', 'olchi-favicon-v2.ico'));

assert.doesNotMatch(html, /<header class="topbar"/, 'duplicate in-app title bar must stay removed');
assert.match(html, /class="rail-tools top-right"/, 'title-bar controls must remain available in the session rail');
for (const id of ['connStatus', 'helpBtn', 'langBtn', 'themeBtn']) {
  assert.match(html, new RegExp(`id="${id}"`), `${id} must remain in the UI`);
}
assert.match(html, /href="\/icons\/olchi-favicon-v2\.ico"/, 'Windows must get the cache-busted multi-size ICO');
assert.match(html, /sizes="32x32" href="\/icons\/olchi-32\.png"/);
assert.match(html, /href="\/icons\/olchi-dark-32\.png" media="\(prefers-color-scheme: dark\)"/);
assert.match(viewer, /src: '\/icons\/olchi-192\.png'/, 'PWA manifest must include a standard app-icon size');
assert.match(viewer, /src: '\/icons\/olchi-512\.png'/, 'PWA manifest must include a high-resolution app icon');
assert.match(viewer, /'\/icons\/olchi-favicon-v2\.ico'/, 'viewer must serve the Windows favicon');
assert.match(html, /@media \(max-width:760px\)/, 'situation board must include the UI Core narrow layout');
assert.match(html, /body:not\(\.rail-closed\) #railTabs/, 'mobile rail must open as a drawer instead of squeezing content');
assert.match(html, /body\.rail-closed #railTabs > \.cap/, 'collapsed empty rail must not render vertical helper text');
assert.match(html, /e\.key === 'ArrowRight'/, 'tabs must support keyboard arrow navigation');
assert.match(html, /prefers-reduced-motion:reduce/, 'situation board must respect reduced motion');
assert.match(html, /\.memo-box:focus-visible\{[^}]*outline:2px solid var\(--brand\)/, 'memo editor must expose a visible keyboard focus ring');
assert.match(plan, /grid-template-columns:1fr/, 'plan columns must stack on narrow screens');
assert.match(plan, /prefers-reduced-motion:reduce/, 'plan board must respect reduced motion');

assert.deepStrictEqual([...icon.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
assert.strictEqual(icon.readUInt32BE(16), 640, 'transparent icon master must keep its Windows-safe padding');
assert.strictEqual(icon.readUInt32BE(20), 640, 'transparent icon master must keep its Windows-safe padding');
assert.strictEqual(icon[25], 6, 'transparent icon master must remain RGBA');
assert.strictEqual(icon32.readUInt32BE(16), 32, 'taskbar PNG width changed');
assert.strictEqual(icon32.readUInt32BE(20), 32, 'taskbar PNG height changed');
assert.deepStrictEqual([...ico.subarray(0, 4)], [0, 0, 1, 0], 'Windows favicon must remain a valid ICO');
assert(ico.readUInt16LE(4) >= 7, 'Windows favicon must contain multiple resolutions');

// Derived only from C:/Users/topli/Desktop/olchi.png
// source SHA-256: 148a90268b0ba9a7098baad7f66aff4c70eb0c5e280df48145fc59e5c5541534
console.log('UI SHELL OK: title bar removed; responsive UI Core and multi-size favicon ready');
