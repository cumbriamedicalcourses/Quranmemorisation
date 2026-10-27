import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BackIcon, HeadphonesIcon } from '@/components/icons';
import { Button, Card, IconButton, Screen, Stepper, text } from '@/components/ui';
import { VerseBlock, type HideLevel } from '@/components/VerseBlock';
import { notesFor } from '@/data/revelation';
import { basmala, getSurah, getVerses, SOURCES, startsWithBasmala, type LessonRef } from '@/lib/quran';
import type { Rating } from '@/lib/schedule';
import { displayText } from '@/lib/script';
import { useStore } from '@/lib/store';
import { colors, fonts, quranFonts, radius } from '@/theme';

type Step = 'listen' | 'read' | 'recite' | 'join' | 'check';

const STEP_NAMES: Record<Step, string> = { listen: 'Listen', read: 'Read', recite: 'Recite', join: 'Join', check: 'Check' };
const NEW_STEPS: Step[] = ['listen', 'read', 'recite', 'join', 'check'];
const REVIEW_STEPS: Step[] = ['recite', 'check'];

const STEP_HELP: Record<Step, string> = {
  listen: 'Listen to each verse several times while following the text.',
  read: 'Recite each verse aloud while looking at the text. Tap a verse to focus on it.',
  recite: 'Recite from memory. Hide more words as you grow more confident.',
  join: 'Recite the verses one after another without stopping. Tap a verse to peek.',
  check: 'Recite the whole passage from memory, then show the text and mark how it went.',
};

const LISTEN_TARGET = 5;

function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}

