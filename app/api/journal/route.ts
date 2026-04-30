import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { BigFiveScores, TRAIT_LABELS, TraitKey } from "@/lib/types";

interface JournalRequest {
  wentWell: string;
  drained: string;
  tomorrow: string;
  scores: BigFiveScores;
  inputMethod: "text" | "voice";
  recentPatterns?: string; // comma-separated themes from last 3 entries
}

export async function POST(req: NextRequest) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const body: JournalRequest = await req.json();

  const traitContext = (Object.keys(body.scores) as TraitKey[])
    .map((t) => `${TRAIT_LABELS[t]}: ${body.scores[t]}`)
    .join(", ");

  const voiceNote =
    body.inputMethod === "voice"
      ? "Note: this entry was transcribed from voice — treat conversational tone and incomplete sentences as natural."
      : "";

  const prompt = `You are an AI coach analyzing a user's evening journal entry through the lens of their Big Five personality profile.

User's current trait scores: ${traitContext}
${body.recentPatterns ? `Themes from recent entries: ${body.recentPatterns}` : ""}
${voiceNote}

Today's journal:
- What went well: "${body.wentWell}"
- What drained me: "${body.drained}"
- Tomorrow's one thing: "${body.tomorrow}"

Write a single insight (2–3 sentences max) that:
1. Names a specific pattern or connection you notice (trait-level, not generic)
2. Is direct — no preamble, no "it seems like", just state the observation
3. If a recurring pattern exists across recent entries, surface it explicitly

Never be generic ("great job today!"). Be a sharp, honest coach.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 200,
    system: "You are a direct, insightful coach. No fluff.",
    messages: [{ role: "user", content: prompt }],
  });

  const insight =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";

  return NextResponse.json({ insight });
}
