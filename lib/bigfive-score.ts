import { BigFiveScores, TraitKey } from "./types";
import { QUESTIONS } from "./bigfive-questions";

export type Answers = Record<number, number>; // questionId → 1–5

export function scoreAnswers(answers: Answers): BigFiveScores {
  const traits: TraitKey[] = ["O", "C", "E", "A", "N"];
  const result = {} as BigFiveScores;

  for (const trait of traits) {
    const traitQuestions = QUESTIONS.filter((q) => q.trait === trait);
    let total = 0;

    for (const q of traitQuestions) {
      const raw = answers[q.id] ?? 3;
      // Reverse-score minus-keyed items: 1↔5, 2↔4, 3→3
      const scored = q.keyed === "minus" ? 6 - raw : raw;
      total += scored;
    }

    const avg = total / traitQuestions.length; // 1–5
    result[trait] = Math.round(((avg - 1) / 4) * 100); // 0–100
  }

  return result;
}
