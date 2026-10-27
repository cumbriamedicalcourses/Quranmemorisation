// Reasons for revelation (asbab al-nuzul) for Juz 30, approved by Dr Syed Rahil
// on 27 October 2026. Written in our own words from authentic hadith. Rule: no
// weak or debatable report is used; a report is included only if it is in Sahih
// al-Bukhari or Sahih Muslim, or graded sahih or hasan with no dispute over the
// grading. Change the wording only with the reviewer's approval.

export interface RevelationNote {
  surah: number;
  from: number;
  to: number;
  /** "Reason for revelation", or "Background" for notes about how a passage came, not why. */
  kind: 'reason' | 'background';
  text: string;
  source: string;
}

export const REVELATION_NOTES: RevelationNote[] = [
  {
    surah: 80,
    from: 1,
    to: 10,
    kind: 'reason',
    text:
      'These verses were revealed about Abdullah ibn Umm Maktum, a blind Companion. He came to the Prophet ﷺ asking to be taught while the Prophet was speaking with one of the leaders of the idolaters, hoping he would accept Islam. The Prophet turned away from him towards the other man, and these verses were revealed.',
    source:
      "Jami' at-Tirmidhi 3331, from Aishah (at-Tirmidhi: hasan gharib; al-Albani and Ahmad Shakir: chain sahih). Also in the Muwatta of Imam Malik, Book 15, Hadith 9, from Urwah ibn az-Zubayr.",
  },
  {
    surah: 83,
    from: 1,
    to: 1,
    kind: 'reason',
    text:
      'When the Prophet ﷺ came to Madinah, its people were among the worst at giving short measure. Allah revealed "Woe to the defrauders", and after that they gave full measure.',
    source: 'Sunan Ibn Majah 2223, from Ibn Abbas (Darussalam: hasan).',
  },
  {
    surah: 93,
    from: 1,
    to: 3,
    kind: 'reason',
    text:
      'The Prophet ﷺ was ill and did not stand for the night prayer for two or three nights, and revelation paused. A woman of the idolaters mocked him, saying his companion had left him. Allah revealed these verses: "Your Lord has not forsaken you, nor is He displeased."',
    source: 'Sahih al-Bukhari 4950 and Sahih Muslim 1797, from Jundub ibn Sufyan.',
  },
  {
    surah: 96,
    from: 1,
    to: 3,
    kind: 'background',
    text:
      'These were the first verses ever revealed. They came to the Prophet ﷺ in the cave of Hira, when the angel Jibril told him to read.',
    source: 'Sahih al-Bukhari 3, from Aishah.',
  },
  {
    surah: 96,
    from: 6,
    to: 19,
    kind: 'reason',
    text:
      'Abu Jahl swore that if he saw the Prophet ﷺ praying at the Ka\'bah he would tread on his neck. When he came near, he drew back in fear, saying he saw between them a trench of fire, terror and wings. The Prophet said that if he had come closer, the angels would have seized him. These verses were revealed about him.',
    source: 'Sahih Muslim 2797, from Abu Hurayrah. Also Sahih al-Bukhari 4958, from Ibn Abbas.',
  },
  {
    surah: 108,
    from: 1,
    to: 3,
    kind: 'background',
    text:
      'Anas ibn Malik reported that the Prophet ﷺ dozed briefly among his Companions, then raised his head smiling and said a surah had just been revealed to him, and recited Al-Kawthar. He explained that al-Kawthar is a river his Lord has promised him in Paradise, with a pool his community will come to on the Day of Resurrection.',
    source: 'Sahih Muslim 400, from Anas ibn Malik.',
  },
  {
    surah: 111,
    from: 1,
    to: 5,
    kind: 'reason',
    text:
      'When Allah commanded the Prophet ﷺ to warn his nearest kin, he climbed the hill of as-Safa and called the clans of Quraysh. He asked whether they would believe him if he warned them of horsemen behind the hill, and they said they had never known him to lie. He then warned them of a severe punishment ahead. Abu Lahab said "May you perish! Is this why you gathered us?", and this surah was revealed.',
    source: 'Sahih al-Bukhari 4971, from Ibn Abbas. Also in Sahih Muslim.',
  },
  {
    surah: 113,
    from: 1,
    to: 5,
    kind: 'background',
    text:
      'The Prophet ﷺ said: "Have you not seen verses revealed tonight, the like of which has never been seen?", meaning Al-Falaq and An-Nas.',
    source: 'Sahih Muslim 814, from Uqbah ibn Amir.',
  },
  {
    surah: 114,
    from: 1,
    to: 6,
    kind: 'background',
    text:
      'The Prophet ﷺ said: "Have you not seen verses revealed tonight, the like of which has never been seen?", meaning Al-Falaq and An-Nas.',
    source: 'Sahih Muslim 814, from Uqbah ibn Amir.',
  },
];

/** Notes that touch any of the verses from `from` to `to` of a surah. */
export function notesFor(surah: number, from: number, to: number, notes: RevelationNote[] = REVELATION_NOTES): RevelationNote[] {
  return notes.filter((n) => n.surah === surah && n.from <= to && n.to >= from);
}
