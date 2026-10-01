'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'public', 'index.html'), 'utf8');
const viewer = fs.readFileSync(path.join(ROOT, 'src', 'viewer.js'), 'utf8');
const doctor = fs.readFileSync(path.join(ROOT, 'src', 'doctor.js'), 'utf8');
const plan = fs.readFileSync(path.join(ROOT, 'public', 'plan.html'), 'utf8');
const icon = fs.readFileSync(path.join(ROOT, 'public', 'olchi.png'));
const icon32 = fs.readFileSync(path.join(ROOT, 'public', 'icons', 'olchi-32.png'));
const ico = fs.readFileSync(path.join(ROOT, 'public', 'icons', 'olchi-favicon-v4.ico'));
const darkIcon32 = fs.readFileSync(path.join(ROOT, 'public', 'icons', 'olchi-dark-32.png'));
const darkIco = fs.readFileSync(path.join(ROOT, 'public', 'icons', 'olchi-favicon-dark-v1.ico'));

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
for (const id of ['helpBtn', 'langBtn', 'themeBtn']) {
  assert.match(html, new RegExp(`id="${id}"`), `${id} must remain in the UI`);
}
assert.match(html, /id="favicon"[^>]+href="\/icons\/olchi-favicon-v4\.ico"/, 'Windows must start with the source-faithful cache-busted ICO');
assert.match(html, /rel="shortcut icon"[^>]+olchi-favicon-v4\.ico/, 'Chromium app windows need one unambiguous taskbar icon');
assert.match(html, /faviconHref = t === 'dark'[\s\S]*olchi-favicon-dark-v1\.ico[\s\S]*olchi-favicon-v4\.ico/, 'browser chrome favicon must follow the selected light or dark theme');
assert.doesNotMatch(viewer, /display_override:[^\n]*window-controls-overlay/, 'installed PWA must not expose the browser-owned titlebar hide/show control');
assert.doesNotMatch(html, /class="window-brand"|windowBrandIcon|display-mode:window-controls-overlay/, 'removed window overlay must leave no second layout in the document');
assert.match(viewer, /display: 'standalone'/, 'installed desktop PWA must retain one stable standalone layout');
assert.match(viewer, /theme_color: '#12202f'/, 'manifest titlebar color must remain coordinated with the dark panel canvas');
assert.match(viewer, /src: '\/icons\/olchi-192\.png'/, 'PWA manifest must include a standard app-icon size');
assert.match(viewer, /src: '\/icons\/olchi-512\.png'/, 'PWA manifest must include a high-resolution app icon');
assert.match(viewer, /'\/icons\/olchi-favicon-v2\.ico'/, 'viewer must serve the Windows favicon');
assert.match(viewer, /'\/icons\/olchi-favicon-v4\.ico'/, 'viewer must serve the source-faithful Windows favicon');
assert.match(viewer, /'\/icons\/olchi-favicon-dark-v1\.ico'/, 'viewer must serve the white dark-chrome favicon');
assert.match(viewer, /browser-profile-icon-v4/, 'Chromium app profile must bypass the inverted taskbar-icon cache');
assert.match(viewer, /findInstalledWindowsAppShortcut/, 'Windows must reuse the installed PWA app identity');
assert.match(viewer, /'olchipanel\.lnk'/, 'Windows app lookup must target the OlchiPanel shortcut case-insensitively');
assert.match(html, /@media \(max-width:760px\)/, 'situation board must include the UI Core narrow layout');
assert.match(html, /id="activation"[^>]+role="tabpanel"/, 'zero-session tabs must expose a real first-success workflow');
assert.match(html, /var AGENT_SETUP = \{[\s\S]*claude:[\s\S]*codex:[\s\S]*cursor:[\s\S]*antigravity:/,
  'first success must offer all four target MCP agents');
assert.match(html, /fetch\('\/api\/doctor'\)/, 'first-success UI must use live read-only diagnostics');
assert.match(html, /var firstRun = !current && \['situation','needs','records'\]/,
  'empty Situation, Requests, and Records tabs must share the actionable first-success surface');
assert.match(viewer, /url === '\/api\/doctor'/, 'viewer must serve the diagnostics used by first success');
assert.match(doctor, /Never writes agent configuration/, 'diagnostics must declare the read-only settings boundary');
assert.match(doctor, /\.gemini', 'config', 'mcp_config\.json'/, 'doctor must inspect the official Antigravity MCP config path');
assert.doesNotMatch(html, /class="resume-bar"|id="resumebar"/, 'ended sessions must not push content down with a resume banner');
assert.match(html, /var resumeButton = el\('button', 'resume-trigger', T\('resumeAction'\)\)[\s\S]*st\.appendChild\(resumeButton\)/,
  'ended sessions must expose one compact Resume action in the metadata row');
assert.match(html, /<dialog class="resume-dialog"[\s\S]*id="resumePromptCopy"[\s\S]*id="resumeArchive"/,
  'Resume details and secondary actions must stay in an on-demand app dialog');
assert.match(html, /resumeBody: '이 프로젝트에서 사용하는 에이전트 앱을 열고/,
  'Korean resume guidance must be app-first rather than CLI-first');
assert.strictEqual((html.match(/data-pane="/g) || []).length, 6, 'five work views plus shared data analysis must be present in the app');
assert.doesNotMatch(html, /class="tabs top-tabs"/, 'the retired horizontal primary-tab row must not return');
assert.match(html, /class="rail-view-tabs"[^>]+aria-orientation="vertical"[\s\S]*data-pane="situation"[\s\S]*data-pane="plan"[\s\S]*data-pane="needs"[\s\S]*data-pane="records"/, 'session views must live in the vertical rail');
assert.match(html, /class="rail-view-nav rail-common-nav"[\s\S]*aria-orientation="vertical"[\s\S]*id="tabMemo"[^>]+data-pane="memo"/, 'common Note must live in the sidebar common navigation');
assert.doesNotMatch(html, /class="workspace-top-nav"/, 'Note must not remain above the workspace');
assert.match(html, /tabMemo: '공통 노트'/, 'the common note must state its shared scope');
assert.doesNotMatch(html, /data-pane="(?:map|stack|changes|dec|deadends)"/, 'detail views must not return to the primary tab row');
assert.match(html, /data-view-group="situation"[\s\S]*data-view="tree"[\s\S]*data-view="graph"[\s\S]*data-view="stack"/, 'Situation must expose Tree, Graph, and Stack in one tab row');
assert.match(html, /data-view-group="records"[\s\S]*data-view="changes"[\s\S]*data-view="dec"[\s\S]*data-view="deadends"/, 'Records must group Changes, Decisions, and Dead ends');
assert.match(html, /var legacyTabs = \{[\s\S]*map: \['situation', 'map'\][\s\S]*changes: \['records', 'changes'\]/, 'saved legacy tabs must migrate without losing the selected view');
assert.match(html, /document\.querySelectorAll\('\.app-view-tab'\)/, 'primary-view behavior must cover vertical session views and the sidebar Note tab');
assert.match(html, /document\.querySelectorAll\('\[data-view-group\]'\)/, 'nested view groups must own their keyboard behavior');
assert.match(html, /id="mapTreeBtn"[\s\S]*id="mapGraphBtn"/, 'journey map must offer tree and graph views without adding another top-level tab');
assert.match(html, /id="graphViewport"[^>]+tabindex="0"/, 'interactive journey graph must be keyboard reachable');
assert.match(html, /id="graphSvg" role="group"/, 'journey SVG must expose its interactive node descendants as a group');
assert.match(html, /\.graph-empty\[hidden\]\{display:none;\}/, 'graph empty state must stay hidden when connected steps exist');
assert.match(html, /function autoLayout\(root\)/, 'journey tree data must produce deterministic graph nodes and edges');
assert.match(html, /olchipanel\.graph\.layout\.v8\.['"]? \+ graphLayoutMode\(\)/, 'revised workflow geometry must use separate coordinates from the older graph');
assert.match(html, /graphViewportSize=key;requestAnimationFrame\(initialGraphView\)/,
  'viewport resize must preserve the readable current-position fallback');
assert.match(html, /class': 'graph-node-hit'/, 'journey nodes must keep a full invisible interaction target');
assert.match(html, /\.graph-node-hit\{fill:var\(--graph-bg\); stroke:var\(--graph-line\)/, 'journey task boundaries must remain visible without hover');
assert.match(html, /'text-anchor': 'start', 'class': 'graph-node-label'/, 'journey task names must be the left-aligned primary information');
// Routing geometry (including compact rails and reversed drags) is exercised in graph-layout.test.js.
assert.match(html, /graphEdgePath\(edge.source, edge.target, graphModel.compact, edge.kind\)/, 'rendered workflow and detail edges must use their verified routes');
assert.doesNotMatch(html, /\.graph-node rect\{[^}]*drop-shadow/, 'journey nodes must not return to repeated shadow cards');
assert.match(html, /function fitGraph\(\)/, 'journey graph must fit its camera to the available panel');
assert.match(html, /graphDrag = \{ type: 'node'/, 'journey nodes must support local position adjustment');
assert.match(html, /localStorage\.setItem\(key, JSON\.stringify\(positions\)\)/, 'graph positions must persist locally without mutating agent state');
assert.match(html, /graphViewport\.addEventListener\('wheel'/, 'journey graph must support pointer-centered zoom');
assert.match(html, /window\.addEventListener\('resize',[\s\S]*requestAnimationFrame\(initialGraphView\)/, 'workflow must refit or refocus when its viewport changes');
assert.doesNotMatch(html, /@gravity-ui\/graph|react|GraphCanvas/, 'graph absorption must preserve OlchiPanel zero-dependency architecture');
assert.match(html, /body:not\(\.rail-closed\) \.rail-drawer/, 'mobile rail must open sessions and navigation as one drawer');
assert.match(html, /body\.rail-closed #railTabs > \.cap/, 'collapsed empty rail must not render vertical helper text');
assert.match(html, /root\.appendChild\(el\('div', 'rail-divider'\)\);[\s\S]*if \(idle\.length\)/, 'stable divider must be inserted before the folded idle area');
assert.match(html, /\.rail-divider\{[^}]*background:var\(--line\)/, 'session divider must be a standalone rail element');
assert.doesNotMatch(html, /\.idle-head\{[^}]*border-top/, 'idle-session header must not drag the rail divider between session rows');
assert.match(html, /if \(!touched\(s\)\) \{ idle\.push\(s\); return; \}/, 'idle membership must not depend on the selected session');
assert.match(html, /sessionStorage\.getItem\('olchipanel\.window\.token'\)/, 'the app window must keep a logical identity across reloads');
assert.match(html, /\/api\/window\/heartbeat/, 'the primary app window must renew a server-side lease');
assert.match(html, /if \(!result\.primary\)/, 'a duplicate app window must not become another live panel');
assert.doesNotMatch(html, /!touched\(s\) && s\.id !== current/, 'selecting an idle row must never move it above the divider');
assert.match(html, /html,body\{min-height:100%/, 'the shell must retain a full-height document baseline');
assert.match(html, /\.pane\.pane-plan\{[^}]*padding:0;[^}]*min-height:0;[^}]*overflow:hidden/, 'plan pane must not inherit generic padding or minimum height');
assert.match(html, /\.workspace > \.pane\.pane-plan\.on\{[^}]*display:flex;[^}]*overflow:hidden/, 'plan pane flex layout and internal scroll ownership must win over the generic active pane rule');
assert.match(html, /body\.plan-active \.workspace\{[^}]*max-width:none/, 'plan tab must use the full OlchiPanel canvas width');
assert.match(html, /\.workspace\{[^}]*height:100dvh;[^}]*overflow:hidden;[^}]*display:flex;[^}]*flex-direction:column/, 'the app workspace must keep one viewport-height shell across tabs');
assert.match(html, /\.workspace > \.pane\.on,\s*\.workspace > \.activation\.on\{[^}]*flex:1 1 auto;[^}]*min-height:0;[^}]*overflow:auto/, 'all active top-level panes, including first-run guidance, must fill the shell and own dense-content scrolling');
assert.match(html, /body\.plan-active \.workspace\{[^}]*min-height:100vh;[^}]*display:flex;[^}]*flex-direction:column/, 'plan workspace must fill the outer app height');
assert.match(html, /body\.plan-active \.pane\.pane-plan\{[^}]*flex:1 1 auto/, 'plan pane must consume the remaining workspace height');
assert.doesNotMatch(html, /body\.plan-active \.goalbar[^}]*display:none/, 'plan tab must retain the shared goal heading');
assert.match(html, /\.stamp:empty\{display:none;\}/, 'removed session metadata must not reserve an empty row');
assert.match(html, /body\.note-active \.goalbar,body\.note-active \.stamp\{display:none;\}/, 'common Note must not inherit an unrelated session summary');
assert.match(html, /body\.note-active \.pane#memo\{[^}]*flex:1 1 auto;[^}]*min-height:0/, 'common Note pane must consume the remaining app height');
assert.match(html, /classList\.toggle\('plan-active', name === 'plan'\)/, 'full-width plan mode must follow the selected tab');
assert.match(html, /postMessage\(\{ type: 'olchipanel-theme', theme: t \}, window\.location\.origin\)/, 'outer theme changes must reach the embedded Plan');
assert.match(html, /new ResizeObserver\(fitPlanFrame\)/, 'the embedded plan frame must track its content height');
const fitPlanSource=html.match(/function fitPlanFrame\(\)\{([\s\S]*?)\n  \}/)[1];
for(const paneHeight of [220,410,720]){
  const frame={contentDocument:{body:{}},parentElement:{clientHeight:paneHeight},style:{}};
  new Function('document','getComputedStyle',fitPlanSource)({getElementById:()=>frame},()=>({paddingTop:'16px',paddingBottom:'16px'}));
  assert.equal(frame.style.height,(paneHeight-32)+'px','Plan must use its container content height, including short windows');
}
assert.doesNotMatch(html, /Math\.max\(contentHeight, availableHeight/, 'dense plan content must scroll inside the board instead of extending the shell');
assert.match(plan, /body\.embed\{[^}]*height:100%;[^}]*min-height:0;[^}]*overflow:hidden/, 'embedded Plan must stay inside the iframe viewport');
assert.match(plan, /body\.embed #board\{[^}]*min-height:0;[^}]*overflow:auto/, 'embedded Plan board must own dense-content scrolling');
assert.match(html, /function syncPlanRail\(name\)[\s\S]*window\.innerWidth > 760[\s\S]*window\.innerWidth <= 1100[\s\S]*setRailClosed\(true, false\)/, 'medium desktop Plan must reclaim the rail width without overwriting the saved rail choice');
assert.match(html, /syncPlanRail\(name\)/, 'Plan compact-rail geometry must follow the active tab');
assert.doesNotMatch(html, /#planFrame\{[^}]*min-height:60vh/, 'plan frame must not reserve an empty 60vh viewport');
assert.match(html, /e\.key === 'ArrowDown'[\s\S]*e\.key === 'ArrowUp'/, 'vertical rail views must support vertical keyboard navigation');
assert.match(html, /var COMMON_NOTE_SCOPE = 'common'/, 'Note storage must use one session-independent scope');
assert.doesNotMatch(html, /memoLoadedFor = current/, 'changing the selected session must not swap the common Note');
assert.match(html, /prefers-reduced-motion:reduce/, 'situation board must respect reduced motion');
assert.match(html, /\.memo-title:focus-visible,\.memo-content:focus-visible\{[^}]*box-shadow:inset 0 0 0 2px var\(--brand\)/, 'memo title and editor must expose a visible keyboard focus ring');
assert.match(html, /class="memo-layout"[\s\S]*id="memoTitleInput"[\s\S]*id="memoContent"[\s\S]*id="memoList"/, 'memo must combine a titled editor with a separate note list');
assert.match(html, /id="memoDocTabs"[^>]+role="tablist"[\s\S]*id="memoDocTabScroll"[\s\S]*id="memoDocTabAdd"/, 'Note must expose a flat internal document-tab strip');
assert.match(html, /var MEMO_TABS_KEY = 'olchipanel\.memo\.tabs\.v1'[\s\S]*localStorage\.setItem\(MEMO_TABS_KEY[\s\S]*function memoRestoreTabs\(\)/, 'open Note tabs and the active tab must restore as local UI state');
assert.match(html, /function memoSaveTabs\(\)\{[\s\S]*if\(memoLoadedFor!==COMMON_NOTE_SCOPE\)return/, 'empty Note-tab state must not overwrite restoration before the notebook loads');
assert.match(html, /function memoCloseTab\(id\)[\s\S]*memoTabs\.splice\(index,1\)[\s\S]*memoSyncEditor\(\)/, 'closing a Note tab must remove only the open view');
assert.doesNotMatch(html, /function memoCloseTab\(id\)[\s\S]{0,500}(?:deleteMemo|memoDoc\.notes\s*=)/, 'closing a Note tab must never delete the note');
assert.match(html, /e\.key==='ArrowLeft'[\s\S]*e\.key==='ArrowRight'[\s\S]*e\.key==='Home'[\s\S]*e\.key==='End'/, 'Note tabs must support standard horizontal keyboard navigation');
assert.match(html, /id="memoBlock"[\s\S]*id="memoBold"[\s\S]*id="memoUnderline"[\s\S]*id="memoCheck"[\s\S]*id="memoLink"/, 'memo toolbar must expose the compact Notion-like block and inline controls');
assert.match(html, /grid-template-columns:minmax\(0,1fr\) 260px/, 'memo list must stay beside the editor when effective viewport width allows');
assert.match(html, /#memo\{container-type:inline-size;\}/, 'Note layout must respond to its usable pane width rather than the outer window alone');
assert.match(html, /#memo\.on\{[^}]*display:flex;[^}]*flex-direction:column;[^}]*overflow:hidden/, 'active Note must pass its full pane height to the editor layout without adding an outer scroll owner');
assert.match(html, /\.memo-layout\{[^}]*flex:1 1 auto;[^}]*min-height:0/, 'Note editor and page list must stretch through the available pane height');
assert.match(html, /@container \(max-width:840px\)\{\s*\.memo-layout\{grid-template-columns:minmax\(0,1fr\) 170px/, 'narrow desktop Note must preserve editor height with a slim side list');
assert.match(html, /@container \(max-width:840px\)\{[\s\S]*\.memo-list\{[^}]*flex-direction:column;[^}]*max-height:none/, 'narrow desktop Note must retain a full-height vertical page tree');
assert.match(html, /@media \(max-width:760px\)[\s\S]*\.memo-layout\{grid-template-columns:1fr/, 'memo must recompose rather than wrap incidentally under display scaling');
assert.match(html, /id="memoSearch"[\s\S]*function toggleMemoPin[\s\S]*function moveMemo/, 'memo pages must support search, pinning, and stable manual ordering');
assert.match(html, /id="memoSlash"[\s\S]*function memoSlashTriggered[\s\S]*function renderMemoSlash/, 'memo editor must expose a slash-command entry point without an external editor dependency');
assert.doesNotMatch(html, /id="memoBreadcrumb"/, 'Note title must not repeat in a breadcrumb row');
assert.match(html, /id="memoDocTabScroll"[\s\S]*id="memoTitleInput"/, 'title editing belongs in the tab strip');
assert.match(html, /id="memoBlockControls"[\s\S]*id="memoBlockDrag"[^>]+draggable="true"/, 'Note keeps explicit block movement controls');
assert.match(html, /function renderBranch\(parentId,depth,seen\)[\s\S]*memo-tree-toggle[\s\S]*createMemoPage\(note\.id\)/, 'Note list must render an expandable parent-child page tree');
assert.match(html, /memo-row-menu[\s\S]*memo-row-actions\.open/, 'page actions must open from one compact row menu instead of covering the page title');
assert.match(html, /parentId:note\.parentId\|\|null, collapsed:note\.collapsed===true/, 'Note UI must preserve the v4 tree fields returned by storage');
assert.match(html, /function memoMoveBlock\(delta\)[\s\S]*memoDraggedBlock[\s\S]*addEventListener\('dragover'/, 'Note blocks must move with buttons, keyboard, and drag without a new editor dependency');
assert.match(html, /\{key:'page',label:T\('memoPage'\),handlesSlash:true,run:memoCreateLinkedPage\}/,
  'the slash Page command must replace its trigger through the linked-page flow');
assert.match(html, /function memoCreateLinkedPage\(\)[\s\S]*block\.appendChild\(memoPageLinkElement\(child\)\)[\s\S]*memoUpdateFromEditor\(\)[\s\S]*memoOpenTab\(child\.id\)/,
  'slash Page must save a clickable child-page block in the parent before opening the child');
assert.match(html, /classList\.contains\('memo-page-link'\)[\s\S]*data-note-id/,
  'the note sanitizer must preserve internal page-link identity');
assert.match(html, /plain\.textContent\.trim\(\)!=='\/'[\s\S]*parent\.html=memoClean\(paragraph\.outerHTML\)/,
  'loading Notes must repair the known orphan slash left by the old Page command');
assert.match(html, /closest\('\.memo-page-link'\)[\s\S]*selectMemo\(pageLink\.dataset\.noteId\)/,
  'clicking an internal page link must open that page');
assert.match(html, /memoSmall: '작은 글씨', memoNormal: '중간 글씨', memoLarge: '큰 글씨'/,
  'the text-size menu must use concrete human-readable size labels');
assert.match(html, /function memoUpdateFormatControls\(\)[\s\S]*memoSize'\)\.value=memoCurrentFontSize\(\)[\s\S]*selectionchange[\s\S]*memoUpdateFormatControls\(\)/,
  'the text-size menu must reflect the actual format at the current caret');
assert.match(html, /if\(child\.parentId===id\)child\.parentId=note\.parentId\|\|null/, 'deleting a page must promote children instead of deleting the subtree');
assert.match(html, /@container \(max-width:520px\)\{[\s\S]*\.memo-toolbar\{[^}]*flex-direction:column/, 'memo formatting groups must recompose into intentional rows under display scaling');
assert.match(plan, /grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/, 'desktop plan columns must fit without a hidden horizontal tail');
assert.match(plan, /narrowBoard\.matches\?'minmax\(190px,1fr\)'/, 'narrow Plan must preserve usable column width instead of crushing five columns');
assert.match(plan, /overflow-x:auto;[^}]*scroll-snap-type:x proximity/, 'narrow Plan board must scroll horizontally at its own boundary');
assert.match(plan, /body\.embed #board\{align-items:stretch\}/, 'embedded Plan must keep all five status columns horizontal when its iframe crosses the phone breakpoint');
assert.match(plan, /#board\{[^}]*align-items:stretch;[^}]*flex:1 1 auto/, 'plan columns must use the available vertical board space');
assert.doesNotMatch(plan, /measure-height/, 'embedded Plan must not re-enter the removed content-height measurement mode');
assert.match(plan, /:root\[data-theme="dark"\]/, 'embedded Plan must expose an explicit dark theme independent of the OS preference');
assert.match(plan, /:root:not\(\[data-theme\]\)/, 'standalone Plan must retain system-theme fallback when no parent theme exists');
assert.match(plan, /e\.data&&e\.data\.type==='olchipanel-theme'/, 'embedded Plan must apply live theme messages from its parent');
assert.match(plan, /c\.draggable=false/, 'Card bodies open details instead of starting a drag');
assert.match(plan, /grip\.draggable=true/, 'Only the explicit grip starts a card drag');
assert.match(plan, /col\.ondragover=[\s\S]*e\.preventDefault\(\)[\s\S]*col\.ondrop=/, 'Plan columns must expose valid drag-and-drop targets');
assert.match(plan, /setStatusTo\(it,status\)/, 'dropping a card must persist the destination status through the existing mutation path');
assert.match(plan, /function busy\(\)\{ return editing \|\| !!menuEl \|\| !!dragId; \}/, 'live refresh must not replace a card during drag');
assert.match(plan, /<dialog class="composer" id="cardComposer"/, 'Plan add must open a focused card composer instead of an inline one-line input');
assert.match(plan, /id="cardTitle"[\s\S]*id="cardNote"[\s\S]*id="cardStatus"[\s\S]*id="cardPriority"/, 'card composer must collect the useful task fields in one place');
assert.match(plan, /openCardComposer\(st,null,add\)/, 'every column add button must open the composer with that column as the default status');
assert.match(plan, /if\(composerItem\)[\s\S]*api\('PATCH'[\s\S]*else\{const r=await api\('POST'/, 'the same composer must support later edits as well as creation');
assert.doesNotMatch(plan, /function startAdd\([\s\S]*createElement\('input'\)/, 'card creation must not regress to an inline title-only field');
assert.match(plan, /width:min\(520px,calc\(100vw - 32px\)\)/, 'composer width must adapt to the effective viewport under display scaling');
assert.match(plan, /id="sendPlan"[\s\S]*id="exportPlan"[\s\S]*id="importPlan"[\s\S]*id="planFile"/, 'Plan must expose session transfer and portable file actions');
assert.match(plan, /id="sessionTransfer"[\s\S]*value="continue"[\s\S]*value="copy"/, 'session transfer must distinguish shared continuation from an independent copy');
assert.match(plan, /\/api\/plan\/export[\s\S]*olchipanel-plan-/, 'Plan export must download the portable server bundle');
assert.match(plan, /\/api\/plan\/import/, 'Plan import must use the portable server contract');
assert.match(plan, /type==='olchipanel-session'[\s\S]*clearPlan\(\);loadPlans\(linkedPlan\)/, 'embedded Plan must follow the selected session plan binding');
assert.match(html, /function syncPlanContext\(\)[\s\S]*type:'olchipanel-session'[\s\S]*planId:selected&&selected\.plan_id/, 'the app shell must send selected session Plan context to the board');
assert.match(plan, /body\.embed \.mark,body\.embed header b,body\.embed \.hint\{display:none\}/, 'embedded Plan transfer actions must not compete with the keyboard hint');
assert.match(html, /\.rail-tools\{display:grid; grid-template-columns:repeat\(4,max-content\)/, 'desktop rail actions must use one intentional row instead of incidental wrapping');
assert.doesNotMatch(html, /id="connStatus"|id="livedot"|id="livetxt"/, 'duplicate connection live indicator must not appear in the session rail');
assert.match(html, /\.v-claude,\.v-codex,\.v-cursor,\.v-gemini,\.v-other\{--vc:var\(--brand\)/, 'session selection must not paint a Codex-blue vendor card');
assert.match(html, /\.panel-tab\.active\{[^}]*box-shadow:none/, 'active session rows must stay flat instead of looking like floating dashboard cards');
assert.match(html, /\.panel-tab\{[^}]*background:transparent;[^}]*border-radius:0/, 'expanded session rows must be square-ended flat list items');
assert.match(html, /\.panel-tab\.active\{[^}]*background:transparent;[^}]*font-weight:700/, 'selected session must use typography instead of a background card');
assert.match(html, /\.panel-tab\.active::before\{[^}]*width:2px;[^}]*height:10px;[^}]*border-radius:0/, 'selected session may use only a small square-ended marker');
assert.match(plan, /collapsedStates\.has\(st\)\?'46px':\(narrowBoard\.matches\?'minmax\(190px,1fr\)':'minmax\(0,1fr\)'\)/, 'collapsed Plan columns must stay compact while narrow open columns retain a usable width');
assert.match(plan, /collapse\.setAttribute\('aria-expanded'/, 'every Plan column must expose its own accessible collapse control');
assert.doesNotMatch(plan, /완료·취소 숨기기|hideDone/, 'Plan must not remove done and canceled columns as a detached global filter');
assert.match(plan, /position:fixed;z-index:40[\s\S]*max-height:calc\(100vh - 16px\)/, 'card menu must be viewport-bound instead of clipping at a column edge');
assert.match(plan, /Math\.min\(window\.innerWidth-width-gap/, 'card menu placement must clamp to the effective viewport under display scaling');
assert.doesNotMatch(plan.split('@media')[0], /#board\{[^}]*overflow-x:auto/, 'desktop plan board must not put a scrollbar halfway down the pane');
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

const decodedDark32 = pngRgba(darkIcon32);
let darkIconNavy = 0, darkIconWhite = 0;
for (let i = 0; i < decodedDark32.rgba.length; i += 4) {
  const [r, g, b, a] = decodedDark32.rgba.subarray(i, i + 4);
  if (a > 128 && r < 55 && g < 80 && b < 120 && b > r) darkIconNavy++;
  if (a > 128 && r > 244 && g > 244 && b > 244) darkIconWhite++;
  assert.strictEqual(a, decoded32.rgba[i + 3], `dark favicon alpha geometry changed at pixel ${i / 4}`);
}
assert.strictEqual(darkIconNavy, 0, 'dark-chrome favicon must not retain navy ink');
assert(darkIconWhite > 210, 'dark-chrome favicon must render the cat in white');
assert.deepStrictEqual([...darkIco.subarray(0, 4)], [0, 0, 1, 0], 'dark-chrome favicon must remain a valid ICO');
assert.strictEqual(darkIco.readUInt16LE(4), 3, 'dark-chrome ICO must contain 16, 32, and 48px sources');


// Derived only from C:/Users/topli/Desktop/olchi.png
// source SHA-256: 148a90268b0ba9a7098baad7f66aff4c70eb0c5e280df48145fc59e5c5541534
console.log('UI SHELL OK: responsive UI Core and source-faithful transparent taskbar icon ready');
