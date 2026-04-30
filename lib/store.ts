"use client";

import { AppState, DEFAULT_STATE, HabitCompletion } from "./types";

const KEY = "pt_state";

export function loadState(): AppState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function updateState(patch: Partial<AppState>): AppState {
  const current = loadState();
  const next = { ...current, ...patch };
  saveState(next);
  return next;
}

// Returns today's date as YYYY-MM-DD
export function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function getTodayCompletions(state: AppState): HabitCompletion[] {
  return state.completions.filter((c) => c.date === today());
}

export function isHabitDoneToday(state: AppState, habitId: string): boolean {
  return getTodayCompletions(state).some(
    (c) => c.habitId === habitId && c.completed
  );
}

export function toggleHabitCompletion(
  state: AppState,
  habitId: string
): AppState {
  const d = today();
  const existing = state.completions.find(
    (c) => c.habitId === habitId && c.date === d
  );

  let completions: HabitCompletion[];
  if (existing) {
    completions = state.completions.map((c) =>
      c.habitId === habitId && c.date === d
        ? { ...c, completed: !c.completed }
        : c
    );
  } else {
    completions = [
      ...state.completions,
      { habitId, date: d, completed: true },
    ];
  }

  const todayDone = completions.filter(
    (c) => c.date === d && c.completed
  ).length;
  const threshold = Math.ceil(state.habits.length * 0.78); // 7/9 rule
  const streak = recalcStreak(state, completions, threshold);

  return updateState({ completions, streak, lastActiveDate: d });
}

function recalcStreak(
  state: AppState,
  completions: HabitCompletion[],
  threshold: number
): number {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const dateStr = d.toISOString().split("T")[0];
    const done = completions.filter(
      (c) => c.date === dateStr && c.completed
    ).length;
    if (done >= threshold) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function getDayCompletionRate(
  state: AppState,
  date: string
): number {
  if (state.habits.length === 0) return 0;
  const done = state.completions.filter(
    (c) => c.date === date && c.completed
  ).length;
  return done / state.habits.length;
}

// Returns last N days of completion rates for sparkline
export function getWeeklyRates(state: AppState, days = 7): number[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return getDayCompletionRate(state, d.toISOString().split("T")[0]);
  });
}
