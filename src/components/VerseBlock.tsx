import { Pressable, StyleSheet, Text, View } from 'react-native';

import { verseText, type Verse } from '@/lib/quran';
import { displayText, type Script } from '@/lib/script';
import { colors, fonts, quranFonts } from '@/theme';

const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export function toArabicDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => ARABIC_DIGITS[Number(d)]);
}

// Pause marks and other Quranic annotation signs are never hidden, including
// the IndoPak ones in Arabic Extended-A.
const ONLY_MARKS = /^[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF\u034F\u200F]+$/;

/**
 * How much of a verse is hidden while reciting from memory, hiding from the
 * end of the verse first so the opening words stay as a cue:
 * 0 shows every word, 1 hides the last third, 2 keeps only the first word,
 * 3 hides every word.
 */
export type HideLevel = 0 | 1 | 2 | 3;

function hiddenFrom(wordCount: number, level: HideLevel): number {
  if (level === 0) return wordCount;
  if (level === 3) return 0;
  if (level === 1) return wordCount - Math.max(1, Math.ceil(wordCount / 3));
  return Math.min(1, wordCount - 1);
}

export function VerseBlock({
  verse,
  script,
  highlighted,
  hideLevel = 0,
  showMeaning,
  onPress,
}: {
  verse: Verse;
  script: Script;
  highlighted?: boolean;
  hideLevel?: HideLevel;
  showMeaning: boolean;
  onPress?: () => void;
}) {
  const words = displayText(verseText(verse, script), script).split(' ');
  const font = { fontFamily: quranFonts[script] };
  const wordCount = words.filter((w) => !ONLY_MARKS.test(w)).length;
  const firstHidden = hiddenFrom(wordCount, hideLevel);
  let wordIndex = 0;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel={`Verse ${verse.number}`}
      style={[styles.block, highlighted && styles.highlighted]}
    >
      <View style={styles.arabicRow}>
        <Text style={[styles.arabic, font]} accessibilityLanguage="ar">
          {words.map((word, i) => {
            const mark = ONLY_MARKS.test(word);
            const hidden = !mark && wordIndex++ >= firstHidden;
            return (
              <Text key={i} style={hidden ? styles.hiddenWord : undefined}>
                {word}
                {i < words.length - 1 ? ' ' : ''}
              </Text>
            );
          })}
        </Text>
        <View style={styles.marker} accessibilityElementsHidden importantForAccessibility="no">
          <Text style={styles.markerText}>{toArabicDigits(verse.number)}</Text>
        </View>
      </View>
      {showMeaning ? (
        <Text style={[styles.meaning, highlighted && { color: colors.body }]}>
          {verse.number}. {verse.english}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: { borderRadius: 18, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 12, gap: 4 },
  highlighted: { backgroundColor: colors.verseHighlight },
  arabicRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  arabic: {
    flex: 1,
    fontSize: 30,
    lineHeight: 60,
    color: colors.ink,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
  hiddenWord: { color: 'transparent', backgroundColor: colors.line },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Amiri Quran's digits suit both scripts; Digital Khatt's are drawn for inline verse ends.
  markerText: { fontFamily: fonts.quran, fontSize: 15, lineHeight: 22, color: colors.ink },
  meaning: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 24, color: colors.muted },
});
