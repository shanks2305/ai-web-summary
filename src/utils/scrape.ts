import { chromium } from "playwright";
import { AppError, isAppError } from "../errors.js";

export type PageContent = {
  title: string;
  text: string;
  url: string;
};

const PAGE_LOAD_TIMEOUT_MS = 30_000;
const NOISE_SELECTORS = "script, style, nav, footer, aside, noscript";

export async function scrape(url: string): Promise<PageContent> {
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();

    try {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: PAGE_LOAD_TIMEOUT_MS,
      });
    } catch (cause) {
      const isTimeout = cause instanceof Error && cause.name === "TimeoutError";
      throw new AppError(
        isTimeout ? "Page load timed out" : "Failed to load page",
        isTimeout ? "SCRAPE_TIMEOUT" : "SCRAPE_FAILED",
        isTimeout ? 504 : 502,
        { cause },
      );
    }

    const title = await page.title();
    const text = await page.evaluate((selectors: string) => {
      document.querySelectorAll(selectors).forEach((el) => el.remove());
      return document.body?.innerText ?? "";
    }, NOISE_SELECTORS);

    return {
      title,
      text: text.replace(/\s+/g, " ").trim(),
      url,
    };
  } catch (error) {
    if (isAppError(error)) {
      throw error;
    }
    throw new AppError("Scraping failed", "SCRAPE_FAILED", 502, { cause: error });
  } finally {
    await browser?.close();
  }
}
