'use strict';

const fs = require('fs');
const path = require('path');

const SCHEMA = 'olchipanel.memo.v4';

function safeId(id) {
  return String(id || '').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80);
}

function paths(root, id) {
  const safe = safeId(id);
  const stem = safe ? `memo-${safe}` : 'memo';
  return {
    data: path.join(root, stem + '.json'),
    legacy: path.join(root, stem + '.txt'),
  };
}

function normalize(input) {
  const raw = input && typeof input === 'object' ? input : {};
  const notes = Array.isArray(raw.notes) ? raw.notes.slice(0, 100).map((note, index) => {
    const item = note && typeof note === 'object' ? note : {};
    const order = Number(item.order);
    return {
      id: String(item.id || `note-${index + 1}`).replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80),
      title: String(item.title || '').trim().slice(0, 120),
      html: String(item.html || '').slice(0, 65536),
      pinned: item.pinned === true,
      parentId: item.parentId == null ? null : safeId(item.parentId) || null,
      collapsed: item.collapsed === true,
      order: Number.isFinite(order) ? Math.max(0, Math.min(9999, Math.trunc(order))) : index,
      created: String(item.created || '').slice(0, 40),
      updated: String(item.updated || '').slice(0, 40),
    };
  }) : [];
  const ids = new Set();
  const unique = notes.filter((note) => note.id && !ids.has(note.id) && ids.add(note.id));
  const byId = new Map(unique.map((note) => [note.id, note]));
  unique.forEach((note) => {
    if (!note.parentId || note.parentId === note.id || !byId.has(note.parentId)) note.parentId = null;
  });
  unique.forEach((note) => {
    const seen = new Set([note.id]);
    let cursor = note;
    while (cursor.parentId) {
      if (seen.has(cursor.parentId)) { note.parentId = null; break; }
      seen.add(cursor.parentId);
      cursor = byId.get(cursor.parentId);
      if (!cursor) { note.parentId = null; break; }
    }
  });
  const selected = unique.some((note) => note.id === raw.selected)
    ? String(raw.selected) : (unique[0] ? unique[0].id : null);
  return { schema: SCHEMA, selected, notes: unique };
}

function read(root, id) {
  const file = paths(root, id);
  try {
    return { memo: normalize(JSON.parse(fs.readFileSync(file.data, 'utf8'))), legacyText: '' };
  } catch (e) {}
  let legacyText = '';
  try { legacyText = fs.readFileSync(file.legacy, 'utf8').slice(0, 65536); } catch (e) {}
  return { memo: normalize({}), legacyText };
}

function write(root, id, input) {
  const memo = normalize(input);
  fs.mkdirSync(root, { recursive: true });
  const file = paths(root, id).data;
  const tmp = file + `.tmp.${process.pid}.${Date.now()}`;
  fs.writeFileSync(tmp, JSON.stringify(memo, null, 2), 'utf8');
  fs.renameSync(tmp, file);
  return memo;
}

module.exports = { SCHEMA, safeId, paths, normalize, read, write };