export default function MemoriseScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; surah?: string; from?: string; to?: string; portion?: string }>();
  const { state, updateSettings, completeNewLesson, completeReview } = useStore();
  const { script } = state.settings;

  const mode = params.mode === 'review' ? 'review' : 'new';
  const portion = mode === 'review' ? state.portions.find((p) => p.id === params.portion) : undefined;
  const lesson: LessonRef | null =
    mode === 'review'
      ? portion ?? null
      : params.surah && params.from && params.to
        ? { surah: Number(params.surah), from: Number(params.from), to: Number(params.to) }
        : null;

  const steps = mode === 'review' ? REVIEW_STEPS : NEW_STEPS;
  const [stepIndex, setStepIndex] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [focus, setFocus] = useState<number | null>(null);
  const [hideLevel, setHideLevel] = useState<HideLevel>(mode === 'review' ? 3 : 1);
  const [peeking, setPeeking] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState(false);
  const [listens, setListens] = useState(0);
  const [showMeaning, setShowMeaning] = useState(true);
  const [finished, setFinished] = useState<Rating | null>(null);

  const verses = useMemo(() => (lesson ? getVerses(lesson) : []), [lesson?.surah, lesson?.from, lesson?.to]);
  const pages = useMemo(() => chunk(verses, state.settings.versesPerScreen), [verses, state.settings.versesPerScreen]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!lesson || verses.length === 0) {
    return (
      <Screen>
        <View style={{ paddingTop: 40, gap: 16 }}>
          <Text style={text.title}>This lesson could not be found</Text>
          <Button label="Back to today" onPress={() => router.replace('/')} />
        </View>
      </Screen>
    );
  }

  const surah = getSurah(lesson.surah);
  const step = steps[stepIndex];
  const paged = step === 'listen' || step === 'read' || step === 'recite';
  const page = Math.min(pageIndex, pages.length - 1);
  const shown = paged ? pages[page] : verses;
  const highlighted = focus ?? shown[0]?.number;
  const meaningVisible = showMeaning && (step === 'listen' || step === 'read' || (step === 'check' && revealed));

  const goToStep = (index: number) => {
    setStepIndex(index);
    setPageIndex(0);
    setFocus(null);
    setPeeking(new Set());
    setRevealed(false);
  };

  const rate = (rating: Rating) => {
    if (mode === 'new') completeNewLesson({ surah: lesson.surah, from: lesson.from, to: lesson.to }, rating);
    else if (portion) completeReview(portion.id, rating);
    setFinished(rating);
  };

  if (finished) {
    const message =
      mode === 'new'
        ? 'This lesson will come back for revision tomorrow.'
        : finished === 'forgot'
          ? 'No problem. It will come back tomorrow so you can strengthen it.'
          : finished === 'some'
            ? 'It will come back after the same gap as last time.'
            : 'Well done. It will come back after a longer gap.';
    return (
      <Screen>
        <View style={{ paddingTop: 48, gap: 16 }}>
          <Text style={text.label}>{mode === 'new' ? 'LESSON COMPLETE' : 'REVISION COMPLETE'}</Text>
          <Text style={text.title}>
            {surah.name}, verses {lesson.from}–{lesson.to}
          </Text>
          <Text style={text.body}>{message}</Text>
          <Button label="Back to today" onPress={() => router.replace('/')} />
        </View>
      </Screen>
    );
  }

  const footer = (
    <View style={styles.footerRow}>
      <Button label="Back" kind="secondary" onPress={() => goToStep(stepIndex - 1)} disabled={stepIndex === 0} style={{ flex: 1 }} />
      {step !== 'check' ? (
        <Button label={`Next: ${STEP_NAMES[steps[stepIndex + 1]]}`} onPress={() => goToStep(stepIndex + 1)} style={{ flex: 2 }} />
      ) : null}
    </View>
  );

  return (
    <Screen footer={footer}>
      <View style={styles.header}>
        <IconButton label="Back to today" onPress={goBack}>
          <BackIcon color={colors.ink} />
        </IconButton>
        <View style={{ alignItems: 'center', gap: 2, flex: 1 }}>
          <Text style={text.heading}>{surah.name}</Text>
          <Text style={text.small}>
            Surah {surah.number} · Verses {lesson.from}–{lesson.to} of {surah.verses.length}
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.steps} accessibilityRole="progressbar" accessibilityLabel={`Step ${stepIndex + 1} of ${steps.length}: ${STEP_NAMES[step]}`}>
        {steps.map((s, i) => (
          <View key={s} style={{ flex: 1, gap: 6 }}>
            <View style={[styles.stepBar, { backgroundColor: i <= stepIndex ? colors.accent : colors.border }]} />
            <Text style={[styles.stepName, i === stepIndex && styles.stepNameActive]}>{STEP_NAMES[s]}</Text>
          </View>
        ))}
      </View>

      <Text style={[text.small, { paddingHorizontal: 4, paddingTop: 10 }]}>{STEP_HELP[step]}</Text>

      <Card style={styles.versesCard}>
        {lesson.from === 1 && startsWithBasmala(lesson.surah) ? (
          <Text style={[styles.basmala, { fontFamily: quranFonts[script] }]} accessibilityLanguage="ar">
            {displayText(basmala(script), script)}
          </Text>
        ) : null}

        {shown.map((v) => {
          const level: HideLevel =
            step === 'recite' ? hideLevel : step === 'join' ? (peeking.has(v.number) ? 0 : 3) : step === 'check' ? (revealed ? 0 : 3) : 0;
          return (
            <VerseBlock
              key={v.number}
              verse={v}
              script={script}
              highlighted={paged && v.number === highlighted}
              hideLevel={level}
              showMeaning={meaningVisible}
              onPress={
                step === 'join'
                  ? () =>
                      setPeeking((prev) => {
                        const next = new Set(prev);
                        if (next.has(v.number)) next.delete(v.number);
                        else next.add(v.number);
                        return next;
                      })
                  : paged
                    ? () => setFocus(v.number)
                    : undefined
              }
            />
          );
        })}

        {paged && pages.length > 1 ? (
          <View style={styles.pager}>
            <Button label="Previous verses" kind="secondary" disabled={page === 0} onPress={() => { setPageIndex(page - 1); setFocus(null); }} style={{ flex: 1 }} />
            <Button label="More verses" kind="secondary" disabled={page === pages.length - 1} onPress={() => { setPageIndex(page + 1); setFocus(null); }} style={{ flex: 1 }} />
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          {paged ? (
            <Stepper
              label="Verses on screen"
              value={state.settings.versesPerScreen}
              min={1}
              max={10}
              onChange={(versesPerScreen) => {
                updateSettings({ versesPerScreen });
                setPageIndex(0);
              }}
            />
          ) : null}
          {step === 'listen' || step === 'read' ? (
            <Pressable accessibilityRole="switch" accessibilityState={{ checked: showMeaning }} onPress={() => setShowMeaning((m) => !m)} style={styles.toggle}>
              <Text style={styles.toggleLabel}>English meaning</Text>
              <View style={[styles.switch, showMeaning && styles.switchOn]}>
                <View style={[styles.knob, showMeaning && styles.knobOn]} />
              </View>
            </Pressable>
          ) : null}
        </View>
      </Card>

      {(step === 'listen' || step === 'read') && shown.length > 0
        ? notesFor(lesson.surah, shown[0].number, shown[shown.length - 1].number).map((note) => (
            <View key={`${note.surah}:${note.from}`} style={styles.note}>
              <Text style={styles.noteLabel}>
                {note.kind === 'reason' ? 'REASON FOR REVELATION' : 'BACKGROUND'} · VERSES {note.from === note.to ? note.from : `${note.from}–${note.to}`}
              </Text>
              <Text style={styles.noteText}>
                {note.text.split('ﷺ').map((part, i) => (
                  <Text key={i}>
                    {i > 0 ? <Text style={styles.salawat}>ﷺ</Text> : null}
                    {part}
                  </Text>
                ))}
              </Text>
              <Text style={text.small}>Source: {note.source}</Text>
            </View>
          ))
        : null}

      {step === 'listen' ? (
        <View style={styles.player}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <HeadphonesIcon color={colors.goldSoft} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.playerTitle}>Recitation audio is coming soon</Text>
              <Text style={styles.playerSub}>Until then, listen to a recitation you trust. Count each full listen here.</Text>
            </View>
          </View>
          <View style={styles.listenRow}>
            <Text style={styles.playerTitle} accessibilityLiveRegion="polite">
              Listened {listens} of {LISTEN_TARGET}
            </Text>
            <Button label="I listened once" kind="onDeep" onPress={() => setListens((n) => n + 1)} />
          </View>
        </View>
      ) : null}

      {step === 'recite' ? (
        <View style={styles.hideRow}>
          <Button label="Show more" kind="secondary" disabled={hideLevel === 0} onPress={() => setHideLevel((l) => Math.max(0, l - 1) as HideLevel)} style={{ flex: 1 }} />
          <Button label="Hide more" kind="secondary" disabled={hideLevel === 3} onPress={() => setHideLevel((l) => Math.min(3, l + 1) as HideLevel)} style={{ flex: 1 }} />
        </View>
      ) : null}

      {step === 'check' ? (
        <View style={{ gap: 12, marginTop: 16 }}>
          {!revealed ? (
            <Button label="I've recited it. Show the text" onPress={() => setRevealed(true)} />
          ) : (
            <>
              <Text style={[text.heading, { paddingHorizontal: 4 }]}>How did it go?</Text>
              <View style={styles.ratingRow}>
                <Button label="Strong" onPress={() => rate('strong')} style={{ flex: 1 }} />
                <Button label="Some mistakes" kind="secondary" onPress={() => rate('some')} style={{ flex: 1 }} />
                <Button label="Forgot" kind="secondary" onPress={() => rate('forgot')} style={{ flex: 1 }} />
              </View>
            </>
          )}
        </View>
      ) : null}

      <Text style={styles.credit}>
        Quran text: {script === 'uthmani' ? SOURCES.arabic : SOURCES.indopak}. {SOURCES.english}.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 16, paddingBottom: 8 },
  steps: { flexDirection: 'row', gap: 6, paddingTop: 8 },
  stepBar: { height: 4, borderRadius: 2 },
  stepName: { fontFamily: fonts.medium, fontSize: 11, color: colors.muted },
  stepNameActive: { fontFamily: fonts.bold, color: colors.accent },
  versesCard: { marginTop: 12, paddingVertical: 20, gap: 6 },
  basmala: {
    fontFamily: fonts.quran,
    fontSize: 22,
    lineHeight: 44,
    textAlign: 'center',
    color: colors.accent,
    writingDirection: 'rtl',
  },
  pager: { flexDirection: 'row', gap: 8, marginTop: 6 },
  note: { marginTop: 12, backgroundColor: colors.teal, borderRadius: radius.item, padding: 18, gap: 8 },
  noteLabel: { fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 0.6, color: colors.accent },
  noteText: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 24, color: colors.body },
  // The serif font has no ﷺ glyph, so it is drawn in the Quran font.
  salawat: { fontFamily: fonts.quran, fontSize: 18 },
  cardFooter: { marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.line, gap: 4 },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  toggleLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.body },
  switch: { width: 46, height: 28, borderRadius: 14, backgroundColor: colors.border, padding: 3 },
  switchOn: { backgroundColor: colors.accent },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF' },
  knobOn: { transform: [{ translateX: 18 }] },
  player: { marginTop: 12, backgroundColor: colors.deep, borderRadius: radius.card, padding: 18, gap: 14 },
  playerTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.onDeep },
  playerSub: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: colors.onDeepMuted },
  listenRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  hideRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  ratingRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  footerRow: { flexDirection: 'row', gap: 10, paddingTop: 10 },
  credit: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 16, color: colors.muted, textAlign: 'center', paddingTop: 16 },
});
