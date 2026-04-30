import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { BigFiveScores, BENCHMARKS, TRAIT_LABELS, TraitKey } from "@/lib/types";

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const scores: BigFiveScores = await req.json();

  const gaps = (Object.keys(scores) as TraitKey[]).map((t) => {
    const gap =
      t === "N"
        ? scores[t] - BENCHMARKS[t] // for Neuroticism, higher score = bigger gap
        : BENCHMARKS[t] - scores[t];
    return { trait: t, label: TRAIT_LABELS[t], score: scores[t], gap };
  });
  gaps.sort((a, b) => b.gap - a.gap);
  const primaryTrait = gaps[0].trait as TraitKey;

  const prompt = `You are a personality psychology expert specializing in the Big Five model and high-performance coaching.

A user has completed a Big Five personality assessment. Their scores (0–100 scale) are:
${gaps.map((g) => `- ${g.label} (${g.trait}): ${g.score}/100 (high-performer benchmark: ${BENCHMARKS[g.trait as TraitKey]})`).join("\n")}

Your task:
1. Name their personality archetype — a 2–4 word phrase that is aspirational and specific to their profile, not generic (e.g. "Strategic Builder", "Reflective Catalyst", "Grounded Achiever"). Never use clinical labels.
2. Write a tagline — one punchy sentence about their core strength.
3. Write a gap analysis — exactly 3 sentences: what their biggest gap is, what it costs them in real life (wealth/career/relationships), and what closing it would unlock. Be direct and specific, not motivational-poster vague.

Respond with JSON only, no markdown:
{
  "name": "...",
  "tagline": "...",
  "gapAnalysis": "..."
}`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    system:
      "You are a personality psychology expert. Respond with valid JSON only.",
    messages: [{ role: "user", content: prompt }],
  });

  const raw =
    message.content[0].type === "text" ? message.content[0].text : "";
  const text = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(text);

  return NextResponse.json({ ...parsed, primaryTrait });
}
