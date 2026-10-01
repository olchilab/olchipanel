'use strict';

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const memo = require('../src/memo');
const { TOOLS } = require('../src/mcp');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'olchipanel-memo-'));
const id = 'codex/current?session';
const files = memo.paths(root, id);
const commonFiles = memo.paths(root, 'common');
assert.strictEqual(path.basename(commonFiles.data), 'memo-common.json', 'shared Note must have one stable project file');
assert(TOOLS.some((tool) => tool.name === 'note_read'), 'agents must have a read-only shared Note tool');

fs.writeFileSync(files.legacy, '기존 메모\n둘째 줄', 'utf8');
const legacy = memo.read(root, id);
assert.strictEqual(legacy.legacyText, '기존 메모\n둘째 줄');
assert.deepStrictEqual(legacy.memo.notes, []);

const saved = memo.write(root, id, {
  selected: 'n1',
  notes: [
    { id: 'n1', title: '제목', html: '<b>내용</b>', pinned: true, order: 7, created: '2026-09-01', updated: '2026-09-01' },
    { id: 'n2', title: '하위 페이지', html: '<p>자식</p>', parentId: 'n1', collapsed: true, order: 0 },
  ],
});
assert.strictEqual(saved.schema, memo.SCHEMA);
assert.strictEqual(saved.selected, 'n1');
assert.strictEqual(memo.read(root, id).memo.notes[0].html, '<b>내용</b>');
assert.strictEqual(memo.read(root, id).memo.notes[0].pinned, true);
assert.strictEqual(memo.read(root, id).memo.notes[0].order, 7);
assert.strictEqual(memo.read(root, id).memo.notes[1].parentId, 'n1');
assert.strictEqual(memo.read(root, id).memo.notes[1].collapsed, true);
assert.strictEqual(fs.readFileSync(files.legacy, 'utf8'), '기존 메모\n둘째 줄', 'legacy source must stay preserved');

const normalized = memo.normalize({
  selected: 'missing',
  notes: [
    { id: 'same', title: ' x '.repeat(100), html: 'a'.repeat(70000) },
    { id: 'same', title: 'duplicate', html: 'ignored' },
  ],
});
assert.strictEqual(normalized.notes.length, 1);
assert.ok(normalized.notes[0].title.length <= 120);
assert.ok(normalized.notes[0].html.length <= 65536);
assert.strictEqual(normalized.selected, 'same');
assert.strictEqual(normalized.notes[0].pinned, false, 'v2 pages must migrate without becoming pinned');
assert.strictEqual(normalized.notes[0].order, 0, 'v2 pages must receive a stable list order');
assert.strictEqual(normalized.notes[0].parentId, null, 'flat legacy pages must migrate to the tree root');
assert.strictEqual(normalized.notes[0].collapsed, false, 'legacy pages must start expanded');

const invalidTree = memo.normalize({
  selected: 'self',
  notes: [
    { id: 'orphan', parentId: 'missing' },
    { id: 'self', parentId: 'self' },
    { id: 'cycle-a', parentId: 'cycle-b' },
    { id: 'cycle-b', parentId: 'cycle-a' },
  ],
});
assert.strictEqual(invalidTree.notes.find((note) => note.id === 'orphan').parentId, null, 'missing parents must fail safe to the root');
assert.strictEqual(invalidTree.notes.find((note) => note.id === 'self').parentId, null, 'self parents must fail safe to the root');
const cycleA = invalidTree.notes.find((note) => note.id === 'cycle-a');
const cycleB = invalidTree.notes.find((note) => note.id === 'cycle-b');
assert.ok(cycleA.parentId === null || cycleB.parentId === null, 'cycles must be broken without deleting either page');
assert.deepStrictEqual(fs.readdirSync(root).filter((name) => name.includes('.tmp.')), []);

console.log('MEMO OK: legacy preserved, structured notes normalized, atomic file clean');
