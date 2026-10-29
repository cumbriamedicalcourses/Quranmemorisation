// Builds src/data/course.json (Juz 28 to 30, surahs 58 to 114) from the source
// files in data/sources.
//
// Arabic text: King Fahd Complex (KFGQPC) Hafs Uthmani text, as published by
// QuranEnc and packaged in quran-json 3.1.2. Copied verbatim; never edited.
// Indopak: the King Fahd Complex IndoPak (Nastaleeq) text in Unicode, from
// quran-api (see data/sources/kfgqpc-indopak.SOURCE.md). Copied verbatim.
// English: Talal Itani, ClearQuran, used with his written permission (see
// data/sources/itani-clearquran.PERMISSION.md). Copied verbatim from the text
// export of the ClearQuran PDF; only line wrapping and page furniture are
// removed.
//
// The script fails if any surah's verse count differs between the sources,
// so a parsing slip can never silently shift a translation onto the wrong verse.
//
// Usage: node scripts/build-course.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIRST_SURAH = 58;
const LAST_SURAH = 114;

const arabic = JSON.parse(readFileSync(join(root, 'data/sources/kfgqpc-hafs.quranenc.json'), 'utf8'));
const indopak = JSON.parse(readFileSync(join(root, 'data/sources/kfgqpc-indopak.quran-api.json'), 'utf8')).quran;
// The PDF's text export marks its hyphenation points with U+0002 inside words
// ("sover\u0002eignty"); removing them restores the words as printed.
const itaniLines = readFileSync(join(root, 'data/sources/itani-clearquran.txt'), 'utf8').replace(/\u0002/g, '').split(/\r?\n/);

function parseItani(lines) {
  // The table of contents also lists "58. THE ARGUMENT ....", so start at the
  // surah heading that is followed by its "(al-Mujadilah)" line.
  const start = lines.findIndex((line, i) => line.trim() === '58. THE ARGUMENT' && lines[i + 1]?.trim().startsWith('('));
  if (start === -1) throw new Error(`Could not find the start of Surah ${FIRST_SURAH} in the translation`);

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

const indopakBySurah = new Map();
for (const v of indopak) {
  if (!indopakBySurah.has(v.chapter)) indopakBySurah.set(v.chapter, []);
  indopakBySurah.get(v.chapter).push(v);
}

const out = [];

for (let n = FIRST_SURAH; n <= LAST_SURAH; n++) {
  const ar = arabic[n - 1];
  const en = itani.get(n);
  if (!ar || ar.id !== n) throw new Error(`Arabic source is missing surah ${n}`);
  if (!en) throw new Error(`Translation is missing surah ${n}`);
  const ip = indopakBySurah.get(n) ?? [];
  if (ip.length !== ar.verses.length || ip.some((v, i) => v.verse !== i + 1)) {
    throw new Error(`Surah ${n}: ${ar.verses.length} Uthmani verses but ${ip.length} Indopak verses`);
  }
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
      indopak: ip[i].text,
      english: en.verses[i].replace(/\s+/g, ' ').trim(),
    })),
  });
}

const data = {
  // Al-Fatihah 1:1, shown above every other surah except At-Tawbah.
  basmala: arabic[0].verses[0].text,
  basmalaIndopak: indopakBySurah.get(1)[0].text,
  sources: {
    arabic: 'King Fahd Glorious Quran Printing Complex, Hafs Uthmani text (via QuranEnc)',
    indopak: 'King Fahd Glorious Quran Printing Complex, IndoPak Nastaleeq text',
    english: 'Translation by Talal Itani, ClearQuran.com',
  },
  surahs: out,
};

writeFileSync(join(root, 'src/data/course.json'), JSON.stringify(data, null, 1) + '\n');
const verseCount = out.reduce((sum, s) => sum + s.verses.length, 0);
console.log(`Wrote ${out.length} surahs, ${verseCount} verses to src/data/course.json`);
