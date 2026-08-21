'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8');
const viewer = fs.readFileSync(path.join(ROOT, 'src', 'viewer.js'), 'utf8');
const plan = fs.readFileSync(path.join(ROOT, 'public', 'plan.html'), 'utf8');
const icon = fs.readFileSync(path.join(ROOT, 'public', 'olchi.png'));
const icon32 = fs.readFileSync(path.join(ROOT, 'public', 'icons', 'olchi-32.png'));
const ico = fs.readFileSync(path.join(ROOT, 'public', 'icons', 'olchi-favicon-v3.ico'));

function pngRgba(buffer) {
  assert.deepStrictEqual([...buffer.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  assert.strictEqual(buffer[24], 8, 'taskbar PNGs must remain 8-bit');
  assert.strictEqual(buffer[25], 6, 'taskbar PNGs must remain RGBA');
  const chunks = [];
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') chunks.push(buffer.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
    if (type === 'IEND') break;
  }
  const raw = zlib.inflateSync(Buffer.concat(chunks));
  const stride = width * 4;
  const rgba = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const left = x >= 4 ? rgba[y * stride + x - 4] : 0;
      const up = y ? rgba[(y - 1) * stride + x] : 0;
      const upperLeft = y && x >= 4 ? rgba[(y - 1) * stride + x - 4] : 0;
      let value = row[x];
      if (filter === 1) value += left;
      else if (filter === 2) value += up;
      else if (filter === 3) value += Math.floor((left + up) / 2);
      else if (filter === 4) {
        const p = left + up - upperLeft;
        const pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - upperLeft);
        value += pa <= pb && pa <= pc ? left : (pb <= pc ? up : upperLeft);
      } else assert.strictEqual(filter, 0, `unsupported PNG filter ${filter}`);
      rgba[y * stride + x] = value & 255;
    }
  }
  return { width, height, rgba };
}

assert.doesNotMatch(html, /<header class="topbar"/, 'duplicate in-app title bar must stay removed');
assert.match(html, /class="rail-tools top-right"/, 'title-bar controls must remain available in the session rail');
for (const id of ['connStatus', 'helpBtn', 'langBtn', 'themeBtn']) {
  assert.match(html, new RegExp(`id="${id}"`), `${id} must remain in the UI`);
}
assert.match(html, /href="\/icons\/olchi-favicon-v3\.ico"/, 'Windows must get the high-contrast cache-busted ICO');
assert.match(html, /rel="shortcut icon"[^>]+olchi-favicon-v3\.ico/, 'Chromium app windows need one unambiguous taskbar icon');
assert.match(viewer, /src: '\/icons\/olchi-192\.png'/, 'PWA manifest must include a standard app-icon size');
assert.match(viewer, /src: '\/icons\/olchi-512\.png'/, 'PWA manifest must include a high-resolution app icon');
assert.match(viewer, /'\/icons\/olchi-favicon-v2\.ico'/, 'viewer must serve the Windows favicon');
assert.match(viewer, /'\/icons\/olchi-favicon-v3\.ico'/, 'viewer must serve the high-contrast Windows favicon');
assert.match(viewer, /browser-profile-icon-v3/, 'Chromium app profile must bypass the legacy taskbar-icon cache');
assert.match(html, /@media \(max-width:760px\)/, 'situation board must include the UI Core narrow layout');
assert.match(html, /body:not\(\.rail-closed\) #railTabs/, 'mobile rail must open as a drawer instead of squeezing content');
assert.match(html, /body\.rail-closed #railTabs > \.cap/, 'collapsed empty rail must not render vertical helper text');
assert.match(html, /html,body\{min-height:100%/, 'the document must grow beyond the viewport on tall plan boards');
assert.match(html, /\.pane\.pane-plan\{[^}]*padding:0;[^}]*min-height:0;[^}]*overflow:hidden/, 'plan pane must not inherit generic padding or minimum height');
assert.match(html, /\.pane\.pane-plan\.on\{display:flex;?\}/, 'plan pane flex layout must win over the generic active pane rule');
assert.match(html, /new ResizeObserver\(fitPlanFrame\)/, 'the embedded plan frame must track its content height');
assert.doesNotMatch(html, /#planFrame\{[^}]*min-height:60vh/, 'plan frame must not reserve an empty 60vh viewport');
assert.match(html, /e\.key === 'ArrowRight'/, 'tabs must support keyboard arrow navigation');
assert.match(html, /prefers-reduced-motion:reduce/, 'situation board must respect reduced motion');
assert.match(html, /\.memo-box:focus-visible\{[^}]*outline:2px solid var\(--brand\)/, 'memo editor must expose a visible keyboard focus ring');
assert.match(plan, /grid-template-columns:1fr/, 'plan columns must stack on narrow screens');
assert.match(plan, /grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/, 'desktop plan columns must fit without a hidden horizontal tail');
assert.doesNotMatch(plan, /#board\{[^}]*overflow-x:auto/, 'desktop plan board must not put a scrollbar halfway down the pane');
assert.match(plan, /if\(revealSelection&&sel\) sel\.scrollIntoView/, 'live refresh must not force the outer page back to the selected card');
assert.match(plan, /prefers-reduced-motion:reduce/, 'plan board must respect reduced motion');

assert.deepStrictEqual([...icon.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
assert.strictEqual(icon.readUInt32BE(16), 640, 'icon master must keep its Windows-safe size');
assert.strictEqual(icon.readUInt32BE(20), 640, 'icon master must keep its Windows-safe size');
assert.strictEqual(icon[25], 6, 'icon master must remain RGBA');
assert.strictEqual(icon32.readUInt32BE(16), 32, 'taskbar PNG width changed');
assert.strictEqual(icon32.readUInt32BE(20), 32, 'taskbar PNG height changed');
assert.deepStrictEqual([...ico.subarray(0, 4)], [0, 0, 1, 0], 'Windows favicon must remain a valid ICO');
const icoCount = ico.readUInt16LE(4);
assert(icoCount >= 7, 'Windows favicon must contain multiple resolutions');
for (let i = 0; i < icoCount; i++) {
  const entry = 6 + (i * 16);
  const byteLength = ico.readUInt32LE(entry + 8);
  const imageOffset = ico.readUInt32LE(entry + 12);
  assert(byteLength > 100, `ICO entry ${i} is suspiciously short`);
  assert(imageOffset + byteLength <= ico.length, `ICO entry ${i} exceeds the container`);
  assert.deepStrictEqual([...ico.subarray(imageOffset, imageOffset + 8)],
    [137, 80, 78, 71, 13, 10, 26, 10], `ICO entry ${i} must contain a PNG image`);
}

const decoded32 = pngRgba(icon32);
let black = 0, white = 0, nonOpaque = 0;
for (let i = 0; i < decoded32.rgba.length; i += 4) {
  const [r, g, b, a] = decoded32.rgba.subarray(i, i + 4);
  if (a !== 255) nonOpaque++;
  if (r < 24 && g < 24 && b < 24) black++;
  if (r > 224 && g > 224 && b > 224) white++;
}
assert.strictEqual(nonOpaque, 0, 'taskbar badge must use an opaque black background');
assert(black > 620, 'taskbar badge needs enough black background to read as a badge');
assert(white > 90, 'original Olchi line art must remain visibly white at 32px');

// Derived only from C:/Users/topli/Desktop/olchi.png
// source SHA-256: 148a90268b0ba9a7098baad7f66aff4c70eb0c5e280df48145fc59e5c5541534
console.log('UI SHELL OK: responsive UI Core and high-contrast multi-size taskbar icon ready');
