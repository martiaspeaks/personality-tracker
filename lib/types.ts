export type TraitKey = "O" | "C" | "E" | "A" | "N";

export const TRAIT_LABELS: Record<TraitKey, string> = {
  O: "Openness",
  C: "Conscientiousness",
  E: "Extraversion",
  A: "Agreeableness",
  N: "Neuroticism",
};

export const TRAIT_COLORS: Record<TraitKey, string> = {
  O: "#7F77DD",
  C: "#4CAF82",
  E: "#E9A84C",
  A: "#4CBFBF",
  N: "#D4537E",
};

// High-performer benchmarks (0–100 scale)
export const BENCHMARKS: Record<TraitKey, number> = {
  O: 78,
  C: 82,
  E: 65,
  A: 70,
  N: 35, // lower is better for Neuroticism
};

export interface BigFiveScores {
  O: number; // 0–100
  C: number;
  E: number;
  A: number;
  N: number;
}

export interface Archetype {
  name: string;
  tagline: string;
  gapAnalysis: string; // 3-sentence AI summary
  primaryTrait: TraitKey; // trait with largest gap from benchmark
}

export type TimeOfDay = "morning" | "day" | "evening";

export interface Habit {
  id: string;
  title: string;
  subtitle: string; // one-line motivator, e.g. "Stay grounded"
  trait: TraitKey;
  timeOfDay: TimeOfDay;
  framework: string; // e.g. "CBT", "Stoicism", "Voss"
  guide: string; // step-by-step execution, markdown
  alternatives: string[]; // swap options
}

export interface HabitCompletion {
  habitId: string;
  date: string; // ISO date string YYYY-MM-DD
  completed: boolean;
}

export interface WeeklyAssessment {
  date: string; // ISO date string
  scores: BigFiveScores;
}

export interface JournalEntry {
  date: string; // ISO date string
  wentWell: string;
  drained: string;
  tomorrow: string;
  aiInsight?: string;
  inputMethod: "text" | "voice";
}

export interface AppState {
  // Onboarding
  onboardingComplete: boolean;
  baselineScores: BigFiveScores | null;
  archetype: Archetype | null;
  habits: Habit[];

  // Daily tracking
  completions: HabitCompletion[];
  streak: number;
  lastActiveDate: string | null;

  // Weekly assessments
  assessments: WeeklyAssessment[];

  // Journal
  journalEntries: JournalEntry[];

  // Prefs
  morningReminderTime: string; // "HH:MM"
  enableMidday: boolean;
  enableEvening: boolean;
}

export const DEFAULT_STATE: AppState = {
  onboardingComplete: false,
  baselineScores: null,
  archetype: null,
  habits: [],
  completions: [],
  streak: 0,
  lastActiveDate: null,
  assessments: [],
  journalEntries: [],
  morningReminderTime: "07:00",
  enableMidday: true,
  enableEvening: true,
};
