/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { displayText } from './script.ts';

const letters = (s: string) => s.replace(/[^ء-ي]/g, '');

test('Uthmani text is shown exactly as stored', () => {
  const text = 'قُلۡ ا٘';
  assert.equal(displayText(text, 'uthmani'), text);
});

test('IndoPak swaps only the sukun and madd marks', () => {
  const text = 'قُلۡ اِنَّا٘';
  const shown = displayText(text, 'indopak');
  assert.equal(shown, 'قُلْ اِنَّا͏ٓ');
  assert.equal(letters(shown), letters(text));
});
