import course from '../data/course.json';
import type { Script } from './script';

export interface Verse {
  number: number;
  /** King Fahd Complex Uthmani text. */
  arabic: string;
  /** King Fahd Complex IndoPak text. */
  indopak: string;
  english: string;
}

export interface Surah {
  number: number;
  nameArabic: string;
  name: string;
  meaning: string;
  verses: Verse[];
}

export interface LessonRef {
  surah: number;
  from: number;
  to: number;
}

export const SOURCES = course.sources;
const BASMALA: Record<Script, string> = { uthmani: course.basmala, indopak: course.basmalaIndopak };

export function basmala(script: Script): string {
  return BASMALA[script];
}

export function verseText(verse: Verse, script: Script): string {
  return script === 'uthmani' ? verse.arabic : verse.indopak;
}

const surahs = new Map<number, Surah>((course.surahs as Surah[]).map((s) => [s.number, s]));

export interface Juz {
  number: number;
  name: string;
  /** First and last surah; Juz 28 to 30 each hold whole surahs. */
  first: number;
  last: number;
}

/** The course runs Juz 30, then 29, then 28. */
export const JUZ: Juz[] = [
  { number: 30, name: 'Juz Amma', first: 78, last: 114 },
  { number: 29, name: 'Juz Tabarak', first: 67, last: 77 },
  { number: 28, name: 'Juz Qad Sami', first: 58, last: 66 },
];

export function juzOf(surah: number): Juz {
  const juz = JUZ.find((j) => surah >= j.first && surah <= j.last);
  if (!juz) throw new Error(`Surah ${surah} is not in this course yet`);
  return juz;
}

/**
 * Each juz is learned from its last surah back to its first, as in Juz 30
 * (An-Nas back to An-Naba), and the juz follow one another 30, 29, 28.
 */
export const COURSE_ORDER: number[] = JUZ.flatMap((j) =>
  Array.from({ length: j.last - j.first + 1 }, (_, i) => j.last - i),
);

export function getSurah(number: number): Surah {
  const surah = surahs.get(number);
  if (!surah) throw new Error(`Surah ${number} is not in this course yet`);
  return surah;
}

export function getVerses(ref: LessonRef): Verse[] {
  return getSurah(ref.surah).verses.slice(ref.from - 1, ref.to);
}

/** Al-Fatihah counts the Basmala as its first verse; At-Tawbah has none. */
export function startsWithBasmala(surah: number): boolean {
  return surah !== 1 && surah !== 9;
}

// Rough letters per line of the 15-line Madani Mushaf, used only to estimate
// how long a passage takes. Diacritics and spaces are not counted.
const LETTERS_PER_LINE = 40;
const MARKS = /[ً-ٰٟۖ-ۭـ\s]/g;

export function estimateLines(ref: LessonRef): number {
  const letters = getVerses(ref).reduce((sum, v) => sum + v.arabic.replace(MARKS, '').length, 0);
  return Math.round((letters / LETTERS_PER_LINE) * 10) / 10;
}

/** The lesson after `previous`, or the first lesson when there is none. Null when the course is complete. */
export function nextLesson(previous: LessonRef | null, versesPerDay: number): LessonRef | null {
  let surahIndex = 0;
  let from = 1;
  if (previous) {
    const surah = getSurah(previous.surah);
    surahIndex = COURSE_ORDER.indexOf(previous.surah);
    from = previous.to + 1;
    if (from > surah.verses.length) {
      surahIndex += 1;
      from = 1;
    }
  }
  if (surahIndex >= COURSE_ORDER.length) return null;
  const surah = getSurah(COURSE_ORDER[surahIndex]);
  const to = Math.min(surah.verses.length, from + versesPerDay - 1);
  return { surah: surah.number, from, to };
}

export function describeLesson(ref: LessonRef): string {
  const surah = getSurah(ref.surah);
  if (ref.from === 1 && ref.to === surah.verses.length) return `${surah.name} · whole surah`;
  return ref.from === ref.to ? `${surah.name} · verse ${ref.from}` : `${surah.name} · verses ${ref.from}–${ref.to}`;
}
