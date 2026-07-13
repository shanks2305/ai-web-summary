import { ApiError, GoogleGenAI } from "@google/genai";
import { AppError, QuotaExceededError } from "../errors.js";
import {
  MAX_CHARS,
  parseSummaryResponse,
  SYSTEM_INSTRUCTION,
  type SummaryResult,
} from "./summarize-shared.js";

function isQuotaExceeded(cause: unknown): boolean {
  if (!(cause instanceof ApiError)) {
    return false;
  }

  if (cause.status === 429) {
    return true;
  }

  const message = cause.message.toLowerCase();
  return message.includes("quota") || message.includes("resource_exhausted");
}

function getClient(): GoogleGenAI {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new AppError("API_KEY is not configured", "MISSING_API_KEY", 503);
  }
  return new GoogleGenAI({ apiKey });
}

export async function summarizeWithGemini(title: string, text: string): Promise<SummaryResult> {
  const content = text.slice(0, MAX_CHARS);
  const ai = getClient();

  let response;
  try {
    response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Title: ${title}\n\nContent:\n${content}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });
  } catch (cause) {
    if (isQuotaExceeded(cause)) {
      throw new QuotaExceededError({ cause });
    }
    throw new AppError("Failed to generate summary", "SUMMARIZE_FAILED", 502, { cause });
  }

  const raw = response.text;
  if (!raw) {
    throw new AppError("Model returned an empty response", "INVALID_SUMMARY_RESPONSE", 502);
  }

  return parseSummaryResponse(raw);
}
