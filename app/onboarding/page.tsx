"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BigFiveScores,
  TRAIT_LABELS,
  TRAIT_COLORS,
  BENCHMARKS,
  TraitKey,
  Archetype,
  Habit,
} from "@/lib/types";
import { updateState } from "@/lib/store";
import { cn } from "@/lib/utils";

type Step = "scores" | "archetype" | "habits" | "done";

const TRAITS: TraitKey[] = ["O", "C", "E", "A", "N"];

const TRAIT_DESCRIPTIONS: Record<TraitKey, string> = {
  O: "Curiosity, creativity, and openness to new experiences",
  C: "Organization, discipline, and goal-directed behavior",
  E: "Energy, sociability, and positive engagement",
  A: "Empathy, cooperation, and consideration for others",
  N: "Emotional reactivity and sensitivity to stress (lower is better)",
};

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("scores");
  const [scores, setScores] = useState<BigFiveScores>({
    O: 50, C: 50, E: 50, A: 50, N: 50,
  });
  const [archetype, setArchetype] = useState<Archetype | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleScoresSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/archetype", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scores),
      });
      if (!res.ok) throw new Error("Failed to generate archetype");
      const data = await res.json();
      setArchetype(data);
      setStep("archetype");
    } catch (e) {
      setError("Couldn't reach AI. Check your API key in .env.local.");
    } finally {
      setLoading(false);
    }
  }

  async function handleArchetypeConfirm() {
    if (!archetype) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores, archetype }),
      });
      if (!res.ok) throw new Error("Failed to generate habits");
      const data = await res.json();
      setHabits(data.habits);
      setStep("habits");
    } catch (e) {
      setError("Couldn't generate habit stack. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleFinish() {
    if (!archetype) return;
    updateState({
      onboardingComplete: true,
      baselineScores: scores,
      archetype,
      habits,
      assessments: [
        {
          date: new Date().toISOString().split("T")[0],
          scores,
        },
      ],
    });
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6 pb-12">
      {step === "scores" && (
        <ScoreEntry
          scores={scores}
          onChange={setScores}
          onSubmit={handleScoresSubmit}
          loading={loading}
          error={error}
        />
      )}
      {step === "archetype" && archetype && (
        <ArchetypeReveal
          archetype={archetype}
          scores={scores}
          onConfirm={handleArchetypeConfirm}
          loading={loading}
          error={error}
        />
      )}
      {step === "habits" && (
        <HabitPreview
          habits={habits}
          onFinish={handleFinish}
        />
      )}
    </div>
  );
}

// ── Score Entry ────────────────────────────────────────────────────────────────

