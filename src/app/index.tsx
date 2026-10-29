import { Redirect, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { BookIcon, PlusIcon, ReviseIcon, SettingsIcon } from '@/components/icons';
import { IconButton, Screen, text } from '@/components/ui';
import { COURSE_ORDER, describeLesson, estimateLines, getSurah, juzOf, type Juz } from '@/lib/quran';
import { addDays, newLessonMinutes, planDay, revisionMinutes, type Portion } from '@/lib/schedule';
import { currentStreak, today, useStore } from '@/lib/store';
import { colors, fonts, radius } from '@/theme';

function memorisedSurahs(portions: Portion[], juz: Juz): number {
  const covered = new Map<number, Set<number>>();
  for (const p of portions) {
    const set = covered.get(p.surah) ?? new Set<number>();
    for (let v = p.from; v <= p.to; v++) set.add(v);
    covered.set(p.surah, set);
  }
  return COURSE_ORDER.filter((n) => n >= juz.first && n <= juz.last && (covered.get(n)?.size ?? 0) === getSurah(n).verses.length).length;
}

function formatDate(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
}

const REASON_TEXT = {
  'too-much-revision': 'Revision day. You have more revision due than your daily time, so there is no new lesson today.',
  'catch-up': 'Welcome back. Today is a catch-up day: revise what is due before starting anything new.',
  'course-finished': 'You have completed every lesson in the course so far. Keep revising to hold it firmly.',
} as const;

export default function TodayScreen() {
  const router = useRouter();
  const { state, upcomingLesson } = useStore();
  const day = today();

  const plan = useMemo(
    () =>
      planDay({
        portions: state.portions,
        today: day,
        dailyMinutes: state.settings.dailyMinutes,
        lastActive: state.activeDays[state.activeDays.length - 1],
        hasNextLesson: upcomingLesson !== null,
      }),
    [state.portions, state.settings.dailyMinutes, state.activeDays, upcomingLesson, day],
  );

  if (!state.onboarded) return <Redirect href="/welcome" />;

  // Progress is shown for the juz the student is working on now.
  const lastSurah = state.lastLesson?.surah ?? COURSE_ORDER[0];
  const juz = juzOf(upcomingLesson?.surah ?? lastSurah);
  const total = juz.last - juz.first + 1;
  const done = memorisedSurahs(state.portions, juz);
  const learnedToday = state.portions.some((p) => p.learnedOn === day);
  const showNewLesson = plan.newLesson && upcomingLesson && !learnedToday;
  const newMinutes = upcomingLesson ? newLessonMinutes(estimateLines(upcomingLesson)) : 0;
  const totalMinutes = Math.round(plan.revisionMinutes + (showNewLesson ? newMinutes : 0));
  const streak = currentStreak(state.activeDays, day);
  const lastSeven = Array.from({ length: 7 }, (_, i) => addDays(day, i - 6));

  const ringSize = 84;
  const r = 36;
  const circumference = 2 * Math.PI * r;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={text.small}>{formatDate(day)}</Text>
          <Text style={text.title}>Assalamu alaikum{state.settings.name ? `, ${state.settings.name}` : ''}</Text>
        </View>
        <IconButton label="Settings" onPress={() => router.push('/settings')}>
          <SettingsIcon color={colors.ink} />
        </IconButton>
      </View>

      <View style={styles.progress}>
        <View style={{ width: ringSize, height: ringSize }}>
          <Svg width={ringSize} height={ringSize} accessibilityLabel={`Juz ${juz.number}: ${done} of ${total} surahs memorised`}>
            <Circle cx={42} cy={42} r={r} stroke={colors.deepLine} strokeWidth={6} fill="none" />
            {done > 0 ? (
              <Circle
                cx={42}
                cy={42}
                r={r}
                stroke={colors.goldSoft}
                strokeWidth={6}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${(done / total) * circumference} ${circumference}`}
                transform="rotate(-90 42 42)"
              />
            ) : null}
          </Svg>
          <View style={styles.ringLabel}>
            <Text style={styles.ringText}>
              {done}/{total}
            </Text>
          </View>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.progressEyebrow}>JUZ {juz.number} · {juz.name.toUpperCase()}</Text>
          <Text style={styles.progressTitle}>
            {done === 1 ? '1 surah memorised' : `${done} surahs memorised`}
          </Text>
          <Text style={styles.progressSub}>
            {state.portions.length === 0
              ? 'Your journey starts with An-Nas'
              : state.portions.length === 1
                ? '1 lesson learned so far'
                : `${state.portions.length} lessons learned so far`}
          </Text>
        </View>
      </View>

      <View style={styles.planHeader}>
        <Text style={text.heading}>Today's plan</Text>
        {totalMinutes > 0 ? <Text style={text.small}>About {totalMinutes} min</Text> : null}
      </View>

      {plan.reason !== 'normal' ? (
        <View style={styles.notice}>
          <Text style={text.body}>{REASON_TEXT[plan.reason]}</Text>
        </View>
      ) : null}

      <View style={{ gap: 10 }}>
        {showNewLesson && upcomingLesson ? (
          <PlanItem
            tone="new"
            label="New lesson"
            title={describeLesson(upcomingLesson)}
            detail={`About ${Math.round(newMinutes)} min`}
            action="Start"
            onPress={() =>
              router.push({
                pathname: '/memorise',
                params: { mode: 'new', surah: upcomingLesson.surah, from: upcomingLesson.from, to: upcomingLesson.to },
              })
            }
          />
        ) : null}
        {learnedToday && plan.newLesson ? (
          <View style={styles.doneNote}>
            <Text style={text.body}>Today's new lesson is done. Well done.</Text>
          </View>
        ) : null}

        {plan.recent.map((p) => (
          <PlanItem
            key={p.id}
            tone="recent"
            label="Recent revision"
            title={describeLesson(p)}
            detail={`About ${Math.max(1, Math.round(revisionMinutes(p.lines)))} min`}
            onPress={() => router.push({ pathname: '/memorise', params: { mode: 'review', portion: p.id } })}
          />
        ))}
        {plan.older.map((p) => (
          <PlanItem
            key={p.id}
            tone="older"
            label="Older revision"
            title={describeLesson(p)}
            detail={`About ${Math.max(1, Math.round(revisionMinutes(p.lines)))} min`}
            onPress={() => router.push({ pathname: '/memorise', params: { mode: 'review', portion: p.id } })}
          />
        ))}
        {plan.recent.length === 0 && plan.older.length === 0 && state.portions.length > 0 ? (
          <Text style={[text.small, { paddingHorizontal: 4 }]}>No revision is due today.</Text>
        ) : null}
      </View>

      <View style={styles.streak}>
        <View style={{ gap: 2, flex: 1 }}>
          <Text style={styles.streakTitle}>
            {streak === 0 ? 'Start your streak today' : streak === 1 ? '1 day in a row' : `${streak} days in a row`}
          </Text>
          <Text style={text.small}>Keep your revision steady</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }} accessibilityLabel={`Active on ${lastSeven.filter((d) => state.activeDays.includes(d)).length} of the last 7 days`}>
          {lastSeven.map((d) => (
            <View key={d} style={[styles.dot, state.activeDays.includes(d) ? styles.dotOn : styles.dotOff]} />
          ))}
        </View>
      </View>
    </Screen>
  );
}

const TONES = {
  new: { color: colors.accent, soft: colors.verseHighlight, Icon: PlusIcon },
  recent: { color: colors.recent, soft: colors.recentSoft, Icon: ReviseIcon },
  older: { color: colors.older, soft: colors.olderSoft, Icon: BookIcon },
};

function PlanItem({
  tone,
  label,
  title,
  detail,
  action,
  onPress,
}: {
  tone: keyof typeof TONES;
  label: string;
  title: string;
  detail: string;
  action?: string;
  onPress: () => void;
}) {
  const { color, soft, Icon } = TONES[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${title}`}
      onPress={onPress}
      style={({ pressed }) => [styles.item, tone === 'new' && styles.itemShadow, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.itemIcon, { backgroundColor: soft }]}>
        <Icon color={color} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.itemLabel, { color }]}>{label}</Text>
        <Text style={styles.itemTitle}>{title}</Text>
        <Text style={text.small}>{detail}</Text>
      </View>
      {action ? (
        <View style={styles.itemAction}>
          <Text style={styles.itemActionText}>{action}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingTop: 20 },
  progress: {
    marginTop: 20,
    backgroundColor: colors.deep,
    borderRadius: radius.card,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  ringLabel: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  ringText: { fontFamily: fonts.bold, fontSize: 17, color: colors.onDeep },
  progressEyebrow: { fontFamily: fonts.medium, fontSize: 12, letterSpacing: 0.5, color: colors.onDeepMuted },
  progressTitle: { fontFamily: fonts.semibold, fontSize: 17, color: colors.onDeep },
  progressSub: { fontFamily: fonts.regular, fontSize: 13, color: colors.onDeepMuted },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 24, paddingBottom: 10, paddingHorizontal: 4 },
  notice: { backgroundColor: colors.teal, borderRadius: radius.item, padding: 16, marginBottom: 10 },
  doneNote: { backgroundColor: colors.teal, borderRadius: radius.item, padding: 16 },
  item: { backgroundColor: colors.surface, borderRadius: radius.item, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  itemShadow: { shadowColor: colors.ink, shadowOpacity: 0.05, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 1 },
  itemIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { fontFamily: fonts.semibold, fontSize: 12 },
  itemTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.ink },
  itemAction: { height: 36, paddingHorizontal: 16, borderRadius: 18, backgroundColor: colors.accent, justifyContent: 'center' },
  itemActionText: { fontFamily: fonts.semibold, fontSize: 13, color: '#FFFFFF' },
  streak: {
    marginTop: 16,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  streakTitle: { fontFamily: fonts.semibold, fontSize: 14, color: colors.ink },
  dot: { width: 10, height: 10, borderRadius: 5 },
  dotOn: { backgroundColor: colors.accent },
  dotOff: { borderWidth: 1.5, borderColor: '#9AABA4' },
});
