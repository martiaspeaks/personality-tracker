"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadState } from "@/lib/store";

const TESTS = [
  {
    id: "bigfive",
    name: "Big Five (IPIP-50)",
    description: "Measures Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism — the most validated personality framework in psychology.",
    questions: 50,
    minutes: 5,
    available: true,
  },
  {
    id: "16personalities",
    name: "16 Personalities",
    description: "Identifies your MBTI-style type across 4 dimensions: Mind, Energy, Nature, and Tactics.",
    questions: 60,
    minutes: 8,
    available: false,
  },
  {
    id: "disc",
    name: "DISC",
    description: "Measures Dominance, Influence, Steadiness, and Conscientiousness in work and social contexts.",
    questions: 28,
    minutes: 4,
    available: false,
  },
  {
    id: "enneagram",
    name: "Enneagram",
    description: "Identifies one of 9 core personality types based on core motivations and fears.",
    questions: 36,
    minutes: 5,
    available: false,
  },
];

export default function Tests() {
  const router = useRouter();
  const [hasBaseline, setHasBaseline] = useState(false);

  useEffect(() => {
    const s = loadState();
    if (!s.onboardingComplete) { router.replace("/onboarding"); return; }
    setHasBaseline(!!s.baselineScores);
  }, [router]);

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div>
        <p className="text-xs text-text-tertiary uppercase tracking-widest mb-1">
          Test library
        </p>
        <h1 className="text-2xl font-semibold text-text-primary">Personality tests</h1>
        <p className="text-sm text-text-secondary mt-1">
          Take a test to measure or update your trait scores.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {TESTS.map((test) => (
          <TestCard key={test.id} test={test} />
        ))}
      </div>

      <BottomNav active="tests" />
    </div>
  );
}

function TestCard({ test }: { test: typeof TESTS[0] }) {
  return (
    <div className={`bg-surface rounded-2xl border border-border p-5 ${!test.available ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <h2 className="text-sm font-semibold text-text-primary">{test.name}</h2>
        {!test.available && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-text-tertiary flex-shrink-0">
            Soon
          </span>
        )}
      </div>
      <p className="text-xs text-text-secondary leading-relaxed mb-4">
        {test.description}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-xs text-text-tertiary">
          <span>{test.questions} questions</span>
          <span>·</span>
          <span>~{test.minutes} min</span>
        </div>
        {test.available ? (
          <Link
            href={`/tests/${test.id}`}
            className="text-xs px-4 py-2 rounded-xl bg-text-primary text-bg font-medium"
          >
            Start →
          </Link>
        ) : (
          <span className="text-xs px-4 py-2 rounded-xl bg-muted text-text-tertiary">
            Coming soon
          </span>
        )}
      </div>
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
      <div className="bg-surface rounded-2xl border border-border flex items-center justify-around py-3 px-4">
        {items.map((item) => (
          <a key={item.key} href={item.href}
            className={`flex flex-col items-center gap-1 ${active === item.key ? "text-text-primary" : "text-text-tertiary"}`}>
            {item.icon}
            <span className="text-xs">{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function GridIcon() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="1" y="1" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" /><rect x="10" y="1" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" /><rect x="1" y="10" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" /><rect x="10" y="10" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.5" /></svg>; }
function ChatIcon() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1.5C4.858 1.5 1.5 4.358 1.5 7.875c0 1.89.9 3.585 2.34 4.77L3 16.5l4.14-1.755A8.43 8.43 0 0 0 9 15c4.142 0 7.5-2.858 7.5-6.375S13.142 1.5 9 1.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>; }
function ChartIcon() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M1.5 16.5h15M4.5 16.5V10.5M8.25 16.5V6.75M12 16.5V9M15.75 16.5V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
function TestIcon() { return <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.5 2.25h9a1.5 1.5 0 0 1 1.5 1.5v10.5a1.5 1.5 0 0 1-1.5 1.5h-9a1.5 1.5 0 0 1-1.5-1.5V3.75a1.5 1.5 0 0 1 1.5-1.5Z" stroke="currentColor" strokeWidth="1.5" /><path d="M6 6.75h6M6 9h6M6 11.25h3.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>; }
