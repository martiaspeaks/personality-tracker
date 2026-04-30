"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TRAIT_COLORS,
  TRAIT_LABELS,
  TraitKey,
  Habit,
  AppState,
} from "@/lib/types";
import {
  loadState,
  toggleHabitCompletion,
  isHabitDoneToday,
  getTodayCompletions,
  today,
} from "@/lib/store";

const TIME_ORDER = ["morning", "day", "evening"] as const;
const TIME_LABELS = { morning: "Morning", day: "Daytime", evening: "Evening" };

export default function Dashboard() {
  const router = useRouter();
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    const s = loadState();
    if (!s.onboardingComplete) {
      router.replace("/onboarding");
      return;
    }
    setState(s);
  }, [router]);

  const handleToggle = useCallback(
    (habitId: string) => {
      const next = toggleHabitCompletion(loadState(), habitId);
      setState({ ...next });
    },
    []
  );

  if (!state) return <Spinner />;

  const { habits, archetype, streak } = state;
  const todayDone = getTodayCompletions(state).filter((c) => c.completed).length;
  const total = habits.length;
  const pct = total > 0 ? Math.round((todayDone / total) * 100) : 0;
  const accentColor = archetype
    ? TRAIT_COLORS[archetype.primaryTrait]
    : "#7F77DD";

  const grouped = TIME_ORDER.map((t) => ({
    time: t,
    habits: habits.filter((h) => h.timeOfDay === t),
  }));

  // Find the trait with lowest completion this week
  const traitCompletion = computeTraitCompletion(state);
  const weakestTrait = traitCompletion.sort((a, b) => a.rate - b.rate)[0];

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-tertiary uppercase tracking-widest">
            {formatDay()}
          </p>
          <h1 className="text-2xl font-semibold text-text-primary mt-1">
            Today
          </h1>
          {archetype && (
            <p className="text-sm mt-0.5" style={{ color: accentColor }}>
              {archetype.name}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <CompletionRing pct={pct} accent={accentColor} />
          {streak > 0 && (
            <p className="text-xs text-text-tertiary">{streak}d streak</p>
          )}
        </div>
      </div>

      {/* Score hero */}
      <div
        className="rounded-3xl p-5"
        style={{ background: accentColor + "18", border: `1px solid ${accentColor}28` }}
      >
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold text-text-primary">{pct}%</span>
          <span className="text-sm text-text-secondary">today</span>
        </div>
        {weakestTrait && (
          <p className="text-xs text-text-secondary mt-2 leading-relaxed">
            Focus on{" "}
            <span style={{ color: TRAIT_COLORS[weakestTrait.trait] }}>
              {TRAIT_LABELS[weakestTrait.trait]}
            </span>{" "}
            — your completion this week is{" "}
            {Math.round(weakestTrait.rate * 100)}%.
          </p>
        )}
      </div>

      {/* Habit groups */}
      {grouped.map(({ time, habits: group }) =>
        group.length === 0 ? null : (
          <div key={time}>
            <p className="text-xs uppercase tracking-widest text-text-tertiary mb-3">
              {TIME_LABELS[time]}
            </p>
            <HabitBento
              habits={group}
              state={state}
              onToggle={handleToggle}
            />
          </div>
        )
      )}

      {/* Bottom nav */}
      <BottomNav />
    </div>
  );
}

// ── Habit Bento Grid ───────────────────────────────────────────────────────────

function HabitBento({
  habits,
  state,
  onToggle,
}: {
  habits: Habit[];
  state: AppState;
  onToggle: (id: string) => void;
}) {
  // First habit gets full width, rest split
  return (
    <div className="flex flex-col gap-2">
      {habits.map((h, i) => {
        const done = isHabitDoneToday(state, h.id);
        return (
          <HabitCard
            key={h.id}
            habit={h}
            done={done}
            wide={i === 0}
            onToggle={() => onToggle(h.id)}
          />
        );
      })}
    </div>
  );
}

