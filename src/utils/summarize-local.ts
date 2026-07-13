import OpenAI from "openai";
import { AppError } from "../errors.js";
import { parseSummaryResponse, SYSTEM_INSTRUCTION, type SummaryResult } from "./summarize-shared.js";

const baseURL = "http://localhost:11434/v1";

export async function summarizeWithLocal(_title: string, _text: string): Promise<SummaryResult> {
  const localModel = new OpenAI({ baseURL, apiKey: "dummy" });
  const response = await localModel.chat.completions.create({
    model: "llama3.2",
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTION },
      { role: "user", content: `Title: ${_title}\n\nContent:\n${_text}` },
    ],
    response_format: { type: "json_object" },
  });
  const raw = response.choices[0]?.message?.content;
  if (!raw) {
    throw new AppError("Model returned an empty response", "INVALID_SUMMARY_RESPONSE", 502);
  }
  return parseSummaryResponse(raw);
}
