import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import {
  BigFiveScores,
  BENCHMARKS,
  TRAIT_LABELS,
  TraitKey,
  Archetype,
} from "@/lib/types";
import { randomUUID } from "crypto";

interface HabitRequest {
  scores: BigFiveScores;
  archetype: Archetype;
}

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const { scores, archetype }: HabitRequest = await req.json();

  const gaps = (Object.keys(scores) as TraitKey[]).map((t) => ({
    trait: t,
    label: TRAIT_LABELS[t],
    score: scores[t],
    benchmark: BENCHMARKS[t],
    gap: t === "N" ? scores[t] - BENCHMARKS[t] : BENCHMARKS[t] - scores[t],
  }));
  gaps.sort((a, b) => b.gap - a.gap);

  const prompt = `You are a habit coach who builds personalized daily stacks grounded in evidence-based frameworks (CBT, Stoicism, Chris Voss negotiation principles, atomic habits, deliberate practice).

User profile:
- Archetype: ${archetype.name} — ${archetype.tagline}
- Big Five scores (0–100): ${gaps.map((g) => `${g.label} ${g.score} (benchmark ${g.benchmark}, gap ${g.gap > 0 ? "+" : ""}${g.gap})`).join(", ")}

Generate exactly 9 daily habits: 3 morning, 3 daytime, 3 evening.

Rules:
- Allocate more habits to traits with larger positive gaps (further from benchmark)
- For Neuroticism, higher score means more regulation habits needed
- Each habit must have a clear, direct connection to a specific trait gap
- Morning habits should prime the psychological state for the day
- Daytime habits should be executable during work/active hours
- Evening habits should be reflective or restorative
- Titles are short action phrases (3–5 words), not vague ("10-min stoic journaling", not "Journal daily")
- Subtitles are one motivating clause explaining why it matters for THIS user
- Guide is 2–3 concrete steps max (keep it short, under 40 words total)
- Alternatives are 3 swap options, titles only (no descriptions)

Respond with JSON only, no markdown:
{
  "habits": [
    {
      "title": "...",
      "subtitle": "...",
      "trait": "O|C|E|A|N",
      "timeOfDay": "morning|day|evening",
      "framework": "...",
      "guide": "...",
      "alternatives": ["...", "...", "..."]
    }
  ]
}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system:
      "You are a habit coach. Respond with valid JSON only.",
    messages: [{ role: "user", content: prompt }],
  });

  const raw =
    message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  const { habits } = JSON.parse(text);

  const habitsWithIds = habits.map((h: object) => ({
    ...h,
    id: randomUUID(),
  }));

  return NextResponse.json({ habits: habitsWithIds });
}
