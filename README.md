# AI Web Scraper

An Express API that scrapes a web page with Playwright and returns an AI-generated summary. Supports Google Gemini and OpenAI for summarization.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm

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

## Summary providers

| Provider | Env vars | Notes |
| --- | --- | --- |
| `openai` | `OPENAI_API_KEY` or `API_KEY` | Uses `gpt-4o-mini` |
| `gemini` | `API_KEY` | Uses `gemini-2.0-flash` |
| `local` | — | Not implemented yet |

## Troubleshooting

- **Playwright browser missing** — Run `npx playwright install chromium`.
- **TLS / certificate errors** — Set `NODE_EXTRA_CA_CERTS` to your CA bundle, or for local dev only, `TLS_INSECURE_SKIP_VERIFY=true`.
- **503 `MISSING_API_KEY`** — Set the API key for your chosen provider in `.env` and restart the server.