function HabitCard({
  habit,
  done,
  wide,
  onToggle,
}: {
  habit: Habit;
  done: boolean;
  wide: boolean;
  onToggle: () => void;
}) {
  const color = TRAIT_COLORS[habit.trait as TraitKey];

  return (
    <div
      className="rounded-2xl p-4 flex items-start justify-between gap-3 transition-all cursor-pointer active:scale-[0.98]"
      style={{
        background: done ? color + "22" : "#1A1A1A",
        border: `1px solid ${done ? color + "44" : "#2A2A2A"}`,
        minHeight: wide ? 88 : 72,
      }}
      onClick={onToggle}
    >
      <div className="flex-1 min-w-0">
        <Link
          href={`/habit/${habit.id}`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm font-medium text-text-primary hover:underline line-clamp-2"
        >
          {habit.title}
        </Link>
        <p className="text-xs text-text-secondary mt-1 line-clamp-1">
          {habit.subtitle}
        </p>
        <div
          className="inline-block text-xs px-2 py-0.5 rounded-full mt-2"
          style={{ background: color + "22", color }}
        >
          {TRAIT_LABELS[habit.trait as TraitKey]}
        </div>
      </div>

      {/* Completion dot */}
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center transition-all"
        style={{
          background: done ? color : "transparent",
          border: `2px solid ${done ? color : "#3A3A3A"}`,
        }}
      >
        {done && (
          <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
            <path
              d="M1 4L4.5 7.5L11 1"
              stroke="#0E0E0E"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </div>
  );
}

// ── Completion Ring ────────────────────────────────────────────────────────────

function CompletionRing({ pct, accent }: { pct: number; accent: string }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#2A2A2A" strokeWidth="4" />
      <circle
        cx="28"
        cy="28"
        r={r}
        fill="none"
        stroke={accent}
        strokeWidth="4"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 28 28)"
        style={{ transition: "stroke-dashoffset 0.6s ease" }}
      />
      <text
        x="28"
        y="33"
        textAnchor="middle"
        fontSize="11"
        fontWeight="600"
        fill="#F0F0F0"
      >
        {pct}%
      </text>
    </svg>
  );
}

// ── Bottom Nav ─────────────────────────────────────────────────────────────────

function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 pb-6 pt-3 bg-gradient-to-t from-bg to-transparent">
      <div className="bg-surface rounded-2xl border border-border flex items-center justify-around py-3 px-6">
        <NavItem href="/dashboard" label="Today" active>
          <GridIcon />
        </NavItem>
        <NavItem href="/review" label="Review">
          <ChatIcon />
        </NavItem>
        <NavItem href="/progress" label="Progress">
          <ChartIcon />
        </NavItem>
      </div>
    </div>
  );
}

function NavItem({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 ${
        active ? "text-text-primary" : "text-text-tertiary"
      }`}
    >
      {children}
      <span className="text-xs">{label}</span>
    </Link>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function computeTraitCompletion(state: AppState) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return (["O", "C", "E", "A", "N"] as TraitKey[]).map((trait) => {
    const traitHabits = state.habits.filter((h) => h.trait === trait);
    if (traitHabits.length === 0) return { trait, rate: 1 };

    const possible = traitHabits.length * 7;
    const done = state.completions.filter((c) => {
      const d = new Date(c.date);
      return (
        d >= sevenDaysAgo &&
        c.completed &&
        traitHabits.some((h) => h.id === c.habitId)
      );
    }).length;

    return { trait, rate: possible > 0 ? done / possible : 0 };
  });
}

function formatDay(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1" y="1" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10" y="1" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="10" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="10" y="10" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M9 1.5C4.858 1.5 1.5 4.358 1.5 7.875c0 1.89.9 3.585 2.34 4.77L3 16.5l4.14-1.755A8.43 8.43 0 0 0 9 15c4.142 0 7.5-2.858 7.5-6.375S13.142 1.5 9 1.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M1.5 16.5h15M4.5 16.5V10.5M8.25 16.5V6.75M12 16.5V9M15.75 16.5V3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
