import assert from 'node:assert/strict';
import { test } from 'node:test';

import { tracksFor, verseFile } from './audio.ts';

test('verse files are named by surah and verse', () => {
  assert.equal(verseFile(58, 1), '058001.mp3');
  assert.equal(verseFile(114, 6), '114006.mp3');
});

test('the Basmala plays before verse 1 only', () => {
  assert.deepEqual(
    tracksFor(103, [1, 2, 3], true, 'https://a/'),
    [
      { verse: null, url: 'https://a/bismillah.mp3' },
      { verse: 1, url: 'https://a/103001.mp3' },
      { verse: 2, url: 'https://a/103002.mp3' },
      { verse: 3, url: 'https://a/103003.mp3' },
    ],
  );
  assert.equal(tracksFor(103, [2, 3], true, 'https://a/').length, 2);
  assert.equal(tracksFor(9, [1], false, 'https://a/').length, 1);
});
