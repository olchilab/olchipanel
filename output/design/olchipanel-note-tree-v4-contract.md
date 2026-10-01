# OlchiPanel Note tree v4 contract

## Canonical flow

- Schema owner: `src/memo.js` (`olchipanel.memo.v4`).
- UI producer: `public/index.html` posts the common notebook to `/api/memo/common`.
- Persistence: `${OLCHIPANEL_HOME || ~/.olchipanel}/memo-common.json`, written atomically.
- Readers: the Note UI and the read-only MCP tool `note_read`.

Each page keeps the existing `id`, `title`, `html`, `pinned`, `order`, timestamps, and adds:

- `parentId`: parent page id or `null` for a root page.
- `collapsed`: whether that page's children are folded in the tree.

The HTML body remains backward-compatible. Its top-level block elements are the movable block units; no separate block database is introduced in this slice.

## Compatibility and failure behavior

- v3 and older flat pages load as roots with `parentId: null` and `collapsed: false`.
- Missing parents and self-parent links flatten to the root.
- Cycles are broken without deleting pages.
- Deleting a parent promotes its direct children to the deleted page's parent.
- Existing session-specific memo files are neither migrated nor removed; the common Note continues to use only `memo-common.json`.
- A viewer already running old code must be restarted before writing v4 fields. Mixed-version writers are not a supported steady state.

## Evidence

- Positive fixture: `test/memo.test.js` persists a root and child, then verifies `parentId` and `collapsed` round-trip.
- Negative fixtures: missing parent, self-parent, and two-page cycle normalize safely without data deletion.
- Static consumer checks: `test/ui-shell.test.js` covers the recursive tree, breadcrumb, compact page-action menu, slash-created subpage, block buttons/keyboard/drag, and child promotion on delete.
- Rendered flow: temporary `OLCHIPANEL_HOME` verified a three-level tree, fold/unfold, `/페이지`, block movement, reload persistence, and 1440x900/960x760 layouts without document horizontal overflow.
