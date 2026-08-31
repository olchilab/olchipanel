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
const ico = fs.readFileSync(path.join(ROOT, 'public', 'icons', 'olchi-favicon-v4.ico'));

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
assert.match(html, /href="\/icons\/olchi-favicon-v4\.ico"/, 'Windows must get the source-faithful cache-busted ICO');
assert.match(html, /rel="shortcut icon"[^>]+olchi-favicon-v4\.ico/, 'Chromium app windows need one unambiguous taskbar icon');
assert.match(viewer, /src: '\/icons\/olchi-192\.png'/, 'PWA manifest must include a standard app-icon size');
assert.match(viewer, /src: '\/icons\/olchi-512\.png'/, 'PWA manifest must include a high-resolution app icon');
assert.match(viewer, /'\/icons\/olchi-favicon-v2\.ico'/, 'viewer must serve the Windows favicon');
assert.match(viewer, /'\/icons\/olchi-favicon-v4\.ico'/, 'viewer must serve the source-faithful Windows favicon');
assert.match(viewer, /browser-profile-icon-v4/, 'Chromium app profile must bypass the inverted taskbar-icon cache');
assert.match(viewer, /findInstalledWindowsAppShortcut/, 'Windows must reuse the installed PWA app identity');
assert.match(viewer, /'olchipanel\.lnk'/, 'Windows app lookup must target the OlchiPanel shortcut case-insensitively');
assert.match(html, /@media \(max-width:760px\)/, 'situation board must include the UI Core narrow layout');
assert.strictEqual((html.match(/data-pane="/g) || []).length, 5, 'primary navigation must stay consolidated to five tabs');
assert.doesNotMatch(html, /data-pane="(?:map|stack|changes|dec|deadends)"/, 'detail views must not return to the primary tab row');
assert.match(html, /data-view-group="situation"[\s\S]*data-view="map"[\s\S]*data-view="stack"/, 'Situation must group Map and Stack');
assert.match(html, /data-view-group="records"[\s\S]*data-view="changes"[\s\S]*data-view="dec"[\s\S]*data-view="deadends"/, 'Records must group Changes, Decisions, and Dead ends');
assert.match(html, /var legacyTabs = \{[\s\S]*map: \['situation', 'map'\][\s\S]*changes: \['records', 'changes'\]/, 'saved legacy tabs must migrate without losing the selected view');
assert.match(html, /document\.querySelectorAll\('\.top-tabs > \.tab'\)/, 'primary-tab behavior must not capture nested view tabs');
assert.match(html, /document\.querySelectorAll\('\[data-view-group\]'\)/, 'nested view groups must own their keyboard behavior');
assert.match(html, /id="mapTreeBtn"[\s\S]*id="mapGraphBtn"/, 'journey map must offer tree and graph views without adding another top-level tab');
assert.match(html, /id="graphViewport"[^>]+tabindex="0"/, 'interactive journey graph must be keyboard reachable');
assert.match(html, /id="graphSvg" role="group"/, 'journey SVG must expose its interactive node descendants as a group');
assert.match(html, /\.graph-empty\[hidden\]\{display:none;\}/, 'graph empty state must stay hidden when connected steps exist');
assert.match(html, /function autoLayout\(root\)/, 'journey tree data must produce deterministic graph nodes and edges');
assert.match(html, /function fitGraph\(\)/, 'journey graph must fit its camera to the available panel');
assert.match(html, /graphDrag = \{ type: 'node'/, 'journey nodes must support local position adjustment');
assert.match(html, /localStorage\.setItem\(key, JSON\.stringify\(positions\)\)/, 'graph positions must persist locally without mutating agent state');
assert.match(html, /graphViewport\.addEventListener\('wheel'/, 'journey graph must support pointer-centered zoom');
assert.match(html, /window\.addEventListener\('resize',[\s\S]*requestAnimationFrame\(fitGraph\)/, 'journey graph must refit when its responsive viewport changes');
assert.doesNotMatch(html, /@gravity-ui\/graph|react|GraphCanvas/, 'graph absorption must preserve OlchiPanel zero-dependency architecture');
assert.match(html, /body:not\(\.rail-closed\) #railTabs/, 'mobile rail must open as a drawer instead of squeezing content');
assert.match(html, /body\.rail-closed #railTabs > \.cap/, 'collapsed empty rail must not render vertical helper text');
assert.match(html, /root\.appendChild\(el\('div', 'rail-divider'\)\);[\s\S]*if \(idle\.length\)/, 'stable divider must be inserted before the folded idle area');
assert.match(html, /\.rail-divider\{[^}]*background:var\(--line\)/, 'session divider must be a standalone rail element');
assert.doesNotMatch(html, /\.idle-head\{[^}]*border-top/, 'idle-session header must not drag the rail divider between session rows');
assert.match(html, /if \(!touched\(s\)\) \{ idle\.push\(s\); return; \}/, 'idle membership must not depend on the selected session');
assert.doesNotMatch(html, /!touched\(s\) && s\.id !== current/, 'selecting an idle row must never move it above the divider');
assert.match(html, /html,body\{min-height:100%/, 'the document must grow beyond the viewport on tall plan boards');
assert.match(html, /\.pane\.pane-plan\{[^}]*padding:0;[^}]*min-height:0;[^}]*overflow:hidden/, 'plan pane must not inherit generic padding or minimum height');
assert.match(html, /\.pane\.pane-plan\.on\{display:flex;?\}/, 'plan pane flex layout must win over the generic active pane rule');
assert.match(html, /body\.plan-active \.workspace\{max-width:none;?\}/, 'plan tab must use the full OlchiPanel canvas width');
assert.match(html, /classList\.toggle\('plan-active', name === 'plan'\)/, 'full-width plan mode must follow the selected tab');
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
assert.strictEqual(icon.readUInt32BE(16), 512, 'icon master must keep its native downsample size');
assert.strictEqual(icon.readUInt32BE(20), 512, 'icon master must keep its native downsample size');
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
let darkNavy = 0, transparent = 0, white = 0;
for (let i = 0; i < decoded32.rgba.length; i += 4) {
  const [r, g, b, a] = decoded32.rgba.subarray(i, i + 4);
  if (a < 16) transparent++;
  if (a > 128 && r < 55 && g < 80 && b < 120 && b > r) darkNavy++;
  if (a > 128 && r > 224 && g > 224 && b > 224) white++;
}
assert(transparent > 380, 'original pale background must become genuinely transparent');
assert(darkNavy > 210, 'original dark navy cat must remain visible at 32px');
assert.strictEqual(white, 0, 'the cat must never be inverted to white again');


// Derived only from C:/Users/topli/Desktop/olchi.png
// source SHA-256: 148a90268b0ba9a7098baad7f66aff4c70eb0c5e280df48145fc59e5c5541534
console.log('UI SHELL OK: responsive UI Core and source-faithful transparent taskbar icon ready');
