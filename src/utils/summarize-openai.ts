import OpenAI from "openai";
import { AppError, QuotaExceededError } from "../errors.js";
import {
  MAX_CHARS,
  parseSummaryResponse,
  SYSTEM_INSTRUCTION,
  type SummaryResult,
} from "./summarize-shared.js";

export type { SummaryResult } from "./summarize-shared.js";

function isQuotaExceeded(cause: unknown): boolean {
  if (!(cause instanceof OpenAI.APIError)) {
    return false;
  }

  if (cause.status === 429) {
    return true;
  }

  const message = cause.message.toLowerCase();
  return message.includes("quota") || message.includes("rate limit");
}

function getClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.API_KEY;
  if (!apiKey) {
    throw new AppError("OPENAI_API_KEY is not configured", "MISSING_API_KEY", 503);
  }
  return new OpenAI({ apiKey });
}

export async function summarizeWithOpenAI(title: string, text: string): Promise<SummaryResult> {
  const content = text.slice(0, MAX_CHARS);
  const client = getClient();

  let response;
  try {
    response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_INSTRUCTION },
        { role: "user", content: `Title: ${title}\n\nContent:\n${content}` },
      ],
      response_format: { type: "json_object" },
    });
  } catch (cause) {
    if (isQuotaExceeded(cause)) {
      throw new QuotaExceededError({ cause });
    }
    throw new AppError("Failed to generate summary", "SUMMARIZE_FAILED", 502, { cause });
  }

  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new AppError("Model returned an empty response", "INVALID_SUMMARY_RESPONSE", 502);
  }

  return parseSummaryResponse(raw);
}
