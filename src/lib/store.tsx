import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { estimateLines, nextLesson, type LessonRef } from './quran';
import { addDays, isOlder, newPortion, olderCycleDays, review, type Day, type Portion, type Rating } from './schedule';

export type Script = 'uthmani' | 'indopak';

export interface Settings {
  name: string;
  script: Script;
  versesPerDay: number;
  versesPerScreen: number;
  dailyMinutes: number;
}

export interface AppState {
  onboarded: boolean;
  settings: Settings;
  portions: Portion[];
  /** The last lesson learned, so the next one follows on from it. */
  lastLesson: LessonRef | null;
  /** Days on which the student finished something, newest last; kept to 60. */
  activeDays: Day[];
}

export const DEFAULT_SETTINGS: Settings = {
  name: '',
  script: 'uthmani',
  versesPerDay: 3,
  versesPerScreen: 3,
  dailyMinutes: 20,
};

const INITIAL_STATE: AppState = {
  onboarded: false,
  settings: DEFAULT_SETTINGS,
  portions: [],
  lastLesson: null,
  activeDays: [],
};

const STORAGE_KEY = 'quran-memorisation:state:v1';

export function today(): Day {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function markActive(activeDays: Day[], day: Day): Day[] {
  if (activeDays[activeDays.length - 1] === day) return activeDays;
  return [...activeDays, day].slice(-60);
}

interface Store {
  state: AppState;
  loaded: boolean;
  upcomingLesson: LessonRef | null;
  updateSettings: (changes: Partial<Settings>) => void;
  finishOnboarding: (settings: Settings) => void;
  completeNewLesson: (lesson: LessonRef, rating: Rating) => void;
  completeReview: (portionId: string, rating: Rating) => void;
  resetProgress: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw) as AppState;
          setState({ ...INITIAL_STATE, ...saved, settings: { ...DEFAULT_SETTINGS, ...saved.settings } });
        }
      })
      .catch(() => {
        // Unreadable storage: start fresh rather than block the app.
      })
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, loaded]);

  const updateSettings = useCallback((changes: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...changes } }));
  }, []);

  const finishOnboarding = useCallback((settings: Settings) => {
    setState((s) => ({ ...s, onboarded: true, settings }));
  }, []);

  const completeNewLesson = useCallback((lesson: LessonRef, _rating: Rating) => {
    // Whatever the first rating, a new lesson comes back tomorrow; the rating
    // starts to move it once it is reviewed.
    const day = today();
    setState((s) => ({
      ...s,
      portions: [...s.portions, newPortion({ ...lesson, lines: estimateLines(lesson) }, day)],
      lastLesson: lesson,
      activeDays: markActive(s.activeDays, day),
    }));
  }, []);

  const completeReview = useCallback((portionId: string, rating: Rating) => {
    const day = today();
    setState((s) => {
      const olderLines = s.portions.filter(isOlder).reduce((sum, p) => sum + p.lines, 0);
      const cycle = olderCycleDays(olderLines, s.settings.dailyMinutes);
      return {
        ...s,
        portions: s.portions.map((p) => (p.id === portionId ? review(p, rating, day, cycle) : p)),
        activeDays: markActive(s.activeDays, day),
      };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setState((s) => ({ ...s, portions: [], lastLesson: null, activeDays: [] }));
  }, []);

  const upcomingLesson = useMemo(
    () => nextLesson(state.lastLesson, state.settings.versesPerDay),
    [state.lastLesson, state.settings.versesPerDay],
  );

  const value = useMemo(
    () => ({ state, loaded, upcomingLesson, updateSettings, finishOnboarding, completeNewLesson, completeReview, resetProgress }),
    [state, loaded, upcomingLesson, updateSettings, finishOnboarding, completeNewLesson, completeReview, resetProgress],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}

/** Consecutive active days ending today or yesterday. */
export function currentStreak(activeDays: Day[], day: Day): number {
  const set = new Set(activeDays);
  let streak = 0;
  let cursor = set.has(day) ? day : addDays(day, -1);
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
