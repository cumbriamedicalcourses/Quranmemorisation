# Indopak text: where it comes from

`kfgqpc-indopak.quran-api.json` is the King Fahd Glorious Quran Printing Complex's IndoPak (Nastaleeq) Hafs text, in Unicode.

- **Original:** the Complex publishes the text with its Nastaleeq font at fonts.qurancomplex.gov.sa. That file uses the font's own symbols, so it only displays correctly in that font.
- **This copy:** the `ara-quranindopak` edition of [quran-api](https://github.com/fawazahmed0/quran-api) (branch `1`), which converts the Complex's file to standard Unicode. The quran-api project is released into the public domain (The Unlicense). Downloaded from `https://raw.githubusercontent.com/fawazahmed0/quran-api/1/editions/ara-quranindopak.json`.
- **SHA-256:** `488c7768fb775348705c07715a553928163548506d388c4fe56207b95f5eceeb`

## Checks done

- 6,236 verses, and 564 verses in Juz 30 (surahs 78 to 114), the same counts as the Uthmani text.
- In Juz 30 the letters of this Unicode copy are identical to the Complex's original file (the `ara-qurannastaleeqn` edition of quran-api). Only the encoding of marks differs.
- Juz 30 was compared word by word with a separate IndoPak text, the one used by the Digital Khatt project (`quran_text_indopak_15.ts` in DigitalKhatt/digitalkhatt-js). Every word matches except spelling conventions: how the hamza is seated (for example يومئذ), and four words where one text writes a full alif and the other a small (standing) alif. In this text they are (copied from the file):

  | Verse | This text | Digital Khatt text |
  | --- | --- | --- |
  | 78:22 | لِّلطّٰغِيۡنَ (small alif) | full alif |
  | 78:40 | الۡكَافِرُ (full alif) | small alif |
  | 82:11 | كٰتِبِيۡنَ (small alif) | full alif |
  | 83:26 | الۡمُتَنٰفِسُوۡنَ (small alif) | full alif |

  A hafiz should check these against the printed 13-line mushaf used for the course.

## Display only: two marks

The Digital Khatt IndoPak font draws two marks with different code points from this text. When showing the text (never in the stored data), the app swaps:

| In this text | Shown as | Meaning |
| --- | --- | --- |
| U+06E1 small high dotless head of khah | U+0652 sukun | IndoPak sukun |
| U+0658 mark noon ghunna | U+034F + U+0653 maddah above | Madd sign |

No letter is changed. See `displayText` in `src/lib/quran.ts`.
