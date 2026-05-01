"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TRAIT_LABELS, TRAIT_COLORS, BENCHMARKS, TraitKey, BigFiveScores, Archetype, Habit } from "@/lib/types";
import { loadState, updateState, today } from "@/lib/store";

const TRAITS: TraitKey[] = ["O", "C", "E", "A", "N"];

export default function BigFiveResults() {
  const router = useRouter();
  const [scores, setScores] = useState<BigFiveScores | null>(null);
  const [baseline, setBaseline] = useState<BigFiveScores | null>(null);
  const [phase, setPhase] = useState<"results" | "confirm" | "regenerating" | "done">("results");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = loadState();
    if (!s.onboardingComplete) { router.replace("/onboarding"); return; }
    const raw = sessionStorage.getItem("bf_results");
    if (!raw) { router.replace("/tests/bigfive"); return; }
    setScores(JSON.parse(raw));
    setBaseline(s.baselineScores);
  }, [router]);

  async function handleUpdate() {
    if (!scores) return;
    setPhase("regenerating");
    setError(null);
    try {
      // Step 1: new archetype
      const archetypeRes = await fetch("/api/archetype", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scores),
      });
      if (!archetypeRes.ok) throw new Error("Archetype failed");
      const archetype: Archetype = await archetypeRes.json();

      // Step 2: new habit stack
      const habitsRes = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores, archetype }),
      });
      if (!habitsRes.ok) throw new Error("Habits failed");
      const { habits }: { habits: Habit[] } = await habitsRes.json();

      // Save everything
      updateState({
        baselineScores: scores,
        archetype,
        habits,
        completions: [], // reset completions — new stack
        streak: 0,
        assessments: [
          ...loadState().assessments,
          { date: today(), scores },
        ],
      });

      sessionStorage.removeItem("bf_results");
      setPhase("done");
    } catch {
      setError("Couldn't regenerate — try again.");
      setPhase("confirm");
    }
  }

  function handleSkip() {
    // Save as assessment only, don't change habits
    if (!scores) return;
    updateState({
      assessments: [
        ...loadState().assessments,
        { date: today(), scores },
      ],
    });
    sessionStorage.removeItem("bf_results");
    router.push("/progress");
  }

  if (!scores) return <Spinner />;

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-6 px-4 text-center">
        <div className="text-4xl">✓</div>
        <h1 className="text-xl font-semibold text-text-primary">Scores and habits updated</h1>
        <p className="text-sm text-text-secondary">Your habit stack has been rebuilt based on your new scores.</p>
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full max-w-xs py-4 rounded-2xl bg-text-primary text-bg font-semibold text-sm"
        >
          Go to dashboard →
        </button>
      </div>
    );
  }

  if (phase === "regenerating") {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh gap-4 px-4 text-center">
        <div className="w-6 h-6 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
        <p className="text-sm text-text-secondary">Rebuilding your archetype and habit stack…</p>
      </div>
    );
  }

  if (phase === "confirm") {
    return (
      <div className="flex flex-col gap-6 px-4 pt-8 pb-12">
        <button onClick={() => setPhase("results")} className="flex items-center gap-1.5 text-sm text-text-secondary">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to results
        </button>

        <div>
          <h1 className="text-2xl font-semibold text-text-primary leading-tight">Update your profile?</h1>
          <p className="text-sm text-text-secondary mt-2 leading-relaxed">
            This will replace your current baseline scores, generate a new archetype, and rebuild your entire habit stack. Your completion history and streaks will reset.
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-4">
          <p className="text-xs uppercase tracking-widest text-text-tertiary mb-3">What changes</p>
          <div className="flex flex-col gap-2 text-sm text-text-secondary">
            <span>→ New baseline scores from this test</span>
            <span>→ Regenerated archetype</span>
            <span>→ New 9-habit daily stack</span>
            <span className="text-trait-N">→ Completion history and streak reset</span>
          </div>
        </div>

        {error && <p className="text-sm text-trait-N bg-trait-N/10 rounded-xl px-4 py-3">{error}</p>}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleUpdate}
            className="w-full py-4 rounded-2xl bg-text-primary text-bg font-semibold text-sm"
          >
            Yes, update everything
          </button>
          <button
            onClick={handleSkip}
            className="w-full py-4 rounded-2xl border border-border text-text-secondary text-sm"
          >
            Save scores only, keep current habits
          </button>
        </div>
      </div>
    );
  }

  // Results view
  return (
    <div className="flex flex-col gap-6 px-4 pt-8 pb-12">
      <div>
        <p className="text-xs text-text-tertiary uppercase tracking-widest mb-1">Test complete</p>
        <h1 className="text-2xl font-semibold text-text-primary">Your Big Five results</h1>
        <p className="text-sm text-text-secondary mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Score bars */}
      <div className="flex flex-col gap-4">
        {TRAITS.map((t) => {
          const score = scores[t];
          const base = baseline?.[t];
          const delta = base !== undefined ? score - base : null;
          const color = TRAIT_COLORS[t];
          const benchmark = BENCHMARKS[t];
          const gap = t === "N" ? score - benchmark : benchmark - score;

          return (
            <div key={t} className="bg-surface rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{TRAIT_LABELS[t]}</p>
                  {gap > 0 && (
                    <p className="text-xs text-text-tertiary mt-0.5">{gap} pts from benchmark</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-2xl font-semibold" style={{ color }}>{score}</span>
                  {delta !== null && delta !== 0 && (
                    <p className="text-xs mt-0.5" style={{ color: delta > 0 ? "#4CAF82" : "#D4537E" }}>
                      {delta > 0 ? "+" : ""}{delta} vs baseline
                    </p>
                  )}
                </div>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${score}%`, background: color, opacity: 0.85 }} />
              </div>
              {/* Benchmark marker */}
              <div className="relative h-2 -mt-2 pointer-events-none">
                <div className="absolute top-0 w-0.5 h-2 rounded-full"
                  style={{ left: `${benchmark}%`, background: color, opacity: 0.4 }} />
              </div>
              <div className="flex justify-between text-xs text-text-tertiary mt-1">
                <span>0</span>
                <span>benchmark {benchmark}</span>
                <span>100</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => setPhase("confirm")}
          className="w-full py-4 rounded-2xl bg-text-primary text-bg font-semibold text-sm"
        >
          Update scores + rebuild habit stack →
        </button>
        <button
          onClick={handleSkip}
          className="w-full py-4 rounded-2xl border border-border text-text-secondary text-sm"
        >
          Save scores only, keep current habits
        </button>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-dvh">
      <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/80 animate-spin" />
    </div>
  );
}
