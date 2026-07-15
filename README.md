# AI Web Scraper

A TypeScript REST API that fetches any public web page, extracts its readable text, and returns a structured AI-generated summary — including a short overview, key bullet points, and topic tags.

Send a URL, get back a concise digest of the page without building your own scraper or prompt pipeline.

## What it does

1. **Accepts a URL** via `POST /scrape`
2. **Loads the page** with Playwright (headless Chromium), stripping scripts, styles, nav, footer, and other noise
3. **Summarizes the content** using your choice of LLM provider
4. **Returns structured JSON** with `summary`, `keyPoints`, and `topics`

Useful for research assistants, content digests, monitoring pipelines, or any workflow that needs quick page understanding without manual reading.

## How it works

```
Client  →  POST /scrape { url, provider }
              ↓
         validateUrl()
              ↓
         scrape() — Playwright loads page, extracts title + body text
              ↓
         summarize() — sends text to OpenAI, Gemini, or local Ollama
              ↓
         JSON response { url, summary, keyPoints, topics }
```

Page text is capped at **30,000 characters** before being sent to the model. The AI is instructed to return strict JSON with three fields: a 2–4 sentence overview, 3–6 key points, and a list of topic tags.

## Tech stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| Runtime | [Node.js](https://nodejs.org/) 18+ | Server runtime |
| Language | [TypeScript](https://www.typescriptlang.org/) | Type-safe application code |
| Framework | [Express](https://expressjs.com/) 5 | HTTP API and routing |
| Scraping | [Playwright](https://playwright.dev/) | Headless browser page load and DOM text extraction |
| AI — OpenAI | [openai](https://github.com/openai/openai-node) SDK | `gpt-4o-mini` summarization |
| AI — Gemini | [@google/genai](https://www.npmjs.com/package/@google/genai) | `gemini-2.0-flash` summarization |
| AI — Local | [Ollama](https://ollama.com/) (OpenAI-compatible API) | `llama3.2` via `http://localhost:11434` |
| Logging | [Pino](https://getpino.io/) + [pino-http](https://github.com/pinojs/pino-http) | Structured request and error logs |
| Config | [dotenv](https://github.com/motdotla/dotenv) | Environment variable loading |
| Dev tooling | [tsx](https://github.com/privatenumber/tsx) | Hot-reload during development |

## Project structure

```
src/
├── index.ts                  # Express app, routes, error handling
├── errors.ts                 # AppError and QuotaExceededError types
└── utils/
    ├── scrape.ts             # Playwright page fetch and text extraction
    ├── summarize.ts          # Provider routing (openai / gemini / local)
    ├── summarize-openai.ts   # OpenAI gpt-4o-mini integration
    ├── summarize-gemini.ts   # Google Gemini integration
    ├── summarize-local.ts    # Ollama local model integration
    ├── summarize-shared.ts   # Shared prompt, types, and JSON parsing
    ├── validateUrl.ts        # URL normalization and validation
    └── tls.ts                # TLS / certificate configuration
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm
- An API key for your chosen cloud provider (`openai` or `gemini`), **or** a running [Ollama](https://ollama.com/) instance for `local`

## Setup

1. **Clone the repository and install dependencies**

   ```bash
   npm install
   ```

2. **Install Playwright browsers**

   Playwright is used to load and extract page content. Install Chromium:

   ```bash
   npx playwright install chromium
   ```

3. **Configure environment variables**

   Copy the example env file and fill in your API keys:

   ```bash
   cp .env.example .env
   ```

   | Variable | Required | Description |
   | --- | --- | --- |
   | `API_KEY` | For `gemini` provider | Google Gemini API key |
   | `OPENAI_API_KEY` | For `openai` provider | OpenAI API key (falls back to `API_KEY` if unset) |
   | `API_PORT` | No | Server port (default: `3000`) |
   | `LOG_LEVEL` | No | Pino log level (default: `info`) |
   | `NODE_EXTRA_CA_CERTS` | No | Path to a custom CA bundle for TLS issues |
   | `TLS_INSECURE_SKIP_VERIFY` | No | Set to `true` to skip TLS verification (dev only) |

   Example `.env`:

   ```env
   API_KEY=your-gemini-api-key
   OPENAI_API_KEY=your-openai-api-key
   API_PORT=3000
   LOG_LEVEL=info
   ```

4. **(Optional) Set up Ollama for local summarization**

   If using `provider: "local"`, install and run [Ollama](https://ollama.com/), then pull the model:

   ```bash
   ollama pull llama3.2
   ollama serve
   ```

## Running

**Development** (with hot reload):

```bash
npm run dev
```

**Production**:

```bash
npm run build
npm start
```

The server starts on `http://localhost:3000` (or the port set in `API_PORT`).

## API

### `GET /`

Health check. Returns `Hello World`.

### `POST /scrape`

Scrapes a URL and returns a structured summary.

**Request body:**

```json
{
  "url": "https://example.com",
  "provider": "openai"
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `url` | string | Yes | Page to scrape (`http`/`https`; `https://` is added if missing) |
| `provider` | string | No | `openai`, `gemini`, or `local` (default: `openai`) |

**Example request:**

```bash
curl -X POST http://localhost:3000/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "provider": "openai"}'
```

**Example response:**

```json
{
  "url": "https://example.com",
  "summary": "A brief overview of the page content.",
  "keyPoints": [
    "First key point",
    "Second key point"
  ],
  "topics": ["topic-one", "topic-two"]
}
```

**Error responses** return `{ "error": "...", "code": "..." }` with an appropriate HTTP status:

| Code | Status | Meaning |
| --- | --- | --- |
| `MISSING_API_KEY` | 503 | API key not configured for the chosen provider |
| `QUOTA_EXCEEDED` | 429 | Provider rate limit or quota hit |
| `SCRAPE_TIMEOUT` | 504 | Page took longer than 30s to load |
| `SCRAPE_FAILED` | 502 | Browser or page load error |
| `SUMMARIZE_FAILED` | 502 | LLM request failed |
| `INVALID_SUMMARY_RESPONSE` | 502 | Model returned malformed JSON |

## Summary providers

| Provider | Env vars | Model | Notes |
| --- | --- | --- | --- |
| `openai` | `OPENAI_API_KEY` or `API_KEY` | `gpt-4o-mini` | Default provider; JSON-mode response |
| `gemini` | `API_KEY` | `gemini-2.0-flash` | Uses Google GenAI SDK with JSON MIME type |
| `local` | — | `llama3.2` | Requires Ollama at `http://localhost:11434` |

## Troubleshooting

- **Playwright browser missing** — Run `npx playwright install chromium`.
- **TLS / certificate errors** — Set `NODE_EXTRA_CA_CERTS` to your CA bundle, or for local dev only, `TLS_INSECURE_SKIP_VERIFY=true`.
- **503 `MISSING_API_KEY`** — Set the API key for your chosen provider in `.env` and restart the server.
- **Local provider connection refused** — Ensure Ollama is running (`ollama serve`) and `llama3.2` is pulled.
- **429 `QUOTA_EXCEEDED`** — Wait and retry, or switch to a different provider.
