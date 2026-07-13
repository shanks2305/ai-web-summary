import "dotenv/config";
import { configureTls } from "./utils/tls.js";
import express from "express";
import pino from "pino";
import { pinoHttp } from "pino-http";
import type { Logger } from "pino";
import type { Response } from "express";
import { isAppError } from "./errors.js";
import { scrape } from "./utils/scrape.js";
import { parseSummaryProvider, summarize } from "./utils/summarize.js";
import { validateUrl } from "./utils/validateUrl.js";

configureTls();

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

if (process.env.TLS_INSECURE_SKIP_VERIFY === "true") {
  logger.warn(
    "TLS certificate verification is disabled (TLS_INSECURE_SKIP_VERIFY=true). Use NODE_EXTRA_CA_CERTS in production.",
  );
}

const app = express();

app.use(express.json());
app.use(pinoHttp({ logger }));

app.get("/", (_req, res) => {
  res.send("Hello World");
});

function sendError(
  res: Response,
  log: Logger,
  error: unknown,
  context: Record<string, unknown>,
): void {
  if (isAppError(error)) {
    log.error({ ...context, code: error.code, err: error }, error.message);
    res.status(error.statusCode).json({ error: error.message, code: error.code });
    return;
  }

  log.error({ ...context, err: error }, "Unexpected error");
  res.status(500).json({ error: "internal server error" });
}

app.post("/scrape", async (req, res) => {
  const urlResult = validateUrl(req.body?.url);
  if (!urlResult.ok) {
    return res.status(400).json({ error: urlResult.message });
  }

  const { url } = urlResult;

  const providerResult = parseSummaryProvider(
    req.body?.provider ?? "openai",
  );
  if (!providerResult.ok) {
    return res.status(400).json({ error: providerResult.message });
  }

  const { provider } = providerResult;

  console.log(provider);

  try {
    const page = await scrape(url);
    logger.info({ url }, "Scraped page");

    const summary = await summarize(page.title, page.text, provider);
    logger.info({ url, provider }, "Generated summary");

    res.status(200).json({ url: page.url, ...summary });
  } catch (error) {
    sendError(res, logger, error, { url });
  }
});

const port = Number(process.env.API_PORT ?? 3000);

if (!process.env.API_KEY) {
  logger.warn("API_KEY is not set — /scrape will fail until it is configured");
}

app.listen(port, () => {
  logger.info({ port }, "Server is running");
});