function ScoreEntry({
  scores,
  onChange,
  onSubmit,
  loading,
  error,
}: {
  scores: BigFiveScores;
  onChange: (s: BigFiveScores) => void;
  onSubmit: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <>
      <div>
        <p className="text-xs text-text-tertiary uppercase tracking-widest mb-1">
          Step 1 of 3
        </p>
        <h1 className="text-2xl font-semibold text-text-primary leading-tight">
          Your Big Five scores
        </h1>
        <p className="text-sm text-text-secondary mt-2">
          Enter your scores from any Big Five test (0–100 scale). If your test
          uses 1–5, multiply by 20.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {TRAITS.map((t) => {
          const gap =
            t === "N"
              ? scores[t] - BENCHMARKS[t]
              : BENCHMARKS[t] - scores[t];
          return (
            <div key={t}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-medium text-text-primary">
                    {TRAIT_LABELS[t]}
                  </span>
                  <p className="text-xs text-text-tertiary mt-0.5">
                    {TRAIT_DESCRIPTIONS[t]}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className="text-2xl font-semibold"
                    style={{ color: TRAIT_COLORS[t] }}
                  >
                    {scores[t]}
                  </span>
                  {gap > 0 && (
                    <p className="text-xs text-text-tertiary">
                      gap: {gap}
                    </p>
                  )}
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={scores[t]}
                onChange={(e) =>
                  onChange({ ...scores, [t]: Number(e.target.value) })
                }
                className="w-full"
                style={
                  {
                    background: `linear-gradient(to right, ${TRAIT_COLORS[t]} ${scores[t]}%, #2A2A2A ${scores[t]}%)`,
                  } as React.CSSProperties
                }
              />
              <div className="flex justify-between text-xs text-text-tertiary mt-1">
                <span>0</span>
                <span className="text-text-tertiary/60">
                  benchmark {BENCHMARKS[t]}
                </span>
                <span>100</span>
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-trait-N bg-trait-N/10 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full py-4 rounded-2xl bg-text-primary text-bg font-semibold text-sm disabled:opacity-50 transition-opacity"
      >
        {loading ? "Generating your archetype…" : "Build my profile →"}
      </button>
    </>
  );
}

// ── Archetype Reveal ───────────────────────────────────────────────────────────

function ArchetypeReveal({
  archetype,
  scores,
  onConfirm,
  loading,
  error,
}: {
  archetype: Archetype;
  scores: BigFiveScores;
  onConfirm: () => void;
  loading: boolean;
  error: string | null;
}) {
  const accentColor = TRAIT_COLORS[archetype.primaryTrait];

  return (
    <>
      <div>
        <p className="text-xs text-text-tertiary uppercase tracking-widest mb-1">
          Step 2 of 3
        </p>
        <h1 className="text-2xl font-semibold text-text-primary leading-tight">
          Your archetype
        </h1>
      </div>

      {/* Hero card */}
      <div
        className="rounded-3xl p-6"
        style={{ background: accentColor + "22", border: `1px solid ${accentColor}33` }}
      >
        <p className="text-xs uppercase tracking-widest mb-2" style={{ color: accentColor }}>
          {TRAIT_LABELS[archetype.primaryTrait]} gap
        </p>
        <h2 className="text-3xl font-bold text-text-primary leading-tight mb-2">
          {archetype.name}
        </h2>
        <p className="text-sm text-text-secondary">{archetype.tagline}</p>
      </div>

      {/* Gap analysis */}
      <div className="bg-surface rounded-2xl p-5 border border-border">
        <p className="text-xs uppercase tracking-widest text-text-tertiary mb-3">
          Gap analysis
        </p>
        <p className="text-sm text-text-secondary leading-relaxed">
          {archetype.gapAnalysis}
        </p>
      </div>

      {/* Score grid */}
      <div className="grid grid-cols-5 gap-2">
        {TRAITS.map((t) => {
          const gap =
            t === "N"
              ? scores[t] - BENCHMARKS[t]
              : BENCHMARKS[t] - scores[t];
          return (
            <div
              key={t}
              className="bg-surface rounded-xl p-2 text-center border border-border"
            >
              <div
                className="text-lg font-semibold"
                style={{ color: TRAIT_COLORS[t] }}
              >
                {scores[t]}
              </div>
              <div className="text-xs text-text-tertiary">{t}</div>
              {gap > 5 && (
                <div className="text-xs mt-0.5" style={{ color: TRAIT_COLORS[t] }}>
                  -{gap}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p className="text-sm text-trait-N bg-trait-N/10 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        onClick={onConfirm}
        disabled={loading}
        className="w-full py-4 rounded-2xl bg-text-primary text-bg font-semibold text-sm disabled:opacity-50 transition-opacity"
      >
        {loading ? "Building your habit stack…" : "Build my habit stack →"}
      </button>
    </>
  );
}

// ── Habit Preview ──────────────────────────────────────────────────────────────

const TIME_LABELS: Record<string, string> = {
  morning: "Morning",
  day: "Daytime",
  evening: "Evening",
};

function HabitPreview({
  habits,
  onFinish,
}: {
  habits: Habit[];
  onFinish: () => void;
}) {
  const grouped: Record<string, Habit[]> = {
    morning: habits.filter((h) => h.timeOfDay === "morning"),
    day: habits.filter((h) => h.timeOfDay === "day"),
    evening: habits.filter((h) => h.timeOfDay === "evening"),
  };

  return (
    <>
      <div>
        <p className="text-xs text-text-tertiary uppercase tracking-widest mb-1">
          Step 3 of 3
        </p>
        <h1 className="text-2xl font-semibold text-text-primary leading-tight">
          Your habit stack
        </h1>
        <p className="text-sm text-text-secondary mt-2">
          9 habits calibrated to your gaps. You can swap any of them later.
        </p>
      </div>

      {Object.entries(grouped).map(([time, group]) => (
        <div key={time}>
          <p className="text-xs uppercase tracking-widest text-text-tertiary mb-3">
            {TIME_LABELS[time]}
          </p>
          <div className="flex flex-col gap-2">
            {group.map((h) => (
              <div
                key={h.id}
                className="bg-surface rounded-2xl p-4 border border-border flex items-start gap-3"
              >
                <div
                  className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: TRAIT_COLORS[h.trait] }}
                />
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {h.title}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {h.subtitle}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: TRAIT_COLORS[h.trait] + "22",
                        color: TRAIT_COLORS[h.trait],
                      }}
                    >
                      {TRAIT_LABELS[h.trait]}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-text-tertiary">
                      {h.framework}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={onFinish}
        className="w-full py-4 rounded-2xl bg-text-primary text-bg font-semibold text-sm"
      >
        Start tracking →
      </button>
    </>
  );
}
