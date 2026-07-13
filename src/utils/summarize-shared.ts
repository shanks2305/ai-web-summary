import { AppError } from "../errors.js";

export type SummaryResult = {
  summary: string;
  keyPoints: string[];
  topics: string[];
};

export const MAX_CHARS = 30_000;

export const SYSTEM_INSTRUCTION = `You summarize web pages clearly and accurately.
Return valid JSON with exactly these fields:
- summary: 2-4 sentence overview
- keyPoints: array of 3-6 bullet points
- topics: array of main topics (short strings)`;

export function parseSummaryResponse(raw: string): SummaryResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new AppError("Model returned invalid JSON", "INVALID_SUMMARY_RESPONSE", 502, {
      cause,
    });
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as SummaryResult).summary !== "string" ||
    !Array.isArray((parsed as SummaryResult).keyPoints) ||
    !Array.isArray((parsed as SummaryResult).topics)
  ) {
    throw new AppError(
      "Model response is missing required fields",
      "INVALID_SUMMARY_RESPONSE",
      502,
    );
  }

  return parsed as SummaryResult;
}
