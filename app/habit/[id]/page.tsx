"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { TRAIT_COLORS, TRAIT_LABELS, TraitKey, Habit, AppState } from "@/lib/types";
import { loadState, toggleHabitCompletion, isHabitDoneToday } from "@/lib/store";

export default function HabitDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [state, setState] = useState<AppState | null>(null);
  const [habit, setHabit] = useState<Habit | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);

  useEffect(() => {
    const s = loadState();
    if (!s.onboardingComplete) { router.replace("/onboarding"); return; }
    const h = s.habits.find((h) => h.id === id) ?? null;
    if (!h) { router.replace("/dashboard"); return; }
    setState(s);
    setHabit(h);
  }, [id, router]);

  if (!state || !habit) return <Spinner />;

  const color = TRAIT_COLORS[habit.trait as TraitKey];
  const done = isHabitDoneToday(state, habit.id);

  // Last 30 days completion
  const last30 = getLast30(state, habit.id);

  function handleToggle() {
    const next = toggleHabitCompletion(loadState(), habit!.id);
    setState({ ...next });
  }

  function handleSwap(newTitle: string) {
    const s = loadState();
    const updated = s.habits.map((h) =>
      h.id === habit!.id ? { ...h, title: newTitle, alternatives: habit!.alternatives } : h
    );
    const next = { ...s, habits: updated };
    import("@/lib/store").then(({ saveState }) => saveState(next));
    setState(next);
    setHabit((h) => h ? { ...h, title: newTitle } : h);
    setSwapOpen(false);
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-text-secondary"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </button>

      {/* Hero */}
      <div
        className="rounded-3xl p-6"
        style={{ background: color + "18", border: `1px solid ${color}28` }}
      >
        <div
          className="text-xs uppercase tracking-widest mb-2"
          style={{ color }}
        >
          {TRAIT_LABELS[habit.trait as TraitKey]} · {habit.timeOfDay}
        </div>
        <h1 className="text-2xl font-bold text-text-primary leading-tight mb-1">
          {habit.title}
        </h1>
        <p className="text-sm text-text-secondary">{habit.subtitle}</p>

        <div className="flex gap-3 mt-4">
          <button
            onClick={handleToggle}
            className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
            style={{
              background: done ? color : color + "33",
              color: done ? "#0E0E0E" : color,
            }}
          >
            {done ? "✓ Done today" : "Mark done"}
          </button>
          <button
            onClick={() => setSwapOpen(!swapOpen)}
            className="px-4 py-3 rounded-xl text-sm text-text-secondary bg-surface border border-border"
          >
            Swap
          </button>
        </div>
      </div>

      {/* Swap panel */}
      {swapOpen && (
        <div className="bg-surface rounded-2xl border border-border p-4">
          <p className="text-xs uppercase tracking-widest text-text-tertiary mb-3">
            Alternative habits
          </p>
          <div className="flex flex-col gap-2">
            {habit.alternatives.map((alt, i) => (
              <button
                key={i}
                onClick={() => handleSwap(alt)}
                className="text-left text-sm text-text-secondary py-2 px-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors"
              >
                {alt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Execution guide */}
      <div className="bg-surface rounded-2xl border border-border p-5">
        <p className="text-xs uppercase tracking-widest text-text-tertiary mb-3">
          How to do it
        </p>
        <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
          {habit.guide}
        </div>
      </div>

      {/* Framework */}
      <div className="bg-surface rounded-2xl border border-border p-5">
        <p className="text-xs uppercase tracking-widest text-text-tertiary mb-2">
          Framework
        </p>
        <p className="text-sm font-medium text-text-primary">{habit.framework}</p>
        <p className="text-xs text-text-tertiary mt-1">
          This habit is grounded in {habit.framework} principles targeting{" "}
          {TRAIT_LABELS[habit.trait as TraitKey]}.
        </p>
      </div>

      {/* 30-day grid */}
      <div className="bg-surface rounded-2xl border border-border p-5">
        <p className="text-xs uppercase tracking-widest text-text-tertiary mb-3">
          Last 30 days
        </p>
        <div className="grid grid-cols-10 gap-1.5">
          {last30.map((done, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-md"
              style={{
                background: done ? color + "CC" : "#2A2A2A",
              }}
            />
          ))}
        </div>
        <p className="text-xs text-text-tertiary mt-3">
          {last30.filter(Boolean).length} / 30 days completed
        </p>
      </div>
    </div>
  );
}

function getLast30(state: AppState, habitId: string): boolean[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const dateStr = d.toISOString().split("T")[0];
    return state.completions.some(
      (c) => c.habitId === habitId && c.date === dateStr && c.completed
    );
  });
}

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
    </div>
  );
}
