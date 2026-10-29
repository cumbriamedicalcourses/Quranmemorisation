/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REVELATION_NOTES, notesFor } from '../data/revelation.ts';

test('every note sits inside the course and cites a source', () => {
  for (const n of REVELATION_NOTES) {
    assert.ok(n.surah >= 78 && n.surah <= 114, `surah ${n.surah}`);
    assert.ok(n.from >= 1 && n.from <= n.to, `${n.surah}:${n.from}-${n.to}`);
    assert.ok(n.text.length > 0 && n.source.length > 0);
  }
});

test('notes are found for any overlapping verses and not otherwise', () => {
  assert.equal(notesFor(80, 4, 6).length, 1);
  assert.equal(notesFor(80, 11, 13).length, 0);
  assert.deepEqual(notesFor(96, 1, 8).map((n) => n.kind), ['background', 'reason']);
  assert.equal(notesFor(96, 4, 5).length, 0);
  assert.equal(notesFor(112, 1, 4).length, 0);
});
