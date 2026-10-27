// The memorisation and revision schedule, as set out in the course design doc.
//
// Every day's lesson becomes a portion with its own strength (step) and its
// own next review date. Self-ratings move it along INTERVALS; once it has
// passed them all it joins the older-revision cycle, whose length grows with
// the amount memorised so that each day's revision fits the student's time.
//
// Load is measured in Mushaf lines (estimated from letter counts) rather than
// verses, because verses vary greatly in length.
//
// All the numbers here are a starting proposal for a hifz teacher to review.
// This file has no imports so it can be unit tested on its own.

export type Rating = 'strong' | 'some' | 'forgot';

/** A calendar date in the student's time zone, as YYYY-MM-DD. */
export type Day = string;

export interface Portion {
  id: string;
  surah: number;
  from: number;
  to: number;
  /** Estimated length in Mushaf lines. */
  lines: number;
  learnedOn: Day;
  /** Index into INTERVALS; INTERVALS.length or more means the older-revision cycle. */
  step: number;
  due: Day;
  lastReviewed?: Day;
}

/** Days until the next review after each successful step. */
export const INTERVALS = [1, 2, 4, 7, 14, 30];
/** Portions below this step are recent revision (sabqi); the rest are older revision (manzil). */
export const RECENT_STEPS = 4;
/** Starting estimates for planning a day, in minutes per Mushaf line. */
export const NEW_MINUTES_PER_LINE = 6;
export const REVISION_MINUTES_PER_LINE = 1.5;
export const MIN_NEW_LESSON_MINUTES = 5;
/** Share of the daily time that older revision may take up. */
export const OLDER_SHARE_OF_DAY = 0.5;
export const MIN_CYCLE_DAYS = 7;
export const MAX_CYCLE_DAYS = 90;
/** Missing this many days in a row triggers a catch-up day with no new lesson. */
export const MISSED_DAYS_FOR_CATCH_UP = 3;

export function addDays(day: Day, days: number): Day {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

export function daysBetween(from: Day, to: Day): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

export function revisionMinutes(lines: number): number {
  return lines * REVISION_MINUTES_PER_LINE;
}

export function newLessonMinutes(lines: number): number {
  return Math.max(MIN_NEW_LESSON_MINUTES, lines * NEW_MINUTES_PER_LINE);
}

/** How many days the older-revision cycle lasts, given everything in it and the daily time. */
export function olderCycleDays(olderLines: number, dailyMinutes: number): number {
  const linesPerDay = (dailyMinutes * OLDER_SHARE_OF_DAY) / REVISION_MINUTES_PER_LINE;
  if (linesPerDay <= 0) return MAX_CYCLE_DAYS;
  const days = Math.ceil(olderLines / linesPerDay);
  return Math.min(MAX_CYCLE_DAYS, Math.max(MIN_CYCLE_DAYS, days));
}

export function isOlder(portion: Portion): boolean {
  return portion.step >= RECENT_STEPS;
}

/** A newly learned portion: first review tomorrow. */
export function newPortion(
  lesson: { surah: number; from: number; to: number; lines: number },
  today: Day,
): Portion {
  return {
    id: `${lesson.surah}:${lesson.from}-${lesson.to}`,
    ...lesson,
    learnedOn: today,
    step: 0,
    due: addDays(today, INTERVALS[0]),
  };
}

/**
 * Applies a self-rating after a review.
 * Strong moves to the next interval, Some mistakes repeats the same one,
 * Forgot goes back to 1 day and returns to recent revision.
 */
export function review(portion: Portion, rating: Rating, today: Day, cycleDays: number): Portion {
  let step = portion.step;
  if (rating === 'strong') step = Math.min(step + 1, INTERVALS.length);
  if (rating === 'forgot') step = 0;
  const interval = step < INTERVALS.length ? INTERVALS[step] : cycleDays;
  return { ...portion, step, due: addDays(today, interval), lastReviewed: today };
}

export type PlanReason = 'normal' | 'too-much-revision' | 'catch-up' | 'course-finished';

export interface DayPlan {
  recent: Portion[];
  older: Portion[];
  /** Whether today should include a new lesson. */
  newLesson: boolean;
  reason: PlanReason;
  revisionMinutes: number;
}

/**
 * Plans a day: which portions are due, split into recent and older revision,
 * and whether there is room for a new lesson.
 */
export function planDay(params: {
  portions: Portion[];
  today: Day;
  dailyMinutes: number;
  lastActive?: Day;
  hasNextLesson: boolean;
}): DayPlan {
  const { portions, today, dailyMinutes, lastActive, hasNextLesson } = params;
  const due = portions
    .filter((p) => p.due <= today)
    .sort((a, b) => (a.due === b.due ? a.surah - b.surah : a.due < b.due ? -1 : 1));
  const recent = due.filter((p) => !isOlder(p));
  const older = due.filter(isOlder);
  const minutes = due.reduce((sum, p) => sum + revisionMinutes(p.lines), 0);

  let reason: PlanReason = 'normal';
  if (!hasNextLesson) reason = 'course-finished';
  else if (lastActive && daysBetween(lastActive, today) - 1 >= MISSED_DAYS_FOR_CATCH_UP) reason = 'catch-up';
  else if (minutes > dailyMinutes) reason = 'too-much-revision';

  return { recent, older, newLesson: reason === 'normal', reason, revisionMinutes: minutes };
}
