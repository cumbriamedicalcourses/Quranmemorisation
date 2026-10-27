// Builds src/data/juz30.json from the source files in data/sources.
//
// Arabic text: King Fahd Complex (KFGQPC) Hafs Uthmani text, as published by
// QuranEnc and packaged in quran-json 3.1.2. Copied verbatim; never edited.
// English: Talal Itani, ClearQuran, CC BY-ND. Copied verbatim from the text
// export of the ClearQuran PDF; only line wrapping and page furniture are
// removed.
//
// The script fails if any surah's verse count differs between the two sources,
// so a parsing slip can never silently shift a translation onto the wrong verse.
//
// Usage: node scripts/build-juz30.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIRST_SURAH = 78;
const LAST_SURAH = 114;

const arabic = JSON.parse(readFileSync(join(root, 'data/sources/kfgqpc-hafs.quranenc.json'), 'utf8'));
const itaniLines = readFileSync(join(root, 'data/sources/itani-clearquran.txt'), 'utf8').split(/\r?\n/);

function parseItani(lines) {
  // The table of contents also lists "78. THE EVENT ....", so start at the
  // surah heading that is followed by its "(an-Naba’)" line.
  const start = lines.findIndex((line, i) => line.trim() === '78. THE EVENT' && lines[i + 1]?.trim().startsWith('('));
  if (start === -1) throw new Error('Could not find the start of Surah 78 in the translation');

  const surahs = new Map();
  let current = null;

  for (let i = start; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (/^\d+$/.test(line)) continue; // page number
    if (/^\d+\. [A-Z’'\- ]+ \(.+\)$/.test(line)) continue; // running page header

    const heading = line.match(/^(\d+)\. ([A-Z’'\- ]+)$/);
    if (heading && lines[i + 1]?.trim().startsWith('(')) {
      const number = Number(heading[1]);
      current = { number, title: heading[2].trim(), verses: [] };
      surahs.set(number, current);
      i += 1; // skip "(an-Naba’)"
      continue;
    }

    if (!current) continue;
    // The Basmala heads each surah; a page break can fall inside it.
    if (current.verses.length === 0 && (line === 'In the name of Allah,' || line === 'the Gracious, the Merciful')) continue;
    const verse = line.match(/^(\d+)\. ?(.*)$/); // one verse in the PDF lacks the space
    if (verse && Number(verse[1]) === current.verses.length + 1) {
      current.verses.push(verse[2]);
      continue;
    }

    if (current.verses.length === 0) throw new Error(`Unexpected text before verse 1 of surah ${current.number}: ${line}`);
    const last = current.verses.length - 1;
    const joiner = current.verses[last].endsWith('—') ? '' : ' ';
    current.verses[last] = current.verses[last] + joiner + line;
  }
  return surahs;
}

const itani = parseItani(itaniLines);
const out = [];

for (let n = FIRST_SURAH; n <= LAST_SURAH; n++) {
  const ar = arabic[n - 1];
  const en = itani.get(n);
  if (!ar || ar.id !== n) throw new Error(`Arabic source is missing surah ${n}`);
  if (!en) throw new Error(`Translation is missing surah ${n}`);
  if (ar.verses.length !== en.verses.length) {
    throw new Error(`Surah ${n}: ${ar.verses.length} Arabic verses but ${en.verses.length} translated verses`);
  }
  out.push({
    number: n,
    nameArabic: ar.name,
    name: ar.transliteration,
    meaning: en.title.charAt(0) + en.title.slice(1).toLowerCase(),
    verses: ar.verses.map((v, i) => ({
      number: v.id,
      arabic: v.text,
      english: en.verses[i].replace(/\s+/g, ' ').trim(),
    })),
  });
}

const data = {
  // Al-Fatihah 1:1, shown above every other surah except At-Tawbah.
  basmala: arabic[0].verses[0].text,
  sources: {
    arabic: 'King Fahd Glorious Quran Printing Complex, Hafs Uthmani text (via QuranEnc)',
    english: 'Talal Itani, ClearQuran (CC BY-ND)',
  },
  surahs: out,
};

writeFileSync(join(root, 'src/data/juz30.json'), JSON.stringify(data, null, 1) + '\n');
const verseCount = out.reduce((sum, s) => sum + s.verses.length, 0);
console.log(`Wrote ${out.length} surahs, ${verseCount} verses to src/data/juz30.json`);
