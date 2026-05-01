"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TRAIT_COLORS,
  TRAIT_LABELS,
  BENCHMARKS,
  TraitKey,
  AppState,
} from "@/lib/types";
import { loadState } from "@/lib/store";

const TRAITS: TraitKey[] = ["O", "C", "E", "A", "N"];

export default function Progress() {
  const router = useRouter();
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    const s = loadState();
    if (!s.onboardingComplete) { router.replace("/onboarding"); return; }
    setState(s);
  }, [router]);

  if (!state) return <Spinner />;

  const latest = state.assessments[state.assessments.length - 1];
  const baseline = state.baselineScores;

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div>
        <p className="text-xs text-text-tertiary uppercase tracking-widest mb-1">
          Trait progress
        </p>
        <h1 className="text-2xl font-semibold text-text-primary">Progress</h1>
        <p className="text-sm text-text-secondary mt-1">
          Your scores vs baseline vs high-performer benchmarks.
        </p>
      </div>

      {/* Trait bars */}
      <div className="flex flex-col gap-4">
        {TRAITS.map((t) => {
          const score = latest?.scores[t] ?? baseline?.[t] ?? 50;
          const base = baseline?.[t] ?? score;
          const benchmark = BENCHMARKS[t];
          const delta = score - base;
          const color = TRAIT_COLORS[t];
          const isN = t === "N";
          const gap = isN ? score - benchmark : benchmark - score;

          return (
            <div key={t} className="bg-surface rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {TRAIT_LABELS[t]}
                  </p>
                  {gap > 0 && (
                    <p className="text-xs text-text-tertiary mt-0.5">
                      {gap} pts from benchmark
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-xl font-semibold" style={{ color }}>
                    {score}
                  </span>
                  {delta !== 0 && (
                    <p
                      className="text-xs"
                      style={{ color: delta > 0 ? "#4CAF82" : "#D4537E" }}
                    >
                      {delta > 0 ? "+" : ""}
                      {delta} from baseline
                    </p>
                  )}
                </div>
              </div>

              {/* Bar: score vs benchmark */}
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${score}%`,
                    background: color,
                    opacity: 0.8,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-text-tertiary mt-1">
                <span>0</span>
                <span>benchmark {benchmark}</span>
                <span>100</span>
              </div>

              {/* Benchmark marker */}
              <div className="relative mt-1">
                <div
                  className="absolute -top-5 w-px h-5"
                  style={{
                    left: `${benchmark}%`,
                    background: color + "66",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Assessment history */}
      {state.assessments.length > 1 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-text-tertiary mb-3">
            Assessment history
          </p>
          <div className="bg-surface rounded-2xl border border-border p-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-text-tertiary">
                  <th className="text-left pb-2">Date</th>
                  {TRAITS.map((t) => (
                    <th key={t} className="text-right pb-2" style={{ color: TRAIT_COLORS[t] }}>
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...state.assessments].reverse().map((a) => (
                  <tr key={a.date} className="border-t border-border">
                    <td className="py-2 text-text-secondary">
                      {new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </td>
                    {TRAITS.map((t) => (
                      <td key={t} className="text-right py-2 text-text-primary font-medium">
                        {a.scores[t]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <BottomNav active="progress" />
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

function BottomNav({ active }: { active: string }) {
  const items = [
    { href: "/dashboard", label: "Today", key: "dashboard", icon: <GridIcon /> },
    { href: "/review", label: "Review", key: "review", icon: <ChatIcon /> },
    { href: "/tests", label: "Tests", key: "tests", icon: <TestIcon /> },
    { href: "/progress", label: "Progress", key: "progress", icon: <ChartIcon /> },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto px-4 pb-6 pt-3 bg-gradient-to-t from-bg to-transparent">
      <div className="bg-surface rounded-2xl border border-border flex items-center justify-around py-3 px-6">
        {items.map((item) => (
          <a
            key={item.key}
            href={item.href}
            className={`flex flex-col items-center gap-1 ${
              active === item.key ? "text-text-primary" : "text-text-tertiary"
            }`}
          >
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function GridIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" /><rect x="10" y="1" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" /><rect x="1" y="10" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" /><rect x="10" y="10" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" /></svg>;
}
function ChatIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1.5C4.858 1.5 1.5 4.358 1.5 7.875c0 1.89.9 3.585 2.34 4.77L3 16.5l4.14-1.755A8.43 8.43 0 0 0 9 15c4.142 0 7.5-2.858 7.5-6.375S13.142 1.5 9 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>;
}
function ChartIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1.5 16.5h15M4.5 16.5V10.5M8.25 16.5V6.75M12 16.5V9M15.75 16.5V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
function TestIcon() {
  return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.5 2.25h9a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5h-9a1.5 1.5 0 0 1-1.5-1.5V3.75a1.5 1.5 0 0 1 1.5-1.5Z" stroke="currentColor" strokeWidth="1.5" /><path d="M6 6.75h6M6 9h6M6 11.25h3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>;
}
