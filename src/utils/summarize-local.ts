import { AppError } from "../errors.js";
import type { SummaryResult } from "./summarize-shared.js";

export async function summarizeWithLocal(_title: string, _text: string): Promise<SummaryResult> {
  // TODO: wire up local LLM (e.g. Ollama)
  throw new AppError("Local LLM summarization is not implemented yet", "NOT_IMPLEMENTED", 501);
}
