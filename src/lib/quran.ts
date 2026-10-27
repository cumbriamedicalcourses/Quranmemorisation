import juz30 from '../data/juz30.json';

export interface Verse {
  number: number;
  arabic: string;
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

export const SOURCES = juz30.sources;
export const BASMALA: string = juz30.basmala;

const surahs = new Map<number, Surah>((juz30.surahs as Surah[]).map((s) => [s.number, s]));

/** Juz 30 is learned from An-Nas (114) back to An-Naba (78), shortest surahs first. */
export const COURSE_ORDER: number[] = [...surahs.keys()].sort((a, b) => b - a);

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

/** The lesson after `previous`, or the first lesson when there is none. Null when Juz 30 is complete. */
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
