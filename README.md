# Quran Memorisation

A self-paced Quran memorisation course for beginners, children and adults, aiming to become hafiz. One codebase runs as a website and as iPhone and Android apps (Expo and React Native).

This first version covers **Juz 30**: first-time setup, the daily plan, the five-step memorisation screen and the adaptive revision schedule. Progress is saved on the device. Accounts, Premium and payments come later.

## Running it

```bash
npm install
npm run web        # opens the website in a browser
npm start          # scan the QR code with Expo Go to try it on a phone
npm test           # revision schedule tests
npm run typecheck
```

`npm run build:web` exports a static website to `dist/`.

## How it works

- **Daily plan** (`src/app/index.tsx`): the new lesson, recent revision (sabqi) and older revision (manzil) due today.
- **Memorise** (`src/app/memorise.tsx`): Listen, Read, Recite, Join and Check for a new lesson; Recite and Check for revision. Students choose how many verses show on screen (3 by default) and hide words from the end of each verse as they grow confident.
- **Revision schedule** (`src/lib/schedule.ts`): each lesson becomes a portion reviewed after 1, 2, 4, 7, 14 and 30 days, then in a rotating older-revision cycle. *Strong* moves a portion on, *Some mistakes* repeats the gap, *Forgot* brings it back tomorrow. Too much revision, or three missed days, makes a revision-only day. These numbers are a starting proposal for a hifz teacher to review.
- **Course order** (`src/lib/quran.ts`): An-Nas (114) back to An-Naba (78), lessons never crossing a surah boundary.

## Sources

The Quran text is never typed or scanned. `npm run build:data` regenerates `src/data/juz30.json` from the files in `data/sources/`:

| What | Source | Terms |
| --- | --- | --- |
| Arabic text | King Fahd Glorious Quran Printing Complex, Hafs Uthmani text, via QuranEnc, packaged in [quran-json](https://github.com/risan/quran-json) 3.1.2 | Copied verbatim, never altered |
| English meanings | Talal Itani, [ClearQuran](https://clearquran.com) | Written permission from Talal Itani, including commercial use ([details](data/sources/itani-clearquran.PERMISSION.md)). Shown word for word with the credit line "Translation by Talal Itani, ClearQuran.com" |
| Fonts | Amiri Quran, Manrope and Newsreader from Google Fonts | SIL Open Font License |

Checks done when building the data:

- Every surah's verse count matches between the Arabic and the English (the build stops if not): 37 surahs, 564 verses.
- The Arabic letters of all 564 verses were compared with the Tanzil Project's text, a separate source. They match, except one spelling convention for a hamza in 80:37 (امرئ written امري with a small hamza in the Uthmani script).

A hafiz must still read the text in the app against a printed Mushaf before launch.

## Still to do

- Recitation audio, once the King Fahd Complex confirms permission.
- Indopak script (13-line).
- The King Fahd Complex Uthmanic Hafs font in place of Amiri Quran, once its licence is confirmed.
- Accounts, parent-managed accounts for children, Premium and payments.
- Reasons for revelation.
