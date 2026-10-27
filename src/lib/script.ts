export type Script = 'uthmani' | 'indopak';

/**
 * Prepares stored Quran text for the screen. The Uthmani text is shown as is.
 * The Digital Khatt IndoPak font draws two marks of the King Fahd Complex
 * IndoPak text with different code points, so only those are swapped; no
 * letter is ever changed. See data/sources/kfgqpc-indopak.SOURCE.md.
 */
export function displayText(text: string, script: Script): string {
  if (script === 'uthmani') return text;
  return text
    .replace(/ۡ/g, 'ْ') // IndoPak sukun
    .replace(/٘/g, '͏ٓ'); // madd sign, kept after its letter's other marks
}
