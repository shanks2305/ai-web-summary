import { AppError } from "../errors.js";
import { summarizeWithGemini } from "./summarize-gemini.js";
import { summarizeWithLocal } from "./summarize-local.js";
import { summarizeWithOpenAI } from "./summarize-openai.js";
import type { SummaryResult } from "./summarize-shared.js";

export type { SummaryResult } from "./summarize-shared.js";

export const SUMMARY_PROVIDERS = ["gemini", "openai", "local"] as const;
export type SummaryProvider = (typeof SUMMARY_PROVIDERS)[number];

const DEFAULT_PROVIDER: SummaryProvider = "gemini";

export function parseSummaryProvider(
  value: unknown,
): { ok: true; provider: SummaryProvider } | { ok: false; message: string } {
  if (value === undefined || value === null || value === "") {
    return { ok: true, provider: DEFAULT_PROVIDER };
  }

  if (typeof value !== "string" || !SUMMARY_PROVIDERS.includes(value as SummaryProvider)) {
    return {
      ok: false,
      message: `provider must be one of: ${SUMMARY_PROVIDERS.join(", ")}`,
    };
  }

  return { ok: true, provider: value as SummaryProvider };
}

export async function summarize(
  title: string,
  text: string,
  provider: SummaryProvider = DEFAULT_PROVIDER,
): Promise<SummaryResult> {
  switch (provider) {
    case "gemini":
      return summarizeWithGemini(title, text);
    case "openai":
      return summarizeWithOpenAI(title, text);
    case "local":
      return summarizeWithLocal(title, text);
    default:
      throw new AppError(`Unsupported summary provider: ${provider}`, "INVALID_PROVIDER", 400);
  }
}
