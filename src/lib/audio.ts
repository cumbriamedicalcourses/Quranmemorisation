// Verse-by-verse recitation by Mahmoud Khalil Al-Husary (murattal, 128 kbps),
// from EveryAyah. Files are named SSSAAA.mp3 (surah, verse). The Basmala is a
// separate clip and is never part of a verse's file. The files are hosted
// outside the code; EXPO_PUBLIC_AUDIO_BASE_URL points at the folder.

export const RECITER = 'Mahmoud Khalil Al-Husary';

export const AUDIO_BASE_URL = (process.env.EXPO_PUBLIC_AUDIO_BASE_URL ?? '/audio/husary/').replace(/\/?$/, '/');

export interface Track {
  /** null for the Basmala */
  verse: number | null;
  url: string;
}

const pad = (n: number) => String(n).padStart(3, '0');

export function verseFile(surah: number, verse: number): string {
  return `${pad(surah)}${pad(verse)}.mp3`;
}

/**
 * The clips to play for some verses of a surah, in order. The Basmala comes
 * first when verse 1 is included and the surah opens with one.
 */
export function tracksFor(surah: number, verses: number[], withBasmala: boolean, base = AUDIO_BASE_URL): Track[] {
  const tracks: Track[] = [];
  if (withBasmala && verses[0] === 1) tracks.push({ verse: null, url: `${base}bismillah.mp3` });
  for (const v of verses) tracks.push({ verse: v, url: base + verseFile(surah, v) });
  return tracks;
}
