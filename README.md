# Sur Accountant

Telegram bot for accounting, shift scheduling, and calendar event detection. Parses messages with AI, saves to Google Sheets and Google Calendar on emoji confirmation.

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

### Environment variables

| Variable | Description |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `GPT_API_KEY` | OpenAI API key |
| `GPT_MODEL_PARSE` | Model for parsing (default: `gpt-5.2`) |
| `GPT_MODEL_NOISE` | Model for noise detection (default: `gpt-5.2`) |
| `PATH_TO_GOOGLE_KEYFILE` | Path to Google service account JSON keyfile |
| `GOOGLE_SHEET_ID` | Target spreadsheet ID |
| `SHEET_TABLE_INCOME` | Income sheet range (default: `Каса!A1:C`) |
| `SHEET_TABLE_EXPENSE` | Expense sheet range (default: `Витрати!A1:C`) |
| `ALLOWED_TOPIC_IDS` | Comma-separated topic IDs for accounting (empty = all) |
| `SHIFT_TOPIC_ID` | Telegram topic ID for shift scheduling |
| `SHEET_TABLE_SHIFTS` | Shifts sheet range (default: `Зміни!A1:B`) |
| `CALENDAR_TOPIC_ID` | Telegram topic ID for calendar event detection |
| `GOOGLE_CALENDAR_ID` | Google Calendar ID (e.g. `xxx@group.calendar.google.com`) |
| `LOG_LEVEL` | `debug` / `info` / `warn` / `error` (default: `info`) |

### Google service account

1. Create a service account in [Google Cloud Console](https://console.cloud.google.com) and download the JSON keyfile
2. Enable **Google Sheets API** and **Google Calendar API** in your project
3. Share your Google Sheet with the service account email (Editor)
4. Share your Google Calendar with the service account email (Make changes to events)

## Running

```bash
# Development — auto-restart + debug logging
npm run dev

# Production
npm start
```

## Features

- **Accounting** — parses income/expense messages, previews via bot reply, writes to Google Sheets on 👍/❤️
- **Shifts** — parses shift schedules, writes to Google Sheets on 👍/❤️
- **Calendar** — detects event mentions, sends a preview per event, creates all-day Google Calendar events on 👍/❤️

All features use 👎/💩 to reject and clean up the bot reply.

## Deploy

Docker + GitHub Actions to EC2. Push to `main` triggers build and deploy.

```bash
docker compose up -d
```
