# Sur Accountant

Telegram bot for a small business accounting. Extracts transactions from receipt photos and text messages using AI, saves to Google Sheets on emoji confirmation.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

| Variable | Description |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `GPT_API_KEY` | OpenAI API key |
| `GPT_MODEL_PARSE` | Model for transaction parsing (default: `gpt-5.2`) |
| `GPT_MODEL_NOISE` | Model for noise detection (default: `gpt-5.2`) |
| `PATH_TO_GOOGLE_KEYFILE` | Path to Google service account JSON |
| `GOOGLE_SHEET_ID` | Target spreadsheet ID |
| `LOG_LEVEL` | `debug` / `info` / `warn` / `error` (default: `info`) |

Google service account credentials go into `credentials/`.

## Debug Mode

Set `LOG_LEVEL=debug` in your `.env` file to enable verbose logging (noise detection results, reaction lookups, sheet writes, etc.):

```bash
LOG_LEVEL=debug npm run dev
```

## Deploy

Docker + GitHub Actions to EC2. Push to `main` triggers build and deploy.

```bash
docker compose up -d
```
