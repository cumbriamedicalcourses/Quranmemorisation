/// <reference types="node" />
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  INTERVALS,
  addDays,
  daysBetween,
  newPortion,
  olderCycleDays,
  planDay,
  review,
  type Portion,
} from './schedule.ts';

const lesson = { surah: 112, from: 1, to: 3, lines: 1 };

test('dates add and subtract across month and year ends', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(daysBetween('2026-10-27', '2026-11-03'), 7);
});

test('a new portion is first reviewed the next day', () => {
  const p = newPortion(lesson, '2026-10-27');
  assert.equal(p.step, 0);
  assert.equal(p.due, '2026-10-28');
  assert.equal(p.id, '112:1-3');
});

test('strong ratings walk through every interval, then join the older cycle', () => {
  let p = newPortion(lesson, '2026-01-01');
  let day = p.due;
  const gaps: number[] = [];
  for (let i = 0; i < INTERVALS.length + 1; i++) {
    const next = review(p, 'strong', day, 21);
    gaps.push(daysBetween(day, next.due));
    p = next;
    day = p.due;
  }
  assert.deepEqual(gaps, [2, 4, 7, 14, 30, 21, 21]);
});

test('some mistakes repeats the same interval', () => {
  const p: Portion = { ...newPortion(lesson, '2026-01-01'), step: 3 };
  const next = review(p, 'some', '2026-01-10', 21);
  assert.equal(next.step, 3);
  assert.equal(next.due, '2026-01-17');
});

test('forgot goes back to one day and recent revision', () => {
  const p: Portion = { ...newPortion(lesson, '2026-01-01'), step: 6 };
  const next = review(p, 'forgot', '2026-03-01', 30);
  assert.equal(next.step, 0);
  assert.equal(next.due, '2026-03-02');
});

test('the older cycle lengthens as more is memorised, within its limits', () => {
  assert.equal(olderCycleDays(5, 20), 7);
  assert.equal(olderCycleDays(100, 20), 15);
  assert.equal(olderCycleDays(10_000, 20), 90);
});

test('a normal day has a new lesson and splits due portions into recent and older', () => {
  const recent: Portion = { ...newPortion(lesson, '2026-01-01'), step: 1, due: '2026-01-05' };
  const older: Portion = { ...newPortion({ ...lesson, surah: 114 }, '2025-11-01'), step: 6, due: '2026-01-05' };
  const notDue: Portion = { ...newPortion({ ...lesson, surah: 113 }, '2026-01-04'), due: '2026-01-06' };
  const plan = planDay({
    portions: [recent, older, notDue],
    today: '2026-01-05',
    dailyMinutes: 20,
    lastActive: '2026-01-04',
    hasNextLesson: true,
  });
  assert.equal(plan.reason, 'normal');
  assert.equal(plan.newLesson, true);
  assert.deepEqual(plan.recent.map((p) => p.surah), [112]);
  assert.deepEqual(plan.older.map((p) => p.surah), [114]);
  assert.equal(plan.revisionMinutes, 3);
});

test('too much revision makes a revision-only day', () => {
  const heavy: Portion = { ...newPortion({ ...lesson, lines: 20 }, '2026-01-01'), due: '2026-01-02' };
  const plan = planDay({ portions: [heavy], today: '2026-01-02', dailyMinutes: 20, lastActive: '2026-01-01', hasNextLesson: true });
  assert.equal(plan.reason, 'too-much-revision');
  assert.equal(plan.newLesson, false);
});

test('missing three days in a row makes a catch-up day', () => {
  const plan = planDay({ portions: [], today: '2026-01-10', dailyMinutes: 20, lastActive: '2026-01-06', hasNextLesson: true });
  assert.equal(plan.reason, 'catch-up');
  assert.equal(plan.newLesson, false);
  const after2 = planDay({ portions: [], today: '2026-01-09', dailyMinutes: 20, lastActive: '2026-01-06', hasNextLesson: true });
  assert.equal(after2.reason, 'normal');
});
