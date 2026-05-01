"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS, CHOICES } from "@/lib/bigfive-questions";
import { scoreAnswers, Answers } from "@/lib/bigfive-score";
import { loadState } from "@/lib/store";

const STORAGE_KEY = "bf_test_progress";

export default function BigFiveTest() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});

  useEffect(() => {
    const s = loadState();
    if (!s.onboardingComplete) { router.replace("/onboarding"); return; }
    // Restore progress if test was interrupted
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { answers: a, current: c } = JSON.parse(saved);
        setAnswers(a);
        setCurrent(c);
      }
    } catch {}
  }, [router]);

  function saveProgress(newAnswers: Answers, newCurrent: number) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers: newAnswers, current: newCurrent }));
  }

  function handleAnswer(value: number) {
    const q = QUESTIONS[current];
    const newAnswers = { ...answers, [q.id]: value };
    setAnswers(newAnswers);

    if (current < QUESTIONS.length - 1) {
      const next = current + 1;
      setCurrent(next);
      saveProgress(newAnswers, next);
    } else {
      // All answered — score and go to results
      localStorage.removeItem(STORAGE_KEY);
      const scores = scoreAnswers(newAnswers);
      sessionStorage.setItem("bf_results", JSON.stringify(scores));
      router.push("/tests/bigfive/results");
    }
  }

  function handleBack() {
    if (current > 0) {
      const prev = current - 1;
      setCurrent(prev);
      saveProgress(answers, prev);
    }
  }

  const q = QUESTIONS[current];
  const pct = Math.round((current / QUESTIONS.length) * 100);
  const selected = answers[q.id];

  return (
    <div className="flex flex-col min-h-dvh pb-8">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handleBack}
            disabled={current === 0}
            className="flex items-center gap-1.5 text-sm text-text-secondary disabled:opacity-30"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
          <span className="text-xs text-text-tertiary">
            {current + 1} / {QUESTIONS.length}
          </span>
          <button
            onClick={() => {
              localStorage.removeItem(STORAGE_KEY);
              router.push("/tests");
            }}
            className="text-xs text-text-tertiary"
          >
            Exit
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-text-primary rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col justify-center px-4 gap-8">
        <div>
          <p className="text-xs text-text-tertiary uppercase tracking-widest mb-3">
            Question {current + 1}
          </p>
          <h2 className="text-xl font-semibold text-text-primary leading-snug">
            {q.text}
          </h2>
        </div>

        {/* Choices */}
        <div className="flex flex-col gap-2">
          {CHOICES.map((choice) => {
            const isSelected = selected === choice.value;
            return (
              <button
                key={choice.value}
                onClick={() => handleAnswer(choice.value)}
                className="w-full py-4 px-5 rounded-2xl text-sm font-medium text-left transition-all active:scale-[0.98]"
                style={{
                  background: isSelected ? "#F0F0F0" : "#1A1A1A",
                  color: isSelected ? "#0E0E0E" : "#8A8A8A",
                  border: `1px solid ${isSelected ? "transparent" : "#2A2A2A"}`,
                }}
              >
                {choice.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Encouragement */}
      <div className="px-4 pt-4">
        <p className="text-xs text-center text-text-tertiary">
          {pct < 25 && "Just getting started — there are no right or wrong answers."}
          {pct >= 25 && pct < 50 && "You're doing great. Answer honestly for the most accurate results."}
          {pct >= 50 && pct < 75 && "Halfway there. Keep going."}
          {pct >= 75 && pct < 95 && "Almost done. Stay honest."}
          {pct >= 95 && "Last few — you've got this."}
        </p>
      </div>
    </div>
  );
}
