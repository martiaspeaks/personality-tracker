"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppState, JournalEntry } from "@/lib/types";
import { loadState, updateState, today } from "@/lib/store";

const PROMPTS = [
  { key: "wentWell" as const, label: "What went well today?", placeholder: "Something that worked, a win, a moment of clarity…" },
  { key: "drained" as const, label: "What drained you?", placeholder: "What cost you energy, what felt hard or frustrating…" },
  { key: "tomorrow" as const, label: "Tomorrow's one thing", placeholder: "The single most important thing to focus on…" },
];

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: { length: number; [key: number]: { isFinal: boolean; length: number; [key: number]: { transcript: string } } };
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

export default function Review() {
  const router = useRouter();
  const [state, setState] = useState<AppState | null>(null);
  const [form, setForm] = useState({ wentWell: "", drained: "", tomorrow: "" });
  const [activeField, setActiveField] = useState<"wentWell" | "drained" | "tomorrow" | null>(null);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<"text" | "voice">("text");
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const transcriptRef = useRef("");

  useEffect(() => {
    const s = loadState();
    if (!s.onboardingComplete) { router.replace("/onboarding"); return; }
    setState(s);

    // Check for existing entry today
    const todayEntry = s.journalEntries.find((e) => e.date === today());
    if (todayEntry) {
      setForm({
        wentWell: todayEntry.wentWell,
        drained: todayEntry.drained,
        tomorrow: todayEntry.tomorrow,
      });
      if (todayEntry.aiInsight) setInsight(todayEntry.aiInsight);
    }

    // Check voice support
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setVoiceSupported(!!SR);
  }, [router]);

  function startRecording(field: typeof activeField) {
    if (!field) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    transcriptRef.current = form[field];

    recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let interim = "";
      let final = transcriptRef.current;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += (final ? " " : "") + t;
          transcriptRef.current = final;
        } else {
          interim = t;
        }
      }
      setForm((f) => ({
        ...f,
        [field]: transcriptRef.current + (interim ? " " + interim : ""),
      }));
    };

    recognition.onend = () => {
      setRecording(false);
      setInputMethod("voice");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setActiveField(field);
    setRecording(true);
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setRecording(false);
  }

  async function handleSubmit() {
    if (!state || !form.wentWell || !form.drained || !form.tomorrow) return;
    setLoading(true);

    // Build recent patterns from last 3 entries
    const recentThemes = state.journalEntries
      .slice(-3)
      .map((e) => e.drained)
      .filter(Boolean)
      .join(", ");

    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          scores: state.baselineScores,
          inputMethod,
          recentPatterns: recentThemes,
        }),
      });
      const data = await res.json();
      const newInsight: string = data.insight;
      setInsight(newInsight);

      const entry: JournalEntry = {
        date: today(),
        ...form,
        aiInsight: newInsight,
        inputMethod,
      };

      const entries = [
        ...state.journalEntries.filter((e) => e.date !== today()),
        entry,
      ];
      const next = updateState({ journalEntries: entries });
      setState({ ...next });
    } catch {
      setInsight("Couldn't reach AI — entry saved locally.");
    } finally {
      setLoading(false);
    }
  }

  if (!state) return <Spinner />;

  const allFilled = form.wentWell && form.drained && form.tomorrow;

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div>
        <p className="text-xs text-text-tertiary uppercase tracking-widest mb-1">
          Evening review
        </p>
        <h1 className="text-2xl font-semibold text-text-primary">
          End of day
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          3 questions, 2 minutes.
        </p>
      </div>

      {/* Voice / text toggle */}
      {voiceSupported && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setInputMethod("text")}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              inputMethod === "text"
                ? "bg-text-primary text-bg border-transparent"
                : "border-border text-text-secondary"
            }`}
          >
            Type
          </button>
          <button
            onClick={() => setInputMethod("voice")}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              inputMethod === "voice"
                ? "bg-text-primary text-bg border-transparent"
                : "border-border text-text-secondary"
            }`}
          >
            🎙 Voice
          </button>
          {recording && (
            <span className="text-xs text-trait-N animate-pulse">
              Recording…
            </span>
          )}
        </div>
      )}

      {/* Form */}
      <div className="flex flex-col gap-4">
        {PROMPTS.map(({ key, label, placeholder }) => (
          <div key={key} className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-primary">
              {label}
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={form[key]}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-surface border border-border rounded-2xl px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-text-tertiary transition-colors"
              />
              {voiceSupported && (
                <button
                  onMouseDown={() => {
                    if (recording && activeField === key) {
                      stopRecording();
                    } else {
                      if (recording) stopRecording();
                      setTimeout(() => startRecording(key), 100);
                    }
                  }}
                  className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    recording && activeField === key
                      ? "bg-trait-N text-white animate-pulse"
                      : "bg-muted text-text-secondary"
                  }`}
                >
                  <MicIcon />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* AI insight */}
      {insight && (
        <div className="bg-surface rounded-2xl border border-border p-5">
          <p className="text-xs uppercase tracking-widest text-text-tertiary mb-2">
            AI insight
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">{insight}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!allFilled || loading}
        className="w-full py-4 rounded-2xl bg-text-primary text-bg font-semibold text-sm disabled:opacity-40 transition-opacity"
      >
        {loading
          ? "Analysing…"
          : insight
          ? "Update entry"
          : "Get insight →"}
      </button>

      {/* Past entries */}
      {state.journalEntries.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-text-tertiary mb-3">
            Past entries
          </p>
          <div className="flex flex-col gap-3">
            {[...state.journalEntries]
              .reverse()
              .slice(0, 5)
              .map((entry) => (
                <PastEntry key={entry.date} entry={entry} />
              ))}
          </div>
        </div>
      )}

      <BottomNav active="review" />
    </div>
  );
}

function PastEntry({ entry }: { entry: JournalEntry }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="bg-surface rounded-2xl border border-border p-4 cursor-pointer"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-tertiary">{formatDate(entry.date)}</p>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className={`text-text-tertiary transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      {open && (
        <div className="mt-3 flex flex-col gap-2">
          <EntryField label="Went well" value={entry.wentWell} />
          <EntryField label="Drained" value={entry.drained} />
          <EntryField label="Tomorrow" value={entry.tomorrow} />
          {entry.aiInsight && (
            <div className="mt-1 pt-2 border-t border-border">
              <p className="text-xs text-text-tertiary mb-1">AI insight</p>
              <p className="text-xs text-text-secondary">{entry.aiInsight}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EntryField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-text-tertiary">{label}</p>
      <p className="text-sm text-text-secondary mt-0.5">{value}</p>
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function MicIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="4.5" y="1" width="5" height="8" rx="2.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 7.5A5 5 0 0 0 12 7.5M7 12.5v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
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
      <div className="bg-surface rounded-2xl border border-border flex items-center justify-around py-3 px-4">
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
